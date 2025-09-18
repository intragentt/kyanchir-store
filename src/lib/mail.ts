// Местоположение: /src/lib/mail.ts
import nodemailer from 'nodemailer';

const {
  EMAIL_SERVER_HOST,
  EMAIL_SERVER_PORT,
  EMAIL_SERVER_USER,
  EMAIL_SERVER_PASSWORD,
  EMAIL_FROM,
} = process.env;

if (
  !EMAIL_SERVER_HOST ||
  !EMAIL_SERVER_PORT ||
  !EMAIL_SERVER_USER ||
  !EMAIL_SERVER_PASSWORD ||
  !EMAIL_FROM
) {
  console.warn(
    'WARN: Email server credentials are not fully configured. Email sending will be disabled.',
  );
}

const transporter = nodemailer.createTransport({
  host: EMAIL_SERVER_HOST,
  port: Number(EMAIL_SERVER_PORT),
  secure: Number(EMAIL_SERVER_PORT) === 465,
  auth: {
    user: EMAIL_SERVER_USER,
    pass: EMAIL_SERVER_PASSWORD,
  },
});

// --- НАЧАЛО ИЗМЕНЕНИЙ: Полностью новый HTML-шаблон ---
export async function sendPasswordResetEmail(email: string, token: string) {
  if (!EMAIL_SERVER_HOST) {
    console.error(
      'ERROR: Email server host is not configured. Cannot send email.',
    );
    throw new Error('Email service is not configured on the server.');
  }

  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: 'Восстановление пароля для вашего аккаунта Kyanchir',
    html: `
      <div style="background-color: #f3f4f6; padding: 20px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <div style="padding: 20px 30px; text-align: center; border-bottom: 1px solid #e5e7eb;">
            <h1 style="font-size: 28px; font-weight: bold; color: #111827; margin: 0;">Kyanchir Store</h1>
          </div>
          <div style="padding: 30px; text-align: center;">
            <h2 style="font-size: 22px; color: #1f2937; margin-top: 0;">Восстановление пароля</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Пожалуйста, нажмите на кнопку ниже, чтобы установить новый пароль для вашего аккаунта.
            </p>
            <div style="margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Установить новый пароль
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо. Эта ссылка действительна в течение 1 часа.
            </p>
          </div>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`[Mail] Письмо для сброса пароля отправлено на ${email}`);
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
