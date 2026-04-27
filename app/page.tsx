import { Contact } from "@/components/Contact";
import { Education } from "@/components/Education";
import { Experience } from "@/components/Experience";
import { Hero } from "@/components/Hero";
import { Projects } from "@/components/Projects";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Skills } from "@/components/Skills";

export default function Home() {
  return (
    <main className="overflow-x-clip">
      <SiteHeader />
      <div className="relative mx-auto w-full max-w-7xl px-6 pb-10 pt-14 sm:px-8 lg:px-12">
        <Hero />
        <Experience />
        <Projects />
        <Skills />
        <Education />
        <Contact />
      </div>
      <SiteFooter />
    </main>
  );
}
