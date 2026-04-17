import { useLocation, Link } from "react-router-dom";
import {
  Stethoscope,
  History,
  BarChart3,
  ShieldCheck,
  Plus,
  Settings,
  Info,
  LogOut,
  LogIn,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { ROLES } from "../utils/constants";

export default function Sidebar() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();

  const navItems = [
    { id: "diagnosis", label: "Chẩn đoán", icon: Stethoscope, path: "/predict" },
    { id: "history", label: "Lịch sử", icon: History, path: "/history" },
    { id: "stats", label: "Thống kê", icon: BarChart3, path: "/stats" },
    ...(user?.role === "admin"
      ? [{ id: "admin", label: "Quản lý người dùng", icon: ShieldCheck, path: "/admin/users" }]
      : []),
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col gap-2 border-r border-slate-100 bg-white px-4 py-6">
      <div className="mb-8 flex items-center gap-3 px-2">
        {isAuthenticated && user ? (
          <>
            <img
              alt={user.full_name}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-primary-container/10"
              src={`https://picsum.photos/seed/${user.username}/100/100`}
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
              <span className="material-symbols-outlined text-slate-400">person</span>
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-slate-900">Khách</p>
              <p className="text-[10px] font-medium text-slate-500">Chế độ xem trước</p>
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
              <Icon size={18} fill={isActive ? "currentColor" : "none"} />
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
          Phân tích mới
        </Link>

        {isAuthenticated ? (
          <button
            onClick={() => logout()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 transition-transform active:scale-95"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        ) : (
          <Link
            to="/login"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-sm font-bold text-slate-500 transition-transform active:scale-95"
          >
            <LogIn size={16} />
            Đăng nhập
          </Link>
        )}

        <div className="space-y-1 border-t border-slate-100 pt-4">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-slate-50">
            <Settings size={18} />
            <span>Cài đặt</span>
          </button>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-slate-50">
            <Info size={18} />
            <span>Hỗ trợ</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
