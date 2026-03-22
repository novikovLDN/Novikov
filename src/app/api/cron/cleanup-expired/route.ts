import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredUsers } from "@/lib/store";

const CRON_SECRET = process.env.CRON_SECRET || "";

export async function POST(request: NextRequest) {
  // Protect endpoint with secret (for external cron services like Vercel Cron)
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  try {
    const result = await cleanupExpiredUsers();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Cleanup failed" },
      { status: 500 }
    );
  }
}
