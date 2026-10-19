import { env } from '../../config/env.js';

/**
 * Normalise a phone number for messaging APIs: strip non-digits and, if it
 * looks like a bare 10-digit local number, prepend the default country code.
 */
export function normalizePhone(phone, countryCode = env.defaultCountryCode) {
  let p = String(phone || '').replace(/\D/g, '');
  if (p.length === 10) p = `${countryCode}${p}`;
  return p;
}

/**
 * Send a WhatsApp message via Meta's WhatsApp Cloud API.
 *
 * If credentials aren't configured the send is *simulated* — logged and
 * returned as status:'simulated' — so the whole app remains usable in dev.
 *
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
export async function sendWhatsApp({ to, message }) {
  const { token, phoneNumberId, apiVersion, templateName, templateLang } = env.whatsapp;
  const recipient = normalizePhone(to);

  if (!token || !phoneNumberId) {
    return {
      status: 'simulated',
      to: recipient,
      providerMessageId: null,
      info: 'WhatsApp not configured — message simulated (set WHATSAPP_TOKEN & WHATSAPP_PHONE_NUMBER_ID to send for real).',
    };
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  // Business-initiated messages generally require an approved template.
  // If a template name is provided we use it (message text fills one body
  // parameter); otherwise we fall back to a plain text message.
  const body = templateName
    ? {
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'template',
        template: {
          name: templateName,
          language: { code: templateLang },
          components: [
            { type: 'body', parameters: [{ type: 'text', text: message }] },
          ],
        },
      }
    : {
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'text',
        text: { body: message },
      };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        status: 'failed',
        to: recipient,
        error: data?.error?.message || `WhatsApp API returned HTTP ${res.status}`,
      };
    }

    return {
      status: 'sent',
      to: recipient,
      providerMessageId: data?.messages?.[0]?.id || null,
    };
  } catch (err) {
    return { status: 'failed', to: recipient, error: err.message };
  }
}
