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
  const from = process.env.RESEND_FROM ?? 'BelieveMeGuys <onboarding@resend.dev>';
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

// ─── Branded email shell (dark navy / blue, Brand Guidelines v1.0) ───────────
// Email clients are picky: table-based layout, inline styles, no external CSS,
// web-safe font stack with a Poppins @import for clients that honour it. The
// whole thing degrades gracefully to system fonts and solid colors.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.believemeguys.com';

const C = {
  bg: '#050b17',
  card: '#0a1e3a',
  border: '#1b3a63',
  borderSoft: '#14294a',
  fg: '#f1f5ff',
  muted: '#94a3b8',
  faint: '#64748b',
  brand: '#00b0ff',
  accent: '#60a5ff',
};

const FONT = "'Poppins',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function shell({
  preheader,
  heading,
  bodyHtml,
}: {
  preheader: string;
  heading: string;
  bodyHtml: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>BelieveMeGuys</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
  body{margin:0;padding:0;background:${C.bg};-webkit-font-smoothing:antialiased;}
  a{color:${C.accent};}
  @media (max-width:520px){.card{width:100% !important;border-radius:0 !important;}.pad{padding:28px 22px !important;}}
</style>
</head>
<body style="margin:0;padding:0;background:${C.bg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.bg};font-size:1px;line-height:1px;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" class="card" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:480px;background:${C.card};border:1px solid ${C.border};border-radius:20px;overflow:hidden;">
        <!-- header -->
        <tr><td class="pad" style="padding:28px 36px 0;font-family:${FONT};">
          <span style="font-size:22px;font-weight:700;letter-spacing:-0.02em;color:${C.fg};">BelieveMe<span style="color:${C.brand};">Guys</span></span>
        </td></tr>
        <tr><td style="padding:20px 36px 0;"><div style="height:3px;border-radius:3px;background:linear-gradient(90deg,${C.brand},${C.accent});"></div></td></tr>
        <!-- body -->
        <tr><td class="pad" style="padding:26px 36px 34px;font-family:${FONT};">
          <h1 style="margin:0 0 14px;font-size:23px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;color:${C.fg};">${heading}</h1>
          ${bodyHtml}
        </td></tr>
        <!-- footer -->
        <tr><td style="padding:20px 36px 30px;border-top:1px solid ${C.borderSoft};font-family:${FONT};">
          <p style="margin:0 0 6px;color:${C.faint};font-size:12px;line-height:1.6;">If you didn't request this, you can safely ignore this email — no changes will be made.</p>
          <p style="margin:0;color:${C.faint};font-size:12px;line-height:1.6;">BelieveMeGuys · Copy the best crypto traders · Not investment advice.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function otpBlock(otp: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 14px;">
    <tr><td align="center" style="background:${C.bg};border:1px solid ${C.border};border-radius:14px;padding:20px 12px;">
      <div style="font-family:${FONT};font-size:38px;font-weight:700;letter-spacing:10px;color:${C.brand};text-indent:10px;">${otp}</div>
    </td></tr>
  </table>`;
}

function ctaButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 6px;">
    <tr><td align="center" style="border-radius:999px;background:linear-gradient(90deg,${C.brand},${C.accent});">
      <a href="${href}" style="display:inline-block;padding:12px 28px;font-family:${FONT};font-size:14px;font-weight:600;color:#050b17;text-decoration:none;border-radius:999px;">${label}</a>
    </td></tr>
  </table>`;
}

const p = (html: string, color: string = C.muted): string =>
  `<p style="margin:0 0 4px;font-family:${FONT};font-size:15px;line-height:1.6;color:${color};">${html}</p>`;

export function verificationOtpEmail(otp: string): { subject: string; html: string } {
  return {
    subject: `${otp} is your BelieveMeGuys verification code`,
    html: shell({
      preheader: `Your verification code is ${otp}. It expires in 10 minutes.`,
      heading: 'Verify your email',
      bodyHtml:
        p('Enter this code to finish creating your account:') +
        otpBlock(otp) +
        p(`This code expires in <strong style="color:${C.muted};">10 minutes</strong>. Never share it with anyone.`, C.faint),
    }),
  };
}

export function resetPasswordOtpEmail(otp: string): { subject: string; html: string } {
  return {
    subject: `${otp} is your BelieveMeGuys password reset code`,
    html: shell({
      preheader: `Your password reset code is ${otp}. It expires in 10 minutes.`,
      heading: 'Reset your password',
      bodyHtml:
        p('Enter this code to choose a new password:') +
        otpBlock(otp) +
        p(`This code expires in <strong style="color:${C.muted};">10 minutes</strong>. If you didn't ask to reset your password, ignore this email.`, C.faint),
    }),
  };
}

export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: 'Welcome to BelieveMeGuys',
    html: shell({
      preheader: 'Your account is verified — connect an exchange and start copying verified leaders.',
      heading: `Welcome${name ? `, ${name}` : ''} 👋`,
      bodyHtml:
        p('Your account is verified and ready.') +
        p(
          'Connect a trade-only exchange key, pick a verified leader, and every trade they make is mirrored into your account automatically — your funds never leave your exchange.',
        ) +
        ctaButton('Connect your exchange', `${APP_URL}/connect`) +
        p(`Or browse the <a href="${APP_URL}/leaders" style="color:${C.accent};text-decoration:none;">leaderboard</a> first.`, C.faint),
    }),
  };
}
