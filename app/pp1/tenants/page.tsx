"use client";

import { useEffect, useState } from "react";
import { RevealItem, RevealList, RevealSection } from "@/components/Reveal";
import { apiFetch } from "@/lib/gateway/client";
import { defaultBaseUrl, getAdminSettings, saveAdminSettings } from "@/lib/gateway/storage";
import type { AdminSettings, Tenant, UsageStats } from "@/lib/gateway/types";

type TenantApi = {
  tenant: string;
  tier: string;
  created_at?: string;
  token_limit_per_day?: number | null;
  spend_limit_per_day_usd?: number | null;
};

type TenantKey = {
  name: string;
  active: boolean;
  created_at?: string;
  last_used_at?: string;
  revoked_at?: string;
  revoked_reason?: string;
  key_last6?: string;
};

export default function PP1TenantsPage() {
  const [settings, setSettings] = useState<AdminSettings>(
    () => getAdminSettings() ?? { baseUrl: defaultBaseUrl(), adminKey: "" },
  );
  const [sessionStatus, setSessionStatus] = useState("Provide an admin session to access tenant inventory.");
  const [tenantName, setTenantName] = useState("");
  const [tenantTier, setTenantTier] = useState("free");
  const [tenantStatus, setTenantStatus] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsStatus, setTenantsStatus] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [keys, setKeys] = useState<TenantKey[]>([]);
  const [detailStatus, setDetailStatus] = useState("");
  const [tokenLimit, setTokenLimit] = useState("");
  const [spendLimit, setSpendLimit] = useState("");
  const [limitsStatus, setLimitsStatus] = useState("");

  useEffect(() => {
    void (async () => {
      const saved = getAdminSettings();
      if (saved) {
        try {
          const result = await apiFetch<{ tenants?: TenantApi[] }>(
            "/v1/admin/tenants",
            { method: "GET" },
            saved,
          );
          const mapped = (result.tenants || []).map<Tenant>((tenant) => ({
            name: tenant.tenant,
            tier: tenant.tier,
            createdAt: tenant.created_at,
            tokenLimitPerDay: tenant.token_limit_per_day,
            spendLimitPerDayUsd: tenant.spend_limit_per_day_usd,
          }));
          setTenants(mapped);
          setTenantsStatus("Tenants loaded.");
        } catch (error) {
          setTenants([]);
          setTenantsStatus(error instanceof Error ? error.message : "Failed to load tenants.");
        }
      }
    })();
  }, []);

  async function loadTenants(current = settings) {
    try {
      const result = await apiFetch<{ tenants?: TenantApi[] }>(
        "/v1/admin/tenants",
        { method: "GET" },
        current,
      );
      const mapped = (result.tenants || []).map<Tenant>((tenant) => ({
        name: tenant.tenant,
        tier: tenant.tier,
        createdAt: tenant.created_at,
        tokenLimitPerDay: tenant.token_limit_per_day,
        spendLimitPerDayUsd: tenant.spend_limit_per_day_usd,
      }));
      setTenants(mapped);
      setSelectedTenant(null);
      setTenantsStatus("Tenants loaded.");
    } catch (error) {
      setTenants([]);
      setTenantsStatus(error instanceof Error ? error.message : "Failed to load tenants.");
    }
  }

  async function saveSession() {
    saveAdminSettings(settings);
    setSessionStatus("Admin session saved.");
    await loadTenants(settings);
  }

  async function createTenant() {
    if (!tenantName.trim()) {
      setTenantStatus("Tenant name is required.");
      return;
    }
    try {
      const result = await apiFetch<{ tenant: string; tier: string }>(
        "/v1/admin/tenants",
        {
          method: "POST",
          body: JSON.stringify({
            tenant: tenantName.trim(),
            tier: tenantTier.trim() || null,
          }),
        },
        settings,
      );
      setTenantStatus(`Tenant ${result.tenant} created (${result.tier}).`);
      await loadTenants();
    } catch (error) {
      setTenantStatus(error instanceof Error ? error.message : "Failed to create tenant.");
    }
  }

  async function fetchUsage() {
    if (!selectedTenant) {
      setDetailStatus("Select a tenant first.");
      return;
    }
    try {
      const result = await apiFetch<UsageStats>(
        `/v1/admin/usage/${encodeURIComponent(selectedTenant.name)}`,
        { method: "GET" },
        settings,
      );
      setUsage(result);
      setDetailStatus("Usage loaded.");
    } catch (error) {
      setDetailStatus(error instanceof Error ? error.message : "Failed to load usage.");
    }
  }

  async function fetchKeys() {
    if (!selectedTenant) {
      setDetailStatus("Select a tenant first.");
      return;
    }
    try {
      const result = await apiFetch<{ keys?: TenantKey[] }>(
        `/v1/admin/tenants/${encodeURIComponent(selectedTenant.name)}/keys`,
        { method: "GET" },
        settings,
      );
      setKeys(result.keys || []);
      setDetailStatus("Keys loaded.");
    } catch (error) {
      setKeys([]);
      setDetailStatus(error instanceof Error ? error.message : "Failed to load keys.");
    }
  }

  async function setLimits() {
    if (!selectedTenant) {
      setLimitsStatus("Select a tenant first.");
      return;
    }
    try {
      await apiFetch(
        "/v1/admin/limits",
        {
          method: "POST",
          body: JSON.stringify({
            tenant: selectedTenant.name,
            token_limit_per_day: tokenLimit ? Number(tokenLimit) : null,
            spend_limit_per_day_usd: spendLimit ? Number(spendLimit) : null,
          }),
        },
        settings,
      );
      setLimitsStatus("Limits updated.");
    } catch (error) {
      setLimitsStatus(error instanceof Error ? error.message : "Failed to update limits.");
    }
  }

  function selectTenant(tenant: Tenant) {
    setSelectedTenant(tenant);
    setUsage(null);
    setKeys([]);
    setTokenLimit(tenant.tokenLimitPerDay ? String(tenant.tokenLimitPerDay) : "");
    setSpendLimit(tenant.spendLimitPerDayUsd ? String(tenant.spendLimitPerDayUsd) : "");
    setDetailStatus("");
    setLimitsStatus("");
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-16 pt-10 sm:px-8 lg:px-12">
      <RevealSection className="pb-20">
        <div className="surface-card rounded-2xl p-8 sm:p-10">
          <p className="section-kicker">Tenant Observability</p>
          <h1 className="mt-4 font-display text-4xl text-white">Inventory and usage drilldown.</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
            Create tenants, inspect their limits, fetch usage, and drill into key inventory from a
            single operational surface.
          </p>
        </div>
      </RevealSection>

      <RevealList className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <RevealItem>
          <section className="surface-card rounded-2xl p-6 sm:p-8">
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
              <button type="button" onClick={() => void loadTenants()} className={ghostButtonClassName}>Refresh Tenants</button>
            </div>
            <p className="mt-4 text-sm text-[var(--muted)]">{sessionStatus}</p>
          </section>
        </RevealItem>

        <RevealItem>
          <section className="surface-card rounded-2xl p-6 sm:p-8">
            <p className="section-kicker">Create Tenant</p>
            <div className="mt-6 space-y-4">
              <Field label="Tenant Name">
                <input value={tenantName} onChange={(event) => setTenantName(event.target.value)} placeholder="acme-labs" className={fieldClassName} />
              </Field>
              <Field label="Tier">
                <select value={tenantTier} onChange={(event) => setTenantTier(event.target.value)} className={fieldClassName}>
                  <option value="free">free</option>
                  <option value="pro">pro</option>
                  <option value="enterprise">enterprise</option>
                </select>
              </Field>
            </div>
            <div className="mt-6">
              <button type="button" onClick={() => void createTenant()} className={primaryButtonClassName}>Create Tenant</button>
            </div>
            <p className="mt-4 text-sm text-[var(--muted)]">{tenantStatus}</p>
          </section>
        </RevealItem>
      </RevealList>

      <RevealSection className="section-divider pb-10">
        <div className="grid gap-6 pt-12 sm:pt-16 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <div className="surface-card rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="section-title text-white">Tenants</h2>
              <button type="button" onClick={() => void loadTenants()} className={ghostButtonClassName}>Refresh</button>
            </div>
            <p className="mt-4 text-sm text-[var(--muted)]">{tenantsStatus}</p>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-[var(--foreground)]/78">
                <thead className="border-b border-white/8 text-[var(--muted)]">
                  <tr>
                    <th className="px-3 py-3 font-medium">Tenant</th>
                    <th className="px-3 py-3 font-medium">Tier</th>
                    <th className="px-3 py-3 font-medium">Token Limit</th>
                    <th className="px-3 py-3 font-medium">Spend Limit</th>
                    <th className="px-3 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.length ? tenants.map((tenant) => (
                    <tr
                      key={tenant.name}
                      onClick={() => selectTenant(tenant)}
                      className={`cursor-pointer border-b border-white/6 transition-colors ${
                        selectedTenant?.name === tenant.name ? "bg-[var(--accent-soft)]" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <td className="px-3 py-3">{tenant.name}</td>
                      <td className="px-3 py-3">{tenant.tier}</td>
                      <td className="px-3 py-3">{tenant.tokenLimitPerDay ?? "--"}</td>
                      <td className="px-3 py-3">{tenant.spendLimitPerDayUsd ?? "--"}</td>
                      <td className="px-3 py-3">{tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : "--"}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-[var(--muted)]">No tenants found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="surface-card rounded-2xl p-6 sm:p-8">
            <p className="section-kicker">Tenant Detail</p>
            <h3 className="mt-4 font-display text-3xl text-white">
              {selectedTenant?.name || "No tenant selected"}
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Tier: {selectedTenant?.tier || "--"} | Created: {selectedTenant?.createdAt ? new Date(selectedTenant.createdAt).toLocaleString() : "--"}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => void fetchUsage()} className={ghostButtonClassName}>Fetch Usage</button>
              <button type="button" onClick={() => void fetchKeys()} className={ghostButtonClassName}>Load Keys</button>
            </div>
            <p className="mt-4 text-sm text-[var(--muted)]">{detailStatus}</p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <StatCard label="Requests" value={usage ? String(usage.requests) : "--"} />
              <StatCard label="Tokens" value={usage ? String(usage.tokens) : "--"} />
              <StatCard label="Spend (USD)" value={usage ? Number(usage.cost_usd || 0).toFixed(4) : "--"} />
            </div>

            <div className="mt-6 space-y-3">
              {keys.length ? keys.map((key) => (
                <div key={key.name} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="font-semibold text-white">{key.name}</p>
                    <span className={`rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${
                      key.active
                        ? "border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "border-white/10 bg-white/[0.05] text-[var(--muted)]"
                    }`}>
                      {key.active ? "active" : "revoked"}
                    </span>
                  </div>
                  <p className="mt-3 font-mono text-xs text-[var(--foreground)]/62">hash ****{key.key_last6 || "------"}</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">last used: {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : "never"}</p>
                </div>
              )) : <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-[var(--muted)]">No tenant keys loaded.</div>}
            </div>

            <div className="mt-8 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
              <p className="section-kicker">Set Limits</p>
              <div className="mt-4 space-y-4">
                <Field label="Token Limit / Day">
                  <input type="number" min={1} value={tokenLimit} onChange={(event) => setTokenLimit(event.target.value)} className={fieldClassName} />
                </Field>
                <Field label="Spend Limit / Day (USD)">
                  <input type="number" min={0} step="0.01" value={spendLimit} onChange={(event) => setSpendLimit(event.target.value)} className={fieldClassName} />
                </Field>
              </div>
              <div className="mt-6">
                <button type="button" onClick={() => void setLimits()} className={ghostButtonClassName}>Apply Limits</button>
              </div>
              <p className="mt-4 text-sm text-[var(--muted)]">{limitsStatus}</p>
            </div>
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
      <p className="section-kicker">{label}</p>
      <p className="mt-3 font-display text-2xl text-white">{value}</p>
    </div>
  );
}

const fieldClassName =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition-colors focus:border-[var(--accent)]/40";
const primaryButtonClassName =
  "rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-5 py-3 text-sm font-semibold text-white";
const ghostButtonClassName =
  "rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-[var(--foreground)]/80";
