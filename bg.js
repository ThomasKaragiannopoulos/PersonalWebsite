// Full-screen WebGL smoke background: domain-warped fbm, film grain, vignette,
// and a cursor flow map that pushes the smoke. Falls back to flat CSS bg if no WebGL.
(() => {
  const canvas = document.createElement("canvas");
  canvas.className = "bg";
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
  if (!gl) return;
  document.body.prepend(canvas);
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const VERT = `attribute vec2 p; varying vec2 v;
    void main() { v = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;

  // Flow map: rg = last push direction, b = strength (fades out over time)
  const FLOW = `precision highp float; varying vec2 v;
    uniform sampler2D prev; uniform vec2 mouse, vel; uniform float aspect;
    void main() {
      vec4 c = texture2D(prev, v);
      c.b = max(c.b * .965 - 1. / 255., 0.);
      vec2 d = v - mouse; d.x *= aspect;
      float f = exp(-dot(d, d) * 160.) * clamp(length(vel) * 3., 0., 1.);
      c.rg = mix(c.rg, vel * .5 + .5, f);
      c.b = max(c.b, f);
      gl_FragColor = c;
    }`;

  const SMOKE = `precision highp float; varying vec2 v;
    uniform sampler2D flow; uniform float t, aspect; uniform vec2 res;
    float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p) {
      vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + 1.), f.x), f.y);
    }
    float fbm(vec2 p) {
      float s = 0., a = .5; mat2 r = mat2(.8, .6, -.6, .8);
      for (int i = 0; i < 5; i++) { s += a * n(p); p = r * p * 2.02; a *= .5; }
      return s;
    }
    void main() {
      vec4 fl = texture2D(flow, v);
      vec2 push = (fl.rg * 2. - 1.) * fl.b;
      vec2 p = vec2(v.x * aspect, v.y) * 1.4 - push * .6;
      vec2 q = vec2(fbm(p + t * .035), fbm(p + vec2(5.2, 1.3) - t * .028));
      vec2 r = vec2(fbm(p + 3. * q + vec2(1.7, 9.2) + t * .045), fbm(p + 3. * q + vec2(8.3, 2.8) - t * .038));
      float s = smoothstep(.3, .85, fbm(p + 3. * r));
      vec3 c = vec3(mix(.035, .4, s * s));
      c *= 1. - smoothstep(.35, .95, length(v - .5)) * .5;
      c += (h(floor(v * res) + fract(t * 9.) * 91.) - .5) * .07;
      gl_FragColor = vec4(c, 1.);
    }`;

  const program = (fs) => {
    const p = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, fs]]) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      gl.attachShader(p, s);
    }
    gl.bindAttribLocation(p, 0, "p");
    gl.linkProgram(p);
    const u = {};
    for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) {
      const name = gl.getActiveUniform(p, i).name;
      u[name] = gl.getUniformLocation(p, name);
    }
    return { p, u };
  };
  const flowProg = program(FLOW);
  const smokeProg = program(SMOKE);
  if (!gl.getProgramParameter(smokeProg.p, gl.LINK_STATUS)) return canvas.remove();

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // Ping-pong flow targets, 128², neutral = (.5, .5, 0)
  const FS = 128;
  const neutral = new Uint8Array(FS * FS * 4).map((_, i) => (i % 4 < 2 ? 128 : i % 4 === 3 ? 255 : 0));
  const targets = [0, 1].map(() => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, FS, FS, 0, gl.RGBA, gl.UNSIGNED_BYTE, neutral);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fb };
  });

  const mouse = { x: 0.5, y: 0.5, vx: 0, vy: 0 };
  addEventListener("pointermove", (e) => {
    const x = e.clientX / innerWidth, y = 1 - e.clientY / innerHeight;
    mouse.vx += (x - mouse.x) * 6;
    mouse.vy += (y - mouse.y) * 6;
    mouse.x = x;
    mouse.y = y;
  });

  const resize = () => {
    const scale = Math.min(devicePixelRatio, 1.5) * 0.6; // soft image, render below native res
    canvas.width = Math.round(innerWidth * scale);
    canvas.height = Math.round(innerHeight * scale);
  };
  resize();
  addEventListener("resize", () => { resize(); if (still) frame(20000); });

  let read = 0;
  const frame = (ms) => {
    const aspect = canvas.width / canvas.height;
    mouse.vx = Math.max(-1, Math.min(1, mouse.vx * 0.85));
    mouse.vy = Math.max(-1, Math.min(1, mouse.vy * 0.85));

    gl.useProgram(flowProg.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, targets[1 - read].fb);
    gl.viewport(0, 0, FS, FS);
    gl.bindTexture(gl.TEXTURE_2D, targets[read].tex);
    gl.uniform1i(flowProg.u.prev, 0);
    gl.uniform2f(flowProg.u.mouse, mouse.x, mouse.y);
    gl.uniform2f(flowProg.u.vel, mouse.vx, mouse.vy);
    gl.uniform1f(flowProg.u.aspect, aspect);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    read = 1 - read;

    gl.useProgram(smokeProg.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.bindTexture(gl.TEXTURE_2D, targets[read].tex);
    gl.uniform1i(smokeProg.u.flow, 0);
    gl.uniform1f(smokeProg.u.t, ms / 1000);
    gl.uniform1f(smokeProg.u.aspect, aspect);
    gl.uniform2f(smokeProg.u.res, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  if (still) return frame(20000);
  // wall-clock time so the smoke continues seamlessly across page loads
  const loop = () => { frame(Date.now() % 1e7); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
})();
