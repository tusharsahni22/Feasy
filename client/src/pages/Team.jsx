import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  KeyRound,
} from 'lucide-react';
import { UsersAPI } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Field from '../components/ui/Field.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { Spinner } from '../components/ui/Loader.jsx';

function AddUserModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'staff',
  });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error('Name, email, and password are required');
      return;
    }
    setSaving(true);
    try {
      await UsersAPI.create(form);
      toast.success(`Added ${form.name} to workspace`);
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to add user');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Add Team Member to Workspace"
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Adding…' : 'Add Team Member'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="stack" style={{ gap: 14 }}>
        <Field label="Full Name">
          <input
            className="input"
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Rahul Sharma"
            required
          />
        </Field>

        <div className="form-grid">
          <Field label="Email Address">
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={set('email')}
              placeholder="rahul@domain.com"
              required
            />
          </Field>
          <Field label="Mobile Phone">
            <input
              className="input"
              value={form.phone}
              onChange={set('phone')}
              placeholder="10-digit number"
            />
          </Field>
        </div>

        <Field label="Role & Permissions">
          <select className="select" value={form.role} onChange={set('role')}>
            <option value="admin">Admin (Manage members, fees, settings & team)</option>
            <option value="accountant">Accountant (Manage payments & receipts)</option>
            <option value="staff">Staff (View & edit members, record fees)</option>
            <option value="readonly">Read-only (View dashboards & member lists)</option>
          </select>
        </Field>

        <Field label="Initial Temporary Password">
          <input
            type="password"
            className="input"
            value={form.password}
            onChange={set('password')}
            placeholder="Minimum 6 characters"
            required
          />
        </Field>
      </form>
    </Modal>
  );
}

export default function Team() {
  const { user: currentUser } = useAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = currentUser?.role === 'owner' || currentUser?.role === 'admin' || currentUser?.isSuperAdmin;

  async function loadTeam() {
    setLoading(true);
    try {
      const data = await UsersAPI.list();
      setTeam(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeam();
  }, []);

  async function handleDelete() {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await UsersAPI.remove(delTarget._id);
      toast.success(`Removed ${delTarget.name} from workspace`);
      setDelTarget(null);
      loadTeam();
    } catch (err) {
      toast.error(err.message || 'Failed to remove user');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Workspace Access &amp; Permissions</div>
          <h2>Team &amp; Staff Members</h2>
          <p>
            Add staff, managers, or accountants to collaborate inside this workspace.
          </p>
        </div>
        {canManage && (
          <Button variant="primary" icon={UserPlus} onClick={() => setShowAdd(true)}>
            Add Team Member
          </Button>
        )}
      </div>

      <Card
        title="Workspace Team"
        subtitle={`${team.length} member(s) with access`}
        bodyClass="tight"
      >
        {loading ? (
          <Spinner />
        ) : team.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)' }}>
            No team members found.
          </div>
        ) : (
          <div className="table-scroll">
            <table className="tbl" style={{ '--tbl-min': '620px' }}>
              <thead>
                <tr>
                  <th>Name &amp; Contact</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  {canManage && <th className="right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {team.map((u) => {
                  const isSelf = String(u._id) === String(currentUser?.id);
                  const isOwner = u.role === 'owner';
                  return (
                    <tr key={u._id}>
                      <td className="cell-main">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600 }}>{u.name}</span>
                          {isSelf && <Badge tone="active">You</Badge>}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>
                          {u.email} {u.phone ? `• ${u.phone}` : ''}
                        </div>
                      </td>
                      <td>
                        <span
                          className="tag-pill"
                          style={{
                            textTransform: 'uppercase',
                            fontSize: 11,
                            letterSpacing: '0.04em',
                            fontWeight: 600,
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {u.status === 'active' ? (
                          <Badge tone="active" dot>
                            Active
                          </Badge>
                        ) : (
                          <Badge tone="neutral">Inactive</Badge>
                        )}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                        {new Date(u.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      {canManage && (
                        <td className="cell-actions">
                          <div className="row-actions">
                            {!isOwner && !isSelf && (
                              <Button
                                variant="danger"
                                size="sm"
                                icon={Trash2}
                                title="Remove team member"
                                onClick={() => setDelTarget(u)}
                              />
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showAdd && (
        <AddUserModal onClose={() => setShowAdd(false)} onAdded={loadTeam} />
      )}

      {delTarget && (
        <ConfirmDialog
          title={`Remove ${delTarget.name}?`}
          message={`Are you sure you want to revoke workspace access for ${delTarget.name} (${delTarget.email})?`}
          confirmLabel="Remove User"
          busy={deleting}
          onConfirm={handleDelete}
          onClose={() => !deleting && setDelTarget(null)}
        />
      )}
    </>
  );
}

