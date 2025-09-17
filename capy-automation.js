(function(){
  const LS_SUGGEST_MUTE_KEY = 'capy:automation:mute';
  const CHANNEL = new BroadcastChannel('capyuniverse');
  let toolsIndex = null;

  async function loadTools() {
    if (toolsIndex) return toolsIndex;
    const res = await fetch('tools.json', { cache:'no-store' });
    const list = await res.json();
    toolsIndex = Object.fromEntries(list.map(t => [t.id, t]));
    return toolsIndex;
  }

  function shouldMute(flowId){
    try {
      const data = JSON.parse(localStorage.getItem(LS_SUGGEST_MUTE_KEY) || '{}');
      return !!data[flowId];
    } catch { return false; }
  }
  function mute(flowId){
    try {
      const data = JSON.parse(localStorage.getItem(LS_SUGGEST_MUTE_KEY) || '{}');
      data[flowId] = true;
      localStorage.setItem(LS_SUGGEST_MUTE_KEY, JSON.stringify(data));
    } catch {}
  }

  function createToast(){
    let el = document.getElementById('capyAutomationToast');
    if (el) return el;

    const style = `
      #capyAutomationToast{position:fixed;left:0;right:0;bottom:0;z-index:60;
        padding:12px}
      #capyAutomationToast .sheet{margin:0 auto;max-width:760px;
        background:rgba(24,24,27,.92);backdrop-filter:blur(10px);
        border:1px solid rgba(63,63,70,.5);border-radius:16px;
        box-shadow:0 20px 60px rgba(0,0,0,.45);padding:14px}
      #capyAutomationToast .title{display:flex;align-items:center;gap:10px;
        color:#c7d2fe;font-family:Syne,Inter,sans-serif;font-weight:800;font-size:15px}
      #capyAutomationToast .msg{color:#e5e7eb;font-size:13px;margin-top:6px}
      #capyAutomationToast .apps{display:flex;gap:8px;margin-top:12px;overflow:auto;padding-bottom:4px}
      #capyAutomationToast .card{min-width:160px;flex:0 0 auto;border:1px solid rgba(63,63,70,.6);
        border-radius:12px;background:#0b0d10; padding:10px}
      #capyAutomationToast .card h4{color:#fff;font-size:13px;font-weight:700}
      #capyAutomationToast .card p{color:#9ca3af;font-size:12px;margin-top:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      #capyAutomationToast .card button{margin-top:8px;width:100%;background:#4f46e5;color:#fff;font-weight:700;
        font-size:12px;border-radius:10px;padding:8px}
      #capyAutomationToast .row{display:flex;gap:8px;align-items:center;margin-top:10px;justify-content:space-between}
      #capyAutomationToast .row .muted{font-size:11px;color:#9ca3af;display:flex;gap:8px;align-items:center}
      #capyAutomationToast .ghost{background:#111827;border:1px solid #374151;color:#e5e7eb;padding:8px 10px;border-radius:10px;font-size:12px}
      @media (min-width:768px){
        #capyAutomationToast{padding:16px}
        #capyAutomationToast .sheet{padding:16px}
      }
    `;
    el = document.createElement('div');
    el.id = 'capyAutomationToast';
    el.innerHTML = `<style>${style}</style><div class="sheet"></div>`;
    document.body.appendChild(el);
    return el;
  }

  function colorChip(tool){
    const c = (tool?.color||'indigo-400').split('-')[0];
    const map = {
      indigo:'#6366f1', blue:'#60a5fa', emerald:'#34d399', violet:'#8b5cf6',
      cyan:'#22d3ee', pink:'#f472b6', amber:'#f59e0b', sky:'#38bdf8', purple:'#a78bfa'
    };
    return map[c] || '#6366f1';
  }

  function openTool(pageUrl){
    if (!pageUrl) return;
    window.location.href = pageUrl;
  }

  function showSuggest({title, message, tools, flowId}){
    if (!tools?.length) return;
    if (shouldMute(flowId)) return;

    const host = createToast();
    const sheet = host.querySelector('.sheet');
    sheet.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'title';
    header.innerHTML = `<span style="display:inline-flex;width:10px;height:10px;border-radius:50%;background:#22c55e"></span>
      <strong>${title}</strong>`;
    sheet.appendChild(header);

    const msg = document.createElement('div');
    msg.className = 'msg';
    msg.textContent = message;
    sheet.appendChild(msg);

    const apps = document.createElement('div');
    apps.className = 'apps';
    tools.slice(0,6).forEach(t=>{
      const card = document.createElement('div');
      card.className = 'card';
      const clr = colorChip(t);
      card.innerHTML = `
        <h4 style="color:${clr}">${t.title||t.id}</h4>
        <p>${t.description||'Continue o fluxo com esta ferramenta.'}</p>
        <button style="background:${clr}">Abrir</button>
      `;
      card.querySelector('button').onclick = ()=> openTool(t.pageUrl);
      apps.appendChild(card);
    });
    sheet.appendChild(apps);

    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <div class="muted"><input id="capyMute" type="checkbox" style="accent-color:#6366f1"/> 
        Não sugerir novamente nesta jornada</div>
      <div style="display:flex;gap:8px">
        <button class="ghost" id="capyClose">Fechar</button>
      </div>`;
    sheet.appendChild(row);

    sheet.querySelector('#capyClose').onclick = ()=>{
      if (sheet.querySelector('#capyMute')?.checked) mute(flowId);
      host.remove();
    };
  }

  async function buildSuggestions(payload){
    const idx = await loadTools();
    const current = idx[payload.toolId];
    const category = payload.category || current?.category || payload.fallbackCategory || 'Jurídico';

    // 1) mesmas categoria (exclui atual)
    const all = Object.values(idx);
    const sameCat = all
      .filter(t => (t.category||'').toLowerCase() === category.toLowerCase())
      .filter(t => t.id !== payload.toolId);

    // 2) extras utilitários globais (se existirem)
    const extrasIds = ['CapyDoc','CapyResumo','CapyPDF','CapyPrompt','CapyConciliaFacil','CapyCronosLegal'];
    const extras = extrasIds.map(id => idx[id]).filter(Boolean);

    // 3) rank simples preferencial por categoria
    const flowMap = { 'Juridico': ['CapyResumo','CapyCronosLegal','CapyConciliaFacil','CapyDoc'], 'Jurídico': ['CapyResumo','CapyCronosLegal','CapyConciliaFacil','CapyDoc'] };
    const preferred = (flowMap[category]||[])
      .map(id => idx[id]).filter(Boolean).filter(t => t.id !== payload.toolId);

    // Monta lista final sem duplicados
    const seen = new Set();
    const out = [];
    function pushUnique(t){ if (t && !seen.has(t.id)){ seen.add(t.id); out.push(t); } }
    preferred.forEach(pushUnique);
    sameCat.forEach(pushUnique);
    extras.forEach(pushUnique);

    const title = 'Próximo passo sugerido';
    const message = payload.message || (() => {
      switch(payload.tag){
        case 'analysis_complete': return 'Análise concluída. Quer continuar o fluxo jurídico?';
        case 'draft_ready': return 'Minuta gerada. Deseja controlar prazos ou formalizar acordo?';
        default: return 'Continue sua jornada dentro da categoria.';
      }
    })();

    showSuggest({ title, message, tools: out, flowId: `${payload.toolId}:${payload.tag||'flow'}` });
  }

  // API pública
  const capyAutomation = {
    emitAction(payload){
      // payload: { toolId, tag, category?, message? }
      CHANNEL.postMessage({ type:'capy:action', payload });
      // fallback local (mesma aba)
      buildSuggestions(payload);
    }
  };
  window.capyAutomation = capyAutomation;

  // Cross-tab/iframe
  CHANNEL.onmessage = (ev)=>{
    if(ev?.data?.type === 'capy:action' && ev.data.payload){
      buildSuggestions(ev.data.payload);
    }
  };

})();