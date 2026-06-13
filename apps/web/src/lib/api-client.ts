import { resolveApiV1Prefix } from "@/lib/api-origin";
import { resolveApiCredentials } from "@/lib/api-credentials";
import {
  clearAccessToken,
  clearSessionHint,
  getAccessToken,
  setAccessToken,
} from "@/lib/auth/token-store";

export interface ApiErrorBody {
  code?: string;
  message: string;
  correlationId?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly correlationId?: string;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.correlationId = body.correlationId;
  }
}

type Envelope<T> = { data: T } | { error: ApiErrorBody };

let refreshInFlight: Promise<string | null> | null = null;

function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${resolveApiV1Prefix()}${normalized}`;
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const err =
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof (body as { error?: ApiErrorBody }).error?.message === "string"
        ? (body as { error: ApiErrorBody }).error
        : { message: res.statusText || "Request failed" };
    throw new ApiError(res.status, err);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (body && typeof body === "object" && "data" in body) {
    // Paginated payloads ({ data, meta }) are returned as-is.
    if ("meta" in body && body.meta !== undefined) {
      return body as T;
    }
    return (body as Envelope<T> & { data: T }).data;
  }

  throw new ApiError(res.status, { message: "Invalid API response envelope" });
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const res = await fetch(apiUrl("/auth/refresh"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        clearAccessToken();
        return null;
      }
      const data = await parseEnvelope<{ accessToken: string }>(res);
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
      clearAccessToken();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
  skipRefresh?: boolean;
  /** Override Bearer token (e.g. MFA challenge token from login). */
  bearerToken?: string;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    body,
    auth = true,
    skipRefresh = false,
    bearerToken,
    headers,
    ...init
  } = options;
  const normalized = path.startsWith("/") ? path : `/${path}`;

  const run = async (token: string | null): Promise<Response> => {
    const requestHeaders = new Headers(headers);
    if (body !== undefined && !(body instanceof FormData)) {
      requestHeaders.set("Content-Type", "application/json");
    }
    const bearer = bearerToken ?? token;
    if (auth && bearer) {
      requestHeaders.set("Authorization", `Bearer ${bearer}`);
    }

    return fetch(apiUrl(normalized), {
      ...init,
      credentials: resolveApiCredentials(normalized),
      headers: requestHeaders,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
  };

  const token = auth ? (bearerToken ?? getAccessToken()) : null;
  let res = await run(token);

  if (res.status === 401 && auth && !skipRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await run(refreshed);
    }
  }

  if (
    res.status === 401 &&
    auth &&
    typeof window !== "undefined" &&
    getAccessToken()
  ) {
    clearAccessToken();
    clearSessionHint();
    const locale = window.location.pathname.split("/")[1] ?? "en";
    window.location.assign(`/${locale}/auth/session-expired`);
    throw new ApiError(401, { message: "Session expired" });
  }

  return parseEnvelope<T>(res);
}

export function apiGet<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return apiRequest<T>(path, { ...options, method: "GET" });
}

export function apiPost<T>(
  path: string,
  body?: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>(path, { ...options, method: "POST", body });
}

export function apiPatch<T>(
  path: string,
  body?: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>(path, { ...options, method: "PATCH", body });
}

export function apiDelete<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return apiRequest<T>(path, { ...options, method: "DELETE" });
}

export function apiUpload<T>(
  path: string,
  formData: FormData,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>(path, {
    ...options,
    method: "POST",
    body: formData,
  });
}

export async function apiLogout(): Promise<void> {
  try {
    await apiRequest<{ message: string }>("/auth/logout", {
      method: "POST",
      auth: true,
      skipRefresh: true,
    });
  } finally {
    clearAccessToken();
  }
}
