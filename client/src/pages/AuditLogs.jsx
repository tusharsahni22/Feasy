import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Clock,
  History,
} from 'lucide-react';
import { AuditLogsAPI } from '../api/endpoints.js';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import { Spinner } from '../components/ui/Loader.jsx';

function formatTimestamp(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function actionTone(action) {
  if (action.includes('delete') || action.includes('remove')) return 'danger';
  if (action.includes('create') || action.includes('add')) return 'active';
  return 'warn';
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  async function loadLogs() {
    setLoading(true);
    try {
      const params = filterType ? { entityType: filterType } : {};
      const data = await AuditLogsAPI.list(params);
      setLogs(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [filterType]);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Security &amp; Accountability</div>
          <h2>Activity &amp; Audit Logs</h2>
          <p>
            Real-time chronological record of who created, updated, or deleted records in this workspace.
          </p>
        </div>
        <div className="hstack" style={{ gap: 10 }}>
          <select
            className="select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Entities</option>
            <option value="Member">Members</option>
            <option value="Student">Students (Legacy)</option>
            <option value="Payment">Payments &amp; Fees</option>
            <option value="User">Team Members</option>
          </select>
        </div>
      </div>

      <Card
        title="Recent System Changes"
        subtitle={`${logs.length} logged event(s)`}
        bodyClass="tight"
      >
        {loading ? (
          <Spinner />
        ) : logs.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)' }}>
            No audit records found.
          </div>
        ) : (
          <div className="table-scroll">
            <table className="tbl" style={{ '--tbl-min': '700px' }}>
              <thead>
                <tr>
                  <th>User / Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="cell-main">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, width: '100%', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{log.userName}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
                            {log.userEmail || log.userRole || 'System'}
                          </div>
                        </div>
                        <div className="hstack" style={{ gap: 5, fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                          <Clock size={12} style={{ color: 'var(--text-faint)' }} />
                          {formatTimestamp(log.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td data-label="Action">
                      <Badge tone={actionTone(log.action)}>
                        {log.action}
                      </Badge>
                    </td>
                    <td data-label="Entity">
                      <span className="tag-pill">
                        {log.entityType}
                      </span>
                    </td>
                    <td data-label="Details" style={{ fontSize: 13, minWidth: 0, overflowWrap: 'anywhere' }}>
                      <div style={{ wordBreak: 'break-word' }}>{log.description}</div>
                      {log.changes && (
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 11.5,
                            fontFamily: 'monospace',
                            color: 'var(--text-dim)',
                            background: 'var(--surface-2)',
                            padding: '4px 8px',
                            borderRadius: 6,
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {JSON.stringify(log.changes)}
                        </div>
                      )}
                    </td>
                    <td data-label="Time" style={{ fontSize: 12.5, whiteSpace: 'nowrap', color: 'var(--text-dim)' }}>
                      <div className="hstack" style={{ gap: 6 }}>
                        <Clock size={13} style={{ color: 'var(--text-faint)' }} />
                        {formatTimestamp(log.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
