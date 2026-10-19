import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Send, FileText, CheckCircle, ExternalLink, Save } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Field from '../ui/Field.jsx';
import { DietAPI } from '../../api/endpoints.js';

export default function DietPlanModal({ student, onClose, onUpdated }) {
  const [title, setTitle] = useState(student?.dietPlan?.title || 'Personalized Fitness & Diet Plan');
  const [caloriesTarget, setCaloriesTarget] = useState(student?.dietPlan?.caloriesTarget || 2000);
  const [details, setDetails] = useState(
    student?.dietPlan?.details ||
      `• Breakfast (8:00 AM): 3 boiled eggs or paneer toast, oatmeal with fruits.\n• Lunch (1:30 PM): Grilled chicken / brown rice / dal with green salad.\n• Evening Snack (5:30 PM): Protein shake or roasted almonds.\n• Dinner (8:30 PM): Mixed vegetable stir-fry or vegetable soup.`
  );
  const [pdfUrl, setPdfUrl] = useState(student?.dietPlan?.pdfUrl || '');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await DietAPI.updateStudent(student._id, {
        title,
        caloriesTarget: Number(caloriesTarget),
        details,
        pdfUrl,
      });
      toast.success('Diet plan saved for ' + student.name);
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Could not save diet plan');
    } finally {
      setSaving(false);
    }
  }

  async function handleSend(channel = 'whatsapp') {
    setSending(true);
    try {
      // Auto-save first
      await DietAPI.updateStudent(student._id, {
        title,
        caloriesTarget: Number(caloriesTarget),
        details,
        pdfUrl,
      });
      await DietAPI.send(student._id, { channel });
      toast.success(`Diet plan dispatched via ${channel} to ${student.name}!`);
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not send diet plan');
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      title={`Diet & Nutrition Plan — ${student.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose} disabled={saving || sending}>
            Close
          </Button>
          <Button variant="ghost" icon={Save} onClick={handleSave} disabled={saving || sending}>
            {saving ? 'Saving…' : 'Save Plan'}
          </Button>
          <Button
            variant="primary"
            icon={Send}
            onClick={() => handleSend('whatsapp')}
            disabled={saving || sending}
          >
            {sending ? 'Sending…' : 'Save & Send to WhatsApp'}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Diet Plan Title" className="full">
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Muscle Gain 2400 Kcal Plan"
          />
        </Field>

        <Field label="Target Calories (kcal/day)">
          <input
            type="number"
            className="input"
            value={caloriesTarget}
            min={0}
            onChange={(e) => setCaloriesTarget(e.target.value)}
          />
        </Field>

        <Field label="External PDF / Document Link (Optional)">
          <input
            className="input"
            value={pdfUrl}
            onChange={(e) => setPdfUrl(e.target.value)}
            placeholder="https://example.com/diet-sheet.pdf"
          />
        </Field>

        <Field label="Diet & Nutrition Meal Schedule" className="full">
          <textarea
            className="input"
            rows={8}
            style={{ fontFamily: 'inherit', resize: 'vertical' }}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Breakfast, Lunch, Pre-workout, Dinner details..."
          />
        </Field>
      </div>

      <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-dim)' }}>
        💡 <strong>Tip:</strong> Clicking &quot;Save &amp; Send to WhatsApp&quot; will format the diet breakdown and deliver it directly to the member&apos;s registered phone number (<strong>{student.parentPhone}</strong>).
      </div>
    </Modal>
  );
}

