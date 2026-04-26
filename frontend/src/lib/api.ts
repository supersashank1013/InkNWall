const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const defaultApiBaseUrl = "http://localhost:8080";

export const API_BASE_URL = (rawApiBaseUrl || defaultApiBaseUrl).replace(/\/$/, "");

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export type AuthType = "user" | "admin";

export const getStoredToken = (authType: AuthType = "user"): string | null => {
  const key = authType === "admin" ? "adminToken" : "token";
  const token = localStorage.getItem(key);
  return token?.trim() || null;
};

export const clearUserAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
};

export const clearAdminAuth = () => {
  localStorage.removeItem("adminToken");
  window.location.href = "/admin-login";
};

export const parseJwtPayload = (token: string) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

export const isJwtExpired = (token: string | null): boolean => {
  if (!token) return false;
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return false;
  return payload.exp * 1000 < Date.now();
};

export const authFetch = async (
  path: string,
  init: RequestInit = {},
  authType: AuthType = "user"
): Promise<Response> => {
  const token = getStoredToken(authType);

  if (token && isJwtExpired(token)) {
    if (authType === "admin") {
      clearAdminAuth();
    } else {
      clearUserAuth();
    }
    throw new Error("Token expired");
  }

  const headers = new Headers(init.headers || undefined);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    if (authType === "admin") {
      clearAdminAuth();
    } else {
      clearUserAuth();
    }
    throw response;
  }

  return response;
};
