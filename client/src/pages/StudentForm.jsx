import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Save, ArrowLeft, BookOpen, X } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { StudentsAPI, ClassesAPI, SubjectsAPI } from '../api/endpoints.js';
import { useSettings } from '../context/SettingsContext.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Field from '../components/ui/Field.jsx';
import { Loading } from '../components/ui/Loader.jsx';
import { PLAN_OPTIONS, PLAN_MONTHS } from '../lib/constants.js';
import { toDateInput, formatDate } from '../lib/format.js';

/** Local mirror of the server's month-add logic, for the end-date preview. */
function addMonths(date, n, anchorDay) {
  const d = new Date(date);
  const targetDay = anchorDay ?? d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(targetDay, maxDay));
  return d;
}

const EMPTY = {
  name: '',
  parentName: '',
  parentPhone: '',
  gender: '',
  classPlan: '',
  plan: 'monthly',
  subscriptionStart: toDateInput(new Date()),
  subscriptionEnd: '',
  status: 'active',
  notes: '',
  bloodGroup: 'Unknown',
  shiftTiming: 'General (06:00 AM - 10:00 PM)',
  barcode: '',
};

export default function StudentForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { money, labels } = useSettings();

  const { data: classes, loading: loadingClasses } = useApi(() => ClassesAPI.list(), []);
  const { data: subjects, loading: loadingSubjects } = useApi(() => SubjectsAPI.list(), []);
  const { data: existing, loading: loadingStudent } = useApi(
    () => (isEdit ? StudentsAPI.get(id) : Promise.resolve(null)),
    [id]
  );

  const [form, setForm] = useState(EMPTY);
  const [chosen, setChosen] = useState([]);
  // Which class's subjects the picker is currently showing. Defaults to the
  // student's class, but can be switched to browse/add subjects from any class.
  const [subjectClassFilter, setSubjectClassFilter] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Prefill when editing.
  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || '',
        parentName: existing.parentName || '',
        parentPhone: existing.parentPhone || '',
        gender: existing.gender || '',
        classPlan: existing.classPlan?._id || '',
        plan: existing.plan || 'monthly',
        subscriptionStart: toDateInput(existing.subscriptionStart),
        subscriptionEnd: toDateInput(existing.subscriptionEnd),
        status: existing.status || 'active',
        notes: existing.notes || '',
        bloodGroup: existing.bloodGroup || 'Unknown',
        shiftTiming: existing.shiftTiming || 'General (06:00 AM - 10:00 PM)',
        barcode: existing.barcode || '',
      });
      setChosen((existing.subjects || []).map((s) => s._id));
    }
  }, [existing]);

  // Keep the subject picker pointed at the student's class by default; changing
  // the class snaps the picker back to it (you can then switch it manually).
  useEffect(() => {
    if (form.classPlan) setSubjectClassFilter(form.classPlan);
  }, [form.classPlan]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleSubject = (sid) =>
    setChosen((c) => (c.includes(sid) ? c.filter((x) => x !== sid) : [...c, sid]));

  // Live fee + subscription preview.
  const { baseFee, subjectsFee, monthlyFee } = useMemo(() => {
    const cls = (classes || []).find((c) => c._id === form.classPlan);
    const base = cls?.baseMonthlyFee || 0;
    const sf = (subjects || [])
      .filter((s) => chosen.includes(s._id))
      .reduce((sum, s) => sum + (s.addOnFee || 0), 0);
    return { baseFee: base, subjectsFee: sf, monthlyFee: base + sf };
  }, [classes, subjects, form.classPlan, chosen]);

  const endPreview = useMemo(() => {
    if (form.subscriptionEnd) return new Date(form.subscriptionEnd);
    if (!form.subscriptionStart) return null;
    return addMonths(new Date(form.subscriptionStart), PLAN_MONTHS[form.plan] || 1);
  }, [form.subscriptionEnd, form.subscriptionStart, form.plan]);

  // Lookups for rendering the selected-subject chips (which span all classes).
  const classById = useMemo(
    () => new Map((classes || []).map((c) => [c._id, c])),
    [classes]
  );
  const subjectById = useMemo(
    () => new Map((subjects || []).map((s) => [s._id, s])),
    [subjects]
  );

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = `${labels.memberSingular} name is required`;
    if (!form.parentName.trim()) e.parentName = `${labels.contactPersonLabel || 'Contact person'} name is required`;
    if (!form.parentPhone.trim()) e.parentPhone = 'A contact number is required';
    if (!form.classPlan) e.classPlan = `Select a ${labels.categorySingular.toLowerCase()}`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSaving(true);
    const body = {
      name: form.name.trim(),
      parentName: form.parentName.trim(),
      parentPhone: form.parentPhone.trim(),
      gender: form.gender || undefined,
      classPlan: form.classPlan,
      subjects: chosen,
      plan: form.plan,
      subscriptionStart: form.subscriptionStart,
      subscriptionEnd: form.subscriptionEnd || undefined,
      status: form.status,
      notes: form.notes.trim() || undefined,
      bloodGroup: form.bloodGroup,
      shiftTiming: form.shiftTiming,
      barcode: form.barcode?.trim() || undefined,
    };
    try {
      const saved = isEdit
        ? await StudentsAPI.update(id, body)
        : await StudentsAPI.create(body);
      toast.success(isEdit ? `${labels.memberSingular} updated` : `${saved.name} enrolled`);
      navigate(`/students/${saved._id}`);
    } catch (err) {
      toast.error(err.message || `Could not save ${labels.memberSingular.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  }

  if (loadingClasses || loadingSubjects || (isEdit && loadingStudent)) {
    return <Loading label="Loading form…" />;
  }

  const activeSubjects = (subjects || []).filter((s) => s.active !== false);
  const classIdOf = (s) => s.classPlan?._id || s.classPlan || '';
  const hasLegacy = activeSubjects.some((s) => !classIdOf(s));
  const visibleSubjects = activeSubjects.filter((s) =>
    subjectClassFilter === '__general'
      ? !classIdOf(s)
      : classIdOf(s) === subjectClassFilter
  );

  return (
    <form onSubmit={onSubmit}>
      <div className="page-head">
        <div>
          <div className="eyebrow">{isEdit ? 'Edit' : 'Registration'}</div>
          <h2>{isEdit ? `Edit ${existing?.name || labels.memberSingular.toLowerCase()}` : `Add a ${labels.memberSingular.toLowerCase()}`}</h2>
          <p>Pick a {labels.categorySingular.toLowerCase()} and the {labels.itemPlural.toLowerCase()} taken — the monthly {labels.feeLabel.toLowerCase()} is calculated for you.</p>
        </div>
        <Link to={isEdit ? `/students/${id}` : '/students'}>
          <Button variant="subtle" icon={ArrowLeft}>
            Cancel
          </Button>
        </Link>
      </div>

      <div className="grid dash-cols">
        <div className="stack">
          <Card title={`${labels.memberSingular} & ${labels.contactPersonLabel}`}>
            <div className="form-grid">
              <Field label={`${labels.memberSingular} name`} error={errors.name} className="full">
                <input
                  className="input"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="e.g. Alex Morgan"
                />
              </Field>
              <Field label={labels.contactPersonLabel} error={errors.parentName}>
                <input
                  className="input"
                  value={form.parentName}
                  onChange={set('parentName')}
                  placeholder="e.g. Guardian / Contact Person"
                />
              </Field>
              <Field label="Contact number" error={errors.parentPhone} hint="Used for reminders">
                <input
                  className="input"
                  value={form.parentPhone}
                  onChange={set('parentPhone')}
                  placeholder="10-digit mobile"
                />
              </Field>
              <Field label="Gender (optional)">
                <select className="select" value={form.gender} onChange={set('gender')}>
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Status">
                <select className="select" value={form.status} onChange={set('status')}>
                  <option value="active">Active</option>
                  <option value="paused">On leave / break (Paused)</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
              <Field label="Blood Group">
                <select className="select" value={form.bloodGroup} onChange={set('bloodGroup')}>
                  <option value="Unknown">Unknown / Not Disclosed</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </Field>
              <Field label="Shift / Batch Timing">
                <input
                  className="input"
                  value={form.shiftTiming}
                  onChange={set('shiftTiming')}
                  placeholder="e.g. Morning (06:00 AM - 10:00 AM)"
                />
              </Field>
              <Field label="Barcode / Member ID Code" hint="Leave empty to auto-generate">
                <input
                  className="input"
                  value={form.barcode}
                  onChange={set('barcode')}
                  placeholder="e.g. MBR-10294 or RFID tag"
                />
              </Field>
            </div>
          </Card>

          <Card title={`${labels.categorySingular} & ${labels.itemPlural}`} subtitle={`Base ${labels.feeLabel.toLowerCase()} comes from the ${labels.categorySingular.toLowerCase()}; each ${labels.itemSingular.toLowerCase()} adds on`}>
            <Field label={labels.categorySingular} error={errors.classPlan}>
              <select className="select" value={form.classPlan} onChange={set('classPlan')}>
                <option value="">Select a {labels.categorySingular.toLowerCase()}…</option>
                {(classes || []).map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} — {money(c.baseMonthlyFee)}/mo
                  </option>
                ))}
              </select>
            </Field>

            <div className="field">
              <label>{labels.itemPlural}</label>
              {activeSubjects.length === 0 ? (
                <div className="callout warn">
                  <BookOpen size={18} />
                  No {labels.itemPlural.toLowerCase()} defined yet. Add some under {labels.plansPageTitle} first.
                </div>
              ) : (
                <>
                  {/* Selected subjects — shown across every class so you never
                      lose sight of picks made under another class. */}
                  {chosen.length > 0 && (
                    <div className="chip-row">
                      {chosen.map((sid) => {
                        const s = subjectById.get(sid);
                        if (!s) return null;
                        const cls = classById.get(classIdOf(s));
                        return (
                          <span key={sid} className="chip">
                            {s.name}
                            <span className="chip-sub">
                              {cls ? cls.name : 'General'} · +{money(s.addOnFee)}
                            </span>
                            <button
                              type="button"
                              className="chip-x"
                              aria-label={`Remove ${s.name}`}
                              title="Remove"
                              onClick={() => toggleSubject(sid)}
                            >
                              <X size={13} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Class filter — defaults to the student's class; switch it to
                      add subjects from any other class too. */}
                  <div className="subject-filter">
                    <span>Showing ${labels.itemPlural.toLowerCase()} for</span>
                    <select
                      className="select"
                      value={subjectClassFilter}
                      onChange={(e) => setSubjectClassFilter(e.target.value)}
                    >
                      {!form.classPlan && <option value="">Select a class…</option>}
                      {(classes || []).map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                          {c._id === form.classPlan ? ' (enrolled class)' : ''}
                        </option>
                      ))}
                      {hasLegacy && <option value="__general">General (no class)</option>}
                    </select>
                  </div>

                  {!subjectClassFilter ? (
                    <div className="callout">
                      <BookOpen size={18} />
                      Pick a {labels.categorySingular.toLowerCase()} above to see its {labels.itemPlural.toLowerCase()}.
                    </div>
                  ) : visibleSubjects.length === 0 ? (
                    <div className="callout">
                      <BookOpen size={18} />
                      No {labels.itemPlural.toLowerCase()} for this {labels.categorySingular.toLowerCase()} yet. Add some under {labels.plansPageTitle}.
                    </div>
                  ) : (
                    <div className="check-grid">
                      {visibleSubjects.map((s) => {
                        const on = chosen.includes(s._id);
                        return (
                          <div
                            key={s._id}
                            className={`check ${on ? 'on' : ''}`}
                            onClick={() => toggleSubject(s._id)}
                            role="checkbox"
                            aria-checked={on}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                 e.preventDefault();
                                 toggleSubject(s._id);
                              }
                            }}
                          >
                            <span>{s.name}</span>
                            <span className="fee">+{money(s.addOnFee)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          <Card title={labels.subscriptionLabel}>
            <div className="form-grid">
              <Field label="Plan">
                <select className="select" value={form.plan} onChange={set('plan')}>
                  {PLAN_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label} ({p.months} mo)
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Start date">
                <input
                  type="date"
                  className="input"
                  value={form.subscriptionStart}
                  onChange={set('subscriptionStart')}
                />
              </Field>
              <Field label="Renews on" hint={isEdit ? 'Current renewal date (can be corrected)' : 'Auto-calculated if left blank'}>
                <input
                  type="date"
                  className="input"
                  value={form.subscriptionEnd}
                  onChange={set('subscriptionEnd')}
                />
              </Field>
              <Field label="Notes (optional)" className="full">
                <textarea
                  className="textarea"
                  value={form.notes}
                  onChange={set('notes')}
                  placeholder={`Anything worth remembering about this ${labels.memberSingular.toLowerCase()}…`}
                />
              </Field>
            </div>
          </Card>
        </div>

        {/* Live summary */}
        <Card title={`${labels.feeLabel} summary`} subtitle="Updates as you choose">
          <div className="breakdown">
            <div className="row">
              <span className="k">{labels.categorySingular} base {labels.feeLabel.toLowerCase()}</span>
              <span className="v">{money(baseFee)}</span>
            </div>
            <div className="row">
              <span className="k">
                {labels.itemPlural} <span style={{ color: 'var(--text-faint)' }}>× {chosen.length}</span>
              </span>
              <span className="v">{money(subjectsFee)}</span>
            </div>
            <div className="row total">
              <span className="k">Monthly {labels.feeLabel.toLowerCase()}</span>
              <span className="v">{money(monthlyFee)}</span>
            </div>
          </div>

          <div className="divider" style={{ margin: '18px 0' }} />

          <div className="kv" style={{ gap: 10 }}>
            <div className="hstack" style={{ justifyContent: 'space-between' }}>
              <span className="k">Plan</span>
              <span className="v" style={{ fontSize: 14 }}>
                {PLAN_OPTIONS.find((p) => p.value === form.plan)?.label}
              </span>
            </div>
            <div className="hstack" style={{ justifyContent: 'space-between' }}>
              <span className="k">Renews on</span>
              <span className="v" style={{ fontSize: 14 }}>
                {endPreview ? formatDate(endPreview) : '—'}
              </span>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            icon={Save}
            block
            disabled={saving}
            className="mt-0"
            style={{ marginTop: 20 }}
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : labels.enrollAction}
          </Button>
        </Card>
      </div>
    </form>
  );
}
