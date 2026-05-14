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

const formatDetailLabel = (key: string) =>
  key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatPrimitiveValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  return String(value);
};

function AuditDetailValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400">-</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-slate-400">-</span>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {value.map((item, index) => {
          if (typeof item === "object" && item !== null) {
            return (
              <div key={index} className="w-full rounded-xl border border-slate-200 bg-white p-3">
                <AuditDetailValue value={item} />
              </div>
            );
          }

          return (
            <span
              key={`${String(item)}-${index}`}
              className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200"
            >
              {formatPrimitiveValue(item)}
            </span>
          );
        })}
      </div>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, nestedValue]) => nestedValue !== null && nestedValue !== undefined && nestedValue !== "",
    );

    if (entries.length === 0) {
      return <span className="text-slate-400">-</span>;
    }

    return (
      <div className="space-y-2">
        {entries.map(([nestedKey, nestedValue]) => (
          <div key={nestedKey} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {formatDetailLabel(nestedKey)}
            </p>
            <div className="mt-1 text-xs text-slate-600">
              <AuditDetailValue value={nestedValue} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-xs font-medium text-slate-700">{formatPrimitiveValue(value)}</span>;
}

function AuditDetailCard({ detail }: { detail: Record<string, unknown> | null }) {
  if (!detail) {
    return <span className="text-slate-400">-</span>;
  }

  const entries = Object.entries(detail).filter(
    ([, value]) => value !== null && value !== undefined && value !== "",
  );

  if (entries.length === 0) {
    return <span className="text-slate-400">-</span>;
  }

  return (
    <div className="min-w-[18rem] space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {formatDetailLabel(key)}
          </p>
          <div className="mt-1">
            <AuditDetailValue value={value} />
          </div>
        </div>
      ))}
    </div>
  );
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
        toast.error(error?.response?.data?.detail?.message || "Không tải được audit log.");
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
          Theo dõi các thao tác quan trọng của người dùng và quản trị viên.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <input
          className="w-full rounded-2xl bg-slate-50 px-4 py-3 outline-none transition focus:bg-white focus:shadow-sm"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo action, target type hoặc target id"
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">Thời gian</th>
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
                    Đang tải audit log...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                    Chưa có bản ghi phù hợp.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="align-top hover:bg-slate-50/60">
                    <td className="px-5 py-4 text-sm font-medium text-slate-600">{log.created_at_local}</td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-800">{log.action}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{log.target_display}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{log.user_id ?? "-"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{log.ip_address || "-"}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      <AuditDetailCard detail={log.detail} />
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
