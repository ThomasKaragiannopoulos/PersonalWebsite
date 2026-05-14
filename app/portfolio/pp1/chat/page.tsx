"use client";

import Link from "next/link";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { RevealItem, RevealSection } from "@/components/Reveal";
import { GatewayError, adminHealthFetch, apiFetch } from "@/lib/gateway/client";
import {
  getAdminSettings,
  getChatSettings,
  getStoredKeys,
  saveChatSettings,
} from "@/lib/gateway/storage";
import type { AdminSettings, ChatSettings, Key } from "@/lib/gateway/types";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type TenantApiRecord = {
  tenant: string;
};

type SessionState = "checking" | "valid" | "invalid" | "missing";

const ALL_TENANTS_VALUE = "__all__";

function normalizeTenant(value: string) {
  return value.trim().toLowerCase();
}

export default function PP1ChatPage() {
  const [chatSettings, setChatSettings] = useState<ChatSettings>(() => getChatSettings());
  const [tenants, setTenants] = useState<string[]>([]);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [availableKeys, setAvailableKeys] = useState<Key[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const [sessionStatus, setSessionStatus] = useState("Admin session required to load tenants.");
  const [chatStatus, setChatStatus] = useState("");
  const [responseMeta, setResponseMeta] = useState("No response yet.");

  async function loadTenants() {
    const settings = getAdminSettings();

    if (!settings?.adminKey) {
      setTenants([]);
      setSessionStatus("Admin session required to load tenants.");
      return;
    }

    try {
      const result = await apiFetch<{ tenants?: TenantApiRecord[] }>(
        "/v1/admin/tenants",
        { method: "GET" },
        settings,
      );
      const names = (result.tenants || [])
        .map((tenant) => tenant.tenant)
        .sort((left, right) => left.localeCompare(right));
      setTenants(names);
      if (names.length) {
        setSelectedTenant(ALL_TENANTS_VALUE);
      } else {
        setSelectedTenant("");
      }
      setSessionStatus("Tenants loaded.");
    } catch (error) {
      setTenants([]);
      setSelectedTenant("");
      setSessionStatus(error instanceof Error ? error.message : "Failed to load tenants.");
    }
  }

  async function fetchActiveKeyNames(tenant: string, settings: AdminSettings) {
    const result = await apiFetch<{ keys?: Array<{ name: string; active: boolean }> }>(
      `/v1/admin/tenants/${encodeURIComponent(tenant)}/keys`,
      { method: "GET" },
      settings,
    );
    return (result.keys || []).filter((key) => key.active).map((key) => key.name);
  }

  async function refreshKeysForTenant(tenant: string) {
    const storedKeys = getStoredKeys();
    const settings = getAdminSettings();

    if (!tenant) {
      setAvailableKeys([]);
      return;
    }

    if (!settings?.adminKey) {
      setAvailableKeys(
        storedKeys.filter((item) => item.active && normalizeTenant(item.tenant) === normalizeTenant(tenant)),
      );
      setSessionStatus("Admin session required to verify active keys.");
      return;
    }

    try {
      if (tenant === ALL_TENANTS_VALUE) {
        const activeNamesByTenant = new Map<string, Set<string>>();
        await Promise.all(
          tenants.map(async (tenantName) => {
            const names = await fetchActiveKeyNames(tenantName, settings);
            activeNamesByTenant.set(normalizeTenant(tenantName), new Set(names));
          }),
        );

        setAvailableKeys(
          storedKeys.filter((item) => {
            if (!item.active || !item.name) {
              return false;
            }
            const nameSet = activeNamesByTenant.get(normalizeTenant(item.tenant));
            return nameSet ? nameSet.has(item.name) : false;
          }),
        );
        return;
      }

      const activeNames = await fetchActiveKeyNames(tenant, settings);
      const activeNameSet = new Set(activeNames);
      setAvailableKeys(
        storedKeys.filter(
          (item) =>
            item.active &&
            normalizeTenant(item.tenant) === normalizeTenant(tenant) &&
            activeNameSet.has(item.name),
        ),
      );
    } catch (error) {
      setAvailableKeys(
        storedKeys.filter((item) => item.active && normalizeTenant(item.tenant) === normalizeTenant(tenant)),
      );
      setSessionStatus(error instanceof Error ? error.message : "Failed to load keys.");
    }
  }

  useEffect(() => {
    void (async () => {
      const settings = getAdminSettings();
      if (!settings?.baseUrl.trim() || !settings.adminKey.trim()) {
        setSessionState("missing");
        return;
      }

      const baseUrl = settings.baseUrl.trim().replace(/\/$/, "");
      const adminState = await adminHealthFetch(`${baseUrl}/v1/admin/keys`, settings.adminKey.trim());
      if (adminState !== "ok") {
        setSessionState("invalid");
        setSessionStatus("Saved admin session is invalid. Reconfigure it from the overview page.");
        setTenants([]);
        return;
      }

      setSessionState("valid");
      await loadTenants();
    })();
  }, []);

  useEffect(() => {
    if (selectedTenant === ALL_TENANTS_VALUE && tenants.length) {
      void refreshKeysForTenant(ALL_TENANTS_VALUE);
    }
  }, [selectedTenant, tenants]);

  const selectedKeyRecord = useMemo(
    () => availableKeys.find((item) => `${item.tenant}:${item.name}` === selectedKey),
    [availableKeys, selectedKey],
  );

  function handleSettingsChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setChatSettings((current) => ({
      ...current,
      [name]:
        name === "maxTokens" || name === "temperature"
          ? Number(value || 0)
          : value,
    }));
  }

  function persistSettings() {
    saveChatSettings(chatSettings);
    setSessionStatus("Chat session saved.");
  }

  async function sendChat() {
    const baseUrl = (getAdminSettings()?.baseUrl ?? chatSettings.baseUrl).trim();
    const model = chatSettings.model.trim();
    const apiKey = chatSettings.apiKey.trim();
    const trimmedPrompt = prompt.trim();

    if (!baseUrl) {
      setChatStatus("No gateway URL. Load a session from the overview page.");
      return;
    }
    if (!apiKey) {
      setChatStatus("No key loaded. Select a tenant then pick a stored key from the dropdown.");
      return;
    }
    if (!model || !trimmedPrompt) {
      setChatStatus("Model and prompt are required.");
      return;
    }

    setChatStatus("Sending prompt...");
    setResponseMeta("Awaiting response...");

    const payload: Record<string, unknown> = {
      model,
      messages: [{ role: "user", content: trimmedPrompt }],
      max_tokens: chatSettings.maxTokens,
      temperature: chatSettings.temperature,
    };

    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = response.statusText || "Request failed";
        try {
          const error = await response.json();
          if (typeof error?.error?.message === "string") {
            message = error.error.message;
          }
        } catch {
          // ignore
        }
        throw new GatewayError(message, response.status);
      }

      const data = (await response.json()) as {
        id: string;
        model: string;
        created: number;
        content: string;
      };

      setMessages((current) => [
        ...current,
        { role: "user", content: trimmedPrompt },
        { role: "assistant", content: data.content || "(empty response)" },
      ]);
      setResponseMeta(
        `id: ${data.id} | model: ${data.model} | created: ${new Date(data.created * 1000).toLocaleString()}`,
      );

      setChatStatus("Response received.");
      saveChatSettings(chatSettings);
      setPrompt("");
    } catch (error) {
      setChatStatus(error instanceof Error ? error.message : "Chat request failed.");
      setResponseMeta("Request failed.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-16 pt-10 sm:px-8 lg:px-12">
      <RevealSection className="pb-10">
        <div className="border-b border-white/8 pb-16">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-start">
            <div>
              <p className="font-mono text-sm text-[var(--muted)]">
                <span>pp1</span>
                <span className="mx-1 text-white/20">/</span>
                <span className="text-white">chat</span>
              </p>
              <h1 className="font-display mt-5 max-w-3xl text-4xl font-normal text-white sm:text-5xl">
                Validate the request lifecycle.
              </h1>
              <p className="mt-4 max-w-3xl text-lg text-[var(--muted)]">
                Load tenants from the admin session, choose a stored tenant key, and inspect the
                routing, cache, and retrieval headers returned by the gateway.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                Admin session
              </p>
              {sessionState === "checking" ? (
                <div className="mt-4 flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/50" />
                  <div>
                    <p className="text-sm text-white">Checking saved session.</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                      Verifying the saved gateway base URL and admin key before loading tenant controls.
                    </p>
                  </div>
                </div>
              ) : sessionState === "valid" ? (
                <div className="mt-4 flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]" />
                  <div>
                    <p className="text-sm text-white">Connected. Admin session active.</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                      Tenant and key controls will use the saved overview credentials for this local session.
                    </p>
                  </div>
                </div>
              ) : sessionState === "invalid" ? (
                <div className="mt-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.28)]" />
                    <div>
                      <p className="text-sm text-white">Saved admin session failed validation.</p>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        The current base URL or admin key does not pass the admin health check. Update the session on the overview page.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/portfolio/pp1#gateway-settings"
                    className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-[var(--foreground)]/80 transition-colors hover:border-white/20 hover:text-white"
                  >
                    Fix session on overview →
                  </Link>
                </div>
              ) : (
                <div className="mt-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/25" />
                    <div>
                      <p className="text-sm text-white">No admin session configured.</p>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        Set the gateway base URL and admin key on the overview page before using tenant and key controls.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/portfolio/pp1#gateway-settings"
                    className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-[var(--foreground)]/80 transition-colors hover:border-white/20 hover:text-white"
                  >
                    Go to overview →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </RevealSection>

      <div className="space-y-10 pt-2">
        <RevealItem>
          <div>
            <h2 className="section-title text-white">Session</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Configure tenant, key, model, and request parameters.
            </p>
          </div>
          <div className="mt-6 overflow-hidden rounded-[1.1rem] border border-white/8 bg-white/[0.025]">
            <div className="px-5 py-6 sm:px-7">
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Tenant">
                  <select
                    value={selectedTenant}
                    onChange={(event) => {
                      const nextTenant = event.target.value;
                      setSelectedTenant(nextTenant);
                      setSelectedKey("");
                      void refreshKeysForTenant(nextTenant);
                      if (nextTenant !== ALL_TENANTS_VALUE) {
                        const match = availableKeys.find(
                          (item) => normalizeTenant(item.tenant) === normalizeTenant(nextTenant),
                        );
                        if (match) {
                          setChatSettings((current) => ({ ...current, apiKey: match.apiKey }));
                        }
                      }
                    }}
                    className={fieldClassName}
                  >
                    {tenants.length ? <option value={ALL_TENANTS_VALUE}>All tenants</option> : (
                      <option value="">Admin session required</option>
                    )}
                    {tenants.map((tenant) => (
                      <option key={tenant} value={tenant}>
                        {tenant}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Key">
                  <select
                    value={selectedKey}
                    onChange={(event) => {
                      setSelectedKey(event.target.value);
                      const match = availableKeys.find(
                        (item) => `${item.tenant}:${item.name}` === event.target.value,
                      );
                      if (match) {
                        setChatSettings((current) => ({ ...current, apiKey: match.apiKey }));
                        if (selectedTenant === ALL_TENANTS_VALUE) {
                          setSelectedTenant(match.tenant);
                        }
                      }
                    }}
                    className={fieldClassName}
                  >
                    <option value="">
                      {selectedTenant ? "Select stored key" : "Select a tenant to see keys"}
                    </option>
                    {availableKeys.map((item) => (
                      <option key={`${item.tenant}:${item.name}`} value={`${item.tenant}:${item.name}`}>
                        {item.name ? `${item.tenant} - ${item.name}` : item.tenant}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Model">
                  <select
                    name="model"
                    value={chatSettings.model}
                    onChange={(e) => setChatSettings((c) => ({ ...c, model: e.target.value }))}
                    className={fieldClassName}
                  >
                    <option value="mock-1">Mock (fixed response)</option>
                    <option value="gpt-4o-mini">GPT-4o mini</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </Field>
                <Field label="Max Tokens">
                  <input
                    name="maxTokens"
                    type="number"
                    min={1}
                    value={chatSettings.maxTokens}
                    onChange={handleSettingsChange}
                    className={fieldClassName}
                  />
                </Field>
                <Field label="Temperature">
                  <input
                    name="temperature"
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={chatSettings.temperature}
                    onChange={handleSettingsChange}
                    className={fieldClassName}
                  />
                </Field>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={persistSettings} className={primaryButtonClassName}>
                  Save Session
                </button>
                <button type="button" onClick={() => setChatSettings(getChatSettings())} className={ghostButtonClassName}>
                  Reset
                </button>
                <button type="button" onClick={() => void refreshKeysForTenant(selectedTenant)} className={ghostButtonClassName}>
                  Reload Keys
                </button>
                <button type="button" onClick={() => void loadTenants()} className={ghostButtonClassName}>
                  Fetch Tenants
                </button>
              </div>
              <p className="mt-4 text-sm text-[var(--muted)]">{sessionStatus}</p>
              {selectedKeyRecord ? (
                <p className="mt-2 font-mono text-xs text-[var(--foreground)]/55">
                  Active key: {selectedKeyRecord.tenant} / {selectedKeyRecord.name}
                </p>
              ) : null}
            </div>
          </div>
        </RevealItem>

        <RevealItem>
          <div>
            <h2 className="section-title text-white">Prompt</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Send a message and review the response thread.
            </p>
          </div>
          <div className="mt-6 overflow-hidden rounded-[1.1rem] border border-white/8 bg-white/[0.025]">
            <div className="px-5 py-6 sm:px-7">
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">Message</span>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={7}
                  placeholder="Ask a question or request a summary..."
                  className={`${fieldClassName} min-h-40 resize-y`}
                />
              </label>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={() => void sendChat()} className={primaryButtonClassName}>
                  Send
                </button>
              </div>
              <p className="mt-4 text-sm text-[var(--muted)]">{chatStatus}</p>
            </div>
            <div className="border-t border-white/8 px-5 py-6 sm:px-7">
              <div className="flex items-center justify-between gap-4">
                <p className="section-kicker">Thread</p>
                <button
                  type="button"
                  onClick={() => {
                    setPrompt("");
                    setMessages([]);
                    setResponseMeta("No response yet.");
                    setChatStatus("");
                  }}
                  className={ghostButtonClassName}
                >
                  Clear
                </button>
              </div>
              <p className="mt-4 text-sm text-[var(--muted)]">{responseMeta}</p>
              <div className="mt-6 space-y-4">
                {messages.length ? (
                  [...messages].reverse().map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`rounded-2xl border p-4 ${
                        message.role === "assistant"
                          ? "border-[var(--accent)]/18 bg-[var(--accent-soft)]"
                          : "border-white/8 bg-white/[0.03]"
                      }`}
                    >
                      <p className="section-kicker">{message.role}</p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--foreground)]/82">
                        {message.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-[var(--muted)]">
                    No messages yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </RevealItem>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}

const fieldClassName =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition-colors focus:border-[var(--accent)]/40";
const primaryButtonClassName =
  "rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-5 py-3 text-sm font-semibold text-white";
const ghostButtonClassName =
  "rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-[var(--foreground)]/80";
