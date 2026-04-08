import React, { useRef } from "react";
import { CloudUpload, Loader2 } from "lucide-react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, isUploading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative group h-72 border-2 border-dashed rounded-2xl bg-white flex flex-col items-center justify-center transition-all ${
        isUploading 
          ? "border-primary bg-sky-50/50 cursor-not-allowed" 
          : "border-sky-100 hover:border-primary hover:bg-sky-50/30 cursor-pointer"
      }`}
      onClick={() => !isUploading && fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
        className="hidden"
        accept="image/jpeg,image/png,image/jpg"
      />
      
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform ${
        isUploading ? "bg-primary animate-pulse" : "bg-sky-100 group-hover:scale-110"
      }`}>
        {isUploading ? (
          <Loader2 className="text-white animate-spin" size={32} />
        ) : (
          <CloudUpload className="text-primary" size={32} />
        )}
      </div>
      
      <h3 className="font-headline font-bold text-lg text-on-surface">
        {isUploading ? "Đang xử lý tệp..." : "Tải lên X-quang ngực"}
      </h3>
      <p className="text-on-surface-variant text-sm mt-1 text-center px-8">
        Kéo thả hoặc click để chọn tệp (JPEG, PNG)
      </p>
      
      {!isUploading && (
        <button className="mt-8 px-8 py-2.5 bg-sky-100 hover:bg-sky-200 text-primary font-bold rounded-xl transition-colors text-sm">
          Chọn tệp
        </button>
      )}
    </div>
  );
};

export default UploadZone;
