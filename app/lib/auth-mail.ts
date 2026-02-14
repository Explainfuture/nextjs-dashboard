type SendAuthEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

import { getResendConfig, hasResendConfig } from './resend-config';

export function makeAbsoluteUrl(path: string) {
  const config = getResendConfig();
  return `${config.appBaseUrl}${path}`;
}

export async function sendAuthEmail(input: SendAuthEmailInput) {
  const config = getResendConfig();

  if (!hasResendConfig(config)) {
    console.log('[auth-mail] Missing RESEND_API_KEY or AUTH_EMAIL_FROM. Email preview:');
    console.log(input.subject);
    console.log(input.text);
    return false;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[auth-mail] Resend API failed:', res.status, body);
  }

  return res.ok;
}
