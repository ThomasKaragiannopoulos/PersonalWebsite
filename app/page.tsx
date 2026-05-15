import { NeuralCloudSection } from "@/components/NeuralCloudSection";
import { NeuralCloudWrapper } from "@/components/NeuralCloudWrapper";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Sandbox - full screen */}
      <section id="sandbox" className="relative h-screen w-full overflow-hidden bg-black">
        <NeuralCloudWrapper />
      </section>

      {/* Web Design */}
      <section
        id="web-design"
        className="relative flex min-h-screen flex-col justify-center overflow-hidden border-t border-white/8 px-6 sm:px-8 lg:px-12"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 10% 80%, rgba(0,180,255,0.07) 0%, transparent 70%)",
        }}
      >
        <NeuralCloudSection imageSrc="/SectionA.png" alphaSrc="/Section1Alpha.png" />
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <h2 className="font-mono text-[2.7rem] font-normal text-white sm:text-[4.05rem]">
            Web Design<span className="cursor">|</span>
          </h2>
          <h3 className="mt-4 max-w-2xl font-mono text-sm leading-6 tracking-wide text-white/60">
            Fast, modern sites<br />built to convert.
          </h3>
        </div>
      </section>

      {/* AI Systems */}
      <section
        id="ai-systems"
        className="relative flex min-h-screen flex-col justify-center overflow-hidden border-t border-white/8 px-6 sm:px-8 lg:px-12"
        style={{
          background:
            "radial-gradient(ellipse 65% 45% at 85% 20%, rgba(0,180,255,0.08) 0%, transparent 70%)",
        }}
      >
        <NeuralCloudSection imageSrc="/SectionB.png" alphaSrc="/SectionBAlpha.png" />
        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-end">
          <h2 className="font-mono text-[2.7rem] font-normal text-white sm:text-[4.05rem]">
            AI Systems<span className="cursor">|</span>
          </h2>
          <h3 className="mt-4 max-w-2xl font-mono text-sm leading-6 tracking-wide text-white/60">
            Custom AI pipelines, agents, and integrations<br />built for real business problems.
          </h3>
        </div>
      </section>

      {/* Automations */}
      <section
        id="automations"
        className="relative flex min-h-screen flex-col justify-center overflow-hidden border-t border-white/8 px-6 sm:px-8 lg:px-12"
        style={{
          background:
            "radial-gradient(ellipse 68% 48% at 15% 25%, rgba(0,180,255,0.08) 0%, transparent 72%)",
        }}
      >
        <NeuralCloudSection imageSrc="/SectionC.png" alphaSrc="/SectionCAlpha.png" />
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <h2 className="font-mono text-[2.7rem] font-normal text-white sm:text-[4.05rem]">
            Automations<span className="cursor">|</span>
          </h2>
          <h3 className="mt-4 max-w-2xl font-mono text-sm leading-6 tracking-wide text-white/60">
            Workflows, triggers, data pipelines —<br />quietly running in the background<br />so you don&apos;t have to.
          </h3>
        </div>
      </section>

      {/* Contact */}
      <section
        id="contact"
        className="relative flex min-h-screen flex-col items-center justify-center border-t border-white/8 px-6 text-center sm:px-8 lg:px-12"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(0,180,255,0.07) 0%, transparent 70%)",
        }}
      >
        <NeuralCloudSection />
        <div className="relative z-10 mx-auto max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Contact
          </p>
          <h2 className="font-display mt-6 text-[2.025rem] font-normal text-white sm:text-[2.7rem]">
            Have a project in mind?
          </h2>
          <p className="mt-6 font-mono text-sm leading-7 tracking-wide text-white/60">
            Whether it&apos;s a site, an AI system, or an automation —<br />
            let&apos;s build something that actually works.
          </p>
          <a
            href="mailto:thom@skaragiannopoulos.com"
            className="mt-10 inline-block font-mono text-sm tracking-wide text-white underline-offset-4 hover:underline"
          >
            thom@skaragiannopoulos.com
          </a>
        </div>
      </section>
    </main>
  );
}
