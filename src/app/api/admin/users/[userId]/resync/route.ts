import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyAdmin } from "../../../middleware";
import { syncUserToPanel } from "@/lib/subscription-sync";
import { getUserById } from "@/lib/store";
import { getUserById as rwGetUserById, getUserByUsername, RwResult } from "@/lib/remnawave";

interface Probe {
  path: string;
  status: number | null;
  ok: boolean;
  body: unknown;
  error?: string;
}

function toProbe(path: string, r: RwResult<unknown>): Probe {
  return r.ok
    ? { path, status: r.status, ok: true, body: r.data }
    : { path, status: r.status, ok: false, body: { kind: r.kind, errorCode: r.errorCode, message: r.message }, error: r.message };
}

/**
 * Force-resync ONE user and show what the panel really holds (by the
 * stored id and by the ST username). Non-destructive: the same sync the
 * worker runs.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }

  try {
    const { userId } = await params;
    const beforeUser = await getUserById(userId);
    if (!beforeUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const syncResult = await syncUserToPanel(userId);
    const after = await pool.query<{
      public_id: string | null;
      panel_user_id: string | null;
      subscription_url: string | null;
      subscription_end: Date;
      panel_sync_state: string | null;
      panel_sync_error: string | null;
    }>(
      "SELECT public_id, panel_user_id::text AS panel_user_id, subscription_url, subscription_end, panel_sync_state, panel_sync_error FROM users WHERE id = $1",
      [userId]
    );
    const afterRow = after.rows[0];

    const probes: Probe[] = [];
    if (afterRow?.panel_user_id) {
      probes.push(toProbe(`/api/users/${afterRow.panel_user_id}`, await rwGetUserById(Number(afterRow.panel_user_id))));
    }
    if (afterRow?.public_id) {
      probes.push(toProbe(`/api/users/by-username/${afterRow.public_id}`, await getUserByUsername(afterRow.public_id)));
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
          remnawaveUserUuid: afterRow?.panel_user_id || null,
          subscriptionUrl: afterRow?.subscription_url || null,
          subscriptionEnd: afterRow ? new Date(afterRow.subscription_end).toISOString() : null,
          panelSyncState: afterRow?.panel_sync_state ?? null,
          panelSyncError: afterRow?.panel_sync_error ?? null,
        },
        sync: syncResult,
        probes,
      },
    });
  } catch (err) {
    console.error("[ADMIN/RESYNC] error:", err);
    return NextResponse.json({ success: false, error: "Внутренняя ошибка" }, { status: 500 });
  }
}
