import { Contact } from "@/components/Contact";
import { Education } from "@/components/Education";
import { Experience } from "@/components/Experience";
import { Hero } from "@/components/Hero";
import { Projects } from "@/components/Projects";
import { Skills } from "@/components/Skills";

export default function Home() {
  return (
    <main className="relative overflow-x-clip">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-12rem] top-12 h-72 w-72 rounded-full bg-[var(--accent-soft)] blur-3xl" />
        <div className="absolute right-[-10rem] top-[28rem] h-80 w-80 rounded-full bg-[rgba(255,184,107,0.12)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-10 sm:px-8 lg:px-12">
        <Hero />
        <Experience />
        <Projects />
        <Skills />
        <Education />
        <Contact />
      </div>
    </main>
  );
}
