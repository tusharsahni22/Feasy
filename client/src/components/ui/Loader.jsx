export function Spinner() {
  return <div className="spinner" />;
}

export function Loading({ label }) {
  return (
    <div className="center-load">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" />
        {label && (
          <div style={{ color: 'var(--text-faint)', fontSize: 13, marginTop: -18 }}>{label}</div>
        )}
      </div>
    </div>
  );
}
