"use client";

import { motion } from "framer-motion";
import { HoverCard, RevealItem, RevealList, RevealSection } from "@/components/Reveal";
import { projects } from "@/data/site-content";

const bulletList = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.04,
    },
  },
};

const bulletItem = {
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

export function Projects() {
  return (
    <RevealSection id="projects" className="section-divider scroll-mt-16 pb-20 sm:pb-24">
      <div className="mb-12 max-w-3xl pt-12 sm:pt-16">
        <h2 className="section-title text-white">Projects</h2>
      </div>

      <RevealList className="grid gap-6 lg:grid-cols-3">
        {projects.map((project) => (
          <RevealItem key={project.name}>
            <HoverCard
              className={`surface-card relative overflow-hidden rounded-xl p-6 sm:p-7 ${
                project.isLocked ? "before:absolute before:inset-0 before:bg-[rgba(7,9,13,0.46)] before:backdrop-blur-[2px]" : ""
              }`}
            >
              {project.isLocked ? (
                <div className="pointer-events-none absolute right-5 top-5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
                  Locked
                </div>
              ) : null}

              <div className={`relative ${project.isLocked ? "blur-[1.8px]" : ""}`}>
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                  {project.subtitle}
                </p>
                <h3 className="mt-4 font-display text-2xl font-normal text-white">
                  {project.name}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[var(--foreground)]/80">
                  {project.description}
                </p>

                <motion.ul
                  className="mt-6 space-y-3 text-sm leading-7 text-[var(--muted)]"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: false, amount: 0.45 }}
                  variants={bulletList}
                >
                  {project.bullets.map((bullet) => (
                    <motion.li key={bullet} className="flex gap-3" variants={bulletItem}>
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                      <span>{bullet}</span>
                    </motion.li>
                  ))}
                </motion.ul>
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
          </RevealItem>
        ))}
      </RevealList>
    </RevealSection>
  );
}
