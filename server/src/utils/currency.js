export const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'AED ',
};

export function currencySymbol(code = 'INR') {
  return CURRENCY_SYMBOLS[code] || `${code} `;
}

/** Format an amount with its currency symbol and Indian-style grouping for INR. */
export function formatMoney(amount, code = 'INR') {
  const symbol = currencySymbol(code);
  const locale = code === 'INR' ? 'en-IN' : 'en-US';
  return `${symbol}${Number(amount || 0).toLocaleString(locale)}`;
}
