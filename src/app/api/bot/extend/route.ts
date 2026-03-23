import { NextRequest, NextResponse } from "next/server";
import { botExtendSubscription, getUserByTelegramId, creditReferrerOnPayment } from "@/lib/store";
import { xrayAddUser } from "@/lib/xray";
import { verifyBotApiKey, unauthorizedResponse } from "../auth";

// POST /api/bot/extend — bot extends subscription after payment
export async function POST(request: NextRequest) {
  if (!verifyBotApiKey(request)) return unauthorizedResponse();

  try {
    const { telegramId, days, plan } = await request.json();

    if (!telegramId || !days) {
      return NextResponse.json(
        { success: false, error: "telegramId and days required" },
        { status: 400 }
      );
    }

    const beforeUser = await getUserByTelegramId(String(telegramId));
    const hadKey = !!beforeUser?.xrayUuid;

    const user = await botExtendSubscription(String(telegramId), days, plan);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found. Link Telegram first." },
        { status: 404 }
      );
    }

    // If key was regenerated (user had no key before), add to Xray
    if (!hadKey && user.xrayUuid) {
      xrayAddUser(user.xrayUuid).catch(() => {
        console.error(`[BOT] Failed to add user to Xray: ${user.email}`);
      });
    }

    // Credit referrer
    await creditReferrerOnPayment(user.id);

    const now = new Date();
    const end = new Date(user.subscriptionEnd);
    const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    console.log(`[BOT] Extended subscription for ${user.email}: +${days} days (plan: ${plan || "n/a"})`);

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        daysLeft,
        subscriptionEnd: user.subscriptionEnd,
        vpnKey: user.vpnKey,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
