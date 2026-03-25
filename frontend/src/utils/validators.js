import { MAX_FILE_SIZE_MB, PASSWORD_REGEX } from './constants';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAGIC_SIGNATURES = {
  jpeg: ['ff', 'd8', 'ff'],
  png: ['89', '50', '4e', '47'],
};

export async function validateImageFile(file) {
  if (!file) return 'Chua chon file';
  if (!ALLOWED_TYPES.includes(file.type)) return 'Chi chap nhan JPG/JPEG/PNG';
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `File vuot qua ${MAX_FILE_SIZE_MB}MB`;

  const buffer = await file.slice(0, 4).arrayBuffer();
  const bytes = Array.from(new Uint8Array(buffer)).map((item) => item.toString(16).padStart(2, '0'));
  const isJpeg = MAGIC_SIGNATURES.jpeg.every((sig, index) => bytes[index] === sig);
  const isPng = MAGIC_SIGNATURES.png.every((sig, index) => bytes[index] === sig);

  if (!isJpeg && !isPng) return 'Noi dung file khong dung dinh dang anh hop le';
  return null;
}

export function validatePassword(password) {
  return PASSWORD_REGEX.test(password);
}
