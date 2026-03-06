/// <reference types="vite/client" />

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5173';
const baseUrl = import.meta.env.VITE_API_BASE_URL;
console.log("VITE_API_BASE_URL =", baseUrl);

async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${baseUrl}${path}`;
  console.log("FETCH =>", url);

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    ...options,
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} em ${url}: ${text}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Resposta não é JSON em ${url}: ${text}`);
  }
}

export const api = {
  get: <T>(path: string) => http<T>(path),
  
  post: <T>(path: string, data: any) =>
    http<T>(path, { method: "POST", body: JSON.stringify(data) }),
  
  put: <T>(path: string, data: any) =>
    http<T>(path, { method: "PUT", body: JSON.stringify(data) }),
  
  delete: <T>(path: string) =>
    http<T>(path, { method: "DELETE" }),
};