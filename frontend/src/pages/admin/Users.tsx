import React from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import type { ApprovalStatus, User, UserRole } from "../../stores/authStore";

const emptyForm = {
  full_name: "",
  username: "",
  email: "",
  password: "",
  role: "doctor" as UserRole,
  department: "",
};

export default function UsersPage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("");
  const [approvalFilter, setApprovalFilter] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [creating, setCreating] = React.useState(false);

  const loadUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/admin/users", {
        params: {
          search: search || undefined,
          role: roleFilter || undefined,
          approval_status: approvalFilter || undefined,
        },
      });
      setUsers(response.data.items || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Khong the tai danh sach nguoi dung");
    } finally {
      setLoading(false);
    }
  }, [approvalFilter, roleFilter, search]);

  React.useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const updateUser = async (userId: number, payload: Partial<User>) => {
    try {
      await api.put(`/api/admin/users/${userId}`, payload);
      toast.success("Da cap nhat nguoi dung");
      await loadUsers();
      if (selectedUser?.id === userId) {
        const detail = await api.get(`/api/admin/users/${userId}`);
        setSelectedUser(detail.data);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Cap nhat that bai");
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/api/admin/users", {
        ...form,
        department: form.department || null,
      });
      toast.success("Da tao nguoi dung moi");
      setForm(emptyForm);
      await loadUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Tao nguoi dung that bai");
    } finally {
      setCreating(false);
    }
  };

  const approvalBadge = (status: ApprovalStatus) => {
    if (status === "approved") return "bg-emerald-50 text-emerald-700";
    if (status === "rejected") return "bg-red-50 text-red-700";
    return "bg-amber-50 text-amber-700";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-slate-900">Quan ly nguoi dung</h1>
        <p className="mt-2 text-slate-500">Xem danh sach, sua quyen, khoa/mo khoa va tao tai khoan duoc phe duyet san.</p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tim theo ten, username, email"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="">Tat ca vai tro</option>
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
              <option value="technician">Technician</option>
            </select>
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="">Tat ca trang thai duyet</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button onClick={() => void loadUsers()} className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white">
              Lam moi
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400">
                  <th className="px-3 py-4">Nguoi dung</th>
                  <th className="px-3 py-4">Vai tro</th>
                  <th className="px-3 py-4">Phe duyet</th>
                  <th className="px-3 py-4">Kich hoat</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-3 py-6 text-slate-400" colSpan={4}>Dang tai...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td className="px-3 py-6 text-slate-400" colSpan={4}>Khong co nguoi dung phu hop.</td></tr>
                ) : users.map((user) => (
                  <tr key={user.id} className="cursor-pointer border-b border-slate-50 hover:bg-slate-50/60" onClick={() => setSelectedUser(user)}>
                    <td className="px-3 py-4">
                      <div className="font-semibold text-slate-900">{user.full_name}</div>
                      <div className="text-sm text-slate-500">{user.username} • {user.email}</div>
                    </td>
                    <td className="px-3 py-4 text-sm font-medium text-slate-700">{user.role}</td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${approvalBadge(user.approval_status)}`}>
                        {user.approval_status}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${user.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {user.is_active ? "active" : "inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="font-headline text-xl font-bold text-slate-900">Chi tiet nguoi dung</h2>
            {selectedUser ? (
              <div className="mt-4 space-y-4 text-sm">
                <div><span className="font-semibold text-slate-900">Ho ten:</span> {selectedUser.full_name}</div>
                <div><span className="font-semibold text-slate-900">Username:</span> {selectedUser.username}</div>
                <div><span className="font-semibold text-slate-900">Email:</span> {selectedUser.email}</div>
                <div><span className="font-semibold text-slate-900">Vai tro:</span> {selectedUser.role}</div>
                <div><span className="font-semibold text-slate-900">Phong ban:</span> {selectedUser.department || "-"}</div>
                <div><span className="font-semibold text-slate-900">Phe duyet:</span> {selectedUser.approval_status}</div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => void updateUser(selectedUser.id, { is_active: !selectedUser.is_active })}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700"
                  >
                    {selectedUser.is_active ? "Vo hieu hoa" : "Kich hoat"}
                  </button>
                  <button
                    onClick={() => void updateUser(selectedUser.id, { approval_status: selectedUser.approval_status === "rejected" ? "approved" : "rejected" })}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700"
                  >
                    {selectedUser.approval_status === "rejected" ? "Bo tu choi" : "Danh dau tu choi"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Chon mot nguoi dung trong bang de xem chi tiet.</p>
            )}
          </div>

          <form onSubmit={createUser} className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="font-headline text-xl font-bold text-slate-900">Tao nguoi dung moi</h2>
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Ho va ten" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary" required />
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Username" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary" required />
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary" required />
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mat khau" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary" required />
            <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Phong ban" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary" />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary">
              <option value="doctor">Doctor</option>
              <option value="technician">Technician</option>
              <option value="admin">Admin</option>
            </select>
            <button disabled={creating} className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
              {creating ? "Dang tao..." : "Tao tai khoan"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
