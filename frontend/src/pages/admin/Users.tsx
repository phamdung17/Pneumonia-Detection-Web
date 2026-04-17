import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  CheckCircle2,
  Mail,
  Search,
  Shield,
  User,
  UserPlus,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { PAGE_SIZE, ROLES } from "../../utils/constants";

interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  full_name: string;
  role: "admin" | "client";
  is_active: boolean;
  created_at: string;
}

interface PaginatedUsersResponse {
  items: AdminUser[];
  total: number;
}

const UsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await api.get<PaginatedUsersResponse>("/api/admin/users", {
          params: {
            page: 1,
            limit: PAGE_SIZE,
            search: searchTerm || undefined,
          },
        });
        setUsers(response.data.items);
        setTotal(response.data.total);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const message =
            error.response?.data?.detail?.message ||
            error.response?.data?.message ||
            "Không tải được danh sách người dùng";
          toast.error(message);
        } else {
          toast.error("Không tải được danh sách người dùng");
        }
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const activeUsers = users.filter((user) => user.is_active).length;
  const adminUsers = users.filter((user) => user.role === "admin").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 font-headline text-3xl font-extrabold tracking-tight text-slate-900">
            Quản lý người dùng
          </h1>
          <p className="font-medium text-slate-500">
            Theo dõi tài khoản và phân quyền hệ thống với hai vai trò admin và client.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-sky-50 px-5 py-3 text-sm font-bold text-primary">
          <UserPlus size={18} />
          Tạo admin mới thực hiện trong API quản trị
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-primary">
            <User size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Tổng người dùng
            </p>
            <p className="text-2xl font-black text-slate-900">{total}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Đang hoạt động
            </p>
            <p className="text-2xl font-black text-slate-900">{activeUsers}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
            <Shield size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Admin trên trang
            </p>
            <p className="text-2xl font-black text-slate-900">{adminUsers}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên, username hoặc email"
            className="w-full rounded-xl bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none ring-0 focus:bg-white focus:shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Người dùng
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Vai trò
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Tạo lúc
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm font-medium text-slate-400">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm font-medium text-slate-400">
                    Không có người dùng phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://picsum.photos/seed/${user.username}/100/100`}
                          alt={user.full_name}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{user.full_name}</p>
                          <p className="text-xs font-medium text-slate-400">@{user.username}</p>
                          <p className="flex items-center gap-1 text-xs text-slate-400">
                            <Mail size={12} />
                            {user.email || "-"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            user.role === "admin"
                              ? "bg-sky-50 text-primary"
                              : "bg-slate-50 text-slate-500"
                          }`}
                        >
                          {user.role === "admin" ? <Shield size={16} /> : <User size={16} />}
                        </div>
                        <span className="text-sm font-bold text-slate-700">
                          {ROLES[user.role]}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-tighter ring-1 ring-inset ${
                          user.is_active
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-red-50 text-red-700 ring-red-200"
                        }`}
                      >
                        {user.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {user.is_active ? "active" : "inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">
                      {new Date(user.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
