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
    <nav className="fixed right-5 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex">
      {sections.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          className="group relative flex items-center justify-end"
        >
          <span className="pointer-events-none absolute right-4 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--foreground)] opacity-0 transition-opacity duration-200 group-hover:opacity-70">
            {label}
          </span>
          <span
            className={`block rounded-full transition-all duration-300 ${
              active === id
                ? "h-3 w-3 bg-white"
                : "h-2.5 w-2.5 bg-[var(--muted)] opacity-30 group-hover:opacity-60"
            }`}
          />
        </a>
      ))}
    </nav>
  );
}
