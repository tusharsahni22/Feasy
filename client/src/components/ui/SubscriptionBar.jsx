import { daysLabel, daysTone } from '../../lib/format.js';

/**
 * Signature "subscription runway" — a depleting bar that shrinks as the
 * remaining days count down, turns saffron in the final week, and switches
 * to a hazard stripe once expired.
 *
 * @param days        remaining days (negative = expired, null = no data)
 * @param windowDays  day-count that represents a "full" bar (default 30)
 */
export default function SubscriptionBar({ days, windowDays = 30, showLabel = true }) {
  const expired = days != null && days < 0;
  const pct = expired ? 100 : Math.max(5, Math.min(100, ((days ?? 0) / windowDays) * 100));
  const hue = expired
    ? 'var(--coral)'
    : days == null
      ? 'var(--emerald)'
      : days <= 7
        ? 'var(--saffron)'
        : 'var(--emerald)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 96 }}>
      {showLabel && <span className={`days-big ${daysTone(days)}`}>{daysLabel(days)}</span>}
      <div className={`runway ${expired ? 'expired' : ''}`} style={{ '--pct': `${pct}%`, '--hue': hue }}>
        <span />
      </div>
    </div>
  );
}
