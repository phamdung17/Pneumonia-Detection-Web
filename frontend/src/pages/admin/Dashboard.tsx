import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";

interface DashboardSummary {
  total_users: number;
  active_users: number;
  inactive_users: number;
  total_predictions: number;
  done_predictions: number;
  failed_predictions: number;
}

const cards: Array<{ key: keyof DashboardSummary; title: string; tone: string }> = [
  { key: "total_users", title: "Tong nguoi dung", tone: "bg-sky-50 text-primary" },
  { key: "active_users", title: "Dang hoat dong", tone: "bg-emerald-50 text-emerald-700" },
  { key: "inactive_users", title: "Tam khoa", tone: "bg-amber-50 text-amber-700" },
  { key: "total_predictions", title: "Tong prediction", tone: "bg-indigo-50 text-indigo-700" },
  { key: "done_predictions", title: "Prediction thanh cong", tone: "bg-teal-50 text-teal-700" },
  { key: "failed_predictions", title: "Prediction loi", tone: "bg-rose-50 text-rose-700" },
];

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get<DashboardSummary>("/api/admin/dashboard");
        setSummary(response.data);
      } catch (error: any) {
        toast.error(error?.response?.data?.detail?.message || "Khong tai duoc dashboard admin.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <h1 className="font-headline text-3xl font-black text-slate-900">Dashboard admin</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Theo doi nhanh tinh trang nguoi dung va ket qua van hanh cua he thong.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div key={card.key} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${card.tone}`}>
              {card.title}
            </div>
            <div className="mt-5 text-4xl font-black text-slate-900">
              {loading ? "-" : summary?.[card.key].toLocaleString("vi-VN")}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
