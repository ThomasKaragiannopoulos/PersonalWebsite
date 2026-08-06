import Link from "next/link";
import { notFound } from "next/navigation";
import { EtchBackground } from "@/components/EtchBackground";
import { FlowDiagram } from "@/components/FlowDiagram";
import { GlassButton } from "@/components/GlassButton";
import { caseStudies, pillars, siteContent } from "@/data/site-content";

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = caseStudies.find((c) => c.slug === slug);
  if (!study) notFound();
  const pillarId = pillars.find((p) => p.title === study.pillar)?.id ?? "hero";

  return (
    <main className="relative min-h-screen bg-[var(--background)] px-6 py-24 text-[var(--foreground)] sm:px-8 lg:px-12">
      <EtchBackground image={`/bg/${pillarId}.png`} />
      <div className="relative z-10 mx-auto max-w-3xl">
        <Link
          href="/"
          className="font-typewriter text-xs uppercase tracking-[0.2em] text-[var(--muted)] hover:text-white"
        >
          ← back
        </Link>

        <p className="font-typewriter mt-8 text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
          {study.pillar} · {study.client}
        </p>
        <h1 className="font-noir noir-title mt-4 text-4xl leading-[0.95] sm:text-5xl">
          {study.title}
        </h1>
        <p className="font-typewriter mt-4 text-sm leading-7 text-[var(--muted)] sm:text-base">
          {study.tagline}
        </p>
        <p className="font-typewriter mt-4 inline-block text-xs uppercase tracking-[0.14em] text-[var(--foreground)]">
          {study.status}
        </p>

        {study.metrics.length > 0 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {study.metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.02] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-2xl backdrop-saturate-200"
              >
                <p className="font-noir noir-title text-2xl leading-none">{m.value}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{m.label}</p>
              </div>
            ))}
          </div>
        )}

        <p className="mt-10 text-base leading-8 text-[var(--foreground)]/85">{study.summary}</p>

        <ul className="mt-8 space-y-3">
          {study.bullets.map((b) => (
            <li key={b} className="flex gap-3 text-base leading-7 text-[var(--foreground)]/85">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--foreground)]" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-2">
          {study.stack.map((s) => (
            <span
              key={s}
              className="font-typewriter rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] text-[var(--muted)] backdrop-blur-md"
            >
              {s}
            </span>
          ))}
        </div>

        <div className="mt-12">
          <FlowDiagram steps={study.flow} variant={study.flowVariant} reverse={study.flowReverse} />
        </div>

        <div className="mt-12 flex flex-wrap gap-4 pt-8">
          {study.href && (
            <GlassButton href={study.href} external>
              {(study.linkLabel ?? "view project").toLowerCase()}
            </GlassButton>
          )}
          <GlassButton href={`mailto:${siteContent.email}`}>discuss a similar project</GlassButton>
        </div>
      </div>
    </main>
  );
}
