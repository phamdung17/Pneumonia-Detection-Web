import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatPercent, getPredictionLabel } from "../../utils/formatters";

interface PredictionResult {
  id: string;
  label: "NORMAL" | "PNEUMONIA";
  confidence: number;
  probability?: number | null;
  heatmap_url: string;
  original_url: string;
}

interface ResultCardProps {
  result: PredictionResult;
}

const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const isPneumonia = result.label === "PNEUMONIA";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-6 rounded-2xl border border-slate-50 bg-white p-8 shadow-sm">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Diagnosis Confidence</p>
          <div className="font-headline text-6xl font-extrabold tracking-tighter text-on-surface">{formatPercent(result.confidence)}</div>
          {result.probability != null && (
            <div className="text-sm font-bold text-slate-600">Pneumonia probability: {formatPercent(result.probability)}</div>
          )}
        </div>
        <div className={`flex items-center gap-3 rounded-2xl px-6 py-4 shadow-xl ${isPneumonia ? "bg-red-500 text-white shadow-red-100" : "bg-emerald-500 text-white shadow-emerald-100"}`}>
          {isPneumonia ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
          <div className="flex flex-col">
            <span className="font-headline text-sm font-bold uppercase tracking-wider leading-none">{getPredictionLabel(result.label)}</span>
            <span className="mt-1 text-[10px] font-medium opacity-80">Prediction #{result.id}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-headline font-bold text-on-surface">Diagnostic Images</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-100 bg-slate-900 shadow-sm">
            <img src={result.original_url} alt="Original" className="h-full w-full object-cover" />
            <div className="absolute bottom-4 left-4 rounded bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">Original</div>
          </div>

          <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-100 bg-slate-900 shadow-sm">
            <img src={result.heatmap_url} alt="Heatmap" className="h-full w-full object-cover" />
            <div className="absolute bottom-4 left-4 rounded bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">Grad-CAM</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
