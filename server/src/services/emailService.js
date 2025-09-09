const sgMail = require('@sendgrid/mail');

const DRIVER = process.env.EMAIL_DRIVER || 'sendgrid'; // 'sendgrid' | 'dev'
const DRY_RUN = String(process.env.EMAIL_DRY_RUN || 'false').toLowerCase() === 'true';

function assertEnv(name) {
    if (!process.env[name]) throw new Error(`Missing required env: ${name}`);
}

function sanitizeRecipient(to) {
    if (!to || typeof to !== 'string' || !to.includes('@')) {
        throw new Error('Invalid recipient email');
    }
    return to.trim();
}

async function sendViaSendGrid({ to, subject, html, text }) {
    if (DRY_RUN) {
        console.log('[EMAIL][DRY_RUN][SendGrid]', { to: sanitizeRecipient(to), subject: subject || 'Notification' });
        return { ok: true, dryRun: true };
    }

    assertEnv('SENDGRID_API_KEY');
    assertEnv('MAIL_FROM');

    const from = process.env.MAIL_FROM;
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
        to: sanitizeRecipient(to),
        from,
        subject: subject || 'Notification',
        html: html || `<p>${text || 'No content'}</p>`,
        text: text || '',
        trackingSettings: {
            clickTracking: { enable: false, enableText: false },
            openTracking: { enable: false },
            subscriptionTracking: { enable: false },
        },
    };

    await sgMail.send(msg);
    return { ok: true };
}

async function sendEmail({ to, subject, html, text }) {
    if (DRIVER === 'dev') {
        console.log('[EMAIL][DEV]', { to, subject });
        return { ok: true, driver: 'dev' };
    }
    return sendViaSendGrid({ to, subject, html, text });
}

async function sendResetEmail({ to, link, ttlMin = Number(process.env.RESET_TOKEN_TTL_MIN || 30) }) {
    const subject = 'איפוס סיסמה – Luma';
    const html = `
    <div style="direction:rtl;font-family:Arial,Helvetica,sans-serif;">
      <p>שלום,</p>
      <p>התקבלה בקשה לאיפוס סיסמה לחשבון שלך.</p>
      <p>
        <a href="${link}" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;">
          לחץ/י כאן לאיפוס הסיסמה
        </a>
      </p>
      <p>הלינק בתוקף ${ttlMin} דקות. אם לא ביקשת איפוס, אפשר להתעלם מההודעה.</p>
      <p style="color:#777;font-size:12px">Luma • מערכת CRM למטפלות ומטפלים</p>
    </div>
  `;
    return sendEmail({ to, subject, html, text: `איפוס סיסמה: ${link} (תוקף ${ttlMin} דקות)` });
}

module.exports = {
    sendEmail,
    sendResetEmail,
};


