/* ==========================================================
   Nobi · modelos de Site Comum
   Cada modelo é uma página completa exibida dentro do catálogo.
   Nome, cor e fotos do cliente são aplicados em tempo real.
   ========================================================== */
(() => {
  'use strict';

  /* ---------- Utilitários de cor (usados pelo site principal) ---------- */
  function parse(h) {
    h = String(h || '').replace('#', '');
    if (h.length === 3) h = h.replace(/./g, '$&$&');
    const n = parseInt(h, 16);
    if (h.length !== 6 || isNaN(n)) return [14, 124, 102];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const toHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = parse(a), y = parse(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
  function lum(c) {
    const p = parse(c).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
  }
  const contraste = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const sobre = (c) => (contraste(c, '#ffffff') >= contraste(c, '#111111') ? '#ffffff' : '#111111');
  function legivel(c, fundo) {
    const alvo = lum(fundo) > 0.4 ? '#000000' : '#ffffff';
    let out = c, t = 0;
    while (contraste(out, fundo) < 4.5 && t < 1) { t += 0.05; out = mix(c, alvo, t); }
    return out;
  }
  const slug = (s) => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

  /* ---------- Script que roda DENTRO de cada modelo ----------
     Precisa ser autossuficiente: é convertido em texto e injetado no modelo. */
  function runtime(inicial) {
    var PADRAO = 'Seu Negócio';
    var estado = { nome: '', cor: '#0E7C66', fotos: [], marca: 'Nobi' };
    function parse(h) {
      h = String(h || '').replace('#', '');
      if (h.length === 3) h = h.replace(/./g, '$&$&');
      var n = parseInt(h, 16);
      if (h.length !== 6 || isNaN(n)) return [14, 124, 102];
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function hex(rgb) { return '#' + rgb.map(function (v) { return Math.round(v).toString(16).padStart(2, '0'); }).join(''); }
    function mix(a, b, t) { var x = parse(a), y = parse(b); return hex(x.map(function (v, i) { return v + (y[i] - v) * t; })); }
    function lum(c) {
      var p = parse(c).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
    }
    function contraste(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
    function legivel(c, fundo) {
      var alvo = lum(fundo) > 0.4 ? '#000000' : '#ffffff', out = c, t = 0;
      while (contraste(out, fundo) < 4.5 && t < 1) { t += 0.05; out = mix(c, alvo, t); }
      return out;
    }
    function slug(s) { return String(s || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ''); }

    /* Imagem de exemplo, na cor escolhida, até o cliente enviar as fotos dele */
    function exemplo(i, c) {
      var claro = mix(c, '#ffffff', 0.8), medio = mix(c, '#ffffff', 0.5), base = mix(c, '#ffffff', 0.1),
          escuro = mix(c, '#000000', 0.35), sol = mix(c, '#ffffff', 0.93), v = i % 3, formas;
      if (v === 0) formas = '<circle cx="610" cy="185" r="74" fill="' + sol + '"/><path d="M0 470 L170 310 L300 410 L460 250 L800 480 V600 H0Z" fill="' + base + '"/><path d="M0 530 L230 420 L420 510 L610 430 L800 520 V600 H0Z" fill="' + escuro + '"/>';
      else if (v === 1) formas = '<rect x="110" y="130" width="250" height="360" rx="125" fill="' + base + '"/><rect x="410" y="250" width="270" height="240" rx="18" fill="' + escuro + '"/><circle cx="545" cy="175" r="48" fill="' + sol + '"/>';
      else formas = '<circle cx="280" cy="330" r="170" fill="' + base + '"/><circle cx="530" cy="290" r="118" fill="' + sol + '"/><rect y="500" width="800" height="100" fill="' + escuro + '"/>';
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + claro + '"/><stop offset="1" stop-color="' + medio + '"/></linearGradient></defs>' +
        '<rect width="800" height="600" fill="url(#g)"/>' + formas +
        '<g transform="translate(400 205)" opacity=".82"><rect x="-86" y="-19" width="172" height="38" rx="19" fill="#ffffff"/>' +
        '<text y="6" text-anchor="middle" font-family="ui-monospace,monospace" font-size="16" letter-spacing="2" fill="' + escuro + '">SUA FOTO ' + (i + 1) + '</text></g></svg>';
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    function aplicar(cfg) {
      for (var k in cfg) if (cfg[k] !== undefined) estado[k] = cfg[k];
      var c = estado.cor, r = document.documentElement.style;
      r.setProperty('--b', c);
      r.setProperty('--on-b', contraste(c, '#ffffff') >= contraste(c, '#111111') ? '#ffffff' : '#111111');
      r.setProperty('--b-text', legivel(c, '#ffffff'));
      r.setProperty('--b-light', legivel(c, '#16181d'));
      var nome = String(estado.nome || '').trim() || PADRAO;
      document.title = nome;
      document.querySelectorAll('[data-name]').forEach(function (el) { el.textContent = nome; });
      document.querySelectorAll('[data-initial]').forEach(function (el) { el.textContent = nome.charAt(0).toUpperCase(); });
      document.querySelectorAll('[data-handle]').forEach(function (el) { el.textContent = '@' + (slug(nome) || 'seunegocio'); });
      document.querySelectorAll('[data-credito]').forEach(function (el) { el.textContent = 'Site criado por ' + estado.marca; });
      var fotos = estado.fotos || [];
      document.querySelectorAll('img[data-photo]').forEach(function (img) {
        var i = Number(img.getAttribute('data-photo'));
        var src = fotos.length ? fotos[i % fotos.length] : exemplo(i, c);
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
      });
    }

    window.addEventListener('message', function (e) {
      var d = e.data;
      if (d && d.tipo === 'nobi:config' && d.cfg) aplicar(d.cfg);
    });
    /* Links do modelo só rolam a página; nada sai da prévia */
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      e.preventDefault();
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) === '#' && href.length > 1) {
        var alvo = document.getElementById(href.slice(1));
        if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    document.addEventListener('submit', function (e) { e.preventDefault(); });
    aplicar(inicial);
  }

  /* ---------- CSS comum a todos os modelos ---------- */
  const BASE = `
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{margin:0;line-height:1.5;-webkit-font-smoothing:antialiased}
img{display:block;max-width:100%;background:var(--b-soft)}
a{color:inherit}
h1,h2,h3{margin:0}
:root{--b:#0E7C66;--on-b:#fff;--b-text:#0E7C66;--b-light:#5fd0b6;--b-soft:color-mix(in srgb,var(--b) 10%,#fff);--b-deep:color-mix(in srgb,var(--b) 65%,#000)}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
`;

  /* =========================================================
     MODELO 01 · VITRINE
     Capa com foto em tela cheia, sobre, serviços, galeria e contato.
     ========================================================= */
  const VITRINE = {
    id: 'vitrine',
    nome: 'Vitrine',
    codigo: 'Modelo 01',
    fontes: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Figtree:wght@400;500;600;700&display=swap',
    css: `
body{font-family:"Figtree",system-ui,sans-serif;color:#1c1e22;background:#fff;font-size:17px}
h1,h2,h3{font-family:"Fraunces",Georgia,serif;font-weight:700;line-height:1.05;letter-spacing:-.01em}
.w{max-width:1160px;margin:0 auto;padding:0 28px}
.eyebrow{margin:0;font-size:13px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:14px 24px;border-radius:999px;border:2px solid var(--b);background:var(--b);color:var(--on-b);font-weight:600;font-size:15px;text-decoration:none}
.btn.ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.75)}
.nav{position:absolute;inset:0 0 auto 0;z-index:3;color:#fff}
.nav .w{display:flex;align-items:center;gap:32px;height:84px}
.logo{display:flex;align-items:center;gap:12px;text-decoration:none;font-family:"Fraunces",Georgia,serif;font-weight:700;font-size:22px}
.logo i{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:var(--b);color:var(--on-b);font-style:normal;font-size:18px}
.nav nav{display:flex;gap:28px;margin-left:auto;font-size:15px;font-weight:500}
.nav nav a{text-decoration:none;opacity:.92}
.hero{position:relative;display:flex;align-items:flex-end;min-height:680px;overflow:hidden;color:#fff;background:var(--b-deep)}
.hero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.45) 0,rgba(0,0,0,.05) 35%,rgba(0,0,0,.72) 100%)}
.hero .in{position:relative;width:100%;padding-bottom:96px}
.hero h1{max-width:11ch;margin:14px 0 18px;font-size:clamp(48px,8vw,104px);overflow-wrap:anywhere}
.lead{max-width:44ch;margin:0 0 30px;font-size:19px;line-height:1.55;opacity:.92}
.row{display:flex;flex-wrap:wrap;gap:12px}
section{padding:104px 0}
.about .w{display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center}
.about img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:6px}
.about .eyebrow,.sec-title .eyebrow,.contact .eyebrow{color:var(--b-text)}
.about h2,.sec-title h2,.contact h2{margin:12px 0 20px;font-size:clamp(34px,4vw,48px)}
.about p{margin:0;color:#555a62;line-height:1.75}
.facts{display:flex;flex-wrap:wrap;gap:40px;margin:32px 0 0;padding:28px 0 0;list-style:none;border-top:1px solid #eceef1}
.facts b{display:block;font-family:"Fraunces",Georgia,serif;font-size:40px;line-height:1.1;color:var(--b-text)}
.facts span{font-size:14px;color:#6b7078}
.services{background:var(--b-soft)}
.sec-title{margin-bottom:52px;text-align:center}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.card{overflow:hidden;border-radius:6px;background:#fff}
.card img{width:100%;aspect-ratio:4/3;object-fit:cover}
.card div{padding:24px 26px 28px}
.card h3{margin-bottom:10px;font-size:24px}
.card p{margin:0;color:#5b6068;line-height:1.6}
.gal{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:230px;gap:12px}
.gal img{width:100%;height:100%;object-fit:cover;border-radius:6px}
.gal img:first-child{grid-column:span 2;grid-row:span 2}
.quote{text-align:center;background:var(--b);color:var(--on-b)}
.quote blockquote{max-width:26ch;margin:0 auto 22px;font-family:"Fraunces",Georgia,serif;font-size:clamp(28px,3.6vw,42px);line-height:1.25}
.quote p{margin:0;font-size:15px;opacity:.85}
.contact .w{display:grid;grid-template-columns:1fr 1.1fr;gap:56px;align-items:stretch}
.info{display:grid;gap:16px;margin:0 0 32px;padding:0;list-style:none}
.info li{display:grid;gap:4px;padding-bottom:16px;border-bottom:1px solid #eceef1}
.info small{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#80858d}
.map{position:relative;min-height:380px;overflow:hidden;border-radius:6px;background-color:#eef0ee;background-image:linear-gradient(90deg,transparent 47%,#fff 47%,#fff 53%,transparent 53%),linear-gradient(0deg,transparent 47%,#fff 47%,#fff 53%,transparent 53%),linear-gradient(90deg,rgba(0,0,0,.04) 1px,transparent 1px),linear-gradient(0deg,rgba(0,0,0,.04) 1px,transparent 1px);background-size:220px 220px,220px 220px,44px 44px,44px 44px}
.pin{position:absolute;left:50%;top:46%;width:28px;height:28px;border-radius:50% 50% 50% 0;background:var(--b);transform:translate(-50%,-50%) rotate(-45deg);box-shadow:0 0 0 8px color-mix(in srgb,var(--b) 25%,transparent)}
footer{padding:28px 0;font-size:14px;background:#121417;color:#c5c9cf}
footer .w{display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px}
@media (max-width:760px){
  .w{padding:0 20px}
  .nav nav,.nav .btn{display:none}
  .nav .w{height:72px}
  .hero{min-height:600px}
  .hero .in{padding-bottom:64px}
  section{padding:72px 0}
  .about .w,.contact .w{grid-template-columns:1fr;gap:36px}
  .cards{grid-template-columns:1fr}
  .gal{grid-template-columns:1fr 1fr;grid-auto-rows:150px}
  .map{min-height:260px}
}`,
    html: `
<header class="nav"><div class="w">
  <a class="logo" href="#topo"><i data-initial></i><span data-name></span></a>
  <nav><a href="#sobre">Sobre</a><a href="#servicos">Serviços</a><a href="#galeria">Galeria</a><a href="#contato">Contato</a></nav>
  <a class="btn" href="#contato">Fale conosco</a>
</div></header>
<section class="hero" id="topo">
  <img data-photo="0" alt="">
  <div class="shade"></div>
  <div class="w in">
    <p class="eyebrow">Bem-vindo à</p>
    <h1 data-name></h1>
    <p class="lead">Qualidade, cuidado nos detalhes e um atendimento que faz você querer voltar.</p>
    <div class="row"><a class="btn" href="#contato">Agendar visita</a><a class="btn ghost" href="#servicos">Nossos serviços</a></div>
  </div>
</section>
<section class="about" id="sobre"><div class="w">
  <img data-photo="1" alt="">
  <div>
    <p class="eyebrow">Sobre nós</p>
    <h2>Uma história construída com carinho</h2>
    <p>A <b data-name></b> nasceu da vontade de fazer diferente: produtos e serviços pensados para quem valoriza qualidade. Cada detalhe é feito com dedicação, do primeiro contato ao pós-atendimento.</p>
    <ul class="facts"><li><b>+10</b><span>anos de experiência</span></li><li><b>2 mil</b><span>clientes atendidos</span></li><li><b>4,9</b><span>nota média</span></li></ul>
  </div>
</div></section>
<section class="services" id="servicos"><div class="w">
  <div class="sec-title"><p class="eyebrow">O que oferecemos</p><h2>Nossos serviços</h2></div>
  <div class="cards">
    <article class="card"><img data-photo="2" alt=""><div><h3>Atendimento completo</h3><p>Do primeiro contato até a entrega, você acompanha tudo de perto.</p></div></article>
    <article class="card"><img data-photo="3" alt=""><div><h3>Produtos selecionados</h3><p>Trabalhamos só com o que usaríamos para nós mesmos.</p></div></article>
    <article class="card"><img data-photo="4" alt=""><div><h3>Sob encomenda</h3><p>Precisa de algo especial? A gente prepara do seu jeito.</p></div></article>
  </div>
</div></section>
<section id="galeria"><div class="w">
  <div class="sec-title"><p class="eyebrow">Galeria</p><h2>Um pouco do nosso dia a dia</h2></div>
  <div class="gal"><img data-photo="5" alt=""><img data-photo="0" alt=""><img data-photo="1" alt=""><img data-photo="2" alt=""><img data-photo="3" alt=""></div>
</div></section>
<section class="quote"><div class="w"><blockquote>“Atendimento impecável do começo ao fim. Virei cliente fiel!”</blockquote><p>Mariana S. · cliente desde 2021</p></div></section>
<section class="contact" id="contato"><div class="w">
  <div>
    <p class="eyebrow">Contato</p>
    <h2>Venha nos visitar</h2>
    <ul class="info">
      <li><small>Endereço</small>Rua das Flores, 120 · Centro</li>
      <li><small>Horário</small>Seg. a sex., 9h às 19h · Sáb., 9h às 13h</li>
      <li><small>WhatsApp</small>(00) 00000-0000</li>
      <li><small>Instagram</small><span data-handle></span></li>
    </ul>
    <a class="btn" href="#contato">Chamar no WhatsApp</a>
  </div>
  <div class="map" aria-hidden="true"><span class="pin"></span></div>
</div></section>
<footer><div class="w"><span>© 2026 <span data-name></span></span><span data-credito></span></div></footer>`
  };

  /* =========================================================
     MODELO 02 · PERFIL
     Abertura dividida (texto + foto), números, blocos alternados e dúvidas.
     ========================================================= */
  const PERFIL = {
    id: 'perfil',
    nome: 'Perfil',
    codigo: 'Modelo 02',
    fontes: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
    css: `
body{font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#15171c;background:#fbfbf9;font-size:17px}
.w{max-width:1160px;margin:0 auto;padding:0 28px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:15px 26px;border-radius:14px;background:var(--b);color:var(--on-b);font-weight:700;font-size:15px;text-decoration:none}
.btn.line{background:transparent;color:#15171c;box-shadow:inset 0 0 0 2px #15171c}
.top .w{display:flex;align-items:center;gap:36px;height:84px}
.logo{display:flex;align-items:center;gap:12px;font-weight:800;font-size:20px;letter-spacing:-.02em;text-decoration:none}
.logo i{width:14px;height:14px;border-radius:4px;background:var(--b);transform:rotate(45deg)}
.top nav{display:flex;gap:30px;margin-left:auto;font-size:15px;font-weight:600;color:#50555f}
.top nav a{text-decoration:none}
.hero .w{display:grid;grid-template-columns:1.08fr .92fr;gap:64px;align-items:center;padding-top:36px;padding-bottom:88px}
.pill{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:var(--b-soft);color:var(--b-text);font-size:13px;font-weight:700}
.pill::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--b)}
.hero h1{margin:22px 0;font-size:clamp(40px,5.4vw,66px);font-weight:800;line-height:1.03;letter-spacing:-.04em}
.hero h1 em{font-style:normal;color:var(--b-text)}
.hero p{max-width:44ch;margin:0 0 32px;font-size:18px;line-height:1.65;color:#565c66}
.row{display:flex;flex-wrap:wrap;gap:12px}
.photo{position:relative}
.photo img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:28px 28px 28px 160px}
.badge{position:absolute;left:-28px;bottom:48px;display:flex;align-items:center;gap:12px;padding:14px 20px;border-radius:18px;background:#fff;box-shadow:0 18px 50px rgba(0,0,0,.14);font-size:13px;line-height:1.35;color:#565c66}
.badge b{font-size:28px;letter-spacing:-.03em;color:#15171c}
.badge em{font-style:normal;color:#f0a020;letter-spacing:1px}
.stats{background:#15171c;color:#fff}
.stats .w{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding-top:44px;padding-bottom:44px}
.stats div{padding-left:22px;border-left:2px solid var(--b)}
.stats b{display:block;font-size:34px;font-weight:800;letter-spacing:-.03em;color:var(--b-light)}
.stats span{font-size:15px;color:#b9bec6}
.feature .w{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;padding-top:104px}
.feature.rev img{order:2}
.feature img{width:100%;aspect-ratio:5/4;object-fit:cover;border-radius:28px}
.feature h2{margin:18px 0 16px;font-size:clamp(32px,3.6vw,44px);font-weight:800;line-height:1.08;letter-spacing:-.035em}
.feature p{margin:0;line-height:1.7;color:#565c66}
.checks{display:grid;gap:14px;margin:26px 0 0;padding:0;list-style:none;font-weight:600}
.checks li{display:flex;align-items:center;gap:12px}
.checks li::before{content:"✓";flex:none;display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--b-soft);color:var(--b-text);font-size:13px;font-weight:800}
.cta{padding:104px 28px}
.cta .box{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:32px;max-width:1104px;margin:0 auto;padding:64px;border-radius:32px;background:var(--b);color:var(--on-b)}
.cta h2{max-width:16ch;font-size:clamp(30px,3.6vw,44px);font-weight:800;line-height:1.08;letter-spacing:-.035em}
.cta .btn{background:#fff;color:#15171c}
.faq{padding:0 0 104px}
.faq .w{max-width:820px}
.faq h2{margin-bottom:20px;font-size:36px;font-weight:800;letter-spacing:-.03em}
details{padding:22px 0;border-bottom:1px solid #e4e5e9}
summary{display:flex;justify-content:space-between;gap:16px;font-size:18px;font-weight:700;cursor:pointer;list-style:none}
summary::-webkit-details-marker{display:none}
summary::after{content:"+";font-size:24px;line-height:1;color:var(--b-text)}
details[open] summary::after{content:"−"}
details p{margin:12px 0 0;line-height:1.7;color:#565c66}
footer{padding:28px 0;font-size:14px;color:#6a707a;border-top:1px solid #e4e5e9}
footer .w{display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px}
@media (max-width:760px){
  .w{padding:0 20px}
  .top nav{display:none}
  .top .btn{margin-left:auto;padding:11px 16px;font-size:14px}
  .hero .w,.feature .w{grid-template-columns:1fr;gap:40px}
  .feature .w{padding-top:72px}
  .feature.rev img{order:0}
  .badge{left:12px;bottom:16px}
  .stats .w{grid-template-columns:1fr;gap:20px}
  .cta{padding:72px 20px}
  .cta .box{padding:40px 28px;border-radius:24px}
}`,
    html: `
<header class="top"><div class="w">
  <a class="logo" href="#topo"><i></i><span data-name></span></a>
  <nav><a href="#como">Como trabalhamos</a><a href="#diferenciais">Diferenciais</a><a href="#duvidas">Dúvidas</a></nav>
  <a class="btn" href="#contato">Agendar horário</a>
</div></header>
<section class="hero" id="topo"><div class="w">
  <div>
    <span class="pill">Agenda aberta este mês</span>
    <h1>Cuidado de verdade, com a experiência da <em data-name></em>.</h1>
    <p>Atendimento próximo, sem pressa e com atenção a cada detalhe. Conte o que você precisa e a gente cuida do resto.</p>
    <div class="row"><a class="btn" href="#contato">Quero agendar</a><a class="btn line" href="#como">Como funciona</a></div>
  </div>
  <div class="photo"><img data-photo="0" alt=""><div class="badge"><b>4,9</b><span><em>★★★★★</em><br>+300 avaliações</span></div></div>
</div></section>
<section class="stats"><div class="w">
  <div><b>+8 anos</b><span>de experiência</span></div>
  <div><b>+1.500</b><span>clientes atendidos</span></div>
  <div><b>98%</b><span>voltam e indicam</span></div>
</div></section>
<section class="feature" id="como"><div class="w">
  <img data-photo="1" alt="">
  <div>
    <span class="pill">Como trabalhamos</span>
    <h2>Um atendimento pensado para você</h2>
    <p>Antes de qualquer coisa, a gente escuta. Entendemos sua necessidade, explicamos cada etapa e montamos um plano do seu jeito.</p>
    <ul class="checks"><li>Primeira conversa sem compromisso</li><li>Plano feito sob medida</li><li>Acompanhamento em cada etapa</li></ul>
  </div>
</div></section>
<section class="feature rev" id="diferenciais"><div class="w">
  <img data-photo="2" alt="">
  <div>
    <span class="pill">Diferenciais</span>
    <h2>Estrutura confortável e equipe preparada</h2>
    <p>Um espaço pensado para você se sentir em casa, com profissionais que se atualizam o tempo todo.</p>
    <ul class="checks"><li>Ambiente acolhedor</li><li>Profissionais qualificados</li><li>Horários flexíveis</li></ul>
  </div>
</div></section>
<section class="cta" id="contato"><div class="box"><h2>Pronto para dar o próximo passo?</h2><a class="btn" href="#contato">Falar no WhatsApp</a></div></section>
<section class="faq" id="duvidas"><div class="w">
  <h2>Dúvidas frequentes</h2>
  <details open><summary>Como faço para agendar?</summary><p>É só chamar no WhatsApp ou tocar em “Agendar horário”. Respondemos rapidinho.</p></details>
  <details><summary>Quais formas de pagamento vocês aceitam?</summary><p>Pix, cartão de crédito e débito.</p></details>
  <details><summary>Atendem aos sábados?</summary><p>Sim, aos sábados pela manhã, com horário marcado.</p></details>
</div></section>
<footer><div class="w"><span>© 2026 <span data-name></span></span><span data-credito></span></div></footer>`
  };

  /* =========================================================
     MODELO 03 · GALERIA
     Menu lateral fixo na cor da marca e mosaico de fotos.
     ========================================================= */
  const GALERIA = {
    id: 'galeria',
    nome: 'Galeria',
    codigo: 'Modelo 03',
    fontes: 'https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Figtree:wght@400;500;600;700&display=swap',
    css: `
body{font-family:"Figtree",system-ui,sans-serif;color:#151515;background:#f5f4f0;font-size:16px}
.layout{display:grid;grid-template-columns:300px minmax(0,1fr);min-height:100vh}
aside{position:sticky;top:0;display:flex;flex-direction:column;gap:28px;height:100vh;overflow:auto;padding:40px 32px;background:var(--b);color:var(--on-b)}
.name{font-family:"Syne",sans-serif;font-weight:800;font-size:40px;line-height:.95;letter-spacing:-.02em;text-decoration:none;overflow-wrap:anywhere}
.tag{margin:-14px 0 0;font-size:14px;opacity:.8}
aside nav{display:grid;gap:12px;font-size:17px;font-weight:500}
aside nav a{display:flex;justify-content:space-between;padding-bottom:10px;text-decoration:none;border-bottom:1px solid color-mix(in srgb,var(--on-b) 25%,transparent)}
aside nav a::after{content:"→";opacity:.7}
.meta{display:grid;gap:6px;margin-top:auto;font-size:14px;opacity:.85}
main{padding:48px 56px 32px}
.intro{display:flex;justify-content:space-between;align-items:flex-end;gap:40px;margin-bottom:32px;padding-bottom:32px;border-bottom:1px solid #dddbd4}
.intro h1{max-width:13ch;font-family:"Syne",sans-serif;font-weight:800;font-size:clamp(36px,4.6vw,64px);line-height:.98;letter-spacing:-.03em}
.intro p{max-width:34ch;margin:0;line-height:1.6;color:#5f5d57}
.masonry{columns:3 240px;column-gap:18px}
.masonry figure{margin:0 0 18px;break-inside:avoid}
.masonry img{width:100%;object-fit:cover;border-radius:8px}
.masonry figure:nth-child(3n+1) img{aspect-ratio:4/5}
.masonry figure:nth-child(3n+2) img{aspect-ratio:1/1}
.masonry figure:nth-child(3n) img{aspect-ratio:3/4}
figcaption{display:flex;justify-content:space-between;padding-top:8px;font-size:13px;color:#6f6c65}
.about{display:grid;grid-template-columns:.8fr 1.2fr;gap:48px;margin-top:40px;padding:72px 0;border-top:1px solid #dddbd4}
.about h2,.contact-card h2{font-family:"Syne",sans-serif;font-weight:800;font-size:36px;line-height:1.05;letter-spacing:-.02em}
.about p{margin:0 0 14px;line-height:1.75;color:#4f4d48}
.contact-card{display:grid;grid-template-columns:1fr 1fr;gap:40px;padding:40px;border-radius:14px;background:#fff}
.contact-card>div p{margin:14px 0 0;line-height:1.6;color:#5f5d57}
form{display:grid;gap:14px}
label{display:grid;gap:6px;font-size:13px;font-weight:600;color:#4f4d48}
input,textarea{padding:12px 14px;border:1.5px solid #dddbd4;border-radius:10px;background:#faf9f6;color:#151515;font:inherit;font-size:15px;resize:vertical}
input:focus,textarea:focus{outline:none;border-color:var(--b)}
.btn{justify-self:start;padding:14px 24px;border:0;border-radius:10px;background:var(--b);color:var(--on-b);font:inherit;font-weight:700;cursor:pointer}
footer{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;padding:32px 0 8px;font-size:13px;color:#77746d}
@media (max-width:860px){
  .layout{grid-template-columns:1fr}
  aside{position:relative;flex-direction:row;flex-wrap:wrap;align-items:center;gap:10px 20px;height:auto;padding:22px 20px}
  .name{font-size:26px}
  .tag,.meta{display:none}
  aside nav{display:flex;gap:16px;margin-left:auto;font-size:14px}
  aside nav a{padding:0;border:0}
  aside nav a::after{content:none}
  main{padding:28px 20px 24px}
  .intro{flex-direction:column;align-items:flex-start;gap:16px}
  .masonry{columns:2 140px;column-gap:10px}
  .masonry figure{margin-bottom:10px}
  .about,.contact-card{grid-template-columns:1fr;gap:24px}
  .about{padding:48px 0}
  .contact-card{padding:26px}
}`,
    html: `
<div class="layout">
  <aside>
    <a class="name" href="#topo" data-name></a>
    <p class="tag">Portfólio &amp; estúdio</p>
    <nav><a href="#trabalhos">Trabalhos</a><a href="#sobre">Sobre</a><a href="#contato">Contato</a></nav>
    <div class="meta"><span data-handle></span><span>(00) 00000-0000</span><span>Atendimento com hora marcada</span></div>
  </aside>
  <main id="topo">
    <div class="intro" id="trabalhos">
      <h1>Trabalhos que falam por si.</h1>
      <p>Uma seleção dos projetos que mais nos orgulham. Cada imagem conta um pedaço da história da <span data-name></span>.</p>
    </div>
    <div class="masonry">
      <figure><img data-photo="0" alt=""><figcaption><span>Projeto 01</span><span>2026</span></figcaption></figure>
      <figure><img data-photo="1" alt=""><figcaption><span>Projeto 02</span><span>2026</span></figcaption></figure>
      <figure><img data-photo="2" alt=""><figcaption><span>Projeto 03</span><span>2025</span></figcaption></figure>
      <figure><img data-photo="3" alt=""><figcaption><span>Projeto 04</span><span>2025</span></figcaption></figure>
      <figure><img data-photo="4" alt=""><figcaption><span>Projeto 05</span><span>2025</span></figcaption></figure>
      <figure><img data-photo="5" alt=""><figcaption><span>Projeto 06</span><span>2024</span></figcaption></figure>
    </div>
    <section class="about" id="sobre">
      <h2>Sobre o estúdio</h2>
      <div>
        <p>Somos apaixonados pelo que fazemos e acreditamos que cada cliente merece um resultado único. Do primeiro rascunho à entrega final, tudo passa pelo nosso olhar atento.</p>
        <p>Trabalhamos com agenda reduzida para dar a cada projeto o tempo e o cuidado que ele merece.</p>
      </div>
    </section>
    <section class="contact-card" id="contato">
      <div><h2>Vamos criar algo juntos?</h2><p>Conte sua ideia e retornamos em até um dia útil.</p></div>
      <form>
        <label>Nome<input placeholder="Seu nome"></label>
        <label>WhatsApp<input placeholder="(00) 00000-0000"></label>
        <label>Mensagem<textarea rows="3" placeholder="Conte um pouco sobre o que você precisa"></textarea></label>
        <button class="btn" type="button">Enviar mensagem</button>
      </form>
    </section>
    <footer><span>© 2026 <span data-name></span></span><span data-credito></span></footer>
  </main>
</div>`
  };

  /* =========================================================
     MODELO 04 · BENTO
     Página montada em blocos de tamanhos diferentes, como um painel.
     ========================================================= */
  const BENTO = {
    id: 'bento',
    nome: 'Bento',
    codigo: 'Modelo 04',
    fontes: 'https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Onest:wght@400;500;600&display=swap',
    css: `
body{font-family:"Onest",system-ui,sans-serif;color:#141414;background:#f2f2ef;font-size:16px}
h1,h2,h3{font-family:"Sora",system-ui,sans-serif;line-height:1.05;letter-spacing:-.03em}
.w{max-width:1200px;margin:0 auto;padding:0 24px}
.top .w{display:flex;align-items:center;gap:24px;height:80px}
.logo{display:flex;align-items:center;gap:10px;font-family:"Sora",sans-serif;font-weight:700;font-size:19px;text-decoration:none}
.logo i{display:grid;place-items:center;width:36px;height:36px;border-radius:11px;background:var(--b);color:var(--on-b);font-style:normal;font-size:16px;font-weight:800}
.top nav{display:flex;gap:4px;margin-left:auto;padding:5px;border-radius:999px;background:#fff}
.top nav a{padding:8px 16px;border-radius:999px;font-size:14px;font-weight:500;color:#444;text-decoration:none}
.top nav a:first-child{background:#141414;color:#fff}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px 22px;border-radius:999px;background:#141414;color:#fff;font-weight:600;font-size:15px;text-decoration:none}
.btn.b{background:var(--b);color:var(--on-b)}
.btn.inv{background:#fff;color:#141414}
.btn.ghost{background:transparent;color:inherit;box-shadow:inset 0 0 0 1.5px currentColor}
.bento{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;padding:8px 0 14px}
.t{position:relative;overflow:hidden;min-height:170px;border-radius:26px;background:#fff;text-decoration:none;color:inherit}
.t>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.intro{grid-column:span 3;grid-row:span 2;display:flex;flex-direction:column;justify-content:flex-end;gap:18px;min-height:460px;padding:44px;background:var(--b);color:var(--on-b)}
.chip{align-self:flex-start;padding:7px 14px;border-radius:999px;background:color-mix(in srgb,var(--on-b) 16%,transparent);font-size:13px;font-weight:600}
.intro h1{font-size:clamp(46px,7vw,92px);font-weight:800;overflow-wrap:anywhere}
.intro p{max-width:46ch;margin:0;font-size:18px;line-height:1.55;opacity:.9}
.row{display:flex;flex-wrap:wrap;gap:10px}
.tall{grid-row:span 2}
.wide{grid-column:span 2}
.cap{position:absolute;left:14px;bottom:14px;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.92);font-size:13px;font-weight:600}
.stat,.hours{display:flex;flex-direction:column;justify-content:space-between;gap:12px;padding:24px}
.stat b{font-family:"Sora",sans-serif;font-size:44px;line-height:1;letter-spacing:-.04em;color:var(--b-text)}
.stat span{font-size:14px;color:#666}
.hours{background:#141414;color:#fff}
.on{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#9be39b}
.on::before{content:"";width:8px;height:8px;border-radius:50%;background:#3ddc84}
.hours b{font-family:"Sora",sans-serif;font-size:26px;letter-spacing:-.02em}
.hours span:last-child{font-size:14px;color:#aaa}
.sec{padding:72px 0 14px}
.sec-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:22px}
.sec-head h2{max-width:16ch;font-size:clamp(30px,3.6vw,46px);font-weight:700}
.sec-head p{max-width:36ch;margin:0;line-height:1.6;color:#666}
.offers{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.offer{display:flex;flex-direction:column}
.ph{position:relative;height:220px}
.ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.tx{padding:22px 24px 26px}
.num{font-family:"Sora",sans-serif;font-size:13px;font-weight:600;color:var(--b-text)}
.offer h3{margin:6px 0 8px;font-size:22px}
.offer p{margin:0;line-height:1.55;color:#666}
.cta-t{display:flex;flex-direction:column;justify-content:space-between;gap:20px;padding:28px;background:var(--b-soft)}
.cta-t h3{max-width:12ch;font-size:28px}
.strip{display:grid;grid-template-columns:2fr 1fr 1fr;gap:14px}
.strip .t{min-height:300px}
.contact{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:14px}
.map{min-height:240px;background-color:#e7e8e3;background-image:linear-gradient(90deg,transparent 48%,#fff 48%,#fff 52%,transparent 52%),linear-gradient(0deg,transparent 48%,#fff 48%,#fff 52%,transparent 52%);background-size:160px 160px}
.pin{position:absolute;left:50%;top:42%;width:26px;height:26px;border-radius:50% 50% 50% 0;background:var(--b);transform:translate(-50%,-50%) rotate(-45deg);box-shadow:0 0 0 8px color-mix(in srgb,var(--b) 22%,transparent)}
.addr{position:absolute;left:16px;right:16px;bottom:16px;padding:14px 16px;border-radius:16px;background:#fff;font-size:14px;line-height:1.45}
.info{display:flex;flex-direction:column;justify-content:space-between;gap:16px;padding:26px}
.info small{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#888}
.info b{font-family:"Sora",sans-serif;font-size:20px;letter-spacing:-.02em;overflow-wrap:anywhere}
.wa{background:var(--b);color:var(--on-b)}
.wa small{color:inherit;opacity:.75}
footer{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;padding:40px 0;font-size:13px;color:#777}
@media (max-width:760px){
  .w{padding:0 16px}
  .top nav{display:none}
  .top .btn{margin-left:auto;padding:11px 16px;font-size:14px}
  .bento{grid-template-columns:1fr 1fr;gap:10px}
  .intro{grid-column:span 2;grid-row:auto;min-height:380px;padding:28px}
  .tall{grid-column:span 2;grid-row:auto;min-height:260px}
  .wide{grid-column:span 2}
  .stat,.hours{padding:18px}
  .stat b{font-size:34px}
  .hours b{font-size:20px}
  .sec{padding:48px 0 10px}
  .sec-head{flex-direction:column;align-items:flex-start;gap:10px}
  .offers,.strip,.contact{grid-template-columns:1fr}
  .strip .t{min-height:220px}
}`,
    html: `
<header class="top"><div class="w">
  <a class="logo" href="#topo"><i data-initial></i><span data-name></span></a>
  <nav><a href="#topo">Início</a><a href="#oferecemos">O que oferecemos</a><a href="#fotos">Fotos</a><a href="#contato">Contato</a></nav>
  <a class="btn" href="#contato">Agendar</a>
</div></header>
<main class="w" id="topo">
  <section class="bento">
    <div class="t intro">
      <span class="chip">Aberto para novos clientes</span>
      <h1 data-name></h1>
      <p>Um espaço completo, moderno e pensado para você. Venha conhecer de perto e sinta a diferença desde a primeira visita.</p>
      <div class="row"><a class="btn inv" href="#contato">Agendar uma visita</a><a class="btn ghost" href="#oferecemos">Ver o que oferecemos</a></div>
    </div>
    <div class="t tall"><img data-photo="0" alt=""></div>
    <div class="t wide"><img data-photo="1" alt=""><span class="cap">Estrutura completa</span></div>
    <div class="t stat"><b>4,9</b><span>nota média no Google, com mais de 300 avaliações</span></div>
    <div class="t hours"><span class="on">Aberto hoje</span><b>6h às 22h</b><span>Sábados, 8h às 14h</span></div>
  </section>
  <section class="sec" id="oferecemos">
    <div class="sec-head"><h2>Tudo o que você precisa em um só lugar</h2><p>Planos flexíveis, atendimento de verdade e uma equipe que acompanha você de perto.</p></div>
    <div class="offers">
      <article class="t offer"><div class="ph"><img data-photo="2" alt=""></div><div class="tx"><span class="num">01</span><h3>Atendimento personalizado</h3><p>Um plano pensado para o seu objetivo.</p></div></article>
      <article class="t offer"><div class="ph"><img data-photo="3" alt=""></div><div class="tx"><span class="num">02</span><h3>Equipe experiente</h3><p>Profissionais que acompanham cada passo.</p></div></article>
      <article class="t offer"><div class="ph"><img data-photo="4" alt=""></div><div class="tx"><span class="num">03</span><h3>Horários flexíveis</h3><p>Aberto cedo, fechando tarde, todos os dias.</p></div></article>
      <div class="t cta-t"><h3>Primeira visita por nossa conta</h3><a class="btn b" href="#contato">Quero agendar</a></div>
    </div>
  </section>
  <section class="sec" id="fotos">
    <div class="sec-head"><h2>Um pouco do nosso espaço</h2><p>Ambiente limpo, iluminado e confortável, do jeito que você merece.</p></div>
    <div class="strip"><div class="t"><img data-photo="5" alt=""></div><div class="t"><img data-photo="0" alt=""></div><div class="t"><img data-photo="1" alt=""></div></div>
  </section>
  <section class="sec" id="contato">
    <div class="sec-head"><h2>Vamos conversar?</h2></div>
    <div class="contact">
      <div class="t map"><span class="pin"></span><div class="addr"><b>Rua das Flores, 120</b><br>Centro</div></div>
      <a class="t info wa" href="#contato"><small>WhatsApp</small><b>(00) 00000-0000</b><span>Chamar agora →</span></a>
      <a class="t info" href="#contato"><small>Instagram</small><b data-handle></b><span>Seguir →</span></a>
    </div>
  </section>
  <footer><span>© 2026 <span data-name></span></span><span data-credito></span></footer>
</main>`
  };

  /* =========================================================
     MODELO 05 · CARTÃO
     Página única e centralizada, no estilo "link na bio".
     ========================================================= */
  const CARTAO = {
    id: 'cartao',
    nome: 'Cartão',
    codigo: 'Modelo 05',
    fontes: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Nunito+Sans:wght@400;600;700&display=swap',
    css: `
body{min-height:100vh;font-family:"Nunito Sans",system-ui,sans-serif;color:#17181a;font-size:16px;background:color-mix(in srgb,var(--b) 14%,#f6f5f2)}
.bg{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none}
.bg i{position:absolute;border-radius:50%;background:var(--b);filter:blur(70px);opacity:.5}
.bg i:nth-child(1){left:-120px;top:-100px;width:420px;height:420px}
.bg i:nth-child(2){right:-100px;top:40%;width:360px;height:360px;opacity:.32}
.bg i:nth-child(3){left:20%;bottom:-140px;width:300px;height:300px;opacity:.26}
.page{max-width:540px;margin:0 auto;padding:40px 18px 32px}
.card{overflow:hidden;border-radius:30px;background:#fff;box-shadow:0 24px 60px -24px rgba(0,0,0,.25)}
.cover{height:190px}
.cover img{width:100%;height:100%;object-fit:cover}
.head{padding:0 26px 24px;text-align:center}
.avatar{width:112px;height:112px;margin:-56px auto 14px;overflow:hidden;border:5px solid #fff;border-radius:50%;background:var(--b-soft);box-shadow:0 8px 24px rgba(0,0,0,.12)}
.avatar img{width:100%;height:100%;object-fit:cover}
h1{font-family:"Bricolage Grotesque",sans-serif;font-weight:800;font-size:34px;line-height:1.05;letter-spacing:-.03em;overflow-wrap:anywhere}
.bio{max-width:36ch;margin:10px auto 0;line-height:1.55;color:#5a5d63}
.chips{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:16px}
.chips span{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:#f2f3f5;color:#3d4046;font-size:13px;font-weight:700}
.chips .on{background:#e6f8ec;color:#177a3d}
.chips .on::before{content:"";width:7px;height:7px;border-radius:50%;background:#22b35a}
.links{display:grid;gap:10px;padding:0 20px 24px}
.link{display:flex;align-items:center;gap:14px;padding:16px 18px;border-radius:18px;background:#f4f4f6;font-weight:700;text-decoration:none;transition:transform .15s}
.link:hover{transform:translateY(-2px)}
.link svg{flex:none;width:22px;height:22px}
.link span{flex:1}
.link em{font-style:normal;opacity:.5}
.link.main{background:var(--b);color:var(--on-b)}
.sec{padding:24px 20px 4px;border-top:1px solid #eeeff1}
.sec h2{margin-bottom:14px;font-family:"Bricolage Grotesque",sans-serif;font-weight:800;font-size:20px;letter-spacing:-.02em}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:20px}
.grid img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px}
.hours{margin:0 0 20px;padding:0;list-style:none}
.hours li{display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px dashed #e3e4e8;font-size:15px}
.quote{margin:0 0 22px;padding:18px 20px;border-radius:18px;background:var(--b-soft);line-height:1.55}
.quote p{margin:0 0 8px}
.quote small{font-weight:700;color:#5a5d63}
footer{padding:22px;text-align:center;font-size:12.5px;color:#6b6e75}
@media (max-width:480px){
  .page{padding:0 0 24px}
  .card{border-radius:0 0 28px 28px;box-shadow:none}
}`,
    html: `
<div class="bg" aria-hidden="true"><i></i><i></i><i></i></div>
<div class="page" id="topo">
  <div class="card">
    <div class="cover"><img data-photo="0" alt=""></div>
    <div class="head">
      <div class="avatar"><img data-photo="1" alt=""></div>
      <h1 data-name></h1>
      <p class="bio">Atendimento com carinho e qualidade em cada detalhe. Chame no WhatsApp para fazer seu pedido ou agendar um horário.</p>
      <div class="chips"><span class="on">Aberto agora</span><span>Atende na região</span><span data-handle></span></div>
    </div>
    <div class="links">
      <a class="link main" href="#contato"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M12 2.8a9.2 9.2 0 0 0-7.9 13.9L2.8 21.2l4.6-1.2A9.2 9.2 0 1 0 12 2.8z"/></svg><span>Pedir ou agendar pelo WhatsApp</span><em>→</em></a>
      <a class="link" href="#destaques"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg><span>Ver destaques</span><em>→</em></a>
      <a class="link" href="#contato"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg><span>Instagram</span><em>→</em></a>
      <a class="link" href="#horarios"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg><span>Como chegar</span><em>→</em></a>
    </div>
    <section class="sec" id="destaques">
      <h2>Destaques</h2>
      <div class="grid"><img data-photo="2" alt=""><img data-photo="3" alt=""><img data-photo="4" alt=""><img data-photo="5" alt=""><img data-photo="0" alt=""><img data-photo="1" alt=""></div>
    </section>
    <section class="sec" id="horarios">
      <h2>Horários</h2>
      <ul class="hours"><li><span>Segunda a sexta</span><b>9h às 19h</b></li><li><span>Sábado</span><b>9h às 14h</b></li><li><span>Domingo</span><b>Fechado</b></li></ul>
      <div class="quote" id="contato"><p>“Atendimento impecável e resultado sempre caprichado. Recomendo de olhos fechados!”</p><small>Juliana R. · cliente</small></div>
    </section>
    <footer>© 2026 <span data-name></span> · <span data-credito></span></footer>
  </div>
</div>`
  };

  /* =========================================================
     MODELO 06 · MENU
     Cabeçalho clássico centralizado e lista de itens com preço.
     ========================================================= */
  const MENU = {
    id: 'menu',
    nome: 'Menu',
    codigo: 'Modelo 06',
    fontes: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Jost:wght@400;500;600&display=swap',
    css: `
body{font-family:"Jost",system-ui,sans-serif;color:#1f1b17;background:#fbf8f3;font-size:16px}
h1,h2,h3{font-family:"Cormorant Garamond",Georgia,serif;font-weight:600;line-height:1.05}
.w{max-width:1120px;margin:0 auto;padding:0 28px}
.bar{background:var(--b);color:var(--on-b);font-size:13px;letter-spacing:.06em}
.bar .w{display:flex;justify-content:space-between;gap:16px;padding-top:9px;padding-bottom:9px}
.head{padding:34px 0 18px;text-align:center;border-bottom:1px solid #e9e2d6}
.since{margin:0;font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:#8a7f70}
.head h1{margin:8px 0 18px;padding:0 20px;font-size:clamp(44px,6vw,76px);letter-spacing:-.01em;overflow-wrap:anywhere}
.head nav{display:flex;flex-wrap:wrap;justify-content:center;gap:8px 32px;font-size:14px;letter-spacing:.14em;text-transform:uppercase}
.head nav a{color:#5c5349;text-decoration:none}
.hero{padding:56px 0 24px;text-align:center}
.tag{max-width:40ch;margin:0 auto 34px;font-family:"Cormorant Garamond",serif;font-style:italic;font-size:clamp(22px,2.6vw,30px);line-height:1.35;color:#4a4239}
.trio{display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:18px;align-items:end}
.trio img{width:100%;object-fit:cover}
.trio img:nth-child(1),.trio img:nth-child(3){aspect-ratio:3/4;border-radius:6px}
.trio img:nth-child(2){aspect-ratio:4/5;border-radius:999px 999px 6px 6px}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:15px 30px;border-radius:2px;background:var(--b);color:var(--on-b);font-size:13px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;text-decoration:none}
.btn.out{background:transparent;color:#1f1b17;box-shadow:inset 0 0 0 1.5px #1f1b17}
.row{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:34px}
.menu{padding:88px 0}
.menu-head{margin-bottom:48px;text-align:center}
.menu-head small{font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:var(--b-text)}
.menu-head h2{margin-top:10px;font-size:clamp(38px,4.6vw,58px)}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:24px 72px}
.cat{margin:0 0 12px;font-size:30px;font-style:italic;color:var(--b-text)}
.item{padding:14px 0}
.item-top{display:flex;align-items:baseline;gap:10px}
.item-top h3{font-size:22px}
.item-top i{flex:1;min-width:24px;border-bottom:1.5px dotted #c9bfae;transform:translateY(-5px)}
.item-top b{font-size:16px;font-weight:600;white-space:nowrap}
.item p{margin:4px 0 0;font-size:15px;color:#7a7065}
.band{position:relative;overflow:hidden;padding:96px 0;text-align:center;color:#fff;background:var(--b-deep)}
.band img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.35}
.band .w{position:relative}
.band h2{max-width:18ch;margin:0 auto 26px;font-size:clamp(36px,4.6vw,60px)}
.band .btn{background:#fff;color:#1f1b17}
.info{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;padding-block:80px;text-align:center}
.info small{display:block;margin-bottom:10px;font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:#8a7f70}
.info p{margin:0;font-family:"Cormorant Garamond",serif;font-size:24px;line-height:1.35}
.gal{display:grid;grid-template-columns:repeat(4,1fr)}
.gal img{width:100%;aspect-ratio:1;object-fit:cover}
footer{padding:28px 0;font-size:13px;text-align:center;color:#8a7f70;border-top:1px solid #e9e2d6}
@media (max-width:760px){
  .w{padding:0 20px}
  .bar .w{justify-content:center}
  .bar .w span:last-child{display:none}
  .head nav{gap:8px 18px;font-size:12px}
  .trio{grid-template-columns:1fr 1fr;gap:10px}
  .trio img:nth-child(2){grid-column:span 2;grid-row:1;aspect-ratio:1/1}
  .cols{grid-template-columns:1fr;gap:8px}
  .menu{padding:64px 0}
  .info{grid-template-columns:1fr;gap:28px;padding-block:56px}
  .gal{grid-template-columns:1fr 1fr}
  .band{padding:72px 0}
}`,
    html: `
<div class="bar"><div class="w"><span>Ter. a dom. · 11h às 23h</span><span>Reservas: (00) 00000-0000</span></div></div>
<header class="head" id="topo">
  <p class="since">Desde 2015</p>
  <h1 data-name></h1>
  <nav><a href="#cardapio">Cardápio</a><a href="#sobre">A casa</a><a href="#visite">Visite</a><a href="#visite">Reservas</a></nav>
</header>
<section class="hero" id="sobre"><div class="w">
  <p class="tag">Receitas de família, ingredientes frescos e aquele cheirinho de comida feita com calma.</p>
  <div class="trio"><img data-photo="1" alt=""><img data-photo="0" alt=""><img data-photo="2" alt=""></div>
  <div class="row"><a class="btn" href="#visite">Reservar mesa</a><a class="btn out" href="#cardapio">Ver cardápio</a></div>
</div></section>
<section class="menu" id="cardapio"><div class="w">
  <div class="menu-head"><small>Cardápio</small><h2>Feito para dividir (ou não)</h2></div>
  <div class="cols">
    <div>
      <h3 class="cat">Entradas</h3>
      <div class="item"><div class="item-top"><h3>Bruschetta da casa</h3><i></i><b>R$ 32</b></div><p>Pão de fermentação natural, tomate, manjericão e azeite.</p></div>
      <div class="item"><div class="item-top"><h3>Bolinho de bacalhau</h3><i></i><b>R$ 38</b></div><p>Seis unidades, com maionese de ervas.</p></div>
      <div class="item"><div class="item-top"><h3>Salada da estação</h3><i></i><b>R$ 29</b></div><p>Folhas, frutas da época e castanhas.</p></div>
    </div>
    <div>
      <h3 class="cat">Pratos principais</h3>
      <div class="item"><div class="item-top"><h3>Risoto de cogumelos</h3><i></i><b>R$ 64</b></div><p>Arroz arbóreo, mix de cogumelos e parmesão.</p></div>
      <div class="item"><div class="item-top"><h3>Filé ao molho de vinho</h3><i></i><b>R$ 78</b></div><p>Acompanha purê rústico e legumes grelhados.</p></div>
      <div class="item"><div class="item-top"><h3>Massa fresca ao sugo</h3><i></i><b>R$ 52</b></div><p>Talharim artesanal com molho de tomates assados.</p></div>
    </div>
  </div>
</div></section>
<section class="band"><img data-photo="3" alt=""><div class="w"><h2>Uma mesa esperando por você</h2><a class="btn" href="#visite">Fazer reserva</a></div></section>
<section class="w info" id="visite">
  <div><small>Endereço</small><p>Rua das Flores, 120<br>Centro</p></div>
  <div><small>Horário</small><p>Terça a domingo<br>11h às 23h</p></div>
  <div><small>Contato</small><p>(00) 00000-0000<br><span data-handle></span></p></div>
</section>
<div class="gal"><img data-photo="4" alt=""><img data-photo="5" alt=""><img data-photo="0" alt=""><img data-photo="1" alt=""></div>
<footer><div class="w">© 2026 <span data-name></span> · <span data-credito></span></div></footer>`
  };

  const lista = [VITRINE, PERFIL, GALERIA, BENTO, CARTAO, MENU];
  const porId = {};
  lista.forEach((m) => { porId[m.id] = m; });
  const get = (id) => porId[id] || lista[0];

  /* Monta o documento HTML completo de um modelo */
  function doc(id, cfg) {
    const m = get(id);
    const marca = (window.NOBI_CONFIG && window.NOBI_CONFIG.marca) || 'Nobi';
    const inicial = JSON.stringify({ nome: cfg.nome, cor: cfg.cor, marca: marca }).replace(/</g, '\\u003c');
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + m.nome + '</title>' +
      '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
      '<link rel="stylesheet" href="' + m.fontes.replace(/&/g, '&amp;') + '">' +
      '<style>' + BASE + m.css + '</style></head><body>' + m.html +
      '<script>(' + runtime.toString() + ')(' + inicial + ');<\/script></body></html>';
  }

  window.NOBI_MODELOS = { lista, get, doc, cor: { mix, sobre, legivel, slug } };
})();
