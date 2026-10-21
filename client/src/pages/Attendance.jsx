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
  LogOut,
  Users,
  CheckSquare,
  XSquare,
  Plus,
  QrCode,
  Printer,
  ExternalLink,
} from 'lucide-react';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import Field from '../components/ui/Field.jsx';
import { AttendanceAPI, StudentsAPI } from '../api/endpoints.js';
import { formatDate } from '../lib/format.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getCurrentTimeString() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function Attendance() {
  const { labels, settings } = useSettings();
  const { tenant } = useAuth();
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner' | 'roster' | 'manual'
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [scanCode, setScanCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  // Desk QR Code Printable Poster state
  const [showDeskQr, setShowDeskQr] = useState(false);

  // Manual Check-In Modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    studentId: '',
    checkInTime: getCurrentTimeString(),
    checkOutTime: '',
    notes: '',
  });

  const inputRef = useRef(null);

  useEffect(() => {
    loadData();
    if (activeTab === 'scanner') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedDate, activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      const [attRes, stuRes] = await Promise.all([
        AttendanceAPI.list({ date: selectedDate }),
        StudentsAPI.list(),
      ]);
      setAttendanceLogs(attRes.records || []);
      setStudents(stuRes || []);
    } catch (err) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
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
        toast.success(`Check-In: ${res.student.name} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      } else if (res.action === 'checked_out') {
        toast.success(`Check-Out: ${res.student.name} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      } else {
        toast(res.message);
      }
      setScanCode('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Scan failed');
    } finally {
      setScanning(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  // Quick 1-Click Check-In from Roster
  async function quickCheckIn(student) {
    setMarkingId(student._id);
    try {
      const res = await AttendanceAPI.scan({ code: student.barcode || student._id, method: 'manual' });
      toast.success(`${student.name} checked in!`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Check-in failed');
    } finally {
      setMarkingId(null);
    }
  }

  // Quick 1-Click Check-Out from Active Logs
  async function quickCheckOut(log) {
    setMarkingId(log._id);
    try {
      await AttendanceAPI.checkOut(log._id, { checkOut: new Date() });
      toast.success(`${log.studentId?.name || 'Member'} checked out!`);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Check-out failed');
    } finally {
      setMarkingId(null);
    }
  }

  // Mark all unrecorded students as present or custom time
  async function markAllPresent() {
    if (!window.confirm(`Mark all ${students.length} students as Present for ${selectedDate}?`)) return;
    setLoading(true);
    try {
      const defaultCheckIn = new Date(`${selectedDate}T09:00:00`);
      const defaultCheckOut = new Date(`${selectedDate}T17:00:00`);
      const entries = students.map((s) => ({
        studentId: s._id,
        status: 'present',
        checkIn: defaultCheckIn,
        checkOut: defaultCheckOut,
      }));
      await AttendanceAPI.bulk({ entries, date: selectedDate });
      toast.success(`Marked all ${students.length} students present!`);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Bulk mark failed');
    } finally {
      setLoading(false);
    }
  }

  // Submit custom manual modal
  async function submitManual(e) {
    e.preventDefault();
    if (!manualForm.studentId) {
      toast.error('Select a member');
      return;
    }

    try {
      const inDate = new Date(`${selectedDate}T${manualForm.checkInTime || '09:00'}:00`);
      const outDate = manualForm.checkOutTime
        ? new Date(`${selectedDate}T${manualForm.checkOutTime}:00`)
        : undefined;

      await AttendanceAPI.manual({
        studentId: manualForm.studentId,
        date: selectedDate,
        checkIn: inDate,
        checkOut: outDate,
        notes: manualForm.notes,
      });

      toast.success('Attendance recorded');
      setShowManualModal(false);
      setManualForm({
        studentId: '',
        checkInTime: getCurrentTimeString(),
        checkOutTime: '',
        notes: '',
      });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save');
    }
  }

  const activeInFacility = attendanceLogs.filter((l) => !l.checkOut);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="page-head">
        <div>
          <div className="eyebrow">Smart Access &amp; Operations</div>
          <h2>Student &amp; Member Attendance</h2>
          <p>
            Track in/out times, calculate duration, scan barcodes, or manage complete daily attendance rosters.
          </p>
        </div>
        <div className="hstack wrap" style={{ gap: 10 }}>
          <div className="hstack" style={{ gap: 6, background: 'var(--bg-elevated)', padding: '6px 10px', borderRadius: 8 }}>
            <Calendar size={16} color="var(--text-dim)" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--text-high)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            />
          </div>
          <Button
            variant="primary"
            icon={QrCode}
            onClick={() => setShowDeskQr(true)}
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}
          >
            Desk QR Poster
          </Button>
          <Button variant="ghost" icon={Plus} onClick={() => setShowManualModal(true)}>
            Record Manual Time
          </Button>
          <Button variant="ghost" icon={RefreshCw} onClick={loadData} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="hstack wrap" style={{ gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab('scanner')}
          className={`btn ${activeTab === 'scanner' ? 'btn-primary' : 'btn-subtle'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ScanLine size={16} /> Barcode Scanner
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className={`btn ${activeTab === 'roster' ? 'btn-primary' : 'btn-subtle'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Users size={16} /> Full Class Roster ({students.length})
        </button>
      </div>

      {activeTab === 'scanner' && (
        <div className="grid dash-cols">
          {/* Scanner / Reception Quick Check Card */}
          <Card
            title="Desk Scanner & Quick Check-In"
            subtitle="USB Barcode Gun, RFID, or Member Search"
            actions={
              <Button
                variant="subtle"
                size="sm"
                icon={QrCode}
                onClick={() => setShowDeskQr(true)}
              >
                Print Desk QR
              </Button>
            }
          >
            <form onSubmit={handleScan} style={{ marginBottom: 16 }}>
              <div className="scan-form-row" style={{ display: 'flex', gap: 10 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    ref={inputRef}
                    className="input"
                    style={{
                      fontSize: 16,
                      padding: '12px 14px',
                      fontFamily: 'monospace',
                    }}
                    placeholder={`Enter ${labels.memberSingular.toLowerCase()} phone or barcode (e.g. 9876543210)`}
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
                >
                  {scanning ? '...' : 'Check In / Out'}
                </Button>
              </div>
            </form>

            {/* Zero Hardware Banner Callout */}
            <div
              className="banner-responsive"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                marginBottom: 16,
              }}
            >
              <div className="hstack" style={{ gap: 10 }}>
                <QrCode size={24} color="var(--emerald)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-high)' }}>
                    Zero Hardware Setup Active
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                    Students can scan the Desk QR code using their own smartphone camera.
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={Printer}
                onClick={() => setShowDeskQr(true)}
              >
                Poster
              </Button>
            </div>

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
                  padding: 16,
                  marginTop: 8,
                }}
              >
                <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                  <div className="hstack" style={{ gap: 8 }}>
                    <CheckCircle2
                      size={20}
                      color={lastScanResult.action === 'checked_in' ? 'var(--emerald)' : 'var(--sky)'}
                    />
                    <strong style={{ fontSize: 16 }}>{lastScanResult.student?.name}</strong>
                  </div>
                  <Badge tone={lastScanResult.action === 'checked_in' ? 'emerald' : 'sky'}>
                    {lastScanResult.action === 'checked_in' ? 'CHECKED IN' : 'CHECKED OUT'}
                  </Badge>
                </div>

                <div className="grid grid-4" style={{ gap: 8, fontSize: 13 }}>
                  <div>
                    <span style={{ color: 'var(--text-faint)' }}>Shift:</span>{' '}
                    <strong>{lastScanResult.student?.shiftTiming || 'General'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-faint)' }}>Blood Group:</span>{' '}
                    <strong>{lastScanResult.student?.bloodGroup || 'Unknown'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-faint)' }}>Time:</span>{' '}
                    <strong>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-faint)' }}>Days Available:</span>{' '}
                    {lastScanResult.isExpired ? (
                      <span style={{ color: 'var(--rose)', fontWeight: 700 }}>Expired</span>
                    ) : (
                      <strong style={{ color: (lastScanResult.student?.remainingDays ?? lastScanResult.remainingDays ?? 0) <= 7 ? 'var(--amber)' : 'var(--emerald)', fontSize: 14 }}>
                        {lastScanResult.student?.remainingDays ?? lastScanResult.remainingDays ?? 0} days
                      </strong>
                    )}
                  </div>
                </div>

                {lastScanResult.isExpired ? (
                  <div className="callout warn" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={16} />
                    <span>
                      Membership expired on {formatDate(lastScanResult.student?.subscriptionEnd)}! Collect renewal.
                    </span>
                  </div>
                ) : (lastScanResult.student?.remainingDays ?? lastScanResult.remainingDays ?? 0) <= 7 ? (
                  <div
                    style={{
                      marginTop: 10,
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: 'var(--amber)',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <AlertTriangle size={15} />
                    <span>
                      Membership expiring soon ({lastScanResult.student?.remainingDays ?? lastScanResult.remainingDays} days left until {formatDate(lastScanResult.student?.subscriptionEnd)}).
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </Card>

          {/* Quick Stats Card */}
          <Card title="Live Facility Metrics" subtitle={`Occupancy & Daily Traffic`}>
            <div className="grid grid-2" style={{ gap: 14 }}>
              <div
                style={{
                  background: 'var(--bg-elevated)',
                  padding: 16,
                  borderRadius: 10,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}>CURRENTLY INSIDE</span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--emerald)', display: 'inline-block' }} />
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--emerald)', lineHeight: 1 }}>
                  {activeInFacility.length}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>Active in facility now</div>
              </div>

              <div
                style={{
                  background: 'var(--bg-elevated)',
                  padding: 16,
                  borderRadius: 10,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}>TOTAL CHECK-INS</span>
                  <UserCheck size={14} color="var(--text-dim)" />
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-high)', lineHeight: 1 }}>
                  {attendanceLogs.length}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>Recorded today</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14, marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>
                  Active Members ({activeInFacility.length})
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>1-Click Check Out</span>
              </div>

              {activeInFacility.length === 0 ? (
                <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                  No members currently inside.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                  {activeInFacility.map((log) => (
                    <div
                      key={log._id}
                      className="hstack"
                      style={{
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'var(--bg-elevated)',
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    >
                      <div>
                        <strong>{log.studentId?.name || 'Member'}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          In: {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {log.studentId?.shiftTiming ? ` · ${log.studentId.shiftTiming}` : ''}
                        </div>
                      </div>
                      <Button
                        variant="subtle"
                        size="sm"
                        icon={LogOut}
                        onClick={() => quickCheckOut(log)}
                        disabled={markingId === log._id}
                      >
                        Check Out
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Roster View: All Students with Time & Status */}
      {activeTab === 'roster' && (
        <Card
          title={`All Students Daily Roster (${selectedDate})`}
          subtitle="Check in any student directly, review in/out time stamps and total time spent"
          actions={
            <Button variant="ghost" size="sm" icon={CheckSquare} onClick={markAllPresent}>
              Mark All Present
            </Button>
          }
        >
          <div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Student / Member</th>
                  <th>Contact</th>
                  <th>Shift Timing</th>
                  <th>Days Left</th>
                  <th>Check-In Time</th>
                  <th>Check-Out Time</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th className="right">Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const log = attendanceLogs.find(
                    (l) => String(l.studentId?._id || l.studentId) === String(student._id)
                  );
                  const isPresent = Boolean(log);
                  const isInside = log && !log.checkOut;

                  // Compute membership days remaining
                  const now = new Date();
                  const subEnd = student.subscriptionEnd ? new Date(student.subscriptionEnd) : null;
                  const isExpired = subEnd ? subEnd < now : false;
                  const diffDays = subEnd ? Math.ceil((subEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                  const daysLeft = isExpired ? 0 : Math.max(0, diffDays);

                  return (
                    <tr key={student._id}>
                      <td className="cell-main">
                        <strong>{student.name}</strong>
                        <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-dim)' }}>
                          {student.barcode || student._id.slice(-6)}
                        </div>
                      </td>
                      <td data-label="Contact">{student.parentPhone}</td>
                      <td data-label="Shift">{student.shiftTiming || 'General'}</td>
                      <td data-label="Days Left">
                        {isExpired ? (
                          <Badge tone="danger">Expired</Badge>
                        ) : daysLeft <= 7 ? (
                          <Badge tone="warn">{daysLeft}d left</Badge>
                        ) : (
                          <span style={{ fontWeight: 600, color: 'var(--emerald)' }}>{daysLeft}d</span>
                        )}
                      </td>
                      <td data-label="Check-In">
                        {log?.checkIn ? (
                          <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>
                            {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-faint)' }}>—</span>
                        )}
                      </td>
                      <td data-label="Check-Out">
                        {log?.checkOut ? (
                          <span style={{ color: 'var(--sky)', fontWeight: 600 }}>
                            {new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : isInside ? (
                          <Badge tone="sky">Inside</Badge>
                        ) : (
                          <span style={{ color: 'var(--text-faint)' }}>—</span>
                        )}
                      </td>
                      <td data-label="Duration">
                        {log?.durationMinutes ? (
                          <span>{Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m</span>
                        ) : isInside ? (
                          <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Ongoing</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td data-label="Status">
                        <Badge tone={isPresent ? (isInside ? 'sky' : 'emerald') : 'neutral'}>
                          {isPresent ? (isInside ? 'In Facility' : 'Present') : 'Not Checked In'}
                        </Badge>
                      </td>
                      <td data-label="Action" className="right cell-actions">
                        {!log ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => quickCheckIn(student)}
                            disabled={markingId === student._id}
                          >
                            Check In
                          </Button>
                        ) : isInside ? (
                          <Button
                            variant="subtle"
                            size="sm"
                            icon={LogOut}
                            onClick={() => quickCheckOut(log)}
                            disabled={markingId === log._id}
                          >
                            Check Out
                          </Button>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--emerald)' }}>Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Today's Log Table (When Scanner Tab is Active) */}
      {activeTab === 'scanner' && (
        <Card title="Today's Access &amp; Time Log" subtitle="Timestamped check-in and check-out ledger">
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <div className="spinner" />
            </div>
          ) : attendanceLogs.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)' }}>
              No check-ins logged for {selectedDate}. Use the scanner above or record a manual time entry.
            </div>
          ) : (
            <div className="table-scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Contact</th>
                    <th>Shift</th>
                    <th>Check In Time</th>
                    <th>Check Out Time</th>
                    <th>Duration</th>
                    <th>Method</th>
                    <th className="right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLogs.map((log) => (
                    <tr key={log._id}>
                      <td className="cell-main">
                        <strong>{log.studentId?.name || 'Member'}</strong>
                        <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-dim)' }}>
                          {log.studentId?.barcode || '—'}
                        </div>
                      </td>
                      <td>{log.studentId?.parentPhone || '—'}</td>
                      <td>{log.studentId?.shiftTiming || 'General'}</td>
                      <td data-label="Check-In" style={{ color: 'var(--emerald)', fontWeight: 600 }}>
                        {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td data-label="Check-Out">
                        {log.checkOut ? (
                          <span style={{ color: 'var(--sky)', fontWeight: 600 }}>
                            {new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <Badge tone="sky">Currently Inside</Badge>
                        )}
                      </td>
                      <td>
                        {log.durationMinutes ? `${Math.floor(log.durationMinutes / 60)}h ${log.durationMinutes % 60}m` : '—'}
                      </td>
                      <td>
                        <Badge tone="neutral">{log.method}</Badge>
                      </td>
                      <td className="right">
                        {!log.checkOut && (
                          <Button
                            variant="subtle"
                            size="sm"
                            icon={LogOut}
                            onClick={() => quickCheckOut(log)}
                            disabled={markingId === log._id}
                          >
                            Check Out
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Manual Attendance Record Modal */}
      {showManualModal && (
        <Modal
          title="Record Custom Attendance &amp; Time"
          onClose={() => setShowManualModal(false)}
          footer={
            <>
              <Button variant="subtle" onClick={() => setShowManualModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={submitManual}>
                Save Attendance Record
              </Button>
            </>
          }
        >
          <div className="form-grid">
            <Field label="Select Student / Member" className="full">
              <select
                className="select"
                value={manualForm.studentId}
                onChange={(e) => setManualForm({ ...manualForm, studentId: e.target.value })}
              >
                <option value="">Choose student...</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.parentPhone}) - {s.shiftTiming || 'General'}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Check-In Time">
              <input
                type="time"
                className="input"
                value={manualForm.checkInTime}
                onChange={(e) => setManualForm({ ...manualForm, checkInTime: e.target.value })}
              />
            </Field>

            <Field label="Check-Out Time (Optional)">
              <input
                type="time"
                className="input"
                value={manualForm.checkOutTime}
                onChange={(e) => setManualForm({ ...manualForm, checkOutTime: e.target.value })}
              />
            </Field>

            <Field label="Notes (optional)" className="full">
              <input
                className="input"
                placeholder="e.g. Late by 15 mins"
                value={manualForm.notes}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
              />
            </Field>
          </div>
        </Modal>
      )}

      {/* Desk QR Printable Poster Modal */}
      {showDeskQr && (
        <Modal
          title="Printable Entrance / Desk QR Poster"
          onClose={() => setShowDeskQr(false)}
          footer={
            <>
              <Button variant="subtle" onClick={() => setShowDeskQr(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                icon={Printer}
                onClick={() => {
                  window.print();
                }}
              >
                Print Poster
              </Button>
            </>
          }
        >
          {(() => {
            const tenantSlug = tenant?.slug || 'alpha';
            const checkInUrl = `${window.location.origin}/checkin/${tenantSlug}`;
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkInUrl)}&margin=10`;

            return (
              <div
                id="desk-qr-printable"
                style={{
                  textAlign: 'center',
                  background: '#ffffff',
                  color: '#111827',
                  padding: '24px 16px',
                  borderRadius: 16,
                  border: '2px solid #e5e7eb',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 6 }}>
                  {settings.instituteName || tenant?.name || 'Fitness & Learning Center'}
                </div>
                <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 10px 0', color: '#111827' }}>
                  Self Attendance Station
                </h2>
                <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px 0' }}>
                  Scan with your mobile camera to Check In / Check Out
                </p>

                <div
                  style={{
                    display: 'inline-block',
                    padding: 16,
                    background: '#fff',
                    borderRadius: 16,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                    marginBottom: 20,
                  }}
                >
                  <img
                    src={qrImageUrl}
                    alt="Desk Check-In QR Code"
                    style={{ maxWidth: '100%', width: 220, height: 'auto', aspectRatio: '1/1', display: 'block', borderRadius: 8 }}
                  />
                </div>

                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  📱 How it works:
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', maxWidth: 300, margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                  1. Open Camera / WhatsApp scanner on your phone.<br />
                  2. Scan the QR code above.<br />
                  3. Enter phone number to record your in/out time!
                </div>

                <div
                  style={{
                    background: '#f3f4f6',
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontFamily: 'monospace',
                    color: '#4b5563',
                    wordBreak: 'break-all',
                  }}
                >
                  Direct link: {checkInUrl}
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}
