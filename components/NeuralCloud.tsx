"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// ─── Shaders ──────────────────────────────────────────────────────────────

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec4 vClipPos;
  void main() {
    vUv = uv;
    vClipPos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = vClipPos;
  }
`;

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uLayer;  // 0..1 per-layer seed
  uniform float uAspect; // container width/height
  uniform sampler2D uAlpha;

  varying vec2 vUv;
  varying vec4 vClipPos;

  // ── Value noise ──
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1,0)), f.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
      f.y
    );
  }

  // ── FBM (5 octaves, rotating each) ──
  const mat2 ROT = mat2(0.8660, 0.5, -0.5, 0.8660);
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p  = ROT * p * 2.1 + vec2(100.0);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float t  = uTime * 0.10 + uLayer * 2.1;

    // ── Squish cloud toward cursor ──
    vec2  toMouseUV = uMouse - vUv;
    float dist      = length(toMouseUV);
    float angle     = atan(toMouseUV.y, toMouseUV.x);
    float blobR = 0.14 + fbm(vec2(angle * 0.9, uTime * 0.25)) * 0.14;
    float squish = 1.0 - smoothstep(0.0, 0.18, dist);
    squish = squish * squish;
    uv += toMouseUV * squish * 1.8;

    // ── Domain-warped FBM ──
    vec2 tA = vec2(sin(t * 0.7) * 0.7, cos(t * 0.5) * 0.7);
    vec2 tB = vec2(cos(t * 0.4) * 0.6, sin(t * 0.6) * 0.6);

    vec2 q = vec2(fbm(uv               + tA),
                  fbm(uv + vec2(5.2, 1.3) + tB));

    vec2 r = vec2(fbm(uv + 4.0*q + vec2(1.7, 9.2) + tA * 0.85),
                  fbm(uv + 4.0*q + vec2(8.3, 2.8) + tB * 0.65));

    float cloud = fbm(uv + 4.0 * r);

    // ── Lightning mask ──
    float lf = fbm((uv + r) * 3.8 + tA * 1.5);
    float lightning = pow(max(0.0, 1.0 - abs(lf - 0.52) * 18.0), 2.8);

    // ── Colour ──
    float base = cloud * cloud;

    vec3 dark   = vec3(0.04, 0.07, 0.12);
    vec3 mid    = vec3(0.25, 0.35, 0.48);
    vec3 bright = vec3(0.68, 0.78, 0.88);
    vec3 white  = vec3(0.90, 0.94, 0.97);

    vec3 col = mix(dark, mid, base);
    col = mix(col, bright, base * base);
    col += white * lightning * 0.06;

    // ── Alpha ──
    float alpha = (base * 0.45 + lightning * 0.05);
    alpha = clamp(alpha * 3.0, 0.0, 1.0);

    // ── Hidden smoke layer — revealed within a morphing blob shape ──
    float reveal = 1.0 - smoothstep(blobR * 0.5, blobR, dist);

    vec2 scramble = vec2(sin(uTime * 3.0 + vUv.y * 8.0),
                         cos(uTime * 2.5 + vUv.x * 8.0)) * 0.04;
    vec2 pull = (toMouseUV + scramble) * (1.0 - smoothstep(0.0, blobR, dist)) * 0.5;
    vec2 sUv = vUv + pull + vec2(3.1, 7.4) + uLayer * 1.3;
    vec2 tC  = vec2(sin(t * 0.45) * 0.8, cos(t * 0.65) * 0.8);
    vec2 sq  = vec2(fbm(sUv + tC),
                    fbm(sUv + vec2(2.1, 4.7) + tC * 0.7));
    float smoke      = fbm(sUv + 3.2 * sq);
    float smokeBase  = smoke * smoke;

    float smokeAlpha = smokeBase * 0.8 * reveal;
    alpha = max(alpha, smokeAlpha);

    // ── Mask by alpha map — screen-space UV so all layers align ──
    vec2 screenUV = (vClipPos.xy / vClipPos.w) * 0.5 + 0.5;
    screenUV.y += 0.0; // ← fine-tune vertical offset here

    // Match object-cover: scale to fill container, center, crop overflow
    const float imgAspect = 1173.0 / 655.0;
    float scaleX = (uAspect < imgAspect) ? (imgAspect / uAspect) : 1.0;
    float scaleY = (uAspect > imgAspect) ? (uAspect / imgAspect) : 1.0;
    float stretchY = 0.85; // ← fine-tune vertical stretch here
    vec2 alphaUV = (screenUV - 0.5) * vec2(scaleX, scaleY * stretchY) + 0.5;

    float mask = texture2D(uAlpha, alphaUV).r;
    alpha *= mask;

    gl_FragColor = vec4(col, alpha);
  }
`;

// ─── Component ────────────────────────────────────────────────────────────

export function NeuralCloud() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(1);
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    wrap.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
    camera.position.z = 3;

    // 3 stacked planes — slightly different depths, rotations, scales
    const layers = [
      { z: 0,    ry: 0,     scale: 1.00, layer: 0.00 },
      { z: -0.5, ry: 0.07,  scale: 1.12, layer: 0.35 },
      { z: -1.1, ry: -0.05, scale: 1.25, layer: 0.70 },
    ];

    const geo = new THREE.PlaneGeometry(5.5, 5.5);
    const meshes: THREE.Mesh[] = [];
    const materials: THREE.ShaderMaterial[] = [];

    const uTimeVal   = { value: 0 };
    const mouseUV    = new THREE.Vector2(-1, -1);
    const uAspectVal = { value: wrap.clientWidth / wrap.clientHeight };
    const alphaTex   = { value: new THREE.TextureLoader().load("/crt-alpha.png") };

    for (const cfg of layers) {
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime:   uTimeVal,
          uMouse:  { value: mouseUV },
          uLayer:  { value: cfg.layer },
          uAspect: uAspectVal,
          uAlpha:  alphaTex,
        },
        vertexShader:   VERT,
        fragmentShader: FRAG,
        blending:    THREE.AdditiveBlending,
        depthWrite:  false,
        transparent: true,
        side:        THREE.DoubleSide,
      });
      materials.push(mat);

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = cfg.z;
      mesh.rotation.y = cfg.ry;
      mesh.scale.setScalar(cfg.scale);
      scene.add(mesh);
      meshes.push(mesh);
    }

    // ── Mouse → UV space ──
    const onMove = (e: MouseEvent) => {
      const r = wrap.getBoundingClientRect();
      mouseUV.x = (e.clientX - r.left) / r.width;
      mouseUV.y = 1.0 - (e.clientY - r.top) / r.height;
    };
    const onLeave = () => { mouseUV.set(-1, -1); };
    wrap.addEventListener("mousemove", onMove);
    wrap.addEventListener("mouseleave", onLeave);

    // ── Resize ──
    const onResize = () => {
      camera.aspect = wrap.clientWidth / wrap.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(wrap.clientWidth, wrap.clientHeight);
      uAspectVal.value = wrap.clientWidth / wrap.clientHeight;
    };
    window.addEventListener("resize", onResize);

    // ── Loop ──
    let raf: number;
    function tick(now: number) {
      raf = requestAnimationFrame(tick);
      uTimeVal.value = now / 1000;
      renderer.render(scene, camera);
    }
    requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      wrap.removeEventListener("mousemove", onMove);
      wrap.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      materials.forEach((m) => m.dispose());
      alphaTex.value.dispose();
      renderer.dispose();
      wrap.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <img src="/crt.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div
        ref={wrapRef}
        className="absolute inset-0"
        style={{ cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Ccircle cx='8' cy='8' r='5' fill='none' stroke='%2359ADFF' stroke-width='1.5'/%3E%3C/svg%3E") 8 8, auto` }}
      />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-white text-sm tracking-widest uppercase select-none">
        AI-engineered
      </span>
    </div>
  );
}
