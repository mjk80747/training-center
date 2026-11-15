import {
  BarChart3,
  BookOpen,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  Wallet,
  Users,
  UserRoundPlus,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { routes } from '../routes/paths';
import { getAuthSession, logout } from '../store/auth';
import { AdminHeaderControls } from './AdminHeaderControls';
import { BrandLogo } from '../components/BrandLogo';
import { RouteTransition } from '../components/RouteTransition';

const navigation = [
  { label: 'Dashboard', to: routes.admin.dashboard, icon: LayoutDashboard, end: true },
  { label: 'Students', to: routes.admin.students, icon: Users },
  { label: 'Leads & Enquiries', to: routes.admin.leads, icon: UserRoundPlus },
  { label: 'Batches', to: routes.admin.batches, icon: Layers3 },
  { label: 'Courses', to: routes.admin.courses, icon: BookOpen },
  { label: 'Fees', to: routes.admin.fees, icon: Wallet, adminOnly: true },
  { label: 'Reports', to: routes.admin.reports, icon: BarChart3, adminOnly: true },
];

export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const currentUser = getAuthSession();
  const isCounsellor = currentUser?.role === 'COUNSELLOR';
  const location = useLocation();
  const currentPage = navigation.find(({ to }) => (
    to === location.pathname || (to !== routes.admin.dashboard && location.pathname.startsWith(`${to}/`))
  ))?.label ?? 'Overview';

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <div className="admin-shell admin-shell-dashboard">
      <aside className={`admin-sidebar ${menuOpen ? 'admin-sidebar-open' : ''}`}>
        <Link to={routes.admin.dashboard} className="admin-brand">
          <BrandLogo />
        </Link>

        <p className="sidebar-label">ADMIN PORTAL</p>
        <nav className="sidebar-nav" aria-label="Admin navigation">
          {navigation.filter(({ adminOnly }) => !adminOnly || !isCounsellor).map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              aria-label={label === 'Leads & Enquiries' ? 'Leads' : label}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link-active' : ''}`}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {label === 'Leads' && <span className="nav-indicator" />}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <div className="sidebar-profile-details">
              <div className="avatar avatar-indigo">{(currentUser?.full_name || 'RK').split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
              <div className="profile-copy">
                <strong>{currentUser?.full_name || (isCounsellor ? 'Swathi Rao' : 'Ravi Kumar')}</strong>
                <span>{currentUser?.email || (isCounsellor ? 'counsellor@jkit.in' : 'admin@jkit.in')}</span>
              </div>
            </div>
            <Link to={routes.login} onClick={() => { void logout(); }} className="sidebar-signout">
              <LogOut size={14} />
              <span>Sign out</span>
            </Link>
          </div>
        </div>
      </aside>
      {menuOpen ? (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="mobile-menu-button"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu size={20} />
          </button>
          <div className="portal-topbar-title">{currentPage === 'Dashboard' ? 'Admin Portal' : currentPage}</div>
          <AdminHeaderControls />
          <span className="portal-role"><i />{isCounsellor ? 'Counsellor' : 'Admin'}</span>
        </header>
        <main className="admin-content">
          <RouteTransition routeKey={location.pathname}>
            <Outlet />
          </RouteTransition>
        </main>
      </div>
    </div>
  );
}
