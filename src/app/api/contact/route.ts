import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, interest, message } = body;

    if (!name || !email || !interest) {
      return NextResponse.json(
        { success: false, error: "Name, email and interest are required" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    const id = uuidv4();
    await pool.query(
      `INSERT INTO contact_requests (id, name, email, interest, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, name.trim(), email.trim().toLowerCase(), interest, message?.trim() || null]
    );

    // Create admin notification
    const notifId = uuidv4();
    const title = "New contact request";
    const notifMsg = `${name} (${email}) — ${interest}${message ? `: ${message.slice(0, 100)}` : ""}`;
    await pool.query(
      `INSERT INTO notifications (id, title, message, target) VALUES ($1, $2, $3, 'admin')`,
      [notifId, title, notifMsg]
    );

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("Contact request error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
