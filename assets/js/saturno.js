/* ==========================================================
   Particle Saturn
   Adaptado do componente "Particle Saturn" do Originkit
   (https://www.originkit.dev/) de React + Three.js para
   JavaScript puro com WebGL, sem dependências.
   Uso: NobiSaturno(elemento, { coreColor, ringColor, ... })
   ========================================================== */
(() => {
  'use strict';

  const PERSPECTIVE = 0.15;
  const VIEW_SPAN = 6.4;
  const CORE_RADIUS = 1;
  const MAX_MOTES = 90000;
  const RING_THICKNESS = 0.011;
  const RING_MOTE_FACTOR = 1.35;

  const PADRAO = {
    coreColor: '#997F00',
    ringColor: '#FFD400',
    density: 20,
    particleSize: 14,
    glow: 20,
    tilt: 6,
    roll: 7,
    spinSpeed: 7,
    ringOptions: { gaps: 1, orbitSpeed: 9, innerRadius: 105, outerRadius: 262 },
    dragSensitivity: 2,
    sizePercent: 134
  };

  function clamp(v, lo, hi, fallback) {
    const n = typeof v === 'number' && isFinite(v) ? v : fallback;
    return Math.max(lo, Math.min(hi, n));
  }

  function settingsFor(cfg) {
    const ring = cfg.ringOptions || PADRAO.ringOptions;
    const density = clamp(cfg.density, 1, 20, PADRAO.density);
    const baseMotes = 600 + density * density * 95;
    const innerFraction = clamp(ring.innerRadius, 105, 200, 138) / 100;
    const outerFraction = clamp(ring.outerRadius, 110, 300, 262) / 100;
    return {
      coreMotes: Math.min(MAX_MOTES, Math.round(baseMotes)),
      ringMotes: Math.min(MAX_MOTES, Math.round(baseMotes * RING_MOTE_FACTOR)),
      moteSize: 0.5 + clamp(cfg.particleSize, 1, 20, PADRAO.particleSize) * 0.13,
      glow: 0.15 + clamp(cfg.glow, 1, 20, PADRAO.glow) * 0.055,
      tiltRadians: (clamp(cfg.tilt, -80, 80, PADRAO.tilt) * Math.PI) / 180,
      rollRadians: (clamp(cfg.roll, -90, 90, PADRAO.roll) * Math.PI) / 180,
      spinRate: clamp(cfg.spinSpeed, 0, 20, PADRAO.spinSpeed) * 0.05,
      innerRadius: innerFraction * CORE_RADIUS,
      outerRadius: Math.max(innerFraction + 0.08, outerFraction) * CORE_RADIUS,
      gapCount: Math.round(clamp(ring.gaps, 0, 4, 2)),
      ringThickness: RING_THICKNESS,
      orbitRate: clamp(ring.orbitSpeed, 0, 20, 9) * 0.11
    };
  }

  function insideGap(S, radius, span) {
    for (let g = 0; g < S.gapCount; g++) {
      const centre = S.innerRadius + span * ((g + 1) / (S.gapCount + 1));
      const halfWidth = span * (0.075 - g * 0.011);
      if (Math.abs(radius - centre) < halfWidth) return true;
    }
    return false;
  }

  function pickRingRadius(S, span) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const radius = S.innerRadius + Math.sqrt(Math.random()) * span;
      if (!insideGap(S, radius, span)) return radius;
    }
    return S.outerRadius;
  }

  function buildCloud(S) {
    const count = S.coreMotes + S.ringMotes;
    const kind = new Float32Array(count);
    const along = new Float32Array(count);
    const seed = new Float32Array(count);
    const radius = new Float32Array(count);
    for (let i = 0; i < S.coreMotes; i++) {
      along[i] = (i + 0.5) / S.coreMotes;
      seed[i] = Math.random();
    }
    const span = S.outerRadius - S.innerRadius;
    for (let i = 0; i < S.ringMotes; i++) {
      const k = S.coreMotes + i;
      kind[k] = 1;
      along[k] = i / Math.max(1, S.ringMotes - 1);
      seed[k] = Math.random();
      radius[k] = pickRingRadius(S, span);
    }
    return { count, kind, along, seed, radius };
  }

  const VERT = `
attribute float aKind;
attribute float aAlong;
attribute float aSeed;
attribute float aRadius;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;
uniform float uMoteSize;
uniform float uOrbitRate;
uniform float uRingThickness;
uniform float uCoreRadius;
uniform float uPixelRatio;

varying float vKind;
varying float vBright;

const float TAU = 6.28318530718;

float hash11(float n) {
  return fract(sin(n * 78.233) * 43758.5453);
}

void main() {
  vec3 modelPos;
  float bright = 1.0;

  if (aKind < 0.5) {
    float y = 1.0 - aAlong * 2.0;
    float ringRadius = sqrt(max(0.0, 1.0 - y * y));
    float theta = aAlong * 2399.96;
    modelPos = vec3(cos(theta) * ringRadius, y, sin(theta) * ringRadius) * uCoreRadius;
    modelPos *= 1.0 + (hash11(aSeed * 91.7) - 0.5) * 0.012;
    bright = 0.55 + hash11(aSeed * 13.1) * 0.6;
  } else {
    float orbitRadius = aRadius;
    float rate = uOrbitRate / pow(max(orbitRadius, 0.2), 1.5);
    float theta = aSeed * TAU + uTime * rate;
    float lift = (hash11(aSeed * 37.9) - 0.5) * 2.0 * uRingThickness;
    modelPos = vec3(cos(theta) * orbitRadius, lift, sin(theta) * orbitRadius);
    float lane = hash11(floor(orbitRadius * 46.0));
    bright = (0.35 + lane * 0.95) * (0.6 + hash11(aSeed * 5.3) * 0.7);
  }

  vec4 viewPos = modelViewMatrix * vec4(modelPos, 1.0);
  vec3 modelCentre = modelViewMatrix[3].xyz;
  vec3 fromCamera = viewPos.xyz;
  float rayLength = max(length(fromCamera), 1e-5);
  vec3 rayDir = fromCamera / rayLength;
  float alongRay = dot(modelCentre, rayDir);
  float offAxis = length(modelCentre - rayDir * alongRay);

  bool occluded;
  if (aKind < 0.5) {
    occluded = dot(viewPos.xyz - modelCentre, rayDir) > 0.0;
  } else {
    float inside = uCoreRadius * uCoreRadius - offAxis * offAxis;
    float nearHit = alongRay - sqrt(max(inside, 0.0));
    occluded = inside > 0.0 && rayLength > nearHit;
  }

  if (occluded) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vKind = aKind;
    vBright = 0.0;
    return;
  }

  gl_Position = projectionMatrix * viewPos;
  gl_PointSize = uMoteSize * uPixelRatio * (9.0 / max(0.001, -viewPos.z));
  vKind = aKind;
  vBright = bright;
}
`;

  const FRAG = `
precision highp float;
uniform vec3 uCoreColor;
uniform vec3 uRingColor;
uniform float uGlow;
varying float vKind;
varying float vBright;

void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float fall = 1.0 - d;
  float shape = pow(fall, 5.0) + pow(fall, 1.6) * 0.3;
  vec3 col = vKind < 0.5 ? uCoreColor : uRingColor;
  float a = shape * vBright * (0.35 + uGlow);
  gl_FragColor = vec4(col * a, a);
}
`;

  /* sRGB -> linear, como o Three.js faz com as cores dos uniforms */
  function corLinear(hex) {
    let h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
  }

  /* Matrizes 4x4 em ordem de coluna (igual ao WebGL) */
  function mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
    }
    return o;
  }
  const rotX = (t) => { const c = Math.cos(t), s = Math.sin(t); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); };
  const rotY = (t) => { const c = Math.cos(t), s = Math.sin(t); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); };
  const rotZ = (t) => { const c = Math.cos(t), s = Math.sin(t); return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); };
  function perspectiva(fovGraus, aspect, near, far) {
    const f = 1 / Math.tan((fovGraus * Math.PI) / 360);
    const nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }

  function NobiSaturno(container, opcoes) {
    if (!container) return null;
    const cfg = Object.assign({}, PADRAO, opcoes);
    const S = settingsFor(cfg);
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const toque = window.matchMedia('(pointer: coarse)').matches;

    const canvas = document.createElement('canvas');
    canvas.className = 'fx-canvas fx-saturno';
    canvas.style.touchAction = toque ? 'pan-y' : 'none';
    container.appendChild(canvas);

    let gl = null;
    try {
      gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true, depth: false, powerPreference: 'high-performance' });
    } catch (e) { gl = null; }
    if (!gl) { canvas.remove(); container.classList.add('fx-fallback'); return null; }

    const compilar = (tipo, src) => {
      const sh = gl.createShader(tipo);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.error('Saturno shader:', gl.getShaderInfoLog(sh)); return null; }
      return sh;
    };
    const vs = compilar(gl.VERTEX_SHADER, VERT);
    const fs = compilar(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { canvas.remove(); container.classList.add('fx-fallback'); return null; }
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error('Saturno link:', gl.getProgramInfoLog(prog)); canvas.remove(); container.classList.add('fx-fallback'); return null; }
    gl.useProgram(prog);

    const nuvem = buildCloud(S);
    const atributo = (nome, dados) => {
      const loc = gl.getAttribLocation(prog, nome);
      if (loc < 0) return;
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, dados, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 1, gl.FLOAT, false, 0, 0);
    };
    atributo('aKind', nuvem.kind);
    atributo('aAlong', nuvem.along);
    atributo('aSeed', nuvem.seed);
    atributo('aRadius', nuvem.radius);

    const U = {};
    ['modelViewMatrix', 'projectionMatrix', 'uTime', 'uMoteSize', 'uOrbitRate', 'uRingThickness', 'uCoreRadius', 'uPixelRatio', 'uCoreColor', 'uRingColor', 'uGlow']
      .forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
    gl.uniform1f(U.uMoteSize, S.moteSize);
    gl.uniform1f(U.uOrbitRate, S.orbitRate);
    gl.uniform1f(U.uRingThickness, S.ringThickness);
    gl.uniform1f(U.uCoreRadius, CORE_RADIUS);
    gl.uniform3fv(U.uCoreColor, corLinear(cfg.coreColor));
    gl.uniform3fv(U.uRingColor, corLinear(cfg.ringColor));
    gl.uniform1f(U.uGlow, S.glow);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE); // mistura aditiva
    gl.clearColor(0, 0, 0, 0);

    /* Arrastar para girar */
    let time = 0, spinAngle = 0, dragYaw = 0, dragPitch = 0, velYaw = 0, velPitch = 0;
    let arrastando = false, lastX = 0, lastY = 0;
    const sens = clamp(cfg.dragSensitivity, 0, 10, 3) * 0.007;
    canvas.addEventListener('pointerdown', (e) => {
      arrastando = true;
      lastX = e.clientX;
      lastY = e.clientY;
      velYaw = 0;
      velPitch = 0;
      canvas.classList.add('is-grabbing');
      ligar();
    });
    window.addEventListener('pointermove', (e) => {
      if (!arrastando) return;
      const dx = e.clientX - lastX;
      const dy = toque ? 0 : e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      dragYaw += dx * sens;
      dragPitch += dy * sens;
      velYaw = dx * sens;
      velPitch = dy * sens;
      if (reduzir) ligar();
    }, { passive: true });
    const soltar = () => { arrastando = false; canvas.classList.remove('is-grabbing'); };
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);

    /* Tamanho e câmera */
    let W = 0, H = 0, dpr = 1;
    function ajustar() {
      W = container.clientWidth;
      H = container.clientHeight;
      if (!W || !H) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(U.uPixelRatio, dpr);
      const aspect = W / H;
      const distance = 1 / PERSPECTIVE;
      const span = VIEW_SPAN * (100 / clamp(cfg.sizePercent, 20, 200, 90));
      const visibleHeight = aspect < 1 ? span / aspect : span;
      const fov = 2 * Math.atan(visibleHeight / 2 / distance) * (180 / Math.PI);
      gl.uniformMatrix4fv(U.projectionMatrix, false, perspectiva(fov, aspect, Math.max(0.1, distance - 20), distance + 20));
    }

    let raf = 0, lastT = -1, visivel = false;
    function quadro(now) {
      raf = 0;
      if (!W || !H) ajustar();
      let dt = lastT < 0 ? 0 : (now - lastT) / 1000;
      lastT = now;
      if (!isFinite(dt) || dt < 0) dt = 0;
      if (dt > 0.05) dt = 0.05;

      if (!reduzir) time += dt;
      if (!arrastando) {
        const decay = Math.exp(-dt * 3);
        dragYaw += velYaw;
        dragPitch += velPitch;
        velYaw *= decay;
        velPitch *= decay;
        if (!reduzir) spinAngle += S.spinRate * dt;
      }

      const pitch = Math.max(-1.2, Math.min(1.2, dragPitch));
      // Ordem ZXY, igual ao original: Rz * Rx * Ry, e a câmera recuada no eixo Z
      const mv = mul(rotZ(S.rollRadians), mul(rotX(S.tiltRadians + pitch), rotY(dragYaw + spinAngle)));
      mv[14] = -1 / PERSPECTIVE;
      gl.uniformMatrix4fv(U.modelViewMatrix, false, mv);
      gl.uniform1f(U.uTime, time);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, nuvem.count);

      const movendo = Math.abs(velYaw) + Math.abs(velPitch) > 1e-4;
      if (visivel && !document.hidden && (!reduzir || arrastando || movendo)) raf = requestAnimationFrame(quadro);
    }
    function ligar() {
      if (!raf) { lastT = -1; raf = requestAnimationFrame(quadro); }
    }

    new ResizeObserver(() => { ajustar(); ligar(); }).observe(container);
    new IntersectionObserver((e) => {
      visivel = e[0].isIntersecting;
      if (visivel) ligar();
    }).observe(container);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && visivel) ligar(); });

    return { canvas };
  }

  window.NobiSaturno = NobiSaturno;
})();
