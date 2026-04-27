"use client";

import { motion } from "framer-motion";
import { siteContent } from "@/data/site-content";

const heroItems = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.12,
    },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function Hero() {
  return (
    <section id="home" className="flex min-h-screen items-center py-24">
      <motion.div
        className="grid w-full gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-end"
        variants={heroItems}
        initial="hidden"
        animate="visible"
      >
        <div className="space-y-8">
          <motion.div variants={heroItem} className="space-y-5">
            <h1 className="font-display max-w-5xl text-4xl font-normal text-white sm:text-5xl lg:text-7xl">
              {siteContent.name}
            </h1>
            <p className="max-w-3xl text-lg text-[var(--muted)] sm:text-xl">
              {siteContent.title}
            </p>
          </motion.div>

          <motion.p
            variants={heroItem}
            className="max-w-2xl text-base leading-8 text-[var(--foreground)]/75 sm:text-lg"
          >
            {siteContent.pitch}
          </motion.p>

          <motion.div
            variants={heroItem}
            className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[var(--muted)] sm:text-base"
          >
            <a
              href={`mailto:${siteContent.email}`}
              className="transition-colors hover:text-white"
            >
              Email
            </a>
            <span className="hidden text-[var(--border)] sm:inline">/</span>
            <a
              href={siteContent.linkedin}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white"
            >
              LinkedIn
            </a>
          </motion.div>

          <motion.div variants={heroItem} className="flex flex-wrap gap-4">
            <a
              href={siteContent.cvPath}
              download
              className="inline-flex items-center rounded-full border border-[var(--accent)] bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-slate-950 transition-transform duration-300 hover:-translate-y-0.5"
            >
              Download CV
            </a>
            <a
              href="#experience"
              className="inline-flex items-center rounded-full border border-white/12 bg-white/4 px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:border-white/25 hover:bg-white/8"
            >
              View experience
            </a>
          </motion.div>
        </div>

        <motion.div variants={heroItem} className="surface-card rounded-xl p-7 sm:p-8">
          <div className="mb-8 flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Current Focus</span>
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          </div>

          <div className="space-y-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                Specialisation
              </p>
              <p className="mt-2 font-display text-lg font-normal text-white">
                Retrieval-heavy AI systems with production constraints
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Stat value="24" label="EU languages in production translation flow" />
              <Stat value="+23%" label="F1 gain on semantic matching pipeline" />
              <Stat value="92%" label="Query satisfaction on planning assistant pilot" />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.03] p-4">
      <p className="font-display text-xl font-normal text-white">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{label}</p>
    </div>
  );
}
