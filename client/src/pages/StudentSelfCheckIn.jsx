import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ScanLine,
  CheckCircle2,
  Clock,
  Phone,
  Calendar,
  AlertTriangle,
  User,
  Heart,
  Utensils,
  Sparkles,
} from 'lucide-react';
import { AttendanceAPI } from '../api/endpoints.js';

export default function StudentSelfCheckIn() {
  const { slug } = useParams();
  const [tenant, setTenant] = useState(null);
  const [identifier, setIdentifier] = useState(localStorage.getItem('feasy_student_id') || '');
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadTenant();
  }, [slug]);

  async function loadTenant() {
    try {
      const data = await AttendanceAPI.getPublicInfo(slug);
      setTenant(data);
    } catch (err) {
      setErrorMsg('This check-in QR code is invalid or the facility could not be found.');
    } finally {
      setLoadingTenant(false);
    }
  }

  async function handleCheckIn(e) {
    e?.preventDefault();
    if (!identifier.trim()) {
      toast.error('Please enter your mobile number or member code');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await AttendanceAPI.selfCheckIn(slug, { identifier: identifier.trim() });
      setResult(res);
      // Remember phone on student's personal phone browser
      localStorage.setItem('feasy_student_id', identifier.trim());
      if (res.action === 'checked_in') {
        toast.success(`Check-In confirmed! Welcome, ${res.student.name}`);
      } else if (res.action === 'checked_out') {
        toast.success(`Check-Out recorded! Have a great day, ${res.student.name}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Check-in failed';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingTenant) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0d14' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0d111a 0%, #06090e 100%)',
        color: '#f3f4f6',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', maxWidth: 420, width: '100%', marginBottom: 24, marginTop: 12 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 58,
            height: 58,
            borderRadius: 16,
            background: 'linear-gradient(135deg, var(--saffron, #f59e0b) 0%, #d97706 100%)',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)',
            marginBottom: 14,
          }}
        >
          <ScanLine size={32} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
          {tenant?.name || 'Self Check-In Station'}
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: '#9ca3af' }}>
          Scan desk QR · Instant Check-In &amp; Check-Out
        </p>
      </div>

      {/* Main Action Box */}
      <div
        style={{
          maxWidth: 420,
          width: '100%',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20,
          padding: 24,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        {!result ? (
          <form onSubmit={handleCheckIn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#d1d5db', marginBottom: 8 }}>
                Your Registered Mobile or Member ID
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: 17,
                    borderRadius: 12,
                    background: '#161b26',
                    border: '1px solid #2d3748',
                    color: '#fff',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                💡 Tip: We remember your number on this phone for 1-tap future check-ins!
              </div>
            </div>

            {errorMsg && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  color: '#f87171',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertTriangle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !identifier.trim()}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '14px 20px',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'opacity 0.2s',
                opacity: submitting || !identifier.trim() ? 0.6 : 1,
              }}
            >
              <ScanLine size={18} />
              {submitting ? 'Confirming…' : 'Check In / Out Now'}
            </button>
          </form>
        ) : (
          /* Check-In Success / Status Screen */
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background:
                  result.action === 'checked_in'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(59, 130, 246, 0.15)',
                color: result.action === 'checked_in' ? '#10b981' : '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px 0' }}>
              {result.action === 'checked_in'
                ? `Welcome, ${result.student?.name}!`
                : `Checked Out, ${result.student?.name}!`}
            </h2>

            <div
              style={{
                display: 'inline-block',
                background:
                  result.action === 'checked_in'
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(59, 130, 246, 0.2)',
                color: result.action === 'checked_in' ? '#10b981' : '#3b82f6',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 20,
              }}
            >
              {result.action === 'checked_in' ? 'Check-In Recorded' : 'Check-Out Recorded'}
            </div>

            {/* Time & Shift Card */}
            <div
              style={{
                background: '#161b26',
                borderRadius: 14,
                padding: 16,
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Time Stamp:</span>
                <strong style={{ color: '#fff' }}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </strong>
              </div>

              {result.attendance?.durationMinutes > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Total Session Duration:</span>
                  <strong style={{ color: '#10b981' }}>
                    {Math.floor(result.attendance.durationMinutes / 60)}h{' '}
                    {result.attendance.durationMinutes % 60}m
                  </strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Shift / Batch:</span>
                <strong>{result.student?.shiftTiming || 'General'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Blood Group:</span>
                <strong style={{ color: '#f43f5e' }}>{result.student?.bloodGroup || 'Not Stated'}</strong>
              </div>
            </div>

            {/* Diet Plan Preview If Assigned */}
            {result.student?.dietPlan?.title && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: 14,
                  padding: 16,
                  textAlign: 'left',
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                  <Utensils size={16} /> Your Assigned Diet Plan
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                  {result.student.dietPlan.title}
                </div>
                {result.student.dietPlan.caloriesTarget > 0 && (
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
                    🎯 Target: {result.student.dietPlan.caloriesTarget} kcal / day
                  </div>
                )}
                {result.student.dietPlan.details && (
                  <div style={{ fontSize: 12, color: '#d1d5db', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                    {result.student.dietPlan.details.slice(0, 180)}...
                  </div>
                )}
              </div>
            )}

            {/* Expiry Warning */}
            {result.isExpired && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 12,
                  padding: 12,
                  color: '#f87171',
                  fontSize: 13,
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  textAlign: 'left',
                }}
              >
                <AlertTriangle size={24} style={{ flexShrink: 0 }} />
                <span>Your membership has expired! Please visit reception to renew your plan.</span>
              </div>
            )}

            <button
              onClick={() => setResult(null)}
              style={{
                background: 'transparent',
                border: '1px solid #374151',
                color: '#d1d5db',
                borderRadius: 10,
                padding: '10px 18px',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Done / Check-in another member
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
        Powered by Feasy Smart Self-Access · Zero Hardware Required
      </div>
    </div>
  );
}

