import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Utensils,
  Upload,
  Send,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Users,
} from 'lucide-react';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import Field from '../components/ui/Field.jsx';
import Badge from '../components/ui/Badge.jsx';
import { StudentsAPI, DietAPI } from '../api/endpoints.js';
import { useSettings } from '../context/SettingsContext.jsx';
import DietPlanModal from '../components/students/DietPlanModal.jsx';

export default function DietPlans() {
  const { labels } = useSettings();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sendingBulk, setSendingBulk] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setLoading(true);
    try {
      const data = await StudentsAPI.list();
      setStudents(data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  // Parse CSV format: MemberPhoneOrBarcode,DietTitle,Calories,MealDetails,PdfUrl
  async function handleBulkUpload(e) {
    e.preventDefault();
    if (!csvText.trim()) {
      toast.error('Paste CSV content');
      return;
    }

    setUploading(true);
    try {
      const lines = csvText.trim().split('\n');
      const plans = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#') || line.toLowerCase().startsWith('phone')) continue;

        // Simple CSV splitter handling quoted segments
        const parts = line.split(',').map((p) => p.trim());
        if (parts.length >= 2) {
          plans.push({
            phone: parts[0],
            title: parts[1] || 'Assigned Diet Plan',
            caloriesTarget: Number(parts[2]) || 2000,
            details: parts[3] ? parts[3].replace(/;/g, '\n') : '',
            pdfUrl: parts[4] || '',
          });
        }
      }

      if (plans.length === 0) {
        toast.error('No valid rows found in CSV');
        return;
      }

      const res = await DietAPI.bulkUpload({ plans });
      toast.success(`Bulk upload processed: ${res.updated} updated, ${res.failed} failed`);
      setShowBulkUpload(false);
      setCsvText('');
      loadMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleBulkSend() {
    if (!window.confirm('Dispatch assigned diet plans to all members via WhatsApp?')) return;
    setSendingBulk(true);
    try {
      const res = await DietAPI.bulkSend({ channel: 'whatsapp' });
      toast.success(`Dispatched: ${res.sent} sent successfully, ${res.failed} failed`);
    } catch (err) {
      toast.error(err.message || 'Bulk dispatch failed');
    } finally {
      setSendingBulk(false);
    }
  }

  const membersWithDiet = students.filter(
    (s) => s.dietPlan && (s.dietPlan.details || s.dietPlan.pdfUrl)
  );

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="page-head">
        <div>
          <div className="eyebrow">Nutrition &amp; Coaching</div>
          <h2>Diet Plans &amp; Automated Dispatch</h2>
          <p>
            Create meal schedules, bulk upload spreadsheets, and deliver diet plans directly to member WhatsApp.
          </p>
        </div>
        <div className="hstack" style={{ gap: 10 }}>
          <Button
            variant="ghost"
            icon={Upload}
            onClick={() => setShowBulkUpload(true)}
          >
            Bulk CSV Upload
          </Button>
          <Button
            variant="primary"
            icon={Send}
            onClick={handleBulkSend}
            disabled={sendingBulk || membersWithDiet.length === 0}
          >
            {sendingBulk ? 'Dispatching…' : `Send to All (${membersWithDiet.length})`}
          </Button>
        </div>
      </div>

      <div className="grid grid-3">
        <Card>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-high)' }}>
            {students.length}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>Total Active Members</div>
        </Card>
        <Card>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--emerald)' }}>
            {membersWithDiet.length}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>Assigned Diet Plans</div>
        </Card>
        <Card>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--saffron)' }}>
            {students.length - membersWithDiet.length}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>Pending Diet Assignment</div>
        </Card>
      </div>

      <Card title="Member Diet Roster">
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div className="spinner" />
          </div>
        ) : (
          <div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Shift / Batch</th>
                  <th>Blood Group</th>
                  <th>Current Diet Plan</th>
                  <th>Calories</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const hasPlan = Boolean(s.dietPlan?.details || s.dietPlan?.pdfUrl);
                  return (
                    <tr key={s._id}>
                      <td className="cell-main">
                        <strong>{s.name}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{s.parentPhone}</div>
                      </td>
                      <td>{s.shiftTiming || 'General'}</td>
                      <td>
                        <Badge tone={s.bloodGroup !== 'Unknown' ? 'rose' : 'neutral'}>
                          {s.bloodGroup || '—'}
                        </Badge>
                      </td>
                      <td>
                        {hasPlan ? (
                          <div>
                            <span style={{ fontWeight: 500, color: 'var(--text-high)' }}>
                              {s.dietPlan.title || 'Personalized Plan'}
                            </span>
                            {s.dietPlan.pdfUrl && (
                              <div style={{ fontSize: 11 }}>
                                <a
                                  href={s.dietPlan.pdfUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: 'var(--sky)', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                >
                                  PDF attachment <ExternalLink size={10} />
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>
                            No plan assigned
                          </span>
                        )}
                      </td>
                      <td>
                        {s.dietPlan?.caloriesTarget ? (
                          <Badge tone="sky">{s.dietPlan.caloriesTarget} kcal</Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="right">
                        <Button
                          variant={hasPlan ? 'subtle' : 'primary'}
                          size="sm"
                          icon={Utensils}
                          onClick={() => setSelectedStudent(s)}
                        >
                          {hasPlan ? 'Edit & Dispatch' : 'Assign Diet'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Diet Plan Modal for Single Student */}
      {selectedStudent && (
        <DietPlanModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onUpdated={loadMembers}
        />
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <Modal
          title="Bulk Upload Diet Plans (CSV / Paste)"
          onClose={() => setShowBulkUpload(false)}
          footer={
            <>
              <Button variant="subtle" onClick={() => setShowBulkUpload(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleBulkUpload} disabled={uploading}>
                {uploading ? 'Processing…' : 'Process & Assign'}
              </Button>
            </>
          }
        >
          <div className="stack" style={{ gap: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              Paste comma-separated rows below. Format:
              <br />
              <code style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4 }}>
                Phone,PlanTitle,Calories,MealDetails(use ; for newline),PdfUrl
              </code>
            </p>

            <Field label="CSV Data Content">
              <textarea
                className="input"
                rows={10}
                style={{ fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
                placeholder={`9876543210,Fat Loss Plan,1800,Breakfast: Oats;Lunch: Salad;Dinner: Soup,https://mysite.com/diet1.pdf\n9123456789,Muscle Bulk,2600,Breakfast: 4 Eggs;Lunch: Rice Chicken,`}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
