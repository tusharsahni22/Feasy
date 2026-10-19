import { env } from '../../config/env.js';
import { normalizePhone } from './whatsapp.js';

/**
 * SMS adapter (pluggable).
 *
 * This is intentionally a thin stub: the app was set up with WhatsApp Cloud API
 * as the primary channel, and SMS is offered as an alternative. To enable real
 * SMS, set SMS_PROVIDER + SMS_API_KEY in .env and implement the provider call
 * below (e.g. MSG91, Twilio, TextLocal). Controllers don't need to change.
 *
 * When not configured, sends are *simulated* so the UI still works end-to-end.
 */
export async function sendSMS({ to, message }) {
  const { provider, apiKey, senderId } = env.sms;
  const recipient = normalizePhone(to);

  if (!provider || !apiKey) {
    return {
      status: 'simulated',
      to: recipient,
      providerMessageId: null,
      info: 'SMS not configured — message simulated (wire up a provider in services/messaging/sms.js).',
    };
  }

  // ── Implement your provider here ──────────────────────────────────────────
  // Example shape (MSG91-style); left unimplemented on purpose:
  //
  //   const res = await fetch('https://api.msg91.com/api/v5/flow/', {
  //     method: 'POST',
  //     headers: { authkey: apiKey, 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ sender: senderId, mobiles: recipient, ... }),
  //   });
  //   ...map res → { status, providerMessageId } / { status:'failed', error }
  //
  return {
    status: 'simulated',
    to: recipient,
    info: `SMS provider "${provider}" adapter is not implemented yet — message simulated.`,
    senderId,
  };
}
