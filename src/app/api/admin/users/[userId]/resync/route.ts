import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyAdmin } from "../../../middleware";
import { syncSubscriptionToPanel } from "@/lib/subscription-sync";
import { getUserById } from "@/lib/store";

const API_URL = (process.env.REMNAWAVE_API_URL || "https://rmnw.atlassecure.ru").replace(/\/+$/, "");
const API_TOKEN = process.env.REMNAWAVE_API_TOKEN || "";

interface Probe {
  path: string;
  status: number | null;
  ok: boolean;
  body: unknown;
  error?: string;
}

async function probe(path: string, probes: Probe[]) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    let body: unknown = text;
    try { body = JSON.parse(text); } catch { /* keep as text */ }
    probes.push({ path, status: res.status, ok: res.ok, body });
  } catch (err) {
    probes.push({ path, status: null, ok: false, body: null, error: (err as Error).message });
  }
}

/**
 * Force-resync ONE user and report what the panel really says.
 *
 * For "ST*** is in the local profile but I can't find it in the
 * Remnawave UI" complaints. Runs syncSubscriptionToPanel first, then
 * probes the panel by uuid (post-sync) and by username (public_id) so
 * you can see the actual HTTP response — including 200 with empty
 * list, 404 with NestJS "no such route", or anything else.
 *
 * Non-destructive: same idempotent sync the worker uses; never deletes.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }

  const { userId } = await params;
  const beforeUser = await getUserById(userId);
  if (!beforeUser) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  const syncResult = await syncSubscriptionToPanel(userId);
  const after = await pool.query<{
    public_id: string | null;
    remnawave_user_uuid: string | null;
    subscription_url: string | null;
    subscription_end: Date;
  }>(
    "SELECT public_id, remnawave_user_uuid, subscription_url, subscription_end FROM users WHERE id = $1",
    [userId]
  );
  const afterRow = after.rows[0];

  const probes: Probe[] = [];
  if (afterRow?.remnawave_user_uuid) {
    await probe(`/api/users/${encodeURIComponent(afterRow.remnawave_user_uuid)}`, probes);
  }
  if (afterRow?.public_id) {
    await probe(`/api/users/by-username/${encodeURIComponent(afterRow.public_id)}`, probes);
    await probe(`/api/users/username/${encodeURIComponent(afterRow.public_id)}`, probes);
    await probe(`/api/users?username=${encodeURIComponent(afterRow.public_id)}`, probes);
  }

  return NextResponse.json({
    success: true,
    data: {
      before: {
        publicId: beforeUser.publicId,
        remnawaveUserUuid: beforeUser.remnawaveUserUuid,
        subscriptionUrl: beforeUser.subscriptionUrl,
        subscriptionEnd: beforeUser.subscriptionEnd,
        email: beforeUser.email,
      },
      after: {
        publicId: afterRow?.public_id || null,
        remnawaveUserUuid: afterRow?.remnawave_user_uuid || null,
        subscriptionUrl: afterRow?.subscription_url || null,
        subscriptionEnd: afterRow ? new Date(afterRow.subscription_end).toISOString() : null,
      },
      sync: syncResult,
      probes,
    },
  });
}
