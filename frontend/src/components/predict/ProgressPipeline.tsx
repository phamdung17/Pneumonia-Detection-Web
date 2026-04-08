import React from "react";
import { motion } from "motion/react";
import { Check, Layers, BarChart3, Loader2 } from "lucide-react";

interface Step {
  id: string;
  label: string;
  icon: any;
  status: "pending" | "processing" | "done" | "error";
  progress?: number;
}

interface ProgressPipelineProps {
  steps: Step[];
}

const ProgressPipeline: React.FC<ProgressPipelineProps> = ({ steps }) => {
  const totalProgress = steps.reduce((acc, step) => {
    if (step.status === "done") return acc + (100 / steps.length);
    if (step.status === "processing") return acc + ((step.progress || 0) / steps.length);
    return acc;
  }, 0);

  return (
    <div className="bg-sky-50/30 p-8 rounded-2xl border border-sky-100 space-y-8">
      <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-slate-500">Tiến độ Phân tích</h4>
      <div className="space-y-6">
        {steps.map((step) => (
          <div key={step.id} className={`flex items-center justify-between transition-opacity duration-300 ${step.status === "pending" ? "opacity-30" : "opacity-100"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                step.status === "done" ? "bg-emerald-500" : 
                step.status === "processing" ? "bg-primary animate-pulse" : "bg-slate-200"
              }`}>
                {step.status === "done" ? <Check className="text-white" size={16} /> : 
                 step.status === "processing" ? <Loader2 className="text-white animate-spin" size={16} /> :
                 <step.icon className="text-slate-400" size={16} />}
              </div>
              <span className={`text-sm font-bold ${step.status === "processing" ? "text-primary" : "text-slate-700"}`}>
                {step.label}
              </span>
            </div>
            <span className={`text-xs font-bold uppercase ${
              step.status === "done" ? "text-emerald-500" : 
              step.status === "processing" ? "text-primary" : "text-slate-400"
            }`}>
              {step.status === "done" ? "Xong" : 
               step.status === "processing" ? `${Math.round(step.progress || 0)}%` : "Chờ"}
            </span>
          </div>
        ))}
      </div>
      <div className="bg-slate-200/50 h-2 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${totalProgress}%` }}
          className="bg-primary h-full rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]"
        ></motion.div>
      </div>
    </div>
  );
};

export default ProgressPipeline;
