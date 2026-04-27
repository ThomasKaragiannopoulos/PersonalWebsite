"use client";

import { HoverCard, RevealSection } from "@/components/Reveal";
import { experience, siteContent } from "@/data/site-content";

export function Experience() {
  return (
    <RevealSection
      id="experience"
      className="section-divider scroll-mt-24 py-20 sm:py-24"
    >
      <div className="mb-12 max-w-3xl pt-10">
        <p className="section-kicker">Experience</p>
        <h2 className="section-title mt-4 text-white">
          Shipping enterprise AI and building products on the side.
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {experience.map((entry) => (
          <HoverCard
            key={`${entry.company}-${entry.role}`}
            className="surface-card rounded-[2rem] p-6 sm:p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-3xl font-semibold tracking-[-0.05em] text-white">
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
              <span className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
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
                  className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 transition-colors duration-300 hover:border-[var(--accent)]/30"
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
