export type AdminSettings = {
  baseUrl: string;
  adminKey: string;
};

export type Tenant = {
  name: string;
  tier: string;
  createdAt?: string;
  tokenLimitPerDay?: number | null;
  spendLimitPerDayUsd?: number | null;
};

export type Key = {
  tenant: string;
  name: string;
  apiKey: string;
  createdAt: string;
  active: boolean;
  revokedAt?: string;
  revokedReason?: string;
};

export type UsageStats = {
  requests: number;
  tokens: number;
  cost_usd: number;
};

export type RAGSettings = {
  enabled: boolean;
  top_k: number;
  max_context_chars: number;
  rerank: boolean;
};

export type AuditAction = {
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  metadata: unknown;
};

export type ChatSettings = {
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
};
