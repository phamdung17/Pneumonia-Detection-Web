import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  History,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Plus,
  ScrollText,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserCircle2,
  Users,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { DEFAULT_AVATAR, ROLES } from "../utils/constants";

export default function Sidebar() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();

  const navItems = [
    { id: "diagnosis", label: "Chan doan", icon: Stethoscope, path: "/predict" },
    { id: "history", label: "Lich su", icon: History, path: "/history" },
    { id: "stats", label: "Thong ke", icon: BarChart3, path: "/stats" },
    { id: "profile", label: "Ho so", icon: UserCircle2, path: "/profile" },
    ...(user?.role === "admin"
      ? [
          { id: "admin-dashboard", label: "Dashboard admin", icon: LayoutDashboard, path: "/admin" },
          { id: "admin-users", label: "Nguoi dung", icon: Users, path: "/admin/users" },
          { id: "admin-audit", label: "Audit log", icon: ScrollText, path: "/admin/audit" },
        ]
      : []),
  ];

  const avatar = user?.avatar_url || DEFAULT_AVATAR;

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col gap-2 border-r border-slate-100 bg-white px-4 py-6">
      <div className="mb-8 flex items-center gap-3 px-2">
        {isAuthenticated && user ? (
          <>
            <img
              alt={user.full_name}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-primary-container/10"
              src={avatar}
              referrerPolicy="no-referrer"
            />
            <div className="overflow-hidden">
              <p className="truncate text-sm font-bold leading-tight text-slate-900">{user.full_name}</p>
              <p className="text-[10px] font-medium text-slate-500">
                {ROLES[user.role as keyof typeof ROLES]}
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <UserCircle2 className="text-slate-400" size={20} />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-slate-900">Khach</p>
              <p className="text-[10px] font-medium text-slate-500">Che do xem truoc</p>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-headline text-sm font-medium transition-all duration-200 ${
                isActive ? "bg-sky-50 text-primary" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <Link
          to="/predict"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-lg shadow-sky-100 transition-transform active:scale-95"
        >
          <Plus size={18} />
          Phan tich moi
        </Link>

        {isAuthenticated ? (
          <button
            onClick={() => logout()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 transition-transform active:scale-95"
          >
            <LogOut size={16} />
            Dang xuat
          </button>
        ) : (
          <Link
            to="/login"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-sm font-bold text-slate-500 transition-transform active:scale-95"
          >
            <LogIn size={16} />
            Dang nhap
          </Link>
        )}

        <div className="space-y-1 border-t border-slate-100 pt-4">
          <Link to="/profile" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-slate-50">
            <Settings size={18} />
            <span>Ho so va bao mat</span>
          </Link>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-slate-50">
            <Info size={18} />
            <span>Ho tro</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
