const TONES = {
  saffron: ['var(--saffron)', 'var(--saffron-soft)'],
  emerald: ['var(--emerald)', 'var(--emerald-soft)'],
  coral: ['var(--coral)', 'var(--coral-soft)'],
  violet: ['var(--violet)', 'var(--violet-soft)'],
  sky: ['var(--sky)', 'var(--sky-soft)'],
};

export default function StatCard({ label, value, foot, icon: Icon, tone = 'saffron' }) {
  const [c, s] = TONES[tone] || TONES.saffron;
  return (
    <div className="stat" style={{ '--tone': c, '--tone-soft': s }}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {Icon && (
          <span className="stat-icon">
            <Icon size={19} />
          </span>
        )}
      </div>
      <div className="stat-value num">{value}</div>
      {foot && <div className="stat-foot">{foot}</div>}
    </div>
  );
}
