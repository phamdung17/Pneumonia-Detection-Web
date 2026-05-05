import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { PAGE_SIZE } from "../../utils/constants";

interface AuditLogItem {
  id: number;
  user_id: number | null;
  action: string;
  target_type: string;
  target_id: string | null;
  target_display: string;
  ip_address: string | null;
  user_agent: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
  created_at_local: string;
}

interface PaginatedAuditResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const response = await api.get<PaginatedAuditResponse>("/api/admin/audit", {
          params: {
            page: 1,
            limit: PAGE_SIZE,
            search: search || undefined,
          },
        });
        setLogs(response.data.items);
      } catch (error: any) {
        toast.error(error?.response?.data?.detail?.message || "Khong tai duoc audit log.");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <h1 className="font-headline text-3xl font-black text-slate-900">Audit log</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Theo doi cac thao tac quan trong cua nguoi dung va quan tri vien.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <input
          className="w-full rounded-2xl bg-slate-50 px-4 py-3 outline-none transition focus:bg-white focus:shadow-sm"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tim theo action, target type hoac target id"
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">Thoi gian</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">Action</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">Target</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">User ID</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">IP</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                    Dang tai audit log...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                    Chua co ban ghi phu hop.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="align-top hover:bg-slate-50/60">
                    <td className="px-5 py-4 text-sm font-medium text-slate-600">
                      {log.created_at_local}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-800">{log.action}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{log.target_display}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{log.user_id ?? "-"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{log.ip_address || "-"}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      <pre className="max-w-sm overflow-x-auto whitespace-pre-wrap break-words">
                        {log.detail ? JSON.stringify(log.detail, null, 2) : "-"}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
