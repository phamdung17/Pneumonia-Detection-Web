import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Flame,
  LoaderCircle,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import api from "../api/axios";
import { formatDate, getPredictionBadgeStyle, getPredictionLabel } from "../utils/formatters";

interface WeeklyTrendItem {
  date: string;
  label: string;
  total: number;
  done: number;
  pneumonia: number;
  normal: number;
}

interface DistributionItem {
  name: string;
  value: number;
  percent: number;
  color: string;
}

interface ReviewStatusItem {
  name: string;
  value: number;
}

interface RecentActivityItem {
  id: number;
  created_at: string;
  status: "queued" | "processing" | "done" | "failed";
  prediction: "NORMAL" | "PNEUMONIA" | null;
  confidence: number | null;
  patient_name: string | null;
  processing_time_ms: number | null;
}

interface DashboardResponse {
  user_id: number;
  is_mock: boolean;
  summary: {
    total_cases: number;
    completed_cases: number;
    pending_cases: number;
    failed_cases: number;
    pneumonia_cases: number;
    normal_cases: number;
    pneumonia_rate: number;
    avg_confidence: number;
    avg_processing_seconds: number;
    last_activity_at: string | null;
  };
  diagnosis_distribution: DistributionItem[];
  review_status: ReviewStatusItem[];
  weekly_trend: WeeklyTrendItem[];
  recent_activity: RecentActivityItem[];
}

const statusLabel: Record<RecentActivityItem["status"], string> = {
  queued: "Đang chờ",
  processing: "Đang xử lý",
  done: "Hoàn tất",
  failed: "Lỗi",
};

const statusStyle: Record<RecentActivityItem["status"], string> = {
  queued: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-sky-50 text-sky-700 border-sky-200",
  done: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
};

const StatsPage: React.FC = () => {
  const [data, setData] = React.useState<DashboardResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadDashboard = async () => {
      try {
        setError(null);
        const response = await api.get<DashboardResponse>("/api/stats/dashboard/me");
        setData(response.data);
      } catch {
        setError("Không thể tải thống kê lúc này. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 text-slate-500">
          <LoaderCircle className="animate-spin" size={18} />
          <span className="font-semibold">Đang tải dashboard thống kê...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-red-700">
        <div className="mb-2 flex items-center gap-2 font-bold">
          <AlertTriangle size={18} />
          Không tải được thống kê
        </div>
        <p className="text-sm">{error || "Dữ liệu thống kê không khả dụng."}</p>
      </div>
    );
  }

  const summaryCards = [
    {
      title: "Tổng ca chẩn đoán",
      value: data.summary.total_cases.toLocaleString("vi-VN"),
      sub: `${data.summary.completed_cases} đã hoàn tất`,
      icon: <BarChart3 size={18} className="text-primary" />,
      iconBg: "bg-sky-50",
    },
    {
      title: "Ca viêm phổi",
      value: data.summary.pneumonia_cases.toLocaleString("vi-VN"),
      sub: `${data.summary.pneumonia_rate}% trên tổng ca hoàn tất`,
      icon: <Flame size={18} className="text-red-600" />,
      iconBg: "bg-red-50",
    },
    {
      title: "Độ tin cậy trung bình",
      value: `${data.summary.avg_confidence.toFixed(1)}%`,
      sub: "Được tính từ các ca hoàn tất",
      icon: <ShieldCheck size={18} className="text-emerald-600" />,
      iconBg: "bg-emerald-50",
    },
    {
      title: "Thời gian xử lý TB",
      value: `${data.summary.avg_processing_seconds.toFixed(1)}s`,
      sub: `${data.summary.pending_cases} ca đang xử lý`,
      icon: <Clock3 size={18} className="text-indigo-600" />,
      iconBg: "bg-indigo-50",
    },
  ];

  const hasRecentActivity = data.recent_activity.length > 0;

  return (
    <div className="space-y-10 pb-12">
      <section>
        <div className="mb-2 flex items-center gap-3">
          <h2 className="font-headline text-4xl font-extrabold tracking-tight text-slate-900">Thống kê cá nhân</h2>
          {data.is_mock ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Mock data
            </span>
          ) : (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Dữ liệu thực
            </span>
          )}
        </div>
        <p className="font-medium text-slate-500">
          Bạn đã thực hiện {data.summary.total_cases} ca chẩn đoán. Hoạt động gần nhất: {data.summary.last_activity_at ? formatDate(data.summary.last_activity_at) : "Chưa có"}.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.title} className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-primary/20">
            <div className="mb-4 flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${card.iconBg} transition-transform group-hover:scale-110`}>
                {card.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cá nhân</span>
            </div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">{card.title}</p>
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-3xl font-black text-slate-900">{card.value}</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">{card.sub}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm xl:col-span-2">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-headline text-xl font-extrabold text-slate-900">Xu hướng 7 ngày</h3>
              <p className="text-sm font-medium text-slate-500">Tổng ca và số ca viêm phổi theo từng ngày.</p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span className="h-2 w-2 rounded-full bg-primary"></span>
                Tổng ca
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span className="h-2 w-2 rounded-full bg-red-600"></span>
                Viêm phổi
              </div>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weekly_trend} margin={{ top: 6, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                />
                <Bar dataKey="total" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={30} opacity={0.2} />
                <Bar dataKey="pneumonia" fill="#b91a24" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h3 className="font-headline text-xl font-extrabold text-slate-900">Phân bố kết quả</h3>
            <p className="text-sm font-medium text-slate-500">Tỷ lệ viêm phổi và bình thường trên các ca đã hoàn tất.</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.diagnosis_distribution} dataKey="value" nameKey="name" innerRadius={56} outerRadius={84} paddingAngle={2}>
                  {data.diagnosis_distribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 18px -6px rgb(0 0 0 / 0.15)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 space-y-3">
            {data.diagnosis_distribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </div>
                <div className="text-sm font-bold text-slate-700">
                  {item.value} ca ({item.percent.toFixed(1)}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm xl:col-span-2">
          <div className="mb-6 flex items-center gap-2">
            <Stethoscope size={18} className="text-primary" />
            <h3 className="font-headline text-xl font-extrabold text-slate-900">Hoạt động chẩn đoán gần đây</h3>
          </div>

          {!hasRecentActivity ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-medium text-slate-500">
              Chưa có lịch sử chẩn đoán. Bạn có thể vào mục "Phân tích mới" để bắt đầu.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Thời gian</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Bệnh nhân</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Kết quả</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Độ tin cậy</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Trạng thái</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Xử lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.recent_activity.map((item) => (
                    <tr key={`${item.id}-${item.created_at}`} className="transition-colors hover:bg-slate-50/40">
                      <td className="px-4 py-3 text-sm font-medium text-slate-600">{formatDate(item.created_at)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">{item.patient_name || "Chưa cập nhật"}</td>
                      <td className="px-4 py-3">
                        {item.prediction ? (
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getPredictionBadgeStyle(item.prediction)}`}>
                            {getPredictionLabel(item.prediction)}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">Đang chờ kết quả</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-700">
                        {item.confidence !== null ? `${(item.confidence * 100).toFixed(1)}%` : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyle[item.status]}`}>
                          {statusLabel[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-slate-600">
                        {item.processing_time_ms ? `${(item.processing_time_ms / 1000).toFixed(1)}s` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <h3 className="font-headline text-xl font-extrabold text-slate-900">Tình trạng đánh giá</h3>
          </div>

          <div className="space-y-4">
            {data.review_status.map((item) => (
              <div key={item.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-600">{item.name}</span>
                  <span className="font-bold text-slate-900">{item.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${data.summary.total_cases > 0 ? (item.value / data.summary.total_cases) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="mb-1 font-semibold text-slate-800">Tổng kết nhanh</p>
            <p>Đã hoàn tất: {data.summary.completed_cases} / {data.summary.total_cases} ca.</p>
            <p>Cần xử lý: {data.summary.pending_cases} ca. Lỗi: {data.summary.failed_cases} ca.</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-gradient-to-r from-sky-50 to-emerald-50 px-6 py-5">
        <div className="flex items-center gap-3 text-slate-700">
          <AlertTriangle size={16} className="text-primary" />
          <p className="text-sm font-semibold">
            Lưu ý: Số liệu chỉ dùng để hỗ trợ theo dõi, không thay thế kết luận chuyên môn của bác sĩ.
          </p>
        </div>
      </section>
    </div>
  );
};

export default StatsPage;
