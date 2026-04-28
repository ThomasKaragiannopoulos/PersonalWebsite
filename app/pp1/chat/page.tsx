"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { RevealItem, RevealList, RevealSection } from "@/components/Reveal";
import { GatewayError, apiFetch } from "@/lib/gateway/client";
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
  const [hasAdminSession] = useState(() => !!(getAdminSettings()?.adminKey?.trim()));
  const [sessionStatus, setSessionStatus] = useState("Admin session required to load tenants.");
  const [chatStatus, setChatStatus] = useState("");
  const [responseMeta, setResponseMeta] = useState("No response yet.");
  const [ragMeta, setRagMeta] = useState("RAG: --");
  const [ragLog, setRagLog] = useState("");

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
      setSessionStatus("Tenants loaded.");
    } catch (error) {
      setTenants([]);
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
      await loadTenants();
    })();
  }, []);

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
    const baseUrl = chatSettings.baseUrl.trim();
    const model = chatSettings.model.trim();
    const apiKey = chatSettings.apiKey.trim();
    const trimmedPrompt = prompt.trim();

    if (!baseUrl || !apiKey || !model || !trimmedPrompt) {
      setChatStatus("Base URL, API key, model, and prompt are required.");
      return;
    }

    setChatStatus("Sending prompt...");
    setResponseMeta("Awaiting response...");
    setRagMeta("RAG: pending...");
    setRagLog("");

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

      const ragStatus = response.headers.get("x-rag") || "bypass";
      const ragChunks = response.headers.get("x-rag-chunks") || "0";
      setRagMeta(`RAG: ${ragStatus} | chunks: ${ragChunks}`);
      setRagLog(
        [
          `x-rag: ${ragStatus}`,
          `x-rag-chunks: ${ragChunks}`,
          `x-provider: ${response.headers.get("x-provider") || "--"}`,
          `x-route-reason: ${response.headers.get("x-route-reason") || "--"}`,
          `x-cache: ${response.headers.get("x-cache") || "--"}`,
        ].join("\n"),
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
      {!hasAdminSession && (
        <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/[0.08] px-5 py-4 text-sm text-amber-200">
          No admin session found.{" "}
          <a href="/pp1" className="text-[var(--accent)] underline">
            Set it up on the Overview page
          </a>{" "}
          — the Tenant and Key dropdowns require it.
        </div>
      )}
      <RevealSection className="pb-20">
        <div className="surface-card rounded-2xl p-8 sm:p-10">
          <p className="section-kicker">Tenant Chat</p>
          <h1 className="mt-4 font-display text-4xl text-white">Validate the request lifecycle.</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
            Load tenants from the admin session, choose a stored tenant key, and inspect the
            routing, cache, and retrieval headers returned by the gateway.
          </p>
        </div>
      </RevealSection>

      <RevealList className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <RevealItem>
          <section className="surface-card rounded-2xl p-6 sm:p-8">
            <p className="section-kicker">Session</p>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
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
                  <option value="">{tenants.length ? "Select tenant" : "Admin session required"}</option>
                  {tenants.length ? <option value={ALL_TENANTS_VALUE}>All tenants</option> : null}
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
              <Field label="Gateway Base URL">
                <input
                  name="baseUrl"
                  value={chatSettings.baseUrl}
                  onChange={handleSettingsChange}
                  className={fieldClassName}
                />
              </Field>
              <Field label="Tenant API Key">
                <input
                  name="apiKey"
                  type="password"
                  value={chatSettings.apiKey}
                  onChange={handleSettingsChange}
                  className={fieldClassName}
                />
              </Field>
              <Field label="Model">
                <input
                  name="model"
                  value={chatSettings.model}
                  onChange={handleSettingsChange}
                  className={fieldClassName}
                />
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
          </section>
        </RevealItem>

        <RevealItem>
          <section className="surface-card rounded-2xl p-6 sm:p-8">
            <p className="section-kicker">Prompt</p>
            <label className="mt-6 block">
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
              <button
                type="button"
                onClick={() => {
                  setPrompt("");
                  setMessages([]);
                  setResponseMeta("No response yet.");
                  setRagMeta("RAG: --");
                  setRagLog("");
                  setChatStatus("");
                }}
                className={ghostButtonClassName}
              >
                Clear
              </button>
            </div>
            <p className="mt-4 text-sm text-[var(--muted)]">{chatStatus}</p>
          </section>
        </RevealItem>
      </RevealList>

      <RevealSection className="section-divider pb-10">
        <div className="grid gap-6 pt-12 sm:pt-16 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="surface-card rounded-2xl p-6 sm:p-8">
            <p className="section-kicker">Thread</p>
            <p className="mt-4 text-sm text-[var(--muted)]">{responseMeta}</p>
            <div className="mt-6 space-y-4">
              {messages.length ? (
                messages.map((message, index) => (
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

          <div className="surface-card rounded-2xl p-6 sm:p-8">
            <p className="section-kicker">RAG Inspector</p>
            <p className="mt-4 text-sm text-[var(--foreground)]/78">{ragMeta}</p>
            <pre className="mt-6 overflow-x-auto rounded-2xl border border-white/8 bg-black/20 p-4 font-mono text-xs leading-6 text-[var(--foreground)]/72">
              {ragLog || "x-rag: --\nx-rag-chunks: --\nx-provider: --\nx-route-reason: --\nx-cache: --"}
            </pre>
          </div>
        </div>
      </RevealSection>
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
