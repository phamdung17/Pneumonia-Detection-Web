import React from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import type { User } from "../../stores/authStore";

export default function PendingApprovalsPage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

  const loadPending = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/admin/approvals", {
        params: {
          search: search || undefined,
          role: roleFilter || undefined,
        },
      });
      setUsers(response.data.items || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Khong the tai danh sach phe duyet");
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  React.useEffect(() => {
    void loadPending();
  }, [loadPending]);

  const decide = async (userId: number, action: "approve" | "reject") => {
    try {
      await api.post(`/api/admin/approvals/${userId}/${action}`, { reason: null });
      toast.success(action === "approve" ? "Da phe duyet tai khoan" : "Da tu choi tai khoan");
      await loadPending();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Cap nhat phe duyet that bai");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-slate-900">Pending approvals</h1>
        <p className="mt-2 text-slate-500">Xem chi tiet yeu cau dang ky moi va phe duyet hoac tu choi.</p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
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
              <option value="doctor">Doctor</option>
              <option value="technician">Technician</option>
            </select>
            <button onClick={() => void loadPending()} className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white">
              Lam moi
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400">
                  <th className="px-3 py-4">Nguoi dung</th>
                  <th className="px-3 py-4">Vai tro</th>
                  <th className="px-3 py-4">Phong ban</th>
                  <th className="px-3 py-4">Hanh dong</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-3 py-6 text-slate-400" colSpan={4}>Dang tai...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td className="px-3 py-6 text-slate-400" colSpan={4}>Khong co tai khoan cho phe duyet.</td></tr>
                ) : users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-3 py-4">
                      <button onClick={() => setSelectedUser(user)} className="text-left">
                        <div className="font-semibold text-slate-900">{user.full_name}</div>
                        <div className="text-sm text-slate-500">{user.username} • {user.email}</div>
                      </button>
                    </td>
                    <td className="px-3 py-4 text-sm font-medium text-slate-700">{user.role}</td>
                    <td className="px-3 py-4 text-sm text-slate-600">{user.department || "-"}</td>
                    <td className="px-3 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => void decide(user.id, "approve")} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                          Approve
                        </button>
                        <button onClick={() => void decide(user.id, "reject")} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="font-headline text-xl font-bold text-slate-900">Xem chi tiet user</h2>
          {selectedUser ? (
            <div className="mt-5 space-y-4 text-sm">
              <div><span className="font-semibold text-slate-900">Ho ten:</span> {selectedUser.full_name}</div>
              <div><span className="font-semibold text-slate-900">Username:</span> {selectedUser.username}</div>
              <div><span className="font-semibold text-slate-900">Email:</span> {selectedUser.email}</div>
              <div><span className="font-semibold text-slate-900">Vai tro:</span> {selectedUser.role}</div>
              <div><span className="font-semibold text-slate-900">Phong ban:</span> {selectedUser.department || "-"}</div>
              <div><span className="font-semibold text-slate-900">Trang thai duyet:</span> {selectedUser.approval_status}</div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <button onClick={() => void decide(selectedUser.id, "approve")} className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  Phe duyet
                </button>
                <button onClick={() => void decide(selectedUser.id, "reject")} className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  Tu choi
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-500">Chon mot user trong danh sach ben trai de xem day du thong tin.</p>
          )}
        </section>
      </div>
    </div>
  );
}
