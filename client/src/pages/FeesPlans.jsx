import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, GraduationCap, BookOpen } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { ClassesAPI, SubjectsAPI } from '../api/endpoints.js';
import { useSettings } from '../context/SettingsContext.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Field from '../components/ui/Field.jsx';
import Modal from '../components/ui/Modal.jsx';
import { Spinner } from '../components/ui/Loader.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';

function ClassModal({ initial, labels, onClose, onSaved }) {
  const [name, setName] = useState(initial?.name || '');
  const [order, setOrder] = useState(initial?.order ?? 0);
  const [baseMonthlyFee, setBaseMonthlyFee] = useState(initial?.baseMonthlyFee ?? 0);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial?._id);

  async function submit() {
    if (!name.trim()) return toast.error(`${labels.categorySingular} name is required`);
    setSaving(true);
    try {
      const body = { name: name.trim(), order: Number(order), baseMonthlyFee: Number(baseMonthlyFee) };
      if (isEdit) await ClassesAPI.update(initial._id, body);
      else await ClassesAPI.create(body);
      toast.success(isEdit ? `${labels.categorySingular} updated` : `${labels.categorySingular} added`);
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e.message || `Could not save ${labels.categorySingular.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? `Edit ${labels.categorySingular.toLowerCase()}` : `Add ${labels.categorySingular.toLowerCase()}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <Field label={`${labels.categorySingular} name`}>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={`e.g. Standard ${labels.categorySingular}`} />
      </Field>
      <div className="form-grid">
        <Field label={`Base monthly ${labels.feeLabel.toLowerCase()}`}>
          <input
            type="number"
            className="input"
            value={baseMonthlyFee}
            min={0}
            onChange={(e) => setBaseMonthlyFee(e.target.value)}
          />
        </Field>
        <Field label="Display order" hint="Lower shows first">
          <input type="number" className="input" value={order} onChange={(e) => setOrder(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

function SubjectModal({ initial, classes, labels, onClose, onSaved }) {
  const [name, setName] = useState(initial?.name || '');
  const [code, setCode] = useState(initial?.code || '');
  const [classPlan, setClassPlan] = useState(
    initial?.classPlan?._id || initial?.classPlan || ''
  );
  const [addOnFee, setAddOnFee] = useState(initial?.addOnFee ?? 0);
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial?._id);

  async function submit() {
    if (!name.trim()) return toast.error(`${labels.itemSingular} name is required`);
    if (!classPlan) return toast.error(`Please choose the ${labels.categorySingular.toLowerCase()} this belongs to`);
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        code: code.trim() || undefined,
        classPlan,
        addOnFee: Number(addOnFee),
        active,
      };
      if (isEdit) await SubjectsAPI.update(initial._id, body);
      else await SubjectsAPI.create(body);
      toast.success(isEdit ? `${labels.itemSingular} updated` : `${labels.itemSingular} added`);
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e.message || `Could not save ${labels.itemSingular.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? `Edit ${labels.itemSingular.toLowerCase()}` : `Add ${labels.itemSingular.toLowerCase()}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label={`${labels.itemSingular} name`} className="full">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={`e.g. Standard ${labels.itemSingular}`} />
        </Field>
        <Field label={labels.categorySingular} className="full">
          <select className="select" value={classPlan} onChange={(e) => setClassPlan(e.target.value)}>
            <option value="">Select a {labels.categorySingular.toLowerCase()}…</option>
            {(classes || []).map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Code (optional)">
          <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CODE" />
        </Field>
        <Field label={`Add-on ${labels.feeLabel.toLowerCase()} / month`}>
          <input
            type="number"
            className="input"
            value={addOnFee}
            min={0}
            onChange={(e) => setAddOnFee(e.target.value)}
          />
        </Field>
      </div>
      <label className={`check ${active ? 'on' : ''}`} style={{ maxWidth: 220 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            style={{ accentColor: 'var(--saffron)' }}
          />
          Available for selection
        </span>
      </label>
    </Modal>
  );
}

export default function FeesPlans() {
  const { money, labels } = useSettings();
  const { data: classes, loading: lc, refetch: refetchClasses } = useApi(() => ClassesAPI.list(), []);
  const { data: subjects, loading: ls, refetch: refetchSubjects } = useApi(() => SubjectsAPI.list(), []);

  const [classModal, setClassModal] = useState(null); // {} for new, obj for edit
  const [subjectModal, setSubjectModal] = useState(null);
  const [subjFilter, setSubjFilter] = useState(''); // filter subjects table by class
  const [del, setDel] = useState(null); // { kind, item }
  const [deleting, setDeleting] = useState(false);

  const classIdOf = (s) => s.classPlan?._id || s.classPlan || '';
  const shownSubjects = (subjects || []).filter(
    (s) => !subjFilter || classIdOf(s) === subjFilter
  );

  async function confirmDelete() {
    if (!del) return;
    setDeleting(true);
    try {
      if (del.kind === 'class') await ClassesAPI.remove(del.item._id);
      else await SubjectsAPI.remove(del.item._id);
      toast.success('Deleted');
      setDel(null);
      del.kind === 'class' ? refetchClasses() : refetchSubjects();
    } catch (e) {
      toast.error(e.message || 'Could not delete — it may be in use');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Configuration</div>
          <h2>{labels.plansPageTitle}</h2>
          <p>Set the base {labels.feeLabel.toLowerCase()} for each {labels.categorySingular.toLowerCase()} and the monthly add-on for each {labels.itemSingular.toLowerCase()}.</p>
        </div>
      </div>

      <div className="grid grid-2">
        <Card
          title={labels.categoryPlural}
          subtitle={`${(classes || []).length} ${labels.categoryPlural.toLowerCase()}`}
          actions={
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setClassModal({})}>
              Add {labels.categorySingular.toLowerCase()}
            </Button>
          }
          bodyClass="tight"
        >
          {lc ? (
            <Spinner />
          ) : (classes || []).length === 0 ? (
            <EmptyState icon={GraduationCap} title={`No ${labels.categoryPlural.toLowerCase()} yet`} hint={`Add ${labels.categoryPlural.toLowerCase()} to organize pricing.`} />
          ) : (
            <div className="table-scroll">
              <table className="tbl" style={{ '--tbl-min': '420px' }}>
                <thead>
                  <tr>
                    <th>{labels.categorySingular}</th>
                    <th className="right">Base {labels.feeLabel.toLowerCase()} / mo</th>
                    <th className="right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((c) => (
                    <tr key={c._id}>
                      <td className="cell-main" style={{ fontWeight: 600 }}>{c.name}</td>
                      <td className="right num" data-label={`Base ${labels.feeLabel.toLowerCase()} / mo`}>{money(c.baseMonthlyFee)}</td>
                      <td className="cell-actions">
                        <div className="row-actions">
                          <Button variant="subtle" size="sm" icon={Pencil} title="Edit" onClick={() => setClassModal(c)} />
                          <Button
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            title="Delete"
                            onClick={() => setDel({ kind: 'class', item: c })}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card
          title={labels.itemPlural}
          subtitle={`${(subjects || []).length} ${labels.itemPlural.toLowerCase()}`}
          actions={
            <div className="hstack wrap" style={{ gap: 8, flex: '1 1 auto', justifyContent: 'flex-end' }}>
              {(classes || []).length > 0 && (
                <select
                  className="select head-select"
                  value={subjFilter}
                  onChange={(e) => setSubjFilter(e.target.value)}
                >
                  <option value="">All {labels.categoryPlural.toLowerCase()}</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
              <Button variant="primary" size="sm" icon={Plus} onClick={() => setSubjectModal({})}>
                Add {labels.itemSingular.toLowerCase()}
              </Button>
            </div>
          }
          bodyClass="tight"
        >
          {ls ? (
            <Spinner />
          ) : (subjects || []).length === 0 ? (
            <EmptyState icon={BookOpen} title={`No ${labels.itemPlural.toLowerCase()} yet`} hint={`Add ${labels.itemPlural.toLowerCase()} with their monthly add-on ${labels.feeLabel.toLowerCase()}.`} />
          ) : (
            <div className="table-scroll">
              <table className="tbl" style={{ '--tbl-min': '520px' }}>
                <thead>
                  <tr>
                    <th>{labels.itemSingular}</th>
                    <th>{labels.categorySingular}</th>
                    <th className="right">Add-on / mo</th>
                    <th>Status</th>
                    <th className="right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shownSubjects.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="cell-empty"
                        style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '18px' }}
                      >
                        No {labels.itemPlural.toLowerCase()} for this {labels.categorySingular.toLowerCase()} yet.
                      </td>
                    </tr>
                  ) : (
                    shownSubjects.map((s) => (
                      <tr key={s._id}>
                        <td className="cell-main">
                          <span style={{ fontWeight: 600 }}>{s.name}</span>
                          {s.code && <span className="tag-pill">{s.code}</span>}
                        </td>
                        <td data-label={labels.categorySingular}>
                          {s.classPlan?.name || (
                            <span style={{ color: 'var(--text-faint)' }}>—</span>
                          )}
                        </td>
                        <td className="right num" data-label="Add-on / mo">{money(s.addOnFee)}</td>
                        <td data-label="Status">
                          {s.active !== false ? (
                            <Badge tone="active" dot>
                              Active
                            </Badge>
                          ) : (
                            <Badge tone="neutral">Hidden</Badge>
                          )}
                        </td>
                        <td className="cell-actions">
                          <div className="row-actions">
                            <Button variant="subtle" size="sm" icon={Pencil} title="Edit" onClick={() => setSubjectModal(s)} />
                            <Button
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              title="Delete"
                              onClick={() => setDel({ kind: 'subject', item: s })}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {classModal && (
        <ClassModal initial={classModal} labels={labels} onClose={() => setClassModal(null)} onSaved={refetchClasses} />
      )}
      {subjectModal && (
        <SubjectModal
          initial={subjectModal}
          classes={classes || []}
          labels={labels}
          onClose={() => setSubjectModal(null)}
          onSaved={refetchSubjects}
        />
      )}
      {del && (
        <ConfirmDialog
          title={`Delete ${del.kind === 'class' ? labels.categorySingular : labels.itemSingular}?`}
          message={`Delete “${del.item.name}”? Items currently assigned to ${labels.memberPlural.toLowerCase()} can’t be deleted.`}
          confirmLabel="Delete"
          busy={deleting}
          onConfirm={confirmDelete}
          onClose={() => !deleting && setDel(null)}
        />
      )}
    </>
  );
}
