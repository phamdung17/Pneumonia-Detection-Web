import { MAX_FILE_SIZE_MB } from "./constants";

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const validatePassword = (password: string): boolean => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(password);
};

export const validateFile = async (file: File): Promise<{ valid: boolean; error?: string }> => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Chi chap nhan dinh dang JPEG, JPG hoac PNG." };
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return { valid: false, error: `Kich thuoc tep khong duoc vuot qua ${MAX_FILE_SIZE_MB}MB.` };
  }

  const buffer = await file.slice(0, 4).arrayBuffer();
  const header = new Uint8Array(buffer);
  let headerHex = "";
  for (let i = 0; i < header.length; i += 1) {
    headerHex += header[i].toString(16).toUpperCase();
  }

  const isJPEG = headerHex.startsWith("FFD8FF");
  const isPNG = headerHex.startsWith("89504E47");

  if (!isJPEG && !isPNG) {
    return { valid: false, error: "Tep hinh anh khong hop le (sai magic bytes)." };
  }

  return { valid: true };
};
