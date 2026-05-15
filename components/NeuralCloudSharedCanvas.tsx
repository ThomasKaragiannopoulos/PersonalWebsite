"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import * as THREE from "three";

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
  uniform vec2 uMouse;
  uniform float uLayer;
  uniform sampler2D uAlpha;
  uniform vec2 uContainerSize;
  uniform vec2 uImageDisplaySize;
  uniform vec2 uImageOffset;
  uniform vec2 uViewportOrigin;

  varying vec2 vUv;
  varying vec4 vClipPos;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  const mat2 ROT = mat2(0.8660, 0.5, -0.5, 0.8660);

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p = ROT * p * 2.1 + vec2(100.0);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.10 + uLayer * 2.1;
    vec2 screenUV = (gl_FragCoord.xy - uViewportOrigin) / uContainerSize;
    vec2 toMouseUV = uMouse - screenUV;
    float dist = length(toMouseUV);
    float blobR = 0.09;
    float coreR = blobR * 0.42;
    float squish = 1.0 - smoothstep(0.0, 0.08, dist);
    squish *= squish;
    uv += toMouseUV * squish * 1.8;

    vec2 tA = vec2(sin(t * 0.7) * 0.7, cos(t * 0.5) * 0.7);
    vec2 tB = vec2(cos(t * 0.4) * 0.6, sin(t * 0.6) * 0.6);

    vec2 q = vec2(fbm(uv + tA), fbm(uv + vec2(5.2, 1.3) + tB));
    vec2 r = vec2(
      fbm(uv + 4.0 * q + vec2(1.7, 9.2) + tA * 0.85),
      fbm(uv + 4.0 * q + vec2(8.3, 2.8) + tB * 0.65)
    );

    float cloud = fbm(uv + 4.0 * r);
    float lf = fbm((uv + r) * 3.8 + tA * 1.5);
    float lightning = pow(max(0.0, 1.0 - abs(lf - 0.52) * 10.0), 4.0);
    float base = cloud * cloud;

    vec3 dark = vec3(0.00, 0.06, 0.22);
    vec3 mid = vec3(0.00, 0.42, 0.98);
    vec3 bright = vec3(0.12, 0.86, 1.00);
    vec3 white = vec3(0.84, 0.97, 1.00);

    vec3 col = mix(dark, mid, base);
    col = mix(col, bright, base * base);
    col += white * lightning * 0.035;

    float alpha = clamp((base * 0.45 + lightning * 0.05) * 3.0, 0.0, 1.0);

    float reveal = max(
      1.0 - smoothstep(0.0, coreR, dist),
      1.0 - smoothstep(blobR * 0.5, blobR, dist)
    );

    vec2 scramble = vec2(
      sin(uTime * 1.4 + vUv.y * 5.0),
      cos(uTime * 1.1 + vUv.x * 5.0)
    ) * 0.018;

    float outerInfluence = 1.0 - smoothstep(0.0, blobR, dist);
    float coreInfluence = 1.0 - smoothstep(0.0, coreR, dist);
    vec2 pull = (toMouseUV * coreInfluence + scramble * outerInfluence) * 0.5;
    vec2 sUv = vUv + pull + vec2(3.1, 7.4) + uLayer * 1.3;
    vec2 tC = vec2(sin(t * 0.45) * 0.8, cos(t * 0.65) * 0.8);
    vec2 sq = vec2(fbm(sUv + tC), fbm(sUv + vec2(2.1, 4.7) + tC * 0.7));
    float smoke = fbm(sUv + 3.2 * sq);
    float smokeAlpha = smoke * smoke * 0.8 * reveal;
    alpha = max(alpha, smokeAlpha);

    vec2 screenPx = screenUV * uContainerSize;
    vec2 alphaUV = (screenPx - uImageOffset) / uImageDisplaySize;
    float mask = texture2D(uAlpha, alphaUV).r;
    alpha *= mask;

    gl_FragColor = vec4(col, alpha);
  }
`;

const LAYER_CFGS = [
  { z: 0,    ry: 0,     scale: 1.0,  layer: 0.0  },
  { z: -0.5, ry: 0.07,  scale: 1.12, layer: 0.35 },
  { z: -1.1, ry: -0.05, scale: 1.25, layer: 0.7  },
];

interface SectionEntry {
  el: HTMLElement;
  imageEl: HTMLImageElement | null;
  scene: THREE.Scene;
  materials: THREE.ShaderMaterial[];
  alphaTex: THREE.Texture;
  uMouse: THREE.Vector2;
  uContainerSize: { value: THREE.Vector2 };
  uImageDisplaySize: { value: THREE.Vector2 };
  uImageOffset: { value: THREE.Vector2 };
  uViewportOrigin: { value: THREE.Vector2 };
}

interface PendingEntry {
  el: HTMLElement;
  imageEl: HTMLImageElement | null;
  alphaSrc: string;
}

interface NeuralCloudContextValue {
  register: (id: string, el: HTMLElement, alphaSrc: string, imageEl: HTMLImageElement | null) => void;
  unregister: (id: string) => void;
}

const NeuralCloudContext = createContext<NeuralCloudContextValue | null>(null);

export function useNeuralCloudCanvas() {
  return useContext(NeuralCloudContext);
}

export function NeuralCloudSharedCanvas({ children }: { children: ReactNode }) {
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<Map<string, SectionEntry>>(new Map());
  const pendingRef = useRef<Map<string, PendingEntry>>(new Map());
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const geoRef = useRef<THREE.PlaneGeometry | null>(null);
  const uTimeRef = useRef({ value: 0 });
  const mouseRef = useRef({ x: -1, y: -1 });
  const rafRef = useRef<number>(0);

  const initSection = useCallback((id: string, { el, imageEl, alphaSrc }: PendingEntry) => {
    const geo = geoRef.current;
    if (!geo) return;

    const uMouse = new THREE.Vector2(-1, -1);
    const uContainerSize = { value: new THREE.Vector2(el.clientWidth, el.clientHeight) };
    const uImageDisplaySize = { value: new THREE.Vector2(el.clientWidth, el.clientHeight) };
    const uImageOffset = { value: new THREE.Vector2(0, 0) };
    const uViewportOrigin = { value: new THREE.Vector2(0, 0) };
    const alphaTex = new THREE.TextureLoader().load(alphaSrc);
    const scene = new THREE.Scene();
    const materials: THREE.ShaderMaterial[] = [];

    for (const cfg of LAYER_CFGS) {
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: uTimeRef.current,
          uMouse: { value: uMouse },
          uLayer: { value: cfg.layer },
          uAlpha: { value: alphaTex },
          uContainerSize,
          uImageDisplaySize,
          uImageOffset,
          uViewportOrigin,
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        side: THREE.DoubleSide,
      });
      materials.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = cfg.z;
      mesh.rotation.y = cfg.ry;
      mesh.scale.setScalar(cfg.scale);
      scene.add(mesh);
    }

    sectionsRef.current.set(id, {
      el, imageEl, scene, materials, alphaTex,
      uMouse, uContainerSize, uImageDisplaySize, uImageOffset, uViewportOrigin,
    });
  }, []);

  const register = useCallback((id: string, el: HTMLElement, alphaSrc: string, imageEl: HTMLImageElement | null) => {
    const pending: PendingEntry = { el, imageEl, alphaSrc };
    if (geoRef.current) {
      initSection(id, pending);
    } else {
      pendingRef.current.set(id, pending);
    }
  }, [initSection]);

  const unregister = useCallback((id: string) => {
    pendingRef.current.delete(id);
    const entry = sectionsRef.current.get(id);
    if (entry) {
      entry.materials.forEach((m) => m.dispose());
      entry.alphaTex.dispose();
      sectionsRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const wrap = canvasWrapRef.current;
    if (!wrap) return;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setScissorTest(true);
    wrap.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 3;
    cameraRef.current = camera;

    const geo = new THREE.PlaneGeometry(8, 8);
    geoRef.current = geo;

    // Drain pending registrations
    for (const [id, pending] of pendingRef.current) {
      initSection(id, pending);
    }
    pendingRef.current.clear();

    const onMouseMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const onMouseLeave = () => { mouseRef.current = { x: -1, y: -1 }; };
    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("resize", onResize);

    let last = 0;
    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick);

      if (now - last >= 16) {
        uTimeRef.current.value = now / 1000;
        last = now;
      }

      const canvasH = renderer.domElement.height;

      renderer.setScissorTest(false);
      renderer.clear();
      renderer.setScissorTest(true);

      for (const entry of sectionsRef.current.values()) {
        const rect = entry.el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) continue;

        const x = Math.round(rect.left);
        const y = Math.round(canvasH - rect.bottom);
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);

        renderer.setScissor(x, y, w, h);
        renderer.setViewport(x, y, w, h);
        entry.uViewportOrigin.value.set(x, y);

        camera.aspect = w / h;
        camera.updateProjectionMatrix();

        // Mouse in section-local UV space
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        if (mx < 0) {
          entry.uMouse.set(-1, -1);
        } else {
          entry.uMouse.set(
            (mx - rect.left) / rect.width,
            1.0 - (my - rect.top) / rect.height,
          );
        }

        entry.uContainerSize.value.set(w, h);

        // Sync image cover mapping
        const img = entry.imageEl;
        if (img) {
          const nw = img.naturalWidth || w;
          const nh = img.naturalHeight || h;
          const scale = Math.max(w / nw, h / nh);
          const rw = nw * scale;
          const rh = nh * scale;
          entry.uImageDisplaySize.value.set(rw, rh);
          entry.uImageOffset.value.set((w - rw) * 0.5, (h - rh) * 0.5);
        }

        renderer.render(entry.scene, camera);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      for (const entry of sectionsRef.current.values()) {
        entry.materials.forEach((m) => m.dispose());
        entry.alphaTex.dispose();
      }
      renderer.dispose();
      wrap.removeChild(renderer.domElement);
    };
  }, [initSection]);

  return (
    <NeuralCloudContext.Provider value={{ register, unregister }}>
      <div
        ref={canvasWrapRef}
        className="pointer-events-none fixed inset-0 z-[2]"
      />
      {children}
    </NeuralCloudContext.Provider>
  );
}
