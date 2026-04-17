const DEFAULT_API_URL = "http://localhost:8000";

export const toApiAssetUrl = (path?: string | null): string => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const base = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};
