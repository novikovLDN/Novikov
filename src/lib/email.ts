import nodemailer from "nodemailer";

// Yandex SMTP transport
const transporter = nodemailer.createTransport({
  host: "smtp.yandex.ru",
  port: 465,
  secure: true,
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
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[DEV] Verification code for ${email}: ${code}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"Atlas Secure" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Код подтверждения — Atlas Secure",
      text: `Ваш код подтверждения: ${code}\n\nКод действителен 10 минут.\nЕсли вы не запрашивали код, проигнорируйте это письмо.\n\nAtlas Secure`,
      html: `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;">
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <span style="font-size:18px;font-weight:bold;color:#111111;">Atlas Secure</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:16px;text-align:center;color:#333333;font-size:15px;">
              Ваш код подтверждения:
            </td>
          </tr>
          <tr>
            <td style="text-align:center;padding-bottom:24px;">
              <div style="display:inline-block;background-color:#f4f4f5;border-radius:8px;padding:16px 32px;">
                <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#111111;">${code}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="text-align:center;color:#888888;font-size:13px;line-height:1.5;padding-bottom:24px;">
              Код действителен 10 минут.<br>
              Если вы не запрашивали код, просто проигнорируйте это письмо.
            </td>
          </tr>
          <tr>
            <td style="text-align:center;border-top:1px solid #eeeeee;padding-top:16px;color:#aaaaaa;font-size:12px;">
              Atlas Secure VPN
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
