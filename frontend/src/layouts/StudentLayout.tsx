import { Award, BookOpen, GraduationCap, LayoutDashboard, LogOut, Menu, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { routes } from '../routes/paths';
import { getAuthSession, logout } from '../store/auth';
import { BrandLogo } from '../components/BrandLogo';
import { RouteTransition } from '../components/RouteTransition';

const navigation = [
  { label: 'Overview', to: routes.student.dashboard, icon: LayoutDashboard, end: true },
  { label: 'My Learning', to: routes.student.courses, icon: GraduationCap },
  { label: 'Fees', to: routes.student.fees, icon: Wallet },
  { label: 'Certificates', to: routes.student.certificates, icon: Award },
];

export function StudentLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const user = getAuthSession();
  const name = user?.full_name || 'Student';
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2);

  return (
    <div className="admin-shell portal-shell student-shell-dashboard">
      <aside className={`admin-sidebar ${menuOpen ? 'admin-sidebar-open' : ''}`}>
        <Link to={routes.student.dashboard} className="student-brand-wrap" aria-label="Student dashboard home">
          <BrandLogo />
        </Link>
        <p className="sidebar-label">STUDENT PORTAL</p>
        <nav className="sidebar-nav" aria-label="Student navigation">
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
          <div className="student-sidebar-account">
            <div className="student-sidebar-profile">
              <div className="student-sidebar-avatar">{initials}</div>
              <div className="profile-copy"><strong>{name}</strong><span>{user?.email || 'Student account'}</span></div>
            </div>
            <Link to={routes.login} onClick={() => { void logout(); }} className="student-sidebar-signout"><LogOut size={15} />Sign out</Link>
          </div>
        </div>
      </aside>
      {menuOpen ? <button className="admin-sidebar-backdrop" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} /> : null}
      <div className="admin-main">
        <header className="admin-topbar portal-topbar">
          <button type="button" className="mobile-menu-button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><Menu size={20} /></button>
          <div className="portal-topbar-title">Student Portal</div>
          <span className="portal-role"><i />Student</span>
        </header>
        <main className="portal-content">
          <RouteTransition routeKey={location.pathname}>
            <Outlet />
          </RouteTransition>
        </main>
      </div>
    </div>
  );
}
