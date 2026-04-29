/// <reference types="vite/client" />
import {
  OPERATOR_AUTH_UNAUTHORIZED_EVENT,
  clearStoredOperatorSession,
  getStoredOperatorSession,
} from "./operator-auth-storage";

const configuredBaseUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

export class OperatorApiError extends Error {
  status: number;
  body: string;

  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = "OperatorApiError";
    this.status = status;
    this.body = body;
  }
}

async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${configuredBaseUrl}${path}`;
  const session = getStoredOperatorSession();
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
      clearStoredOperatorSession();
      window.dispatchEvent(new Event(OPERATOR_AUTH_UNAUTHORIZED_EVENT));
    }

    throw new OperatorApiError(`HTTP ${res.status} em ${url}: ${text}`, res.status, text);
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

export const operatorApi = {
  get: <T>(path: string) => http<T>(path),

  post: <T>(path: string, data: unknown) =>
    http<T>(path, { method: "POST", body: JSON.stringify(data) }),
};
