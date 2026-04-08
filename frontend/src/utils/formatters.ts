export const formatDate = (isoString: string) => {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatPercent = (float: number) => {
  return `${(float * 100).toFixed(1)}%`;
};

export const formatConfidence = (float: number) => {
  return `${(float * 100).toFixed(1)}%`;
};

export const getPredictionColor = (pred: "NORMAL" | "PNEUMONIA") => {
  return pred === "PNEUMONIA" ? "#ef4444" : "#10b981";
};

export const getPredictionLabel = (pred: "NORMAL" | "PNEUMONIA") => {
  return pred === "PNEUMONIA" ? "Viêm phổi" : "Bình thường";
};

export const getPredictionBadgeStyle = (pred: "NORMAL" | "PNEUMONIA") => {
  return pred === "PNEUMONIA"
    ? "bg-red-100 text-red-700 border-red-200"
    : "bg-emerald-100 text-emerald-700 border-emerald-200";
};
