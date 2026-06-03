const { Resend } = require('resend');
const nodemailer = require('nodemailer');

const FROM_NAME = process.env.FROM_NAME || 'Chapati 35';

/**
 * Unified email sender. Switch provider via EMAIL_PROVIDER env var.
 *
 * ─── cPanel / SMTP (recommended for cPanel mailbox) ─────────────────────────
 *   EMAIL_PROVIDER=smtp
 *   SMTP_HOST=mail.yourdomain.com
 *   SMTP_PORT=465
 *   SMTP_SECURE=true
 *   SMTP_USER=orders@yourdomain.com
 *   SMTP_PASS=your-mailbox-password
 *   FROM_EMAIL=orders@yourdomain.com
 *   FROM_NAME=Chapati 35
 *
 *   Port 587 example:
 *   SMTP_PORT=587
 *   SMTP_SECURE=false
 *
 * ─── Resend ─────────────────────────────────────────────────────────────────
 *   EMAIL_PROVIDER=resend
 *   RESEND_API_KEY=re_xxxxxxxxxxxx
 *   FROM_EMAIL=noreply@yourdomain.com
 *
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
const sendEmail = async (to, subject, text, html) => {
  const provider = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase();

  if (provider === 'smtp') {
    return sendViaSmtp(to, subject, text, html);
  }

  if (provider === 'resend') {
    return sendViaResend(to, subject, text, html);
  }

  const msg = `Unknown EMAIL_PROVIDER "${provider}". Use "smtp" or "resend".`;
  console.error('[email]', msg);
  return { ok: false, error: msg };
};

const formatFrom = (email) => `${FROM_NAME} <${email}>`;

// ─── cPanel / SMTP (nodemailer) ─────────────────────────────────────────────

let smtpTransporter;

const getSmtpTransporter = () => {
  if (smtpTransporter) return smtpTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure =
    process.env.SMTP_SECURE != null
      ? String(process.env.SMTP_SECURE).toLowerCase() === 'true'
      : port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  smtpTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      // cPanel shared hosts sometimes use self-signed certs
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
    },
  });

  return smtpTransporter;
};

const sendViaSmtp = async (to, subject, text, html) => {
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const transporter = getSmtpTransporter();

  if (!from) {
    const msg = 'FROM_EMAIL or SMTP_USER is missing for SMTP.';
    console.error('[email]', msg);
    return { ok: false, error: msg };
  }

  if (!transporter) {
    const msg = 'SMTP_HOST, SMTP_USER, or SMTP_PASS is missing. Add them in backend .env.';
    console.error('[email]', msg);
    return { ok: false, error: msg };
  }

  try {
    await transporter.sendMail({
      from: formatFrom(from),
      to,
      subject,
      text,
      html,
    });

    console.log(`[email] sent via SMTP to ${to} (subject: ${subject})`);
    return { ok: true };
  } catch (err) {
    const msg = err?.message || String(err);
    console.error('[email] SMTP error:', msg);
    return { ok: false, error: msg };
  }
};

// ─── Resend ──────────────────────────────────────────────────────────────────

const sendViaResend = async (to, subject, text, html) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL;

  if (!apiKey || !from) {
    const msg = 'RESEND_API_KEY or FROM_EMAIL is missing. Add both in backend environment.';
    console.error('[email]', msg);
    return { ok: false, error: msg };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: formatFrom(from),
      to,
      subject,
      text,
      html,
    });

    if (error) {
      console.error('[email] Resend error:', error.message || JSON.stringify(error));
      return { ok: false, error: error.message || JSON.stringify(error) };
    }

    console.log(`[email] sent via Resend to ${to} (subject: ${subject})`);
    return { ok: true };
  } catch (err) {
    const msg = err?.message || String(err);
    console.error('[email] Resend exception:', msg);
    return { ok: false, error: msg };
  }
};

module.exports = sendEmail;
