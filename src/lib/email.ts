import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || "");
}

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Verification code for ${email}: ${code}`);
    return true;
  }

  try {
    const { error } = await getResend().emails.send({
      from: "Atlas Secure <onboarding@resend.dev>",
      to: email,
      subject: `Ваш код: ${code}`,
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
              Atlas Secure
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

    if (error) {
      console.error("[EMAIL] Resend error:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[EMAIL] Failed to send:", error);
    return false;
  }
}
