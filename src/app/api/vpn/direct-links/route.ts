import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/store";
import { buildAllServerUris, SERVER_POOL } from "@/lib/xray";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;
    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
    }

    const user = await getUserById(sessionId);
    if (!user) {
      return NextResponse.json({ success: false, error: "Пользователь не найден" }, { status: 404 });
    }

    if (!user.xrayUuid) {
      return NextResponse.json({ success: false, error: "Нет активной подписки" }, { status: 403 });
    }

    const now = new Date();
    const end = new Date(user.subscriptionEnd);
    if (now >= end) {
      return NextResponse.json({ success: false, error: "Подписка истекла" }, { status: 403 });
    }

    // Build URI for the primary server (Atlas Fast #2)
    const primaryServer = SERVER_POOL.find((s) => s.name.includes("Atlas Fast #2")) || SERVER_POOL[1] || SERVER_POOL[0];
    const params = new URLSearchParams({
      type: primaryServer.network,
      security: primaryServer.security,
      flow: primaryServer.flow,
      fp: primaryServer.fingerprint,
      sni: primaryServer.sni,
      pbk: primaryServer.publicKey,
      sid: primaryServer.shortId,
    });
    const primaryUri = `vless://${user.xrayUuid}@${primaryServer.ip}:${primaryServer.port}?${params.toString()}#${encodeURIComponent(primaryServer.name)}`;

    // Also build all URIs for devices page
    const allUris = buildAllServerUris(user.xrayUuid);

    return NextResponse.json({
      success: true,
      data: { key: primaryUri, uris: allUris },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Ошибка сервера" }, { status: 500 });
  }
}
