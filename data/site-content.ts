type ExperienceEntry = {
  role: string;
  company: string;
  period: string;
  summary: string;
  projects: {
    name: string;
    status?: string;
    detail: string;
  }[];
};

type ProjectEntry = {
  name: string;
  subtitle: string;
  description: string;
  bullets: string[];
  href: string;
  linkLabel: string;
  isPlaceholder?: boolean;
  isLocked?: boolean;
};

type SkillGroup = {
  title: string;
  items: string[];
};

type EducationEntry = {
  degree: string;
  institution: string;
  year: string;
  thesis: string;
  notes?: string;
};

export const siteContent = {
  name: "Thomas Karagiannopoulos",
  title: "AI Engineer - LLM Systems, RAG, Agents",
  pitch:
    "Production AI systems in days, not quarters. CI/CD, retrieval, evals, APIs, deployment, and metrics that matter.",
  email: "thomas@karagiannopoulos.dev",
  linkedin: "https://uk.linkedin.com/in/thomas-karagiannopoulos-a74560167",
  cvPath: "/Thomas_Karagiannopoulos_CV.pdf",
  oinowayUrl: "https://oinoway.gr",
  sisyphusUrl: "https://store.steampowered.com/app/2341090/Sisyphus122003/",
  llmGatewayUrl: "#",
};

export const experience: ExperienceEntry[] = [
  {
    role: "AI Engineer",
    company: "Netcompany",
    period: "2025-Present",
    summary:
      "Designing production-grade LLM and retrieval systems for enterprise legal, industrial, and geospatial workflows, from rollout to maintenance.",
    projects: [
      {
        name: "Nomos",
        status: "Friends & Family",
        detail:
          "Enterprise legal document AI platform with a translation pipeline covering 24 EU languages and a 98% acceptance rate.",
      },
      {
        name: "Halcor",
        status: "Production",
        detail:
          "Semantic product matching pipeline that improved F1 by 23% with a three-stage retrieval and ranking architecture.",
      },
      {
        name: "TEE",
        status: "UAT",
        detail:
          "Urban planning assistant using ArcGIS, RAG, and Oracle 23ai, reaching 92% query satisfaction in pilot usage.",
      },
    ],
  },
  {
    role: "Co-founder & Tech Lead",
    company: "Oinoway",
    period: "2025-Present",
    summary:
      "Building a wine discovery platform that blends search, editorial structure, and agentic assistance for enthusiasts and producers.",
    projects: [
      {
        name: "Search & Discovery",
        status: "Live",
        detail:
          "Greek wine discovery platform indexing 500+ wineries and serving 1,000+ early users.",
      },
      {
        name: "OinoAI",
        status: "Live",
        detail:
          "Tool-calling RAG agent with hybrid retrieval built on pgvector, full-text search, and reciprocal rank fusion.",
      },
      {
        name: "Platform & Visibility",
        status: "Live",
        detail:
          "Product tracking, OinoAI visibility controls, deployment, and the backend workflows needed to iterate safely on prompts, retrieval, and product behavior.",
      },
    ],
  },
] ;

export const projects: ProjectEntry[] = [
  {
    name: "LLM Gateway",
    subtitle: "Personal project",
    description:
      "Production-minded FastAPI gateway for multi-tenant LLM access, with explicit service boundaries, tenant policy enforcement, and operator-grade observability.",
    bullets: [
      "Layered backend architecture with thin routers, service orchestration, and repository boundaries",
      "Per-tenant auth, rate limits, quotas, auditability, and admin controls",
      "SSE streaming, provider fallback, semantic cache, Prometheus, and Grafana",
    ],
    href: "/portfolio/pp1",
    linkLabel: "Open UI",
  },
  {
    name: "Sisyphus 12.20.03",
    subtitle: "Shipped game",
    description:
      "Unity and C# game taken from concept to public Steam release, demonstrating end-to-end product ownership, systems implementation, and the ability to ship finished work.",
    bullets: [
      "Built gameplay and core systems in Unity and C#",
      "Shipped publicly on Steam as a finished commercial release",
      "Selected for Brunel's Made in Brunel top-project showcase",
    ],
    href: "https://store.steampowered.com/app/2341090/Sisyphus122003/",
    linkLabel: "View on Steam",
  },
  {
    name: "OinoAI v2",
    subtitle: "In development",
    description:
      "The next version of the Oinoway assistant - moving from tool-calling to a LangGraph pipeline with query routing, hybrid retrieval, stateful reasoning, and per-answer eval scores.",
    bullets: [
      "LangGraph state machine with routing for irrelevant or unsupported questions before retrieval and generation",
      "Hybrid retrieval via BM25, pgvector cosine search, and Reciprocal Rank Fusion",
      "LLM-as-judge faithfulness and cosine relevance scores on every answer, with explicit fallback behavior for low-confidence paths",
    ],
    href: "/pp2",
    linkLabel: "Open demo",
  },
] ;

export const skillGroups: SkillGroup[] = [
  {
    title: "AI & Orchestration",
    items: [
      "LangGraph",
      "LangChain",
      "RAG",
      "Tool-calling",
      "Agents",
      "Prompt engineering",
      "Evaluation pipelines",
      "Guardrails",
    ],
  },
  {
    title: "Models & APIs",
    items: [
      "Azure OpenAI",
      "OpenAI API",
      "GPT-4o/4.1",
      "Mistral",
      "text-embedding-3-large",
      "Azure Document Intelligence",
      "REST APIs",
    ],
  },
  {
    title: "ML",
    items: [
      "PyTorch",
      "scikit-learn",
      "NumPy",
      "Pandas",
      "Hugging Face",
      "Sentence Transformers",
      "XGBoost",
      "Matplotlib",
    ],
  },
  {
    title: "Vector & Retrieval",
    items: [
      "pgvector",
      "Azure AI Search",
      "RRF",
      "Hybrid Search",
      "BM25",
      "Vector search",
      "Reranking",
      "Chunking pipelines",
    ],
  },
  {
    title: "Infra & Data",
    items: [
      "PostgreSQL",
      "Redis",
      "Oracle 23ai",
      "Docker",
      "Docker Compose",
      "Azure",
      "Git",
      "GitHub Actions",
      "CI/CD",
      "Linux",
    ],
  },
  {
    title: "Frameworks",
    items: [
      "FastAPI",
      "Pydantic",
      "Next.js",
      "React",
      "SQLAlchemy",
      "Alembic",
      "Streamlit",
    ],
  },
  {
    title: "Languages",
    items: ["Python", "SQL", "TypeScript", "JavaScript", "C#", "Bash"],
  },
] ;

export const education: EducationEntry[] = [
  {
    degree: "MSc Artificial Intelligence",
    institution: "University of Surrey",
    year: "2024",
    thesis:
      "Dual-Stream LSTM for Contactless Physiological Sleep Stage Classification - Surrey Sleep Research Centre",
  },
  {
    degree: "BSc Computer Science",
    institution: "Brunel University of London",
    year: "2023",
    thesis:
      "VR Simulation of Schizophrenia using Unity and perceptual distortion modelling.",
    notes:
      "Selected for the Made in Brunel showcase and released Sisyphus 12.20.03 on Steam.",
  },
] ;
