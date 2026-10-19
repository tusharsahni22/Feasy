export default function Card({
  title,
  subtitle,
  actions,
  children,
  bodyClass = '',
  className = '',
  ...rest
}) {
  const hasHead = title || subtitle || actions;
  return (
    <section className={`card ${className}`} {...rest}>
      {hasHead && (
        <div className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <div className="card-sub">{subtitle}</div>}
          </div>
          {actions && <div className="hstack">{actions}</div>}
        </div>
      )}
      <div className={`card-body ${bodyClass}`}>{children}</div>
    </section>
  );
}
