"use client";

import { useEffect, useState } from "react";

const sections = [
  { id: "home", label: "Home" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
];

export function SideNav() {
  const [active, setActive] = useState("home");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
      );

      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <nav className="fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 lg:flex xl:right-8">
      <div className="relative flex flex-col items-center gap-5">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/10" />
        {sections.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={active === id ? "true" : undefined}
            className="group relative flex items-center justify-end"
          >
            <span className="pointer-events-none absolute right-5 whitespace-nowrap rounded-full border border-white/10 bg-[rgba(10,10,10,0.92)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--foreground)] opacity-0 shadow-[0_10px_30px_rgba(0,0,0,0.28)] transition-opacity duration-200 group-hover:opacity-100">
              {label}
            </span>
            <span
              className={`relative z-10 block rounded-full transition-all duration-300 ${
                active === id
                  ? "h-2.5 w-2.5 bg-[var(--accent)] shadow-[0_0_18px_var(--accent-glow)]"
                  : "h-2 w-2 bg-[var(--muted)] opacity-30 group-hover:opacity-65"
              }`}
            />
          </a>
        ))}
      </div>
    </nav>
  );
}
