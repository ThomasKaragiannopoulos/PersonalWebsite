import { NeuralLoopSection } from "@/components/NeuralLoopSection";

const SECTION_LOOP_SRC = "/neural-loop.mp4";
const SECTION_LOOP_RATE = 1;

export default function Home() {
  return (
    <main className="neural-cursor flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <section id="sandbox" className="neural-cursor relative h-screen w-full overflow-hidden bg-black animate-[fadeIn_1.2s_ease-out_0.4s_both]">
        <NeuralLoopSection
          imageSrc="/Section0.png"
          alphaSrc="/Section0Alpha.png"
          videoSrc={SECTION_LOOP_SRC}
          playbackRate={SECTION_LOOP_RATE}
          showTopBlend={false}
          showBottomBlend
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden px-[16%] text-center sm:px-[20%]">
          <div className="flex h-[36vh] max-h-[24rem] min-h-[14rem] flex-col items-center justify-between py-[8vh] sm:h-[42vh] sm:max-h-[30rem] sm:min-h-[18rem] sm:py-[10vh]">
          <span className="font-mono text-[clamp(2.03rem,9.1vw,4.2rem)] font-bold uppercase tracking-widest text-white sm:text-[clamp(0.9rem,3.325vw,3rem)]">
            AI-engineered
          </span>
          <span className="font-mono text-[clamp(0.77rem,2.66vw,1.19rem)] font-bold uppercase tracking-[1em] text-white sm:text-[clamp(0.45rem,0.92vw,0.85rem)] sm:tracking-[1.3em]">
            AI done right
          </span>
          <a
            href="#contact"
            className="pointer-events-auto border border-white/40 bg-white/[0.02] px-[clamp(0.7rem,3vw,2rem)] py-[clamp(0.32rem,1vw,0.6rem)] font-mono text-[clamp(0.7rem,2.45vw,1.05rem)] uppercase tracking-[0.25em] text-white backdrop-blur-sm transition-all hover:border-white/80 hover:bg-white/10 hover:text-white sm:px-[clamp(0.5rem,2vw,2rem)] sm:py-[clamp(0.25rem,0.5vw,0.6rem)] sm:text-[clamp(0.4rem,0.7vw,0.75rem)] sm:tracking-[0.3em]"
          >
            [ CONTACT ]
          </a>
          </div>
        </div>
      </section>

      <section
        id="web-design"
        className="neural-cursor relative mt-20 flex min-h-screen flex-col justify-center overflow-hidden px-6 sm:mt-24 sm:px-8 lg:px-12"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 10% 80%, rgba(0,180,255,0.07) 0%, transparent 70%)",
        }}
      >
        <NeuralLoopSection imageSrc="/SectionA.png" alphaSrc="/Section1Alpha.png" videoSrc={SECTION_LOOP_SRC} playbackRate={SECTION_LOOP_RATE} />
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <h2 className="font-mono text-[2.7rem] font-normal text-white sm:text-[4.05rem]">
            Web Design<span className="cursor">|</span>
          </h2>
          <h3 className="mt-4 max-w-2xl font-mono text-sm leading-6 tracking-wide text-white">
            Fast, modern sites<br />built to convert.
          </h3>
        </div>
      </section>

      <section
        id="ai-systems"
        className="neural-cursor relative mt-20 flex min-h-screen flex-col justify-center overflow-hidden px-6 sm:mt-24 sm:px-8 lg:px-12"
        style={{
          background:
            "radial-gradient(ellipse 65% 45% at 85% 20%, rgba(0,180,255,0.08) 0%, transparent 70%)",
        }}
      >
        <NeuralLoopSection imageSrc="/SectionB.png" alphaSrc="/SectionBAlpha.png" videoSrc={SECTION_LOOP_SRC} playbackRate={SECTION_LOOP_RATE} flipX />
        <div className="relative z-10 mx-auto flex w-full max-w-7xl justify-end">
          <div className="flex flex-col items-start">
          <h2 className="font-mono text-[2.7rem] font-normal text-white sm:text-[4.05rem]">
            AI Systems<span className="cursor">|</span>
          </h2>
          <h3 className="mt-4 max-w-2xl font-mono text-sm leading-6 tracking-wide text-white">
            Custom AI pipelines, agents, and integrations<br />built for real business problems.
          </h3>
          </div>
        </div>
      </section>

      <section
        id="automations"
        className="neural-cursor relative mt-20 flex min-h-screen flex-col justify-center overflow-hidden px-6 sm:mt-24 sm:px-8 lg:px-12"
        style={{
          background:
            "radial-gradient(ellipse 68% 48% at 15% 25%, rgba(0,180,255,0.08) 0%, transparent 72%)",
        }}
      >
        <NeuralLoopSection imageSrc="/SectionC.png" alphaSrc="/SectionCAlpha.png" videoSrc={SECTION_LOOP_SRC} playbackRate={SECTION_LOOP_RATE} flipY />
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <h2 className="font-mono text-[clamp(2.2rem,8vw,4.05rem)] font-normal leading-none text-white">
            Automations<span className="cursor">|</span>
          </h2>
          <h3 className="mt-4 max-w-2xl font-mono text-sm leading-6 tracking-wide text-white">
            Workflows, triggers, data pipelines &mdash;<br />quietly running in the background<br />so you don&apos;t have to.
          </h3>
        </div>
      </section>

      <section
        id="contact"
        className="neural-cursor relative mt-20 flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center sm:mt-24 sm:px-8 lg:px-12"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(0,180,255,0.07) 0%, transparent 70%)",
        }}
      >
        <NeuralLoopSection videoSrc={SECTION_LOOP_SRC} playbackRate={SECTION_LOOP_RATE} flipX flipY />
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="font-display mt-6 text-[2.025rem] font-normal text-white sm:text-[2.7rem]">
            Have a project in mind?
          </h2>
          <p className="mt-6 font-mono text-sm leading-7 tracking-wide text-white">
            Whether it&apos;s a site, an AI system, or an automation &mdash;<br />
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
