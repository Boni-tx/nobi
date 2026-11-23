/* ==========================================================
   Ribbon Glow
   Adaptado do componente "Ribbon Glow" do Originkit
   (https://www.originkit.dev/) de React para JavaScript puro.
   Uso: NobiRibbonGlow(elemento, { color1, color2, background })
   ========================================================== */
(() => {
  'use strict';

  const MAX_DPR = 2;
  const LAYERS = 84;
  const TWIST = 1.25;
  const DRAG = 0.18;

  const VERT_SRC = `#version 300 es
const vec2 P[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() { gl_Position = vec4(P[gl_VertexID], 0.0, 1.0); }
`;

  const FIELD_SRC = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uC1;
uniform vec3 uC2;
uniform float uSize;
uniform float uAngle;
uniform vec2 uMouse;
uniform float uOn;
uniform float uReach;
uniform vec2 uVel;
out vec4 o;

const float LAYERS = ${LAYERS.toFixed(1)};
const float TWIST = ${TWIST.toFixed(3)};
const float DRAG = ${DRAG.toFixed(3)};
const float GAIN = 0.62;
const vec2 CENTRE = vec2(-0.62, 0.24);
const float TILT = 0.6;
const float ZOOM = 1.05;
const float THETA = 2.13;
const float SHEAR = 0.963;
const float SHRINK = 0.953;
const vec2 WARP_FREQ = vec2(0.42, 2.4);
const vec2 WARP_AMP = vec2(0.13, 0.027);
const vec2 ASPECT = vec2(2.1, 0.17);
const float OFFSET = 0.36;
const float GLOW = 0.0021;
const float SOFT = 0.0019;
const float FALLOFF = 0.37;
const float PHASE = 12.0;
const float CYCLE = 0.16;
const float HUE_TRAVEL = 2.0;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }

void main() {
  vec2 R = uRes;
  vec2 pos = (gl_FragCoord.xy - 0.5 * R) / R.y;

  vec2 d = pos - uMouse;
  float w = uOn * exp(-dot(d, d) / (uReach * uReach));
  if (w > 1e-4) pos = uMouse + rot(w * TWIST) * d * (1.0 - 0.3 * min(w, 1.0)) - uVel * min(w, 1.0) * DRAG;

  pos = rot(uAngle) * pos / uSize;
  float t = uTime * 0.49 + PHASE;
  float breath = (-sin(uTime * 0.735) + sin(uTime * 0.49 + 1.0)) * 0.25 + 0.5;
  vec2 u = rot(TILT) * ((pos - CENTRE) * (ZOOM - breath * 0.085));
  mat2 fold = mat2(cos(THETA), sin(THETA), -SHEAR, cos(THETA));

  vec3 col = vec3(0.0);
  for (float i = 1.0; i <= LAYERS; i += 1.0) {
    u.x -= sin(u.y * WARP_FREQ.x + t + i * 0.007) * WARP_AMP.x;
    u.y -= sin(u.x * WARP_FREQ.y - t + i * 0.02) * WARP_AMP.y;
    u = fold * u * SHRINK;
    vec2 q = (u - vec2(OFFSET + breath * 0.1, 0.0)) * ASPECT;
    float g = GLOW / (dot(q, q) + SOFT) * (0.25 + breath * 0.4);
    float r = length(u);
    float k = sin(i * CYCLE + t * 1.2 + r * HUE_TRAVEL) * 0.5 + 0.5;
    col += g * mix(uC1, uC2, k) * (0.62 + 0.5 * k) * exp2(-r * FALLOFF);
  }
  vec3 x = max(col * GAIN, 0.0);
  col = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
  col = pow(clamp(col, 0.0, 1.0), vec3(0.85, 0.92, 0.98));
  col *= 1.0 - smoothstep(0.5, 1.6, length(pos)) * 0.07;
  o = vec4(col, 1.0);
}
`;

  const FINISH_SRC = `#version 300 es
precision highp float;
uniform sampler2D uField;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uBg;
uniform float uPaper;
out vec4 o;

float ign(vec2 p, float f) { p += 5.588238 * mod(f, 64.0); return fract(52.9829189 * fract(0.06711056 * p.x + 0.00583715 * p.y)); }

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec3 L = max(texture(uField, frag / uRes).rgb, 0.0);
  vec3 dark = uBg + L * (1.0 - uBg);
  float strength = clamp(max(L.r, max(L.g, L.b)), 0.0, 1.0);
  vec3 paper = uBg * (1.0 - strength) + L * 0.96;
  vec3 col = mix(dark, paper, uPaper);
  col += (ign(frag, floor(uTime * 24.0)) - 0.5) / 255.0;
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

  const clampN = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  function hexRGB(hex, fallback) {
    let h = String(hex || fallback).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h.slice(0, 6), 16);
    if (isNaN(n)) return hexRGB(fallback, '#000000');
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function link(gl, frag) {
    const shader = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error('RibbonGlow shader:', gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };
    const vs = shader(gl.VERTEX_SHADER, VERT_SRC);
    const fs = shader(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('RibbonGlow link:', gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      return null;
    }
    return prog;
  }

  function locations(gl, prog, names) {
    const out = {};
    names.forEach((n) => { out[n] = gl.getUniformLocation(prog, n); });
    return out;
  }

  function fieldTarget(gl) {
    const fbo = gl.createFramebuffer();
    let tex = null, w = 0, h = 0;
    let half = !!gl.getExtension('EXT_color_buffer_float');
    return {
      fbo,
      texture: () => tex,
      width: () => w,
      height: () => h,
      resize(nw, nh) {
        if (nw === w && nh === h && tex) return;
        for (let attempt = 0; attempt < 2; attempt++) {
          if (tex) gl.deleteTexture(tex);
          tex = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texImage2D(gl.TEXTURE_2D, 0, half ? gl.RGBA16F : gl.RGBA8, nw, nh, 0, gl.RGBA, half ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
          const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          if (ok || !half) break;
          half = false;
        }
        w = nw;
        h = nh;
      }
    };
  }

  function NobiRibbonGlow(root, opcoes) {
    if (!root) return null;
    const o = Object.assign({
      background: '#08090C',
      color1: '#FFD43B',
      color2: '#FF7A2F',
      speed: 50,     // 0 a 100
      size: 100,     // 50 a 200
      angle: -180,   // -180 a 180
      hover: 100,    // 0 a 200
      reach: 240     // 10 a 800
    }, opcoes);

    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = document.createElement('canvas');
    canvas.className = 'fx-canvas';
    root.appendChild(canvas);

    let gl = null;
    try {
      gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' });
    } catch (e) { gl = null; }
    const falhar = () => { canvas.remove(); root.classList.add('fx-fallback'); return null; };
    if (!gl) return falhar();

    const field = link(gl, FIELD_SRC);
    const finish = link(gl, FINISH_SRC);
    if (!field || !finish) return falhar();

    const uf = locations(gl, field, ['uRes', 'uTime', 'uC1', 'uC2', 'uSize', 'uAngle', 'uMouse', 'uOn', 'uReach', 'uVel']);
    const un = locations(gl, finish, ['uField', 'uRes', 'uTime', 'uBg', 'uPaper']);
    gl.bindVertexArray(gl.createVertexArray());
    const target = fieldTarget(gl);

    const speed = reduzir ? 0 : clampN(o.speed, 0, 100) / 50;
    const size = clampN(o.size, 50, 200) / 100;
    const angle = (clampN(o.angle, -180, 180) * Math.PI) / 180;
    const hover = reduzir ? 0 : clampN(o.hover, 0, 200) / 100;
    const reach = clampN(o.reach, 10, 800);
    const c1 = hexRGB(o.color1, '#FFD43B');
    const c2 = hexRGB(o.color2, '#FF7A2F');
    const bg = hexRGB(o.background, '#08090C');
    const bgLum = 0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2];
    // Telas pequenas calculam o brilho em resolução menor para poupar a bateria
    const escala = window.innerWidth < 800 ? 0.34 : 0.5;

    /* Ponteiro */
    const ptr = { tx: 0, ty: 0, inside: false };
    const ler = (e) => {
      const r = canvas.getBoundingClientRect();
      ptr.tx = e.clientX - r.left;
      ptr.ty = e.clientY - r.top;
      const s = root.parentElement ? root.parentElement.getBoundingClientRect() : r;
      ptr.inside = e.clientX >= s.left && e.clientX <= s.right && e.clientY >= s.top && e.clientY <= s.bottom;
    };
    window.addEventListener('pointermove', ler, { passive: true });
    window.addEventListener('pointerdown', ler, { passive: true });
    document.addEventListener('pointerout', (e) => { if (!e.relatedTarget) ptr.inside = false; });

    let mx = 0, my = 0, vx = 0, vy = 0, on = 0;
    let raf = 0, last = -1, clock = 0;
    let visivel = false;

    const render = (now) => {
      raf = 0;
      const dt = last < 0 ? 0 : clampN((now - last) / 1000, 0, 0.05);
      last = now;
      clock = (clock + dt * speed) % 3600;

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const cw = canvas.clientWidth || 1200;
      const ch = canvas.clientHeight || 800;
      const bw = Math.max(1, Math.round(cw * dpr));
      const bh = Math.max(1, Math.round(ch * dpr));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      target.resize(Math.max(1, Math.round(bw * escala)), Math.max(1, Math.round(bh * escala)));

      const present = ptr.inside ? 1 : 0;
      if (present && on < 0.02) { mx = ptr.tx; my = ptr.ty; }
      on += (present - on) * (1 - Math.exp(-dt * 5));
      const k = 1 - Math.exp(-dt * 16);
      const nx = mx + (ptr.tx - mx) * k;
      const ny = my + (ptr.ty - my) * k;
      if (dt > 0) {
        const kv = 1 - Math.exp(-dt * 8);
        vx += ((nx - mx) / dt - vx) * kv;
        vy += ((ny - my) / dt - vy) * kv;
      }
      mx = nx;
      my = ny;
      const vLen = Math.hypot(vx, vy) / ch;
      const vCap = vLen > 3 ? 3 / vLen : 1;

      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.viewport(0, 0, target.width(), target.height());
      gl.useProgram(field);
      gl.uniform2f(uf.uRes, target.width(), target.height());
      gl.uniform1f(uf.uTime, clock);
      gl.uniform3f(uf.uC1, c1[0], c1[1], c1[2]);
      gl.uniform3f(uf.uC2, c2[0], c2[1], c2[2]);
      gl.uniform1f(uf.uSize, size);
      gl.uniform1f(uf.uAngle, angle);
      gl.uniform2f(uf.uMouse, (mx - cw / 2) / ch, (ch / 2 - my) / ch);
      gl.uniform1f(uf.uOn, on * hover);
      gl.uniform1f(uf.uReach, reach / ch);
      gl.uniform2f(uf.uVel, (vx / ch) * vCap, (-vy / ch) * vCap);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, bw, bh);
      gl.useProgram(finish);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, target.texture());
      gl.uniform1i(un.uField, 0);
      gl.uniform2f(un.uRes, bw, bh);
      gl.uniform1f(un.uTime, clock);
      gl.uniform3f(un.uBg, bg[0], bg[1], bg[2]);
      gl.uniform1f(un.uPaper, clampN((bgLum - 0.35) / 0.3, 0, 1));
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (visivel && !reduzir && !document.hidden) raf = requestAnimationFrame(render);
    };

    const ligar = () => {
      if (!raf) { last = -1; raf = requestAnimationFrame(render); }
    };

    // Só desenha quando a seção está na tela
    new IntersectionObserver((entradas) => {
      visivel = entradas[0].isIntersecting;
      if (visivel) ligar();
    }, { rootMargin: '120px' }).observe(root.parentElement || root);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && visivel) ligar(); });
    new ResizeObserver(() => { if (visivel) ligar(); }).observe(canvas);

    return { canvas };
  }

  window.NobiRibbonGlow = NobiRibbonGlow;
})();
