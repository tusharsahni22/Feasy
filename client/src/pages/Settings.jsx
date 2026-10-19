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
} from 'lucide-react';
import { SettingsAPI } from '../api/endpoints.js';
import { useSettings } from '../context/SettingsContext.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Field from '../components/ui/Field.jsx';
import { CURRENCY_OPTIONS } from '../lib/constants.js';
import { getPreset } from '../lib/presets.js';

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
    customLabels: {},
    currency: 'INR',
    reminderLeadDays: 7,
    reminderTemplate: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      instituteName: settings.instituteName || '',
      businessType: settings.businessType || 'education',
      customLabels: settings.customLabels || {},
      currency: settings.currency || 'INR',
      reminderLeadDays: settings.reminderLeadDays ?? 7,
      reminderTemplate: settings.reminderTemplate || settings.defaultTemplate || '',
    });
  }, [settings]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setCustomLabel = (labelKey) => (e) =>
    setForm((f) => ({
      ...f,
      customLabels: { ...f.customLabels, [labelKey]: e.target.value },
    }));

  async function save() {
    if (!form.instituteName.trim()) return toast.error('Organization / Business name is required');
    setSaving(true);
    try {
      await SettingsAPI.update({
        instituteName: form.instituteName.trim(),
        businessType: form.businessType,
        customLabels: form.customLabels,
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

          {/* Custom Terminology Overrides */}
          <Card
            title="Custom Terminology &amp; Keywords"
            subtitle="Rename any term below to customize your exact business words (e.g., Member, Tier, Personal Trainer, Gym pass)"
          >
            <div className="form-grid">
              <Field label="Member Singular (e.g. Member, Client, Student)">
                <input
                  className="input"
                  value={form.customLabels.memberSingular ?? currentPreset.labels.memberSingular}
                  onChange={setCustomLabel('memberSingular')}
                  placeholder={currentPreset.labels.memberSingular}
                />
              </Field>
              <Field label="Member Plural (e.g. Members, Clients, Students)">
                <input
                  className="input"
                  value={form.customLabels.memberPlural ?? currentPreset.labels.memberPlural}
                  onChange={setCustomLabel('memberPlural')}
                  placeholder={currentPreset.labels.memberPlural}
                />
              </Field>
              <Field label="Category / Tier Singular (e.g. Tier, Batch, Class, Seat)">
                <input
                  className="input"
                  value={form.customLabels.categorySingular ?? currentPreset.labels.categorySingular}
                  onChange={setCustomLabel('categorySingular')}
                  placeholder={currentPreset.labels.categorySingular}
                />
              </Field>
              <Field label="Category / Tier Plural (e.g. Tiers, Batches, Classes)">
                <input
                  className="input"
                  value={form.customLabels.categoryPlural ?? currentPreset.labels.categoryPlural}
                  onChange={setCustomLabel('categoryPlural')}
                  placeholder={currentPreset.labels.categoryPlural}
                />
              </Field>
              <Field label="Add-on Singular (e.g. Add-on, Personal Training, Locker, Subject)">
                <input
                  className="input"
                  value={form.customLabels.itemSingular ?? currentPreset.labels.itemSingular}
                  onChange={setCustomLabel('itemSingular')}
                  placeholder={currentPreset.labels.itemSingular}
                />
              </Field>
              <Field label="Add-on Plural (e.g. Add-ons, Facilities, Subjects)">
                <input
                  className="input"
                  value={form.customLabels.itemPlural ?? currentPreset.labels.itemPlural}
                  onChange={setCustomLabel('itemPlural')}
                  placeholder={currentPreset.labels.itemPlural}
                />
              </Field>
              <Field label="Subscription / Plan Title (e.g. Membership, Subscription, Pass)">
                <input
                  className="input"
                  value={form.customLabels.subscriptionLabel ?? currentPreset.labels.subscriptionLabel}
                  onChange={setCustomLabel('subscriptionLabel')}
                  placeholder={currentPreset.labels.subscriptionLabel}
                />
              </Field>
              <Field label="Fee Label (e.g. Membership fee, Subscription fee, Dues)">
                <input
                  className="input"
                  value={form.customLabels.feeLabel ?? currentPreset.labels.feeLabel}
                  onChange={setCustomLabel('feeLabel')}
                  placeholder={currentPreset.labels.feeLabel}
                />
              </Field>
              <Field label="Contact Person / Sponsor Label (e.g. Emergency Contact, Parent, Billing Contact)">
                <input
                  className="input"
                  value={form.customLabels.contactPersonLabel ?? currentPreset.labels.contactPersonLabel}
                  onChange={setCustomLabel('contactPersonLabel')}
                  placeholder={currentPreset.labels.contactPersonLabel}
                />
              </Field>
              <Field label="Add/Enroll Button Action (e.g. Register member, Enroll student)">
                <input
                  className="input"
                  value={form.customLabels.enrollAction ?? currentPreset.labels.enrollAction}
                  onChange={setCustomLabel('enrollAction')}
                  placeholder={currentPreset.labels.enrollAction}
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
