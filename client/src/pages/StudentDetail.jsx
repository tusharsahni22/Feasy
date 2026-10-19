import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  IndianRupee,
  Send,
  Phone,
  User,
  Receipt,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { StudentsAPI, PaymentsAPI } from '../api/endpoints.js';
import { useSettings } from '../context/SettingsContext.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge, { StatusBadge } from '../components/ui/Badge.jsx';
import SubscriptionBar from '../components/ui/SubscriptionBar.jsx';
import { Loading } from '../components/ui/Loader.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import PaymentModal from '../components/students/PaymentModal.jsx';
import ReminderModal from '../components/students/ReminderModal.jsx';
import DietPlanModal from '../components/students/DietPlanModal.jsx';
import { PLAN_LABELS, PLAN_MONTHS } from '../lib/constants.js';
import { money as moneyFmt, formatDate, initials } from '../lib/format.js';
import { Utensils } from 'lucide-react';

function monthLabel(key) {
  if (!key) return '—';
  const d = new Date(`${key}-01T00:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { money, labels } = useSettings();

  const { data: student, loading, refetch } = useApi(() => StudentsAPI.get(id), [id]);
  const {
    data: payments,
    loading: payLoading,
    refetch: refetchPayments,
  } = useApi(() => StudentsAPI.payments(id), [id]);

  const [showPay, setShowPay] = useState(false);
  const [showRemind, setShowRemind] = useState(false);
  const [showDiet, setShowDiet] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [payToDelete, setPayToDelete] = useState(null);
  const [confirmPause, setConfirmPause] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  if (loading || !student) return <Loading label="Loading profile…" />;

  const windowDays = (PLAN_MONTHS[student.plan] || 1) * 30;
  const totalPaid = (payments || []).reduce((s, p) => s + (p.amount || 0), 0);

  function afterChange() {
    refetch();
    refetchPayments();
  }

  async function togglePause() {
    const nextStatus = student.status === 'paused' ? 'active' : 'paused';
    setTogglingStatus(true);
    try {
      await StudentsAPI.update(id, { status: nextStatus });
      toast.success(
        nextStatus === 'paused'
          ? 'Membership paused (student on leave)'
          : 'Membership resumed (student active)'
      );
      setConfirmPause(false);
      afterChange();
    } catch (e) {
      toast.error(e.message || 'Could not update membership status');
    } finally {
      setTogglingStatus(false);
    }
  }

  async function doDelete() {
    setDeleting(true);
    try {
      await StudentsAPI.remove(id);
      toast.success('Student deleted');
      navigate('/students');
    } catch (e) {
      toast.error(e.message || 'Could not delete');
      setDeleting(false);
    }
  }

  async function deletePayment() {
    if (!payToDelete) return;
    try {
      await PaymentsAPI.remove(payToDelete._id);
      toast.success('Payment removed');
      setPayToDelete(null);
      afterChange();
    } catch (e) {
      toast.error(e.message || 'Could not remove payment');
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <Link to="/students" className="link" style={{ fontSize: 13 }}>
            <span className="hstack" style={{ gap: 5 }}>
              <ArrowLeft size={14} /> All students
            </span>
          </Link>
          <div className="hstack" style={{ gap: 14, marginTop: 8 }}>
            <div className="avatar" style={{ width: 52, height: 52, fontSize: 18 }}>
              {initials(student.name)}
            </div>
            <div>
              <h2 style={{ marginBottom: 4 }}>{student.name}</h2>
              <div className="hstack wrap" style={{ gap: 8 }}>
                <Badge tone="sky">{student.classPlan?.name || '—'}</Badge>
                <StatusBadge status={student.subscriptionStatus} />
                <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>
                  {money(student.monthlyFee)}/mo
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="hstack wrap">
          {student.status === 'paused' ? (
            <Button
              variant="ghost"
              icon={PlayCircle}
              onClick={togglePause}
              disabled={togglingStatus}
            >
              Resume membership
            </Button>
          ) : (
            <Button
              variant="ghost"
              icon={PauseCircle}
              onClick={() => setConfirmPause(true)}
              disabled={togglingStatus}
            >
              Pause membership
            </Button>
          )}
          <Button variant="ghost" icon={Utensils} onClick={() => setShowDiet(true)}>
            Diet Plan
          </Button>
          <Button variant="ghost" icon={Send} onClick={() => setShowRemind(true)}>
            Remind
          </Button>
          <Button variant="ghost" icon={Pencil} onClick={() => navigate(`/students/${id}/edit`)}>
            Edit
          </Button>
          <Button variant="primary" icon={IndianRupee} onClick={() => setShowPay(true)}>
            Record payment
          </Button>
          <Button variant="danger" icon={Trash2} title="Delete" onClick={() => setConfirmDel(true)} />
        </div>
      </div>

      <div className="grid dash-cols">
        <div className="stack">
          <Card title={labels.subscriptionLabel}>
            <div style={{ marginBottom: 18 }}>
              <SubscriptionBar days={student.remainingDays} windowDays={windowDays} />
            </div>
            <div className="grid grid-3" style={{ gap: 14 }}>
              <div className="kv">
                <span className="k">Plan</span>
                <span className="v">{PLAN_LABELS[student.plan] || student.plan}</span>
              </div>
              <div className="kv">
                <span className="k">Started</span>
                <span className="v">{formatDate(student.subscriptionStart)}</span>
              </div>
              <div className="kv">
                <span className="k">Renews on</span>
                <span className="v">{formatDate(student.subscriptionEnd)}</span>
              </div>
            </div>
          </Card>

          <Card
            title="Payment history"
            subtitle={`${(payments || []).length} payments · ${money(totalPaid)} total`}
            actions={
              <Button variant="subtle" size="sm" icon={IndianRupee} onClick={() => setShowPay(true)}>
                Add
              </Button>
            }
            bodyClass="tight"
          >
            {payLoading ? (
              <div style={{ padding: 24 }}>
                <div className="spinner" />
              </div>
            ) : (payments || []).length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No payments yet"
                hint={`Record the first payment to start tracking this ${labels.memberSingular.toLowerCase()}’s dues.`}
              />
            ) : (
              <div className="table-scroll">
                <table className="tbl" style={{ '--tbl-min': '460px' }}>
                  <thead>
                    <tr>
                      <th>Paid on</th>
                      <th>For month</th>
                      <th className="right">Amount</th>
                      <th>Method</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p._id}>
                        <td className="cell-main">
                          {formatDate(p.paidAt)}
                          {p.renewed && (
                            <Badge tone="violet">renewed</Badge>
                          )}
                        </td>
                        <td className="muted" data-label="For month">{monthLabel(p.forMonth)}</td>
                        <td className="right num" data-label="Amount">
                          {money(p.amount)}
                          {p.discountAmount > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--emerald)' }}>
                              Coupon: {p.discountCode} (-{money(p.discountAmount)})
                            </div>
                          )}
                        </td>
                        <td data-label="Method">
                          <Badge tone="neutral">{p.method}</Badge>
                        </td>
                        <td className="right cell-actions">
                          <Button
                            variant="subtle"
                            size="sm"
                            icon={Trash2}
                            title="Remove payment"
                            onClick={() => setPayToDelete(p)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="stack">
          <Card title={`${labels.feeLabel} breakdown`}>
            <div className="breakdown">
              <div className="row">
                <span className="k">{labels.categorySingular} base {labels.feeLabel.toLowerCase()}</span>
                <span className="v">{money(student.baseFee)}</span>
              </div>
              {(student.subjects || []).map((s) => (
                <div className="row" key={s._id}>
                  <span className="k" style={{ paddingLeft: 4 }}>
                    {s.name}
                  </span>
                  <span className="v">+{money(s.addOnFee)}</span>
                </div>
              ))}
              <div className="row total">
                <span className="k">Monthly {labels.feeLabel.toLowerCase()}</span>
                <span className="v">{money(student.monthlyFee)}</span>
              </div>
            </div>
          </Card>

          <Card title="Details">
            <div className="stack" style={{ gap: 16 }}>
              <div className="hstack" style={{ gap: 12 }}>
                <span className="stat-icon" style={{ '--tone-soft': 'var(--sky-soft)', '--tone': 'var(--sky)' }}>
                  <User size={18} />
                </span>
                <div className="kv">
                  <span className="k">{labels.contactPersonLabel}</span>
                  <span className="v">{student.parentName}</span>
                </div>
              </div>
              <div className="hstack" style={{ gap: 12 }}>
                <span className="stat-icon" style={{ '--tone-soft': 'var(--emerald-soft)', '--tone': 'var(--emerald)' }}>
                  <Phone size={18} />
                </span>
                <div className="kv">
                  <span className="k">Contact</span>
                  <span className="v">{student.parentPhone}</span>
                </div>
              </div>

              <div className="hstack" style={{ gap: 12 }}>
                <span className="stat-icon" style={{ '--tone-soft': 'var(--rose-soft)', '--tone': 'var(--rose)' }}>
                  <User size={18} />
                </span>
                <div className="kv">
                  <span className="k">Blood Group</span>
                  <span className="v">{student.bloodGroup || 'Unknown'}</span>
                </div>
              </div>

              <div className="kv">
                <span className="k">Shift / Batch Timing</span>
                <span className="v" style={{ fontSize: 13, fontWeight: 500 }}>
                  {student.shiftTiming || 'General'}
                </span>
              </div>

              <div className="kv">
                <span className="k">Member Barcode / QR ID</span>
                <span className="v" style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--saffron)' }}>
                  {student.barcode || '—'}
                </span>
              </div>

              <div>
                <span className="k" style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                  {labels.itemPlural.toUpperCase()}
                </span>
                <div style={{ marginTop: 6 }}>
                  {(student.subjects || []).length ? (
                    student.subjects.map((s) => (
                      <span key={s._id} className="tag-pill">
                        {s.name}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-faint)' }}>No {labels.itemPlural.toLowerCase()}</span>
                  )}
                </div>
              </div>

              {student.notes && (
                <div className="kv">
                  <span className="k">Notes</span>
                  <span className="v" style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-dim)' }}>
                    {student.notes}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {showPay && (
        <PaymentModal student={student} onClose={() => setShowPay(false)} onSaved={afterChange} />
      )}
      {showRemind && (
        <ReminderModal students={[student]} onClose={() => setShowRemind(false)} />
      )}
      {showDiet && (
        <DietPlanModal student={student} onClose={() => setShowDiet(false)} onUpdated={afterChange} />
      )}
      {confirmPause && (
        <ConfirmDialog
          title="Pause membership?"
          message={`Mark ${student.name}'s membership as paused / on leave? Reminders will be paused and you can renew with a fresh restart date whenever they return.`}
          confirmLabel="Pause membership"
          variant="subtle"
          busy={togglingStatus}
          onConfirm={togglePause}
          onClose={() => !togglingStatus && setConfirmPause(false)}
        />
      )}
      {confirmDel && (
        <ConfirmDialog
          title={`Delete ${labels.memberSingular.toLowerCase()}?`}
          message={`This permanently removes ${student.name} and all their payment & reminder records.`}
          confirmLabel={`Delete ${labels.memberSingular.toLowerCase()}`}
          busy={deleting}
          onConfirm={doDelete}
          onClose={() => !deleting && setConfirmDel(false)}
        />
      )}
      {payToDelete && (
        <ConfirmDialog
          title="Remove payment?"
          message={`Remove the ${moneyFmt(payToDelete.amount)} payment from ${formatDate(payToDelete.paidAt)}?`}
          confirmLabel="Remove"
          onConfirm={deletePayment}
          onClose={() => setPayToDelete(null)}
        />
      )}
    </>
  );
}
