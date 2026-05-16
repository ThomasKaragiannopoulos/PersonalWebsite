"use client";

import { useEffect, useRef, useState } from "react";
import { RevealItem, RevealSection } from "@/components/Reveal";
import { fetchSuggested, streamQuery } from "@/lib/oino/client";
import type { AnalyzeData, Chunk, EvalData, ReformulateData, RerankData, RetrieveData } from "@/lib/oino/types";

const OINO_API_URL = process.env.NEXT_PUBLIC_OINO_API_URL ?? "http://localhost:8001";

type RunState = "idle" | "running" | "done" | "error";
type NodeStatus = "pending" | "active" | "done";

type TraceState = {
  analyze: { status: NodeStatus; data?: AnalyzeData };
  retrieve: { status: NodeStatus; data?: RetrieveData };
  rerank: { status: NodeStatus; data?: { top_k: number } };
  generate: { status: NodeStatus };
  evaluate: { status: NodeStatus };
  reformulate: { status: NodeStatus; data?: ReformulateData };
};

const NODES: (keyof TraceState)[] = ["analyze", "retrieve", "rerank", "generate", "evaluate", "reformulate"];

const NODE_LABELS: Record<keyof TraceState, string> = {
  analyze: "Analyze",
  retrieve: "Retrieve",
  rerank: "Rerank",
  generate: "Generate",
  evaluate: "Evaluate",
  reformulate: "Reformulate",
};

function initialTrace(): TraceState {
  return {
    analyze: { status: "pending" },
    retrieve: { status: "pending" },
    rerank: { status: "pending" },
    generate: { status: "pending" },
    evaluate: { status: "pending" },
    reformulate: { status: "pending" },
  };
}

function nodeStatusClass(status: NodeStatus) {
  if (status === "done") return "border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)]";
  if (status === "active") return "border-white/20 bg-white/[0.06] text-white";
  return "border-white/8 bg-white/[0.02] text-[var(--muted)]";
}

function nodeDotClass(status: NodeStatus) {
  if (status === "done") return "bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)]";
  if (status === "active") return "bg-white/70 animate-pulse";
  return "bg-white/20";
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
        <span className="font-mono uppercase tracking-[0.12em]">{label}</span>
        <span className="font-mono text-white">{value.toFixed(4)}</span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all"
          style={{ width: `${Math.min(pct * 15, 100)}%` }}
        />
      </div>
    </div>
  );
}

function EvalBadge({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : pct >= 50
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : "border-red-500/30 bg-red-500/10 text-red-300";

  return (
    <div className={`rounded-xl border px-4 py-3 ${color}`}>
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-1 font-display text-2xl text-white">{pct}%</p>
    </div>
  );
}

export default function PP2QueryPage() {
  const [query, setQuery] = useState("");
  const [runState, setRunState] = useState<RunState>("idle");
  const [trace, setTrace] = useState<TraceState>(initialTrace());
  const [tokens, setTokens] = useState("");
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [evalData, setEvalData] = useState<EvalData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedChunk, setExpandedChunk] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<string[]>([]);

  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetchSuggested(OINO_API_URL).then(setSuggested);
  }, []);

  useEffect(() => {
    if (tokens && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [tokens]);

  function activateNode(node: keyof TraceState) {
    setTrace((prev) => ({ ...prev, [node]: { ...prev[node], status: "active" } }));
  }

  async function handleSubmit() {
    const q = query.trim();
    if (!q || runState === "running") return;

    setRunState("running");
    setTrace(initialTrace());
    setTokens("");
    setChunks([]);
    setEvalData(null);
    setErrorMsg("");
    setExpandedChunk(null);

    activateNode("analyze");

    try {
      await streamQuery(q, OINO_API_URL, (event) => {
        if (event.type === "step") {
          if (event.node === "analyze") {
            setTrace((prev) => ({
              ...prev,
              analyze: { status: "done", data: event.data },
              retrieve: { status: "active" },
            }));
          } else if (event.node === "retrieve") {
            setChunks(event.data.chunks);
            setTrace((prev) => ({
              ...prev,
              retrieve: { status: "done", data: event.data },
              rerank: { status: "active" },
            }));
          } else if (event.node === "rerank") {
            const rerankData: RerankData = event.data;
            setChunks(rerankData.chunks);
            setTrace((prev) => ({
              ...prev,
              rerank: { status: "done", data: { top_k: rerankData.top_k } },
              generate: { status: "active" },
            }));
          } else if (event.node === "reformulate") {
            setTrace((prev) => ({
              ...prev,
              reformulate: { status: "done", data: event.data },
              retrieve: { status: "active" },
              rerank: { status: "pending" },
              generate: { status: "pending" },
              evaluate: { status: "pending" },
            }));
            setTokens("");
            setEvalData(null);
          }
        } else if (event.type === "token") {
          setTokens((prev) => prev + event.data);
        } else if (event.type === "eval") {
          setTrace((prev) => ({
            ...prev,
            generate: { status: "done" },
            evaluate: { status: "done" },
          }));
          setEvalData(event.data);
        } else if (event.type === "error") {
          const msg = typeof event.data === "string" ? event.data : event.data.message;
          setErrorMsg(msg);
          setRunState("error");
        } else if (event.type === "done") {
          setRunState("done");
        }
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setRunState("error");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-16 pt-10 sm:px-8 lg:px-12">
      <RevealSection>
        <div className="border-b border-white/8 pb-10">
          <p className="font-mono text-sm text-[var(--muted)]">
            <span>pp2</span>
            <span className="mx-1 text-white/20">/</span>
            <span className="text-white">query</span>
          </p>
          <h1 className="font-display mt-5 text-4xl font-normal text-white sm:text-5xl">
            Query the pipeline.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
            Ask anything about Greek wine. The LangGraph agent analyzes intent, routes irrelevant questions safely,
            retrieves, reranks, generates, and self-evaluates - each step visible as it runs.
          </p>
        </div>

        <RevealItem>
          <div className="mt-8">
            <div className="overflow-hidden rounded-[1.1rem] border border-white/8 bg-white/[0.025]">
              <div className="px-5 py-5 sm:px-7">
                <label className="block">
                  <span className="mb-2 block text-sm text-[var(--muted)]">Your question</span>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSubmit();
                      }
                    }}
                    placeholder="e.g. Which wineries in Naoussa are known for Xinomavro?"
                    rows={2}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition-colors focus:border-[var(--accent)]/40"
                  />
                </label>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={runState === "running" || !query.trim()}
                    className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    {runState === "running" ? "Running..." : "Ask"}
                  </button>
                  {suggested.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {suggested.map((suggestedQuery) => (
                        <button
                          key={suggestedQuery}
                          type="button"
                          onClick={() => setQuery(suggestedQuery)}
                          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-[var(--muted)] transition-colors hover:border-white/20 hover:text-white"
                        >
                          {suggestedQuery}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errorMsg && <p className="mt-3 text-sm text-red-400">{errorMsg}</p>}
              </div>
            </div>
          </div>
        </RevealItem>

        {runState !== "idle" && (
          <RevealItem>
            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)] lg:items-start">
              <div>
                <h2 className="section-title text-white">Agent trace</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">LangGraph nodes executing in sequence.</p>
                <div className="mt-5 space-y-2">
                  {NODES.map((node) => {
                    const n = trace[node];
                    const analyzeNode = node === "analyze" ? trace.analyze : null;
                    const retrieveNode = node === "retrieve" ? trace.retrieve : null;
                    const rerankNode = node === "rerank" ? trace.rerank : null;
                    const reformulateNode = node === "reformulate" ? trace.reformulate : null;

                    return (
                      <div
                        key={node}
                        className={`rounded-xl border px-4 py-3 transition-colors ${nodeStatusClass(n.status)}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${nodeDotClass(n.status)}`} />
                          <span className="font-mono text-sm font-medium">{NODE_LABELS[node]}</span>
                        </div>

                        {analyzeNode?.status === "done" && analyzeNode.data && (
                          <div className="mt-3 space-y-1 pl-5">
                            <p className="text-xs text-[var(--muted)]">
                              <span className="text-white/50">type</span>{" "}
                              <span className="font-mono">{analyzeNode.data.query_type}</span>
                            </p>
                            <p className="text-xs text-[var(--muted)]">
                              <span className="text-white/50">intent</span>{" "}
                              {analyzeNode.data.intent}
                            </p>
                          </div>
                        )}

                        {retrieveNode?.status === "done" && retrieveNode.data && (
                          <p className="mt-2 pl-5 text-xs text-[var(--muted)]">
                            {retrieveNode.data.count} chunks retrieved
                          </p>
                        )}

                        {rerankNode?.status === "done" && rerankNode.data && (
                          <p className="mt-2 pl-5 text-xs text-[var(--muted)]">
                            top {rerankNode.data.top_k} selected
                          </p>
                        )}

                        {reformulateNode?.status === "done" && reformulateNode.data && (
                          <div className="mt-2 pl-5 text-xs text-[var(--muted)]">
                            <span className="text-white/50">retry {reformulateNode.data.retry} - </span>
                            {reformulateNode.data.reformulated_query}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="section-title text-white">Answer</h2>
                  <div className="mt-4 overflow-hidden rounded-[1.1rem] border border-white/8 bg-white/[0.025]">
                    <div ref={answerRef} className="px-5 py-5 sm:px-7">
                      {tokens ? (
                        <p className="text-sm leading-7 text-[var(--foreground)]/90">
                          {tokens}
                          {runState === "running" && (
                            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[var(--accent)]" />
                          )}
                        </p>
                      ) : (
                        <p className="text-sm text-[var(--muted)]">
                          {runState === "running" ? "Generating..." : "No answer yet."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {evalData && (
                  <div>
                    <h2 className="section-title text-white">Eval scores</h2>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <EvalBadge label="Faithfulness" value={evalData.faithfulness} />
                      <EvalBadge label="Relevance" value={evalData.relevance} />
                    </div>
                  </div>
                )}

                {chunks.length > 0 && (
                  <div>
                    <h2 className="section-title text-white">Retrieved chunks</h2>
                    <p className="mt-2 text-xs text-[var(--muted)]">BM25 + pgvector fused via RRF (K=60). Tap to expand.</p>
                    <div className="mt-4 space-y-2">
                      {chunks.map((chunk) => {
                        const isOpen = expandedChunk === chunk.id;
                        return (
                          <button
                            key={chunk.id}
                            type="button"
                            onClick={() => setExpandedChunk(isOpen ? null : chunk.id)}
                            className="w-full rounded-xl border border-white/8 bg-white/[0.025] p-4 text-left transition-colors hover:border-white/14"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white">{chunk.name}</p>
                                <p className="mt-0.5 text-xs text-[var(--muted)]">{chunk.region || "-"}</p>
                              </div>
                              <span className="mt-0.5 shrink-0 font-mono text-xs text-[var(--accent)]">
                                {chunk.rrf_score.toFixed(4)}
                              </span>
                            </div>

                            {isOpen && (
                              <div className="mt-4 space-y-3 border-t border-white/8 pt-4">
                                {chunk.text && <p className="text-xs leading-6 text-[var(--muted)]">{chunk.text}</p>}
                                <div className="space-y-2">
                                  <ScoreBar label="BM25" value={chunk.bm25_score} />
                                  <ScoreBar label="Vector" value={chunk.vector_score} />
                                  <ScoreBar label="RRF" value={chunk.rrf_score} />
                                  {chunk.rerank_score !== undefined && (
                                    <ScoreBar label="Rerank" value={chunk.rerank_score} />
                                  )}
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </RevealItem>
        )}
      </RevealSection>
    </div>
  );
}
