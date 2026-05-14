export type Chunk = {
  id: string;
  entity_type: string;
  name: string;
  region: string;
  text: string;
  bm25_score: number;
  vector_score: number;
  rrf_score: number;
  rerank_score?: number;
  fallback?: boolean;
};

export type AnalyzeData = { query_type: string; intent: string };
export type RetrieveData = { count: number; chunks: Chunk[] };
export type RerankData = { top_k: number; chunks: Chunk[] };
export type EvalData = { faithfulness: number; relevance: number };
export type ReformulateData = { reformulated_query: string; retry: number };

export type AgentEvent =
  | { type: "step"; node: "analyze"; data: AnalyzeData }
  | { type: "step"; node: "retrieve"; data: RetrieveData }
  | { type: "step"; node: "rerank"; data: RerankData }
  | { type: "step"; node: "reformulate"; data: ReformulateData }
  | { type: "token"; data: string }
  | { type: "eval"; data: EvalData }
  | { type: "error"; data: { message: string; request_id?: string } | string }
  | { type: "done" };
