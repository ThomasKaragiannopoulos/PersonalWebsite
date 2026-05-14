import type { AdminSettings } from "@/lib/gateway/types";

export class GatewayError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GatewayError";
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  settings: AdminSettings,
): Promise<T> {
  const baseUrl = settings.baseUrl.trim();
  const adminKey = settings.adminKey.trim();

  if (!baseUrl || !adminKey) {
    throw new GatewayError("Missing base URL or admin key.");
  }

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Authorization", `Bearer ${adminKey}`);

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = "Request failed";

    try {
      const body = await response.json();
      if (typeof body?.error?.message === "string") {
        message = body.error.message;
      } else if (typeof body?.message === "string") {
        message = body.message;
      }
    } catch {
      message = response.statusText || message;
    }

    throw new GatewayError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function healthFetch(url: string): Promise<"ok" | "error"> {
  try {
    const response = await fetch(url);
    return response.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}

export async function adminHealthFetch(url: string, adminKey: string): Promise<"ok" | "error"> {
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${adminKey}` },
    });
    return response.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}
