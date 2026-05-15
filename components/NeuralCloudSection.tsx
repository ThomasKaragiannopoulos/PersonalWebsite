"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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

  varying vec2 vUv;

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
    vec2 screenUV = gl_FragCoord.xy / uContainerSize;
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

interface Props {
  imageSrc?: string;
  alphaSrc?: string;
}

export function NeuralCloudSection({ imageSrc, alphaSrc }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const image = imageRef.current;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(1);
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
    camera.position.z = 3;

    const geo = new THREE.PlaneGeometry(8, 8);
    const uTimeVal = { value: 0 };
    const mouseUV = new THREE.Vector2(-1, -1);
    let alphaTexValue: THREE.Texture;
    if (alphaSrc) {
      alphaTexValue = new THREE.TextureLoader().load(alphaSrc);
    } else {
      const white = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, THREE.RGBAFormat);
      white.needsUpdate = true;
      alphaTexValue = white;
    }
    const alphaTex = { value: alphaTexValue };
    const containerSizeVal = { value: new THREE.Vector2(wrap.clientWidth, wrap.clientHeight) };
    const imageDisplaySizeVal = { value: new THREE.Vector2(wrap.clientWidth, wrap.clientHeight) };
    const imageOffsetVal = { value: new THREE.Vector2(0, 0) };

    const syncImageMapping = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      containerSizeVal.value.set(w, h);
      if (image) {
        const nw = image.naturalWidth || w;
        const nh = image.naturalHeight || h;
        const scale = Math.max(w / nw, h / nh);
        const rw = nw * scale;
        const rh = nh * scale;
        imageDisplaySizeVal.value.set(rw, rh);
        imageOffsetVal.value.set((w - rw) * 0.5, (h - rh) * 0.5);
      } else {
        imageDisplaySizeVal.value.set(w, h);
        imageOffsetVal.value.set(0, 0);
      }
    };

    const materials: THREE.ShaderMaterial[] = [];
    for (const cfg of LAYER_CFGS) {
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: uTimeVal,
          uMouse: { value: mouseUV },
          uLayer: { value: cfg.layer },
          uAlpha: alphaTex,
          uContainerSize: containerSizeVal,
          uImageDisplaySize: imageDisplaySizeVal,
          uImageOffset: imageOffsetVal,
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

    const onMouseMove = (e: MouseEvent) => {
      const r = wrap.getBoundingClientRect();
      mouseUV.x = (e.clientX - r.left) / r.width;
      mouseUV.y = 1.0 - (e.clientY - r.top) / r.height;
    };
    const onMouseLeave = () => { mouseUV.set(-1, -1); };
    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);

    const onResize = () => {
      camera.aspect = wrap.clientWidth / wrap.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(wrap.clientWidth, wrap.clientHeight);
      syncImageMapping();
    };
    window.addEventListener("resize", onResize);

    const resizeObserver = new ResizeObserver(syncImageMapping);
    resizeObserver.observe(wrap);
    if (image) image.addEventListener("load", syncImageMapping);
    syncImageMapping();

    let raf: number;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < 16) return;
      last = now;
      uTimeVal.value = now / 1000;
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      resizeObserver.disconnect();
      if (image) image.removeEventListener("load", syncImageMapping);
      geo.dispose();
      materials.forEach((m) => m.dispose());
      alphaTex.value.dispose();
      renderer.dispose();
      if (wrap.contains(renderer.domElement)) {
        wrap.removeChild(renderer.domElement);
      }
    };
  }, [alphaSrc]);

  return (
    <div className="absolute inset-0">
      {imageSrc && (
        <img
          ref={imageRef}
          src={imageSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div ref={wrapRef} className="pointer-events-none absolute inset-0" />
    </div>
  );
}
