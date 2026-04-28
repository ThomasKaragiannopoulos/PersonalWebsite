"use client";

import { useEffect, useState } from "react";
import { RevealItem, RevealList, RevealSection } from "@/components/Reveal";
import { apiFetch } from "@/lib/gateway/client";
import {
  clearAdminSettings,
  clearStoredKeys,
  defaultBaseUrl,
  getAdminSettings,
  getStoredKeys,
  revokeStoredKey,
  saveAdminSettings,
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

export default function PP1KeysPage() {
  const [settings, setSettings] = useState<AdminSettings>(
    () => getAdminSettings() ?? { baseUrl: defaultBaseUrl(), adminKey: "" },
  );
  const [sessionStatus, setSessionStatus] = useState("Provide admin credentials to manage keys.");
  const [tenants, setTenants] = useState<string[]>([]);
  const [createTenant, setCreateTenant] = useState("");
  const [createKeyName, setCreateKeyName] = useState("");
  const [latestKey, setLatestKey] = useState("No key generated yet.");
  const [listTenant, setListTenant] = useState("");
  const [tenantKeys, setTenantKeys] = useState<AdminKeyRecord[]>([]);
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
      if (saved) {
        await loadTenants(saved);
      }
    })();
  }, []);

  async function loadTenants(current: AdminSettings) {
    if (!current.adminKey.trim()) {
      setTenants([]);
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

  async function saveSession() {
    saveAdminSettings(settings);
    setSessionStatus("Admin session saved.");
    await loadTenants(settings);
  }

  function clearSession() {
    clearAdminSettings();
    clearStoredKeys();
    setSettings({ baseUrl: defaultBaseUrl(), adminKey: "" });
    setTenants([]);
    setStoredKeys([]);
    setLatestKey("No key generated yet.");
    setSessionStatus("Admin session cleared.");
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
      <RevealSection className="pb-20">
        <div className="surface-card rounded-2xl p-8 sm:p-10">
          <p className="section-kicker">Key Operations</p>
          <h1 className="mt-4 font-display text-4xl text-white">Tenant-scoped API key management.</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
            Create keys, list server-side metadata, import known keys for local testing, and revoke
            by tenant and key name.
          </p>
        </div>
      </RevealSection>

      <RevealSection className="pb-10">
        <div className="surface-card rounded-2xl p-6 sm:p-8">
          <p className="section-kicker">Admin Session</p>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Field label="Gateway Base URL">
              <input value={settings.baseUrl} onChange={(event) => setSettings((current) => ({ ...current, baseUrl: event.target.value }))} className={fieldClassName} />
            </Field>
            <Field label="Admin API Key">
              <input type="password" value={settings.adminKey} onChange={(event) => setSettings((current) => ({ ...current, adminKey: event.target.value }))} className={fieldClassName} />
            </Field>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => void saveSession()} className={primaryButtonClassName}>Save & Check</button>
            <button type="button" onClick={clearSession} className={ghostButtonClassName}>Clear</button>
          </div>
          <p className="mt-4 text-sm text-[var(--muted)]">{sessionStatus}</p>
        </div>
      </RevealSection>

      <RevealList className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-4">
        <RevealItem>
          <section className="surface-card rounded-2xl p-6">
            <p className="section-kicker">Create Key</p>
            <div className="mt-6 space-y-4">
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
              <button type="button" onClick={() => navigator.clipboard.writeText(latestKey)} className={ghostButtonClassName} disabled={latestKey === "No key generated yet."}>Copy Latest</button>
            </div>
            <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="section-kicker">New Key</p>
              <p className="mt-3 break-all font-mono text-xs text-[var(--foreground)]/75">{latestKey}</p>
            </div>
          </section>
        </RevealItem>

        <RevealItem>
          <section className="surface-card rounded-2xl p-6">
            <p className="section-kicker">List Keys</p>
            <div className="mt-6 space-y-4">
              <Field label="Tenant Name">
                <select value={listTenant} onChange={(event) => setListTenant(event.target.value)} className={fieldClassName}>
                  <option value="">{tenants.length ? "Select tenant" : "No tenants loaded"}</option>
                  {tenants.map((tenant) => (
                    <option key={tenant} value={tenant}>{tenant}</option>
                  ))}
                </select>
              </Field>
              <button type="button" onClick={() => void loadTenantKeys()} className={ghostButtonClassName}>Load Keys</button>
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
          </section>
        </RevealItem>

        <RevealItem>
          <section className="surface-card rounded-2xl p-6">
            <p className="section-kicker">Import Key</p>
            <div className="mt-6 space-y-4">
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
          </section>
        </RevealItem>

        <RevealItem>
          <section className="surface-card rounded-2xl p-6">
            <p className="section-kicker">Revoke Key</p>
            <div className="mt-6 space-y-4">
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
          </section>
        </RevealItem>
      </RevealList>

      <RevealSection className="section-divider pb-10">
        <div className="pt-12 sm:pt-16">
          <h2 className="section-title text-white">Stored Keys</h2>
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
