import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { userHasPasskey } from "@/lib/passkey";

// GET — check if current user has a passkey registered
export async function GET(request: NextRequest) {
  try {
    const auth = await getSessionUser(request);
    if (!auth) return NextResponse.json({ success: false }, { status: 401 });

    const hasPasskey = await userHasPasskey(auth.user.id);
    return NextResponse.json({ success: true, data: { hasPasskey } });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
