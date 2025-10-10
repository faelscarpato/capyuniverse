(() => {
  const API_KEY_STORAGE_KEY = 'capyUniverseApiKey_gemini';

  function shouldSkip() {
    const body = document.body;
    return !body || body.dataset.cuSkipShell === 'true' || body.dataset.cuSkipShell === '1';
  }

  function applyBackground() {
    const body = document.body;
    if (!body) return;
    body.classList.add('min-h-screen', 'flex', 'flex-col');
    body.classList.remove('bg-gray-900', 'bg-gray-950', 'text-white');

    if (!body.querySelector('.cu-stars')) {
      const stars = document.createElement('div');
      stars.className = 'cu-stars';
      stars.dataset.cuGenerated = 'true';
      body.insertBefore(stars, body.firstChild);
    }
    if (!body.querySelector('.cu-stage')) {
      const stage = document.createElement('div');
      stage.className = 'cu-stage';
      stage.dataset.cuGenerated = 'true';
      body.insertBefore(stage, body.firstChild);
    }
  }

  function deriveToolName() {
    const body = document.body;
    if (!body) return 'CapyUniverse';
    const fromAttr = body.getAttribute('data-tool-name');
    if (fromAttr) return fromAttr.trim();
    const meta = document.querySelector('meta[name="tool-name"]');
    if (meta?.content) return meta.content.trim();
    const title = document.title || '';
    const candidate = title.split(/[\-|—|–|\u2014|\u2013|:]/)[0]?.trim();
    if (candidate) return candidate;
    return 'CapyUniverse';
  }

  function toolAbbr(name) {
    const letters = (name || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 3);
    return (letters || 'CU').toUpperCase();
  }

  function createLogoEl(abbr) {
    const span = document.createElement('span');
    span.className = 'cu-logo';
    span.textContent = abbr;
    return span;
  }

  function ensureBrand(header, name) {
    if (!header) return;

    header.classList.add('cu-header');

    const legacyTitleEl = header.querySelector('.cu-appname, [data-app-name], .app-title, h1, strong, a');
    const legacyTitle = legacyTitleEl?.textContent?.trim();
    const effectiveName = legacyTitle?.length ? legacyTitle : name;

    let brandWrap = header.querySelector('.cu-brand');
    if (!brandWrap) {
      brandWrap = document.createElement('div');
      header.insertBefore(brandWrap, header.firstChild);
    }
    brandWrap.innerHTML = '';
    brandWrap.className = 'cu-brand';

    let toggleBtn = header.querySelector('#sidebarToggleBtn');
    if (!toggleBtn) {
      toggleBtn = document.createElement('button');
      toggleBtn.id = 'sidebarToggleBtn';
      toggleBtn.type = 'button';
      toggleBtn.innerHTML = '<i class="fas fa-bars text-xl"></i>';
    }
    toggleBtn.className = 'lg:hidden p-2 rounded-md text-gray-300 hover:bg-white/10 focus:outline-none';
    if (!toggleBtn.parentElement || toggleBtn.parentElement !== brandWrap) {
      toggleBtn.remove();
    }
    brandWrap.appendChild(toggleBtn);

    const info = document.createElement('div');
    info.className = 'flex items-center gap-2 cu-brand-info';
    info.appendChild(createLogoEl(toolAbbr(effectiveName)));

    const brandNameEl = document.createElement('span');
    brandNameEl.className = 'cu-appname text-xl';
    brandNameEl.textContent = effectiveName;
    info.appendChild(brandNameEl);

    const chip = document.createElement('span');
    chip.className = 'cu-chip hidden sm:inline-flex';
    chip.textContent = 'CapyUniverse';
    info.appendChild(chip);

    brandWrap.appendChild(info);

    let actions = header.querySelector('.cu-header-actions');
    if (!actions) {
      actions = document.createElement('div');
      header.appendChild(actions);
    }
    actions.className = 'flex items-center gap-2 cu-header-actions';

    Array.from(header.children).forEach(child => {
      if (child === brandWrap || child === actions) return;
      actions.appendChild(child);
    });

    Array.from(header.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) {
        header.removeChild(node);
      }
    });
  }

  function ensureHeader(name) {
    const body = document.body;
    if (!body) return null;
    let header = document.querySelector('body > header');
    if (!header) {
      header = document.createElement('header');
      if (body.firstChild) {
        body.insertBefore(header, body.firstChild);
      } else {
        body.appendChild(header);
      }
    }
    ensureBrand(header, name);
    return header;
  }

  function ensureHeaderButtons() {
    const actions = document.querySelector('.cu-header-actions');
    if (!actions) return;

    const homeBtn = Array.from(actions.querySelectorAll('button')).find(btn => /in[ií]cio/i.test(btn.textContent || ''));
    if (homeBtn) {
      homeBtn.className = 'cu-btn hidden sm:inline-flex';
      if (!homeBtn.getAttribute('onclick')) {
        homeBtn.onclick = () => { window.location.href = 'index.html'; };
      }
    } else {
      const btn = document.createElement('button');
      btn.className = 'cu-btn hidden sm:inline-flex';
      btn.type = 'button';
      btn.textContent = 'Início';
      btn.addEventListener('click', () => { window.location.href = 'index.html'; });
      actions.insertBefore(btn, actions.firstChild);
    }

    const hasModal = !!document.getElementById('apiKeysModal');
    let apiBtn = document.getElementById('openApiKeysModalButton');
    if (!apiBtn && hasModal) {
      apiBtn = document.createElement('button');
      apiBtn.id = 'openApiKeysModalButton';
      apiBtn.type = 'button';
      apiBtn.textContent = 'Chaves API';
      actions.appendChild(apiBtn);
    }
    if (apiBtn) {
      apiBtn.className = 'cu-btn primary hidden sm:inline-flex';
    }
  }

  function stylizeLayout() {
    const layout = Array.from(document.querySelectorAll('body > div')).find(div => div.querySelector('main') && div.querySelector('#sidebar'));
    if (layout) {
      layout.className = 'flex flex-1 pt-16 min-h-0';
    }

    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.className = 'sidebar-glass text-gray-300 w-64 space-y-1 p-3 fixed inset-y-0 left-0 transform -translate-x-full lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out z-30 shadow-lg overflow-y-auto pt-4 scrollbar-thin';
    }

    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
      overlay.className = 'fixed inset-0 bg-black/60 z-20 hidden lg:hidden';
    } else if (sidebar) {
      const newOverlay = document.createElement('div');
      newOverlay.id = 'sidebarOverlay';
      newOverlay.className = 'fixed inset-0 bg-black/60 z-20 hidden lg:hidden';
      const parent = sidebar.parentElement;
      if (parent) {
        parent.insertBefore(newOverlay, sidebar.nextSibling);
      } else {
        document.body.appendChild(newOverlay);
      }
    }

    const main = document.querySelector('main');
    if (main) {
      main.className = 'flex-1 min-h-0 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full';
    }

    const primaryPanels = [];
    if (main) {
      const directSections = main.querySelectorAll(':scope > section');
      if (directSections.length) {
        directSections.forEach(section => primaryPanels.push(section));
      } else {
        const firstChild = main.firstElementChild;
        if (firstChild) primaryPanels.push(firstChild);
      }
    }

    primaryPanels.forEach((panel, idx) => {
      panel.classList.add('cu-panel');
      panel.classList.remove('glass');
      if (!panel.classList.contains('cu-panel-padded')) {
        panel.classList.add('cu-panel-padded');
        panel.classList.add('p-5', 'sm:p-6', 'lg:p-8');
      }
    });
  }

  function ensureFabButton() {
    if (!document.getElementById('apiKeysModal')) return;
    let fab = document.getElementById('fabApi');
    if (!fab) {
      fab = document.createElement('button');
      fab.id = 'fabApi';
      fab.type = 'button';
      fab.textContent = '🔑';
      document.body.appendChild(fab);
    }
    fab.className = 'sm:hidden fixed bottom-4 right-4 cu-btn primary rounded-full p-3 shadow-xl z-50';
    fab.title = 'Chaves API';
  }

  function stylizeApiModal() {
    const modal = document.getElementById('apiKeysModal');
    if (!modal) return;
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 hidden p-4';
    const sheet = modal.querySelector(':scope > div');
    if (sheet) {
      sheet.classList.remove('glass');
      sheet.classList.add('cu-panel', 'p-6', 'w-full', 'max-w-md');
    }
    const closeBtn = document.getElementById('closeApiKeysModalButton');
    if (closeBtn) {
      closeBtn.className = 'cu-btn';
      closeBtn.type = 'button';
      if (!closeBtn.textContent?.trim()) closeBtn.textContent = '✕';
    }
    const saveBtn = document.getElementById('saveGeminiKey');
    if (saveBtn) {
      saveBtn.classList.add('cu-btn', 'primary');
      saveBtn.type = 'button';
    }
    const input = document.getElementById('geminiApiKeyInputModal');
    if (input) {
      input.classList.add('cu-input');
    }
    const fieldWrapper = input?.parentElement;
    if (fieldWrapper && fieldWrapper instanceof HTMLElement) {
      fieldWrapper.classList.add('flex');
      input.classList.add('rounded-r-none');
      if (saveBtn) saveBtn.classList.add('rounded-l-none');
    }
  }

  function attachFabBehaviour() {
    const modal = document.getElementById('apiKeysModal');
    if (!modal) return;
    const fab = document.getElementById('fabApi');
    const openBtn = document.getElementById('openApiKeysModalButton');
    const closeBtn = document.getElementById('closeApiKeysModalButton');
    if (fab && !fab.dataset.cuBound) {
      fab.addEventListener('click', () => {
        modal.classList.remove('hidden');
      });
      fab.dataset.cuBound = '1';
    }
    if (modal && !modal.dataset.cuBound) {
      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) {
          modal.classList.add('hidden');
        }
      });
      modal.dataset.cuBound = '1';
    }
    if (openBtn && !openBtn.dataset.cuBound) {
      openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
      openBtn.dataset.cuBound = '1';
    }
    if (closeBtn && !closeBtn.dataset.cuBound) {
      closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
      closeBtn.dataset.cuBound = '1';
    }
  }

  function highlightSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    const current = window.location.pathname.split('/').pop() || 'index.html';
    sidebar.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      if (href === current) {
        link.classList.add('active');
      }
    });
  }

  function derivePageId() {
    const body = document.body;
    const attr = body?.getAttribute('data-tool-id');
    if (attr) return attr.trim();
    const meta = document.querySelector('meta[name="tool-id"]');
    if (meta?.content) return meta.content.trim();
    const file = window.location.pathname.split('/').pop() || '';
    if (file) return file.replace(/\.html?$/i, '');
    return '';
  }

  const toolsCache = {
    promise: null,
    data: null,
  };

  async function loadToolsData() {
    if (toolsCache.data) return toolsCache.data;
    if (!toolsCache.promise) {
      toolsCache.promise = fetch('tools.json', { cache: 'no-store' })
        .then(res => {
          if (!res.ok) throw new Error(`cu-app: failed to load tools.json (status ${res.status})`);
          return res.json();
        })
        .then(json => {
          toolsCache.data = json;
          return json;
        })
        .catch(err => {
          toolsCache.promise = null;
          throw err;
        });
    }
    return toolsCache.promise;
  }

  function normalizeId(value) {
    return (value || '').toString().trim().toLowerCase();
  }

  async function renderSidebarFromTools() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar || sidebar.dataset.cuSkip === 'true') return;

    const currentId = normalizeId(derivePageId());
    const currentFile = normalizeId(window.location.pathname.split('/').pop() || 'index.html');

    try {
      const tools = await loadToolsData();
      const categories = new Map();
      tools.forEach(tool => {
        let cats = tool.category;
        if (cats == null || cats === '') cats = ['Outros'];
        if (!Array.isArray(cats)) cats = [cats];
        if (!cats.length) cats = ['Outros'];
        cats.forEach(cat => {
          const key = cat || 'Outros';
          if (!categories.has(key)) categories.set(key, []);
          categories.get(key).push(tool);
        });
      });

      sidebar.innerHTML = '';

      const home = document.createElement('a');
      home.href = 'index.html';
      home.className = 'sidebar-link w-full flex items-center space-x-2.5 p-2.5 mb-2 rounded-md text-sm hover:bg-white/10 transition-colors duration-150 text-gray-300';
      home.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-400"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg><span>Página Inicial</span>';
      sidebar.appendChild(home);

      categories.forEach((toolsInCat, catName) => {
        const wrap = document.createElement('div');
        wrap.className = 'mb-1';

        const btn = document.createElement('button');
        btn.className = 'w-full flex justify-between items-center p-2.5 text-left text-gray-300 hover:bg-white/10 rounded-md focus:outline-none transition-colors duration-150';
        btn.innerHTML = `<span class="font-semibold text-sm">${catName}</span><svg class="w-4 h-4 transform transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;

        const content = document.createElement('div');
        content.className = 'category-content pl-3 pt-0.5 space-y-0.5';

        let hasActive = false;

        toolsInCat.forEach(tool => {
          const entry = document.createElement('a');
          entry.href = tool.pageUrl || '#';
          const iconHtml = tool.icon ? tool.icon.replace('w-10 h-10', 'w-5 h-5').replace('mb-2', 'mr-2') : '<span class="w-5 h-5 mr-2"></span>';
          const isActive = normalizeId(tool.id) === currentId || normalizeId(tool.pageUrl) === currentFile;
          if (isActive) hasActive = true;
          entry.className = `sidebar-link w-full flex items-center space-x-2 py-1.5 px-2 rounded-md text-xs hover:bg-zinc-600/60 hover:text-white transition-colors duration-150 ${isActive ? 'active' : 'text-gray-400'}`;
          entry.innerHTML = `${iconHtml}<span>${tool.title || tool.id || 'Ferramenta'}</span>`;
          content.appendChild(entry);
        });

        btn.addEventListener('click', () => {
          content.classList.toggle('expanded');
          btn.querySelector('svg')?.classList.toggle('rotate-180');
        });

        if (hasActive) {
          content.classList.add('expanded');
          btn.querySelector('svg')?.classList.add('rotate-180');
        }

        wrap.appendChild(btn);
        wrap.appendChild(content);
        sidebar.appendChild(wrap);
      });

      highlightSidebar();
    } catch (err) {
      console.error('cu-app: unable to render sidebar', err);
      sidebar.innerHTML = '<p class="text-xs text-red-400 p-2">Erro ao carregar menu.</p>';
    }
  }

  function ensureSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar || !toggleBtn || !overlay) return;
    if (toggleBtn.dataset.cuBound === '1') return;

    const toggle = (show) => {
      const shouldShow = show ?? sidebar.classList.contains('-translate-x-full');
      if (shouldShow) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
      } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
      }
    };

    toggleBtn.addEventListener('click', () => toggle());
    overlay.addEventListener('click', () => toggle(false));
    toggle(false);

    toggleBtn.dataset.cuBound = '1';
    overlay.dataset.cuBound = '1';
  }

  function loadApiKeyIntoModal() {
    const input = document.getElementById('geminiApiKeyInputModal');
    if (!input) return;
    try {
      const saved = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (saved) input.value = saved;
    } catch (err) {
      console.warn('cu-app: unable to read API key', err);
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (shouldSkip()) return;
    try {
      const toolName = deriveToolName();
      applyBackground();
      ensureHeader(toolName);
      ensureHeaderButtons();
      stylizeLayout();
      ensureFabButton();
      stylizeApiModal();
      attachFabBehaviour();
      await renderSidebarFromTools();
      ensureSidebarToggle();
      loadApiKeyIntoModal();
    } catch (err) {
      console.error('cu-app init error:', err);
    }
  });
})();
