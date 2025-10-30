(function(){
  const frame = document.getElementById('capyflowFrame');
  const btnBack = document.getElementById('btnBack');
  const btnSettings = document.getElementById('btnSettings');
  const btnOpenInWindow = document.getElementById('btnOpenInWindow');

  const BUS = {
    send(type, payload = {}) {
      frame?.contentWindow?.postMessage({ source: 'CapyUniverse', type, payload }, '*');
    }
  };

  // Segurança: só atribui handlers se os elementos existirem (botões podem estar comentados)
  if (btnBack) {
    // Voltar: avisa o host e redireciona para a home do CapyUniverse
    btnBack.onclick = () => {
      window.parent?.postMessage({ source: 'CapyFlowEmbed', type: 'close' }, '*');
      window.location.href = '../../index.html';
    };
  }

  if (btnSettings) {
    // Abrir configurações do CapyFlow (no iframe)
    btnSettings.onclick = () => BUS.send('capyuniverse:open-settings');
  }

  if (btnOpenInWindow) {
    // Abrir em nova janela a versão standalone do CapyFlow
    btnOpenInWindow.onclick = () => {
      const url = frame?.getAttribute('src');
      window.open(url && url.replace('?embedded=1', ''), '_blank');
    };
  }

  // Preferências / API Key globais do CapyUniverse
  const apiKey = localStorage.getItem('CAPY_API_KEY') || localStorage.getItem('gemini_api_key') || '';
  const prefs = {
    theme: localStorage.getItem('capy_theme') || 'dark',
    user:  localStorage.getItem('capy_user') || null
  };

  // Funções de overlay para mostrar erro/estado ao usuário
  const OVERLAY_ID = 'capyflow-embed-overlay';
  function createOverlay() {
    let ov = document.getElementById(OVERLAY_ID);
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = OVERLAY_ID;
    Object.assign(ov.style, {
      position: 'fixed',
      inset: '0 0 0 0',
      display: 'none',
      'alignItems': 'center',
      'justifyContent': 'center',
      'backgroundColor': 'rgba(6,6,8,0.6)',
      color: '#fff',
      fontSize: '16px',
      zIndex: 9999,
      padding: '24px',
      textAlign: 'center'
    });
    ov.innerHTML = '<div id="capyflow-embed-overlay-msg" style="max-width:560px">Carregando...</div><div style="margin-top:12px"><button id="capyflow-embed-overlay-retry" style="padding:8px 12px;border-radius:6px;border:none;background:#7c3aed;color:#fff;cursor:pointer">Tentar novamente</button></div>';
    document.body.appendChild(ov);
    const retry = document.getElementById('capyflow-embed-overlay-retry');
    retry?.addEventListener('click', () => {
      hideOverlay();
      if (frame) {
        // reload the iframe
        const cur = frame.getAttribute('src');
        frame.setAttribute('src', cur);
      }
    });
    return ov;
  }
  function showOverlay(msg) {
    const ov = createOverlay();
    const m = document.getElementById('capyflow-embed-overlay-msg');
    if (m) m.textContent = msg;
    ov.style.display = 'flex';
  }
  function hideOverlay() {
    const ov = document.getElementById(OVERLAY_ID);
    if (ov) ov.style.display = 'none';
  }

  // Timeout para detectar falha de carregamento do iframe
  let loadTimer;
  if (frame) {
    loadTimer = setTimeout(() => {
      console.warn('CapyFlow iframe não carregou dentro do tempo esperado (8s)');
      showOverlay('Erro: não foi possível carregar o módulo CapyFlow. Clique em "Tentar novamente" ou veja o console para mais detalhes.');
    }, 8000);
  } else {
    console.warn('Elemento iframe#capyflowFrame não encontrado na página.');
  }

  // Envia init para o CapyFlow quando o iframe carrega
  frame?.addEventListener('load', () => {
    console.info('CapyFlow iframe carregado - enviando init');
    clearTimeout(loadTimer);
    hideOverlay();
    BUS.send('capyuniverse:init', { apiKey, prefs, embedded: true, host: 'CapyUniverse' });
  });

  // Ponte de mensagens vindas do CapyFlow
  window.addEventListener('message', (ev) => {
    const { data } = ev;
    if (!data || typeof data !== 'object') return;
    const { source, type, payload } = data;

    if (source === 'CapyFlow') {
      if (type === 'capyflow:request-api-key') {
        BUS.send('capyuniverse:init', { apiKey, prefs, embedded: true, host: 'CapyUniverse' });
      }
      if (type === 'capyflow:share') {
        window.parent?.postMessage({ source: 'CapyFlowEmbed', type: 'share', payload }, '*');
      }
      if (type === 'capyflow:notify') {
        window.parent?.postMessage({ source: 'CapyFlowEmbed', type: 'notify', payload }, '*');
      }
    }
  }, false);
})();
