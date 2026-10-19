import Modal from './Modal.jsx';
import Button from './Button.jsx';

export default function ConfirmDialog({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  variant = 'danger',
  onConfirm,
  onClose,
  busy = false,
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={variant} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, color: 'var(--text-dim)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}
