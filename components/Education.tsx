"use client";

import { RevealSection } from "@/components/Reveal";
import { education } from "@/data/site-content";

export function Education() {
  return (
    <RevealSection
      id="education"
      className="section-divider scroll-mt-24 py-20 sm:py-24"
    >
      <div className="mb-12 max-w-3xl pt-10">
        <p className="section-kicker">Education</p>
        <h2 className="section-title mt-4 text-white">
          Research-led training with one foot in applied systems and one in product work.
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {education.map((entry) => (
          <article
            key={`${entry.degree}-${entry.year}`}
            className="surface-card rounded-[2rem] p-6 sm:p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-3xl font-semibold tracking-[-0.05em] text-white">
                  {entry.degree}
                </h3>
                <p className="mt-2 text-lg text-[var(--muted)]">
                  {entry.institution} | {entry.year}
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                {entry.year}
              </span>
            </div>

            <div className="mt-6 rounded-3xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent)]">
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
        ))}
      </div>
    </RevealSection>
  );
}
