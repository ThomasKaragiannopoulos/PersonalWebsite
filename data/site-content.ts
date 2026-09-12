export type CaseStudy = {
  slug: string;
  pillar: string;
  client: string;
  title: string;
  tagline: string;
  status: string;
  metrics: { value: string; label: string }[];
  summary: string;
  bullets: string[];
  flow: string[];
  flowVariant: "zigzag" | "vertical" | "diagonal";
  flowReverse?: boolean;
  stack: string[];
  href?: string;
  linkLabel?: string;
};

export type Pillar = {
  id: string;
  title: string;
  description: string;
  caseStudySlug: string;
};

export const siteContent = {
  name: "Thomas Karagiannopoulos",
  title: "AI Engineer, for hire",
  pitch:
    "Production AI systems, web platforms, and automations built to ship, not proof-of-concepts that stall in a notebook.",
  email: "thom@skaragiannopoulos.com",
  linkedin: "https://uk.linkedin.com/in/thomas-karagiannopoulos-a74560167",
  cvPath: "/Thomas_Karagiannopoulos_CV.pdf",
};

export const pillars: Pillar[] = [
  {
    id: "ai-systems",
    title: "AI Systems",
    description:
      "Enterprise-grade LLM pipelines built for real production constraints, not demos. Cost tracking, caching, and observability from day one.",
    caseStudySlug: "nomos",
  },
  {
    id: "agents",
    title: "Agents",
    description:
      "Agents that reason across multiple steps and real-world data sources to get an answer right, not just plausible.",
    caseStudySlug: "tee",
  },
  {
    id: "machine-learning",
    title: "Machine Learning",
    description:
      "Applied ML on real sensor and signal data, not clean benchmark datasets. Model choices fit the data and the constraints, not the other way around.",
    caseStudySlug: "surrey-sleep",
  },
  {
    id: "web-design",
    title: "Web Design",
    description:
      "Fast, modern sites and platforms built to convert. Information architecture and backend maintainability matter as much as the visual layer.",
    caseStudySlug: "oinoway",
  },
  {
    id: "automation",
    title: "Automation",
    description:
      "Workflows and integrations that quietly run in the background so you don't have to. Fewer manual steps, not more dashboards to check.",
    caseStudySlug: "jarvis",
  },
];

export const caseStudies: CaseStudy[] = [
  {
    slug: "oinoway",
    pillar: "Web Design",
    client: "Oinoway",
    title: "Greek wine discovery platform",
    tagline: "Search, editorial tooling, and a role-based admin platform, live and growing.",
    status: "Live",
    metrics: [
      { value: "500+", label: "wineries indexed" },
      { value: "1,000+", label: "early users" },
    ],
    summary:
      "Co-founded and built the platform end to end: a Greek wine discovery site that lets non-technical editors publish independently, backed by a bilingual ingestion pipeline that keeps the catalogue current without manual index updates.",
    bullets: [
      "Role-based admin platform with JWT auth and live ingestion triggers for non-technical editors",
      "GPT-4o bilingual ingestion pipeline with auto-embedding at ingest",
      "Full deployment and iteration workflow, safe to ship changes to prompts, retrieval, and product behaviour",
    ],
    flow: [
      "Editor publishes content",
      "GPT-4o bilingual ingestion",
      "Auto-embed at ingest (pgvector)",
      "Hybrid retrieval: FTS + vector, RRF",
      "OinoAI tool-calling agent",
      "Answer served to user",
    ],
    flowVariant: "zigzag",
    stack: ["Next.js", "TypeScript", "PostgreSQL", "pgvector", "GPT-4o"],
    href: "https://oinoway.com",
    linkLabel: "Visit Oinoway",
  },
  {
    slug: "nomos",
    pillar: "AI Systems",
    client: "Nomos",
    title: "Enterprise legal document translation pipeline",
    tagline: "Multilingual translation and reconstruction pipeline for legal documents, pre-launch, EU-validated.",
    status: "Pre-launch",
    metrics: [
      { value: "98%", label: "client acceptance rate" },
      { value: "24", label: "EU languages" },
      { value: "10-15%", label: "LLM cost reduction via caching" },
    ],
    summary:
      "Built a multilingual translation pipeline for enterprise legal documents, validated through structured EU stakeholder review ahead of public launch. Handles format-preserving reconstruction across DOCX and scanned PDFs, with glossary-aware term matching and OCR.",
    bullets: [
      "98% acceptance rate across 24 languages, with 60% rated perfect quality",
      "Two-layer Redis caching cut per-request LLM costs by 10-15%, with multi-model cost tracking and SSE-streaming delivery via FastAPI",
      "Format-preserving reconstruction across DOCX and scanned PDFs via chunked segmentation and OCR (Mistral / GPT-4 Vision)",
    ],
    flow: [
      "Document ingested: DOCX or scanned PDF",
      "OCR + chunked segmentation",
      "Glossary-aware term matching",
      "Multi-model translation (24 languages)",
      "Format-preserving reconstruction",
      "Delivered via SSE stream",
    ],
    flowVariant: "diagonal",
    stack: ["FastAPI", "Redis", "Azure OpenAI", "Mistral Document AI", "GPT-4 Vision"],
  },
  {
    slug: "tee",
    pillar: "Agents",
    client: "TEE",
    title: "Graph RAG agent for Greek urban planning law",
    tagline:
      "Resolves real-world address constraints by chaining geocoding, a government API, and query rewriting before retrieval.",
    status: "UAT",
    metrics: [
      { value: "92%", label: "query satisfaction in UAT" },
      { value: "21", label: "structured variables extracted per query" },
    ],
    summary:
      "An agent that answers questions about building constraints at a specific address by first resolving the address into the planning unit those constraints actually apply to, then rewriting the query before it ever touches retrieval.",
    bullets: [
      "Address is geocoded to coordinates, then resolved via a government API to its Building Block (Οικοδομικό Τετράγωνο), the unit Greek planning law attaches constraints to, not the address itself",
      "Query is rewritten to replace the address with its Building Block before retrieval, so the agent searches for the legal unit the law is actually indexed by",
      "Graph RAG over ΦΕΚ (Government Gazette) urban planning legislation returns the constraints that apply to that Building Block, in Greek and English",
    ],
    flow: [
      "User asks about constraints at Address X",
      "Address X geocoded to coordinates",
      "Government API resolves coordinates to Building Block",
      "Query rewritten: Address X replaced by Building Block",
      "Graph RAG over ΦΕΚ urban planning legislation",
      "Answer: constraints for that Building Block",
    ],
    flowVariant: "vertical",
    stack: ["LangGraph", "Graph RAG", "ArcGIS", "Oracle 23ai", "Azure OpenAI"],
  },
  {
    slug: "surrey-sleep",
    pillar: "Machine Learning",
    client: "University of Surrey, Surrey Sleep Research Centre",
    title: "Contactless sleep stage classification",
    tagline: "MSc thesis: dual-stream LSTM for contactless physiological sleep staging.",
    status: "MSc research, 2025",
    metrics: [{ value: "78%", label: "F1 score" }],
    summary:
      "Designed and trained a dual-stream LSTM to classify sleep stages from contactless physiological sensors, fusing multiple sensor modalities without requiring wearables or skin contact. Completed with the Surrey Sleep Research Centre.",
    bullets: [
      "Multimodal sensor fusion across contactless physiological signal streams",
      "Dual-stream LSTM architecture tuned for temporal sleep-stage transitions",
      "78% F1 on held-out evaluation, validated against clinical staging conventions",
    ],
    flow: [
      "Contactless physiological sensor streams",
      "Per-modality feature extraction",
      "Dual-stream LSTM fusion",
      "Sleep stage classification",
      "Evaluation against clinical staging",
    ],
    flowVariant: "zigzag",
    flowReverse: true,
    stack: ["PyTorch", "NumPy", "Pandas", "scikit-learn"],
  },
  {
    slug: "jarvis",
    pillar: "Automation",
    client: "Personal project",
    title: "Voice-controlled building management",
    tagline: "Voice-driven control layer over a real BMS stack, with safety guardrails.",
    status: "Proof of concept",
    metrics: [],
    summary:
      "A voice-controlled assistant that sits on top of a live building management system (Niagara/KNX), letting natural-language commands trigger real building controls, with explicit guardrails to keep an LLM from directly actuating unsafe states.",
    bullets: [
      "Natural-language command layer over a live Niagara/KNX BMS stack",
      "Safety-guard design that constrains LLM output to a validated set of safe actions before actuation",
      "End-to-end voice input to building control, built as a working proof of concept",
    ],
    flow: [
      "Voice command captured",
      "LLM parses intent",
      "Safety guard validates the action",
      "Command sent to Niagara/KNX BMS",
      "Building state changes",
    ],
    flowVariant: "diagonal",
    flowReverse: true,
    stack: ["Python", "LLM tool-calling", "Niagara", "KNX"],
  },
];
