import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, CheckCircle2, AlertCircle, Download, Save, X, ZoomIn } from "lucide-react";
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
    await api.put(`/api/predict/${detail.id}/confirm`, { confirmed });
    toast.success(confirmed ? "Đã xác nhận kết quả" : "Đã từ chối kết quả");
    await loadDetail();
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
    const response = await api.get(`/api/predict/${detail.id}/export`, { responseType: "blob" });
    const blobUrl = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = `XR-${detail.id}.pdf`;
    anchor.click();
    URL.revokeObjectURL(blobUrl);
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
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold text-sm">
          <ArrowLeft size={18} />
          Quay lại
        </button>

        <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm">
          <Download size={16} />
          Xuất PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="font-headline font-extrabold text-xl text-slate-900 mb-6">Ảnh chẩn đoán</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="relative group aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                  <img src={originalImageUrl} alt="Ảnh X-quang gốc" className="w-full h-full object-cover" />
                  <button onClick={() => setZoomImage(originalImageUrl ? { src: originalImageUrl, alt: "Ảnh X-quang gốc" } : null)} className="absolute top-3 right-3 p-2 bg-black/40 rounded-full text-white">
                    <ZoomIn size={18} />
                  </button>
                </div>
                <p className="text-center text-xs text-slate-400 font-medium">Ảnh gốc</p>
              </div>

              <div className="space-y-3">
                <div className="relative group aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                  <img src={heatmapImageUrl} alt="Bản đồ nhiệt" className="w-full h-full object-cover" />
                  <button onClick={() => setZoomImage(heatmapImageUrl ? { src: heatmapImageUrl, alt: "Bản đồ nhiệt" } : null)} className="absolute top-3 right-3 p-2 bg-black/40 rounded-full text-white">
                    <ZoomIn size={18} />
                  </button>
                </div>
                <p className="text-center text-xs text-slate-400 font-medium">Heatmap Grad-CAM</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="font-headline font-extrabold text-xl text-slate-900 mb-4">Ghi chú bác sĩ</h2>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Nhập ghi chú lâm sàng..."
              className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 outline-none resize-none"
            />
            <div className="mt-4 flex justify-end">
              <button onClick={handleSaveNote} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-50">
                <Save size={16} />
                {isSaving ? "Đang lưu..." : "Lưu ghi chú"}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${detail.prediction === "PNEUMONIA" ? "bg-red-500" : "bg-emerald-500"}`} />
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Kết quả AI</h2>

            <div className="flex items-center gap-4 mb-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${detail.prediction === "PNEUMONIA" ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"}`}>
                {detail.prediction === "PNEUMONIA" ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
              </div>
              <div>
                <div className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest mb-1 ${getPredictionBadgeStyle((detail.prediction || "NORMAL") as "NORMAL" | "PNEUMONIA")}`}>
                  {getPredictionLabel((detail.prediction || "NORMAL") as "NORMAL" | "PNEUMONIA")}
                </div>
                <h3 className="text-2xl font-black text-slate-900">{(confidence * 100).toFixed(1)}%</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Độ tin cậy mô hình</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Loại bệnh</span><span className="font-bold text-slate-900">{detail.type?.label || "KHÔNG"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Trạng thái đánh giá</span><span className="font-bold text-slate-900">{detail.doctor_confirmed === true ? "ĐÃ XÁC NHẬN" : detail.doctor_confirmed === false ? "TỪ CHỐI" : "CHỜ ĐÁNH GIÁ"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Thời gian thực hiện</span><span className="font-bold text-slate-900">{formatDate(performedAt)}</span></div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50 flex gap-2">
              <button onClick={() => handleConfirm(true)} className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                <Check size={14} />
                Xác nhận
              </button>
              <button onClick={() => handleConfirm(false)} className="flex-1 py-2.5 bg-red-50 text-red-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                <X size={14} />
                Từ chối
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="font-headline font-extrabold text-xl text-slate-900 mb-4">Thông tin bệnh nhân / ca chụp</h2>
            <div className="space-y-3 text-sm">
              <label className="block">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Bệnh nhân</span>
                <input
                  value={patientDraft.patient_name}
                  onChange={(event) => setPatientDraft((prev) => ({ ...prev, patient_name: event.target.value }))}
                  placeholder="Nhập tên bệnh nhân"
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tuổi</span>
                  <input
                    type="number"
                    min={0}
                    value={patientDraft.patient_age}
                    onChange={(event) => setPatientDraft((prev) => ({ ...prev, patient_age: event.target.value }))}
                    placeholder="Ví dụ: 40"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Giới tính</span>
                  <input
                    value={patientDraft.patient_gender}
                    onChange={(event) => setPatientDraft((prev) => ({ ...prev, patient_gender: event.target.value }))}
                    placeholder="Nam / Nữ"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Kỹ thuật viên</span>
                <input
                  value={patientDraft.technician_name}
                  onChange={(event) => setPatientDraft((prev) => ({ ...prev, technician_name: event.target.value }))}
                  placeholder="Nhập tên kỹ thuật viên"
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none"
                />
              </label>

              <label className="block">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Thời gian thực hiện</span>
                <input
                  type="datetime-local"
                  value={patientDraft.performed_at}
                  onChange={(event) => setPatientDraft((prev) => ({ ...prev, performed_at: event.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none"
                />
              </label>

              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">Mã dự đoán</span>
                <span className="font-bold text-slate-900">#{detail.id}</span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSavePatientInfo}
                  disabled={isSavingPatient}
                  className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs disabled:opacity-50"
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
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>{label}</span>
                      <span>{((value || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
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
