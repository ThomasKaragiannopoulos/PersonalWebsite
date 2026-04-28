"use client";

import { HoverCard, RevealItem, RevealList, RevealSection } from "@/components/Reveal";
import { experience, siteContent } from "@/data/site-content";

export function Experience() {
  return (
    <RevealSection
      id="experience"
      className="section-divider scroll-mt-16 pb-20 sm:pb-24"
    >
      <div className="mb-12 max-w-3xl pt-12 sm:pt-16">
        <h2 className="section-title text-white">Experience</h2>
      </div>

      <RevealList className="grid gap-6 lg:grid-cols-2">
        {experience.map((entry) => (
          <RevealItem key={`${entry.company}-${entry.role}`}>
            <HoverCard className="surface-card rounded-xl p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl font-normal text-white">
                    {entry.role}
                  </h3>
                  <p className="mt-2 text-lg text-[var(--muted)]">
                    {entry.company === "Oinoway" ? (
                      <a
                        href={siteContent.oinowayUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="transition-colors hover:text-white"
                      >
                        {entry.company}
                      </a>
                    ) : (
                      entry.company
                    )}{" "}
                    | {entry.period}
                  </p>
                </div>
                <span className="font-mono rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.1em] text-[var(--muted)]">
                  {entry.period}
                </span>
              </div>

              <p className="mt-6 text-base leading-8 text-[var(--foreground)]/82">
                {entry.summary}
              </p>

              <RevealList className="mt-8 space-y-4" transition={{ staggerChildren: 0.05 }}>
                {entry.projects.map((project) => (
                  <RevealItem key={`${entry.company}-${project.name}`}>
                    <div className="rounded-lg border border-white/8 bg-white/[0.03] p-4 transition-colors duration-300 hover:border-white/15">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="font-semibold text-white">{project.name}</p>
                        {project.status ? (
                          <span className="font-mono rounded-full border border-[var(--accent)]/25 bg-[var(--accent-soft)] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
                            {project.status}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {project.detail}
                      </p>
                    </div>
                  </RevealItem>
                ))}
              </RevealList>
            </HoverCard>
          </RevealItem>
        ))}
      </RevealList>
    </RevealSection>
  );
}
