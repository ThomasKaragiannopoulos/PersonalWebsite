'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [contentOut, setContentOut] = useState(false);
  const [overlayOut, setOverlayOut] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let prog = 0;
    let finishTimeouts: number[] = [];
    const interval = setInterval(() => {
      prog += Math.random() * 3 + 1.2;
      if (prog >= 88) {
        prog = 88;
        clearInterval(interval);
      }
      setProgress(prog);
    }, 120);

    function finish() {
      clearInterval(interval);

      const remaining = 100 - prog;
      const finalSteps = 10;
      const stepSize = remaining / finalSteps;

      for (let step = 1; step <= finalSteps; step += 1) {
        const timeoutId = window.setTimeout(() => {
          const nextProgress = step === finalSteps ? 100 : Math.min(100, prog + stepSize * step);
          setProgress(nextProgress);
        }, step * 110);

        finishTimeouts.push(timeoutId);
      }

      const afterFullRevealDelay = finalSteps * 110 + 500;
      const contentOutTimer = window.setTimeout(() => {
        setContentOut(true);
      }, afterFullRevealDelay);

      const overlayOutTimer = window.setTimeout(() => {
          setOverlayOut(true);
      }, afterFullRevealDelay + 400);

      const goneTimer = window.setTimeout(() => setGone(true), afterFullRevealDelay + 900);

      finishTimeouts = [...finishTimeouts, contentOutTimer, overlayOutTimer, goneTimer];
    }

    if (document.readyState === 'complete') {
      finish();
    } else {
      window.addEventListener('load', finish, { once: true });
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('load', finish);
      finishTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  if (gone) return null;

  const clip = 100 - Math.min(progress, 100);

  return (
    <div
      className="loader-overlay neural-cursor"
      style={{
        opacity: overlayOut ? 0 : 1,
        pointerEvents: overlayOut ? 'none' : 'all',
      }}
    >
      <div
        className="loader-inner"
        style={{
          opacity: contentOut ? 0 : 1,
          transform: contentOut ? 'translateY(-12px)' : 'translateY(0)',
        }}
      >
        <span className="loader-label-top">AI-ENGINEERED</span>
        <div className="loader-sigil-wrap">
          <Image
            src="/sigil.png"
            alt=""
            width={380}
            height={220}
            className="loader-sigil"
            style={{ clipPath: `inset(0 ${clip}% 0 0)` }}
            priority
          />
        </div>
        <span className="loader-label-bottom">LOADING...</span>
      </div>
    </div>
  );
}
