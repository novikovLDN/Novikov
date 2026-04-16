import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { pool } from "@/lib/db";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

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

    // Find admin user by ADMIN_EMAIL and send notification to their user_id
    const adminResult = await pool.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [ADMIN_EMAIL]
    );
    const adminUserId = adminResult.rows[0]?.id;

    if (adminUserId) {
      const notifId = uuidv4();
      const title = "New request: " + interest.toUpperCase();
      const notifMsg = [
        `Name: ${name}`,
        `Email: ${email}`,
        `Interest: ${interest}`,
        message ? `Message: ${message.slice(0, 200)}` : null,
      ].filter(Boolean).join("\n");

      await pool.query(
        `INSERT INTO notifications (id, title, message, target) VALUES ($1, $2, $3, $4)`,
        [notifId, title, notifMsg, adminUserId]
      );
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("Contact request error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
