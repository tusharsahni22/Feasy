import { sendWhatsApp } from './whatsapp.js';
import { sendSMS } from './sms.js';

/**
 * Fill a reminder template. Placeholders look like {parentName}, {studentName},
 * {class}, {days}, {endDate}, {fee}, {currency}, {institute}. Unknown keys
 * resolve to an empty string.
 */
export function renderTemplate(template, data) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) =>
    data[key] === undefined || data[key] === null ? '' : String(data[key])
  );
}

/** Route a message to the right channel. */
export async function dispatchMessage(channel, payload) {
  switch (channel) {
    case 'whatsapp':
      return sendWhatsApp(payload);
    case 'sms':
      return sendSMS(payload);
    default:
      throw new Error(`Unknown reminder channel: ${channel}`);
  }
}

export const CHANNELS = ['whatsapp', 'sms'];
