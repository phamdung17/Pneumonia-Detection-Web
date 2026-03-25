import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

function pageMeta(pathname) {
  if (pathname.startsWith('/batch')) return { crumbs: ['Home', 'Batch'], title: 'Batch Analysis Queue', subtitle: 'Orchestrating AI diagnostics for high-volume radiology streams.', search: 'Search batch ID...' };
  if (pathname.startsWith('/history/')) return { crumbs: ['History', 'Detail'], title: 'Case Detail', subtitle: 'Full heatmap results, AI prediction, and physician confirmation.', search: 'Search case ID...' };
  if (pathname.startsWith('/history')) return { crumbs: ['Home', 'History'], title: 'Diagnostic Archives', subtitle: 'Review and manage clinical history across all radiological assessments.', search: 'Search records...' };
  if (pathname.startsWith('/stats')) return { crumbs: ['Home', 'Statistics'], title: 'Performance Metrics', subtitle: 'Aggregated clinical data from the last 30 operational days.', search: 'Search patient ID or date...' };
  if (pathname.startsWith('/profile')) return { crumbs: ['Home', 'Profile'], title: 'User Profile', subtitle: 'Manage your account settings and change password.', search: 'Search...' };
  if (pathname.startsWith('/admin/audit')) return { crumbs: ['Admin', 'Audit'], title: 'System Audit Logs', subtitle: 'Track important administrative actions.', search: 'Search system logs...' };
  if (pathname.startsWith('/admin')) return { crumbs: ['Admin', 'Users'], title: 'User Directory', subtitle: 'Manage access levels, departments, and security status for all clinical and administrative personnel.', search: 'Search system logs...' };
  if (pathname.startsWith('/login')) return { crumbs: ['Home', 'Login'], title: 'Sign In', subtitle: 'Authenticate to access full features.', search: '' };
  if (pathname.startsWith('/register')) return { crumbs: ['Home', 'Register'], title: 'Create Account', subtitle: 'Register a new user account.', search: '' };
  return { crumbs: ['Home', 'Diagnosis'], title: 'Predictive Analysis', subtitle: 'Upload high-resolution chest radiographies for rapid AI-assisted pneumonia detection and sub-type classification.', search: 'Search patient ID...' };
}

export default function Layout({ children }) {
  const location = useLocation();
  const [offline, setOffline] = useState(!navigator.onLine);
  const meta = pageMeta(location.pathname);

  useEffect(() => {
    const toOffline = () => setOffline(true);
    const toOnline = () => setOffline(false);
    window.addEventListener('offline', toOffline);
    window.addEventListener('online', toOnline);
    return () => {
      window.removeEventListener('offline', toOffline);
      window.removeEventListener('online', toOnline);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <Sidebar />

      <main className="ml-64 min-h-screen">
        {/* Offline Banner */}
        {offline ? (
          <div className="flex items-center gap-2 bg-tertiary px-6 py-3 text-sm font-medium text-white">
            <span className="material-symbols-outlined text-base">wifi_off</span>
            Lost network connection — some features may be unavailable.
          </div>
        ) : null}

        {/* Top App Bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-100 bg-white/70 px-8 backdrop-blur-xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm font-medium font-headline">
            {meta.crumbs.map((crumb, i) => (
              <span key={crumb} className="flex items-center gap-2">
                {i > 0 && <span className="material-symbols-outlined text-xs text-slate-300">chevron_right</span>}
                <span className={i === meta.crumbs.length - 1 ? 'font-semibold text-sky-700 border-b-2 border-sky-600' : 'text-slate-400'}>
                  {crumb}
                </span>
              </span>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-6">
            {meta.search ? (
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input
                  className="w-64 rounded-full bg-surface-container-low border-none pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary-container"
                  placeholder={meta.search}
                  type="text"
                />
              </div>
            ) : null}
            <div className="flex items-center gap-4">
              <button className="relative text-slate-400 transition-colors hover:text-slate-900">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-tertiary" />
              </button>
              <button className="text-slate-400 transition-colors hover:text-slate-900">
                <span className="material-symbols-outlined">account_circle</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="mx-auto max-w-7xl space-y-8 p-8">
          {/* Page Heading */}
          <section className="space-y-2">
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">{meta.title}</h1>
            <p className="max-w-2xl text-on-surface-variant">{meta.subtitle}</p>
          </section>

          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  );
}
