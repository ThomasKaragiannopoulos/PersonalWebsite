"use client";

import { RevealSection } from "@/components/Reveal";
import { skillGroups } from "@/data/site-content";

export function Skills() {
  return (
    <RevealSection id="skills" className="section-divider scroll-mt-24 py-20 sm:py-24">
      <div className="mb-12 max-w-3xl pt-10">
        <h2 className="section-title text-white">Skills</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {skillGroups.map((group) => (
          <div key={group.title} className="surface-card rounded-xl p-6 sm:p-7">
            <h3 className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              {group.title}
            </h3>
            <div className="mt-5 flex flex-wrap gap-3">
              {group.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/8 bg-transparent px-4 py-1.5 text-sm text-[var(--foreground)]/70 transition-colors duration-300 hover:border-white/20 hover:text-[var(--foreground)]"
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
