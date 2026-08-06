import Link from "next/link";
import type { ReactNode } from "react";

const SHARED_CLASSES =
  "font-typewriter relative inline-flex items-center overflow-hidden rounded-full px-6 py-3 text-sm transition-all duration-300";

// Sigil buttons keep the frosted-glass look, with the backdrop saturation the
// sigil color needs to show through, plus the black-outlined noir-title text
// treatment for legibility against the varied art behind them. Plain buttons
// are a solid glossy gray — no transparency, no outline, just plain white text.
const GLASS_TINTED =
  "noir-title bg-gradient-to-b from-white/10 to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.25),0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-200 hover:from-white/15";
const GLOSSY_GRAY =
  "text-white bg-gradient-to-b from-[#5a5a5a] to-[#2c2c2c] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.5),0_8px_24px_rgba(0,0,0,0.4)] hover:from-[#666]";

export function SigilFill() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 -z-10 bg-[url('/sigil.png')] bg-no-repeat mix-blend-screen"
      style={{
        backgroundSize: "400% auto",
        backgroundPosition: "center",
        filter: "invert(1) sepia(1) hue-rotate(142deg) saturate(8) brightness(1.3) contrast(1.4)",
      }}
    />
  );
}

type GlassButtonProps = {
  href: string;
  children: ReactNode;
  external?: boolean;
  sigil?: boolean;
};

export function GlassButton({ href, children, external, sigil = true }: GlassButtonProps) {
  const className = `${SHARED_CLASSES} ${sigil ? GLASS_TINTED : GLOSSY_GRAY}`;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {sigil && <SigilFill />}
        {children}
      </a>
    );
  }

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {sigil && <SigilFill />}
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className}>
      {sigil && <SigilFill />}
      {children}
    </a>
  );
}
