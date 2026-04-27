"use client";

import { HoverCard, RevealSection } from "@/components/Reveal";
import { projects } from "@/data/site-content";

export function Projects() {
  return (
    <RevealSection id="projects" className="section-divider scroll-mt-24 py-20 sm:py-24">
      <div className="mb-12 max-w-3xl pt-10">
        <p className="section-kicker">Projects</p>
        <h2 className="section-title mt-4 text-white">
          A mix of platform engineering, shipped experiments, and what comes next.
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {projects.map((project) => (
          <HoverCard
            key={project.name}
            className={`surface-card relative overflow-hidden rounded-[2rem] p-6 sm:p-7 ${
              project.isLocked ? "before:absolute before:inset-0 before:bg-[rgba(7,9,13,0.46)] before:backdrop-blur-[2px]" : ""
            }`}
          >
            {project.isLocked ? (
              <div className="pointer-events-none absolute right-5 top-5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
                Locked
              </div>
            ) : null}

            <div className={`relative ${project.isLocked ? "blur-[1.8px]" : ""}`}>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
                {project.subtitle}
              </p>
              <h3 className="mt-4 font-display text-2xl font-semibold tracking-[-0.04em] text-white">
                {project.name}
              </h3>
              <p className="mt-4 text-sm leading-7 text-[var(--foreground)]/80">
                {project.description}
              </p>

              <ul className="mt-6 space-y-3 text-sm leading-7 text-[var(--muted)]">
                {project.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mt-8">
              <a
                href={project.href}
                target={project.isPlaceholder ? undefined : "_blank"}
                rel={project.isPlaceholder ? undefined : "noreferrer"}
                aria-disabled={project.isPlaceholder}
                className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  project.isPlaceholder
                    ? "cursor-default border-white/10 bg-white/[0.04] text-[var(--muted)]"
                    : "border-[var(--accent)]/30 bg-[var(--accent-soft)] text-white hover:border-[var(--accent)] hover:bg-[rgba(107,166,255,0.2)]"
                }`}
              >
                {project.linkLabel}
              </a>
            </div>
          </HoverCard>
        ))}
      </div>
    </RevealSection>
  );
}
