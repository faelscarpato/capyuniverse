(() => {
  const API_KEY_STORAGE_KEY = 'capyUniverseApiKey_gemini';
  let toolsDataPromise = null;

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

  const HOME_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10.5 9-7 9 7V20a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5v-4.5h-6V20A1.5 1.5 0 0 1 7.5 21.5h-3A1.5 1.5 0 0 1 3 20Z"></path><path d="M9.75 21.5v-6h4.5v6"></path></svg>';
  const CLOSE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

  function bindHomeButton(btn) {
    if (!btn) return;
    btn.dataset.cuAction = 'home';
    btn.type = 'button';
    btn.className = 'cu-btn cu-iconbtn hidden sm:inline-flex';
    btn.setAttribute('aria-label', 'Ir para a página inicial');
    btn.innerHTML = HOME_ICON;
    if (!btn.dataset.cuBound) {
      btn.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
      btn.dataset.cuBound = '1';
    }
  }

  function ensureBrand(header, name) {
    const displayName = (name ?? '').toString().trim() || deriveToolName();
    const doc = document;
    if (!header) {
      header = doc.querySelector('body > header');
    }
    if (!header) {
      header = doc.createElement('header');
      doc.body.insertBefore(header, doc.body.firstChild || null);
    }

    header.classList.add('cu-header');
    header.dataset.cuToolLabel = displayName;

    let brandWrap = header.querySelector('.cu-brand');
    let actionsWrap = header.querySelector('.cu-header-actions');
    const needsBuild = !brandWrap || !brandWrap.dataset.cuRendered || !actionsWrap;

    if (needsBuild) {
      header.innerHTML = '';

      brandWrap = doc.createElement('div');
      brandWrap.className = 'cu-brand';
      brandWrap.dataset.cuRendered = '1';

      const toggleBtn = doc.createElement('button');
      toggleBtn.id = 'sidebarToggleBtn';
      toggleBtn.type = 'button';
      toggleBtn.className = 'lg:hidden p-2 rounded-md text-gray-300 hover:bg-white/10 focus:outline-none';
      toggleBtn.innerHTML = '<i class="fas fa-bars text-xl"></i>';
      brandWrap.appendChild(toggleBtn);

      const info = doc.createElement('div');
      info.className = 'flex items-center gap-2 cu-brand-info';

      const logo = createLogoEl(toolAbbr(displayName));
      info.appendChild(logo);

      const nameEl = doc.createElement('span');
      nameEl.className = 'cu-appname text-xl';
      nameEl.textContent = displayName;
      info.appendChild(nameEl);

      const chip = doc.createElement('span');
      chip.className = 'cu-chip hidden sm:inline-flex';
      chip.textContent = 'CapyUniverse';
      info.appendChild(chip);

      brandWrap.appendChild(info);
      header.appendChild(brandWrap);

      actionsWrap = doc.createElement('div');
      actionsWrap.className = 'flex items-center gap-2 cu-header-actions';

      const homeBtn = doc.createElement('button');
      bindHomeButton(homeBtn);
      actionsWrap.appendChild(homeBtn);

      if (doc.getElementById('apiKeysModal')) {
        const apiBtn = doc.createElement('button');
        apiBtn.id = 'openApiKeysModalButton';
        apiBtn.type = 'button';
        apiBtn.className = 'cu-btn primary hidden sm:inline-flex';
        apiBtn.textContent = 'Chaves API';
        actionsWrap.appendChild(apiBtn);
      }

      header.appendChild(actionsWrap);
    }

    const toggleBtn = header.querySelector('#sidebarToggleBtn');
    if (toggleBtn) {
      toggleBtn.className = 'lg:hidden p-2 rounded-md text-gray-300 hover:bg-white/10 focus:outline-none';
    }

    const logoEl = header.querySelector('.cu-logo');
    if (logoEl) {
      logoEl.textContent = toolAbbr(displayName);
    }

    const nameEl = header.querySelector('.cu-appname');
    if (nameEl) {
      nameEl.textContent = displayName;
      if (nameEl.tagName === 'A') {
        nameEl.href = 'index.html';
        nameEl.style.textDecoration = 'none';
        nameEl.style.color = 'inherit';
      }
    }

    const chip = header.querySelector('.cu-chip');
    if (chip) {
      chip.textContent = 'CapyUniverse';
      chip.className = 'cu-chip hidden sm:inline-flex';
    }

    const actions = header.querySelector('.cu-header-actions');
    if (actions) {
      actions.className = 'flex items-center gap-2 cu-header-actions';
    }
  }

  function ensureHeaderButtons() {
    const actions = document.querySelector('.cu-header-actions');
    if (!actions) return;

    let homeBtn = actions.querySelector('button[data-cu-action="home"]');
    if (homeBtn) {
      bindHomeButton(homeBtn);
    } else {
      homeBtn = document.createElement('button');
      bindHomeButton(homeBtn);
      actions.insertBefore(homeBtn, actions.firstChild);
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
      if (!apiBtn.dataset.cuBound) {
        apiBtn.addEventListener('click', () => {
          const modal = ensureApiModal();
          modal?.classList.remove('hidden');
        });
        apiBtn.dataset.cuBound = '1';
      }
    }
  }

  function stylizeLayout() {
    const layout = Array.from(document.querySelectorAll('body > div')).find(div => div.querySelector('main') && div.querySelector('#sidebar'));
    if (layout) {
      layout.className = 'flex flex-1 min-h-0';
    }

    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.className = 'sidebar-glass text-gray-300 w-64 space-y-1 p-3 fixed inset-y-0 left-0 transform -translate-x-full lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out z-30 shadow-lg overflow-y-auto pt-4 scrollbar-thin';
    }

    let overlay = document.getElementById('sidebarOverlay');
    if (!overlay && sidebar) {
      overlay = document.createElement('div');
      overlay.id = 'sidebarOverlay';
      overlay.dataset.cuGenerated = '1';
      sidebar.insertAdjacentElement('afterend', overlay);
    }
    if (overlay) {
      overlay.className = 'fixed inset-0 bg-black/60 z-20 hidden lg:hidden';
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

    primaryPanels.forEach((panel) => {
      panel.classList.add('cu-panel');
      panel.classList.remove('glass');
      if (!panel.classList.contains('cu-panel-padded')) {
        panel.classList.add('cu-panel-padded');
        panel.classList.add('p-5', 'sm:p-6', 'lg:p-8');
      }
    });
  }

  function ensureApiModal() {
    const doc = document;
    if (!doc?.body) return null;
    let modal = doc.getElementById('apiKeysModal');
    if (!modal) {
      modal = doc.createElement('div');
      modal.id = 'apiKeysModal';
      modal.dataset.cuGenerated = '1';
      modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 hidden p-4';
      modal.innerHTML = `
        <div class="cu-panel p-6 w-full max-w-md space-y-4">
          <div class="flex items-center justify-between gap-3">
            <h2 id="apiKeysModalTitle" class="text-lg font-semibold">Configurar chave API</h2>
            <button id="closeApiKeysModalButton" type="button" class="cu-iconbtn" aria-label="Fechar modal" data-cu-generated="1">${CLOSE_ICON}</button>
          </div>
          <p class="text-sm text-gray-300 leading-relaxed">Informe sua chave da API Gemini para habilitar todos os recursos das ferramentas CapyUniverse.</p>
          <div class="flex gap-2 flex-col sm:flex-row">
            <input id="geminiApiKeyInputModal" type="password" placeholder="Cole sua chave Gemini" class="cu-input flex-1 sm:rounded-r-none" data-cu-generated="1">
            <button id="saveGeminiKey" type="button" class="cu-btn primary sm:rounded-l-none" data-cu-generated="1">Salvar</button>
          </div>
        </div>`;
      doc.body.appendChild(modal);
    }
    if (modal.dataset.cuGenerated === '1') {
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'apiKeysModalTitle');
    }
    return modal;
  }

  function ensureFabButton() {
    ensureApiModal();
    if (!document.body) return;
    let fab = document.getElementById('fabApi');
    if (!fab) {
      fab = document.createElement('button');
      fab.id = 'fabApi';
      fab.type = 'button';
      fab.textContent = '🔑';
      document.body.appendChild(fab);
    }
    fab.className = 'fixed bottom-4 right-4 cu-btn primary rounded-full p-3 shadow-xl z-50 flex items-center justify-center text-xl';
    fab.title = 'Chaves API';
    fab.setAttribute('aria-label', 'Abrir configurações da chave API');
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
      closeBtn.classList.add('cu-btn');
      closeBtn.type = 'button';
      if (closeBtn.dataset.cuGenerated === '1') {
        closeBtn.classList.add('cu-iconbtn');
        if (!closeBtn.innerHTML.trim()) {
          closeBtn.innerHTML = CLOSE_ICON;
        }
      } else if (!closeBtn.textContent?.trim()) {
        closeBtn.textContent = '✕';
      }
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
    const modal = ensureApiModal();
    if (!modal) return;
    const fab = document.getElementById('fabApi');
    const openBtn = document.getElementById('openApiKeysModalButton');
    const closeBtn = document.getElementById('closeApiKeysModalButton');
    const saveBtn = document.getElementById('saveGeminiKey');
    const showModal = () => modal.classList.remove('hidden');
    const hideModal = () => modal.classList.add('hidden');

    if (fab && !fab.dataset.cuBound) {
      fab.addEventListener('click', showModal);
      fab.dataset.cuBound = '1';
    }
    if (openBtn && !openBtn.dataset.cuBound) {
      openBtn.addEventListener('click', showModal);
      openBtn.dataset.cuBound = '1';
    }
    if (modal && !modal.dataset.cuBound) {
      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) {
          hideModal();
        }
      });
      modal.dataset.cuBound = '1';
    }
    if (closeBtn && !closeBtn.dataset.cuBound) {
      closeBtn.addEventListener('click', hideModal);
      closeBtn.dataset.cuBound = '1';
    }
    if (saveBtn && saveBtn.dataset.cuGenerated === '1' && !saveBtn.dataset.cuBound) {
      saveBtn.addEventListener('click', () => {
        const input = document.getElementById('geminiApiKeyInputModal');
        const value = input?.value?.trim();
        if (!value) return;
        try {
          localStorage.setItem(API_KEY_STORAGE_KEY, value);
          alert('Chave API do Gemini salva!');
        } catch (err) {
          console.warn('cu-app: falha ao salvar chave API', err);
        }
        hideModal();
      });
      saveBtn.dataset.cuBound = '1';
    }
  }

  function normaliseSidebarIconMarkup(tool) {
    if (tool && typeof tool.icon === 'string') {
      return tool.icon
        .replace(/w-10/g, 'w-5')
        .replace(/h-10/g, 'h-5')
        .replace(/mb-2/g, 'mr-2')
        .replace(/text-2xl/g, 'text-base');
    }
    if (tool && typeof tool.iconUrl === 'string') {
      const url = tool.iconUrl;
      return `<img src="${url}" alt="" class="w-5 h-5 object-contain mr-2 opacity-90" loading="lazy">`;
    }
    return '<span class="w-5 h-5 mr-2"></span>';
  }

  async function fetchToolsData() {
    if (!toolsDataPromise) {
      toolsDataPromise = fetch('tools.json', { cache: 'no-store' })
        .then(res => {
          if (!res.ok) {
            throw new Error(`tools.json request failed with ${res.status}`);
          }
          return res.json();
        })
        .catch(err => {
          toolsDataPromise = null;
          throw err;
        });
    }
    return toolsDataPromise;
  }

  function determineToolContext(tools) {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    if (!Array.isArray(tools)) {
      return { path };
    }
    const match = tools.find(tool => {
      const page = (tool?.pageUrl || '').split('/').pop();
      return page === path;
    });
    if (match) {
      return {
        id: match.id || match.title || match.pageUrl,
        displayName: match.title || match.id || deriveToolName(),
        path,
        tool: match,
      };
    }
    return { path };
  }

  async function renderSidebarFromTools() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    try {
      const tools = await fetchToolsData();
      const context = determineToolContext(tools);

      if (context) {
        const headerLabel = context?.tool?.id || context?.id || context?.displayName || deriveToolName();
        ensureBrand(document.querySelector('body > header'), headerLabel);
      }
      if (context?.id && document.body) {
        document.body.dataset.cuToolId = context.id;
      }

      const categories = new Map();
      if (Array.isArray(tools)) {
        tools.forEach(tool => {
          let cats = tool?.category;
          if (!cats || (Array.isArray(cats) && cats.length === 0)) {
            cats = ['Outros'];
          }
          if (!Array.isArray(cats)) {
            cats = [cats];
          }
          cats.filter(Boolean).forEach(cat => {
            if (!categories.has(cat)) {
              categories.set(cat, []);
            }
            categories.get(cat).push(tool);
          });
        });
      }

      sidebar.innerHTML = '';

      const home = document.createElement('a');
      home.href = 'index.html';
      home.className = 'sidebar-link w-full flex items-center space-x-2.5 p-2.5 mb-2 rounded-md text-sm hover:bg-white/10 transition-colors duration-150 text-gray-300';
      home.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-400"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> <span>Página Inicial</span>';
      sidebar.appendChild(home);

      categories.forEach((toolsInCategory, categoryName) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'mb-1';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'w-full flex justify-between items-center p-2.5 text-left text-gray-300 hover:bg-white/10 rounded-md focus:outline-none transition-colors duration-150';
        button.innerHTML = `<span class="font-semibold text-sm">${categoryName}</span><svg class="w-4 h-4 transform transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;

        const content = document.createElement('div');
        content.className = 'category-content pl-3 pt-0.5 space-y-0.5';

        toolsInCategory
          .slice()
          .sort((a, b) => (a?.title || '').localeCompare(b?.title || '', 'pt-BR', { sensitivity: 'base' }))
          .forEach(tool => {
            const link = document.createElement('a');
            link.href = tool?.pageUrl || '#';
            const currentPage = (tool?.pageUrl || '').split('/').pop();
            const isActive = !!currentPage && currentPage === context.path;
            const iconMarkup = normaliseSidebarIconMarkup(tool);
            link.className = `sidebar-link w-full flex items-center space-x-2 py-1.5 px-2 rounded-md text-xs hover:bg-zinc-600/60 hover:text-white transition-colors duration-150 ${isActive ? 'active' : 'text-gray-400'}`;
            link.innerHTML = `${iconMarkup}<span>${tool?.title || tool?.id || tool?.pageUrl || 'Ferramenta'}</span>`;
            content.appendChild(link);
          });

        button.addEventListener('click', () => {
          content.classList.toggle('expanded');
          const icon = button.querySelector('svg');
          if (icon) {
            icon.classList.toggle('rotate-180');
          }
        });

        if (toolsInCategory.some(tool => (tool?.pageUrl || '').split('/').pop() === context.path)) {
          content.classList.add('expanded');
          const icon = button.querySelector('svg');
          if (icon) {
            icon.classList.add('rotate-180');
          }
        }

        wrapper.appendChild(button);
        wrapper.appendChild(content);
        sidebar.appendChild(wrapper);
      });
    } catch (err) {
      console.error('cu-app: sidebar load error', err);
      sidebar.innerHTML = '<p class="text-xs text-red-400 p-2">Erro ao carregar menu.</p>';
    }
  }

  function setupSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    if (!sidebar || !overlay || !toggleBtn) return;

    const toggle = (show) => {
      if (typeof show === 'boolean') {
        if (show) {
          sidebar.classList.remove('-translate-x-full');
          overlay.classList.remove('hidden');
        } else {
          sidebar.classList.add('-translate-x-full');
          overlay.classList.add('hidden');
        }
        return;
      }
      sidebar.classList.toggle('-translate-x-full');
      overlay.classList.toggle('hidden');
    };

    if (!toggleBtn.dataset.cuBound) {
      toggleBtn.addEventListener('click', () => toggle());
      toggleBtn.dataset.cuBound = '1';
    }
    if (!overlay.dataset.cuBound) {
      overlay.addEventListener('click', () => toggle(false));
      overlay.dataset.cuBound = '1';
    }

    toggle(false);
  }

  function highlightSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    const current = window.location.pathname.split('/').pop();
    sidebar.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      if (href === current) {
        link.classList.add('active');
      }
    });
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

  document.addEventListener('DOMContentLoaded', () => {
    if (shouldSkip()) return;
    (async () => {
      try {
        const fallbackName = deriveToolName();
        applyBackground();
        ensureApiModal();
        ensureBrand(document.querySelector('body > header'), fallbackName);
        stylizeLayout();
        ensureFabButton();
        stylizeApiModal();
        attachFabBehaviour();
        await renderSidebarFromTools();
      } catch (err) {
        console.error('cu-app init error:', err);
      } finally {
        ensureHeaderButtons();
        setupSidebarToggle();
        highlightSidebar();
        loadApiKeyIntoModal();
      }
    })();
  });
})();
