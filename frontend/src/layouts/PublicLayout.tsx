import { useEffect, useState } from 'react';
import { Mail, MapPin, Menu, Phone, ShieldCheck, X } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { instituteName } from '../lib/config';
import { BrandLogo } from '../components/BrandLogo';
import { RouteTransition } from '../components/RouteTransition';
import { routes } from '../routes/paths';

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  const navLinks = [
    { name: 'Home', path: routes.home, end: true },
    { name: 'About', path: routes.about },
    { name: 'Courses', path: routes.courses },
    { name: 'Contact', path: routes.contact },
  ];

  return (
    <div className={`public-layout min-h-screen${['/login', '/register', '/verify-email', '/forgot-password'].includes(location.pathname) ? ' auth-route' : ''}`}>
      <header className="public-header sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-md transition-all">
        <nav className="public-nav mx-auto flex h-16 max-w-[1240px] items-center justify-between px-3 sm:px-6 md:h-20 lg:px-8">
          <Link to={routes.home} className="public-brand flex items-center gap-2 min-w-0">
            <BrandLogo
              alt={instituteName}
              className="site-brand-lockup"
            />
          </Link>

          {/* Desktop links */}
          <div className="public-links public-desktop-links hidden items-center gap-8 md:flex">
            {navLinks.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `relative py-2 text-sm font-semibold transition-colors duration-200 ${
                    isActive ? 'text-brand-700 font-bold' : 'text-slate-600 hover:text-brand-600'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activePublicTab"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-brand-600"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="public-auth-actions public-desktop-actions hidden items-center gap-3 md:flex">
            <Link
              to={routes.login}
              className="public-register flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 active:scale-95"
            >
              <span>Go to portal</span>
            </Link>
          </div>

          {/* Mobile actions (< 768px) */}
          <div className="public-mobile-actions flex items-center gap-2 md:hidden">
            <Link
              to={routes.login}
              className="rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-800 active:scale-95"
            >
              Go to portal
            </Link>
            <button
              type="button"
              className="public-menu-toggle flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-slide-drawer"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Slide-in Drawer with Backdrop under 768px */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50 md:hidden" id="mobile-slide-drawer">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-in Drawer from Right */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 right-0 flex w-[280px] max-w-[85vw] flex-col border-l border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <BrandLogo
                  alt={instituteName}
                  className="site-brand-lockup"
                />
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Links inside Drawer */}
              <div className="flex flex-col gap-1.5 py-6">
                <span className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Navigation</span>
                {navLinks.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span>{item.name}</span>
                        {isActive && <div className="h-2 w-2 rounded-full bg-brand-600" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>

              {/* Mobile Auth actions in Drawer */}
              <div className="mt-auto flex flex-col gap-2.5 pt-6 border-t border-slate-100">
                <Link
                  to={routes.login}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 text-center text-sm font-semibold text-white shadow-md transition hover:bg-brand-800 active:scale-98"
                >
                  <span>Go to portal</span>
                </Link>
                <Link
                  to={routes.register}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-98"
                >
                  <ShieldCheck size={16} />
                  <span>Student registration</span>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <RouteTransition routeKey={location.pathname}>
        <Outlet />
      </RouteTransition>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-brand">
            <div className="site-footer-brand-row">
              <BrandLogo alt={instituteName} className="site-footer-brand-row" />
            </div>
            <p>
              Industry-focused technical training for B.Tech students — 30% theory, 70% practical, every single class.
            </p>
          </div>

          <div className="site-footer-column">
            <h3>Explore</h3>
            <ul>
              <li><Link to={routes.home}>Home</Link></li>
              <li><Link to={routes.about}>About</Link></li>
              <li><Link to={routes.courses}>Courses</Link></li>
              <li><Link to={routes.contact}>Contact</Link></li>
            </ul>
          </div>

          <div className="site-footer-column">
            <h3>Portals</h3>
            <ul>
              <li><Link to={routes.login}>Student sign in</Link></li>
              <li><Link to={routes.login}>Staff sign in</Link></li>
              <li><Link to={routes.register}>New registration</Link></li>
            </ul>
          </div>

          <div className="site-footer-column site-footer-contact">
            <h3>Reach us</h3>
            <ul>
              <li>
                <MapPin size={15} aria-hidden="true" />
                <span>Lakmipuram, Tirupati, Andhra Pradesh</span>
              </li>
              <li>
                <Phone size={15} aria-hidden="true" />
                <a href="tel:+919550579055">9550579055</a>
              </li>
              <li>
                <Mail size={15} aria-hidden="true" />
                <a href="mailto:ksr95505@gmail.com">ksr95505@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer-bottom">© {new Date().getFullYear()} {instituteName}. All rights reserved.</div>
      </footer>
    </div>
  );
}
