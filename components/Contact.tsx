"use client";

import { RevealSection } from "@/components/Reveal";
import { siteContent } from "@/data/site-content";

export function Contact() {
  return (
    <RevealSection id="contact" className="section-divider scroll-mt-24 py-20 sm:py-24">
      <div className="surface-card rounded-[2rem] p-8 sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_auto] lg:items-end">
          <div>
            <p className="section-kicker">Contact</p>
            <h2 className="section-title mt-4 text-white">
              Open to ambitious AI engineering work, product-heavy teams, and difficult systems problems.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted)]">
              Best first contact is email. LinkedIn is active, and the CV download is mirrored
              here for job applications and recruiter outreach.
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:items-end">
            <a
              href={`mailto:${siteContent.email}`}
              className="text-lg font-semibold text-white transition-colors hover:text-[var(--accent)]"
            >
              {siteContent.email}
            </a>
            <a
              href={siteContent.linkedin}
              target="_blank"
              rel="noreferrer"
              className="text-sm uppercase tracking-[0.22em] text-[var(--muted)] transition-colors hover:text-white"
            >
              LinkedIn
            </a>
            <a
              href={siteContent.cvPath}
              download
              className="inline-flex items-center rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-[var(--accent)] hover:bg-[rgba(107,166,255,0.22)]"
            >
              Download CV
            </a>
          </div>
        </div>

        <footer className="mt-12 flex flex-col gap-3 border-t border-white/8 pt-6 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>{siteContent.name}</p>
          <p>{new Date().getFullYear()}</p>
        </footer>
      </div>
    </RevealSection>
  );
}
