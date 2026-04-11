import { NextRequest, NextResponse } from "next/server";
import { getUserByTelegramId, updateUser, createAuditLog } from "@/lib/store";
import { verifyBotApiKey, unauthorizedResponse } from "../auth";

/**
 * POST /api/bot/sync-balance
 *
 * Syncs balance from bot to site.
 * Bot is the authoritative source for balance.
 *
 * Body: {
 *   telegramId: string,
 *   balance: number,        // kopecks (INTEGER)
 * }
 *
 * GET /api/bot/sync-balance?telegram_id=XXX
 *
 * Returns current site balance for the user.
 */
export async function POST(request: NextRequest) {
  if (!verifyBotApiKey(request)) return unauthorizedResponse();

  try {
    const { telegramId, balance } = await request.json();

    if (!telegramId || typeof balance !== "number") {
      return NextResponse.json(
        { success: false, error: "telegramId and balance (kopecks) required" },
        { status: 400 }
      );
    }

    const user = await getUserByTelegramId(String(telegramId));
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const oldBalance = user.balance;
    const newBalance = Math.max(0, Math.round(balance));

    if (oldBalance !== newBalance) {
      await updateUser(user.id, { balance: newBalance });
      await createAuditLog(
        "sync.balance",
        `Bot→Site: balance ${oldBalance}→${newBalance} (${(oldBalance / 100).toFixed(2)}₽→${(newBalance / 100).toFixed(2)}₽)`,
        user.id,
        user.email
      );
      console.log(`[SYNC] Balance for ${user.email}: ${oldBalance}→${newBalance} kopecks`);
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        balance: newBalance,
        balanceRubles: newBalance / 100,
        previousBalance: oldBalance,
        previousBalanceRubles: oldBalance / 100,
      },
    });
  } catch (err) {
    console.error("[SYNC] Balance error:", err);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!verifyBotApiKey(request)) return unauthorizedResponse();

  try {
    const telegramId = request.nextUrl.searchParams.get("telegram_id")
      || request.nextUrl.searchParams.get("telegramId");

    if (!telegramId) {
      return NextResponse.json(
        { success: false, error: "telegram_id required" },
        { status: 400 }
      );
    }

    const user = await getUserByTelegramId(telegramId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        balance: user.balance,
        balanceRubles: user.balance / 100,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
