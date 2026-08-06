import { AutoScrollButton } from "@/components/AutoScrollButton";
import { EtchBackground } from "@/components/EtchBackground";
import { GlassButton, SigilFill } from "@/components/GlassButton";
import { caseStudies, pillars, siteContent } from "@/data/site-content";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <section className="section-blend relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center sm:px-8">
        <EtchBackground image="/bg/hero.png" />
        <div className="relative z-10 mx-auto max-w-4xl">
          <h1
            className="load-in font-noir noir-title mt-6 text-[clamp(2.75rem,9vw,6rem)] leading-[0.95]"
            style={{ "--load-in-delay": "0s" } as React.CSSProperties}
          >
            AI-engineered
          </h1>
          <p
            className="load-in font-typewriter mx-auto mt-8 max-w-2xl text-sm leading-8 text-[var(--muted)] sm:text-base"
            style={{ "--load-in-delay": "0.1s" } as React.CSSProperties}
          >
            engineered with Actual Intelligence
          </p>
          <div
            className="load-in mt-10 flex flex-wrap items-center justify-center gap-4"
            style={{ "--load-in-delay": "0.2s" } as React.CSSProperties}
          >
            <GlassButton href="#contact">contact</GlassButton>
          </div>
        </div>

        <AutoScrollButton />
      </section>

      {pillars.map((pillar, i) => {
        const study = caseStudies.find((c) => c.slug === pillar.caseStudySlug);
        return (
          <section
            key={pillar.id}
            id={pillar.id}
            className="section-blend relative flex min-h-screen flex-col justify-center overflow-hidden px-6 py-24 sm:px-8 lg:px-12"
          >
            <EtchBackground image={`/bg/${pillar.id}.png`} />
            <div className="relative z-10 mx-auto w-full max-w-6xl">
              <p className="font-typewriter text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                {String(i + 1).padStart(2, "0")}/{String(pillars.length).padStart(2, "0")}| {pillar.title}
                <span className="type-cursor">▎</span>
              </p>

              <div
                className={`mt-8 grid gap-6 sm:items-start sm:gap-10 ${
                  study?.metrics.length ? "sm:grid-cols-[1fr_1fr_auto]" : "sm:grid-cols-2"
                }`}
              >
                <p className="font-typewriter max-w-xl text-sm leading-7 text-[var(--muted)] sm:text-base">
                  {pillar.description}
                </p>

                {study && study.metrics.length > 0 && (
                  <div className="order-2 flex flex-col justify-center sm:order-3 sm:px-4">
                    <p className="font-noir noir-title text-5xl leading-none">
                      {study.metrics[0].value}
                    </p>
                    <p className="font-typewriter mt-2 max-w-[16ch] text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                      {study.metrics[0].label}
                    </p>
                  </div>
                )}

                {study && (
                  <div className="relative order-3 flex flex-col gap-4 overflow-hidden rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.02] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-2xl backdrop-saturate-200 sm:order-2">
                    <SigilFill />
                    <p className="font-noir noir-title text-lg leading-none">{study.title}</p>
                    <div>
                      <GlassButton href={`/work/${study.slug}`} sigil={false}>
                        read case study →
                      </GlassButton>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}

      <section
        id="contact"
        className="section-blend relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24 text-center sm:px-8"
      >
        <div className="relative z-10 mx-auto w-full max-w-xl">
          <h2 className="font-noir noir-title text-3xl leading-none sm:text-4xl">
            have a project in mind?
          </h2>
          <p className="font-typewriter mt-6 text-sm leading-7 text-[var(--muted)] sm:text-base">
            Whether it&apos;s a site, an AI system, or an automation, let&apos;s build something that actually works.
          </p>
          <div className="mt-10 flex justify-center px-2">
            <GlassButton href={`mailto:${siteContent.email}`}>
              <span className="break-all">{siteContent.email}</span>
            </GlassButton>
          </div>
        </div>
      </section>
    </main>
  );
}
