import React from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  BarChart3,
  Check,
  Layers,
  Printer,
  Search,
  X,
  ZoomIn,
} from "lucide-react";
import api from "../api/axios";
import ImageZoom from "./ui/ImageZoom";
import ProgressPipeline from "./predict/ProgressPipeline";
import UploadZone from "./predict/UploadZone";
import { useFileUpload } from "../hooks/useFileUpload";
import { useWebSocket } from "../hooks/useWebSocket";
import { formatPercent, getPredictionLabel } from "../utils/formatters";
import { toApiAssetUrl } from "../utils/url";

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

interface PredictionType {
  label: string | null;
  probs?: {
    BACTERIAL?: number | null;
    VIRAL?: number | null;
    COVID?: number | null;
  } | null;
}

interface PredictionData {
  id: number;
  task_id: string;
  prediction: "NORMAL" | "PNEUMONIA";
  confidence: number;
  original_url: string | null;
  heatmap_url: string | null;
  type?: PredictionType | null;
  doctor_note?: string | null;
  doctor_confirmed?: boolean | null;
  patient_name?: string | null;
  patient_age?: number | null;
  patient_gender?: string | null;
  technician_name?: string | null;
  performed_at?: string | null;
  created_at?: string | null;
}

const buildSubtypeBars = (type?: PredictionType | null) => {
  if (!type?.probs) return [];
  return [
    { label: "Vi khuẩn", value: type.probs.BACTERIAL ?? 0, color: "bg-red-500" },
    { label: "Virus", value: type.probs.VIRAL ?? 0, color: "bg-sky-500" },
    { label: "COVID-19", value: type.probs.COVID ?? 0, color: "bg-slate-400" },
  ];
};

export default function PredictiveAnalysis() {
  const { handleFileSelect, isUploading, setIsUploading } = useFileUpload();
  const [taskId, setTaskId] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<PredictionData | null>(null);
  const [currentStage, setCurrentStage] = React.useState<string>("queued");
  const [stageProgress, setStageProgress] = React.useState<Record<string, number>>({});
  const [statusMessage, setStatusMessage] = React.useState<string>("Tải ảnh để bắt đầu chẩn đoán");
  const [note, setNote] = React.useState("");
  const [patientDraft, setPatientDraft] = React.useState<PatientDraft>({
    patient_name: "",
    patient_age: "",
    patient_gender: "",
    technician_name: "",
    performed_at: "",
  });
  const [zoomImage, setZoomImage] = React.useState<{ src: string; alt: string } | null>(null);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [isSavingPatient, setIsSavingPatient] = React.useState<boolean>(false);

  const fetchPredictionById = React.useCallback(async (predictionId: string) => {
    const response = await api.get(`/api/history/${predictionId}`);
    setResult(response.data);
    setNote(response.data.doctor_note || "");
  }, []);

  const fetchPredictionByTask = React.useCallback(async (nextTaskId: string) => {
    const response = await api.get(`/api/predict/${nextTaskId}`);
    if (response.data?.data?.id) {
      setResult(response.data.data);
      setNote(response.data.data.doctor_note || "");
    }
  }, []);

  React.useEffect(() => {
    if (!result) return;
    setPatientDraft({
      patient_name: result.patient_name || "",
      patient_age: result.patient_age != null ? String(result.patient_age) : "",
      patient_gender: result.patient_gender || "",
      technician_name: result.technician_name || "",
      performed_at: toDateTimeLocal(result.performed_at || result.created_at || null),
    });
  }, [result]);

  useWebSocket(taskId, {
    onProgress: (stage, status, data) => {
      setCurrentStage(stage || "queued");
      if (typeof data?.progress === "number") {
        setStageProgress((prev) => ({ ...prev, [stage]: data.progress }));
      }
      if (data?.message) {
        setStatusMessage(data.message);
      } else if (stage === "final" && status === "done") {
        setStatusMessage("Chẩn đoán hoàn tất");
      }
      if (stage === "final" && status === "done" && data?.id) {
        setResult(data);
        setNote(data.doctor_note || "");
      }
      if (stage === "error" || status === "failed") { 
        setIsUploading(false);
        toast.error(data?.message || "Chẩn đoán thất bại");
      }
    },
    onComplete: async (predictionId) => {
      setIsUploading(false);
      try {
        await fetchPredictionById(predictionId);
      } catch {
        if (taskId) {
          await fetchPredictionByTask(taskId);
        }
      }
      toast.success("Chẩn đoán hoàn tất");
    },
    onError: (message) => {
      setStatusMessage(message);
    },
  });

  const handleSelectAndUpload = async (selectedFile: File) => {
    const validFile = await handleFileSelect(selectedFile);
    if (!validFile) return;

    const formData = new FormData();
    formData.append("file", validFile);

    setIsUploading(true);
    setResult(null);
    setNote("");
    setCurrentStage("queued");
    setStageProgress({ queued: 0 });
    setStatusMessage("Đang tải ảnh...");

    try {
      const response = await api.post("/api/predict/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTaskId(response.data.task_id);
    } catch (error: any) {
      setIsUploading(false);
      const message = error?.response?.data?.message || "Tải ảnh thất bại";
      setStatusMessage(message);
      toast.error(message);
    }
  };

  const handleSaveNote = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      await api.put(`/api/predict/${result.id}/note`, { note });
      setResult((prev) => (prev ? { ...prev, doctor_note: note } : prev));
      toast.success("Đã lưu ghi chú");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePatientInfo = async () => {
    if (!result) return;
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

      await api.put(`/api/predict/${result.id}/patient`, payload);
      setResult((prev) => (
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
      toast.success("Đã lưu thông tin lâm sàng");
    } finally {
      setIsSavingPatient(false);
    }
  };

  const handleConfirm = async (confirmed: boolean) => {
    if (!result) return;
    await api.put(`/api/predict/${result.id}/confirm`, { confirmed });
    setResult((prev) => (prev ? { ...prev, doctor_confirmed: confirmed } : prev));
    toast.success(confirmed ? "Đã xác nhận kết quả" : "Đã từ chối kết quả");
  };

  const handleExportPDF = async () => {
    if (!result) {
      toast.error("Chưa có kết quả để xuất PDF");
      return;
    }

    try {
      const response = await api.get(`/api/predict/${result.id}/export`, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `XR-${result.id}.pdf`;
      anchor.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Không thể xuất PDF lúc này");
    }
  };

  const subtypeBars = buildSubtypeBars(result?.type);
  const displayedOriginalImage = toApiAssetUrl(result?.original_url);
  const displayedHeatmapImage = toApiAssetUrl(result?.heatmap_url);
  const hasResult = Boolean(result);
  const hasHeatmap = Boolean(displayedHeatmapImage);
  const hasSubtype = subtypeBars.length > 0;

  const steps = [
    {
      id: "T1",
      label: "Chẩn đoán AI",
      icon: Layers,
      status: hasResult ? "done" : currentStage === "T1" ? "processing" : stageProgress.T1 ? "done" : "pending",
      progress: hasResult ? 100 : stageProgress.T1 ?? 0,
    },
    {
      id: "gradcam",
      label: "Tạo heatmap",
      icon: BarChart3,
      status: hasHeatmap ? "done" : hasResult ? "pending" : currentStage === "gradcam" ? "processing" : stageProgress.gradcam ? "done" : "pending",
      progress: hasHeatmap ? 100 : stageProgress.gradcam ?? 0,
    },
    {
      id: "final",
      label: "Sẵn sàng kết quả",
      icon: BarChart3,
      status: result ? "done" : currentStage === "final" ? "processing" : "pending",
      progress: result ? 100 : stageProgress.final ?? 0,
    },
  ] as const;
  const confidenceText = result ? formatPercent(result.confidence) : "--";
  const predictionLabel = result ? getPredictionLabel(result.prediction) : "Chờ kết quả chẩn đoán";
  const predictionHint = hasResult
    ? result?.prediction === "PNEUMONIA"
      ? "Cần xem xét ngay lập tức"
      : "Không phát hiện bất thường"
    : "Dữ liệu sẽ hiển thị sau khi phân tích";

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">Phân tích dự đoán</h1>
        <p className="text-on-surface-variant mt-1 max-w-2xl">
          Tải lên ảnh X-quang ngực để nhận kết quả chẩn đoán, tỷ lệ tin cậy, phân nhóm bệnh và hình ảnh heatmap.
        </p>
      </section>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <UploadZone onFileSelect={handleSelectAndUpload} isUploading={isUploading} />
          <ProgressPipeline steps={steps as any} />
          <div className="bg-white rounded-2xl border border-slate-100 p-5 text-sm text-slate-600 shadow-sm">
            <div className="font-bold text-slate-900 mb-2">Trạng thái pipeline</div>
            <div>{statusMessage}</div>
            {result?.type?.label && (
              <div className="mt-3 text-xs uppercase tracking-widest text-slate-500">
                Nhãn loại: <span className="font-bold text-slate-900">{result.type.label}</span>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-6">
          <>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-50 flex items-center justify-between gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Độ tin cậy chẩn đoán</p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline font-extrabold text-6xl text-on-surface tracking-tighter">
                      {confidenceText}
                    </span>
                  </div>
                </div>
                <div
                  className={`px-6 py-4 rounded-2xl flex items-center gap-3 shadow-xl ${
                    result?.prediction === "PNEUMONIA"
                      ? "bg-red-500 text-white shadow-red-100"
                      : hasResult
                        ? "bg-emerald-500 text-white shadow-emerald-100"
                        : "bg-slate-200 text-slate-600 shadow-slate-100"
                  }`}
                >
                  <AlertTriangle size={24} fill="currentColor" className={hasResult ? "text-white" : "text-slate-500"} />
                  <div className="flex flex-col">
                    <span className="font-headline font-bold text-sm uppercase tracking-wider leading-none">
                      {predictionLabel}
                    </span>
                    <span className="text-[10px] font-medium opacity-80 mt-1">
                      {predictionHint}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-headline font-bold text-on-surface">Bản đồ nhiệt định vị</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => displayedOriginalImage && setZoomImage({ src: displayedOriginalImage, alt: "Ảnh gốc" })}
                      className="p-2 bg-sky-50 text-primary rounded-lg hover:bg-sky-100 transition-colors"
                    >
                      <Search size={18} />
                    </button>
                    <button
                      onClick={() => displayedHeatmapImage && setZoomImage({ src: displayedHeatmapImage, alt: "Grad-CAM" })}
                      className="p-2 bg-sky-50 text-primary rounded-lg hover:bg-sky-100 transition-colors"
                    >
                      <Layers size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group rounded-2xl overflow-hidden border border-slate-100 aspect-square bg-slate-900 shadow-sm">
                    {displayedOriginalImage ? (
                      <img src={displayedOriginalImage} alt="Ảnh gốc" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm bg-slate-100">
                        Ảnh gốc sẽ hiển thị tại đây
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        disabled={!displayedOriginalImage}
                        onClick={() => setZoomImage({ src: displayedOriginalImage, alt: "Ảnh X-quang gốc" })}
                        className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all disabled:opacity-40"
                      >
                        <ZoomIn size={24} />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest">
                      Ảnh gốc
                    </div>
                  </div>

                  <div className="relative group rounded-2xl overflow-hidden border border-slate-100 aspect-square bg-slate-900 shadow-sm">
                    {displayedHeatmapImage ? (
                      <img src={displayedHeatmapImage} alt="Grad-CAM" className="w-full h-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm bg-slate-100 px-6 text-center">
                        Grad-CAM chưa khả dụng (thiếu model heatmap `densenet_t1_best.pth`)
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        disabled={!displayedHeatmapImage}
                        onClick={() => setZoomImage({ src: displayedHeatmapImage, alt: "Bản đồ nhiệt Grad-CAM" })}
                        className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all disabled:opacity-40"
                      >
                        <ZoomIn size={24} />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest">
                      Grad-CAM DenseNet
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-sky-50/30 p-8 rounded-2xl border border-sky-100 space-y-8">
                  <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-slate-500">Phân nhóm viêm phổi</h4>
                  {hasSubtype ? (
                    <div className="space-y-6">
                      {subtypeBars.map((type) => (
                      <div key={type.label} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700">{type.label}</span>
                          <span className="text-slate-500">{hasResult ? formatPercent(type.value) : "--"}</span>
                        </div>
                        <div className="bg-white h-2 rounded-full overflow-hidden">
                          <div className={`${type.color} h-full rounded-full`} style={{ width: `${type.value * 100}%` }} />
                        </div>
                      </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-white/80 border border-sky-100 p-4 text-sm text-slate-600">
                      {hasResult && result?.prediction === "PNEUMONIA"
                        ? "Chưa có mô hình phân nhóm viêm phổi (Vi khuẩn/Virus/COVID)."
                        : "Phân nhóm chỉ áp dụng khi kết quả là viêm phổi."}
                    </div>
                  )}
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-50 space-y-6 flex flex-col shadow-sm">
                  <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-slate-500">Quan sát lâm sàng</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bệnh nhân</label>
                      <input
                        type="text"
                        value={patientDraft.patient_name}
                        onChange={(event) => setPatientDraft((prev) => ({ ...prev, patient_name: event.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tuổi / Giới tính</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min={0}
                          value={patientDraft.patient_age}
                          onChange={(event) => setPatientDraft((prev) => ({ ...prev, patient_age: event.target.value }))}
                          placeholder="Tuổi"
                          className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary"
                        />
                        <input
                          type="text"
                          value={patientDraft.patient_gender}
                          onChange={(event) => setPatientDraft((prev) => ({ ...prev, patient_gender: event.target.value }))}
                          placeholder="Giới tính"
                          className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thời gian thực hiện</label>
                      <input
                        type="datetime-local"
                        value={patientDraft.performed_at}
                        onChange={(event) => setPatientDraft((prev) => ({ ...prev, performed_at: event.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kỹ thuật viên</label>
                      <input
                        type="text"
                        value={patientDraft.technician_name}
                        onChange={(event) => setPatientDraft((prev) => ({ ...prev, technician_name: event.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => void handleSavePatientInfo()}
                    disabled={isSavingPatient || !result}
                    className="w-full bg-slate-700 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-60"
                  >
                    {isSavingPatient ? "Đang lưu thông tin..." : "Lưu thông tin lâm sàng"}
                  </button>

                  <div className="space-y-1 flex-1 flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ghi chú chẩn đoán</label>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      className="flex-1 w-full bg-sky-50/50 rounded-xl p-4 text-sm text-slate-700 border-none focus:ring-2 focus:ring-primary outline-none resize-none"
                      placeholder="Nhập ghi chú chẩn đoán tại đây..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => void handleConfirm(true)}
                      disabled={!result}
                      className="flex-1 bg-secondary text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-emerald-100"
                    >
                      <Check size={18} />
                      Xác nhận
                    </button>
                    <button
                      onClick={() => void handleConfirm(false)}
                      disabled={!result}
                      className="flex-1 bg-sky-100 text-primary py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                      <X size={18} />
                      Từ chối
                    </button>
                  </div>

                  <button
                    onClick={() => void handleSaveNote()}
                    disabled={isSaving || !result}
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm disabled:opacity-60"
                  >
                    {isSaving ? "Đang lưu..." : "Lưu ghi chú"}
                  </button>
                </div>
              </div>
          </>
        </div>
      </div>

      <button
        onClick={() => void handleExportPDF()}
        disabled={!result}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 disabled:opacity-50 disabled:hover:scale-100"
      >
        <Printer size={24} />
      </button>

      <ImageZoom isOpen={!!zoomImage} onClose={() => setZoomImage(null)} src={zoomImage?.src || ""} alt={zoomImage?.alt || ""} />
    </div>
  );
}
