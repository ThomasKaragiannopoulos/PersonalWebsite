import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

const pp1Theme = {
  "--accent": "#20c997",
  "--accent-soft": "rgba(32, 201, 151, 0.14)",
  "--accent-glow": "rgba(32, 201, 151, 0.28)",
} as CSSProperties;

const navItems = [
  { href: "/pp1", label: "Overview" },
  { href: "/pp1/chat", label: "Chat" },
  { href: "/pp1/keys", label: "Keys" },
  { href: "/pp1/tenants", label: "Tenants" },
] as const;

export default function PP1Layout({ children }: { children: ReactNode }) {
  return (
    <div className="pp1-shell min-h-screen bg-[var(--background)]" style={pp1Theme}>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-[#0f0f0f]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-6 py-3 sm:px-8 lg:px-12">
          <Link href="/pp1" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] font-mono text-sm text-[var(--accent)]">
              PP1
            </div>
            <div>
              <p className="font-display text-xl text-white">LLM Gateway</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                Control plane
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/#projects"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:border-white/20 hover:text-white"
            >
              ← Portfolio
            </Link>
          </div>

          <nav className="flex w-full flex-wrap items-center gap-4 text-sm text-[var(--muted)] lg:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="overflow-x-clip pt-14">
        {children}
      </main>
      <footer className="border-t border-white/8 bg-[rgba(8,12,12,0.88)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 sm:px-8 lg:px-12">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
              PP1
            </p>
            <p className="mt-2 text-sm text-[var(--foreground)]/72">
              Frontend migrated into the portfolio shell. Backend remains separate.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-[var(--muted)]">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-white">
                {item.label}
              </Link>
            ))}
            <Link href="/#projects" className="text-[var(--accent)] transition-colors hover:text-white">
              Personal website
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
