import { siteContent } from "@/data/site-content";

export function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-[#0f0f0f]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-3 sm:px-8 lg:px-12">
        <a href="#home" className="flex shrink-0 items-center gap-2">
          <span className="text-xl leading-none">🤗</span>
          <span className="font-mono text-sm text-[var(--muted)] transition-colors hover:text-white">
            Thomas K.
          </span>
        </a>

        <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] lg:flex">
          <a href="#home" className="transition-colors hover:text-white">Home</a>
          <a href="#experience" className="transition-colors hover:text-white">Experience</a>
          <a href="#projects" className="transition-colors hover:text-white">Projects</a>
          <a href="#skills" className="transition-colors hover:text-white">Skills</a>
          <a href="#education" className="transition-colors hover:text-white">Training Data</a>
          <a href="#contact" className="transition-colors hover:text-white">Contact</a>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <a
            href={siteContent.linkedin}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:border-white/20 hover:text-white"
          >
            LinkedIn
          </a>
          <a
            href={`mailto:${siteContent.email}`}
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            Email
          </a>
        </div>
      </div>
    </header>
  );
}
