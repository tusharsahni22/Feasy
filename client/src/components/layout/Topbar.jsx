import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext.jsx';

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
      <span className="chip">{settings.instituteName || 'Feasy Workspace'}</span>
    </header>
  );
}
