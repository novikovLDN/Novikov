import { NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/store";
import { verifyAdmin } from "../middleware";

export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }

  const logs = await getAuditLogs(200);
  return NextResponse.json({ success: true, data: logs });
}
