const nodemailer = require('nodemailer');

/**
 * Send mail via SMTP (default: Gmail).
 *
 * Render / production checklist:
 * - Set EMAIL_USER and EMAIL_PASS in the Render service "Environment" tab (not only .env on your PC).
 * - Gmail: use an App Password (Google Account → Security → 2-Step Verification → App passwords),
 *   not your normal password. "Less secure apps" no longer works.
 * - If Gmail still blocks the datacenter, check the sender Google account for security alerts, or use
 *   a provider API (Resend, SendGrid, Mailgun) instead of smtp.gmail.com.
 *
 * Optional env: SMTP_HOST (default smtp.gmail.com), SMTP_PORT (default 587), EMAIL_FROM (defaults to EMAIL_USER).
 *
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
const sendEmail = async (to, subject, text, html) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    const msg =
      'EMAIL_USER or EMAIL_PASS is missing. Add both in Render → your Web Service → Environment.';
    console.error('[email]', msg);
    return { ok: false, error: msg };
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = port === 465;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      ...(port === 587 ? { requireTLS: true } : {}),
      auth: { user, pass },
    });

    const fromAddr = process.env.EMAIL_FROM || user;

    await transporter.sendMail({
      from: `"Chapati 35" <${fromAddr}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`[email] sent to ${to} (subject: ${subject})`);
    return { ok: true };
  } catch (error) {
    const message = error?.message || String(error);
    const code = error?.code || error?.responseCode;
    console.error('[email] send failed:', message, code ? `(code ${code})` : '', error?.response || '');
    return { ok: false, error: message };
  }
};

module.exports = sendEmail;
