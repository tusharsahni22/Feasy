export const PLAN_OPTIONS = [
  { value: 'monthly', label: 'Monthly', months: 1 },
  { value: 'quarterly', label: 'Quarterly', months: 3 },
  { value: 'half_yearly', label: 'Half-yearly', months: 6 },
  { value: 'annual', label: 'Annual', months: 12 },
];

export const PLAN_LABELS = Object.fromEntries(
  PLAN_OPTIONS.map((p) => [p.value, p.label])
);

export const PLAN_MONTHS = Object.fromEntries(
  PLAN_OPTIONS.map((p) => [p.value, p.months])
);

export const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'bank', label: 'Bank transfer' },
  { value: 'other', label: 'Other' },
];

export const CURRENCY_OPTIONS = [
  { value: 'INR', label: '₹ Indian Rupee' },
  { value: 'USD', label: '$ US Dollar' },
  { value: 'EUR', label: '€ Euro' },
  { value: 'GBP', label: '£ British Pound' },
  { value: 'AED', label: 'AED Dirham' },
];

export const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'AED ',
};
