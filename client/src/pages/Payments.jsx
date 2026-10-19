import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { IndianRupee, Trash2, Receipt, X } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { PaymentsAPI, StudentsAPI } from '../api/endpoints.js';
import { useSettings } from '../context/SettingsContext.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Field from '../components/ui/Field.jsx';
import Modal from '../components/ui/Modal.jsx';
import { Spinner } from '../components/ui/Loader.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import PaymentModal from '../components/students/PaymentModal.jsx';
import { formatDate } from '../lib/format.js';

function monthLabel(key) {
  if (!key) return '—';
  const d = new Date(`${key}-01T00:00:00`);
  return Number.isNaN(d.getTime())
    ? key
    : d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function StudentPickModal({ students, labels, onPick, onClose }) {
  const [sel, setSel] = useState('');
  return (
    <Modal
      title="Record a payment"
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!sel}
            onClick={() => {
              const s = students.find((x) => x._id === sel);
              if (s) onPick(s);
            }}
          >
            Continue
          </Button>
        </>
      }
    >
      <Field label={`Which ${labels.memberSingular.toLowerCase()}?`}>
        <select className="select" value={sel} onChange={(e) => setSel(e.target.value)}>
          <option value="">Select a {labels.memberSingular.toLowerCase()}…</option>
          {students.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} — {s.classPlan?.name || '—'}
            </option>
          ))}
        </select>
      </Field>
    </Modal>
  );
}

export default function Payments() {
  const { money, labels } = useSettings();
  const [student, setStudent] = useState('');
  const [method, setMethod] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [picking, setPicking] = useState(false);
  const [payFor, setPayFor] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const { data: students } = useApi(() => StudentsAPI.list({ sort: 'name' }), []);
  const params = {
    ...(student && { student }),
    ...(method && { method }),
    ...(from && { from }),
    ...(to && { to }),
  };
  const { data: payments, loading, refetch } = useApi(
    () => PaymentsAPI.list(params),
    [student, method, from, to]
  );

  const rows = payments || [];
  const total = rows.reduce((s, p) => s + (p.amount || 0), 0);
  const hasFilters = student || method || from || to;

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await PaymentsAPI.remove(toDelete._id);
      toast.success('Payment removed');
      setToDelete(null);
      refetch();
    } catch (e) {
      toast.error(e.message || 'Could not remove payment');
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Ledger</div>
          <h2>Payments</h2>
          <p>Every {labels.feeLabel.toLowerCase()} collected, newest first. Filter by {labels.memberSingular.toLowerCase()}, method or date.</p>
        </div>
        <Button variant="primary" icon={IndianRupee} onClick={() => setPicking(true)}>
          Record payment
        </Button>
      </div>

      <div className="toolbar">
        <select className="select" value={student} onChange={(e) => setStudent(e.target.value)}>
          <option value="">All {labels.memberPlural.toLowerCase()}</option>
          {(students || []).map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
        <select className="select" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="">Any method</option>
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
          <option value="bank">Bank transfer</option>
          <option value="other">Other</option>
        </select>
        <div className="hstack" style={{ gap: 6 }}>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} title="From" />
          <span style={{ color: 'var(--text-faint)' }}>→</span>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} title="To" />
        </div>
        {hasFilters && (
          <Button
            variant="subtle"
            icon={X}
            onClick={() => {
              setStudent('');
              setMethod('');
              setFrom('');
              setTo('');
            }}
          >
            Clear
          </Button>
        )}
      </div>

      <Card
        subtitle={`${rows.length} payments · ${money(total)} collected`}
        bodyClass="tight"
        title="Transactions"
      >
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No payments found"
            hint={hasFilters ? 'Try widening your filters.' : 'Record your first payment to get started.'}
          />
        ) : (
          <div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Paid on</th>
                  <th>Student</th>
                  <th>For month</th>
                  <th>Method</th>
                  <th className="right">Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p._id}>
                    <td className="muted" data-label="Paid on">{formatDate(p.paidAt)}</td>
                    <td className="cell-main">
                      {p.student ? (
                        <Link to={`/students/${p.student._id}`} className="link">
                          {p.student.name}
                        </Link>
                      ) : (
                        <span className="muted">Deleted student</span>
                      )}
                      {p.student?.classPlan?.name && (
                        <span className="tag-pill">{p.student.classPlan.name}</span>
                      )}
                    </td>
                    <td className="muted" data-label="For month">{monthLabel(p.forMonth)}</td>
                    <td data-label="Method">
                      <Badge tone="neutral">{p.method}</Badge>
                    </td>
                    <td className="right num" data-label="Amount">{money(p.amount)}</td>
                    <td className="right cell-actions">
                      <Button
                        variant="subtle"
                        size="sm"
                        icon={Trash2}
                        title="Remove"
                        onClick={() => setToDelete(p)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {picking && (
        <StudentPickModal
          students={students || []}
          labels={labels}
          onClose={() => setPicking(false)}
          onPick={(s) => {
            setPicking(false);
            setPayFor(s);
          }}
        />
      )}
      {payFor && (
        <PaymentModal student={payFor} onClose={() => setPayFor(null)} onSaved={refetch} />
      )}
      {toDelete && (
        <ConfirmDialog
          title="Remove payment?"
          message={`Remove the ${money(toDelete.amount)} payment${
            toDelete.student ? ` from ${toDelete.student.name}` : ''
          }?`}
          confirmLabel="Remove"
          onConfirm={confirmDelete}
          onClose={() => setToDelete(null)}
        />
      )}
    </>
  );
}
