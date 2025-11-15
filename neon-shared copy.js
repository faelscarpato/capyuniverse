
/* neon-shared.js — efeitos 3D leves, slider e carregamento dinâmico */
(() => {
  const state = { tools: [], images: [] };

  async function loadTools() {
    if (state.tools.length) return state.tools;
    try {
      const res = await fetch('tools.json', { cache: 'no-store' });
      state.tools = await res.json();
    } catch (e) {
      console.error('Falha ao carregar tools.json', e);
      state.tools = [];
    }
    return state.tools;
  }

  // ====== HERO SLIDER (usa imageUrl das capys) ======
  async function initHeroSlider() {
    const wrap = document.getElementById('heroSlides');
    if (!wrap) return;
    const tools = await loadTools();
    const imgs = tools
      .map(t => t.imageUrl)
      .filter(Boolean)
      .slice(0, 12);
    if (!imgs.length) return;

    // cria elementos
    imgs.forEach((src, i) => {
      const el = document.createElement('div');
      el.className = 'slide absolute inset-0 opacity-0 transition-opacity duration-700 ease-out';
      el.style.backgroundImage = `url(${src})`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.filter = 'blur(6px) saturate(115%) brightness(0.9)';
      el.style.transform = 'scale(1.06)';
      el.setAttribute('aria-hidden', 'true');
      if (i === 0) el.classList.add('opacity-60');
      wrap.appendChild(el);
    });

    let i = 0;
    setInterval(() => {
      const slides = wrap.querySelectorAll('.slide');
      slides.forEach((s, idx) => s.classList.toggle('opacity-60', idx === i));
      i = (i + 1) % slides.length;
    }, 2800);
  }

  // ====== 3D TILT ======
  function initTilt() {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      const strength = Number(card.dataset.tilt) || 12;
      let rect;
      function onMove(e) {
        if (!rect) rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const rx = (0.5 - y) * strength;
        const ry = (x - 0.5) * strength;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
      function reset() {
        rect = null;
        card.style.transform = 'perspective(900px) rotateX(0) rotateY(0)';
      }
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', reset);
      card.addEventListener('touchmove', (e) => {
        const t = e.touches[0];
        onMove(t);
      }, {passive:true});
      card.addEventListener('touchend', reset);
    });
  }

  // ====== CONECTOR ENTRE SEÇÕES ======
  function initSectionConnector() {
    const svg = document.getElementById('connector');
    if (!svg) return;
    const path = svg.querySelector('path');
    const sections = Array.from(document.querySelectorAll('section[data-anchor]'));
    function update() {
      if (!sections.length) return;
      const points = [];
      sections.forEach(sec => {
        const r = sec.getBoundingClientRect();
        const x = window.innerWidth * 0.06;
        const y = r.top + r.height * 0.12 + window.scrollY;
        points.push([x, y]);
      });
      // Curva suave com "C" bezier entre os pontos
      if (points.length) {
        let d = `M ${points[0][0]},${points[0][1]}`;
        for (let i=1; i<points.length; i++) {
          const [x1,y1] = points[i-1];
          const [x2,y2] = points[i];
          const cx1 = x1 + 180, cy1 = y1 + 60;
          const cx2 = x2 - 180, cy2 = y2 - 60;
          d += ` C ${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;
        }
        path.setAttribute('d', d);
        const len = path.getTotalLength();
        path.style.strokeDasharray = String(len);
        const progress = Math.min(1, (window.scrollY + window.innerHeight*0.75) / (document.body.scrollHeight));
        path.style.strokeDashoffset = String(len * (1 - progress));
      }
    }
    update();
    window.addEventListener('scroll', () => requestAnimationFrame(update), {passive:true});
    window.addEventListener('resize', () => requestAnimationFrame(update));
  }

  // ===== HUB E CATEGORIAS =====
  async function buildHub(gridSel = '#hubGrid', chipsSel = '#hubChips') {
    const grid = document.querySelector(gridSel);
    if (!grid) return;
    const tools = await loadTools();
    const cats = [...new Set(tools.map(t => t.category).filter(Boolean))].sort();
    const chips = document.querySelector(chipsSel);
    const buildCard = (t) => {
      const a = document.createElement('a');
      a.href = t.pageUrl || '#';
      a.className = 'group block rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-3 hover:shadow-2xl hover:-translate-y-1 transition-all';
      a.setAttribute('data-tilt', '8');
      a.innerHTML = `
        <div class="h-36 w-full overflow-hidden rounded-xl mb-3">
          <img src="${t.imageUrl || ''}" alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        </div>
        <div class="flex items-center justify-between mb-1">
          <h3 class="text-base font-bold tracking-tight bg-gradient-to-r from-fuchsia-400 to-sky-400 bg-clip-text text-transparent">${t.title}</h3>
          <span class="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-slate-300">${t.category || 'Geral'}</span>
        </div>
        <p class="text-sm text-slate-300/80 line-clamp-2">${t.description || ''}</p>
      `;
      return a;
    };

    function render(filterCat) {
      grid.innerHTML = '';
      tools
        .filter(t => !filterCat || t.category === filterCat)
        .forEach(t => grid.appendChild(buildCard(t)));
      initTilt();
    }

    if (chips) {
      chips.innerHTML = '';
      const all = document.createElement('button');
      all.className = 'chip px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs hover:border-fuchsia-400/50';
      all.textContent = 'Todas';
      all.addEventListener('click', () => render(null));
      chips.appendChild(all);
      cats.forEach(c => {
        const b = document.createElement('button');
        b.className = 'chip px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs hover:border-fuchsia-400/50';
        b.textContent = c;
        b.addEventListener('click', () => render(c));
        chips.appendChild(b);
      });
    }
    render(null);
  }

  async function buildCategoryView(rootSel = '#categoryRoot') {
    const root = document.querySelector(rootSel);
    if (!root) return;
    const params = new URLSearchParams(location.search);
    const cat = params.get('cat') || '';
    const tools = await loadTools();
    const list = tools.filter(t => (t.category||'').toLowerCase() === cat.toLowerCase());
    const title = document.getElementById('catTitle');
    if (title) title.textContent = cat || 'Categoria';

    const grid = root.querySelector('[data-grid]');
    grid.innerHTML = '';
    list.forEach(t => {
      const card = document.createElement('a');
      card.href = t.pageUrl || '#';
      card.className = 'group block rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-3 hover:shadow-2xl hover:-translate-y-1 transition-all';
      card.setAttribute('data-tilt','8');
      card.innerHTML = `
        <div class="h-40 w-full overflow-hidden rounded-xl mb-3">
          <img src="${t.imageUrl || ''}" alt="${t.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        </div>
        <h3 class="text-base font-bold tracking-tight bg-gradient-to-r from-fuchsia-400 to-sky-400 bg-clip-text text-transparent">${t.title}</h3>
        <p class="text-sm text-slate-300/80 mt-1 line-clamp-2">${t.description||''}</p>
      `;
      grid.appendChild(card);
    });
    initTilt();
  }

  // ===== EXPORT API =====
  window.CU_NEON = {
    initHeroSlider,
    initTilt,
    initSectionConnector,
    buildHub,
    buildCategoryView,
    loadTools
  };

  // auto init (best-effort)
  document.addEventListener('DOMContentLoaded', () => {
    initHeroSlider();
    initTilt();
    initSectionConnector();
  });
})();
