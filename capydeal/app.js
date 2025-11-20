// CapyDeal — front-end simples em JS puro
// Usa a Gemini API 2.5 Flash com Google Search + Google Maps via REST.
// Nada é enviado para servidor próprio: tudo fica no navegador.

const form = document.getElementById("search-form");
const loadingEl = document.getElementById("loading");
const resultsEl = document.getElementById("results");
const answerEl = document.getElementById("ai-answer");
const sourcesListEl = document.getElementById("sources-list");
const statusEl = document.getElementById("status-indicator");
const btnRun = document.getElementById("btn-run");
const btnClear = document.getElementById("btn-clear");

function setStatus(mode, message) {
  statusEl.textContent = message;
  statusEl.classList.remove("status-idle", "status-running", "status-error");
  if (mode === "running") statusEl.classList.add("status-running");
  else if (mode === "error") statusEl.classList.add("status-error");
}

function resetUI() {
  loadingEl.classList.add("hidden");
  resultsEl.classList.add("hidden");
  answerEl.innerHTML = "";
  sourcesListEl.innerHTML = "";
  setStatus("idle", "Aguardando consulta...");
}

btnClear.addEventListener("click", () => {
  form.reset();
  resetUI();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const apiKey = document.getElementById("api-key").value.trim();
  const product = document.getElementById("product").value.trim();
  const compare = document.getElementById("compare").value.trim();
  const budget = document.getElementById("budget").value.trim();
  const location = document.getElementById("location").value.trim();
  const wantCoupons = document.getElementById("want-coupons").checked;
  const onlyNearby = document.getElementById("only-nearby").checked;
  const imageInput = document.getElementById("image");

  if (!apiKey) {
    alert("Cole sua GEMINI_API_KEY para usar a CapyDeal.");
    return;
  }
  if (!product) {
    alert("Descreva o produto ou categoria que você quer encontrar.");
    return;
  }

  resetUI();
  loadingEl.classList.remove("hidden");
  resultsEl.classList.remove("hidden");
  setStatus("running", "Consultando Gemini 2.5 Flash com Google Search/Maps...");
  btnRun.disabled = true;

  try {
    let imagePart = null;
    if (imageInput.files && imageInput.files[0]) {
      const file = imageInput.files[0];
      const base64 = await fileToBase64(file);
      imagePart = {
        inlineData: {
          data: base64.split(",")[1],
          mimeType: file.type,
        },
      };
    }

    const userPrompt = buildPrompt({
      product,
      compare,
      budget,
      location,
      wantCoupons,
      onlyNearby,
    });

    const parts = [{ text: userPrompt }];
    if (imagePart) {
      parts.push(imagePart);
    }

    // Se tiver geolocalização real via navegador, usamos para Maps
    const latLng = await getBrowserLocation();

    const body = {
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      tools: [
        { google_search: {} }, // Busca de preços / produtos
        { googleMaps: {} }, // Lojas próximas, quando fizer sentido
      ],
    };

    if (latLng || location) {
      body.toolConfig = {
        retrievalConfig: {
          latLng: latLng || undefined,
        },
      };
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        "Erro da API Gemini: " + response.status + " — " + errorText
      );
    }

    const data = await response.json();
    renderResponse(data);
  } catch (err) {
    console.error(err);
    answerEl.innerHTML =
      "<p>⚠️ Não consegui completar a busca.</p><p><small>" +
      (err.message || err) +
      "</small></p>";
    setStatus("error", "Erro na consulta. Veja o console para detalhes.");
  } finally {
    loadingEl.classList.add("hidden");
    btnRun.disabled = false;
  }
});

function buildPrompt(opts) {
  const { product, compare, budget, location, wantCoupons, onlyNearby } = opts;

  let prompt = `Você é a CapyDeal, agente especialista em busca de preços, comparação de produtos e caça a cupons.
Use obrigatoriamente as ferramentas Google Search e Google Maps quando forem úteis para trazer dados atualizados de preços, lojas e localização.
Sempre responda em português do Brasil e em formato Markdown, organizado nas seções:

1. **Resumo rápido**
2. **Sugestões de produtos (tabela ou lista)**
3. **Lojas, frete e prazo estimado**
4. **Comparação** (se houver produto para comparar)
5. **Cupons e promoções encontradas**
6. **Observações e cuidados (segurança ao comprar, links suspeitos etc.)**

Regras:
- Sempre priorize resultados para o Brasil, preços em R$.
- Liste para cada produto: nome, faixa de preço, principais vantagens, 1–3 links confiáveis.
- Quando possível, traga ao menos 3 opções em faixas de preço diferentes (mais barato, intermediário, mais completo).
- Se usar cupons, deixe claro em que loja eles funcionam e se são genéricos (NOVO10, PRIME, etc.).
- Se não encontrar cupons relevantes, explique isso e sugira estratégias (monitorar preços, usar histórico, etc.).
- Quando a consulta tiver localização ou puder usar lojas próximas, combine Google Search + Google Maps para sugerir lojas com retirada no local ou frete mais rápido.
- Seja objetivo, mas visualmente organizado (tabelas, listas e subtítulos).

Dados do usuário:
- Produto principal desejado: ${product}.`;

  if (compare) {
    prompt += `
- Produto para comparação: ${compare}.`;
  }

  if (budget) {
    prompt += `
- Orçamento máximo aproximado: R$ ${budget}.`;
  }

  if (location) {
    prompt += `
- Localização informada (CEP/cidade/bairro): ${location}.`;
  }

  prompt += `
- Priorizar lojas próximas: ${onlyNearby ? "SIM" : "NÃO"}.
- Buscar cupons automaticamente: ${wantCoupons ? "SIM" : "NÃO"}.
- Importante: sempre que listar links, coloque o nome da loja + URL completa.`;

  return prompt;
}

function renderResponse(data) {
  // Extrai texto principal
  const candidate = data.candidates && data.candidates[0];
  const parts =
    candidate && candidate.content && candidate.content.parts
      ? candidate.content.parts
      : [];
  const text = parts
    .filter((p) => p.text)
    .map((p) => p.text)
    .join("\n\n");

  answerEl.innerHTML = markdownToHtml(text || "Nenhum texto retornado.");
  setStatus("idle", "Consulta concluída.");
  resultsEl.classList.remove("hidden");

  // Fontes (groundingMetadata)
  sourcesListEl.innerHTML = "";
  const grounding =
    candidate && candidate.groundingMetadata
      ? candidate.groundingMetadata
      : null;

  if (grounding && grounding.groundingChunks && grounding.groundingChunks.length) {
    const added = new Set();
    grounding.groundingChunks.forEach((chunk) => {
      if (chunk.web && chunk.web.uri) {
        const key = chunk.web.uri;
        if (added.has(key)) return;
        added.add(key);
        addSourceItem(chunk.web.title || "Fonte web", chunk.web.uri);
      } else if (chunk.maps && chunk.maps.uri) {
        const key = chunk.maps.uri;
        if (added.has(key)) return;
        added.add(key);
        addSourceItem(chunk.maps.title || "Lugar no Google Maps", chunk.maps.uri);
      }
    });
  } else {
    const li = document.createElement("li");
    li.textContent =
      "Nenhuma fonte explícita retornada pela API (pode ser conhecimento interno do modelo).";
    sourcesListEl.appendChild(li);
  }
}

function addSourceItem(title, url) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.textContent = title + " — " + url;
  li.appendChild(a);
  sourcesListEl.appendChild(li);
}

// Utilitário: geolocalização básica do navegador (opcional)
function getBrowserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => resolve(null),
      { timeout: 7000 }
    );
  });
}

// Utilitário: arquivo para base64 (para imagem do produto)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Conversor Markdown bem simples (suporta só o básico para não depender de libs externas)
// Conversor Markdown simplificado → HTML
function markdownToHtml(markdown) {
  if (!markdown) return "";

  // Normaliza quebras de linha
  let src = markdown.replace(/\r\n/g, "\n");

  // Escapa HTML bruto do modelo
  src = src
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = src.split("\n");

  let html = "";
  let inParagraph = false;
  let inUL = false;
  let inOL = false;
  let inTable = false;
  let tableRows = [];

  const closeParagraph = () => {
    if (inParagraph) {
      html += "</p>";
      inParagraph = false;
    }
  };

  const closeLists = () => {
    if (inUL) {
      html += "</ul>";
      inUL = false;
    }
    if (inOL) {
      html += "</ol>";
      inOL = false;
    }
  };

  const flushTable = () => {
    if (!inTable || tableRows.length === 0) return;
    html += "<table class=\"md-table\"><tbody>";
    tableRows.forEach((row, idx) => {
      const cells = row
        // remove colchetes opcionais tipo [ Produto | ... ]
        .replace(/^\[/, "")
        .replace(/\]$/, "")
        .split("|")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      if (cells.length === 0) return;

      if (idx === 0) {
        // primeira linha como cabeçalho
        html += "<tr>" + cells.map((c) => "<th>" + applyInline(c) + "</th>").join("") + "</tr>";
      } else {
        html += "<tr>" + cells.map((c) => "<td>" + applyInline(c) + "</td>").join("") + "</tr>";
      }
    });
    html += "</tbody></table>";
    inTable = false;
    tableRows = [];
  };

  function applyInline(text) {
    // negrito **texto**
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // itálico *texto*
    text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
    return text;
  }

  for (let rawLine of lines) {
    const line = rawLine.trim();

    // linha vazia = fecha parágrafo/listas/tabela
    if (line === "") {
      closeParagraph();
      closeLists();
      flushTable();
      continue;
    }

    // Tabela tipo: Produto | Preço | ...
    if (line.includes("|")) {
      closeParagraph();
      closeLists();
      inTable = true;
      tableRows.push(line);
      continue;
    } else if (inTable) {
      // acabou a tabela
      flushTable();
    }

    // Títulos estilo markdown # ## ###
    let m = line.match(/^#{1,6}\s+(.+)$/);
    if (m) {
      closeParagraph();
      closeLists();
      const level = Math.min(3, m[0].match(/^#+/)[0].length); // limita em h3 pra não virar carnaval
      html += `<h${level}>${applyInline(m[1])}</h${level}>`;
      continue;
    }

    // Listas não ordenadas: "- item" ou "* item"
    m = line.match(/^[-*]\s+(.+)/);
    if (m) {
      closeParagraph();
      if (!inUL) {
        closeLists();
        html += "<ul>";
        inUL = true;
      }
      html += "<li>" + applyInline(m[1]) + "</li>";
      continue;
    }

    // Listas ordenadas: "1. item"
    m = line.match(/^\d+\.\s+(.+)/);
    if (m) {
      closeParagraph();
      if (!inOL) {
        closeLists();
        html += "<ol>";
        inOL = true;
      }
      html += "<li>" + applyInline(m[1]) + "</li>";
      continue;
    }

    // Se não é lista nem título → parágrafo normal
    closeLists();
    if (!inParagraph) {
      html += "<p>";
      inParagraph = true;
    } else {
      html += "<br>";
    }
    html += applyInline(line);
  }

  // fecha estruturas abertas
  closeParagraph();
  closeLists();
  flushTable();

  return html;
}
