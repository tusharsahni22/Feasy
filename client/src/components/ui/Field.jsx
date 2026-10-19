/**
 * Labelled form field wrapper. Pass the control as children:
 *   <Field label="Name" error={err}><input className="input" .../></Field>
 */
export default function Field({ label, hint, error, htmlFor, children, className = '' }) {
  return (
    <div className={`field ${className}`}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="err">{error}</span>}
    </div>
  );
}
