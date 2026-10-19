export default function Button({
  variant = 'ghost',
  size,
  icon: Icon,
  iconRight: IconRight,
  block = false,
  children,
  className = '',
  ...rest
}) {
  const cls = [
    'btn',
    `btn-${variant}`,
    size === 'sm' && 'btn-sm',
    !children && 'btn-icon',
    block && 'btn-block',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={cls} {...rest}>
      {Icon && <Icon size={size === 'sm' ? 15 : 16} />}
      {children}
      {IconRight && <IconRight size={size === 'sm' ? 15 : 16} />}
    </button>
  );
}
