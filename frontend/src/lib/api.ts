const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const defaultApiBaseUrl = import.meta.env.PROD ? "" : "http://localhost:8080";

export const API_BASE_URL = (rawApiBaseUrl || defaultApiBaseUrl).replace(/\/$/, "");

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
