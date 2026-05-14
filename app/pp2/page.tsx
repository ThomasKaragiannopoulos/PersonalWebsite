"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RevealItem, RevealList, RevealSection } from "@/components/Reveal";
import { checkHealth } from "@/lib/oino/client";

type HealthState = "idle" | "checking" | "ok" | "error";

const OINO_API_URL = process.env.NEXT_PUBLIC_OINO_API_URL ?? "http://localhost:8001";

const capabilityChips = [
  "LangGraph",
  "Agentic RAG",
  "Hybrid Retrieval",
  "RRF",
  "BM25",
  "pgvector",
  "LLM Evals",
  "SSE Streaming",
] as const;

const capabilityPoints = [
  "LangGraph state machine with five named nodes: analyze, retrieve, rerank, generate, evaluate.",
  "Hybrid retrieval fuses PostgreSQL full-text search and pgvector cosine distance via Reciprocal Rank Fusion (K=60).",
  "Every retrieved chunk carries its BM25, vector, and RRF scores — visible in the query UI.",
  "Irrelevant and unsupported questions are routed away from the main answer path instead of forcing low-confidence retrieval and generation.",
  "LLM-as-judge faithfulness and cosine relevance scores are computed after every answer.",
] as const;

const showcaseSteps = [
  {
    number: "01",
    title: "Run the health check",
    beforeLink: "Use the",
    linkLabel: "status indicator",
    href: "#system-status",
    afterLink: "below to confirm the API is reachable before querying.",
  },
  {
    number: "02",
    title: "Ask a wine question",
    beforeLink: "Open",
    linkLabel: "/pp2/query",
    href: "/pp2/query",
    afterLink: "and type a question. The agent trace panel shows each LangGraph node firing in real time.",
  },
  {
    number: "03",
    title: "Inspect the retrieval layer",
    beforeLink: "Expand the retrieved chunks in",
    linkLabel: "/pp2/query",
    href: "/pp2/query",
    afterLink: "to see BM25, vector, and RRF scores for each result — the raw signal the agent reasons over.",
  },
  {
    number: "04",
    title: "Read the eval scores",
    beforeLink: "After the answer streams,",
    linkLabel: "faithfulness and relevance",
    href: "/pp2/query",
    afterLink: "scores appear — computed by a separate LLM judge and cosine similarity, not by the answering model.",
  },
] as const;

function toneClass(state: HealthState) {
  if (state === "ok") return "border-[var(--accent)]/30 bg-[var(--accent-soft)] text-white";
  if (state === "error") return "border-red-500/30 bg-red-500/10 text-red-200";
  if (state === "checking") return "border-white/12 bg-white/[0.05] text-white";
  return "border-white/8 bg-white/[0.03] text-[var(--muted)]";
}

function dotClass(state: HealthState) {
  if (state === "ok") return "bg-[var(--accent)] shadow-[0_0_14px_var(--accent-glow)]";
  if (state === "error") return "bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.28)]";
  if (state === "checking") return "bg-white/70";
  return "bg-white/25";
}

function healthLabel(state: HealthState) {
  if (state === "ok") return "Online";
  if (state === "error") return "Unavailable";
  if (state === "checking") return "Checking";
  return "Idle";
}

export default function PP2OverviewPage() {
  const [health, setHealth] = useState<HealthState>("idle");

  async function runHealthCheck() {
    setHealth("checking");
    const result = await checkHealth(OINO_API_URL);
    setHealth(result);
  }

  useEffect(() => {
    void runHealthCheck();
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-16 pt-10 sm:px-8 lg:px-12">
      <RevealSection className="pb-10">
        <div>
          <div className="border-b border-white/8 pb-16">
            <div className="grid gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-start">
              <div>
                <p className="font-mono text-sm text-[var(--muted)]">
                  <span>pp2</span>
                  <span className="mx-1 text-white/20">/</span>
                  <span className="text-white">oino-v2</span>
                </p>
                <h1 className="font-display mt-5 max-w-3xl text-4xl font-normal text-white sm:text-5xl lg:text-6xl">
                  OinoAI v2
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
                  The next version of the Oinoway assistant, in active development. It upgrades tool-calling to a LangGraph pipeline with query routing, stateful reasoning, hybrid retrieval, and per-answer eval scores.
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
                    href="/pp2/query"
                    className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Open query
                  </Link>
                  <Link
                    href="/#projects"
                    className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm text-[var(--foreground)]/80 transition-colors hover:border-white/20 hover:text-white"
                  >
                    Back to portfolio
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
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-6 py-8">
            <div>
              <h2 className="section-title text-white">How to use it</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Follow the pipeline from health check to eval scores — each step is visible in the UI.
              </p>
            </div>

            <div className="rounded-[1.1rem] border border-white/8 bg-white/[0.025]">
              <div className="px-5 py-6 sm:px-7">
                <RevealList className="grid gap-4 sm:grid-cols-2">
                  {showcaseSteps.map((step) => (
                    <RevealItem key={step.number}>
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                        <p className="font-mono text-xs text-[var(--accent)]">{step.number}</p>
                        <p className="mt-3 font-semibold text-white">{step.title}</p>
                        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                          {step.beforeLink}{" "}
                          <Link
                            href={step.href}
                            className="inline-flex items-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent)] transition-colors hover:border-[var(--accent)]"
                          >
                            {step.linkLabel}
                          </Link>{" "}
                          {step.afterLink}
                        </p>
                      </div>
                    </RevealItem>
                  ))}
                </RevealList>
              </div>
            </div>

            <div id="system-status">
              <h3 className="section-title text-white">System status</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Live health signal for the OinoAI v0.1 API.
              </p>
            </div>

            <div className="rounded-[1.1rem] border border-white/8 bg-white/[0.025] p-5">
              <RevealList className="grid gap-3">
                <RevealItem>
                  <div className={`rounded-xl border px-4 py-3 ${toneClass(health)}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass(health)}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">API</p>
                          <p className="mt-0.5 font-mono text-[11px] text-[var(--foreground)]/50">/health</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="shrink-0 text-xs font-medium text-[var(--foreground)]/72">
                          {healthLabel(health)}
                        </p>
                        <button
                          type="button"
                          onClick={() => void runHealthCheck()}
                          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[var(--foreground)]/80 transition-colors hover:border-white/20 hover:text-white"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>
                  </div>
                </RevealItem>
              </RevealList>
            </div>
          </div>
        </div>
      </RevealSection>
    </div>
  );
}
