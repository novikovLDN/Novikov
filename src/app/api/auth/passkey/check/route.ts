import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/store";
import { userHasPasskey } from "@/lib/passkey";

// GET — check if current user has a passkey registered
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;
    if (!sessionId) return NextResponse.json({ success: false }, { status: 401 });

    const user = await getUserById(sessionId);
    if (!user) return NextResponse.json({ success: false }, { status: 404 });

    const hasPasskey = await userHasPasskey(user.id);
    return NextResponse.json({ success: true, data: { hasPasskey } });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
