/* ==========================================================
   CONFIGURAÇÃO RÁPIDA DO SITE
   Edite aqui o WhatsApp, o nome usado nas mensagens,
   o preço de cada modelo do Site Comum e as cores do catálogo.
   ========================================================== */
window.NOBI_CONFIG = {
  // Nome usado nas mensagens automáticas do WhatsApp e no crédito dos modelos.
  // (O nome que aparece no topo e no rodapé fica no index.html.)
  marca: 'Nobi',

  // Só números: 55 (Brasil) + DDD + número.
  whatsapp: '5554996416612',
  whatsappExibicao: '+55 (54) 99641-6612',

  // Preço de cada modelo do Site Comum, em reais (só o número).
  // É o valor da criação do site. Domínio (~R$ 40/ano) e hospedagem são cobrados à parte.
  // Base da pesquisa (set/2026): página única para negócio local fica entre R$ 600 e R$ 1.500
  // com profissional, e agências de baixo custo cobram R$ 650 a R$ 700 só pela criação.
  precos: {
    cartao: 350,   // Modelo 05 · página curta estilo link na bio
    perfil: 550,   // Modelo 02 · 6 seções
    galeria: 550,  // Modelo 03 · portfólio com formulário
    vitrine: 600,  // Modelo 01 · 7 seções com mapa
    bento: 650,    // Modelo 04 · cerca de 15 blocos
    menu: 700      // Modelo 06 · 7 seções com cardápio e preços
  },

  // Exemplo que já aparece preenchido na prévia.
  exemplo: { nome: 'Studio Bella', cor: '#0E7C66' },

  // Cores prontas que o cliente pode escolher (ele também pode escolher qualquer outra).
  cores: [
    { nome: 'Verde-petróleo', hex: '#0E7C66' },
    { nome: 'Azul', hex: '#1F5FD1' },
    { nome: 'Terracota', hex: '#C4532D' },
    { nome: 'Rosa', hex: '#C8366B' },
    { nome: 'Roxo', hex: '#6D46C9' },
    { nome: 'Dourado', hex: '#B8871B' },
    { nome: 'Vinho', hex: '#7A1F33' },
    { nome: 'Grafite', hex: '#23272E' }
  ]
};
