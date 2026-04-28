"use client";

import Link from "next/link";
import { type ChangeEvent, useMemo, useState } from "react";
import { HoverCard, RevealItem, RevealList, RevealSection } from "@/components/Reveal";
import { clearAdminSettings, defaultBaseUrl, getAdminSettings, saveAdminSettings } from "@/lib/gateway/storage";
import { healthFetch } from "@/lib/gateway/client";
import type { AdminSettings } from "@/lib/gateway/types";

type HealthState = "idle" | "checking" | "ok" | "error";

const DEMO_ADMIN_KEY = process.env.NEXT_PUBLIC_DEMO_ADMIN_KEY ?? "";
const DEMO_BASE_URL = process.env.NEXT_PUBLIC_DEMO_BASE_URL ?? "";

const healthTargets = [
  { label: "API", path: "/health" },
  { label: "Grafana", path: "/health/grafana" },
  { label: "Prometheus", path: "/health/prometheus" },
  { label: "Ollama", path: "/health/ollama" },
] as const;

const repoTabs = ["App", "Files", "README", "Community"] as const;
const capabilityChips = ["Multi-tenant controls", "Model gateway", "FastAPI", "Ollama", "Prometheus", "Grafana", "Docker", "Operator tooling"] as const;
const capabilityPoints = [
  "Tenant-scoped access, quotas, and workspace isolation.",
  "FastAPI gateway in front of local or hosted models.",
  "End-to-end observability with health checks and metrics.",
  "Admin surfaces for testing, inspection, and operational control.",
] as const;
const showcaseSteps = [
  {
    number: "01",
    title: "Load demo access",
    description:
      "Use the session panel to load the preconfigured local credentials and initialize the gateway session.",
  },
  {
    number: "02",
    title: "Save and check",
    description:
      "Confirm the base URL and admin key, then run the health checks to verify the stack is reachable.",
  },
  {
    number: "03",
    title: "Create a tenant",
    description:
      "Open /pp1/tenants and create a workspace that will own requests, limits, and access policies.",
  },
  {
    number: "04",
    title: "Generate a key",
    description:
      "Create a tenant-scoped key in /pp1/keys and copy the secret when it is shown.",
  },
  {
    number: "05",
    title: "Send a request",
    description:
      "Use /pp1/chat to run a prompt through the gateway and confirm the request completes end to end.",
  },
  {
    number: "06",
    title: "Inspect the system",
    description:
      "Review the status panel and admin surfaces to validate visibility, isolation, and operator controls.",
  },
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

function healthLabel(state: HealthState) {
  if (state === "ok") {
    return "Online";
  }
  if (state === "error") {
    return "Unavailable";
  }
  if (state === "checking") {
    return "Checking";
  }
  return "Idle";
}

function healthDotClass(state: HealthState) {
  if (state === "ok") {
    return "bg-[var(--accent)] shadow-[0_0_14px_var(--accent-glow)]";
  }
  if (state === "error") {
    return "bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.28)]";
  }
  if (state === "checking") {
    return "bg-white/70";
  }
  return "bg-white/25";
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
  const hasAdminKey = settings.adminKey.trim().length > 0;
  const sessionReady = Boolean(baseUrl && hasAdminKey);

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
      <RevealSection className="pb-10">
        <div>
          <div className="border-b border-white/8 pb-16">
            <div className="grid gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-start">
              <div>
                <p className="font-mono text-sm text-[var(--muted)]">
                  <span>pp1</span>
                  <span className="mx-1 text-white/20">/</span>
                  <span className="text-white">llm-gateway</span>
                </p>
                <h1 className="font-display mt-5 max-w-3xl text-4xl font-normal text-white sm:text-5xl lg:text-6xl">
                  LLM Gateway
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
                  Multi-tenant model gateway with observability and operator controls.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {capabilityChips.map((chip) => (
                    <span
                      key={chip}
                      className="font-mono text-[11px] rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2.5 py-1 text-[var(--accent)]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/pp1/chat"
                    className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                  >
                    Launch chat
                  </Link>
                  <Link
                    href="/#projects"
                    className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm text-[var(--foreground)]/80 transition-colors hover:border-white/20 hover:text-white"
                  >
                    Back to Portfolio
                  </Link>
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                  Why this is interesting
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
                  {capabilityPoints.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-6 py-8">
              <div>
                <p className="section-kicker">AI infrastructure portfolio project</p>
                <h2 className="section-title mt-4 text-white">
                  Multi-tenant LLM gateway with observability and operator controls
                </h2>
              </div>

              <HoverCard className="overflow-hidden rounded-[1.1rem] border border-white/8 bg-white/[0.025]">
                <div className="px-5 py-6 lg:px-7">
                  <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--foreground)]/78">
                    Self-hosted model gateway focused on tenant isolation, operational visibility, and production-style
                    control over AI requests.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {capabilityChips.map((chip) => (
                      <span
                        key={chip}
                        className="font-mono text-[11px] rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2.5 py-1 text-[var(--accent)]"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                      href="/pp1/chat"
                      className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[var(--accent)] hover:bg-[rgba(32,201,151,0.2)]"
                    >
                      Launch chat
                    </Link>
                    <Link
                      href="/pp1/admin"
                      className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-[var(--foreground)]/80 transition-colors hover:border-white/20 hover:text-white"
                    >
                      Open admin
                    </Link>
                  </div>
                </div>
              </HoverCard>

              <div>
                <p className="section-kicker">README.md</p>
                <h2 className="section-title mt-4 text-white">How to use it</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  Follow the full gateway flow from session setup to tenant testing and system inspection.
                </p>
              </div>

              <div className="rounded-[1.1rem] border border-white/8 bg-white/[0.025]">
                <div className="px-5 py-6 sm:px-7">
                  <RevealList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {showcaseSteps.map((step) => (
                      <RevealItem key={step.number}>
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                          <p className="font-mono text-xs text-[var(--accent)]">{step.number}</p>
                          <p className="mt-3 font-semibold text-white">{step.title}</p>
                          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{step.description}</p>
                        </div>
                      </RevealItem>
                    ))}
                  </RevealList>
                </div>
              </div>

            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="section-kicker">Session</p>
                  <h3 className="section-title mt-2 text-white">Gateway settings</h3>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    sessionReady
                      ? "border border-[var(--accent)]/25 bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border border-white/10 bg-white/[0.04] text-[var(--muted)]"
                  }`}
                >
                  {sessionReady ? "Configured" : "Needs setup"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Configure the local session used to test and inspect the gateway.
              </p>
            </div>

            <div className="overflow-hidden rounded-[1.1rem] border border-white/8 bg-white/[0.025]">
                <div className="space-y-4 px-5 py-5">
                  {DEMO_ADMIN_KEY && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--accent)]/18 bg-[linear-gradient(180deg,rgba(32,201,151,0.14),rgba(32,201,151,0.08))] p-4">
                      <div>
                        <p className="text-sm font-medium text-white">Demo access</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                          Load a preconfigured session for the local demo.
                        </p>
                      </div>
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
                        className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent)]"
                      >
                        {keyCopied ? "Loaded" : "Load demo access"}
                      </button>
                    </div>
                  )}

                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="grid gap-4">
                      <label className="block">
                        <span className="mb-2 block text-sm text-[var(--muted)]">Base URL</span>
                        <input
                          name="baseUrl"
                          value={settings.baseUrl}
                          onChange={handleFieldChange}
                          placeholder="http://localhost:8000"
                          className="w-full rounded-xl border border-white/10 bg-[#0e1318] px-4 py-3 text-white outline-none transition-colors focus:border-[var(--accent)]/40"
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
                          className="w-full rounded-xl border border-white/10 bg-[#0e1318] px-4 py-3 text-white outline-none transition-colors focus:border-[var(--accent)]/40"
                        />
                      </label>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/8 bg-[#0e1318] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                          Endpoint
                        </p>
                        <p className="mt-2 truncate font-mono text-xs text-[var(--foreground)]/72">
                          {baseUrl || "Not configured"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-[#0e1318] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                          Admin key
                        </p>
                        <p className="mt-2 text-xs text-[var(--foreground)]/72">
                          {hasAdminKey ? "Loaded in current session" : "Missing"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleSave}
                        className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-5 py-3 text-sm font-semibold text-white"
                      >
                        Save and check
                      </button>
                      <button
                        type="button"
                        onClick={() => void runHealthChecks(settings)}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-[var(--foreground)]/80"
                      >
                        Refresh health
                      </button>
                      <button
                        type="button"
                        onClick={handleClear}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-[var(--foreground)]/80"
                      >
                        Clear session
                      </button>
                    </div>
                    <div className="mt-4 rounded-xl border border-white/8 bg-[#0e1318] p-4">
                      <p className="text-sm text-[var(--muted)]">{status}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="section-kicker">System status</p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  Health signals for the gateway stack tied to the current session.
                </p>
              </div>

              <div className="rounded-[1.1rem] border border-white/8 bg-white/[0.025] p-5">
                <RevealList className="grid gap-3">
                  {healthTargets.map((target) => (
                    <RevealItem key={target.label}>
                      <div className={`rounded-xl border px-4 py-3 ${toneClass(health[target.label] || "idle")}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className={`h-2.5 w-2.5 shrink-0 rounded-full ${healthDotClass(
                                health[target.label] || "idle",
                              )}`}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white">{target.label}</p>
                              <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--foreground)]/50">
                                {target.path}
                              </p>
                            </div>
                          </div>
                          <p className="shrink-0 text-xs font-medium text-[var(--foreground)]/72">
                            {healthLabel(health[target.label] || "idle")}
                          </p>
                        </div>
                      </div>
                    </RevealItem>
                  ))}
                </RevealList>
              </div>
          </div>
        </div>
      </RevealSection>
    </div>
  );
}
