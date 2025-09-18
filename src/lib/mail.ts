// Местоположение: /src/lib/mail.ts
import nodemailer from 'nodemailer';

// --- ИЗМЕНЕНИЕ: Используем переменные из твоего .env.local ---
const {
  EMAIL_SERVER_HOST,
  EMAIL_SERVER_PORT,
  EMAIL_SERVER_USER,
  EMAIL_SERVER_PASSWORD,
  EMAIL_FROM,
} = process.env;

// Проверяем, что все переменные окружения заданы
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
  secure: Number(EMAIL_SERVER_PORT) === 465, // true for 465, false for other ports like 587
  auth: {
    user: EMAIL_SERVER_USER, // Для SendGrid это обычно "apikey"
    pass: EMAIL_SERVER_PASSWORD,
  },
});

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
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Восстановление пароля</h2>
        <p>Здравствуйте,</p>
        <p>Вы (или кто-то другой) запросили сброс пароля для вашего аккаунта. Если это были не вы, просто проигнорируйте это письмо.</p>
        <p>Чтобы установить новый пароль, пожалуйста, перейдите по ссылке ниже:</p>
        <p style="text-align: center;">
          <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Установить новый пароль
          </a>
        </p>
        <p>Эта ссылка действительна в течение 1 часа.</p>
        <p>С уважением,<br/>Команда Kyanchir</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`[Mail] Письмо для сброса пароля отправлено на ${email}`);
}
