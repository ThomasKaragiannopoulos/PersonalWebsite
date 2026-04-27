"use client";

import { RevealSection } from "@/components/Reveal";
import { skillGroups } from "@/data/site-content";

export function Skills() {
  return (
    <RevealSection id="skills" className="section-divider scroll-mt-24 py-20 sm:py-24">
      <div className="mb-12 max-w-3xl pt-10">
        <p className="section-kicker">Skills</p>
        <h2 className="section-title mt-4 text-white">
          Tools and systems I rely on when the problem is real, not toy-sized.
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {skillGroups.map((group) => (
          <div key={group.title} className="surface-card rounded-[2rem] p-6 sm:p-7">
            <h3 className="font-display text-2xl font-semibold tracking-[-0.04em] text-white">
              {group.title}
            </h3>
            <div className="mt-5 flex flex-wrap gap-3">
              {group.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[var(--foreground)]/85 transition-colors duration-300 hover:border-[var(--accent)]/30 hover:bg-[var(--accent-soft)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </RevealSection>
  );
}
