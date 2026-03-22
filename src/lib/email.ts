import nodemailer from "nodemailer";

// Gmail SMTP transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Gmail App Password (not regular password)
  },
});

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<boolean> {
  // Dev mode: log code to console when SMTP not configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[DEV] Verification code for ${email}: ${code}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"Atlas Secure" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `${code} — код подтверждения Atlas Secure`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:420px;background-color:#161616;border-radius:16px;border:1px solid #262626;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:28px 28px 0;text-align:center;">
              <div style="display:inline-block;background:#ededed;width:44px;height:44px;border-radius:12px;line-height:44px;text-align:center;font-size:20px;margin-bottom:12px;">
                &#9670;
              </div>
              <h1 style="color:#ededed;font-size:20px;font-weight:700;margin:8px 0 0;">Atlas Secure</h1>
            </td>
          </tr>
          <!-- Code -->
          <tr>
            <td style="padding:28px;">
              <p style="color:#a1a1aa;font-size:14px;margin:0 0 20px;text-align:center;">
                Ваш код для входа:
              </p>
              <div style="background:#0a0a0a;border:1px solid #262626;border-radius:12px;padding:20px;text-align:center;margin:0 0 20px;">
                <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#ededed;font-family:'SF Mono','Fira Code',monospace;">
                  ${code}
                </span>
              </div>
              <p style="color:#71717a;font-size:13px;margin:0;text-align:center;line-height:1.5;">
                Код действителен <b style="color:#a1a1aa;">10 минут</b>.<br>
                Если вы не запрашивали код — просто проигнорируйте это письмо.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:0 28px 24px;text-align:center;border-top:1px solid #262626;padding-top:20px;">
              <p style="color:#52525b;font-size:11px;margin:0;">
                Atlas Secure VPN Service
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });
    return true;
  } catch (error) {
    console.error("[EMAIL] Failed to send:", error);
    return false;
  }
}
