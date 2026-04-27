const leftLinks = [
  { label: "Home", href: "#home" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
] as const;

const rightLinks = [
  { label: "Skills", href: "#skills" },
  { label: "Training Data", href: "#education" },
  { label: "Contact", href: "#contact" },
] as const;

function FooterLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="text-sm font-medium text-white/68 transition-colors hover:text-white"
    >
      {label}
    </a>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-[var(--background)]">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:px-12">
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 md:flex-nowrap md:gap-x-12"
        >
          {leftLinks.map((link) => (
            <FooterLink key={link.label} {...link} />
          ))}
          <a
            href="#home"
            aria-label="Back to top"
            className="inline-flex items-center justify-center text-2xl transition-transform hover:scale-[1.04]"
          >
            <span aria-hidden="true">🤗</span>
          </a>
          {rightLinks.map((link) => (
            <FooterLink key={link.label} {...link} />
          ))}
        </nav>
      </div>
    </footer>
  );
}
