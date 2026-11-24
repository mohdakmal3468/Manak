const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");
const ACCESS_TOKEN_KEY = "manak_access_token";
const USER_ID_KEY = "manak_user_id";

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface SignupResponse {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function storeAccessToken(token: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function storeUserId(userId: number): void {
  window.localStorage.setItem(USER_ID_KEY, String(userId));
}

export function getStoredUserId(): number | null {
  if (typeof window === "undefined") {
    return null;
  }
  const userId = Number(window.localStorage.getItem(USER_ID_KEY));
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

export function clearAccessToken(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(USER_ID_KEY);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody: unknown = await response.json();
    let detail: unknown;
    if (
      typeof errorBody === "object" &&
      errorBody !== null &&
      "detail" in errorBody
    ) {
      detail = errorBody.detail;
    }
    throw new Error(
      typeof detail === "string"
        ? detail
        : `Request failed with status ${response.status}.`,
    );
  }

  return response.json() as Promise<T>;
}
