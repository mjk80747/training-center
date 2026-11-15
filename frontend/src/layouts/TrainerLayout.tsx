import { BookOpen, CalendarCheck, LayoutDashboard, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { routes } from '../routes/paths';
import { getAuthSession, logout } from '../store/auth';
import { BrandLogo } from '../components/BrandLogo';
import { RouteTransition } from '../components/RouteTransition';

const navigation = [
  { label: 'Dashboard', to: routes.trainer.dashboard, icon: LayoutDashboard, end: true },
  { label: 'Attendance', to: routes.trainer.attendance, icon: CalendarCheck },
  { label: 'Materials & Assignments', to: routes.trainer.materials, icon: BookOpen },
];

export function TrainerLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const user = getAuthSession();
  const name = user?.full_name || 'Arjun Mehta';
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2);

  return (
    <div className="admin-shell admin-shell-dashboard trainer-shell-dashboard">
      <aside className={`admin-sidebar ${menuOpen ? 'admin-sidebar-open' : ''}`}>
        <Link to={routes.trainer.dashboard} className="admin-brand">
          <BrandLogo />
        </Link>
        <p className="sidebar-label">TRAINER PORTAL</p>
        <nav className="sidebar-nav" aria-label="Trainer navigation">
          {navigation.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link-active' : ''}`}
            >
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <div className="sidebar-profile-details">
              <div className="avatar avatar-indigo">{initials}</div>
              <div className="profile-copy"><strong>{name}</strong><span>{user?.email || 'trainer@jkit.in'}</span></div>
            </div>
            <Link to={routes.login} onClick={() => { void logout(); }} className="sidebar-signout">
              <LogOut size={14} /><span>Sign out</span>
            </Link>
          </div>
        </div>
      </aside>
      {menuOpen ? <button className="admin-sidebar-backdrop" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} /> : null}
      <div className="admin-main">
        <header className="admin-topbar portal-topbar">
          <button type="button" className="mobile-menu-button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><Menu size={20} /></button>
          <div className="portal-topbar-title">Trainer Portal</div>
          <span className="portal-role"><i />Trainer</span>
        </header>
        <main className="portal-content trainer-portal-content">
          <RouteTransition routeKey={location.pathname}>
            <Outlet />
          </RouteTransition>
        </main>
      </div>
    </div>
  );
}
