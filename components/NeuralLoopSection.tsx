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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mobileRafRef = useRef<number>(0);
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

    const EDGE_PAD = 80;
    const FADE_ZONE = EDGE_PAD * 0.3; // 24px fade before dead zone

    const handleMove = (event: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();

      if (event.clientX < rect.left || event.clientX > rect.right) {
        wrap.style.setProperty("--pointer-opacity", "0");
        return;
      }

      const edgeDist = Math.min(event.clientY - rect.top, rect.bottom - event.clientY);

      if (edgeDist < EDGE_PAD) {
        wrap.style.setProperty("--pointer-opacity", "0");
        return;
      }

      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      wrap.style.setProperty("--pointer-x", `${(x * 100).toFixed(2)}%`);
      wrap.style.setProperty("--pointer-y", `${(y * 100).toFixed(2)}%`);

      const opacity = Math.min((edgeDist - EDGE_PAD) / FADE_ZONE, 1);
      wrap.style.setProperty("--pointer-opacity", opacity.toFixed(3));
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

  // Mobile: Canvas 2D alpha-key — converts alphaSrc luminance → alpha once,
  // then composites each video frame through that mask. Same logic as the old GLSL shader.
  useEffect(() => {
    if (hasFinePointer || !alphaSrc || !videoSrc) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !video || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.onload = () => {
      const mc = document.createElement("canvas");
      mc.width = img.naturalWidth;
      mc.height = img.naturalHeight;
      const mctx = mc.getContext("2d");
      if (!mctx) return;
      mctx.drawImage(img, 0, 0);
      const d = mctx.getImageData(0, 0, mc.width, mc.height);
      for (let i = 0; i < d.data.length; i += 4) {
        const lum = d.data[i] * 0.299 + d.data[i + 1] * 0.587 + d.data[i + 2] * 0.114;
        d.data[i] = 255; d.data[i + 1] = 255; d.data[i + 2] = 255;
        d.data[i + 3] = lum;
      }
      mctx.putImageData(d, 0, 0);
      maskCanvasRef.current = mc;
    };
    img.src = alphaSrc;

    // Compute object-cover source crop: returns [sx, sy, sw, sh]
    const coverCrop = (srcW: number, srcH: number, dstW: number, dstH: number): [number, number, number, number] => {
      const scale = Math.max(dstW / srcW, dstH / srcH);
      const sw = dstW / scale;
      const sh = dstH / scale;
      return [(srcW - sw) / 2, (srcH - sh) / 2, sw, sh];
    };

    let lastDrawn = 0;
    const draw = (now: number) => {
      mobileRafRef.current = requestAnimationFrame(draw);
      if (now - lastDrawn < 33) return; // ~30 fps
      lastDrawn = now;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      if (!maskCanvasRef.current || video.readyState < 2) return;
      ctx.clearRect(0, 0, w, h);
      const [vsx, vsy, vsw, vsh] = coverCrop(video.videoWidth || w, video.videoHeight || h, w, h);
      ctx.drawImage(video, vsx, vsy, vsw, vsh, 0, 0, w, h);
      ctx.globalCompositeOperation = "destination-in";
      const mc = maskCanvasRef.current;
      const [msx, msy, msw, msh] = coverCrop(mc.width, mc.height, w, h);
      ctx.drawImage(mc, msx, msy, msw, msh, 0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    };

    mobileRafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(mobileRafRef.current);
      maskCanvasRef.current = null;
    };
  }, [hasFinePointer, alphaSrc, videoSrc]);

  const showVideo = Boolean(videoSrc) && !videoFailed;
  const useCompositeMask = Boolean(alphaSrc) && hasFinePointer;
  const useMobileCanvas = Boolean(alphaSrc) && !hasFinePointer;
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
            className={`absolute inset-0 h-full w-full object-cover opacity-92 ${useMobileCanvas ? "opacity-0" : ""}`}
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
          className="absolute inset-0"
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

      {useMobileCanvas && showVideo ? (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{
            filter: "contrast(1.35) saturate(1.9) brightness(1.14)",
          }}
        />
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
