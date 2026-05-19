"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";

interface NeuralLoopSectionProps {
  imageSrc?: string;
  alphaSrc?: string;
  videoSrc?: string;
  playbackRate?: number;
  flipX?: boolean;
  flipY?: boolean;
  showTopBlend?: boolean;
  showBottomBlend?: boolean;
}

const POINTER_RADIUS_PX = 180;

export function NeuralLoopSection({
  imageSrc,
  alphaSrc,
  videoSrc,
  playbackRate = 1,
  flipX = false,
  flipY = false,
  showTopBlend = true,
  showBottomBlend = true,
}: NeuralLoopSectionProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [hasFinePointer, setHasFinePointer] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setHasFinePointer(
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    );
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const canHover =
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (!canHover) {
      wrap.style.setProperty("--pointer-opacity", "0");
      return;
    }

    wrap.style.setProperty("--pointer-x", "50%");
    wrap.style.setProperty("--pointer-y", "50%");
    wrap.style.setProperty("--pointer-opacity", "0");
    wrap.style.setProperty("--pointer-radius", `${POINTER_RADIUS_PX}px`);

    const handleMove = (event: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        wrap.style.setProperty("--pointer-opacity", "0");
        return;
      }

      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      wrap.style.setProperty("--pointer-x", `${(x * 100).toFixed(2)}%`);
      wrap.style.setProperty("--pointer-y", `${(y * 100).toFixed(2)}%`);
      wrap.style.setProperty("--pointer-opacity", "1");
    };

    const handleLeave = () => {
      wrap.style.setProperty("--pointer-opacity", "0");
    };

    window.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseleave", handleLeave);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
    };
  }, [flipX, flipY]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const showVideo = Boolean(videoSrc) && !videoFailed;
  const useCompositeMask = Boolean(alphaSrc) && hasFinePointer;
  const mobileAlphaMask = Boolean(alphaSrc) && !hasFinePointer;
  const imageMaskStyle = useCompositeMask
    ? {
        maskImage: `linear-gradient(#fff 0 0), url("${alphaSrc}")`,
        WebkitMaskImage: `linear-gradient(#fff 0 0), url("${alphaSrc}")`,
        maskMode: "alpha, luminance" as const,
        WebkitMaskMode: "alpha, luminance" as const,
        maskSize: "100% 100%, cover",
        WebkitMaskSize: "100% 100%, cover",
        maskPosition: "center, center",
        WebkitMaskPosition: "center, center",
        maskRepeat: "no-repeat, no-repeat",
        WebkitMaskRepeat: "no-repeat, no-repeat",
        maskComposite: "subtract" as const,
        WebkitMaskComposite: "xor" as const,
      }
    : undefined;

  const cursorMaskStyle = useCompositeMask
    ? {
        maskImage: `radial-gradient(circle var(--pointer-radius) at var(--pointer-x) var(--pointer-y), rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 45%, rgba(0,0,0,0) 72%), url("${alphaSrc}")`,
        WebkitMaskImage: `radial-gradient(circle var(--pointer-radius) at var(--pointer-x) var(--pointer-y), rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 45%, rgba(0,0,0,0) 72%), url("${alphaSrc}")`,
        maskSize: "100% 100%, cover",
        WebkitMaskSize: "100% 100%, cover",
        maskPosition: "center, center",
        WebkitMaskPosition: "center, center",
        maskRepeat: "no-repeat, no-repeat",
        WebkitMaskRepeat: "no-repeat, no-repeat",
        maskMode: "alpha, luminance" as const,
        maskComposite: "intersect" as const,
      }
    : {
        maskImage:
          "radial-gradient(circle var(--pointer-radius) at var(--pointer-x) var(--pointer-y), rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 45%, rgba(0,0,0,0) 72%)",
        WebkitMaskImage:
          "radial-gradient(circle var(--pointer-radius) at var(--pointer-x) var(--pointer-y), rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 45%, rgba(0,0,0,0) 72%)",
      };

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={
        {
          "--pointer-x": "50%",
          "--pointer-y": "50%",
          "--pointer-opacity": 0,
          "--pointer-radius": `${POINTER_RADIUS_PX}px`,
        } as CSSProperties
      }
    >
      {showVideo ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster={imageSrc}
            onError={() => setVideoFailed(true)}
            className="absolute inset-0 h-full w-full object-cover opacity-92"
            style={{
              filter: [
                "contrast(1.35) ",
                "saturate(1.9) ",
                "brightness(1.14)",
              ].join(""),
              willChange: "filter",
            }}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>

        </>
      ) : null}

      {imageSrc ? (
        <div
          className={`absolute inset-0 ${useCompositeMask ? "" : "opacity-70"}`}
          style={imageMaskStyle}
        >
          <Image
            src={imageSrc}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className={`absolute inset-0 ${useCompositeMask ? "bg-black/42" : "bg-black/18"}`} />
        </div>
      ) : null}

      {showTopBlend ? (
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[var(--background)] via-[rgba(10,10,10,0.3)] via-55% to-transparent" />
      ) : null}
      {showBottomBlend ? (
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--background)] via-[rgba(10,10,10,0.7)] to-transparent" />
      ) : null}

      <div
        className="absolute inset-0 transition-opacity duration-150 ease-out"
        style={{
          opacity: "calc(var(--pointer-opacity) * 1)",
          background:
            "radial-gradient(circle 170px at var(--pointer-x) var(--pointer-y), rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.26) 18%, rgba(255,255,255,0.1) 34%, rgba(255,255,255,0) 52%)",
          mixBlendMode: "screen",
          ...cursorMaskStyle,
        }}
      />
    </div>
  );
}
