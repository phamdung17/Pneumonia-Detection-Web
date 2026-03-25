import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { NAV_ITEMS } from '../../utils/constants';
import { getInitials, getRoleLabel } from '../../utils/formatters';

const GUEST_ITEMS = ['/predict', '/batch', '/history', '/stats'];

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const allowedItems = user
    ? NAV_ITEMS.filter((item) => item.roles.includes(user?.role))
    : NAV_ITEMS.filter((item) => GUEST_ITEMS.includes(item.to));

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-slate-200 bg-slate-50 px-4 py-6">
      {/* Logo */}
      <div className="mb-10 px-2 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl primary-gradient text-white shadow-lg">
          <span className="material-symbols-outlined">biotech</span>
        </div>
        <span className="font-headline text-xl font-bold tracking-tighter text-sky-900">PneumoLens</span>
      </div>

      {/* User Info */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-gradient font-headline text-sm font-bold text-white ring-2 ring-primary/20">
          {getInitials(user?.full_name || user?.username || 'AI')}
        </div>
        <div>
          <p className="text-sm font-bold text-on-surface leading-none">{user?.full_name || 'Guest User'}</p>
          <p className="text-xs text-slate-500">{user ? getRoleLabel(user.role) : 'Preview mode'}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {allowedItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm font-semibold tracking-tight transition-colors ${
                isActive
                  ? 'rounded-lg bg-white text-sky-700 shadow-sm font-bold'
                  : 'text-slate-500 hover:bg-slate-100'
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto space-y-1 border-t border-slate-200 pt-6">
        {user ? (
          <button
            className="primary-gradient mb-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-95"
            onClick={() => navigate('/predict')}
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Analysis
          </button>
        ) : (
          <button
            className="primary-gradient mb-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-95"
            onClick={() => navigate('/login?next=/predict')}
          >
            <span className="material-symbols-outlined text-sm">login</span>
            Login
          </button>
        )}
        <a className="flex items-center gap-3 px-4 py-2 text-sm font-semibold tracking-tight text-slate-500 transition-colors hover:bg-slate-100" href="#">
          <span className="material-symbols-outlined">settings</span>
          Settings
        </a>
        <a className="flex items-center gap-3 px-4 py-2 text-sm font-semibold tracking-tight text-slate-500 transition-colors hover:bg-slate-100" href="#">
          <span className="material-symbols-outlined">help</span>
          Support
        </a>
        {user ? (
          <button
            className="flex w-full items-center gap-3 px-4 py-2 text-sm font-semibold tracking-tight text-slate-500 transition-colors hover:bg-slate-100"
            onClick={async () => {
              await logout();
              navigate('/predict');
            }}
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        ) : null}
      </div>
    </aside>
  );
}
