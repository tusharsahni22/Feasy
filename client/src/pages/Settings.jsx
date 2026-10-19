import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Save,
  RotateCcw,
  MessageCircle,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Building2,
  Briefcase,
  GraduationCap,
  Dumbbell,
  BookOpen,
  Layers,
} from 'lucide-react';
import { SettingsAPI } from '../api/endpoints.js';
import { useSettings } from '../context/SettingsContext.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Field from '../components/ui/Field.jsx';
import { CURRENCY_OPTIONS } from '../lib/constants.js';
import { BUSINESS_TYPES, getPreset } from '../lib/presets.js';

const TOKENS = [
  'contactPerson',
  'memberName',
  'parentName',
  'studentName',
  'category',
  'class',
  'days',
  'endDate',
  'fee',
  'currency',
  'organization',
  'institute',
];

const ICONS = {
  GraduationCap,
  Dumbbell,
  BookOpen,
  Layers,
};

function ChannelRow({ icon: Icon, label, configured, detail }) {
  return (
    <div
      className="hstack wrap"
      style={{
        justifyContent: 'space-between',
        gap: 10,
        padding: '12px 0',
        borderBottom: '1px solid var(--border-soft)',
      }}
    >
      <div className="hstack" style={{ gap: 12, minWidth: 0 }}>
        <span
          className="stat-icon"
          style={
            configured
              ? { '--tone': 'var(--emerald)', '--tone-soft': 'var(--emerald-soft)' }
              : { '--tone': 'var(--text-faint)', '--tone-soft': 'var(--surface-2)' }
          }
        >
          <Icon size={18} />
        </span>
        <div className="kv">
          <span className="v">{label}</span>
          <span className="k" style={{ textTransform: 'none', letterSpacing: 0 }}>
            {detail}
          </span>
        </div>
      </div>
      {configured ? (
        <Badge tone="active" dot>
          <CheckCircle2 size={13} /> Connected
        </Badge>
      ) : (
        <Badge tone="neutral">
          <XCircle size={13} /> Not configured
        </Badge>
      )}
    </div>
  );
}

export default function Settings() {
  const { settings, refresh, labels } = useSettings();
  const [form, setForm] = useState({
    instituteName: '',
    businessType: 'education',
    currency: 'INR',
    reminderLeadDays: 7,
    reminderTemplate: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      instituteName: settings.instituteName || '',
      businessType: settings.businessType || 'education',
      currency: settings.currency || 'INR',
      reminderLeadDays: settings.reminderLeadDays ?? 7,
      reminderTemplate: settings.reminderTemplate || settings.defaultTemplate || '',
    });
  }, [settings]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleBusinessTypeChange(newType) {
    const preset = getPreset(newType);
    setForm((f) => ({
      ...f,
      businessType: newType,
      reminderTemplate: preset.defaultTemplate || f.reminderTemplate,
    }));
  }

  async function save() {
    if (!form.instituteName.trim()) return toast.error('Organization / Business name is required');
    setSaving(true);
    try {
      await SettingsAPI.update({
        instituteName: form.instituteName.trim(),
        businessType: form.businessType,
        currency: form.currency,
        reminderLeadDays: Number(form.reminderLeadDays),
        reminderTemplate: form.reminderTemplate,
      });
      await refresh();
      toast.success('Settings & business preset saved');
    } catch (e) {
      toast.error(e.message || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  }

  const messaging = settings.messaging || {};
  const currentPreset = getPreset(form.businessType);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Preferences &amp; Business Mode</div>
          <h2>Settings</h2>
          <p>Configure your business niche, organization branding, currency, and messaging.</p>
        </div>
        <Button variant="primary" icon={Save} onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      <div className="grid dash-cols">
        <div className="stack">
          {/* Business Mode Selector */}
          <Card
            title="Business Model &amp; Niche Preset"
            subtitle="Adapts terminology across your dashboard, records, and reminder messages"
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
              {BUSINESS_TYPES.map((bt) => {
                const IconComponent = ICONS[bt.icon] || Briefcase;
                const active = form.businessType === bt.id;
                return (
                  <button
                    key={bt.id}
                    type="button"
                    onClick={() => handleBusinessTypeChange(bt.id)}
                    style={{
                      textAlign: 'left',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius)',
                      border: active ? '2px solid var(--saffron)' : '1px solid var(--border)',
                      background: active ? 'var(--saffron-soft)' : 'var(--surface-2)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div className="hstack" style={{ gap: 10, marginBottom: 6 }}>
                      <span className="stat-icon" style={{ '--tone': 'var(--saffron)', '--tone-soft': 'transparent' }}>
                        <IconComponent size={20} />
                      </span>
                      <strong style={{ fontSize: 14 }}>{bt.labels.businessType}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                      {bt.labels.memberPlural} · {bt.labels.categoryPlural} · {bt.labels.itemPlural}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)', background: 'var(--surface-3)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
              Currently adapting UI for: <strong>{currentPreset.name}</strong> ({currentPreset.labels.memberSingular}s &amp; {currentPreset.labels.subscriptionLabel}s)
            </div>
          </Card>

          {/* Organization & Details */}
          <Card title="Organization Branding">
            <div className="form-grid">
              <Field label={currentPreset.labels.orgNameLabel || 'Organization / Business Name'} className="full">
                <input
                  className="input"
                  value={form.instituteName}
                  onChange={set('instituteName')}
                  placeholder="e.g. Iron Gym, Apex Academy, City Library"
                />
              </Field>
              <Field label="Currency">
                <select className="select" value={form.currency} onChange={set('currency')}>
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Reminder lead time" hint="Days before expiry to flag as ‘expiring’">
                <input
                  type="number"
                  className="input"
                  min={1}
                  max={60}
                  value={form.reminderLeadDays}
                  onChange={set('reminderLeadDays')}
                />
              </Field>
            </div>
          </Card>

          {/* Reminder message */}
          <Card
            title="Automated Reminder Message"
            subtitle="Sent over WhatsApp / SMS — dynamic tokens automatically populate per member"
            actions={
              <Button
                variant="subtle"
                size="sm"
                icon={RotateCcw}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    reminderTemplate: currentPreset.defaultTemplate || settings.defaultTemplate || '',
                  }))
                }
              >
                Reset to preset default
              </Button>
            }
          >
            <Field hint={`Available tokens: ${TOKENS.map((t) => `{${t}}`).join('  ')}`}>
              <textarea
                className="textarea"
                rows={5}
                value={form.reminderTemplate}
                onChange={set('reminderTemplate')}
              />
            </Field>
          </Card>
        </div>

        <Card title="Messaging Channels" subtitle="Configured via environment variables">
          <ChannelRow
            icon={MessageCircle}
            label="WhatsApp"
            configured={messaging.whatsapp?.configured}
            detail={
              messaging.whatsapp?.configured
                ? `Template: ${messaging.whatsapp.templateName || 'text mode'}`
                : 'WhatsApp Cloud API'
            }
          />
          <ChannelRow
            icon={MessageSquare}
            label="SMS"
            configured={messaging.sms?.configured}
            detail={messaging.sms?.configured ? `Provider: ${messaging.sms.provider}` : 'SMS gateway'}
          />
          <ChannelRow
            icon={Building2}
            label="Default country code"
            configured={Boolean(messaging.defaultCountryCode)}
            detail={`+${messaging.defaultCountryCode || '91'} prepended to 10-digit numbers`}
          />

          <div className="callout" style={{ marginTop: 18 }}>
            <MessageCircle size={18} />
            <span>
              When a messaging channel is not configured, reminders are <b>simulated</b> and logged safely in history — perfect for demos and client testing.
            </span>
          </div>
        </Card>
      </div>
    </>
  );
}
