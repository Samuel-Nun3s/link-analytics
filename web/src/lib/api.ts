import { clearToken, getToken } from "./auth";
import type { ApiError } from "../types/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export class ApiException extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  // 401 em qualquer ponto = sessão inválida → limpa e força login
  if (res.status === 401) {
    clearToken();
    // Redireciona pra login. Usar window.location pra "hard reset" da app.
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw new ApiException(401, "Unauthorized");
  }

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const errPayload = payload as ApiError;
    const msg = errPayload?.error?.message ?? `HTTP ${res.status}`;
    throw new ApiException(res.status, msg, errPayload?.error?.code, errPayload?.error?.details);
  }

  return payload as T;
}
