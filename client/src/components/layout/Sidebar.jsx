import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Layers,
  Wallet,
  BellRing,
  Settings as SettingsIcon,
  CreditCard,
  Building2,
  UserCheck,
  History,
  ScanLine,
  Utensils,
  Tag,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Sidebar({ open }) {
  const { settings, labels } = useSettings();
  const { user } = useAuth();

  const isOwnerOrAdmin = user?.isSuperAdmin || user?.role === 'owner' || user?.role === 'admin';
  const isSuper = Boolean(user?.isSuperAdmin);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/students', label: labels.memberPlural || 'Members', icon: Users },
    { to: '/attendance', label: 'Attendance', icon: ScanLine },
    { to: '/diet-plans', label: 'Diet Plans', icon: Utensils },
    { to: '/discounts', label: 'Discounts', icon: Tag },
    { to: '/fees', label: labels.plansPageTitle || 'Plans & Add-ons', icon: Layers },
    { to: '/payments', label: 'Payments', icon: Wallet },
    { to: '/reminders', label: 'Reminders', icon: BellRing },
    ...(isOwnerOrAdmin
      ? [
          { to: '/team', label: 'Team', icon: UserCheck },
          { to: '/audit-logs', label: 'Activity Log', icon: History },
          ...(isSuper ? [{ to: '/workspaces', label: 'Workspaces', icon: Building2 }] : []),
        ]
      : []),
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <div className="brand-mark">
          <CreditCard size={22} />
        </div>
        <div>
          <div className="brand-name">{settings.instituteName || 'Feasy'}</div>
          <div className="brand-sub">Subscriptions &amp; Fees</div>
        </div>
      </div>

      <nav className="nav">
        <div className="nav-label">Menu</div>
        {navItems.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <n.icon size={18} />
            {n.label}
          </NavLink>
        ))}
      </nav>

      <div className="nav-spacer" />

      <div className="sidebar-foot">
        <div style={{ color: 'var(--text-dim)', fontWeight: 600, marginBottom: 2 }}>
          {settings.instituteName || 'Feasy Workspace'}
        </div>
        Smart Recurring &amp; Fee Management
        <div style={{ marginTop: 8, opacity: 0.6 }}>Feasy SaaS Platform</div>
      </div>
    </aside>
  );
}
