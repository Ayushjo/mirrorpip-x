// Transactional email. Uses Resend when RESEND_API_KEY is set; otherwise logs
// the message (and any OTP) to the server console so local dev still works —
// never wire real users without a provider key.

export interface OutboundEmail {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: OutboundEmail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? 'MirrorPip <onboarding@resend.dev>';
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      // Never log email bodies in prod — OTP subjects/bodies are auth secrets.
      console.warn(`[email] RESEND_API_KEY missing — email to ${to} not sent. Set it before onboarding users.`);
      return;
    }
    // Dev fallback: surface the OTP/link in server logs so flows remain usable.
    console.log(`[email:dev] to=${to} subject=${subject}\n${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend failed (${res.status}): ${body.slice(0, 300)}`);
  }
}

const shell = (title: string, body: string): string => `
  <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px">
    <div style="font-size:20px;font-weight:600;margin-bottom:16px">MirrorPip</div>
    <h1 style="font-size:22px;margin:0 0 12px">${title}</h1>
    ${body}
    <p style="color:#888;font-size:12px;margin-top:32px">If you didn't request this, you can ignore this email.</p>
  </div>`;

export function verificationOtpEmail(otp: string): { subject: string; html: string } {
  return {
    subject: `${otp} — your MirrorPip verification code`,
    html: shell(
      'Verify your email',
      `<p style="color:#444">Enter this code to finish creating your account:</p>
       <div style="font-size:32px;font-weight:700;letter-spacing:8px;margin:20px 0">${otp}</div>
       <p style="color:#888;font-size:13px">Expires in 10 minutes.</p>`,
    ),
  };
}

export function resetPasswordOtpEmail(otp: string): { subject: string; html: string } {
  return {
    subject: `${otp} — reset your MirrorPip password`,
    html: shell(
      'Reset your password',
      `<p style="color:#444">Enter this code to choose a new password:</p>
       <div style="font-size:32px;font-weight:700;letter-spacing:8px;margin:20px 0">${otp}</div>
       <p style="color:#888;font-size:13px">Expires in 10 minutes.</p>`,
    ),
  };
}

export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: 'Welcome to MirrorPip',
    html: shell(
      `Welcome${name ? `, ${name}` : ''}`,
      `<p style="color:#444">Your account is verified. Connect your exchange account and start copying verified leaders — your funds never leave your exchange.</p>`,
    ),
  };
}
