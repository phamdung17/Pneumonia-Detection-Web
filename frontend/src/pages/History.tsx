import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import api from "../api/axios";
import { formatDate, getPredictionLabel } from "../utils/formatters";

interface HistoryItem {
  id: number;
  created_at: string;
  prediction: "NORMAL" | "PNEUMONIA" | null;
  confidence: number | null;
  probability?: number | null;
  doctor_confirmed: boolean | null;
}

const getReviewStatus = (item: HistoryItem) => {
  if (item.doctor_confirmed === true) return "ĐÃ XÁC NHẬN";
  if (item.doctor_confirmed === false) return "TỪ CHỐI";
  return "CHỜ ĐÁNH GIÁ";
};

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = React.useState<HistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  React.useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await api.get("/api/history/");
        setItems(response.data.items || []);
      } finally {
        setLoading(false);
      }
    };

    void loadHistory();
  }, []);

  const handleDelete = async (id: number) => {
    if (deletingId) return;
    if (!window.confirm("Bạn có chắc muốn xóa lịch sử chẩn đoán này?")) return;

    setDeletingId(id);
    try {
      await api.delete(`/api/history/${id}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 font-headline text-3xl font-extrabold tracking-tight text-slate-900">Lịch sử chẩn đoán</h1>
        <p className="font-medium text-slate-500">Theo dõi các ca đã hoàn thành với kết quả chẩn đoán, độ tin cậy và đánh giá.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">ID</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Thời gian</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Chẩn đoán</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Độ tin cậy</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Xác suất</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Đánh giá</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td className="px-6 py-8 text-slate-400" colSpan={7}>Đang tải lịch sử...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-slate-400" colSpan={7}>Chưa có ca chẩn đoán nào.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="group transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono text-sm font-bold text-primary">#{item.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDate(item.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 text-sm font-bold ${item.prediction === "PNEUMONIA" ? "text-red-500" : "text-emerald-500"}`}>
                        {item.prediction === "PNEUMONIA" ? <AlertCircle size={14} className="fill-current" /> : <CheckCircle2 size={14} className="fill-current" />}
                        {getPredictionLabel((item.prediction || "NORMAL") as "NORMAL" | "PNEUMONIA")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${item.prediction === "PNEUMONIA" ? "bg-red-500" : "bg-emerald-500"}`}
                            style={{ width: `${(item.confidence || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{((item.confidence || 0) * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-bold text-slate-700">
                      {item.probability != null ? `${(item.probability * 100).toFixed(1)}%` : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">{getReviewStatus(item)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button onClick={() => navigate(`/history/${item.id}`)} className="text-sm font-bold text-primary hover:underline">
                          Sửa
                        </button>
                        <button
                          onClick={() => void handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="text-sm font-bold text-red-500 hover:underline disabled:opacity-60"
                        >
                          {deletingId === item.id ? "Đang xóa..." : "Xóa"}
                        </button>
                      </div>
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

export default HistoryPage;
