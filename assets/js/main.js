/* ==========================================================
   Nobi · interações do site
   ========================================================== */
(() => {
  'use strict';

  const C = window.NOBI_CONFIG;
  const M = window.NOBI_MODELOS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const MAX_FOTOS = 6;
  const estado = {
    modelo: M.lista[0].id,
    nome: C.exemplo.nome,
    cor: C.exemplo.cor,
    fotos: [], // { src, nome }
    dispositivo: window.matchMedia('(max-width: 700px)').matches ? 'mobile' : 'desktop'
  };

  /* =========================================================
     WhatsApp
     ========================================================= */
  const abertura = 'Olá! Vim pelo site da ' + C.marca;
  const MENSAGENS = {
    geral: abertura + ' e gostaria de saber mais sobre os serviços.',
    automacao: abertura + ' e quero conversar sobre *automação* para o meu negócio.',
    software: abertura + ' e quero conversar sobre um *software sob medida*.',
    web3: abertura + ' e quero um *portfólio Web3/IA*.',
    personalizado: abertura + ' e quero um *Site Personalizado*. Minha ideia é: '
  };
  const linkWhats = (texto) => 'https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent(texto);

  /* Preços (definidos no config.js) */
  const reais = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const precoDe = (id) => (C.precos && C.precos[id] ? reais(C.precos[id]) : 'Sob consulta');
  const precoMinimo = () => {
    const valores = Object.values(C.precos || {}).filter((v) => typeof v === 'number');
    return valores.length ? 'A partir de ' + reais(Math.min.apply(null, valores)) : 'Fixo';
  };

  function nomeDaCor(hex) {
    const c = C.cores.find((x) => x.hex.toLowerCase() === hex.toLowerCase());
    return c ? c.nome + ' (' + c.hex.toUpperCase() + ')' : hex.toUpperCase();
  }

  function mensagemSiteComum() {
    const m = M.get(estado.modelo);
    const n = estado.fotos.length;
    const fotos = n
      ? n + (n === 1 ? ' foto escolhida' : ' fotos escolhidas') + ', envio aqui na conversa'
      : 'vou enviar aqui na conversa';
    return [
      abertura + ' e quero um *Site Comum*.',
      '',
      '• Modelo: ' + m.nome + ' (' + m.codigo + ')',
      '• Nome do negócio: ' + (estado.nome.trim() || 'ainda vou definir'),
      '• Cor principal: ' + nomeDaCor(estado.cor),
      '• Valor: ' + precoDe(estado.modelo),
      '• Fotos: ' + fotos,
      '',
      'Pode me passar os próximos passos?'
    ].join('\n');
  }

  function ligarWhatsApp() {
    $$('[data-wa]').forEach((a) => {
      a.href = linkWhats(MENSAGENS[a.dataset.wa] || MENSAGENS.geral);
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }

  function atualizarPedido() {
    const url = linkWhats(mensagemSiteComum());
    $$('[data-wa-comum]').forEach((a) => {
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }

  /* =========================================================
     Navegação: início <-> catálogo (mesma página, sem recarregar)
     ========================================================= */
  const views = $$('[data-view]');

  function semAnimacao(fn) {
    const h = document.documentElement;
    const antes = h.style.scrollBehavior;
    h.style.scrollBehavior = 'auto';
    fn();
    h.style.scrollBehavior = antes;
  }

  function rota(inicial) {
    let id = location.hash.slice(1);
    try { id = decodeURIComponent(id); } catch (e) { /* mantém o id cru */ }
    const alvo = id ? document.getElementById(id) : null;
    const atual = views.find((v) => !v.hidden) || views[0];
    let view = alvo ? (alvo.matches('[data-view]') ? alvo : alvo.closest('[data-view]')) : null;
    if (!view) view = alvo ? atual : views[0];
    const trocou = view !== atual;

    views.forEach((v) => { v.hidden = v !== view; });
    document.body.dataset.pagina = view.id;
    $$('.nav a').forEach((a) => {
      if (a.getAttribute('href') === '#catalogo' && view.id === 'catalogo') a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (view.id === 'catalogo') prepararCatalogo();

    const rolar = trocou || inicial ? semAnimacao : (fn) => fn();
    if (alvo && alvo !== view) {
      requestAnimationFrame(() => rolar(() => alvo.scrollIntoView({ block: 'start' })));
    } else if (trocou || (alvo === view && !inicial)) {
      rolar(() => window.scrollTo(0, 0));
    }
  }

  function ligarMenu() {
    const header = $('.site-header');
    const botao = $('.menu-btn');
    if (!header || !botao) return;
    const fechar = () => { header.classList.remove('is-open'); botao.setAttribute('aria-expanded', 'false'); };
    botao.addEventListener('click', () => {
      const aberto = header.classList.toggle('is-open');
      botao.setAttribute('aria-expanded', String(aberto));
    });
    $$('.nav a').forEach((a) => a.addEventListener('click', fechar));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });
  }

  /* =========================================================
     Nome e cor (compartilhados entre a prévia do topo e o catálogo)
     ========================================================= */
  const normalizarHex = (hex) => M.cor.mix(hex, hex, 0); // devolve sempre #rrggbb minúsculo

  function renderizarCores() {
    $$('[data-swatches]').forEach((box) => {
      box.innerHTML = C.cores.map((c) =>
        '<button type="button" class="swatch" data-cor="' + c.hex + '" style="--sw:' + c.hex + '" ' +
        'aria-label="' + c.nome + '" title="' + c.nome + '" aria-pressed="false"></button>'
      ).join('');
      box.addEventListener('click', (e) => {
        const b = e.target.closest('[data-cor]');
        if (b) definirCor(b.dataset.cor);
      });
    });
    const outra = $('#cfg-cor-custom');
    if (outra) outra.addEventListener('input', () => definirCor(outra.value));
  }

  function definirCor(hex) {
    estado.cor = hex;
    pintar();
    atualizarPrevias(false);
  }

  let timerNome;
  function ligarNome() {
    $$('[data-bind="nome"]').forEach((campo) => {
      campo.value = estado.nome;
      campo.addEventListener('input', () => {
        estado.nome = campo.value;
        $$('[data-bind="nome"]').forEach((outro) => { if (outro !== campo) outro.value = campo.value; });
        pintar();
        clearTimeout(timerNome);
        timerNome = setTimeout(() => atualizarPrevias(false), 90);
      });
    });
  }

  function pintar() {
    const cor = estado.cor;
    const nome = estado.nome.trim() || 'Seu Negócio';

    $$('.swatch').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cor.toLowerCase() === cor.toLowerCase())));
    const pronta = C.cores.some((c) => c.hex.toLowerCase() === cor.toLowerCase());
    const outra = $('#cfg-cor-custom');
    if (outra) {
      outra.value = normalizarHex(cor);
      outra.closest('.custom-color').classList.toggle('is-active', !pronta);
    }

    const demo = $('#demo');
    if (demo) {
      demo.style.setProperty('--demo', cor);
      demo.style.setProperty('--demo-text', M.cor.legivel(cor, '#ffffff'));
    }
    $$('[data-demo-name]').forEach((el) => { el.textContent = nome; });
    const url = $('#demo-url');
    if (url) url.textContent = (M.cor.slug(estado.nome) || 'seunegocio') + '.com.br';

    atualizarResumo();
    atualizarPedido();
  }

  function atualizarResumo() {
    const m = M.get(estado.modelo);
    const texto = (sel, valor) => { const el = $(sel); if (el) el.textContent = valor; };
    texto('#sum-modelo', m.nome + ' · ' + m.codigo);
    texto('#sum-valor', precoDe(estado.modelo));
    texto('#sum-nome', estado.nome.trim() || 'Ainda não definido');
    texto('#sum-fotos', estado.fotos.length ? estado.fotos.length + ' de ' + MAX_FOTOS : 'Nenhuma ainda (prévia com exemplos)');
    texto('#preview-title', 'Prévia · ' + m.nome);
    texto('#viewer-title', m.nome + ' · ' + m.codigo);
    const sc = $('#sum-cor');
    if (sc) {
      sc.textContent = '';
      const bolinha = document.createElement('span');
      bolinha.className = 'dot';
      bolinha.style.background = estado.cor;
      sc.append(bolinha, document.createTextNode(nomeDaCor(estado.cor)));
    }
  }

  /* =========================================================
     Prévias dos modelos (miniaturas, prévia grande e tela cheia)
     ========================================================= */
  const frames = new Set();
  let catalogoPronto = false;
  let framePrevia = null;
  let frameTelaCheia = null;

  function criarFrame(modelo) {
    const f = document.createElement('iframe');
    f.dataset.modelo = modelo;
    f.title = 'Prévia do modelo ' + M.get(modelo).nome;
    f.addEventListener('load', () => postar(f, true));
    f.srcdoc = M.doc(modelo, estado);
    frames.add(f);
    return f;
  }

  function trocarModelo(f, modelo) {
    if (!f || f.dataset.modelo === modelo) return;
    f.dataset.modelo = modelo;
    f.title = 'Prévia do modelo ' + M.get(modelo).nome;
    f.srcdoc = M.doc(modelo, estado);
  }

  function postar(f, comFotos) {
    const w = f.contentWindow;
    if (!w) return;
    const cfg = { nome: estado.nome, cor: estado.cor };
    if (comFotos) cfg.fotos = estado.fotos.map((x) => x.src);
    try { w.postMessage({ tipo: 'nobi:config', cfg }, '*'); } catch (e) { /* prévia indisponível */ }
  }

  function atualizarPrevias(comFotos) { frames.forEach((f) => postar(f, comFotos)); }

  function prepararCatalogo() {
    if (catalogoPronto) return;
    catalogoPronto = true;

    $$('[data-thumb]').forEach((box) => {
      const f = criarFrame(box.dataset.thumb);
      f.tabIndex = -1;
      f.setAttribute('aria-hidden', 'true');
      f.style.width = '1280px';
      f.style.height = '860px';
      box.appendChild(f);
      const ajustar = () => { f.style.transform = 'scale(' + box.clientWidth / 1280 + ')'; };
      new ResizeObserver(ajustar).observe(box);
      ajustar();
    });

    framePrevia = criarFrame(estado.modelo);
    montarNoPalco($('#preview-stage'), framePrevia);
  }

  function montarNoPalco(palco, f) {
    const tela = document.createElement('div');
    tela.className = 'screen';
    tela.appendChild(f);
    palco.appendChild(tela);
    new ResizeObserver(() => ajustarPalco(palco)).observe(palco);
    ajustarPalco(palco);
  }

  /* Encaixa a página do modelo (1280px no computador, 390px no celular) no espaço disponível */
  function ajustarPalco(palco) {
    if (!palco) return;
    palco.dataset.device = estado.dispositivo;
    const tela = palco.querySelector('.screen');
    const f = tela && tela.querySelector('iframe');
    if (!f) return;
    const cw = palco.clientWidth;
    const ch = palco.clientHeight;
    if (!cw || !ch) return;
    let W, H, s;
    if (estado.dispositivo === 'mobile') {
      W = 390; H = 844;
      s = Math.min(1, (ch - 48) / H, (cw - 48) / W);
      tela.style.width = W * s + 'px';
      tela.style.height = H * s + 'px';
    } else {
      W = Math.max(1280, cw); s = cw / W; H = ch / s;
      tela.style.width = cw + 'px';
      tela.style.height = ch + 'px';
    }
    f.style.width = W + 'px';
    f.style.height = H + 'px';
    f.style.transform = 'scale(' + s + ')';
  }

  function definirDispositivo(d) {
    estado.dispositivo = d;
    $$('[data-device]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.device === d)));
    ajustarPalco($('#preview-stage'));
    ajustarPalco($('#viewer-stage'));
  }

  function definirModelo(id) {
    estado.modelo = id;
    const radio = $('#modelo-' + id);
    if (radio) radio.checked = true;
    trocarModelo(framePrevia, id);
    const viewer = $('#viewer');
    if (viewer && !viewer.hidden) trocarModelo(frameTelaCheia, id);
    atualizarResumo();
    atualizarPedido();
  }

  function ligarModelos() {
    $$('input[name="modelo"]').forEach((r) => r.addEventListener('change', () => { if (r.checked) definirModelo(r.value); }));
    $$('[data-device]').forEach((b) => b.addEventListener('click', () => definirDispositivo(b.dataset.device)));
  }

  /* ---------- Tela cheia ---------- */
  let focoAnterior = null;
  function abrirTelaCheia() {
    const viewer = $('#viewer');
    const palco = $('#viewer-stage');
    focoAnterior = document.activeElement;
    viewer.hidden = false;
    document.documentElement.classList.add('no-scroll');
    if (!frameTelaCheia) {
      frameTelaCheia = criarFrame(estado.modelo);
      montarNoPalco(palco, frameTelaCheia);
    } else {
      trocarModelo(frameTelaCheia, estado.modelo);
      ajustarPalco(palco);
    }
    $('#viewer-close').focus();
  }
  function fecharTelaCheia() {
    const viewer = $('#viewer');
    if (viewer.hidden) return;
    viewer.hidden = true;
    document.documentElement.classList.remove('no-scroll');
    if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
  }
  function ligarTelaCheia() {
    const abrir = $('#btn-tela-cheia');
    if (abrir) abrir.addEventListener('click', abrirTelaCheia);
    const fechar = $('#viewer-close');
    if (fechar) fechar.addEventListener('click', fecharTelaCheia);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharTelaCheia(); });
  }

  /* =========================================================
     Fotos do cliente (ficam só no navegador, para a prévia)
     ========================================================= */
  function lerFoto(arquivo) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(arquivo);
      const img = new Image();
      img.onload = () => {
        const max = 1400;
        const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * k);
        canvas.height = Math.round(img.naturalHeight * k);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('imagem inválida')); };
      img.src = url;
    });
  }

  let timerAviso;
  function avisar(msg) {
    const el = $('#fotos-aviso');
    if (!el) return;
    el.textContent = msg;
    clearTimeout(timerAviso);
    timerAviso = setTimeout(() => { el.textContent = ''; }, 6000);
  }

  async function adicionarFotos(lista) {
    const imagens = Array.from(lista || []).filter((f) => f.type.startsWith('image/'));
    const espaco = MAX_FOTOS - estado.fotos.length;
    if (!imagens.length) { avisar('Escolha arquivos de imagem (JPG, PNG ou WebP).'); return; }
    if (espaco <= 0) { avisar('Você já tem ' + MAX_FOTOS + ' fotos. Remova uma para adicionar outra.'); return; }
    const falhas = [];
    for (const arq of imagens.slice(0, espaco)) {
      try { estado.fotos.push({ src: await lerFoto(arq), nome: arq.name }); }
      catch (e) { falhas.push(arq.name); }
    }
    if (falhas.length) avisar('Não deu para abrir: ' + falhas.join(', ') + '. Tente em JPG ou PNG.');
    else if (imagens.length > espaco) avisar('Adicionamos ' + espaco + ' foto(s). O limite é ' + MAX_FOTOS + '.');
    renderizarFotos();
    atualizarPrevias(true);
    atualizarResumo();
    atualizarPedido();
  }

  function renderizarFotos() {
    const ul = $('#photo-list');
    if (!ul) return;
    ul.textContent = '';
    estado.fotos.forEach((foto, i) => {
      const li = document.createElement('li');
      li.className = 'photo';
      const img = document.createElement('img');
      img.src = foto.src;
      img.alt = foto.nome;
      li.appendChild(img);
      if (i === 0) {
        const tag = document.createElement('span');
        tag.className = 'photo-tag';
        tag.textContent = 'Capa';
        li.appendChild(tag);
      }
      const acoes = document.createElement('div');
      acoes.className = 'photo-actions';
      const botao = (acao, rotulo, simbolo) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.acao = acao;
        b.dataset.i = String(i);
        b.setAttribute('aria-label', rotulo + ': ' + foto.nome);
        b.title = rotulo;
        b.textContent = simbolo;
        return b;
      };
      if (i !== 0) acoes.appendChild(botao('capa', 'Usar como capa', '★'));
      acoes.appendChild(botao('remover', 'Remover foto', '×'));
      li.appendChild(acoes);
      ul.appendChild(li);
    });
    ul.hidden = !estado.fotos.length;
    const cont = $('#drop-count');
    if (cont) cont.textContent = estado.fotos.length + ' de ' + MAX_FOTOS;
    const drop = $('#drop');
    if (drop) drop.classList.toggle('is-full', estado.fotos.length >= MAX_FOTOS);
  }

  function ligarFotos() {
    const input = $('#cfg-fotos');
    const drop = $('#drop');
    const ul = $('#photo-list');
    if (!input || !drop || !ul) return;

    input.addEventListener('change', () => { adicionarFotos(input.files); input.value = ''; });

    ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
    drop.addEventListener('drop', (e) => { if (e.dataTransfer) adicionarFotos(e.dataTransfer.files); });
    // Evita que soltar uma imagem fora da área abra o arquivo no navegador
    ['dragover', 'drop'].forEach((t) => window.addEventListener(t, (e) => e.preventDefault()));

    ul.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-acao]');
      if (!b) return;
      const i = Number(b.dataset.i);
      if (b.dataset.acao === 'remover') estado.fotos.splice(i, 1);
      if (b.dataset.acao === 'capa') estado.fotos.unshift(estado.fotos.splice(i, 1)[0]);
      renderizarFotos();
      atualizarPrevias(true);
      atualizarResumo();
      atualizarPedido();
    });
  }

  /* =========================================================
     Copiar número
     ========================================================= */
  function ligarCopiar() {
    $$('[data-copy]').forEach((botao) => {
      const original = botao.textContent;
      let timer;
      const mostrar = (msg) => {
        botao.textContent = msg;
        clearTimeout(timer);
        timer = setTimeout(() => { botao.textContent = original; }, 2200);
      };
      botao.addEventListener('click', () => {
        const alvo = document.getElementById(botao.dataset.copy);
        if (!alvo) return;
        const selecionar = () => {
          const r = document.createRange();
          r.selectNodeContents(alvo);
          const s = window.getSelection();
          s.removeAllRanges();
          s.addRange(r);
          mostrar('Número selecionado');
        };
        const texto = alvo.textContent.trim();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(texto).then(() => mostrar('Copiado!'), selecionar);
        } else {
          selecionar();
        }
      });
    });
  }

  /* =========================================================
     Início
     ========================================================= */
  function iniciar() {
    $$('[data-whatsapp-exibicao]').forEach((el) => { el.textContent = C.whatsappExibicao; });
    $$('[data-preco-min]').forEach((el) => { el.textContent = precoMinimo(); });
    $$('[data-preco-modelo]').forEach((el) => { el.textContent = precoDe(el.dataset.precoModelo); });
    $$('[data-ano]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

    renderizarCores();
    ligarNome();
    ligarWhatsApp();
    ligarMenu();
    ligarModelos();
    ligarTelaCheia();
    ligarFotos();
    ligarCopiar();
    const form = $("#studio-form");
    if (form) form.addEventListener("submit", (e) => e.preventDefault());

    definirDispositivo(estado.dispositivo);
    definirModelo(estado.modelo);
    renderizarFotos();
    pintar();

    rota(true);
    window.addEventListener('hashchange', () => rota(false));
  }

  iniciar();
})();
