import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Send, BellRing, History, CheckCircle2 } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { DashboardAPI, RemindersAPI } from '../api/endpoints.js';
import { useSettings } from '../context/SettingsContext.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import SubscriptionBar from '../components/ui/SubscriptionBar.jsx';
import { Spinner } from '../components/ui/Loader.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ReminderModal from '../components/students/ReminderModal.jsx';
import { formatDate, initials } from '../lib/format.js';

const LOG_TONE = { sent: 'active', simulated: 'sky', failed: 'expired' };

function relTime(d) {
  const then = new Date(d).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return formatDate(d);
}

export default function Reminders() {
  const { settings, labels } = useSettings();
  const [within, setWithin] = useState(7);
  const [selected, setSelected] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const { data: expiring, loading } = useApi(() => DashboardAPI.expiring({ within }), [within]);
  const { data: logs, loading: logsLoading, refetch: refetchLogs } = useApi(
    () => RemindersAPI.list({ limit: 40 }),
    []
  );

  const list = expiring || [];
  const allSelected = list.length > 0 && selected.length === list.length;
  const selectedStudents = useMemo(
    () => list.filter((s) => selected.includes(s._id)),
    [list, selected]
  );

  function toggle(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function toggleAll() {
    setSelected(allSelected ? [] : list.map((s) => s._id));
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Retention</div>
          <h2>Reminders</h2>
          <p>Nudge {labels.memberPlural.toLowerCase()} before {labels.subscriptionLabel.toLowerCase()} lapses — over WhatsApp or SMS.</p>
        </div>
        <Button
          variant="primary"
          icon={Send}
          disabled={selected.length === 0}
          onClick={() => setShowModal(true)}
        >
          Send {selected.length > 0 ? `(${selected.length})` : ''}
        </Button>
      </div>

      <div className="grid dash-cols">
        <Card
          title="Due for a reminder"
          subtitle={`Subscriptions expiring within the window`}
          actions={
            <select
              className="select head-select"
              value={within}
              onChange={(e) => {
                setWithin(Number(e.target.value));
                setSelected([]);
              }}
            >
              <option value={3}>Next 3 days</option>
              <option value={7}>Next 7 days</option>
              <option value={14}>Next 14 days</option>
              <option value={30}>Next 30 days</option>
              <option value={9999}>Everyone active</option>
            </select>
          }
          bodyClass="tight"
        >
          {loading ? (
            <Spinner />
          ) : list.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All caught up"
              hint="No active students fall in this window right now."
            />
          ) : (
            <>
              <label
                className="hstack"
                style={{ gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border-soft)', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  style={{ accentColor: 'var(--saffron)' }}
                />
                <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                  Select all ({list.length})
                </span>
              </label>
              <div className="table-scroll">
                <table className="tbl select-tbl">
                  <tbody>
                    {list.map((s) => (
                      <tr key={s._id}>
                        <td className="cell-check">
                          <input
                            type="checkbox"
                            checked={selected.includes(s._id)}
                            onChange={() => toggle(s._id)}
                            style={{ accentColor: 'var(--saffron)' }}
                          />
                        </td>
                        <td className="cell-main">
                          <Link to={`/students/${s._id}`} className="person" style={{ color: 'inherit' }}>
                            <div className="avatar">{initials(s.name)}</div>
                            <div className="who">
                              <span className="nm">{s.name}</span>
                              <span className="sub">{s.parentName} · {s.parentPhone}</span>
                            </div>
                          </Link>
                        </td>
                        <td className="cell-runway" data-label="Subscription">
                          <SubscriptionBar days={s.remainingDays} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>

        <Card
          title="Recent reminders"
          subtitle="Delivery log"
          actions={<History size={16} style={{ color: 'var(--text-faint)' }} />}
          bodyClass="tight"
        >
          {logsLoading ? (
            <Spinner />
          ) : (logs || []).length === 0 ? (
            <EmptyState icon={BellRing} title="No reminders sent yet" hint="Select students and send your first nudge." />
          ) : (
            <div style={{ maxHeight: 520, overflowY: 'auto' }}>
              {logs.map((l) => (
                <div key={l._id} className="expiry-row" style={{ gridTemplateColumns: '1fr auto' }}>
                  <div>
                    <div className="hstack wrap" style={{ gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>{l.student?.name || 'Unknown'}</span>
                      <Badge tone={LOG_TONE[l.status] || 'neutral'}>{l.status}</Badge>
                      <Badge tone="neutral">{l.channel}</Badge>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 4, maxWidth: '46ch' }}>
                      {l.message?.slice(0, 90)}
                      {l.message?.length > 90 ? '…' : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', whiteSpace: 'nowrap', justifySelf: 'end' }}>
                    {relTime(l.sentAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {showModal && (
        <ReminderModal
          students={selectedStudents}
          onClose={() => setShowModal(false)}
          onSent={() => {
            setSelected([]);
            refetchLogs();
          }}
        />
      )}
    </>
  );
}
