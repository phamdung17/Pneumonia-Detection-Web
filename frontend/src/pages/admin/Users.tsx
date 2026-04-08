import React, { useState } from "react";
import { 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Shield, 
  User, 
  Mail, 
  Calendar,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronLeft
} from "lucide-react";

const UsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const users = [
    {
      id: "1",
      name: "Dr. Julian Vance",
      email: "julian.vance@pneumolens.ai",
      role: "admin",
      roleLabel: "Quản trị viên",
      status: "active",
      statusLabel: "Hoạt động",
      joinedDate: "2023-01-15",
      avatar: "https://picsum.photos/seed/julian/100/100"
    },
    {
      id: "2",
      name: "Trần Thị B",
      email: "thib.tran@pneumolens.ai",
      role: "doctor",
      roleLabel: "Bác sĩ",
      status: "active",
      statusLabel: "Hoạt động",
      joinedDate: "2023-03-22",
      avatar: "https://picsum.photos/seed/thib/100/100"
    },
    {
      id: "3",
      name: "Nguyễn Văn C",
      email: "vanc.nguyen@pneumolens.ai",
      role: "technician",
      roleLabel: "Kỹ thuật viên",
      status: "inactive",
      statusLabel: "Ngoại tuyến",
      joinedDate: "2023-05-10",
      avatar: "https://picsum.photos/seed/vanc/100/100"
    },
    {
      id: "4",
      name: "Lê Văn D",
      email: "vand.le@pneumolens.ai",
      role: "doctor",
      roleLabel: "Bác sĩ",
      status: "active",
      statusLabel: "Hoạt động",
      joinedDate: "2023-06-05",
      avatar: "https://picsum.photos/seed/vand/100/100"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Quản lý Admin</h1>
          <p className="text-slate-500 font-medium">Quản lý tài khoản người dùng, phân quyền và giám sát hoạt động hệ thống.</p>
        </div>
        
        <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-100 hover:opacity-90 transition-all active:scale-95">
          <UserPlus size={18} />
          Thêm người dùng
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-primary">
            <User size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng người dùng</p>
            <p className="text-2xl font-black text-slate-900">156</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang hoạt động</p>
            <p className="text-2xl font-black text-slate-900">142</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
            <Shield size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quản trị viên</p>
            <p className="text-2xl font-black text-slate-900">12</p>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên, email hoặc vai trò..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
            <Filter size={18} />
            Bộ lọc
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
            Sắp xếp
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Người dùng</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vai trò</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ngày tham gia</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Mail size={12} />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        user.role === 'admin' ? 'bg-sky-50 text-primary' : 
                        user.role === 'doctor' ? 'bg-emerald-50 text-emerald-500' : 
                        'bg-slate-50 text-slate-500'
                      }`}>
                        {user.role === 'admin' ? <Shield size={16} /> : <User size={16} />}
                      </div>
                      <span className="text-sm font-bold text-slate-700">{user.roleLabel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ring-1 ring-inset ${
                      user.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' 
                        : 'bg-slate-50 text-slate-500 ring-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      {user.statusLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                      <Calendar size={14} />
                      {user.joinedDate}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-primary hover:bg-sky-50 rounded-lg transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={16} />
                      </button>
                      <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-slate-50 flex items-center justify-between">
          <span className="text-sm text-slate-400 font-medium">Hiển thị 4 trên 156 người dùng</span>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-20" disabled>
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-1">
              <button className="w-8 h-8 rounded-lg bg-primary text-white font-bold text-sm">1</button>
              <button className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-600 font-bold text-sm">2</button>
              <button className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-600 font-bold text-sm">3</button>
            </div>
            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
