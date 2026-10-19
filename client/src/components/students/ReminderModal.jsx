import { useState } from 'react';
import toast from 'react-hot-toast';
import { Send, Info } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Field from '../ui/Field.jsx';
import { RemindersAPI } from '../../api/endpoints.js';
import { CHANNELS } from '../../lib/constants.js';
import { useSettings } from '../../context/SettingsContext.jsx';

const TOKENS = ['parentName', 'studentName', 'class', 'days', 'endDate', 'fee', 'currency', 'institute'];

export default function ReminderModal({ students = [], onClose, onSent }) {
  const { settings } = useSettings();
  const [channel, setChannel] = useState('whatsapp');
  const [template, setTemplate] = useState(
    settings.reminderTemplate || settings.defaultTemplate || ''
  );
  const [sending, setSending] = useState(false);

  const messaging = settings.messaging || {};
  const channelConfigured =
    channel === 'whatsapp' ? messaging.whatsapp?.configured : messaging.sms?.configured;

  async function submit() {
    if (!template.trim()) {
      toast.error('Message template can’t be empty');
      return;
    }
    if (students.length === 0) {
      toast.error('No recipients selected');
      return;
    }
    setSending(true);
    try {
      const res = await RemindersAPI.send({
        studentIds: students.map((s) => s._id),
        channel,
        template,
      });
      const parts = Object.entries(res.summary || {}).map(([k, v]) => `${v} ${k}`);
      toast.success(`Reminders: ${parts.join(', ') || 'done'}`);
      onSent?.(res);
      onClose?.();
    } catch (e) {
      toast.error(e.message || 'Could not send reminders');
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      title={
        students.length === 1
          ? `Remind ${students[0].parentName || students[0].name}`
          : `Send ${students.length} reminders`
      }
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="subtle" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button variant="primary" icon={Send} onClick={submit} disabled={sending}>
            {sending ? 'Sending…' : `Send via ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}`}
          </Button>
        </>
      }
    >
      <Field label="Channel">
        <select className="select" value={channel} onChange={(e) => setChannel(e.target.value)}>
          {CHANNELS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      {!channelConfigured && (
        <div className="callout" style={{ marginBottom: 16 }}>
          <Info size={18} />
          <span>
            {channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} isn’t configured yet, so messages will be{' '}
            <b>simulated</b> and logged (nothing is actually sent). Add credentials in Settings to go
            live.
          </span>
        </div>
      )}

      <Field
        label="Message template"
        hint={`Tokens: ${TOKENS.map((t) => `{${t}}`).join('  ')}`}
      >
        <textarea
          className="textarea"
          rows={5}
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        />
      </Field>

      <div className="field mt-0">
        <label>Recipients ({students.length})</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
          {students.map((s) => (
            <span key={s._id} className="tag-pill">
              {s.name} · {s.parentPhone}
            </span>
          ))}
        </div>
      </div>
    </Modal>
  );
}
