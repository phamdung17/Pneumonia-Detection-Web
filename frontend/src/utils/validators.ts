import { MAX_FILE_SIZE_MB } from "./constants";

export const validateFile = async (file: File): Promise<{ valid: boolean; error?: string }> => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Chỉ chấp nhận định dạng JPEG, JPG hoặc PNG." };
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return { valid: false, error: `Kích thước tệp không được vượt quá ${MAX_FILE_SIZE_MB}MB.` };
  }

  // Magic bytes check
  const buffer = await file.slice(0, 4).arrayBuffer();
  const header = new Uint8Array(buffer);
  let headerHex = "";
  for (let i = 0; i < header.length; i++) {
    headerHex += header[i].toString(16).toUpperCase();
  }

  const isJPEG = headerHex.startsWith("FFD8FF");
  const isPNG = headerHex.startsWith("89504E47");

  if (!isJPEG && !isPNG) {
    return { valid: false, error: "Tệp hình ảnh không hợp lệ (sai magic bytes)." };
  }

  return { valid: true };
};
