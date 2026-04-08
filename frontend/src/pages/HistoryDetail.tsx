import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, CheckCircle2, AlertCircle, Download, Save, X, ZoomIn } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import ImageZoom from "../components/ui/ImageZoom";
import { formatDate, getPredictionBadgeStyle, getPredictionLabel } from "../utils/formatters";

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

const HistoryDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = React.useState<PredictionDetail | null>(null);
  const [note, setNote] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
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

  const handleSaveNote = async () => {
    if (!detail) return;
    setIsSaving(true);
    try {
      await api.put(`/api/predict/${detail.id}/note`, { note });
      toast.success("Note saved");
      await loadDetail();
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async (confirmed: boolean) => {
    if (!detail) return;
    await api.put(`/api/predict/${detail.id}/confirm`, { confirmed });
    toast.success(confirmed ? "Prediction confirmed" : "Prediction rejected");
    await loadDetail();
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
    return <div className="text-slate-400">Loading prediction...</div>;
  }

  if (!detail) {
    return <div className="text-slate-400">Prediction not found.</div>;
  }

  const performedAt = detail.performed_at || detail.created_at;
  const confidence = detail.confidence || 0;
  const typeProbs = detail.type?.probs;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold text-sm">
          <ArrowLeft size={18} />
          Back
        </button>

        <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm">
          <Download size={16} />
          Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="font-headline font-extrabold text-xl text-slate-900 mb-6">Diagnostic Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="relative group aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                  <img src={detail.original_url || ""} alt="Original X-ray" className="w-full h-full object-cover" />
                  <button onClick={() => setZoomImage(detail.original_url ? { src: detail.original_url, alt: "Original X-ray" } : null)} className="absolute top-3 right-3 p-2 bg-black/40 rounded-full text-white">
                    <ZoomIn size={18} />
                  </button>
                </div>
                <p className="text-center text-xs text-slate-400 font-medium">Original image</p>
              </div>

              <div className="space-y-3">
                <div className="relative group aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                  <img src={detail.heatmap_url || detail.original_url || ""} alt="Heatmap" className="w-full h-full object-cover" />
                  <button onClick={() => setZoomImage((detail.heatmap_url || detail.original_url) ? { src: detail.heatmap_url || detail.original_url || "", alt: "Heatmap" } : null)} className="absolute top-3 right-3 p-2 bg-black/40 rounded-full text-white">
                    <ZoomIn size={18} />
                  </button>
                </div>
                <p className="text-center text-xs text-slate-400 font-medium">Grad-CAM heatmap</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="font-headline font-extrabold text-xl text-slate-900 mb-4">Doctor Note</h2>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Enter clinical note..."
              className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 outline-none resize-none"
            />
            <div className="mt-4 flex justify-end">
              <button onClick={handleSaveNote} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-50">
                <Save size={16} />
                {isSaving ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${detail.prediction === "PNEUMONIA" ? "bg-red-500" : "bg-emerald-500"}`} />
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">AI Result</h2>

            <div className="flex items-center gap-4 mb-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${detail.prediction === "PNEUMONIA" ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"}`}>
                {detail.prediction === "PNEUMONIA" ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
              </div>
              <div>
                <div className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest mb-1 ${getPredictionBadgeStyle((detail.prediction || "NORMAL") as "NORMAL" | "PNEUMONIA")}`}>
                  {getPredictionLabel((detail.prediction || "NORMAL") as "NORMAL" | "PNEUMONIA")}
                </div>
                <h3 className="text-2xl font-black text-slate-900">{(confidence * 100).toFixed(1)}%</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Model confidence</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Disease type</span><span className="font-bold text-slate-900">{detail.type?.label || "NONE"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Review state</span><span className="font-bold text-slate-900">{detail.doctor_confirmed === true ? "CONFIRMED" : detail.doctor_confirmed === false ? "REJECTED" : "PENDING"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Performed at</span><span className="font-bold text-slate-900">{formatDate(performedAt)}</span></div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50 flex gap-2">
              <button onClick={() => handleConfirm(true)} className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                <Check size={14} />
                Confirm
              </button>
              <button onClick={() => handleConfirm(false)} className="flex-1 py-2.5 bg-red-50 text-red-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                <X size={14} />
                Reject
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="font-headline font-extrabold text-xl text-slate-900 mb-4">Patient / Study Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Patient</span><span className="font-bold text-slate-900">{detail.patient_name || "Unknown"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Age / Gender</span><span className="font-bold text-slate-900">{detail.patient_age ?? "-"} / {detail.patient_gender || "-"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Technician</span><span className="font-bold text-slate-900">{detail.technician_name || "-"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Prediction ID</span><span className="font-bold text-slate-900">#{detail.id}</span></div>
            </div>

            {typeProbs && (
              <div className="mt-6 space-y-3">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Disease type probabilities</div>
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
