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
      from: "Atlas Secure <noreply@qodev.dev>",
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

// ─── Generic transactional sender (plain HTML body) ───────────────

async function sendTransactional(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV email → ${to}] ${subject}`);
    return true;
  }
  try {
    const { error } = await getResend().emails.send({
      from: "Atlas Secure <noreply@qodev.dev>",
      to,
      subject,
      html,
    });
    if (error) {
      console.error("[EMAIL] Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[EMAIL] Failed to send:", err);
    return false;
  }
}

function wrapHtml(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#111">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
<table width="100%" style="max-width:560px;">
<tr><td style="padding-bottom:24px;text-align:center;"><span style="font-size:18px;font-weight:700">Atlas Secure</span></td></tr>
<tr><td style="font-size:18px;font-weight:600;padding-bottom:16px">${title}</td></tr>
<tr><td style="font-size:14px;line-height:1.6;color:#333;padding-bottom:24px">${bodyHtml}</td></tr>
<tr><td style="border-top:1px solid #eee;padding-top:16px;color:#aaa;font-size:12px;text-align:center">Atlas Secure</td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendTrialActivatedEmail(email: string, dashboardUrl: string): Promise<boolean> {
  return sendTransactional(
    email,
    "Пробный период активирован",
    wrapHtml(
      "Пробный период на 24 часа активирован",
      `<p>Ваш доступ к Atlas Secure открыт. В личном кабинете отсканируйте QR-код или нажмите кнопку «Открыть в Happ» / «Открыть в V2RayTun».</p>
       <p style="margin-top:16px"><a href="${dashboardUrl}" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Открыть личный кабинет</a></p>
       <p style="margin-top:16px;color:#666">Если кнопки не работают — скопируйте ссылку подписки на странице и добавьте её в приложении вручную.</p>`
    )
  );
}

export async function sendPaymentSucceededEmail(
  email: string,
  planTitle: string,
  expiresAt: Date,
  dashboardUrl: string
): Promise<boolean> {
  const dateLabel = expiresAt.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  return sendTransactional(
    email,
    "Подписка активирована",
    wrapHtml(
      "Спасибо за покупку",
      `<p>Подписка <b>${planTitle}</b> активирована до <b>${dateLabel}</b>.</p>
       <p style="margin-top:16px"><a href="${dashboardUrl}" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Открыть личный кабинет</a></p>`
    )
  );
}

export async function sendRefundAdminAlertEmail(params: {
  adminEmail: string;
  orderId: string;
  userEmail: string;
  remnawaveUuid: string | null;
  amountRub: number;
  plan: string;
  yookassaPaymentId: string;
  appliedAt: Date | null;
}): Promise<boolean> {
  const appliedLabel = params.appliedAt ? params.appliedAt.toISOString() : "—";
  return sendTransactional(
    params.adminEmail,
    "[Atlas Secure] Refund получен — требуется решение",
    wrapHtml(
      "Refund получен",
      `<table cellpadding="6" style="font-size:13px"><tbody>
<tr><td><b>Order ID</b></td><td>${params.orderId}</td></tr>
<tr><td><b>User</b></td><td>${params.userEmail}</td></tr>
<tr><td><b>Remnawave UUID</b></td><td>${params.remnawaveUuid || "—"}</td></tr>
<tr><td><b>Amount</b></td><td>${params.amountRub.toFixed(2)} ₽</td></tr>
<tr><td><b>Plan</b></td><td>${params.plan}</td></tr>
<tr><td><b>Applied to Remnawave at</b></td><td>${appliedLabel}</td></tr>
<tr><td><b>YooKassa Payment ID</b></td><td>${params.yookassaPaymentId}</td></tr>
</tbody></table>
<p style="margin-top:16px;color:#444">Подписка <b>не отозвана автоматически</b>. Решите вручную через панель Remnawave: оставить, сократить expireAt пропорционально или удалить пользователя.</p>`
    )
  );
}
