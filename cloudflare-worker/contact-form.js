const ALLOWED_ORIGIN = 'https://stageflow.careers';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid request body' }, 400);
    }

    const { name, institution, role, email, message } = body;

    if (!name || !institution || !email) {
      return json({ error: 'Missing required fields' }, 400);
    }

    const emailBody = {
      sender: { name: 'StageFlow', email: 'hello@stageflow.careers' },
      to: [{ email: 'malinmabika@gmail.com' }],
      replyTo: { email, name },
      subject: `New inquiry: ${name} — ${institution}`,
      htmlContent: `
        <p><strong>Name:</strong> ${esc(name)}</p>
        <p><strong>Institution:</strong> ${esc(institution)}</p>
        <p><strong>Role:</strong> ${esc(role || '—')}</p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        <p><strong>Message:</strong><br>${esc(message || '—').replace(/\n/g, '<br>')}</p>
      `,
    };

    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailBody),
    });

    if (!brevoRes.ok) {
      const err = await brevoRes.text();
      console.error('Brevo error:', err);
      return json({ error: 'Failed to send message' }, 500);
    }

    return json({ success: true });
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
