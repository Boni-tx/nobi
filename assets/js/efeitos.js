/* ==========================================================
   Nobi · efeitos visuais
   Parallax, céu estrelado, planeta 3D, brilho do contato,
   inclinação 3D e cabeçalho transparente sobre o topo.
   ========================================================== */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const celular = window.matchMedia('(max-width: 860px)').matches;

  const hero = $('.hero-full');
  const finale = $('.finale');
  const header = $('.site-header');

  /* ---------- Céu estrelado (3 camadas com profundidades diferentes) ---------- */
  function gerarEstrelas() {
    const camadas = $$('.stars');
    if (!camadas.length) return;
    const largura = Math.max(window.innerWidth, 1400);
    const altura = Math.max(window.innerHeight, 900) * 1.5;
    const qtd = [140, 70, 28];
    camadas.forEach((camada, i) => {
      const sombras = [];
      for (let n = 0; n < qtd[i]; n++) {
        const x = Math.round(Math.random() * largura);
        const y = Math.round(Math.random() * altura);
        const amarela = Math.random() < 0.18;
        const alfa = (0.35 + Math.random() * 0.5).toFixed(2);
        sombras.push(x + 'px ' + y + 'px ' + (amarela ? 'rgba(255,212,59,' + alfa + ')' : 'rgba(235,240,255,' + alfa + ')'));
      }
      camada.style.boxShadow = sombras.join(',');
    });
  }

  /* ---------- Planeta de partículas (topo) ---------- */
  if (hero && window.NobiSaturno) {
    window.NobiSaturno($('#saturno'), {
      coreColor: '#997F00',
      ringColor: '#FFD400',
      density: celular ? 14 : 20,
      particleSize: 14,
      glow: 20,
      tilt: 6,
      roll: 7,
      spinSpeed: 7,
      ringOptions: { gaps: 1, orbitSpeed: 9, innerRadius: 105, outerRadius: 262 },
      dragSensitivity: 2,
      sizePercent: celular ? 150 : 118
    });
  }

  /* ---------- Faixa de brilho (contato) ---------- */
  if (finale && window.NobiRibbonGlow) {
    window.NobiRibbonGlow($('.finale-bg'), {
      background: '#08090C',
      color1: '#FFD43B',
      color2: '#FF7A2F',
      speed: 50,
      size: 100,
      angle: -180,
      hover: 100,
      reach: 240
    });
  }

  /* ---------- Parallax na rolagem ---------- */
  const alturaCabecalho = () => (header ? header.offsetHeight : 68);

  function atualizarCabecalho() {
    if (!header) return;
    const noInicio = document.body.dataset.pagina !== 'catalogo';
    const sobreHero = noInicio && hero && hero.getBoundingClientRect().bottom > alturaCabecalho() + 1;
    header.classList.toggle('on-dark', !!sobreHero);
  }

  let pedido = 0;
  function quadro() {
    pedido = 0;
    const vh = window.innerHeight;
    if (hero && !reduzir) {
      const r = hero.getBoundingClientRect();
      if (r.height) hero.style.setProperty('--p', Math.min(1, Math.max(0, -r.top / r.height)).toFixed(4));
    }
    if (finale && !reduzir) {
      const r = finale.getBoundingClientRect();
      const q = ((r.top + r.height / 2 - vh / 2) / (vh + r.height)) * 2;
      finale.style.setProperty('--q', Math.min(1, Math.max(-1, q)).toFixed(4));
    }
    atualizarCabecalho();
  }
  const agendar = () => { if (!pedido) pedido = requestAnimationFrame(quadro); };
  window.addEventListener('scroll', agendar, { passive: true });
  window.addEventListener('resize', agendar);
  window.addEventListener('hashchange', () => requestAnimationFrame(agendar));

  /* ---------- Parallax com o mouse no topo ---------- */
  if (hero && mouse && !reduzir) {
    let alvoX = 0, alvoY = 0, x = 0, y = 0, anim = 0;
    const suavizar = () => {
      x += (alvoX - x) * 0.08;
      y += (alvoY - y) * 0.08;
      hero.style.setProperty('--mx', x.toFixed(4));
      hero.style.setProperty('--my', y.toFixed(4));
      anim = Math.abs(alvoX - x) + Math.abs(alvoY - y) > 0.001 ? requestAnimationFrame(suavizar) : 0;
    };
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      alvoX = (e.clientX - r.left) / r.width - 0.5;
      alvoY = (e.clientY - r.top) / r.height - 0.5;
      if (!anim) anim = requestAnimationFrame(suavizar);
    });
    hero.addEventListener('pointerleave', () => {
      alvoX = 0;
      alvoY = 0;
      if (!anim) anim = requestAnimationFrame(suavizar);
    });
  }

  /* ---------- Inclinação 3D seguindo o mouse ---------- */
  if (mouse && !reduzir) {
    $$('[data-tilt]').forEach((el) => {
      const forca = Number(el.dataset.tilt) || 8;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', (px * forca).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-py * forca).toFixed(2) + 'deg');
        el.style.setProperty('--gx', ((px + 0.5) * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', ((py + 0.5) * 100).toFixed(1) + '%');
        el.classList.add('is-tilting');
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
        el.classList.remove('is-tilting');
      });
    });
  }

  /* ---------- Bolinhas pretas que reagem ao mouse (faixa amarela) ----------
     Uma malha de pontos: perto do cursor eles crescem e se afastam;
     um clique solta uma onda que passa pela malha. */
  function pontinhos(secao) {
    const canvas = document.createElement('canvas');
    canvas.className = 'dots-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    secao.prepend(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const GAP = 22;        // distância entre os pontos
    const BASE = 1.3;      // raio do ponto em repouso
    const MAX = 4.6;       // raio máximo perto do cursor
    const RAIO = 150;      // alcance do cursor
    const EMPURRAO = 16;   // quanto os pontos se afastam
    const COR = '#111418';

    let pontos = [];
    let w = 0, h = 0;
    const cursor = { x: -9999, y: -9999, ativo: false };
    const ondas = [];
    let raf = 0, visivel = false;

    function montar() {
      w = secao.clientWidth;
      h = secao.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cols = Math.ceil(w / GAP) + 1;
      const rows = Math.ceil(h / GAP) + 1;
      const ox = (w - (cols - 1) * GAP) / 2;
      const oy = (h - (rows - 1) * GAP) / 2;
      pontos = [];
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const bx = ox + i * GAP, by = oy + j * GAP;
          pontos.push({ bx, by, x: bx, y: by, s: BASE });
        }
      }
      desenhar();
    }

    function desenhar() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = COR;
      for (const p of pontos) {
        ctx.globalAlpha = Math.min(0.95, 0.2 + ((p.s - BASE) / (MAX - BASE)) * 0.75);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function passo(agora) {
      raf = 0;
      for (let k = ondas.length - 1; k >= 0; k--) if (agora - ondas[k].t > 1500) ondas.splice(k, 1);
      let mexendo = false;
      for (const p of pontos) {
        let alvoS = BASE, dx = 0, dy = 0;
        if (cursor.ativo) {
          const ddx = p.bx - cursor.x, ddy = p.by - cursor.y;
          const d = Math.hypot(ddx, ddy);
          if (d < RAIO) {
            const f = 1 - d / RAIO;
            const e = f * f * (3 - 2 * f);
            alvoS += (MAX - BASE) * e;
            const n = d || 1;
            dx += (ddx / n) * EMPURRAO * e;
            dy += (ddy / n) * EMPURRAO * e;
          }
        }
        for (const o of ondas) {
          const idade = (agora - o.t) / 1000;
          const frente = idade * 560;
          const ddx = p.bx - o.x, ddy = p.by - o.y;
          const d = Math.hypot(ddx, ddy);
          const faixa = Math.abs(d - frente);
          if (faixa < 44) {
            const e = (1 - faixa / 44) * Math.max(0, 1 - idade / 1.5);
            alvoS += 2.6 * e;
            const n = d || 1;
            dx += (ddx / n) * 10 * e;
            dy += (ddy / n) * 10 * e;
          }
        }
        const tx = p.bx + dx, ty = p.by + dy;
        p.x += (tx - p.x) * 0.2;
        p.y += (ty - p.y) * 0.2;
        p.s += (alvoS - p.s) * 0.2;
        if (!mexendo && (Math.abs(tx - p.x) > 0.05 || Math.abs(ty - p.y) > 0.05 || Math.abs(alvoS - p.s) > 0.02)) mexendo = true;
      }
      desenhar();
      if (visivel && (mexendo || ondas.length || cursor.ativo)) raf = requestAnimationFrame(passo);
    }
    const ligar = () => { if (!raf && visivel) raf = requestAnimationFrame(passo); };

    new ResizeObserver(montar).observe(secao);
    new IntersectionObserver((e) => { visivel = e[0].isIntersecting; if (visivel) desenhar(); }).observe(secao);
    if (reduzir) return; // sem animação: só a malha parada

    const posicao = (e) => {
      const r = secao.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    secao.addEventListener('pointermove', (e) => {
      const p = posicao(e);
      cursor.x = p.x;
      cursor.y = p.y;
      cursor.ativo = true;
      ligar();
    });
    secao.addEventListener('pointerleave', () => { cursor.ativo = false; ligar(); });
    secao.addEventListener('pointerdown', (e) => {
      const p = posicao(e);
      ondas.push({ x: p.x, y: p.y, t: performance.now() });
      if (ondas.length > 4) ondas.shift();
      ligar();
    });
  }
  $$('[data-pontinhos]').forEach(pontinhos);

  gerarEstrelas();
  quadro();
})();
