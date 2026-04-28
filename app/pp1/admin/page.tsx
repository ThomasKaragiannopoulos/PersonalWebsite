"use client";

import { useEffect, useState } from "react";
import { RevealItem, RevealList, RevealSection } from "@/components/Reveal";
import { apiFetch } from "@/lib/gateway/client";
import { defaultBaseUrl, getAdminSettings, saveAdminSettings } from "@/lib/gateway/storage";
import type { AdminSettings, AuditAction, RAGSettings } from "@/lib/gateway/types";

type TenantOption = { tenant: string; tier: string };

export default function PP1AdminPage() {
  const [settings, setSettings] = useState<AdminSettings>(
    () => getAdminSettings() ?? { baseUrl: defaultBaseUrl(), adminKey: "" },
  );
  const [sessionStatus, setSessionStatus] = useState("Use the admin key to unlock privileged controls.");
  const [rotatedKey, setRotatedKey] = useState("No rotation yet.");
  const [ragSettings, setRagSettings] = useState<RAGSettings>({
    enabled: true,
    top_k: 4,
    max_context_chars: 4000,
    rerank: true,
  });
  const [ragStatus, setRagStatus] = useState("");
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const [ingestTenant, setIngestTenant] = useState("default");
  const [ingestSource, setIngestSource] = useState("ui");
  const [ingestSourceId, setIngestSourceId] = useState("");
  const [ingestTitle, setIngestTitle] = useState("");
  const [ingestChunkSize, setIngestChunkSize] = useState("1000");
  const [ingestOverlap, setIngestOverlap] = useState("200");
  const [ingestContent, setIngestContent] = useState("");
  const [ingestStatus, setIngestStatus] = useState("");
  const [evalDataset, setEvalDataset] = useState("evals/dataset.jsonl");
  const [evalMinAccuracy, setEvalMinAccuracy] = useState("0.6");
  const [evalMaxP95, setEvalMaxP95] = useState("2000");
  const [evalMaxCost, setEvalMaxCost] = useState("0.01");
  const [evalStatus, setEvalStatus] = useState("");
  const [evalOutput, setEvalOutput] = useState("");
  const [auditActions, setAuditActions] = useState<AuditAction[]>([]);
  const [auditStatus, setAuditStatus] = useState("");

  useEffect(() => {
    void (async () => {
      const saved = getAdminSettings();
      if (saved) {
        try {
          const [tenantResult, ragResult] = await Promise.all([
            apiFetch<{ tenants?: TenantOption[] }>("/v1/admin/tenants", { method: "GET" }, saved),
            apiFetch<RAGSettings>("/v1/admin/rag/settings", { method: "GET" }, saved),
          ]);

          const options = tenantResult.tenants || [];
          setTenantOptions(options);
          setIngestTenant(options[0]?.tenant || "default");
          setRagSettings(ragResult);
          setRagStatus("RAG settings loaded.");
        } catch (error) {
          setRagStatus(error instanceof Error ? error.message : "Failed to load RAG settings.");
          setTenantOptions([]);
          setIngestTenant("default");
        }
      }
    })();
  }, []);

  async function saveSession() {
    saveAdminSettings(settings);
    setSessionStatus("Admin session saved.");
    await Promise.all([loadTenantOptions(settings), loadRagSettings(settings)]);
  }

  async function rotateAdminKey() {
    try {
      const result = await apiFetch<{ admin_api_key: string }>(
        "/v1/admin/keys/rotate",
        { method: "POST" },
        settings,
      );
      const next = { ...settings, adminKey: result.admin_api_key };
      saveAdminSettings(next);
      setSettings(next);
      setRotatedKey(result.admin_api_key);
      setSessionStatus("Admin key rotated. Update ADMIN_API_KEY and restart to persist.");
    } catch (error) {
      setSessionStatus(error instanceof Error ? error.message : "Failed to rotate admin key.");
    }
  }

  async function loadTenantOptions(current = settings) {
    try {
      const result = await apiFetch<{ tenants?: TenantOption[] }>(
        "/v1/admin/tenants",
        { method: "GET" },
        current,
      );
      const options = result.tenants || [];
      setTenantOptions(options);
      setIngestTenant(options[0]?.tenant || "default");
    } catch {
      setTenantOptions([]);
      setIngestTenant("default");
    }
  }

  async function loadRagSettings(current = settings) {
    try {
      const result = await apiFetch<RAGSettings>("/v1/admin/rag/settings", { method: "GET" }, current);
      setRagSettings(result);
      setRagStatus("RAG settings loaded.");
    } catch (error) {
      setRagStatus(error instanceof Error ? error.message : "Failed to load RAG settings.");
    }
  }

  async function saveRagSettings() {
    try {
      const result = await apiFetch<RAGSettings>(
        "/v1/admin/rag/settings",
        {
          method: "POST",
          body: JSON.stringify(ragSettings),
        },
        settings,
      );
      setRagSettings(result);
      setRagStatus(`RAG settings updated (enabled: ${result.enabled}).`);
    } catch (error) {
      setRagStatus(error instanceof Error ? error.message : "Failed to save RAG settings.");
    }
  }

  async function ingestDocument() {
    if (!ingestContent.trim()) {
      setIngestStatus("Content is required.");
      return;
    }
    try {
      const result = await apiFetch<{ chunks: number; document_id: string }>(
        "/v1/admin/rag/ingest",
        {
          method: "POST",
          body: JSON.stringify({
            tenant: ingestTenant || "default",
            source: ingestSource || "ui",
            source_id: ingestSourceId || null,
            title: ingestTitle || null,
            content: ingestContent,
            chunk_size: Number(ingestChunkSize || 1000),
            overlap: Number(ingestOverlap || 200),
          }),
        },
        settings,
      );
      setIngestStatus(`Ingested ${result.chunks} chunks for document ${result.document_id}.`);
    } catch (error) {
      setIngestStatus(error instanceof Error ? error.message : "Failed to ingest content.");
    }
  }

  async function runEval() {
    try {
      const result = await apiFetch<{ summary: unknown }>(
        "/v1/admin/evals/run",
        {
          method: "POST",
          body: JSON.stringify({
            dataset_path: evalDataset,
            min_accuracy: Number(evalMinAccuracy || 0.6),
            max_p95_latency_ms: Number(evalMaxP95 || 2000),
            max_avg_cost_usd: Number(evalMaxCost || 0.01),
          }),
        },
        settings,
      );
      setEvalOutput(JSON.stringify(result.summary, null, 2));
      setEvalStatus("Eval run complete.");
    } catch (error) {
      setEvalOutput("");
      setEvalStatus(error instanceof Error ? error.message : "Failed to run evals.");
    }
  }

  async function loadAudit() {
    try {
      const result = await apiFetch<{
        actions?: Array<{
          created_at?: string;
          actor: string;
          action: string;
          target_type: string;
          target_id?: string;
          metadata?: unknown;
        }>;
      }>("/v1/admin/audit", { method: "GET" }, settings);
      const actions = (result.actions || []).map<AuditAction>((entry) => ({
        timestamp: entry.created_at || "",
        actor: entry.actor,
        action: entry.action,
        target: entry.target_id ? `${entry.target_type}:${entry.target_id}` : entry.target_type,
        metadata: entry.metadata ?? null,
      }));
      setAuditActions(actions);
      setAuditStatus("Audit log loaded.");
    } catch (error) {
      setAuditActions([]);
      setAuditStatus(error instanceof Error ? error.message : "Failed to load audit log.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-16 pt-10 sm:px-8 lg:px-12">
      <RevealSection className="pb-20">
        <div className="surface-card rounded-2xl p-8 sm:p-10">
          <p className="section-kicker">Admin Controls</p>
          <h1 className="mt-4 font-display text-4xl text-white">Privileged operational surface.</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
            Rotate admin keys, manage retrieval settings, ingest documents into RAG, run offline
            evals, and inspect audit activity.
          </p>
        </div>
      </RevealSection>

      <RevealList className="grid gap-6 xl:grid-cols-2">
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
              <button type="button" onClick={() => void rotateAdminKey()} className={ghostButtonClassName}>Rotate Admin Key</button>
              <button type="button" onClick={() => navigator.clipboard.writeText(rotatedKey)} disabled={rotatedKey === "No rotation yet."} className={ghostButtonClassName}>Copy New</button>
            </div>
            <p className="mt-4 text-sm text-[var(--muted)]">{sessionStatus}</p>
            <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="section-kicker">New Admin Key</p>
              <p className="mt-3 break-all font-mono text-xs text-[var(--foreground)]/75">{rotatedKey}</p>
            </div>
          </section>
        </RevealItem>

        <RevealItem>
          <section className="surface-card rounded-2xl p-6 sm:p-8">
            <p className="section-kicker">RAG Settings</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="RAG Enabled">
                <input type="checkbox" checked={ragSettings.enabled} onChange={(event) => setRagSettings((current) => ({ ...current, enabled: event.target.checked }))} className="h-5 w-5 accent-[var(--accent)]" />
              </Field>
              <Field label="Rerank">
                <input type="checkbox" checked={ragSettings.rerank} onChange={(event) => setRagSettings((current) => ({ ...current, rerank: event.target.checked }))} className="h-5 w-5 accent-[var(--accent)]" />
              </Field>
              <Field label="Top K">
                <input type="number" min={1} max={20} value={ragSettings.top_k} onChange={(event) => setRagSettings((current) => ({ ...current, top_k: Number(event.target.value || 4) }))} className={fieldClassName} />
              </Field>
              <Field label="Max Context Chars">
                <input type="number" min={200} max={20000} value={ragSettings.max_context_chars} onChange={(event) => setRagSettings((current) => ({ ...current, max_context_chars: Number(event.target.value || 4000) }))} className={fieldClassName} />
              </Field>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => void loadRagSettings()} className={ghostButtonClassName}>Load</button>
              <button type="button" onClick={() => void saveRagSettings()} className={primaryButtonClassName}>Save</button>
            </div>
            <p className="mt-4 text-sm text-[var(--muted)]">{ragStatus}</p>
          </section>
        </RevealItem>
      </RevealList>

      <RevealList className="mt-6 grid gap-6 xl:grid-cols-2">
        <RevealItem>
          <section className="surface-card rounded-2xl p-6 sm:p-8">
            <p className="section-kicker">RAG Ingestion</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Tenant">
                <select value={ingestTenant} onChange={(event) => setIngestTenant(event.target.value)} className={fieldClassName}>
                  {tenantOptions.length ? tenantOptions.map((tenant) => (
                    <option key={tenant.tenant} value={tenant.tenant}>{tenant.tenant} ({tenant.tier})</option>
                  )) : <option value="default">default</option>}
                </select>
              </Field>
              <Field label="Source">
                <input value={ingestSource} onChange={(event) => setIngestSource(event.target.value)} className={fieldClassName} />
              </Field>
              <Field label="Source ID">
                <input value={ingestSourceId} onChange={(event) => setIngestSourceId(event.target.value)} className={fieldClassName} />
              </Field>
              <Field label="Title">
                <input value={ingestTitle} onChange={(event) => setIngestTitle(event.target.value)} className={fieldClassName} />
              </Field>
              <Field label="Chunk Size">
                <input type="number" min={200} max={5000} value={ingestChunkSize} onChange={(event) => setIngestChunkSize(event.target.value)} className={fieldClassName} />
              </Field>
              <Field label="Overlap">
                <input type="number" min={0} max={1000} value={ingestOverlap} onChange={(event) => setIngestOverlap(event.target.value)} className={fieldClassName} />
              </Field>
            </div>
            <Field label="Content">
              <textarea value={ingestContent} onChange={(event) => setIngestContent(event.target.value)} rows={8} className={`${fieldClassName} mt-2 min-h-48 resize-y`} />
            </Field>
            <div className="mt-6">
              <button type="button" onClick={() => void ingestDocument()} className={primaryButtonClassName}>Ingest Document</button>
            </div>
            <p className="mt-4 text-sm text-[var(--muted)]">{ingestStatus}</p>
          </section>
        </RevealItem>

        <RevealItem>
          <section className="surface-card rounded-2xl p-6 sm:p-8">
            <p className="section-kicker">Eval Runner</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Dataset Path">
                <input value={evalDataset} onChange={(event) => setEvalDataset(event.target.value)} className={fieldClassName} />
              </Field>
              <Field label="Min Accuracy">
                <input type="number" min={0} max={1} step="0.01" value={evalMinAccuracy} onChange={(event) => setEvalMinAccuracy(event.target.value)} className={fieldClassName} />
              </Field>
              <Field label="Max P95 Latency (ms)">
                <input type="number" min={100} max={60000} value={evalMaxP95} onChange={(event) => setEvalMaxP95(event.target.value)} className={fieldClassName} />
              </Field>
              <Field label="Max Avg Cost (USD)">
                <input type="number" min={0} max={1} step="0.001" value={evalMaxCost} onChange={(event) => setEvalMaxCost(event.target.value)} className={fieldClassName} />
              </Field>
            </div>
            <div className="mt-6">
              <button type="button" onClick={() => void runEval()} className={primaryButtonClassName}>Run Evals</button>
            </div>
            <p className="mt-4 text-sm text-[var(--muted)]">{evalStatus}</p>
            <pre className="mt-6 overflow-x-auto rounded-2xl border border-white/8 bg-black/20 p-4 font-mono text-xs leading-6 text-[var(--foreground)]/72">{evalOutput || "{}"}</pre>
          </section>
        </RevealItem>
      </RevealList>

      <RevealSection className="section-divider pb-10">
        <div className="pt-12 sm:pt-16">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="section-title text-white">Audit Log</h2>
            <button type="button" onClick={() => void loadAudit()} className={ghostButtonClassName}>Refresh Audit Log</button>
          </div>
          <p className="text-sm text-[var(--muted)]">{auditStatus}</p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/8 bg-white/[0.03]">
            <table className="min-w-full text-left text-sm text-[var(--foreground)]/78">
              <thead className="border-b border-white/8 text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {auditActions.length ? auditActions.map((item, index) => (
                  <tr key={`${item.timestamp}-${index}`} className="border-b border-white/6 align-top">
                    <td className="px-4 py-3">{item.timestamp ? new Date(item.timestamp).toLocaleString() : "--"}</td>
                    <td className="px-4 py-3">{item.actor}</td>
                    <td className="px-4 py-3">{item.action}</td>
                    <td className="px-4 py-3">{item.target}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--foreground)]/65">{item.metadata ? JSON.stringify(item.metadata) : "--"}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-[var(--muted)]">No audit events.</td>
                  </tr>
                )}
              </tbody>
            </table>
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
