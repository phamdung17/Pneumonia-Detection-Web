import React from "react";
import { motion } from "motion/react";

interface LoadingProps {
  message?: string;
  fullPage?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ message = "Đang tải...", fullPage = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative w-12 h-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-full h-full border-4 border-slate-200 border-t-primary rounded-full"
        />
      </div>
      {message && <p className="text-sm font-medium text-slate-500 animate-pulse">{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;
