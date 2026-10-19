import { useLocation } from 'react-router-dom';
import { Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../ui/Button.jsx';

function titleFor(path, labels) {
  const mSingular = labels.memberSingular || 'Member';
  const mPlural = labels.memberPlural || 'Members';
  const subLabel = labels.subscriptionLabel || 'Subscription';

  if (path === '/') return ['Dashboard', 'Overview & key performance metrics'];
  if (path === '/students/new') return [`Add ${mSingular.toLowerCase()}`, `Register a new ${mSingular.toLowerCase()}`];
  if (path.startsWith('/students/') && path.endsWith('/edit'))
    return [`Edit ${mSingular.toLowerCase()}`, 'Update profile and plan details'];
  if (path.startsWith('/students/')) return [`${mSingular} profile`, `${subLabel}, fee schedule & payment history`];
  if (path === '/students') return [mPlural, `Manage all active and registered ${mPlural.toLowerCase()}`];
  if (path === '/fees') return [labels.plansPageTitle || 'Plans & Add-ons', labels.plansPageSubtitle || 'Base fees and add-ons'];
  if (path === '/payments') return ['Payments', 'Collection records & transaction ledger'];
  if (path === '/reminders') return ['Reminders', `Send upcoming ${subLabel.toLowerCase()} renewal notifications`];
  if (path === '/settings') return ['Settings', 'Business mode, branding, currency & notifications'];
  return ['Feasy', ''];
}

export default function Topbar({ onMenu }) {
  const { pathname } = useLocation();
  const { settings, labels } = useSettings();
  const { user, tenant, logout } = useAuth();
  const [title, sub] = titleFor(pathname, labels);

  return (
    <header className="topbar">
      <button className="hamburger" onClick={onMenu} aria-label="Toggle menu">
        <Menu size={20} />
      </button>
      <div>
        <h1>{title}</h1>
        <div className="topbar-sub">{sub}</div>
      </div>
      <div className="topbar-spacer" />
      <div className="hstack wrap" style={{ gap: 10, alignItems: 'center' }}>
        <span className="chip">{tenant?.name || settings.instituteName || 'Feasy Workspace'}</span>
        {user && (
          <div
            className="hstack"
            style={{
              gap: 8,
              background: 'var(--surface-2)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-soft)',
            }}
          >
            <UserIcon size={14} style={{ color: 'var(--saffron)' }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</span>
            <span
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: 'var(--surface-3)',
                padding: '2px 6px',
                borderRadius: 4,
                color: 'var(--text-dim)',
              }}
            >
              {user.role}
            </span>
            <Button
              variant="subtle"
              size="sm"
              icon={LogOut}
              title="Sign out"
              onClick={logout}
              style={{ padding: '2px 6px', height: 'auto', marginLeft: 4 }}
            />
          </div>
        )}
      </div>
    </header>
  );
}
