"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RevealItem, RevealSection } from "@/components/Reveal";
import { adminHealthFetch, apiFetch } from "@/lib/gateway/client";
import {
  clearStoredKeys,
  defaultBaseUrl,
  getAdminSettings,
  getStoredKeys,
  revokeStoredKey,
  upsertStoredKey,
} from "@/lib/gateway/storage";
import type { AdminSettings, Key } from "@/lib/gateway/types";

type TenantRecord = { tenant: string };
type AdminKeyRecord = {
  name: string;
  active: boolean;
  created_at?: string;
  last_used_at?: string;
  revoked_at?: string;
  revoked_reason?: string;
  key_last6?: string;
};

type SessionState = "checking" | "valid" | "invalid" | "missing";

export default function PP1KeysPage() {
  const [settings] = useState<AdminSettings>(
    () => getAdminSettings() ?? { baseUrl: defaultBaseUrl(), adminKey: "" },
  );
  const [tenants, setTenants] = useState<string[]>([]);
  const [createTenant, setCreateTenant] = useState("");
  const [createKeyName, setCreateKeyName] = useState("");
  const [latestKey, setLatestKey] = useState("No key generated yet.");
  const [showCopyWarning, setShowCopyWarning] = useState(false);
  const [listTenant, setListTenant] = useState("");
  const [tenantKeys, setTenantKeys] = useState<AdminKeyRecord[]>([]);
  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const [sessionStatus, setSessionStatus] = useState("Admin session required to manage keys.");
  const [keysStatus, setKeysStatus] = useState("");
  const [importTenant, setImportTenant] = useState("");
  const [importKeyName, setImportKeyName] = useState("");
  const [importKeyValue, setImportKeyValue] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [revokeTenantName, setRevokeTenantName] = useState("");
  const [revokeKeyName, setRevokeKeyName] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeStatus, setRevokeStatus] = useState("");
  const [storedKeys, setStoredKeys] = useState<Key[]>(() => getStoredKeys());

  useEffect(() => {
    void (async () => {
      const saved = getAdminSettings();
      if (!saved?.baseUrl.trim() || !saved.adminKey.trim()) {
        setSessionState("missing");
        return;
      }

      const baseUrl = saved.baseUrl.trim().replace(/\/$/, "");
      const adminState = await adminHealthFetch(`${baseUrl}/v1/admin/keys`, saved.adminKey.trim());
      if (adminState !== "ok") {
        setSessionState("invalid");
        setSessionStatus("Saved admin session is invalid. Reconfigure it from the overview page.");
        setTenants([]);
        return;
      }

      setSessionState("valid");
      await loadTenants(saved);
    })();
  }, []);

  async function loadTenants(current: AdminSettings) {
    if (!current.adminKey.trim()) {
      setTenants([]);
      setSessionStatus("Admin session required to manage keys.");
      return;
    }

    try {
      const result = await apiFetch<{ tenants?: TenantRecord[] }>(
        "/v1/admin/tenants",
        { method: "GET" },
        current,
      );
      const names = (result.tenants || []).map((tenant) => tenant.tenant).sort();
      setTenants(names);
      setSessionStatus("Tenants loaded.");
    } catch (error) {
      setTenants([]);
      setSessionStatus(error instanceof Error ? error.message : "Failed to load tenants.");
    }
  }

  async function createKey() {
    if (!createTenant || !createKeyName) {
      setSessionStatus("Tenant and key name are required.");
      return;
    }

    try {
      const result = await apiFetch<{ tenant: string; name: string; api_key: string }>(
        `/v1/admin/tenants/${encodeURIComponent(createTenant)}/keys`,
        {
          method: "POST",
          body: JSON.stringify({ name: createKeyName }),
        },
        settings,
      );

      setLatestKey(result.api_key);
      setShowCopyWarning(true);
      upsertStoredKey({
        tenant: result.tenant,
        name: result.name,
        apiKey: result.api_key,
        createdAt: new Date().toISOString(),
        active: true,
      });
      setStoredKeys(getStoredKeys());
      setSessionStatus(`Key created for ${result.tenant}.`);
    } catch (error) {
      setSessionStatus(error instanceof Error ? error.message : "Failed to create key.");
    }
  }

  async function loadTenantKeys() {
    if (!listTenant) {
      setKeysStatus("Tenant is required.");
      return;
    }

    try {
      const result = await apiFetch<{ keys?: AdminKeyRecord[] }>(
        `/v1/admin/tenants/${encodeURIComponent(listTenant)}/keys`,
        { method: "GET" },
        settings,
      );
      setTenantKeys(result.keys || []);
      setKeysStatus("Keys loaded.");
    } catch (error) {
      setTenantKeys([]);
      setKeysStatus(error instanceof Error ? error.message : "Failed to load keys.");
    }
  }

  async function importKey() {
    if (!importTenant || !importKeyName || !importKeyValue) {
      setImportStatus("Tenant, key name, and key value are required.");
      return;
    }

    try {
      const result = await apiFetch<{ matches: boolean }>(
        "/v1/admin/keys/verify",
        {
          method: "POST",
          body: JSON.stringify({
            tenant: importTenant,
            name: importKeyName,
            api_key: importKeyValue,
          }),
        },
        settings,
      );

      if (!result.matches) {
        setImportStatus("Key verification failed.");
        return;
      }

      upsertStoredKey({
        tenant: importTenant,
        name: importKeyName,
        apiKey: importKeyValue,
        createdAt: new Date().toISOString(),
        active: true,
      });
      setStoredKeys(getStoredKeys());
      setImportStatus("Key verified and stored locally.");
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : "Failed to import key.");
    }
  }

  async function revokeKey() {
    if (!revokeTenantName || !revokeKeyName) {
      setRevokeStatus("Tenant and key name are required.");
      return;
    }

    try {
      await apiFetch(
        `/v1/admin/tenants/${encodeURIComponent(revokeTenantName)}/keys/revoke`,
        {
          method: "POST",
          body: JSON.stringify({ name: revokeKeyName, reason: revokeReason || null }),
        },
        settings,
      );
      revokeStoredKey(revokeTenantName, revokeKeyName, revokeReason || undefined);
      setStoredKeys(getStoredKeys());
      setRevokeStatus("Key revoked.");
    } catch (error) {
      setRevokeStatus(error instanceof Error ? error.message : "Failed to revoke key.");
    }
  }

  const availableImportNames = tenantKeys.filter((item) => item.active).map((item) => item.name);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-16 pt-10 sm:px-8 lg:px-12">
      <RevealSection className="pb-10">
        <div className="border-b border-white/8 pb-16">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-start">
            <div>
              <p className="font-mono text-sm text-[var(--muted)]">
                <span>pp1</span>
                <span className="mx-1 text-white/20">/</span>
                <span className="text-white">keys</span>
              </p>
              <h1 className="font-display mt-5 max-w-3xl text-4xl font-normal text-white sm:text-5xl">
                Tenant-scoped API key management.
              </h1>
              <p className="mt-4 max-w-3xl text-lg text-[var(--muted)]">
                Create keys, list server-side metadata, import known keys for local testing, and revoke
                by tenant and key name.
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
                      Verifying the saved gateway base URL and admin key before loading key management controls.
                    </p>
                  </div>
                </div>
              ) : sessionState === "valid" ? (
                <div className="mt-4 flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]" />
                  <div>
                    <p className="text-sm text-white">Connected. Admin session active.</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                      Key management actions will use the saved overview credentials for this local session.
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
                        Set the gateway base URL and admin key on the overview page before using key management controls.
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

      <div className="space-y-10">
        <RevealItem>
          <div>
            <h2 className="section-title text-white">Create Key</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Generate a new scoped key for a tenant.</p>
          </div>
          <div className="mt-6 overflow-hidden rounded-[1.1rem] border border-white/8 bg-white/[0.025]">
            <div className="px-5 py-6 sm:px-7">
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Tenant Name">
                  <select value={createTenant} onChange={(event) => setCreateTenant(event.target.value)} className={fieldClassName}>
                    <option value="">{tenants.length ? "Select tenant" : "No tenants loaded"}</option>
                    {tenants.map((tenant) => (
                      <option key={tenant} value={tenant}>{tenant}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Key Name">
                  <input value={createKeyName} onChange={(event) => setCreateKeyName(event.target.value)} placeholder="prod-default" className={fieldClassName} />
                </Field>
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => void createKey()} className={primaryButtonClassName}>Generate Key</button>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(latestKey);
                    setShowCopyWarning(false);
                  }}
                  className={ghostButtonClassName}
                  disabled={latestKey === "No key generated yet."}
                >
                  Copy Latest
                </button>
              </div>
              <p className="mt-4 text-sm text-[var(--muted)]">{sessionStatus}</p>
              <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-4">
                <p className="section-kicker">New Key</p>
                <p className="mt-3 break-all font-mono text-xs text-[var(--foreground)]/75">{latestKey}</p>
              </div>
              {showCopyWarning && (
                <div className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.08] px-4 py-3 text-sm text-amber-200">
                  Copy this key now. It will not be shown again after you leave or regenerate.
                </div>
              )}
            </div>
          </div>
        </RevealItem>

        <RevealItem>
          <div>
            <h2 className="section-title text-white">List Keys</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Inspect server-side key metadata for a tenant.</p>
          </div>
          <div className="mt-6 overflow-hidden rounded-[1.1rem] border border-white/8 bg-white/[0.025]">
            <div className="px-5 py-6 sm:px-7">
              <div className="grid gap-4 lg:grid-cols-2 lg:items-end">
                <Field label="Tenant Name">
                  <select value={listTenant} onChange={(event) => setListTenant(event.target.value)} className={fieldClassName}>
                    <option value="">{tenants.length ? "Select tenant" : "No tenants loaded"}</option>
                    {tenants.map((tenant) => (
                      <option key={tenant} value={tenant}>{tenant}</option>
                    ))}
                  </select>
                </Field>
                <div>
                  <button type="button" onClick={() => void loadTenantKeys()} className={ghostButtonClassName}>Load Keys</button>
                </div>
              </div>
              <p className="mt-4 text-sm text-[var(--muted)]">{keysStatus}</p>
              <div className="mt-6 space-y-3">
                {tenantKeys.length ? tenantKeys.map((item) => {
                  const localExists = storedKeys.some(
                    (stored) => stored.tenant === listTenant && stored.name === item.name,
                  );
                  return (
                    <div
                      key={item.name}
                      className={`rounded-2xl border p-4 ${
                        item.active
                          ? localExists
                            ? "border-[var(--accent)]/18 bg-[var(--accent-soft)]"
                            : "border-amber-400/20 bg-amber-400/10"
                          : "border-white/8 bg-white/[0.03] opacity-70"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="font-semibold text-white">{item.name}</p>
                        <div className="flex gap-2">
                          <span className="rounded-full border border-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                            {item.active ? "active" : "revoked"}
                          </span>
                          <span className={`rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${
                            localExists
                              ? "border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]"
                              : "border-amber-400/20 bg-amber-400/10 text-amber-200"
                          }`}>
                            {localExists ? "local" : "missing-local"}
                          </span>
                        </div>
                      </div>
                      <p className="mt-3 font-mono text-xs text-[var(--foreground)]/62">
                        hash ****{item.key_last6 || "------"}
                      </p>
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        created: {item.created_at ? new Date(item.created_at).toLocaleString() : "unknown"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        last used: {item.last_used_at ? new Date(item.last_used_at).toLocaleString() : "never"}
                      </p>
                    </div>
                  );
                }) : <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-[var(--muted)]">No keys loaded.</div>}
              </div>
            </div>
          </div>
        </RevealItem>

        <RevealItem>
          <div>
            <h2 className="section-title text-white">Import Key</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Verify an existing key and store it locally for the chat interface.</p>
          </div>
          <div className="mt-6 overflow-hidden rounded-[1.1rem] border border-white/8 bg-white/[0.025]">
            <div className="px-5 py-6 sm:px-7">
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Tenant Name">
                  <select value={importTenant} onChange={(event) => setImportTenant(event.target.value)} className={fieldClassName}>
                    <option value="">{tenants.length ? "Select tenant" : "No tenants loaded"}</option>
                    {tenants.map((tenant) => (
                      <option key={tenant} value={tenant}>{tenant}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Key Name">
                  <input value={importKeyName} onChange={(event) => setImportKeyName(event.target.value)} placeholder={availableImportNames[0] || "prod-default"} className={fieldClassName} />
                </Field>
                <Field label="Key Value">
                  <input type="password" value={importKeyValue} onChange={(event) => setImportKeyValue(event.target.value)} placeholder="sk-tenant-..." className={fieldClassName} />
                </Field>
              </div>
              <div className="mt-6">
                <button type="button" onClick={() => void importKey()} className={primaryButtonClassName}>Verify & Store</button>
              </div>
              <p className="mt-4 text-sm text-[var(--muted)]">{importStatus}</p>
            </div>
          </div>
        </RevealItem>

        <RevealItem>
          <div>
            <h2 className="section-title text-white">Revoke Key</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Permanently revoke a tenant key on the gateway.</p>
          </div>
          <div className="mt-6 overflow-hidden rounded-[1.1rem] border border-white/8 bg-white/[0.025]">
            <div className="px-5 py-6 sm:px-7">
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Tenant Name">
                  <select value={revokeTenantName} onChange={(event) => setRevokeTenantName(event.target.value)} className={fieldClassName}>
                    <option value="">{tenants.length ? "Select tenant" : "No tenants loaded"}</option>
                    {tenants.map((tenant) => (
                      <option key={tenant} value={tenant}>{tenant}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Key Name">
                  <input value={revokeKeyName} onChange={(event) => setRevokeKeyName(event.target.value)} placeholder="prod-default" className={fieldClassName} />
                </Field>
                <Field label="Reason">
                  <input value={revokeReason} onChange={(event) => setRevokeReason(event.target.value)} placeholder="compromised / rotated / unused" className={fieldClassName} />
                </Field>
              </div>
              <div className="mt-6">
                <button type="button" onClick={() => void revokeKey()} className={ghostButtonClassName}>Revoke Key</button>
              </div>
              <p className="mt-4 text-sm text-[var(--muted)]">{revokeStatus}</p>
            </div>
          </div>
        </RevealItem>
      </div>

      <RevealSection className="section-divider pb-10">
        <div className="pt-12 sm:pt-16">
          <div className="flex items-center justify-between gap-4">
            <h2 className="section-title text-white">Stored Keys</h2>
            <button type="button" onClick={() => { clearStoredKeys(); setStoredKeys([]); }} className={ghostButtonClassName}>
              Clear Stored Keys
            </button>
          </div>
          <div className="mt-8 grid gap-3">
            {storedKeys.length ? storedKeys.map((item) => (
              <div key={`${item.tenant}:${item.name}`} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="font-semibold text-white">{item.tenant} / {item.name}</p>
                  <span className={`rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${
                    item.active
                      ? "border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-white/10 bg-white/[0.05] text-[var(--muted)]"
                  }`}>
                    {item.active ? "active" : "revoked"}
                  </span>
                </div>
                <p className="mt-3 font-mono text-xs text-[var(--foreground)]/64">**** {item.apiKey.slice(-6)}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            )) : <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-[var(--muted)]">No stored keys yet.</div>}
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
