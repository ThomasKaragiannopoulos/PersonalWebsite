"use client";

import { useEffect, useRef } from "react";

const SCROLL_SPEED_PX_PER_SEC = 90;
const RAMP_SEC = 0.8; // ease-in at the start, ease-out over the same distance near the bottom
const INTERRUPT_EVENTS = ["wheel", "touchstart", "pointerdown", "keydown"] as const;

function easeInOut(t: number) {
  // smoothstep, used for both the ramp-up and ramp-down windows
  return t * t * (3 - 2 * t);
}

export function AutoScrollButton() {
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const startTsRef = useRef<number | null>(null);
  const posRef = useRef(0);

  useEffect(() => {
    return () => stop();
  }, []);

  function stop() {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = null;
    startTsRef.current = null;
    INTERRUPT_EVENTS.forEach((event) => window.removeEventListener(event, stop));
  }

  function tick(ts: number) {
    if (lastTsRef.current === null) lastTsRef.current = ts;
    if (startTsRef.current === null) startTsRef.current = ts;
    const deltaSec = (ts - lastTsRef.current) / 1000;
    lastTsRef.current = ts;

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const remaining = maxScroll - posRef.current;
    if (remaining <= 0.5) {
      stop();
      return;
    }

    const elapsedSec = (ts - startTsRef.current) / 1000;
    const rampInFactor = Math.min(1, easeInOut(Math.min(1, elapsedSec / RAMP_SEC)));
    const rampOutDistance = SCROLL_SPEED_PX_PER_SEC * RAMP_SEC;
    const rampOutFactor =
      remaining < rampOutDistance ? Math.max(0.05, easeInOut(remaining / rampOutDistance)) : 1;

    const speed = SCROLL_SPEED_PX_PER_SEC * Math.min(rampInFactor, rampOutFactor);
    posRef.current = Math.min(maxScroll, posRef.current + speed * deltaSec);
    window.scrollTo({ top: posRef.current, left: 0, behavior: "instant" });
    rafRef.current = requestAnimationFrame(tick);
  }

  function start() {
    stop();
    posRef.current = window.scrollY;
    INTERRUPT_EVENTS.forEach((event) => window.addEventListener(event, stop, { passive: true }));
    rafRef.current = requestAnimationFrame(tick);
  }

  return (
    <button
      type="button"
      onClick={start}
      aria-label="Slowly scroll to the bottom of the page"
      className="noir-title group absolute bottom-8 right-8 z-10 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-white/10 to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.25),0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-200 transition-all duration-300 hover:from-white/15"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[url('/sigil.png')] bg-no-repeat mix-blend-screen"
        style={{
          backgroundSize: "400% auto",
          backgroundPosition: "center",
          filter: "invert(1) sepia(1) hue-rotate(142deg) saturate(8) brightness(1.3) contrast(1.4)",
        }}
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="noir-outline h-5 w-5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0-6-6m6 6 6-6" />
      </svg>
    </button>
  );
}
