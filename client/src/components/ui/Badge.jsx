export default function Badge({ tone = 'neutral', dot = false, children, className = '' }) {
  return (
    <span className={`badge ${tone} ${className}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

const STATUS_MAP = {
  active: { tone: 'active', label: 'Active' },
  expiring: { tone: 'expiring', label: 'Expiring' },
  expired: { tone: 'expired', label: 'Expired' },
  paused: { tone: 'paused', label: 'On Leave (Paused)' },
  inactive: { tone: 'neutral', label: 'Inactive' },
};

/** Subscription status → coloured badge. */
export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { tone: 'neutral', label: status || '—' };
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}
