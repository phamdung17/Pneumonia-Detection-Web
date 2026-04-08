import { useState } from "react";
import toast from "react-hot-toast";
import { validateFile } from "../utils/validators";

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (file: File) => {
    const { valid, error } = await validateFile(file);
    if (!valid) {
      toast.error(error || "Tệp không hợp lệ");
      return null;
    }
    return file;
  };

  return { handleFileSelect, isUploading, setIsUploading };
};
