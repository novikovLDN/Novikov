import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<boolean> {
  // In development without SMTP config, just log the code
  if (!process.env.SMTP_USER) {
    console.log(`[DEV] Verification code for ${email}: ${code}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Atlas Secure — Код подтверждения",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Atlas Secure</h2>
          <p>Ваш код подтверждения:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #888; font-size: 14px;">Код действителен 10 минут.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
