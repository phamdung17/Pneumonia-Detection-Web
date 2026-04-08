import React from "react";
import { motion } from "motion/react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatPercent, getPredictionLabel } from "../../utils/formatters";

interface PredictionResult {
  id: string;
  label: "NORMAL" | "PNEUMONIA";
  confidence: number;
  heatmap_url: string;
  original_url: string;
  subtypes?: { label: string; value: number; color: string }[];
}

interface ResultCardProps {
  result: PredictionResult;
}

const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const isPneumonia = result.label === "PNEUMONIA";
  const dominantSubtype = result.subtypes?.slice().sort((a, b) => b.value - a.value)[0];

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-50 flex items-center justify-between gap-6">
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Diagnosis Confidence</p>
          <div className="text-6xl font-headline font-extrabold text-on-surface tracking-tighter">{formatPercent(result.confidence)}</div>
          {dominantSubtype && <div className="text-sm font-bold text-slate-600">Top disease type: {dominantSubtype.label}</div>}
        </div>
        <div className={`px-6 py-4 rounded-2xl flex items-center gap-3 shadow-xl ${isPneumonia ? "bg-red-500 text-white shadow-red-100" : "bg-emerald-500 text-white shadow-emerald-100"}`}>
          {isPneumonia ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
          <div className="flex flex-col">
            <span className="font-headline font-bold text-sm uppercase tracking-wider leading-none">{getPredictionLabel(result.label)}</span>
            <span className="text-[10px] font-medium opacity-80 mt-1">Prediction #{result.id}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-headline font-bold text-on-surface">Diagnostic Images</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative rounded-2xl overflow-hidden border border-slate-100 aspect-square bg-slate-900 shadow-sm">
            <img src={result.original_url} alt="Original" className="w-full h-full object-cover" />
            <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest">Original</div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-slate-100 aspect-square bg-slate-900 shadow-sm">
            <img src={result.heatmap_url} alt="Heatmap" className="w-full h-full object-cover" />
            <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest">Grad-CAM</div>
          </div>
        </div>
      </div>

      {result.subtypes && (
        <div className="bg-sky-50/30 p-8 rounded-2xl border border-sky-100 space-y-8">
          <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-slate-500">Disease Type Breakdown</h4>
          <div className="space-y-6">
            {result.subtypes.map((type) => (
              <div key={type.label} className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">{type.label}</span>
                  <span className="text-slate-500">{formatPercent(type.value)}</span>
                </div>
                <div className="bg-white h-2 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${type.value * 100}%` }} className={`${type.color} h-full rounded-full`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultCard;
