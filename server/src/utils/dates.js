/** Date helpers used by the dashboard aggregations. All local-time based. */

export function monthKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function startOfMonth(date = new Date()) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(date = new Date()) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function startOfYear(date = new Date()) {
  const d = new Date(date);
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}

export function endOfYear(date = new Date()) {
  const d = new Date(date);
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
}

/** Array describing the last `count` months (oldest first), for trend charts. */
export function lastMonths(count = 6, date = new Date()) {
  const out = [];
  const base = new Date(date.getFullYear(), date.getMonth(), 1);
  for (let i = count - 1; i >= 0; i -= 1) {
    const m = new Date(base.getFullYear(), base.getMonth() - i, 1);
    out.push({
      key: monthKey(m),
      label: m.toLocaleString('en-US', { month: 'short' }),
      year: m.getFullYear(),
      start: startOfMonth(m),
      end: endOfMonth(m),
    });
  }
  return out;
}
