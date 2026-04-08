import React from "react";
import { motion } from "motion/react";
import { FileText, CheckCircle2, Loader2, AlertCircle, X } from "lucide-react";
import { formatPercent, getPredictionBadgeStyle, getPredictionLabel } from "../../utils/formatters";

interface BatchItemProps {
  file: File;
  status: "pending" | "uploading" | "processing" | "done" | "error";
  progress?: number;
  result?: any;
  onRemove: () => void;
}

const BatchItem: React.FC<BatchItemProps> = ({ file, status, progress = 0, result, onRemove }) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4 shadow-sm group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
        status === "done" ? "bg-emerald-50" : status === "error" ? "bg-red-50" : "bg-slate-50"
      }`}>
        {status === "done" ? (
          <FileText className="text-emerald-500" size={24} />
        ) : status === "error" ? (
          <AlertCircle className="text-red-500" size={24} />
        ) : status === "uploading" || status === "processing" ? (
          <Loader2 className="text-primary animate-spin" size={24} />
        ) : (
          <FileText className="text-slate-300" size={24} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-bold text-slate-900 truncate">{file.name}</h4>
          <span className="text-[10px] text-slate-400 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
        
        {status === "uploading" || status === "processing" ? (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-primary uppercase">
              <span>{status === "uploading" ? "Đang tải lên" : "Đang phân tích"}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="bg-primary h-full"
              />
            </div>
          </div>
        ) : status === "done" && result ? (
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPredictionBadgeStyle(result.label)}`}>
              {getPredictionLabel(result.label)}
            </span>
            <span className="text-[10px] font-bold text-slate-500">{formatPercent(result.confidence)}</span>
          </div>
        ) : status === "error" ? (
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Lỗi xử lý</span>
        ) : (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đang chờ...</span>
        )}
      </div>

      <button 
        onClick={onRemove}
        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default BatchItem;
