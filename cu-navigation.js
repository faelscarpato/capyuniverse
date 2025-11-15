/* cu-navigation.js - Sistema de Navegação Universal Modal e Componentes Globais */
(() => {
  let navigationHistory = [];
  let currentIndex = -1;
  let modal, iframe, loader, title, closeBtn, backBtn, refreshBtn;
  let apiKeysModal, geminiApiKeyInput, saveApiKeyButton, closeApiKeysModalButton;

  const API_KEY_STORAGE = 'capyUniverseApiKey_gemini';

  function initModals() {
    // Universal Modal (for iframes)
    if (!document.getElementById('universal-modal')) {
      const universalModalHTML = `
        <div id="universal-modal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] p-4 sm:p-8 lg:p-16 hidden">
          <div class="cu-panel w-full h-full flex flex-col overflow-hidden">
            <div class="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/10">
              <div class="flex items-center gap-3">
                <button id="modal-back-btn" class="cu-btn hidden" title="Voltar">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <h2 id="modal-title" class="text-lg font-semibold">Carregando...</h2>
              </div>
              <div class="flex items-center gap-2">
                <button id="modal-refresh-btn" class="cu-btn" title="Recarregar">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8 0 01-15.357-2m15.357 2H15"/></svg>
                </button>
                <button id="modal-close-btn" class="cu-btn">
                  Fechar
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            <div class="flex-grow relative overflow-hidden">
              <iframe id="modal-iframe" class="w-full h-full border-0" src="about:blank"></iframe>
              <div id="modal-loader" class="absolute inset-0 bg-[var(--cu-bg-1)]/90 flex items-center justify-center">
                <div class="flex flex-col items-center gap-4">
                  <div class="loader" style="width: 40px; height: 40px; border-width: 4px;"></div>
                  <p class="text-sm text-[var(--cu-text-dim)]">Carregando página...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', universalModalHTML);
      modal = document.getElementById('universal-modal');
      iframe = document.getElementById('modal-iframe');
      loader = document.getElementById('modal-loader');
      title = document.getElementById('modal-title');
      closeBtn = document.getElementById('modal-close-btn');
      backBtn = document.getElementById('modal-back-btn');
      refreshBtn = document.getElementById('modal-refresh-btn');
    }

    // API Keys Modal
    if (!document.getElementById('manageApiKeysModal')) {
      const apiKeysModalHTML = `
        <div id="manageApiKeysModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[71] p-4 hidden">
            <div class="cu-panel w-full max-w-md">
                <div class="flex justify-between items-center p-4 border-b border-white/10">
                    <h2 class="text-lg font-bold text-purple-400">Gerenciar Chave API</h2>
                    <button id="closeManageApiKeysModalButton" class="cu-btn p-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <div class="p-4 space-y-3">
                    <div class="cu-panel bg-transparent p-3">
                        <h3 class="text-md font-medium text-sky-400 mb-1.5">Google Gemini</h3>
                        <label for="geminiApiKeyInputModal" class="block text-xs font-medium text-gray-300 mb-1">Sua Chave API Gemini:</label>
                        <div class="flex">
                            <input id="geminiApiKeyInputModal" type="password" placeholder="Cole sua chave API aqui" class="cu-input flex-grow rounded-r-none">
                            <button id="saveApiKeyButtonModal" class="cu-btn primary rounded-l-none">Salvar</button>
                        </div>
                        <p class="text-xs text-zinc-400 mt-2">Sua chave é salva localmente no seu navegador.</p>
                    </div>
                </div>
            </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', apiKeysModalHTML);
      apiKeysModal = document.getElementById('manageApiKeysModal');
      geminiApiKeyInput = document.getElementById('geminiApiKeyInputModal');
      saveApiKeyButton = document.getElementById('saveApiKeyButtonModal');
      closeApiKeysModalButton = document.getElementById('closeManageApiKeysModalButton');
    }

    setupEventListeners();
    setupApiKeysModalListeners();
    loadApiKey(); // Load API key on init
  }

  function setupEventListeners() {
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backBtn) backBtn.addEventListener('click', goBack);
    if (refreshBtn) refreshBtn.addEventListener('click', refresh);
    
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (modal && !modal.classList.contains('hidden')) closeModal();
        if (apiKeysModal && !apiKeysModal.classList.contains('hidden')) closeApiKeysModal();
      }
    });

    document.addEventListener('click', function(e) {
      const link = e.target.closest('a');
      if (!link) return;
      
      if (link.closest('.cu-brand') || link.closest('.cu-logo') || link.closest('.cu-appname')) {
        return; 
      }
      
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      
      if (href.startsWith('http') && !href.includes(window.location.hostname)) {
        return; 
      }
      
      if (href.endsWith('.html') || href.includes('.html')) {
        if (window.innerWidth < 1024) { 
          e.preventDefault();
          const linkTitle = link.textContent.trim() || link.title || 'Página';
          openInModal(href, linkTitle);
        }
      }
    });

    // Hamburger menu for mobile
    const hamburgerButton = document.getElementById('hamburger-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');

    if (hamburgerButton && mobileMenu && mobileMenuOverlay) {
      hamburgerButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('translate-x-full');
        mobileMenuOverlay.classList.toggle('opacity-0');
        mobileMenuOverlay.classList.toggle('pointer-events-none');
        document.body.classList.toggle('overflow-hidden');
      });

      mobileMenuOverlay.addEventListener('click', () => {
        mobileMenu.classList.add('translate-x-full');
        mobileMenuOverlay.classList.add('opacity-0', 'pointer-events-none');
        document.body.classList.remove('overflow-hidden');
      });

      // Close mobile menu when a link is clicked inside it
      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.add('translate-x-full');
          mobileMenuOverlay.classList.add('opacity-0', 'pointer-events-none');
          document.body.classList.remove('overflow-hidden');
        });
      });
    }
  }

  function setupApiKeysModalListeners() {
    if (closeApiKeysModalButton) closeApiKeysModalButton.addEventListener('click', closeApiKeysModal);
    if (saveApiKeyButton) saveApiKeyButton.addEventListener('click', saveApiKey);

    // Event listeners for buttons that open the API Keys modal
    document.querySelectorAll('[id^="openManageApiKeyModalButton"]').forEach(button => {
      button.addEventListener('click', openApiKeysModal);
    });
    const fabApi = document.getElementById('fabApi');
    if (fabApi) fabApi.addEventListener('click', openApiKeysModal);
  }

  function openInModal(url, pageTitle = 'Carregando...') {
    if (!modal) initModals(); // Ensure modals are initialized
    
    modal.classList.remove('hidden');
    loader.classList.remove('hidden');
    title.textContent = pageTitle;
    iframe.src = url;
    document.body.style.overflow = 'hidden';
    
    navigationHistory = navigationHistory.slice(0, currentIndex + 1);
    navigationHistory.push({ url, title: pageTitle });
    currentIndex = navigationHistory.length - 1;
    updateBackButton();
    
    iframe.onload = () => {
      loader.classList.add('hidden');
      try {
        const iframeTitle = iframe.contentWindow.document.title;
        if (iframeTitle) {
          title.textContent = iframeTitle;
          navigationHistory[currentIndex].title = iframeTitle;
        }
      } catch (e) {
        // Cross-origin, maintain current title
      }
    };
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    iframe.src = 'about:blank';
    title.textContent = 'Carregando...';
    document.body.style.overflow = '';
    navigationHistory = [];
    currentIndex = -1;
    updateBackButton();
  }

  function goBack() {
    if (currentIndex > 0) {
      currentIndex--;
      const prev = navigationHistory[currentIndex];
      loader.classList.remove('hidden');
      title.textContent = prev.title;
      iframe.src = prev.url;
      updateBackButton();
    }
  }

  function refresh() {
    if (currentIndex >= 0) {
      const current = navigationHistory[currentIndex];
      loader.classList.remove('hidden');
      iframe.src = current.url;
    }
  }

  function updateBackButton() {
    if (!backBtn) return;
    backBtn.classList.toggle('hidden', currentIndex <= 0);
  }

  function openApiKeysModal() {
    if (!apiKeysModal) initModals(); // Ensure modals are initialized
    if (geminiApiKeyInput) geminiApiKeyInput.value = localStorage.getItem(API_KEY_STORAGE) || '';
    apiKeysModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeApiKeysModal() {
    if (!apiKeysModal) return;
    apiKeysModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function saveApiKey() {
    const key = (geminiApiKeyInput.value || '').trim();
    if (key) {
      localStorage.setItem(API_KEY_STORAGE, key);
      alert('Chave API Gemini salva com sucesso!'); // Replace with a proper notification system if available
      closeApiKeysModal();
    } else {
      localStorage.removeItem(API_KEY_STORAGE);
      alert('Chave API Gemini removida.'); // Replace with a proper notification system
      closeApiKeysModal();
    }
  }

  function loadApiKey() {
    // This function is primarily for internal use by the modals themselves
    // Individual tools should retrieve the key directly from localStorage using API_KEY_STORAGE
  }

  // Centralized Sidebar Renderer
  async function renderSidebar(currentPageId = null) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    try {
      const response = await fetch('tools.json');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const toolsData = await response.json();

      const categories = {};
      toolsData.forEach(tool => {
        let toolCategories = tool.category;
        if (typeof toolCategories === 'string') toolCategories = [toolCategories];
        (toolCategories || []).forEach(cat => {
          if (!categories[cat]) categories[cat] = [];
          categories[cat].push(tool);
        });
      });

      sidebar.innerHTML = '';

      // Home link
      const homeLink = document.createElement('a');
      homeLink.href = 'index.html';
      homeLink.className = `sidebar-link w-full flex items-center gap-2 p-2 rounded-md text-sm hover:bg-white/10 transition-colors duration-150 ${currentPageId === 'index' ? 'active' : 'text-cu-text-dim'}`;
      homeLink.innerHTML = `<i class="fas fa-home w-5 text-center text-purple-400"></i><span>Página Inicial</span>`;
      sidebar.appendChild(homeLink);

      for (const categoryName in categories) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'mb-1';
        const categoryButton = document.createElement('button');
        categoryButton.className = 'w-full flex justify-between items-center p-2 text-left text-cu-text-dim hover:text-cu-text hover:bg-white/5 rounded-md';
        categoryButton.innerHTML = `<span class="font-semibold text-sm">${categoryName}</span><i class="fas fa-chevron-down w-4 h-4 transform transition-transform duration-200"></i>`;
        const categoryContent = document.createElement('div');
        categoryContent.className = 'category-content pl-3 pt-1 space-y-1';
        
        categories[categoryName].forEach(tool => {
          const link = document.createElement('a');
          link.href = tool.pageUrl;
          const iconHtml = tool.icon ? tool.icon.replace('w-10 h-10', 'w-5 h-5').replace('mb-2', 'mr-2') : '<span class="w-5 h-5 text-center">✨</span>';
          link.className = `sidebar-link flex items-center gap-2 p-1.5 rounded-md text-xs hover:bg-white/10 transition-colors duration-150 ${tool.id === currentPageId ? 'active' : 'text-cu-text-dim'}`;
          link.innerHTML = iconHtml + `<span>${tool.title}</span>`;
          categoryContent.appendChild(link);
        });

        categoryButton.addEventListener('click', () => {
          categoryContent.classList.toggle('expanded');
          categoryButton.querySelector('i').classList.toggle('rotate-180');
        });
        
        if (categories[categoryName].some(tool => tool.id === currentPageId)) {
          categoryContent.classList.add('expanded');
          categoryButton.querySelector('i').classList.add('rotate-180');
        }

        categoryDiv.appendChild(categoryButton);
        categoryDiv.appendChild(categoryContent);
        sidebar.appendChild(categoryDiv);
      }
    } catch (error) {
      console.error("Erro ao carregar ferramentas para a sidebar:", error);
      if(sidebar) sidebar.innerHTML = '<p class="text-xs text-red-400 p-2">Erro ao carregar menu.</p>';
    }
  }

  // Public API
  window.CU_NAVIGATION = {
    openInModal,
    closeModal,
    openApiKeysModal,
    closeApiKeysModal,
    renderSidebar,
    init: initModals // Renamed for clarity
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModals);
  } else {
    initModals();
  }

  // Also render sidebar on DOMContentLoaded if a sidebar element exists
  document.addEventListener('DOMContentLoaded', () => {
    const sidebarElement = document.getElementById('sidebar');
    if (sidebarElement) {
      // currentPageId should be set by individual pages if they want a specific item highlighted
      const currentPageId = sidebarElement.dataset.currentPageId || null; 
      window.CU_NAVIGATION.renderSidebar(currentPageId);

      // Setup sidebar toggle for mobile
      const hamburgerButton = document.getElementById('hamburger-button');
      const mobileMenu = document.getElementById('mobile-menu');
      const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');

      if (hamburgerButton && mobileMenu && mobileMenuOverlay) {
        hamburgerButton.addEventListener('click', () => {
          mobileMenu.classList.toggle('translate-x-full');
          mobileMenuOverlay.classList.toggle('opacity-0');
          mobileMenuOverlay.classList.toggle('pointer-events-none');
          document.body.classList.toggle('overflow-hidden');
        });

        mobileMenuOverlay.addEventListener('click', () => {
          mobileMenu.classList.add('translate-x-full');
          mobileMenuOverlay.classList.add('opacity-0', 'pointer-events-none');
          document.body.classList.remove('overflow-hidden');
        });

        mobileMenu.querySelectorAll('a').forEach(link => {
          link.addEventListener('click', () => {
            mobileMenu.classList.add('translate-x-full');
            mobileMenuOverlay.classList.add('opacity-0', 'pointer-events-none');
            document.body.classList.remove('overflow-hidden');
          });
        });
      }
    }
  });
})();
