import { useLocation, Link } from "react-router-dom";
import { 
  Stethoscope, 
  Layers, 
  History, 
  BarChart3, 
  ShieldCheck, 
  Plus, 
  Settings,
  Info,
  LogOut,
  LogIn
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
    { id: "admin", label: "Quản lý Admin", icon: ShieldCheck, path: "/admin/users" },
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 border-r border-slate-100 bg-white flex flex-col py-6 px-4 gap-2 z-40">
      {/* User Profile at Top */}
      <div className="mb-8 px-2 flex items-center gap-3">
        {isAuthenticated && user ? (
          <>
            <img 
              alt={user.full_name} 
              className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-container/10" 
              src={`https://picsum.photos/seed/${user.username}/100/100`}
              referrerPolicy="no-referrer"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 leading-tight truncate">{user.full_name}</p>
              <p className="text-[10px] text-slate-500 font-medium">{ROLES[user.role as keyof typeof ROLES]}</p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-400">person</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">Khách</p>
              <p className="text-[10px] text-slate-500 font-medium">Chế độ xem trước</p>
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 font-headline font-medium text-sm ${
                isActive 
                  ? "bg-sky-50 text-primary" 
                  : "text-slate-500 hover:bg-slate-50"
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
          className="w-full bg-primary text-white py-3 rounded-xl font-headline font-bold text-sm shadow-lg shadow-sky-100 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Plus size={18} />
          Phân tích mới
        </Link>

        {isAuthenticated ? (
          <button 
            onClick={() => logout()}
            className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-headline font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        ) : (
          <Link 
            to="/login"
            className="w-full bg-slate-50 text-slate-500 py-3 rounded-xl font-headline font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <LogIn size={16} />
            Đăng nhập
          </Link>
        )}

        <div className="pt-4 border-t border-slate-100 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-50 transition-all font-headline font-medium text-sm rounded-lg">
            <Settings size={18} />
            <span>Cài đặt</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-50 transition-all font-headline font-medium text-sm rounded-lg">
            <Info size={18} />
            <span>Hỗ trợ</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
