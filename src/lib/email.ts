import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

const SENDER_NAME = "BarberZap";
const FROM_EMAIL = process.env.GMAIL_USER || "portexzao@gmail.com";

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
    try {
        const info = await transporter.sendMail({
            from: `"${SENDER_NAME}" <${FROM_EMAIL}>`,
            to,
            subject,
            html,
        });
        console.log(`[EMAIL] Enviado para ${to} — ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (err: any) {
        console.error("[EMAIL] Erro ao enviar:", err.message);
        return { success: false, error: err.message };
    }
}

// ─── Templates HTML ───────────────────────────────────────────

export function welcomeEmailHtml(userName: string, barbershopName: string, bookingUrl: string) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0b;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0b;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="https://barber-zap-three.vercel.app/assets/logo.png" alt="BarberZap" width="160" style="display:block;max-width:160px;" />
            </td>
          </tr>
          <tr>
            <td style="background-color:#18181b;border-radius:16px;border:1px solid #27272a;padding:40px 32px;text-align:center;">
              <h1 style="color:#f4f4f5;font-size:24px;margin:0 0 8px;">Bem-vindo ao BarberZap 🎉</h1>
              <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 24px;">
                Olá <strong style="color:#f4f4f5;">${userName}</strong>, sua barbearia <strong style="color:#d4a853;">${barbershopName}</strong> foi criada com sucesso!
              </p>
              <div style="background-color:#0a0a0b;border-radius:12px;border:1px solid #27272a;padding:20px;margin-bottom:24px;text-align:left;">
                <h3 style="color:#d4a853;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">✅ Próximos Passos</h3>
                <table cellpadding="0" cellspacing="0" style="color:#a1a1aa;font-size:13px;line-height:1.6;">
                  <tr><td style="padding:4px 0;">1. 🔗 Divulgue seu link de agendamento</td></tr>
                  <tr><td style="padding:4px 0;">2. ✂️ Configure seus serviços e horários</td></tr>
                  <tr><td style="padding:4px 0;">3. 💳 Ative o plano Pro para liberar lembretes no WhatsApp</td></tr>
                </table>
              </div>
              <a href="${bookingUrl}" target="_blank" style="display:inline-block;background-color:#d4a853;color:#0a0a0b;font-size:14px;font-weight:bold;padding:14px 32px;border-radius:12px;text-decoration:none;margin-bottom:24px;">
                🔗 Acessar Meu Painel
              </a>
              <p style="color:#52525b;font-size:12px;line-height:1.5;margin:0;">
                Precisa de ajuda? Responda a este e-mail ou chame no WhatsApp<br/>
                <a href="https://wa.me/556699762785" target="_blank" style="color:#d4a853;text-decoration:none;">(66) 99762-2785</a>
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="color:#52525b;font-size:11px;margin:0;">
                BarberZap — Agendamentos inteligentes para barbearias<br/>
                © ${new Date().getFullYear()} BarberZap. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function subscriptionActivatedHtml(userName: string, barbershopName: string) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0b;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0b;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="https://barber-zap-three.vercel.app/assets/logo.png" alt="BarberZap" width="160" style="display:block;max-width:160px;" />
            </td>
          </tr>
          <tr>
            <td style="background-color:#18181b;border-radius:16px;border:1px solid #27272a;padding:40px 32px;text-align:center;">
              <div style="font-size:48px;margin-bottom:16px;">🌟</div>
              <h1 style="color:#f4f4f5;font-size:24px;margin:0 0 8px;">Assinatura Pro Ativada! 🚀</h1>
              <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 24px;">
                Parabéns <strong style="color:#f4f4f5;">${userName}</strong>!<br/>
                Sua barbearia <strong style="color:#d4a853;">${barbershopName}</strong> agora tem acesso completo a todos os recursos do BarberZap.
              </p>
              <div style="background-color:#0a0a0b;border-radius:12px;border:1px solid #27272a;padding:20px;margin-bottom:24px;text-align:left;">
                <h3 style="color:#d4a853;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">✨ Recursos Liberados</h3>
                <table cellpadding="0" cellspacing="0" style="color:#a1a1aa;font-size:13px;line-height:1.8;">
                  <tr><td>✅ Lembretes automáticos via WhatsApp</td></tr>
                  <tr><td>✅ Agendamentos ilimitados</td></tr>
                  <tr><td>✅ Cartão Fidelidade digital</td></tr>
                  <tr><td>✅ CRM de clientes completo</td></tr>
                  <tr><td>✅ Suporte prioritário</td></tr>
                </table>
              </div>
              <p style="color:#52525b;font-size:12px;line-height:1.5;margin:0;">
                Qualquer dúvida, fale conosco pelo WhatsApp<br/>
                <a href="https://wa.me/556699762785" target="_blank" style="color:#d4a853;text-decoration:none;">(66) 99762-2785</a>
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="color:#52525b;font-size:11px;margin:0;">
                BarberZap — Agendamentos inteligentes para barbearias<br/>
                © ${new Date().getFullYear()} BarberZap. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}