import type { AdminSettings, ChatSettings, Key } from "@/lib/gateway/types";

const ADMIN_SETTINGS_KEY = "llm_gateway_admin";
const STORED_KEYS_KEY = "llm_gateway_keys";
const CHAT_SETTINGS_KEY = "llm_gateway_chat";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeKey(key: string) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(key);
}

export function defaultBaseUrl() {
  if (typeof window !== "undefined" && window.location.protocol.startsWith("http")) {
    return window.location.origin;
  }
  return "http://localhost:8000";
}

export function getAdminSettings(): AdminSettings | null {
  const saved = readJson<Partial<AdminSettings>>(ADMIN_SETTINGS_KEY, {});
  const baseUrl = typeof saved.baseUrl === "string" ? saved.baseUrl : "";
  const adminKey = typeof saved.adminKey === "string" ? saved.adminKey : "";

  if (!baseUrl && !adminKey) {
    return null;
  }

  return {
    baseUrl: baseUrl || defaultBaseUrl(),
    adminKey,
  };
}

export function saveAdminSettings(settings: AdminSettings) {
  writeJson(ADMIN_SETTINGS_KEY, settings);
}

export function clearAdminSettings() {
  removeKey(ADMIN_SETTINGS_KEY);
}

export function getStoredKeys(): Key[] {
  return readJson<Key[]>(STORED_KEYS_KEY, []);
}

export function upsertStoredKey(key: Key) {
  const existing = getStoredKeys().filter(
    (item) => !(item.tenant === key.tenant && item.name === key.name),
  );
  existing.unshift(key);
  writeJson(STORED_KEYS_KEY, existing.slice(0, 24));
}

export function revokeStoredKey(tenant: string, name: string, reason?: string) {
  const updated = getStoredKeys().map((item) => {
    if (item.tenant !== tenant || item.name !== name) {
      return item;
    }
    return {
      ...item,
      active: false,
      revokedAt: new Date().toISOString(),
      revokedReason: reason,
    };
  });
  writeJson(STORED_KEYS_KEY, updated);
}

export function clearStoredKeys() {
  removeKey(STORED_KEYS_KEY);
}

export function getChatSettings(): ChatSettings {
  const saved = readJson<Partial<ChatSettings>>(CHAT_SETTINGS_KEY, {});
  return {
    baseUrl: typeof saved.baseUrl === "string" && saved.baseUrl ? saved.baseUrl : defaultBaseUrl(),
    apiKey: typeof saved.apiKey === "string" ? saved.apiKey : "",
    model: typeof saved.model === "string" && saved.model ? saved.model : "tinyllama:latest",
    maxTokens: typeof saved.maxTokens === "number" ? saved.maxTokens : 256,
    temperature: typeof saved.temperature === "number" ? saved.temperature : 0.7,
  };
}

export function saveChatSettings(settings: ChatSettings) {
  writeJson(CHAT_SETTINGS_KEY, settings);
}

export function clearChatSettings() {
  removeKey(CHAT_SETTINGS_KEY);
}
