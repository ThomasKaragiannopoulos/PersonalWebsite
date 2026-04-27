import { Contact } from "@/components/Contact";
import { Education } from "@/components/Education";
import { Experience } from "@/components/Experience";
import { Hero } from "@/components/Hero";
import { Projects } from "@/components/Projects";
import { Skills } from "@/components/Skills";

export default function Home() {
  return (
    <main className="overflow-x-clip">
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
