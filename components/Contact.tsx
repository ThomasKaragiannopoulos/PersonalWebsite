"use client";

import { RevealItem, RevealList, RevealSection } from "@/components/Reveal";
import { siteContent } from "@/data/site-content";

export function Contact() {
  return (
    <RevealSection id="contact" className="section-divider scroll-mt-16 pb-20 sm:pb-24">
      <div className="pt-12 sm:pt-16">
        <RevealList>
          <RevealItem>
            <div className="surface-card rounded-xl p-8 sm:p-10">
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_auto] lg:items-end">
                <div>
                  <h2 className="section-title text-white">Get in touch</h2>
                  <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted)]">
                    Open to AI engineering roles, product-heavy teams, and difficult systems
                    problems. Email is the best first contact.
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
                    className="inline-flex items-center rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                  >
                    Download CV
                  </a>
                </div>
              </div>
            </div>
          </RevealItem>
        </RevealList>
      </div>
    </RevealSection>
  );
}
