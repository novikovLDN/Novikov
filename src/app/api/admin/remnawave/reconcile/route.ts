import { NextResponse } from "next/server";
import { verifyAdmin } from "../../middleware";
import { runReconciliation } from "@/lib/reconciliation";

/**
 * Verify-and-fix pass over every user that should have a working
 * Remnawave profile. Reports per-user issues and what was repaired.
 *
 * Non-destructive: only create or PATCH on the panel side; never
 * deletes. See src/lib/reconciliation.ts for details.
 */
export async function POST() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }
  const data = await runReconciliation();
  return NextResponse.json({ success: true, data });
}
