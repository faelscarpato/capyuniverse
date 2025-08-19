// ===== Helpers =====
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const lines = (t = '') => t.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const toSafe = (s = '') => (s || '').replace(/[<>]/g, m => m === '<' ? '&lt;' : '&gt;');
const uid = () => Math.random().toString(36).slice(2, 9);

const state = {
  slides: [],
  sel: 0,
  extraText: '',      // texto vindo de arquivos (txt/pdf/docx)
};

function pollinationsURL(p) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=1600&height=900`;
}

// ===== Aside (miniaturas) — estado e helpers =====
function setAsideCollapsed(collapsed) {
  // classe mestre: when true, some o aside
  document.body.classList.toggle('with-aside-collapsed', collapsed);
  // em telas pequenas, permitimos "expandir" explicitamente
  if (!collapsed) {
    document.body.classList.add('with-aside-expanded');
  } else {
    document.body.classList.remove('with-aside-expanded');
  }

  // acessibilidade
  const b1 = document.getElementById('btnToggleAside');
  const b2 = document.getElementById('btnToggleAsidePreview');
  [b1, b2].forEach(b => b && b.setAttribute('aria-expanded', String(!collapsed)));

  // salva preferência
  try { localStorage.setItem('capyslide_aside_collapsed', String(collapsed)); } catch { }
  // re-enquadra se estivermos no preview
  if (getActivePanel() === 'preview') adjustStageScale();
}

function toggleAside() {
  const collapsed = document.body.classList.contains('with-aside-collapsed');
  setAsideCollapsed(!collapsed);
}

// ===== Tabs & Panel
function getActivePanel() {
  if (!$('#panelBrief').classList.contains('hide')) return 'brief';
  if (!$('#panelEdit').classList.contains('hide')) return 'edit';
  return 'preview';
}
function showPanel(name) {
  const want = 'panel' + name[0].toUpperCase() + name.slice(1);
  ['panelBrief', 'panelEdit', 'panelPreview'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.toggle('hide', id !== want);
  });
  if (name === 'preview') { adjustStageScale(); }
}

// ===== Thumbs & Stage
function renderThumbs() {
  const wrap = $('#thumbs'); wrap.innerHTML = '';
  state.slides.forEach((s, i) => {
    const el = document.createElement('button');
    el.className = 'thumb';
    el.innerHTML = `
      <div class="tbg" style="background-image:${s.bg ? `url('${s.bg}')` : 'none'}"></div>
      <div class="top">
        <div class="tag">Slide ${i + 1}</div>
        <div class="title">${toSafe((s.title || '').slice(0, 40))}</div>
      </div>`;
    el.onclick = () => selectSlide(i);
    wrap.appendChild(el);
  });
}

function renderStage() {
  const stage = $('#stage'); stage.innerHTML = '';
  const s = state.slides[state.sel] || {};
  const el = document.createElement('div'); el.className = 'slide-canvas';

  const bg = document.createElement('div'); bg.className = 'slide-bg';
  if (s.bg) bg.style.backgroundImage = `url('${s.bg}')`;

  const ov = document.createElement('div'); ov.className = 'slide-overlay';
  const ovAmt = clamp(Number(s.overlay ?? 0.5), 0, 0.8);
  ov.style.background = `linear-gradient(180deg, rgba(0,0,0,${ovAmt}), rgba(0,0,0,${ovAmt + .08}))`;

  const ct = document.createElement('div'); ct.className = 'slide-content';
  ct.innerHTML = `
    <div class="slide-title">${toSafe(s.title || '')}</div>
    <div class="slide-sub">${toSafe(s.sub || '')}</div>
    <div class="bullets">${(s.bullets || []).map(b => `<div>${toSafe(b)}</div>`).join('')}</div>
  `;

  const footer = document.createElement('div');
  footer.style.position = 'absolute'; footer.style.left = '24px'; footer.style.bottom = '22px';
  footer.style.opacity = '.8'; footer.style.fontSize = '14px';
  footer.textContent = s.footer || '© CapyUniverse';

  el.append(bg, ov, ct, footer);
  stage.appendChild(el);

  $('#playIndex').textContent = `${state.sel + 1} / ${state.slides.length}`;
  $('#notesBox').textContent = s.notes || '';
  adjustStageScale(); // garante enquadramento a cada render
}

function selectSlide(i) {
  state.sel = clamp(i, 0, state.slides.length - 1);
  const s = state.slides[state.sel] || {};
  $('#selIndex').textContent = 'Slide ' + (state.sel + 1);
  $('#edTitle').value = s.title || '';
  $('#edSub').value = s.sub || '';
  $('#edBullets').value = (s.bullets || []).join('\n');
  $('#edBG').value = s.bg || '';
  $('#edOverlay').value = s.overlay ?? 0.5;
  $('#edNotes').value = s.notes || '';
  $('#edFooter').value = s.footer || '© CapyUniverse';
  $('#edImgPrompt').value = s.imgPrompt || '';
  renderStage();
  renderThumbs();
  // NÃO muda de aba aqui: respeita a aba atual
}

// ===== Zoom (Preview)
function adjustStageScale() {
  const wrap = $('#stageWrap');
  const canvas = $('#stage');
  if (!wrap || !canvas) return;

  const mode = $('#zoomSel').value;
  if (mode !== 'fit') {
    const scale = Number(mode) || 1;
    canvas.style.transform = `scale(${scale})`;
    canvas.style.margin = '0';
    wrap.style.alignItems = 'flex-start';
    wrap.style.justifyContent = 'flex-start';
    return;
  }

  // Ajustar ao container
  const pad = 24;
  const availW = wrap.clientWidth - pad;
  const availH = wrap.clientHeight - pad;
  const scale = Math.max(0.25, Math.min(availW / 1280, availH / 720));
  canvas.style.transform = `scale(${scale})`;
  // centraliza
  canvas.style.margin = '0';
  wrap.scrollTop = 0; wrap.scrollLeft = 0;
}

window.addEventListener('resize', () => { if (getActivePanel() === 'preview') adjustStageScale(); });
$('#zoomSel')?.addEventListener('change', adjustStageScale);

// ===== Editor
function applyEditor() {
  const s = state.slides[state.sel];
  s.title = $('#edTitle').value; s.sub = $('#edSub').value;
  s.bullets = lines($('#edBullets').value);
  s.bg = $('#edBG').value.trim();
  s.overlay = clamp(Number($('#edOverlay').value), 0, 0.8);
  s.notes = $('#edNotes').value; s.footer = $('#edFooter').value || '© CapyUniverse';
  s.imgPrompt = $('#edImgPrompt').value || '';
  renderStage(); renderThumbs();
}
function addSlide() {
  state.slides.push({ id: uid(), title: 'Novo Slide', sub: '', bullets: [], overlay: 0.5, notes: '', footer: '© CapyUniverse', imgPrompt: '', bg: '' });
  renderThumbs(); selectSlide(state.slides.length - 1);
}
function deleteSlide() { if (!state.slides.length) return; state.slides.splice(state.sel, 1); state.sel = Math.max(0, state.sel - 1); renderThumbs(); renderStage(); }
function duplicateSlide() { const clone = JSON.parse(JSON.stringify(state.slides[state.sel] || {})); clone.id = uid(); state.slides.splice(state.sel + 1, 0, clone); renderThumbs(); selectSlide(state.sel + 1); }

// ===== Prompts p/ fundo
function suggestPrompt() {
  const s = state.slides[state.sel] || {};
  const title = (s.title || '').toLowerCase();
  const type = $('#inType').value;
  const theme = {
    negocios: 'clean corporate, soft vignette',
    vendas: 'bold contrast, product highlight bokeh',
    investidores: 'sleek gradient, data waves',
    resultados: 'elegant charts texture, analytic',
    produtos: 'studio lighting backdrop',
    projetos: 'roadmap lines, timeline vibe',
    pitch: 'modern gradient, high contrast',
    pessoais: 'subtle portrait backdrop',
    criativas: 'playful shapes, neon accents'
  }[type] || 'modern gradient';
  const prompt = `${theme}, ${title || 'slide background'}, minimalist, professional, 16:9`;
  $('#edImgPrompt').value = prompt;
  state.slides[state.sel].imgPrompt = prompt;
}
function genBGFromPrompt() {
  const s = state.slides[state.sel]; if (!s) return;
  const p = $('#edImgPrompt').value.trim(); if (!p) { alert('Escreva um prompt de imagem.'); return; }
  s.imgPrompt = p; s.bg = pollinationsURL(p); $('#edBG').value = s.bg; renderStage(); renderThumbs();
}
function autoBGFromTitle() {
  const s = state.slides[state.sel]; if (!s) return;
  const p = `${s.title || 'Slide'} background, minimalist, professional, 16:9`;
  s.bg = pollinationsURL(p); $('#edBG').value = s.bg; renderStage(); renderThumbs();
}

// ===== Briefing — elementos por tipo
const ELEMENTS_BY_TYPE = {
  negocios: ['Infográficos', 'Gráficos e Tabelas', 'Vídeos', 'Webinars', 'Palestras/Seminários'],
  vendas: ['Demonstração em vídeo', 'Comparativo visual', 'Prova social', 'Gráficos e Tabelas'],
  investidores: ['Gráficos e Tabelas', 'Infográficos', 'Resumo executivo', 'Roadmap visual'],
  resultados: ['Gráficos e Tabelas', 'Infográficos', 'Resumo executivo'],
  produtos: ['Demonstração em vídeo', 'Infográficos', 'Comparativo visual'],
  projetos: ['Linha do tempo', 'Riscos/Mitigação', 'Kanban visual'],
  pitch: ['Resumo executivo', 'Infográficos', 'Projeções', 'Roadmap visual'],
  pessoais: ['Portfólio visual', 'Timeline', 'Testemunhos'],
  criativas: ['Storyboards', 'Moodboard', 'Tipografia/Paleta']
};
function mountElementsUI() {
  const type = $('#inType').value;
  const box = $('#elChecklist');
  box.innerHTML = '';
  (ELEMENTS_BY_TYPE[type] || []).forEach(label => {
    const id = 'el_' + label.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    const wrap = document.createElement('label');
    wrap.innerHTML = `<input type="checkbox" class="elTok" value="${label}"> ${label}`;
    box.appendChild(wrap);
  });
}
$('#inType')?.addEventListener('change', mountElementsUI);

// ===== Upload: txt/pdf/docx => texto para prompt
async function readTxt(file) { return await file.text(); }
async function readPdf(file) {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let out = ''; for (let p = 1; p <= pdf.numPages; p++) { const page = await pdf.getPage(p); const content = await page.getTextContent(); out += content.items.map(i => i.str).join(' ') + '\n'; }
  return out;
}
async function readDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const res = await window.mammoth.convertToHtml({ arrayBuffer });
  // tira tags
  return res.value.replace(/<[^>]+>/g, ' ');
}
$('#inFiles')?.addEventListener('change', async (e) => {
  const files = [...(e.target.files || [])];
  let text = '';
  for (const f of files) {
    try {
      if (f.name.endsWith('.txt') || f.name.endsWith('.md')) text += '\n' + await readTxt(f);
      else if (f.name.endsWith('.pdf')) text += '\n' + await readPdf(f);
      else if (f.name.endsWith('.docx')) text += '\n' + await readDocx(f);
    } catch (err) { console.warn('Falha lendo', f.name, err); }
  }
  state.extraText = text.slice(0, 20000); // limite seguro
  $('#fileInfo').textContent = files.length ? `${files.length} arquivo(s) lido(s)` : '';
});

// ===== Deck template (local) + slide count
function deckTemplate({ name, tagline, type, count }) {
  const commonFooter = '© ' + (name || 'CapyUniverse');
  const intro = { title: name || 'Seu Projeto', sub: tagline || '', bullets: [], footer: commonFooter };
  const map = {
    negocios: [intro,
      { title: 'Quem somos', sub: 'Visão geral', bullets: ['Propósito', 'Proposta de valor', 'Público-alvo'] },
      { title: 'Portfólio', sub: 'Produtos e serviços', bullets: ['Principais linhas', 'Diferenciais', 'Casos'] },
      { title: 'Resultados', sub: 'Indicadores', bullets: ['Receita', 'Crescimento', 'Satisfação'] },
      { title: 'Próximos passos', sub: 'Roteiro', bullets: ['Metas', 'Iniciativas', 'Cronograma'] },
      { title: 'Contato', sub: 'Vamos conversar', bullets: ['Email', 'Site', 'Redes'] }
    ],
    vendas: [intro,
      { title: 'Dor do cliente', sub: 'Problema a resolver', bullets: ['Contexto', 'Impacto', 'Causas'] },
      { title: 'Solução', sub: name + ' — como resolvemos', bullets: ['Benefícios-chave', 'Funcionalidades', 'Prova social'] },
      { title: 'Demonstração', sub: 'Fluxo principal', bullets: ['Como funciona', 'Integração', 'Tempo de valor'] },
      { title: 'Proposta de valor', sub: 'Por que agora', bullets: ['ROI', 'Comparativo', 'Garantias'] },
      { title: 'Planos & preços', sub: 'Modelos comerciais', bullets: ['Assinaturas', 'Serviços', 'Descontos'] },
      { title: 'Próximos passos', sub: 'Call to action', bullets: ['Teste', 'Reunião', 'Implantação'] }
    ],
    investidores: [intro,
      { title: 'Problema', sub: 'Oportunidade real', bullets: ['Tendência', 'Timing', 'Consequências'] },
      { title: 'Solução', sub: name + ' — proposta', bullets: ['Produto', 'Diferenciais', 'Moat'] },
      { title: 'Mercado', sub: 'TAM / SAM / SOM', bullets: ['Segmentos', 'Crescimento', 'Concorrência'] },
      { title: 'Tração', sub: 'Provas de demanda', bullets: ['Usuários', 'Receita', 'Crescimento'] },
      { title: 'Modelo de negócios', sub: 'Como capturamos valor', bullets: ['Monetização', 'Unit economics', 'LTV/CAC'] },
      { title: 'Equipe', sub: 'Por que nós', bullets: ['Complementaridade', 'Histórico', 'Advisors'] },
      { title: 'Pedido', sub: 'Uso do capital', bullets: ['Ticket', 'Runway', 'Marcos'] }
    ],
    resultados: [intro,
      { title: 'Resumo executivo', sub: 'Highlights do período', bullets: ['Receita', 'Lucro/Prejuízo', 'Principais eventos'] },
      { title: 'Desempenho financeira', sub: 'Gráficos & tabelas', bullets: ['Receita vs meta', 'Custos', 'Margens'] },
      { title: 'Operacional', sub: 'KPIs', bullets: ['NPS', 'Churn', 'Produtividade'] },
      { title: 'Próximos passos', sub: 'Plano do trimestre', bullets: ['Iniciativas', 'OKRs', 'Prazos'] }
    ],
    produtos: [intro,
      { title: 'Visão do produto', sub: 'Para quem & por quê', bullets: ['Persona', 'JTBD', 'Resultados esperados'] },
      { title: 'Funcionalidades', sub: 'Demonstração', bullets: ['Fluxos', 'Diferenciais', 'Integrações'] },
      { title: 'Prova social', sub: 'Validação', bullets: ['Depoimentos', 'Números', 'Cases'] },
      { title: 'Roadmap', sub: 'Próximos releases', bullets: ['Curto', 'Médio', 'Longo'] }
    ],
    projetos: [intro,
      { title: 'Contexto', sub: 'Objetivos & escopo', bullets: ['Objetivo', 'Stakeholders', 'Escopo'] },
      { title: 'Status', sub: 'Onde estamos', bullets: ['Entregas', 'Timeline', 'Riscos'] },
      { title: 'Próximos passos', sub: 'Plano', bullets: ['Backlog', 'Dependências', 'Datas'] }
    ],
    pitch: [intro,
      { title: 'Problema', sub: 'Dor do mercado', bullets: ['Contexto', 'Impacto', 'Urgência'] },
      { title: 'Solução', sub: name + ' — como resolvemos', bullets: ['Produto', 'Diferenciais', 'Moat'] },
      { title: 'Mercado', sub: 'TAM / SAM / SOM', bullets: ['Segmentos', 'Crescimento', 'Concorrência'] },
      { title: 'Tração', sub: 'Sinais reais', bullets: ['Usuários', 'Receita', 'Crescimento'] },
      { title: 'Modelo de negócios', sub: 'Como ganhamos dinheiro', bullets: ['Planos', 'Unit economics', 'Pricing'] },
      { title: 'Pedido', sub: 'Quanto e para quê', bullets: ['Ticket', 'Uso', 'Marcos'] }
    ],
    pessoais: [intro,
      { title: 'Quem sou eu', sub: 'Resumo', bullets: ['Formação', 'Habilidades', 'Interesses'] },
      { title: 'Portfólio', sub: 'Trabalhos & cases', bullets: ['Projetos', 'Resultados', 'Links'] },
      { title: 'Contato', sub: 'Vamos conversar', bullets: ['Email', 'Site', 'Redes'] }
    ],
    criativas: [intro,
      { title: 'Conceito', sub: 'Storytelling', bullets: ['Tema', 'Referências', 'Mood'] },
      { title: 'Exploração visual', sub: 'Direção de arte', bullets: ['Paleta', 'Tipografia', 'Composição'] },
      { title: 'Entrega', sub: 'Formato & canais', bullets: ['Assets', 'Prazos', 'Checklist'] }
    ]
  };
  let base = map[type] || map['pitch'];
  if (count && Number(count) > 0) {
    const n = Number(count);
    if (base.length > n) base = base.slice(0, n);
    if (base.length < n) {
      while (base.length < n) base.push({ title: 'Slide extra', sub: '', bullets: [] });
    }
  }
  return base.map(s => ({
    id: uid(),
    title: s.title, sub: s.sub, bullets: s.bullets || [], notes: s.notes || '', footer: s.footer || commonFooter,
    overlay: 0.5, imgPrompt: '', bg: pollinationsURL(`${s.title} background, minimalist, professional, 16:9`)
  }));
}

// ===== Generate (local & Gemini)
function collectTokens() {
  const els = [...$$('.elTok:checked')].map(x => x.value);
  const styles = [...$$('.styleTok:checked')].map(x => x.value);
  return { els, styles };
}
function generateLocal() {
  const name = $('#inName').value.trim() || 'CapyUniverse';
  const tagline = $('#inTagline').value.trim() || 'Plataforma de IA modular';
  const type = $('#inType').value || 'pitch';
  const count = $('#inSlideCount').value;
  state.slides = deckTemplate({ name, tagline, type, count });
  renderThumbs(); selectSlide(0);
}
async function generateGemini() {
  const apiKey = $('#apiKey').value.trim();
  if (!apiKey) { alert('Cole sua Gemini API Key.'); return; }
  const model = $('#modelSel').value || 'gemini-2.0-flash';
  const name = $('#inName').value.trim() || 'CapyUniverse';
  const tagline = $('#inTagline').value.trim() || 'Plataforma de IA modular';
  const type = $('#inType').value || 'pitch';
  const count = $('#inSlideCount').value;
  const { els, styles } = collectTokens();
  const notes = $('#inNotes').value.trim();
  const corpus = (state.extraText || '').slice(0, 20000);

  const sys = 'Você é um gerador de pitch deck. Responda **APENAS** JSON válido UTF-8 no formato {"slides":[{"title":"...","sub":"...","bullets":["..."],"notes":"...","footer":"..." }], "timing":{"per_slide_seconds":[...],"total_minutes": 0}}';
  const directives = [
    `Nome: ${name}`,
    `Tagline: ${tagline}`,
    `Tipo: ${type}`,
    count ? `Quantidade desejada de slides: ${count}` : `Quantidade: a IA decide conforme objetivo`,
    els.length ? `Elementos a priorizar: ${els.join(', ')}` : '',
    styles.length ? `Tonalidades/estilo: ${styles.join(', ')}` : '',
    notes ? `Observações: ${notes}` : '',
    corpus ? `Conteúdo de referência (trechos): ${corpus.slice(0, 1500)}...` : ''
  ].filter(Boolean).join('\n');

  try {
    const body = { contents: [{ role: 'user', parts: [{ text: sys }, { text: directives }] }], generationConfig: { temperature: 0.6, topK: 40, topP: 0.9, maxOutputTokens: 2000 } };
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) { const t = await res.text(); throw new Error('Erro Gemini: ' + t); }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    let json; try { json = JSON.parse(text); } catch (e) { const m = text.match(/\{[\s\S]*\}/); if (!m) throw e; json = JSON.parse(m[0]); }
    const slides = Array.isArray(json.slides) ? json.slides : [];
    if (!slides.length) throw new Error('Resposta vazia da IA.');
    state.slides = slides.map(s => ({
      id: uid(),
      title: s.title || '', sub: s.sub || '',
      bullets: Array.isArray(s.bullets) ? s.bullets : lines(String(s.bullets || '')),
      notes: s.notes || '',
      footer: s.footer || ('© ' + name),
      overlay: 0.5, imgPrompt: '', bg: pollinationsURL(`${s.title || 'Slide'} background, minimalist, professional, 16:9`)
    }));
    // timing opcional: json.timing?.per_slide_seconds
    renderThumbs(); selectSlide(0);
    showPanel('preview');
  } catch (err) { console.error(err); alert('Falha ao gerar com Gemini. Veja o console.'); }
}

// ===== Talk Track (sumário de fala por slide)
async function talkTrackForSlide(idx) {
  const s = state.slides[idx]; if (!s) return;
  const apiKey = $('#apiKey').value.trim();
  if (apiKey) {
    const model = $('#modelSel').value || 'gemini-2.0-flash';
    const prompt = `Gere um resumo de fala (3–5 frases, tom claro e objetivo) para este slide.\nTítulo:${s.title}\nSub:${s.sub}\nBullets:${(s.bullets || []).join(' | ')}`;
    try {
      const body = { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.5, maxOutputTokens: 250 } };
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { throw new Error('IA falhou'); }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
      s.notes = text.trim();
      $('#edNotes').value = s.notes;
      $('#notesBox').textContent = s.notes;
      return;
    } catch (e) { /* cai no local */ }
  }
  // fallback local
  s.notes = `${s.title}. ${s.sub ? s.sub + '. ' : ''}${(s.bullets || []).slice(0, 3).map(b => b.replace(/\.*$/, '')).join('. ')}.`.trim();
  $('#edNotes').value = s.notes;
  $('#notesBox').textContent = s.notes;
}
$('#btnTalkTrack')?.addEventListener('click', () => talkTrackForSlide(state.sel));

// ===== Export
async function toDataURL(url) { try { const r = await fetch(url, { mode: 'cors' }); const b = await r.blob(); return await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); }); } catch (e) { return ''; } }
async function exportPPTX() {
  const pptx = new PptxGenJS(); pptx.title = state.slides[0]?.title || 'CapySLIDE';
  for (const s of state.slides) {
    const slide = pptx.addSlide(); slide.background = { color: '1F2937' };
    const bgData = s.bg ? await toDataURL(s.bg) : '';
    if (bgData) slide.addImage({ data: bgData, x: 0, y: 0, w: 10.00, h: 5.63 });
    slide.addText(s.title || '', { x: 0.6, y: 0.5, w: 12, h: 1.2, fontSize: 36, bold: true, color: 'FFFFFF' });
    slide.addText(s.sub || '', { x: 0.6, y: 1.5, w: 12, h: 1.0, fontSize: 18, color: 'D1E3FF' });
    const bullets = (s.bullets || []).map(t => ({ text: t, options: { bullet: true, fontSize: 18, color: 'FFFFFF' } }));
    if (bullets.length) slide.addText(bullets, { x: 0.8, y: 2.2, w: 12.0, h: 4.5 });
    if (s.footer) slide.addText(s.footer, { x: 0.6, y: 6.6, w: 12, h: .4, fontSize: 12, color: 'D1D5DB' });
    if (s.notes) slide.addNotes(s.notes);
  }
  await pptx.writeFile({ fileName: (state.slides[0]?.title || 'CapySLIDE') + '.pptx' });
}
async function exportPDF() {
  const wrap = document.createElement('div'); wrap.style.width = '1280px';
  for (const s of state.slides) {
    const page = document.createElement('div'); page.className = 'slide-canvas';
    const bg = document.createElement('div'); bg.className = 'slide-bg'; if (s.bg) bg.style.backgroundImage = `url('${s.bg}')`;
    const ov = document.createElement('div'); ov.className = 'slide-overlay'; const amt = clamp(Number(s.overlay ?? .5), 0, .8); ov.style.background = `linear-gradient(180deg,rgba(0,0,0,${amt}),rgba(0,0,0,${amt + .08}))`;
    const ct = document.createElement('div'); ct.className = 'slide-content'; ct.innerHTML = `<div class="slide-title">${toSafe(s.title || '')}</div><div class="slide-sub">${toSafe(s.sub || '')}</div><div class="bullets">${(s.bullets || []).map(b => `<div>${toSafe(b)}</div>`).join('')}</div>`;
    const footer = document.createElement('div'); footer.style.position = 'absolute'; footer.style.left = '24px'; footer.style.bottom = '22px'; footer.style.opacity = '.8'; footer.style.fontSize = '14px'; footer.textContent = s.footer || '';
    page.append(bg, ov, ct, footer); wrap.appendChild(page);
  }
  await html2pdf().set({ margin: 0, filename: (state.slides[0]?.title || 'CapySLIDE') + '.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, allowTaint: true }, jsPDF: { unit: 'px', format: [1280, 720], orientation: 'landscape' } }).from(wrap).save();
}

// ===== ICS & Calendar
const pad = (n) => n < 10 ? '0' + n : n;
const toICSDate = (dt) => { const d = new Date(dt); return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`; };
function download(name, content, type = 'text/plain') { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function makeICS() { const title = ($('#calTitle').value || 'Pitch').replace(/\n/g, ' '); const loc = ($('#calLocation').value || '').replace(/\n/g, ' '); const start = $('#calStart').value; const end = $('#calEnd').value || (() => { const s = new Date(start || Date.now()); return new Date(s.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16); })(); const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CapySLIDE//pt-BR', 'BEGIN:VEVENT', 'UID:' + uid() + '@capyslide', 'DTSTAMP:' + toICSDate(new Date()), 'DTSTART:' + toICSDate(start || new Date()), 'DTEND:' + toICSDate(end), 'SUMMARY:' + title, 'LOCATION:' + loc, 'DESCRIPTION:Pitch gerado pelo CapySLIDE', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n'); download((title.replace(/\s+/g, '_') || 'evento') + '.ics', ics, 'text/calendar'); }
function openGCal() { const title = encodeURIComponent($('#calTitle').value || 'Pitch'); const loc = encodeURIComponent($('#calLocation').value || ''); const start = new Date($('#calStart').value || Date.now()); const end = new Date($('#calEnd').value || (start.getTime() + 60 * 60 * 1000)); const fmt = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${d.getHours().toString().padStart(2, '0')}${d.getMinutes().toString().padStart(2, '0')}00`; const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=Pitch%20CapySLIDE&location=${loc}`; window.open(url, '_blank'); }

// ===== Storage
function saveLocal() { localStorage.setItem('capyslide_zeph', JSON.stringify(state)); alert('Apresentação salva ✅'); }
function loadLocal() { const raw = localStorage.getItem('capyslide_zeph'); if (!raw) { alert('Nada salvo.'); return; } Object.assign(state, JSON.parse(raw)); renderThumbs(); selectSlide(clamp(state.sel || 0, 0, Math.max(0, state.slides.length - 1))); }

// ===== Bindings & Init
function bindTabs() { $$('.tab-btn').forEach(b => b.addEventListener('click', () => showPanel(b.getAttribute('data-tab')))); }
function bindEditor() {
  $('#btnApply').onclick = applyEditor;
  $('#btnAddSlide').onclick = addSlide;
  $('#btnDeleteSlide').onclick = deleteSlide;
  $('#btnDuplicate').onclick = duplicateSlide;
  $('#btnSuggestPrompt').onclick = suggestPrompt;
  $('#btnGenFromPrompt').onclick = genBGFromPrompt;
  $('#btnAutoBG').onclick = autoBGFromTitle;
  $('#btnPrev').onclick = () => { state.sel = clamp(state.sel - 1, 0, state.slides.length - 1); selectSlide(state.sel); };
  $('#btnNext').onclick = () => { state.sel = clamp(state.sel + 1, 0, state.slides.length - 1); selectSlide(state.sel); };
  $('#btnExportPDF').onclick = exportPDF;
  $('#btnExportPPTX').onclick = exportPPTX;
  $('#btnICS').onclick = makeICS;
  $('#btnGCal').onclick = openGCal;
  $('#btnSave').onclick = saveLocal;
  $('#btnLoad').onclick = loadLocal;
  $('#btnGenerateLocal').onclick = generateLocal;
  $('#btnGenerateGemini').onclick = generateGemini;
}
window.addEventListener('DOMContentLoaded', () => {
  bindTabs(); bindEditor(); mountElementsUI();
  // Estado inicial
  state.slides = [{ id: uid(), title: 'CapySLIDE', sub: 'Tema Zeph-inspired', bullets: ['Deck rápido', 'Editável', 'Exportável'], overlay: 0.5, notes: 'Apresente o valor em 30s.', footer: '© CapyUniverse', imgPrompt: '', bg: pollinationsURL('modern gradient, sleek, professional, 16:9') }];
  renderThumbs(); selectSlide(0);
  showPanel('brief');
  // Preferência do usuário + colapso automático em telas menores
  let startCollapsed = false;
  try {
    const saved = localStorage.getItem('capyslide_aside_collapsed');
    if (saved != null) startCollapsed = (saved === 'true');
    else startCollapsed = window.innerWidth <= 1024; // auto-colapsa em telas menores na 1ª vez
  } catch { }
  setAsideCollapsed(startCollapsed);

  // Bind dos botões de toggle
  const t1 = document.getElementById('btnToggleAside');
  const t2 = document.getElementById('btnToggleAsidePreview');
  t1 && t1.addEventListener('click', toggleAside);
  t2 && t2.addEventListener('click', toggleAside);

  // Se redimensionar para muito pequeno, colapsa; se voltar a grande, restaura escolha salva
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    if (w <= 1024) {
      setAsideCollapsed(true);
    } else {
      // respeita a preferência que o usuário deixou salva
      const saved = localStorage.getItem('capyslide_aside_collapsed');
      setAsideCollapsed(saved === 'true');
    }
  });
});
