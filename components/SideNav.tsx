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
    <nav className="fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-end gap-5 lg:flex">
      {sections.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          className={`group flex items-center gap-3 transition-all duration-300 ${
            active === id ? "opacity-100" : "opacity-25 hover:opacity-60"
          }`}
        >
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.12em] transition-colors duration-300 ${
              active === id ? "text-white" : "text-[var(--muted)]"
            }`}
          >
            {label}
          </span>
          <span
            className={`block h-px rounded-full transition-all duration-300 ${
              active === id ? "w-5 bg-white" : "w-2 bg-[var(--muted)] group-hover:w-3"
            }`}
          />
        </a>
      ))}
    </nav>
  );
}
