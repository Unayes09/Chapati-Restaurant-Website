const { Resend } = require('resend');

/**
 * Unified email sender. Switch provider via EMAIL_PROVIDER env var.
 *
 * ─── Resend (default) ────────────────────────────────────────────────────────
 *   EMAIL_PROVIDER=resend   (or leave unset)
 *   RESEND_API_KEY=re_xxxxxxxxxxxx
 *   FROM_EMAIL=noreply@yourdomain.com   (must be verified in Resend dashboard)
 *
 * ─── AWS SES (future) ────────────────────────────────────────────────────────
 *   EMAIL_PROVIDER=ses
 *   AWS_REGION=eu-west-3
 *   AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxx
 *   AWS_SECRET_ACCESS_KEY=xxxxxxxx
 *   FROM_EMAIL=noreply@yourdomain.com   (must be verified in SES)
 *
 * The function signature never changes — only env vars differ between providers.
 *
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
const sendEmail = async (to, subject, text, html) => {
  const provider = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase();

  if (provider === 'resend') {
    return sendViaResend(to, subject, text, html);
  }

  if (provider === 'ses') {
    return sendViaSes(to, subject, text, html);
  }

  const msg = `Unknown EMAIL_PROVIDER "${provider}". Use "resend" or "ses".`;
  console.error('[email]', msg);
  return { ok: false, error: msg };
};

// ─── Resend ──────────────────────────────────────────────────────────────────

const sendViaResend = async (to, subject, text, html) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL;

  if (!apiKey || !from) {
    const msg = 'RESEND_API_KEY or FROM_EMAIL is missing. Add both in Render → Environment.';
    console.error('[email]', msg);
    return { ok: false, error: msg };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: `Chapati 35 <${from}>`,
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

// ─── AWS SES (ready to enable — install @aws-sdk/client-sesv2 first) ─────────
// npm install @aws-sdk/client-sesv2

const sendViaSes = async (to, subject, text, html) => {
  const region = process.env.AWS_REGION;
  const from = process.env.FROM_EMAIL;

  if (!region || !from) {
    const msg = 'AWS_REGION or FROM_EMAIL is missing for SES.';
    console.error('[email]', msg);
    return { ok: false, error: msg };
  }

  try {
    const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');
    const client = new SESv2Client({ region });

    await client.send(
      new SendEmailCommand({
        FromEmailAddress: `Chapati 35 <${from}>`,
        Destination: { ToAddresses: [to] },
        Content: {
          Simple: {
            Subject: { Data: subject },
            Body: {
              Text: { Data: text },
              Html: { Data: html },
            },
          },
        },
      }),
    );

    console.log(`[email] sent via SES to ${to} (subject: ${subject})`);
    return { ok: true };
  } catch (err) {
    const msg = err?.message || String(err);
    console.error('[email] SES error:', msg);
    return { ok: false, error: msg };
  }
};

module.exports = sendEmail;
