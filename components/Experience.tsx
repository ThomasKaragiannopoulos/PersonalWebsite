"use client";

import { HoverCard, RevealSection } from "@/components/Reveal";
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

      <div className="grid gap-6 lg:grid-cols-2">
        {experience.map((entry) => (
          <HoverCard
            key={`${entry.company}-${entry.role}`}
            className="surface-card rounded-xl p-6 sm:p-8"
          >
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

            <div className="mt-8 space-y-4">
              {entry.projects.map((project) => (
                <div
                  key={`${entry.company}-${project.name}`}
                  className="rounded-lg border border-white/8 bg-white/[0.03] p-4 transition-colors duration-300 hover:border-white/15"
                >
                  <p className="font-semibold text-white">{project.name}</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    {project.detail}
                  </p>
                </div>
              ))}
            </div>
          </HoverCard>
        ))}
      </div>
    </RevealSection>
  );
}
