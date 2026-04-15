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
import { useAuthStore } from "../stores/authStore";
import { formatPercent, getPredictionLabel } from "../utils/formatters";

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
    { label: "Vi khuan", value: type.probs.BACTERIAL ?? 0, color: "bg-red-500" },
    { label: "Virus", value: type.probs.VIRAL ?? 0, color: "bg-sky-500" },
    { label: "COVID-19", value: type.probs.COVID ?? 0, color: "bg-slate-400" },
  ];
};

export default function PredictiveAnalysis() {
  const user = useAuthStore((state) => state.user);
  const { handleFileSelect, isUploading, setIsUploading } = useFileUpload();
  const [taskId, setTaskId] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<PredictionData | null>(null);
  const [currentStage, setCurrentStage] = React.useState<string>("queued");
  const [stageProgress, setStageProgress] = React.useState<Record<string, number>>({});
  const [statusMessage, setStatusMessage] = React.useState<string>("Upload an image to start diagnosis");
  const [note, setNote] = React.useState("");
  const [zoomImage, setZoomImage] = React.useState<{ src: string; alt: string } | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

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

  useWebSocket(taskId, {
    onProgress: (stage, status, data) => {
      setCurrentStage(stage || "queued");
      if (typeof data?.progress === "number") {
        setStageProgress((prev) => ({ ...prev, [stage]: data.progress }));
      }
      if (data?.message) {
        setStatusMessage(data.message);
      } else if (stage === "final" && status === "done") {
        setStatusMessage("Diagnosis completed");
      }
      if (stage === "final" && status === "done" && data?.id) {
        setResult(data);
        setNote(data.doctor_note || "");
      }
      if (stage === "error" || status === "failed") {
        setIsUploading(false);
        toast.error(data?.message || "Prediction failed");
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
      toast.success("Diagnosis completed");
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
    setStatusMessage("Uploading image...");

    try {
      const response = await api.post("/api/predict/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTaskId(response.data.task_id);
    } catch {
      setIsUploading(false);
      toast.error("Upload failed");
    }
  };

  const handleSaveNote = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      await api.put(`/api/predict/${result.id}/note`, { note });
      setResult((prev) => (prev ? { ...prev, doctor_note: note } : prev));
      toast.success("Note saved");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async (confirmed: boolean) => {
    if (!result) return;
    await api.put(`/api/predict/${result.id}/confirm`, { confirmed });
    setResult((prev) => (prev ? { ...prev, doctor_confirmed: confirmed } : prev));
    toast.success(confirmed ? "Prediction confirmed" : "Prediction rejected");
  };

  const steps = [
    {
      id: "T1",
      label: "AI diagnosis",
      icon: Layers,
      status: currentStage === "T1" ? "processing" : stageProgress.T1 ? "done" : "pending",
      progress: stageProgress.T1 ?? 0,
    },
    {
      id: "gradcam",
      label: "Heatmap generation",
      icon: BarChart3,
      status: currentStage === "gradcam" ? "processing" : stageProgress.gradcam ? "done" : "pending",
      progress: stageProgress.gradcam ?? 0,
    },
    {
      id: "final",
      label: "Result ready",
      icon: BarChart3,
      status: result ? "done" : currentStage === "final" ? "processing" : "pending",
      progress: result ? 100 : stageProgress.final ?? 0,
    },
  ] as const;

  const subtypeBars = buildSubtypeBars(result?.type);
  const canReview = user?.role === "doctor";
  const displayedOriginalImage = result?.original_url || "";
  const displayedHeatmapImage = result?.heatmap_url || result?.original_url || "";
  const performedAt = result?.performed_at || result?.created_at || "";
  const hasResult = Boolean(result);
  const confidenceText = hasResult ? formatPercent(result.confidence) : "--";
  const predictionLabel = hasResult ? getPredictionLabel(result.prediction) : "Cho ket qua chan doan";
  const predictionHint = hasResult
    ? result?.prediction === "PNEUMONIA"
      ? "Can xem xet ngay lap tuc"
      : "Khong phat hien bat thuong"
    : "Du lieu se hien thi sau khi phan tich";

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">Phan tich du doan</h1>
        <p className="text-on-surface-variant mt-1 max-w-2xl">
          Tai len anh X-quang nguc de nhan ket qua chan doan, ty le tin cay, phan nhom benh va hinh anh heatmap.
        </p>
      </section>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <UploadZone onFileSelect={handleSelectAndUpload} isUploading={isUploading} />
          <ProgressPipeline steps={steps as any} />
          <div className="bg-white rounded-2xl border border-slate-100 p-5 text-sm text-slate-600 shadow-sm">
            <div className="font-bold text-slate-900 mb-2">Pipeline status</div>
            <div>{statusMessage}</div>
            {result?.type?.label && (
              <div className="mt-3 text-xs uppercase tracking-widest text-slate-500">
                Type label: <span className="font-bold text-slate-900">{result.type.label}</span>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-6">
          <>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-50 flex items-center justify-between gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Do tin cay chan doan</p>
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
                  <h4 className="font-headline font-bold text-on-surface">Ban do nhiet dinh vi</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => displayedOriginalImage && setZoomImage({ src: displayedOriginalImage, alt: "Anh goc" })}
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
                      <img src={displayedOriginalImage} alt="Anh goc" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm bg-slate-100">
                        Anh goc se hien thi tai day
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        disabled={!displayedOriginalImage}
                        onClick={() => setZoomImage({ src: displayedOriginalImage, alt: "Anh X-quang goc" })}
                        className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all disabled:opacity-40"
                      >
                        <ZoomIn size={24} />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest">
                      Anh goc
                    </div>
                  </div>

                  <div className="relative group rounded-2xl overflow-hidden border border-slate-100 aspect-square bg-slate-900 shadow-sm">
                    {displayedHeatmapImage ? (
                      <img src={displayedHeatmapImage} alt="Grad-CAM" className="w-full h-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm bg-slate-100">
                        Heatmap se hien thi tai day
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        disabled={!displayedHeatmapImage}
                        onClick={() => setZoomImage({ src: displayedHeatmapImage, alt: "Ban do nhiet Grad-CAM" })}
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
                  <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-slate-500">Phan nhom viem phoi</h4>
                  <div className="space-y-6">
                    {(subtypeBars.length ? subtypeBars : [
                      { label: "Vi khuan", value: 0, color: "bg-red-500" },
                      { label: "Virus", value: 0, color: "bg-sky-500" },
                      { label: "COVID-19", value: 0, color: "bg-slate-400" },
                    ]).map((type) => (
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
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-50 space-y-6 flex flex-col shadow-sm">
                  <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-slate-500">Quan sat lam sang</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Benh nhan</label>
                      <input
                        type="text"
                        value={result?.patient_name || ""}
                        readOnly
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tuoi / Gioi tinh</label>
                      <input
                        type="text"
                        value={`${result?.patient_age ?? "-"} / ${result?.patient_gender || "-"}`}
                        readOnly
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thoi gian thuc hien</label>
                      <input
                        type="text"
                        value={performedAt || ""}
                        readOnly
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ky thuat vien</label>
                      <input
                        type="text"
                        value={result?.technician_name || ""}
                        readOnly
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none"
                      />
                    </div>
                  </div>

                  {canReview ? (
                    <>
                      <div className="space-y-1 flex-1 flex flex-col">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ghi chu chan doan</label>
                        <textarea
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          className="flex-1 w-full bg-sky-50/50 rounded-xl p-4 text-sm text-slate-700 border-none focus:ring-2 focus:ring-primary outline-none resize-none"
                          placeholder="Nhap ghi chu chan doan tai day..."
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => void handleConfirm(true)}
                          disabled={!result}
                          className="flex-1 bg-secondary text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-emerald-100"
                        >
                          <Check size={18} />
                          Xac nhan
                        </button>
                        <button
                          onClick={() => void handleConfirm(false)}
                          disabled={!result}
                          className="flex-1 bg-sky-100 text-primary py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                          <X size={18} />
                          Tu choi
                        </button>
                      </div>

                      <button
                        onClick={() => void handleSaveNote()}
                        disabled={isSaving || !result}
                        className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm disabled:opacity-60"
                      >
                        {isSaving ? "Dang luu..." : "Luu ghi chu"}
                      </button>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                      Chi bac si moi co quyen ghi chu va xac nhan ket qua chan doan.
                    </div>
                  )}
                </div>
              </div>
          </>
        </div>
      </div>

      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
        <Printer size={24} />
      </button>

      <ImageZoom isOpen={!!zoomImage} onClose={() => setZoomImage(null)} src={zoomImage?.src || ""} alt={zoomImage?.alt || ""} />
    </div>
  );
}
