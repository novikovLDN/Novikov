import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyAdmin } from "../../middleware";
import { findUsersByEmail, getRemnawaveConfig, getSystemHealth, getUserById, getUserByUsername, RwResult } from "@/lib/remnawave";

/**
 * Diagnostic: what does the panel say about a user?
 *
 *   ?email=foo@bar.com — local user by email; probes their panel id,
 *                        ST username and the panel's email stream
 *   ?id=<panel id>     — probe one panel id
 *   ?username=<name>   — probe one panel username
 *   (no params)        — panel reachability (GET /api/system/health)
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");
    const idParam = url.searchParams.get("id") || url.searchParams.get("uuid");
    const usernameParam = url.searchParams.get("username");

    type Probe = { path: string; status: number | null; body: unknown; error?: string };
    const probes: Probe[] = [];
    const push = (path: string, r: RwResult<unknown>) =>
      probes.push(r.ok ? { path, status: r.status, body: r.data } : { path, status: r.status, body: { kind: r.kind, errorCode: r.errorCode }, error: r.message });

    let localUser: { id: string; email: string; public_id: string | null; panel_user_id: string | null; subscription_url: string | null; panel_sync_state: string | null; panel_sync_error: string | null } | null = null;
    let id = idParam && /^\d+$/.test(idParam) ? Number(idParam) : null;
    let username = usernameParam;

    if (email) {
      const r = await pool.query(
        "SELECT id, email, public_id, panel_user_id::text AS panel_user_id, subscription_url, panel_sync_state, panel_sync_error FROM users WHERE email = $1",
        [email.toLowerCase()]
      );
      localUser = r.rows[0] || null;
      if (localUser) {
        id = id ?? (localUser.panel_user_id ? Number(localUser.panel_user_id) : null);
        username = username || localUser.public_id;
      }
    }

    if (id) push(`/api/users/${id}`, await getUserById(id));
    if (username) push(`/api/users/by-username/${username}`, await getUserByUsername(username));
    if (email) push(`/api/users/stream?email=${email}`, await findUsersByEmail(email));
    if (!id && !username && !email) push("/api/system/health", await getSystemHealth());

    const cfg = getRemnawaveConfig();
    return NextResponse.json({
      success: true,
      data: {
        apiUrl: cfg.apiUrl,
        tokenSet: Boolean(cfg.token),
        forwardedHeaders: cfg.forwardedHeaders,
        mainSquads: cfg.mainSquadUuids,
        perPlanSquads: cfg.planSquads,
        localUser,
        probes,
      },
    });
  } catch (err) {
    console.error("[ADMIN/DIAGNOSE] error:", err);
    return NextResponse.json({ success: false, error: "Внутренняя ошибка" }, { status: 500 });
  }
}
