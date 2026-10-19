import { CURRENCY_SYMBOLS } from './constants.js';

export function symbolFor(currency = 'INR') {
  return CURRENCY_SYMBOLS[currency] || `${currency} `;
}

/** Full money string, e.g. "₹1,23,400". */
export function money(amount, currency = 'INR') {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return (
    symbolFor(currency) +
    Number(amount || 0).toLocaleString(locale, { maximumFractionDigits: 0 })
  );
}

/** Compact money for tight spaces, e.g. "₹1.2L", "₹34k". */
export function moneyShort(amount, currency = 'INR') {
  const n = Number(amount || 0);
  const s = symbolFor(currency);
  if (currency === 'INR') {
    if (n >= 1e7) return `${s}${(n / 1e7).toFixed(2).replace(/\.?0+$/, '')}Cr`;
    if (n >= 1e5) return `${s}${(n / 1e5).toFixed(2).replace(/\.?0+$/, '')}L`;
    if (n >= 1e3) return `${s}${(n / 1e3).toFixed(1).replace(/\.0$/, '')}k`;
    return `${s}${n.toLocaleString('en-IN')}`;
  }
  if (n >= 1e6) return `${s}${(n / 1e6).toFixed(2).replace(/\.?0+$/, '')}M`;
  if (n >= 1e3) return `${s}${(n / 1e3).toFixed(1).replace(/\.0$/, '')}k`;
  return `${s}${n.toLocaleString('en-US')}`;
}

export function formatDate(d, opts) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(
    'en-IN',
    opts || { day: '2-digit', month: 'short', year: 'numeric' }
  );
}

/** Convert a date to yyyy-mm-dd for <input type="date"> (local time). */
export function toDateInput(d) {
  if (!d) return '';
  const x = new Date(d);
  const local = new Date(x.getTime() - x.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function daysLabel(days) {
  if (days === null || days === undefined) return '—';
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

/** Map remaining days → tone class suffix used across the UI. */
export function daysTone(days) {
  if (days === null || days === undefined) return 'ok';
  if (days < 0) return 'bad';
  if (days <= 7) return 'warn';
  return 'ok';
}

export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}
