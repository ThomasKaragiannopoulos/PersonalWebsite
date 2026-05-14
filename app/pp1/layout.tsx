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
    <div className="min-h-screen">
      <div className="fixed left-0 right-0 top-0 z-40 border-b border-white/8 bg-[#0f0f0f]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-2 sm:px-8 lg:px-12">
          <nav className="flex flex-wrap items-center gap-6 text-sm text-[var(--muted)]">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <main className="overflow-x-clip pt-12" style={pp1Theme}>
        {children}
      </main>
    </div>
  );
}
