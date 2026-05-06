import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Download, Save, X, ZoomIn } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import ImageZoom from "../components/ui/ImageZoom";
import { formatDate, getPredictionBadgeStyle, getPredictionLabel } from "../utils/formatters";
import { toApiAssetUrl } from "../utils/url";

interface PredictionDetail {
  id: number;
  created_at: string;
  performed_at: string | null;
  prediction: "NORMAL" | "PNEUMONIA" | null;
  confidence: number | null;
  doctor_note: string | null;
  doctor_confirmed: boolean | null;
  patient_name: string | null;
  patient_age: number | null;
  patient_gender: string | null;
  technician_name: string | null;
  original_url: string | null;
  heatmap_url: string | null;
  type?: {
    label: string | null;
    probs?: {
      BACTERIAL?: number | null;
      VIRAL?: number | null;
      COVID?: number | null;
    } | null;
  } | null;
}

interface PatientDraft {
  patient_name: string;
  patient_age: string;
  patient_gender: string;
  technician_name: string;
  performed_at: string;
}

const toDateTimeLocal = (iso?: string | null): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIsoStringOrNull = (value: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const HistoryDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = React.useState<PredictionDetail | null>(null);
  const [note, setNote] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSavingPatient, setIsSavingPatient] = React.useState(false);
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [patientDraft, setPatientDraft] = React.useState<PatientDraft>({
    patient_name: "",
    patient_age: "",
    patient_gender: "",
    technician_name: "",
    performed_at: "",
  });
  const [zoomImage, setZoomImage] = React.useState<{ src: string; alt: string } | null>(null);

  const loadDetail = React.useCallback(async () => {
    if (!id) return;
    const response = await api.get(`/api/history/${id}`);
    setDetail(response.data);
    setNote(response.data.doctor_note || "");
  }, [id]);

  React.useEffect(() => {
    const run = async () => {
      try {
        await loadDetail();
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [loadDetail]);

  React.useEffect(() => {
    if (!detail) return;
    setPatientDraft({
      patient_name: detail.patient_name || "",
      patient_age: detail.patient_age != null ? String(detail.patient_age) : "",
      patient_gender: detail.patient_gender || "",
      technician_name: detail.technician_name || "",
      performed_at: toDateTimeLocal(detail.performed_at || detail.created_at || null),
    });
  }, [detail]);

  const handleSaveNote = async () => {
    if (!detail) return;
    setIsSaving(true);
    try {
      await api.put(`/api/predict/${detail.id}/note`, { note });
      toast.success("Đã lưu ghi chú");
      await loadDetail();
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async (confirmed: boolean) => {
    if (!detail) return;
    setIsConfirming(true);
    try {
      await api.put(`/api/predict/${detail.id}/confirm`, { confirmed });
      toast.success(confirmed ? "Da xac nhan ket qua" : "Da tu choi ket qua");
      await loadDetail();
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSavePatientInfo = async () => {
    if (!detail) return;
    setIsSavingPatient(true);
    try {
      const ageText = patientDraft.patient_age.trim();
      const parsedAge = ageText ? Number(ageText) : null;
      const payload = {
        patient_name: patientDraft.patient_name.trim() || null,
        patient_age: Number.isFinite(parsedAge) ? parsedAge : null,
        patient_gender: patientDraft.patient_gender.trim() || null,
        technician_name: patientDraft.technician_name.trim() || null,
        performed_at: toIsoStringOrNull(patientDraft.performed_at),
      };

      await api.put(`/api/predict/${detail.id}/patient`, payload);
      setDetail((prev) => (
        prev
          ? {
              ...prev,
              patient_name: payload.patient_name,
              patient_age: payload.patient_age,
              patient_gender: payload.patient_gender,
              technician_name: payload.technician_name,
              performed_at: payload.performed_at,
            }
          : prev
      ));
      toast.success("Đã lưu thông tin bệnh nhân");
    } finally {
      setIsSavingPatient(false);
    }
  };

  const handleExportPDF = async () => {
    if (!detail) return;
    setIsExporting(true);
    try {
      const response = await api.get(`/api/predict/${detail.id}/pdf`, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `XR-${detail.id}.pdf`;
      anchor.click();
      URL.revokeObjectURL(blobUrl);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return <div className="text-slate-400">Đang tải kết quả chẩn đoán...</div>;
  }

  if (!detail) {
    return <div className="text-slate-400">Không tìm thấy kết quả.</div>;
  }

  const performedAt = detail.performed_at || detail.created_at;
  const confidence = detail.confidence || 0;
  const typeProbs = detail.type?.probs;
  const originalImageUrl = toApiAssetUrl(detail.original_url);
  const heatmapImageUrl = toApiAssetUrl(detail.heatmap_url || detail.original_url || null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary">
          <ArrowLeft size={18} />
          Quay lại
        </button>

        <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-50">
          <Download size={16} />
          Xuất PDF
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-6 font-headline text-xl font-extrabold text-slate-900">Ảnh chẩn đoán</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
                  <img src={originalImageUrl} alt="Ảnh X-quang gốc" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setZoomImage(originalImageUrl ? { src: originalImageUrl, alt: "Ảnh X-quang gốc" } : null)}
                    className="absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white"
                  >
                    <ZoomIn size={18} />
                  </button>
                </div>
                <p className="text-center text-xs font-medium text-slate-400">Ảnh gốc</p>
              </div>

              <div className="space-y-3">
                <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
                  <img src={heatmapImageUrl} alt="Bản đồ nhiệt" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setZoomImage(heatmapImageUrl ? { src: heatmapImageUrl, alt: "Bản đồ nhiệt" } : null)}
                    className="absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white"
                  >
                    <ZoomIn size={18} />
                  </button>
                </div>
                <p className="text-center text-xs font-medium text-slate-400">Heatmap Grad-CAM</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-headline text-xl font-extrabold text-slate-900">Ghi chú bác sĩ</h2>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Nhập ghi chú lâm sàng..."
              className="h-32 w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700 outline-none"
            />
            <div className="mt-4 flex justify-end">
              <button onClick={handleSaveNote} disabled={isSaving} className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                <Save size={16} />
                {isSaving ? "Đang lưu..." : "Lưu ghi chú"}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className={`absolute left-0 top-0 h-1.5 w-full ${detail.prediction === "PNEUMONIA" ? "bg-red-500" : "bg-emerald-500"}`} />
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Kết quả AI</h2>

            <div className="mb-6 flex items-center gap-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${detail.prediction === "PNEUMONIA" ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"}`}>
                {detail.prediction === "PNEUMONIA" ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
              </div>
              <div>
                <div className={`mb-1 inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${getPredictionBadgeStyle((detail.prediction || "NORMAL") as "NORMAL" | "PNEUMONIA")}`}>
                  {getPredictionLabel((detail.prediction || "NORMAL") as "NORMAL" | "PNEUMONIA")}
                </div>
                <h3 className="text-2xl font-black text-slate-900">{(confidence * 100).toFixed(1)}%</h3>
                <p className="text-[10px] font-bold uppercase text-slate-400">Độ tin cậy mô hình</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Loại bệnh</span><span className="font-bold text-slate-900">{detail.type?.label || "KHÔNG"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Trạng thái đánh giá</span><span className="font-bold text-slate-900">{detail.doctor_confirmed === true ? "ĐÃ XÁC NHẬN" : detail.doctor_confirmed === false ? "TỪ CHỐI" : "CHỜ ĐÁNH GIÁ"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Thời gian thực hiện</span><span className="font-bold text-slate-900">{formatDate(performedAt)}</span></div>
            </div>

            <div className="mt-6 flex gap-2 border-t border-slate-50 pt-6">
              <button onClick={() => handleConfirm(true)} disabled={isConfirming} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 disabled:opacity-50">
                <Check size={14} />
                Xác nhận
              </button>
              <button onClick={() => handleConfirm(false)} disabled={isConfirming} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-50 py-2.5 text-xs font-bold text-red-700 disabled:opacity-50">
                <X size={14} />
                Từ chối
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-headline text-xl font-extrabold text-slate-900">Thông tin bệnh nhân / ca chụp</h2>
            <div className="space-y-3 text-sm">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Bệnh nhân</span>
                <input
                  value={patientDraft.patient_name}
                  onChange={(event) => setPatientDraft((prev) => ({ ...prev, patient_name: event.target.value }))}
                  placeholder="Nhập tên bệnh nhân"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tuổi</span>
                  <input
                    type="number"
                    min={0}
                    value={patientDraft.patient_age}
                    onChange={(event) => setPatientDraft((prev) => ({ ...prev, patient_age: event.target.value }))}
                    placeholder="Ví dụ: 40"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Giới tính</span>
                  <input
                    value={patientDraft.patient_gender}
                    onChange={(event) => setPatientDraft((prev) => ({ ...prev, patient_gender: event.target.value }))}
                    placeholder="Nam / Nữ"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Kỹ thuật viên</span>
                <input
                  value={patientDraft.technician_name}
                  onChange={(event) => setPatientDraft((prev) => ({ ...prev, technician_name: event.target.value }))}
                  placeholder="Nhập tên kỹ thuật viên"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Thời gian thực hiện</span>
                <input
                  type="datetime-local"
                  value={patientDraft.performed_at}
                  onChange={(event) => setPatientDraft((prev) => ({ ...prev, performed_at: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none"
                />
              </label>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Mã dự đoán</span>
                <span className="font-bold text-slate-900">#{detail.id}</span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSavePatientInfo}
                  disabled={isSavingPatient}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {isSavingPatient ? "Đang lưu..." : "Lưu thông tin"}
                </button>
              </div>
            </div>

            {typeProbs && (
              <div className="mt-6 space-y-3">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Xác suất theo loại bệnh</div>
                {Object.entries(typeProbs).map(([label, value]) => (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-xs font-bold">
                      <span>{label}</span>
                      <span>{((value || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(value || 0) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ImageZoom isOpen={!!zoomImage} onClose={() => setZoomImage(null)} src={zoomImage?.src || ""} alt={zoomImage?.alt || ""} />
    </div>
  );
};

export default HistoryDetailPage;
