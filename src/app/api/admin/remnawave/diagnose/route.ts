import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyAdmin } from "../../middleware";

const API_URL = (process.env.REMNAWAVE_API_URL || "https://rmnw.atlassecure.ru").replace(/\/+$/, "");
const API_TOKEN = process.env.REMNAWAVE_API_TOKEN || "";

/**
 * Diagnostic: probe Remnawave with raw GET requests and report the
 * exact status + body the panel returns. Lets us see WHY parseUser
 * isn't extracting subscriptionUrl for a given user.
 *
 * Query params:
 *   ?email=foo@bar.com    — find local user by email, probe their
 *                           remnawave_user_uuid + panel_id
 *   ?uuid=<rw-uuid>       — probe arbitrary panel UUID
 *   ?username=<panel-id>  — probe arbitrary username
 *   (no params)           — probe panel reachability via GET /api/users
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }

  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  const uuidParam = url.searchParams.get("uuid");
  const usernameParam = url.searchParams.get("username");

  type Probe = { path: string; status: number | null; body: unknown; error?: string };
  const probes: Probe[] = [];

  async function probe(path: string) {
    const fullUrl = `${API_URL}${path}`;
    try {
      const res = await fetch(fullUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      const text = await res.text();
      let body: unknown = text;
      try { body = JSON.parse(text); } catch { /* keep as text */ }
      probes.push({ path, status: res.status, body });
    } catch (err) {
      probes.push({ path, status: null, body: null, error: (err as Error).message });
    }
  }

  let localUser: { id: string; email: string; panel_id: string | null; remnawave_user_uuid: string | null; subscription_url: string | null } | null = null;
  let uuid = uuidParam;
  let username = usernameParam;

  if (email) {
    const r = await pool.query<{ id: string; email: string; panel_id: string | null; remnawave_user_uuid: string | null; subscription_url: string | null }>(
      "SELECT id, email, panel_id, remnawave_user_uuid, subscription_url FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    localUser = r.rows[0] || null;
    if (localUser) {
      uuid = uuid || localUser.remnawave_user_uuid;
      username = username || localUser.panel_id;
    }
  }

  if (uuid) await probe(`/api/users/${encodeURIComponent(uuid)}`);
  if (username) {
    await probe(`/api/users/by-username/${encodeURIComponent(username)}`);
    await probe(`/api/users/username/${encodeURIComponent(username)}`);
    await probe(`/api/users?username=${encodeURIComponent(username)}`);
    await probe(`/api/users?search=${encodeURIComponent(username)}`);
  }
  if (email) {
    await probe(`/api/users/by-email/${encodeURIComponent(email)}`);
    await probe(`/api/users?email=${encodeURIComponent(email)}`);
  }
  if (!uuid && !username && !email) await probe("/api/users?limit=1");

  return NextResponse.json({
    success: true,
    data: {
      apiUrl: API_URL,
      tokenSet: Boolean(API_TOKEN),
      tokenLen: API_TOKEN.length,
      localUser,
      probes,
    },
  });
}
