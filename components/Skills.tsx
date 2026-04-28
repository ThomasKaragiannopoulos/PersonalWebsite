"use client";

import { motion } from "framer-motion";
import { RevealItem, RevealList, RevealSection } from "@/components/Reveal";
import { skillGroups } from "@/data/site-content";

const tagList = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.06,
    },
  },
};

const tagItem = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function Skills() {
  return (
    <RevealSection id="skills" className="section-divider scroll-mt-16 pb-20 sm:pb-24">
      <div className="pt-12 sm:pt-16">
        <div className="mb-12 max-w-3xl">
          <h2 className="section-title text-white">Skills</h2>
        </div>

        <RevealList className="space-y-4">
          {skillGroups.map((group, index) => (
            <RevealItem key={group.title} transition={{ delay: index * 0.03 }}>
              <article className="surface-card relative overflow-hidden rounded-xl p-5 sm:p-6">
                <div className="absolute inset-y-0 left-0 w-px bg-white/8" />
                <div className="absolute left-0 top-0 h-16 w-1 bg-[var(--accent)]" />

                <div className="relative flex flex-col gap-6 pl-4 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 md:pl-6">
                  <div className="flex items-start justify-between gap-4 md:block">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 className="mt-3 font-display text-xl font-normal text-white">
                        {group.title}
                      </h3>
                    </div>

                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                      {group.items.length} tools
                    </span>
                  </div>

                  <motion.div
                    className="flex flex-wrap gap-2.5 md:content-start"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, amount: 0.45 }}
                    variants={tagList}
                  >
                    {group.items.map((item) => (
                      <motion.span
                        key={item}
                        variants={tagItem}
                        className="rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-1.5 text-sm text-[var(--foreground)]/78"
                      >
                        {item}
                      </motion.span>
                    ))}
                  </motion.div>
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealList>
      </div>
    </RevealSection>
  );
}
