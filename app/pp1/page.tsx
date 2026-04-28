"use client";

import Link from "next/link";
import { type ChangeEvent, useMemo, useState } from "react";
import { RevealItem, RevealList, RevealSection } from "@/components/Reveal";
import { clearAdminSettings, defaultBaseUrl, getAdminSettings, saveAdminSettings } from "@/lib/gateway/storage";
import { healthFetch } from "@/lib/gateway/client";
import type { AdminSettings } from "@/lib/gateway/types";

type HealthState = "idle" | "checking" | "ok" | "error";

const DEMO_ADMIN_KEY = process.env.NEXT_PUBLIC_DEMO_ADMIN_KEY ?? "";
const DEMO_BASE_URL = process.env.NEXT_PUBLIC_DEMO_BASE_URL ?? "";

const dashboardLinks = [
  {
    href: "/pp1/chat",
    title: "Chat Playground",
    detail: "Validate tenant routing, cache, and RAG headers.",
  },
  {
    href: "/pp1/keys",
    title: "Key Management",
    detail: "Create, import, list, and revoke tenant keys.",
  },
  {
    href: "/pp1/tenants",
    title: "Tenant Explorer",
    detail: "Browse tenants, usage, limits, and key inventory.",
  },
  {
    href: "/pp1/admin",
    title: "Admin Controls",
    detail: "RAG settings, ingest, evals, audit log, and rotation.",
  },
] as const;

const healthTargets = [
  { label: "API", path: "/health" },
  { label: "Grafana", path: "/health/grafana" },
  { label: "Prometheus", path: "/health/prometheus" },
  { label: "Ollama", path: "/health/ollama" },
] as const;

function toneClass(state: HealthState) {
  if (state === "ok") {
    return "border-[var(--accent)]/30 bg-[var(--accent-soft)] text-white";
  }
  if (state === "error") {
    return "border-red-500/30 bg-red-500/10 text-red-200";
  }
  if (state === "checking") {
    return "border-white/12 bg-white/[0.05] text-white";
  }
  return "border-white/8 bg-white/[0.03] text-[var(--muted)]";
}

export default function PP1DashboardPage() {
  const [settings, setSettings] = useState<AdminSettings>(
    () =>
      getAdminSettings() ?? {
        baseUrl: defaultBaseUrl(),
        adminKey: "",
      },
  );
  const [status, setStatus] = useState("Local session only.");
  const [keyCopied, setKeyCopied] = useState(false);
  const [health, setHealth] = useState<Record<string, HealthState>>({
    API: "idle",
    Grafana: "idle",
    Prometheus: "idle",
    Ollama: "idle",
  });

  const baseUrl = useMemo(() => settings.baseUrl.trim().replace(/\/$/, ""), [settings.baseUrl]);

  async function runHealthChecks(current: AdminSettings) {
    const trimmed = current.baseUrl.trim().replace(/\/$/, "");
    if (!trimmed) {
      setHealth({
        API: "idle",
        Grafana: "idle",
        Prometheus: "idle",
        Ollama: "idle",
      });
      setStatus("Add a base URL to run health checks.");
      return;
    }

    setHealth({
      API: "checking",
      Grafana: "checking",
      Prometheus: "checking",
      Ollama: "checking",
    });
    setStatus("Checking gateway surfaces...");

    const results = await Promise.all(
      healthTargets.map(async (target) => ({
        label: target.label,
        state: await healthFetch(`${trimmed}${target.path}`),
      })),
    );

    setHealth(
      results.reduce<Record<string, HealthState>>((acc, item) => {
        acc[item.label] = item.state;
        return acc;
      }, {}),
    );

    setStatus("Health checks refreshed.");
  }

  function handleFieldChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setSettings((current) => ({ ...current, [name]: value }));
  }

  function handleSave() {
    saveAdminSettings(settings);
    setStatus("Gateway session saved.");
    void runHealthChecks(settings);
  }

  function handleClear() {
    clearAdminSettings();
    setSettings({ baseUrl: defaultBaseUrl(), adminKey: "" });
    setHealth({
      API: "idle",
      Grafana: "idle",
      Prometheus: "idle",
      Ollama: "idle",
    });
    setStatus("Gateway session cleared.");
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-16 pt-10 sm:px-8 lg:px-12">
      <RevealSection className="pb-20">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="surface-card rounded-xl p-6 sm:p-8">
            <p className="section-kicker">PP1 Console</p>
            <h1 className="mt-4 font-display text-4xl text-white sm:text-5xl">
              LLM Gateway frontend, migrated into the site shell.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--foreground)]/78">
              Control plane for tenant isolation, API key hygiene, retrieval settings, evals, and
              live prompt verification. Teal stays local to this route tree.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {dashboardLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg border border-white/8 bg-white/[0.03] p-4 transition-colors hover:border-[var(--accent)]/30 hover:bg-[var(--accent-soft)]"
                >
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.detail}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="surface-card rounded-xl p-6 sm:p-8">
            <p className="section-kicker">Session</p>
            <h2 className="mt-4 font-display text-3xl text-white">Gateway settings</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              Stored locally in your browser. The admin key unlocks the downstream pages.
            </p>
            {DEMO_ADMIN_KEY && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] px-4 py-3">
                <p className="text-sm text-[var(--muted)]">Demo credentials available —</p>
                <button
                  type="button"
                  onClick={() => {
                    const newSettings = {
                      baseUrl: DEMO_BASE_URL || settings.baseUrl,
                      adminKey: DEMO_ADMIN_KEY,
                    };
                    void navigator.clipboard.writeText(DEMO_ADMIN_KEY);
                    setSettings(newSettings);
                    saveAdminSettings(newSettings);
                    void runHealthChecks(newSettings);
                    setKeyCopied(true);
                    setTimeout(() => setKeyCopied(false), 2000);
                  }}
                  className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-4 py-1.5 text-sm font-semibold text-[var(--accent)]"
                >
                  {keyCopied ? "Copied!" : "Copy admin key"}
                </button>
              </div>
            )}
            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">Base URL</span>
                <input
                  name="baseUrl"
                  value={settings.baseUrl}
                  onChange={handleFieldChange}
                  placeholder="http://localhost:8000"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition-colors focus:border-[var(--accent)]/40"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">Admin API Key</span>
                <input
                  name="adminKey"
                  type="password"
                  value={settings.adminKey}
                  onChange={handleFieldChange}
                  placeholder="sk-admin-..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition-colors focus:border-[var(--accent)]/40"
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-5 py-3 text-sm font-semibold text-white"
                >
                  Save & Check
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-[var(--foreground)]/80"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => void runHealthChecks(settings)}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-[var(--foreground)]/80"
                >
                  Refresh Health
                </button>
              </div>
              <p className="text-sm text-[var(--muted)]">{status}</p>
              <p className="font-mono text-xs text-[var(--foreground)]/55">
                {baseUrl || "No base URL configured"}
              </p>
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="section-divider pb-10">
        <div className="pt-12 sm:pt-16">
          <p className="section-kicker">Quick Start</p>
          <h2 className="mt-4 section-title text-white">Getting started.</h2>
          <p className="mt-4 text-base leading-8 text-[var(--muted)]">
            Follow these steps in order to go from zero to a live request.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="flex gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] font-mono text-sm font-semibold text-[var(--accent)]">1</div>
              <div>
                <p className="font-semibold text-white">Get your admin API key</p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  Use the <strong className="text-white">Copy admin key</strong> button in the Session form — it pre-fills both the URL and key for you. If that button is not visible, the demo credentials are not configured.
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] font-mono text-sm font-semibold text-[var(--accent)]">2</div>
              <div>
                <p className="font-semibold text-white">Create a tenant</p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">Go to <Link href="/pp1/tenants" className="inline-flex items-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent)]">Tenants</Link>, enter a name (e.g. <code className="rounded bg-white/10 px-1 font-mono text-xs">acme-labs</code>) and select a tier, then click <strong className="text-white">Create Tenant</strong>. Tenants are isolated namespaces — each gets its own keys, quotas, and usage tracking.</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] font-mono text-sm font-semibold text-[var(--accent)]">3</div>
              <div>
                <p className="font-semibold text-white">Generate a key</p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">Go to <Link href="/pp1/keys" className="inline-flex items-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent)]">Keys</Link>, select your tenant, enter a key name (e.g. <code className="rounded bg-white/10 px-1 font-mono text-xs">prod-default</code>), click <strong className="text-white">Generate Key</strong>, and copy it immediately — it is only shown once and cannot be recovered.</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] font-mono text-sm font-semibold text-[var(--accent)]">4</div>
              <div>
                <p className="font-semibold text-white">Send a prompt</p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">Go to <Link href="/pp1/chat" className="inline-flex items-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent)]">Chat</Link>, click <strong className="text-white">Fetch Tenants</strong>, select your tenant and key, type a prompt, and click <strong className="text-white">Send</strong>. The response panel shows the message thread and the RAG Inspector shows routing headers.</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] font-mono text-sm font-semibold text-[var(--accent)]">5</div>
              <div>
                <p className="font-semibold text-white">Set tenant limits</p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">In <Link href="/pp1/tenants" className="inline-flex items-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent)]">Tenants</Link>, click a row to select a tenant, then use <strong className="text-white">Set Limits</strong> to enforce a daily token budget and spend cap (USD). Leave blank for unlimited.</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] font-mono text-sm font-semibold text-[var(--accent)]">6</div>
              <div>
                <p className="font-semibold text-white">Explore Admin controls</p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">Go to <Link href="/pp1/admin" className="inline-flex items-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent)]">Admin</Link> for RAG settings (toggle on/off, top-K, reranking), document ingestion into the vector store, the offline eval runner, the audit log, and admin key rotation.</p>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="section-divider pb-10">
        <div className="pt-12 sm:pt-16">
          <div className="mb-10">
            <h2 className="section-title text-white">Health Surface</h2>
          </div>
          <RevealList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {healthTargets.map((target) => (
              <RevealItem key={target.label}>
                <div className={`rounded-xl border p-5 ${toneClass(health[target.label] || "idle")}`}>
                  <p className="section-kicker">{target.label}</p>
                  <p className="mt-4 font-display text-3xl capitalize">
                    {health[target.label] || "idle"}
                  </p>
                  <p className="mt-3 font-mono text-xs text-[var(--foreground)]/58">{target.path}</p>
                </div>
              </RevealItem>
            ))}
          </RevealList>
        </div>
      </RevealSection>
    </div>
  );
}
