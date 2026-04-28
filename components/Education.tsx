"use client";

import { RevealItem, RevealList, RevealSection } from "@/components/Reveal";
import { education } from "@/data/site-content";

export function Education() {
  return (
    <RevealSection
      id="education"
      className="section-divider scroll-mt-16 pb-20 sm:pb-24"
    >
      <div className="mb-12 max-w-3xl pt-12 sm:pt-16">
        <h2 className="section-title text-white">Education</h2>
      </div>

      <RevealList className="grid gap-6 lg:grid-cols-2">
        {education.map((entry) => (
          <RevealItem key={`${entry.degree}-${entry.year}`}>
            <article className="surface-card rounded-xl p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl font-normal text-white">
                    {entry.degree}
                  </h3>
                  <p className="mt-2 text-lg text-[var(--muted)]">
                    {entry.institution} | {entry.year}
                  </p>
                </div>
                <span className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--muted)]">
                  {entry.year}
                </span>
              </div>

              <div className="mt-6 rounded-lg border border-white/8 bg-white/[0.03] p-4">
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--muted)]">
                  Thesis
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground)]/84">
                  {entry.thesis}
                </p>
              </div>

              {"notes" in entry ? (
                <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
                  {entry.notes}
                </p>
              ) : null}
            </article>
          </RevealItem>
        ))}
      </RevealList>
    </RevealSection>
  );
}
