import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Calendar,
  Search,
  RefreshCw,
} from 'lucide-react';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import { AttendanceAPI } from '../api/endpoints.js';
import { formatDate } from '../lib/format.js';
import { useSettings } from '../context/SettingsContext.jsx';

export default function Attendance() {
  const { labels } = useSettings();
  const [scanCode, setScanCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [todayLogs, setTodayLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const inputRef = useRef(null);

  // Auto focus input on load and after scan for barcode guns
  useEffect(() => {
    inputRef.current?.focus();
    loadTodayAttendance();
  }, []);

  async function loadTodayAttendance() {
    setLoadingLogs(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await AttendanceAPI.list({ date: today });
      setTodayLogs(res.records || []);
    } catch {
      // ignore
    } finally {
      setLoadingLogs(false);
    }
  }

  async function handleScan(e) {
    e.preventDefault();
    if (!scanCode.trim()) return;

    setScanning(true);
    try {
      const res = await AttendanceAPI.scan({ code: scanCode.trim(), method: 'barcode' });
      setLastScanResult(res);
      if (res.action === 'checked_in') {
        toast.success(`Check-In: ${res.student.name}`);
      } else if (res.action === 'checked_out') {
        toast.success(`Check-Out: ${res.student.name}`);
      } else {
        toast(res.message);
      }
      setScanCode('');
      loadTodayAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Scan failed');
    } finally {
      setScanning(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="page-head">
        <div>
          <div className="eyebrow">Smart Access &amp; Operations</div>
          <h2>Barcode / QR Attendance Scanner</h2>
          <p>
            Scan member barcodes, RFID cards, or member IDs. Compatible with USB barcode guns and mobile scanners.
          </p>
        </div>
        <Button variant="ghost" icon={RefreshCw} onClick={loadTodayAttendance} disabled={loadingLogs}>
          Refresh logs
        </Button>
      </div>

      <div className="grid dash-cols">
        {/* Scanner card */}
        <Card title="Quick Scanner Station">
          <form onSubmit={handleScan} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  ref={inputRef}
                  className="input"
                  style={{
                    fontSize: 18,
                    padding: '14px 16px',
                    fontFamily: 'monospace',
                    letterSpacing: '1px',
                  }}
                  placeholder="Scan barcode or enter Member ID..."
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  autoFocus
                />
              </div>
              <Button
                variant="primary"
                type="submit"
                icon={ScanLine}
                disabled={scanning || !scanCode.trim()}
                style={{ padding: '0 24px' }}
              >
                {scanning ? 'Scanning…' : 'Scan'}
              </Button>
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-dim)' }}>
              ⚡ Works automatically with USB/Bluetooth barcode guns (presses Enter on scan).
            </div>
          </form>

          {lastScanResult && (
            <div
              style={{
                background:
                  lastScanResult.action === 'checked_in'
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'rgba(59, 130, 246, 0.08)',
                border:
                  lastScanResult.action === 'checked_in'
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 12,
                padding: 18,
                marginTop: 14,
              }}
            >
              <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="hstack" style={{ gap: 8 }}>
                  <CheckCircle2
                    size={22}
                    color={
                      lastScanResult.action === 'checked_in'
                        ? 'var(--emerald)'
                        : 'var(--sky)'
                    }
                  />
                  <strong style={{ fontSize: 17 }}>{lastScanResult.student?.name}</strong>
                </div>
                <Badge tone={lastScanResult.action === 'checked_in' ? 'emerald' : 'sky'}>
                  {lastScanResult.action === 'checked_in' ? 'CHECKED IN' : 'CHECKED OUT'}
                </Badge>
              </div>

              <div className="grid grid-3" style={{ gap: 10, fontSize: 13 }}>
                <div>
                  <span style={{ color: 'var(--text-faint)' }}>Plan / Tier:</span>{' '}
                  <strong>{lastScanResult.student?.classPlan?.name || 'Standard'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-faint)' }}>Blood Group:</span>{' '}
                  <strong>{lastScanResult.student?.bloodGroup || 'Unknown'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-faint)' }}>Shift:</span>{' '}
                  <strong>{lastScanResult.student?.shiftTiming || 'General'}</strong>
                </div>
              </div>

              {lastScanResult.isExpired && (
                <div
                  className="callout warn"
                  style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <AlertTriangle size={18} />
                  <span>
                    <strong>Attention:</strong> Membership expired on{' '}
                    {formatDate(lastScanResult.student?.subscriptionEnd)}. Please collect renewal fee!
                  </span>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Daily Stats Card */}
        <Card title="Today's Attendance Summary">
          <div className="stack" style={{ gap: 16 }}>
            <div className="hstack" style={{ justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-high)' }}>
                  {todayLogs.length}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                  Total Visits Today ({new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})
                </div>
              </div>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'var(--saffron-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--saffron)',
                }}
              >
                <UserCheck size={26} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Recent Check-Ins
              </div>
              {todayLogs.slice(0, 5).map((log) => (
                <div
                  key={log._id}
                  className="hstack"
                  style={{
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border-faint)',
                    fontSize: 13,
                  }}
                >
                  <div>
                    <strong>{log.studentId?.name || 'Member'}</strong>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                      Shift: {log.studentId?.shiftTiming || 'General'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--emerald)' }}>
                      {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {log.checkOut && (
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        Out: {new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Attendance History Table */}
      <Card title="Today's Detailed Log" subtitle="Real-time access stamps">
        {loadingLogs ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div className="spinner" />
          </div>
        ) : todayLogs.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)' }}>
            No check-ins recorded yet today. Scan a barcode above to begin!
          </div>
        ) : (
          <div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Contact</th>
                  <th>Blood Group</th>
                  <th>Shift</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {todayLogs.map((log) => (
                  <tr key={log._id}>
                    <td className="cell-main">
                      <strong>{log.studentId?.name}</strong>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-dim)' }}>
                        {log.studentId?.barcode || '—'}
                      </div>
                    </td>
                    <td>{log.studentId?.parentPhone || '—'}</td>
                    <td>
                      <Badge tone={log.studentId?.bloodGroup !== 'Unknown' ? 'rose' : 'neutral'}>
                        {log.studentId?.bloodGroup || '—'}
                      </Badge>
                    </td>
                    <td>{log.studentId?.shiftTiming || 'General'}</td>
                    <td style={{ color: 'var(--emerald)', fontWeight: 600 }}>
                      {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      {log.checkOut ? (
                        new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      ) : (
                        <Badge tone="sky">Currently Inside</Badge>
                      )}
                    </td>
                    <td>
                      <Badge tone="neutral">{log.method}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
