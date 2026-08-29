import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/store";
import { syncSubscriptionToPanel } from "@/lib/subscription-sync";

/**
 * POST /api/user/force-resync
 *
 * User-triggered escape hatch. Fires the same repair + panel-sync
 * pipeline the hourly worker runs, but on demand from the dashboard.
 * Handy when the auto-repair on GET /api/user/subscription didn't
 * land (e.g. because the previous deploy hadn't shipped yet, or the
 * repair itself hit a transient DB error).
 *
 * Returns the new subscription_end + a short human-readable summary
 * of what happened, so the button can tell the user "исправлено, срок
 * теперь 24 сентября 2026" instead of a silent success.
 */
export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const before = await getUserById(sessionId);
    if (!before) {
      return NextResponse.json(
        { success: false, error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const beforeEnd = before.subscriptionEnd;

    const result = await syncSubscriptionToPanel(before.id);

    const after = await getUserById(before.id);
    const afterEnd = after?.subscriptionEnd ?? beforeEnd;

    return NextResponse.json({
      success: true,
      data: {
        beforeSubscriptionEnd: beforeEnd,
        afterSubscriptionEnd: afterEnd,
        changed: new Date(beforeEnd).getTime() !== new Date(afterEnd).getTime(),
        panelAction: result.action,
        panelUuid: result.uuid,
        subscriptionUrl: result.subscriptionUrl,
        reason: result.reason,
        panelError: result.panelError,
      },
    });
  } catch (err) {
    console.error("[USER/FORCE-RESYNC] error:", err);
    return NextResponse.json(
      { success: false, error: "Не удалось обновить подписку" },
      { status: 500 }
    );
  }
}
