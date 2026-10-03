// Emails the site owner when a contact message arrives (Resend HTTP API)
async function notifyNewMessage(msg) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!key || !to || !from) {
    console.warn('Contact notification skipped: set RESEND_API_KEY, CONTACT_TO_EMAIL and CONTACT_FROM_EMAIL');
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to,
      reply_to: msg.email,
      subject: `New enquiry from ${msg.name}`,
      text: `${msg.name} <${msg.email}>\n${msg.subject ? `Subject: ${msg.subject}\n` : ''}\n${msg.message}`
    })
  });

  if (!res.ok) {
    console.error('Contact notification failed', res.status, await res.text());
  }
}

module.exports = { notifyNewMessage };
