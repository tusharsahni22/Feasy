import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Building2,
  Plus,
  Trash2,
  Users,
  Layers,
  ShieldAlert,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { WorkspacesAPI } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Field from '../components/ui/Field.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { Spinner } from '../components/ui/Loader.jsx';

function CreateWorkspaceModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    orgName: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    businessType: 'gym',
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.orgName.trim() || !form.name.trim() || !form.email.trim() || !form.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await WorkspacesAPI.create(form);
      toast.success(`Workspace "${form.orgName}" provisioned successfully!`);
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create workspace');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="Provision New Business Workspace"
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Workspace'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="stack" style={{ gap: 14 }}>
        <Field label="Business / Institute Name">
          <input
            className="input"
            value={form.orgName}
            onChange={set('orgName')}
            placeholder="e.g. Iron Gym, Apex Coaching, City Library"
            required
          />
        </Field>

        <Field label="Primary Business Niche">
          <select className="select" value={form.businessType} onChange={set('businessType')}>
            <option value="gym">Fitness Centre / Gym / Yoga Studio</option>
            <option value="education">Education / Coaching / Tuition</option>
            <option value="library">Library / Co-working Space</option>
            <option value="general">Subscription / Membership Club</option>
          </select>
        </Field>

        <div className="form-grid">
          <Field label="Owner Full Name">
            <input
              className="input"
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Alex Morgan"
              required
            />
          </Field>
          <Field label="Owner Phone">
            <input
              className="input"
              value={form.phone}
              onChange={set('phone')}
              placeholder="10-digit mobile"
            />
          </Field>
        </div>

        <Field label="Owner Login Email">
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={set('email')}
            placeholder="owner@domain.com"
            required
          />
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

export default function Workspaces() {
  const { user, tenant: currentTenant, logout } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function loadWorkspaces() {
    setLoading(true);
    try {
      const data = await WorkspacesAPI.list();
      setWorkspaces(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkspaces();
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await WorkspacesAPI.remove(deleteTarget._id);
      toast.success(`Workspace "${deleteTarget.name}" deleted`);

      // If user deleted the workspace they are currently logged into, log them out
      if (String(currentTenant?._id) === String(deleteTarget._id)) {
        toast('Logged out from deleted workspace');
        logout();
        return;
      }

      setDeleteTarget(null);
      loadWorkspaces();
    } catch (err) {
      toast.error(err.message || 'Could not delete workspace');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Platform Administration</div>
          <h2>Workspaces &amp; Tenants</h2>
          <p>
            Create isolated workspaces for other business owners. Self-registration is restricted.
          </p>
        </div>
        {user?.isSuperAdmin && (
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setShowCreate(true)}
        >
          Create New Workspace
        </Button>
      )}
      </div>

      <Card
        title="Managed Workspaces"
        subtitle={`${workspaces.length} total active workspace(s)`}
        bodyClass="tight"
      >
        {loading ? (
          <Spinner />
        ) : workspaces.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)' }}>
            No workspaces found.
          </div>
        ) : (
          <div className="table-scroll">
            <table className="tbl" style={{ '--tbl-min': '680px' }}>
              <thead>
                <tr>
                  <th>Workspace Name</th>
                  <th>Niche / Type</th>
                  <th>Primary Owner</th>
                  <th className="right">Members</th>
                  <th className="right">Plans</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workspaces.map((ws) => {
                  const isCurrent = String(ws._id) === String(currentTenant?._id);
                  return (
                    <tr key={ws._id}>
                      <td className="cell-main">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600 }}>{ws.name}</span>
                          {isCurrent && (
                            <Badge tone="active">Current</Badge>
                          )}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                          slug: {ws.slug}
                        </span>
                      </td>
                      <td>
                        <span className="tag-pill" style={{ textTransform: 'capitalize' }}>
                          {ws.businessType}
                        </span>
                      </td>
                      <td>
                        {ws.owner ? (
                          <div>
                            <div style={{ fontWeight: 500 }}>{ws.owner.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                              {ws.owner.email}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-faint)' }}>—</span>
                        )}
                      </td>
                      <td className="right num">{ws.stats?.members ?? 0}</td>
                      <td className="right num">{ws.stats?.plans ?? 0}</td>
                      <td className="cell-actions">
                        <div className="row-actions">
                          <Button
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            title="Delete workspace"
                            disabled={workspaces.length <= 1}
                            onClick={() => setDeleteTarget(ws)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showCreate && (
        <CreateWorkspaceModal
          onClose={() => setShowCreate(false)}
          onCreated={loadWorkspaces}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={`Delete workspace "${deleteTarget.name}"?`}
          message={`Are you sure you want to permanently delete "${deleteTarget.name}"? This action CANNOT be undone and will permanently wipe all members, payments, plans, and accounts in this workspace.`}
          confirmLabel="Delete Workspace"
          busy={deleting}
          onConfirm={handleDelete}
          onClose={() => !deleting && setDeleteTarget(null)}
        />
      )}
    </>
  );
}

