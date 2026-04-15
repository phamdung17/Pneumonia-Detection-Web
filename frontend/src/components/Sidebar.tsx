import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Stethoscope,
  History,
  BarChart3,
  ShieldCheck,
  ClipboardList,
  LogOut,
  LogIn,
  UserRound,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { ROLES } from "../utils/constants";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const navItems = [
    { id: "predict", label: "Chan doan", icon: Stethoscope, path: "/predict", roles: ["admin", "doctor", "technician"] },
    { id: "history", label: "Lich su", icon: History, path: "/history", roles: ["admin", "doctor", "technician"] },
    { id: "stats", label: "Thong ke", icon: BarChart3, path: "/stats", roles: ["admin", "doctor"] },
    { id: "approvals", label: "Phe duyet", icon: ClipboardList, path: "/admin/approvals", roles: ["admin"] },
    { id: "users", label: "Nguoi dung", icon: ShieldCheck, path: "/admin/users", roles: ["admin"] },
  ];

  const visibleItems = isAuthenticated && user
    ? navItems.filter((item) => item.roles.includes(user.role))
    : [];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col gap-2 border-r border-slate-100 bg-white px-4 py-6">
      <div className="mb-8 px-2">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <img
              alt={user.full_name}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-primary-container/10"
              src={`https://picsum.photos/seed/${user.username}/100/100`}
              referrerPolicy="no-referrer"
            />
            <div className="overflow-hidden">
              <p className="truncate text-sm font-bold leading-tight text-slate-900">{user.full_name}</p>
              <p className="text-[10px] font-medium text-slate-500">{ROLES[user.role]}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <UserRound className="text-slate-400" size={18} />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-slate-900">Khach</p>
              <p className="text-[10px] font-medium text-slate-500">Can dang nhap</p>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
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
        {isAuthenticated ? (
          <button
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 transition-transform active:scale-95"
          >
            <LogOut size={16} />
            Dang xuat
          </button>
        ) : (
          <Link
            to="/login"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition-transform active:scale-95"
          >
            <LogIn size={16} />
            Dang nhap
          </Link>
        )}
      </div>
    </aside>
  );
}
