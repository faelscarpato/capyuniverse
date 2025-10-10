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

  //function createLogoEl(abbr) {
    //const span = document.createElement('span');
    //span.className = 'cu-logo';
   // span.textContent = abbr;
    //return span;
 // }

  function ensureBrand(header, name) {
    if (!header) return;
    header.classList.add('cu-header');

    const headerChildren = Array.from(header.children);
    let brandWrap = header.querySelector('.cu-brand');
    if (!brandWrap) {
      brandWrap = headerChildren.find(child => child.querySelector?.('#sidebarToggleBtn')) || headerChildren[0];
      if (brandWrap) {
        brandWrap.classList.add('cu-brand');
      }
    } else {
      brandWrap.classList.add('cu-brand');
    }

    const toggleBtn = header.querySelector('#sidebarToggleBtn');
    if (toggleBtn) {
      toggleBtn.className = 'lg:hidden p-2 rounded-md text-gray-300 hover:bg-white/10 focus:outline-none';
    }

    if (brandWrap) {
      let info = brandWrap.querySelector('.cu-brand-info');
      if (!info) {
        info = document.createElement('div');
        info.className = 'flex items-center gap-2 cu-brand-info';
        const toMove = Array.from(brandWrap.childNodes).filter(node => {
          if (node === toggleBtn) return false;
          if (node === info) return false;
          return true;
        });
        toMove.forEach(node => info.appendChild(node));
        brandWrap.appendChild(info);
      }

      if (!info.querySelector('.cu-logo')) {
        info.insertBefore(createLogoEl(toolAbbr(name)), info.firstChild);
      }

      let brandNameEl = info.querySelector('.cu-appname');
      if (!brandNameEl) {
        brandNameEl = info.querySelector('a, span, strong, h1');
        if (!brandNameEl) {
          brandNameEl = document.createElement('span');
          info.appendChild(brandNameEl);
        }
      }
      brandNameEl.textContent = name;
      brandNameEl.classList.add('cu-appname', 'text-xl');
      if (brandNameEl.tagName === 'A') {
        brandNameEl.href = 'index.html';
        brandNameEl.style.textDecoration = 'none';
        brandNameEl.style.color = 'inherit';
      }

      let chip = info.querySelector('.cu-chip');
      if (!chip) {
        chip = document.createElement('span');
        info.appendChild(chip);
      }
      chip.textContent = 'CapyUniverse';
      chip.className = 'cu-chip hidden sm:inline-flex';
    }

    const actions = headerChildren.find(child => child !== brandWrap) || headerChildren[1];
    if (actions) {
      actions.className = 'flex items-center gap-2 cu-header-actions';
    }
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
    if (fab && openBtn) {
      if (!fab.dataset.cuBound) {
        fab.addEventListener('click', () => {
          modal.classList.remove('hidden');
        });
        fab.dataset.cuBound = '1';
      }
    }
    if (modal && !modal.dataset.cuBound) {
      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) {
          modal.classList.add('hidden');
        }
      });
      modal.dataset.cuBound = '1';
    }
    if (closeBtn && !closeBtn.dataset.cuBound) {
      closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
      closeBtn.dataset.cuBound = '1';
    }
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
    try {
      const toolName = deriveToolName();
      applyBackground();
      ensureBrand(document.querySelector('body > header'), toolName);
      ensureHeaderButtons();
      stylizeLayout();
      ensureFabButton();
      stylizeApiModal();
      attachFabBehaviour();
      highlightSidebar();
      loadApiKeyIntoModal();
    } catch (err) {
      console.error('cu-app init error:', err);
    }
  });
})();
