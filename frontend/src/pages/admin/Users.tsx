import { FormEvent, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { DEFAULT_AVATAR, PAGE_SIZE, ROLES } from "../../utils/constants";

interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  full_name: string;
  role: "admin" | "client";
  is_active: boolean;
  created_at: string;
  last_login?: string | null;
}

interface PaginatedUsersResponse {
  items: AdminUser[];
  total: number;
}

interface UserFormState {
  role: "admin" | "client";
  is_active: boolean;
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [formState, setFormState] = useState<UserFormState>({ role: "client", is_active: true });

  const activeUsers = useMemo(() => users.filter((user) => user.is_active).length, [users]);
  const adminUsers = useMemo(() => users.filter((user) => user.role === "admin").length, [users]);

  const loadUsers = async (searchValue = searchTerm) => {
    setIsLoading(true);
    try {
      const response = await api.get<PaginatedUsersResponse>("/api/admin/users", {
        params: {
          page: 1,
          limit: PAGE_SIZE,
          search: searchValue || undefined,
        },
      });
      setUsers(response.data.items);
      setTotal(response.data.total);
      if (selectedUser) {
        const latestSelected = response.data.items.find((item) => item.id === selectedUser.id) || null;
        setSelectedUser(latestSelected);
        if (latestSelected) {
          setFormState({
            role: latestSelected.role,
            is_active: latestSelected.is_active,
          });
        }
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.detail?.message || "Không tải được danh sách người dùng.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers(searchTerm);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectUser = (user: AdminUser) => {
    setSelectedUser(user);
    setFormState({
      role: user.role,
      is_active: user.is_active,
    });
  };

  const handleUpdateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.put<AdminUser>(`/api/admin/users/${selectedUser.id}`, formState);
      setSelectedUser(response.data);
      setUsers((prev) => prev.map((user) => (user.id === response.data.id ? response.data : user)));
      toast.success("Cập nhật người dùng thành công.");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail?.message || "Không cập nhật được người dùng.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLockToggle = async (user: AdminUser) => {
    setIsSaving(true);
    try {
      if (user.is_active) {
        await api.put(`/api/admin/users/${user.id}/lock`);
        toast.success("Đã khóa tài khoản.");
      } else {
        await api.put(`/api/admin/users/${user.id}`, { is_active: true });
        toast.success("Đã mở khóa tài khoản.");
      }
      await loadUsers(searchTerm);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail?.message || "Không thay đổi được trạng thái tài khoản.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlockLoginAttempts = async (user: AdminUser) => {
    setIsSaving(true);
    try {
      await api.put(`/api/admin/users/${user.id}/unlock`);
      toast.success("Đã mở khóa đăng nhập.");
      await loadUsers(searchTerm);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail?.message || "Không mở khóa được tài khoản.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 font-headline text-3xl font-extrabold tracking-tight text-slate-900">
            Quản lý người dùng
          </h1>
          <p className="font-medium text-slate-500">
            Theo dõi tài khoản, đổi vai trò và khóa/mở khóa truy cập của người dùng.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tổng người dùng</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{total}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Đang hoạt động</p>
          <p className="mt-3 text-3xl font-black text-emerald-600">{activeUsers}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Admin trên trang</p>
          <p className="mt-3 text-3xl font-black text-primary">{adminUsers}</p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <input
              type="text"
              placeholder="Tìm theo tên, username, email hoặc số điện thoại"
              className="w-full rounded-xl bg-slate-50 py-2.5 px-4 text-sm outline-none ring-0 focus:bg-white focus:shadow-sm"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="divide-y divide-slate-50">
              {isLoading ? (
                <div className="px-6 py-10 text-center text-sm font-medium text-slate-400">Đang tải dữ liệu...</div>
              ) : users.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm font-medium text-slate-400">Không có người dùng phù hợp.</div>
              ) : (
                users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className={`flex w-full items-start gap-4 px-6 py-4 text-left transition hover:bg-slate-50 ${
                      selectedUser?.id === user.id ? "bg-sky-50/70" : ""
                    }`}
                  >
                    <img
                      src={user.avatar_url || DEFAULT_AVATAR}
                      alt={user.full_name}
                      className="h-12 w-12 rounded-2xl object-cover ring-2 ring-slate-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">{user.full_name}</p>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                          user.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}>
                          {user.is_active ? "active" : "inactive"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-500">@{user.username}</p>
                      <p className="mt-1 text-xs text-slate-400">{user.email || "-"}</p>
                      <p className="mt-1 text-xs text-slate-400">{user.phone || "Chưa cập nhật số điện thoại"}</p>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <p>{ROLES[user.role]}</p>
                      <p className="mt-2">{new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          {!selectedUser ? (
            <div className="flex h-full min-h-[320px] items-center justify-center text-center text-sm font-medium text-slate-400">
              Chọn một người dùng để xem và cập nhật thông tin quản trị.
            </div>
          ) : (
            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src={selectedUser.avatar_url || DEFAULT_AVATAR}
                  alt={selectedUser.full_name}
                  className="h-16 w-16 rounded-3xl object-cover ring-4 ring-slate-50"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h2 className="font-headline text-2xl font-black text-slate-900">{selectedUser.full_name}</h2>
                  <p className="text-sm font-medium text-slate-500">@{selectedUser.username}</p>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>Email: <span className="font-semibold text-slate-800">{selectedUser.email || "-"}</span></p>
                <p>Số điện thoại: <span className="font-semibold text-slate-800">{selectedUser.phone || "-"}</span></p>
                <p>Lần đăng nhập cuối: <span className="font-semibold text-slate-800">{selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : "Chưa có"}</span></p>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Vai trò</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-300"
                  value={formState.role}
                  onChange={(event) => setFormState((prev) => ({ ...prev, role: event.target.value as "admin" | "client" }))}
                >
                  <option value="client">Người dùng</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={formState.is_active}
                  onChange={(event) => setFormState((prev) => ({ ...prev, is_active: event.target.checked }))}
                />
                <span className="text-sm font-semibold text-slate-700">Tài khoản được phép đăng nhập</span>
              </label>

              <div className="grid gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white transition disabled:opacity-60"
                >
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <button
                  type="button"
                  onClick={() => handleLockToggle(selectedUser)}
                  disabled={isSaving}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition disabled:opacity-60"
                >
                  {selectedUser.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                </button>
                <button
                  type="button"
                  onClick={() => handleUnlockLoginAttempts(selectedUser)}
                  disabled={isSaving}
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition disabled:opacity-60"
                >
                  Reset khóa đăng nhập
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
