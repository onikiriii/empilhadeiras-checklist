/// <reference types="vite/client" />
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearStoredAuthSession,
  getStoredAuthSession,
} from "./auth-storage";

const configuredBaseUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

export class ApiError extends Error {
  status: number;
  body: string;

  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${configuredBaseUrl}${path}`;
  const session = getStoredAuthSession();

  const headers = new Headers(options?.headers ?? {});

  if (!headers.has("Content-Type") && options?.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (session?.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const text = await res.text();

  if (!res.ok) {
    if (res.status === 401) {
      clearStoredAuthSession();
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }

    throw new ApiError(`HTTP ${res.status} em ${url}: ${text}`, res.status, text);
  }

  if (res.status === 204 || text.trim() === "") {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Resposta nao e JSON em ${url}: ${text}`);
  }
}

async function httpBlob(path: string, options?: RequestInit): Promise<Blob> {
  const url = `${configuredBaseUrl}${path}`;
  const session = getStoredAuthSession();

  const headers = new Headers(options?.headers ?? {});

  if (session?.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();

    if (res.status === 401) {
      clearStoredAuthSession();
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }

    throw new ApiError(`HTTP ${res.status} em ${url}: ${text}`, res.status, text);
  }

  return await res.blob();
}

export const api = {
  get: <T>(path: string) => http<T>(path),

  post: <T>(path: string, data: any) =>
    http<T>(path, { method: "POST", body: JSON.stringify(data) }),

  postForm: <T>(path: string, data: FormData) =>
    http<T>(path, { method: "POST", body: data }),

  put: <T>(path: string, data: any) =>
    http<T>(path, { method: "PUT", body: JSON.stringify(data) }),

  putForm: <T>(path: string, data: FormData) =>
    http<T>(path, { method: "PUT", body: data }),

  delete: <T>(path: string) =>
    http<T>(path, { method: "DELETE" }),

  getBlob: (path: string) => httpBlob(path),
};
