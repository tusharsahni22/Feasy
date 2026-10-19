export default function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="empty">
      {Icon && (
        <div className="ic">
          <Icon size={24} />
        </div>
      )}
      <h4>{title}</h4>
      {hint && <p style={{ margin: 0, maxWidth: '44ch' }}>{hint}</p>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
