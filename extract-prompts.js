// extract-prompts.js
// Node 18+ sem deps externas
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = __dirname;

// Padrões de prompt comuns no seu ecossistema (expandível):
const REGEXES = [
  // const systemPrompt = ` ... `
  /const\s+(?:systemPrompt|promptBase|basePrompt|prompt)\s*=\s*`([\s\S]*?)`/g,
  // const systemPrompt = " ... "
  /const\s+(?:systemPrompt|promptBase|basePrompt|prompt)\s*=\s*"([^"]*?)"/g,
  /const\s+(?:systemPrompt|promptBase|basePrompt|prompt)\s*=\s*'([^']*?)'/g,

  // role: "system", content: ` ... `
  /role\s*:\s*["']system["']\s*,\s*content\s*:\s*`([\s\S]*?)`/g,
  /role\s*:\s*["']system["']\s*,\s*content\s*:\s*"([^"]*?)"/g,
  /role\s*:\s*["']system["']\s*,\s*content\s*:\s*'([^']*?)'/g,

  // chaves "prompt": "..." em objetos/JSON inline
  /["']prompt["']\s*:\s*`([\s\S]*?)`/g,
  /["']prompt["']\s*:\s*"([^"]*?)"/g,
  /["']prompt["']\s*:\s*'([^']*?)'/g,

  // Comentários estilo <!-- PROMPT: ... -->
  /<!--\s*PROMPT\s*:\s*([\s\S]*?)\s*-->/g,

  // Fallback heurístico: blocos longos iniciando com "Você é a IA" (pt-BR)
  /(Você\s+é\s+a?\s*IA[\s\S]{50,2000}?)(?:["'`]|<\/|$)/g,
];

const SHOULD_SCAN = (file) => {
  const lc = file.toLowerCase();
  if (lc.endsWith(".html") || lc.endsWith(".js") || lc.endsWith(".json")) {
    if (lc.endsWith("tools.json")) return true;
    if (lc.includes("capy") || lc.includes("capy")) return true;
    // pega também arquivos gerais onde prompts possam morar
    return true;
  }
  return false;
};

function walk(dir) {
  const out = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      // pula node_modules e pastas grandes irrelevantes
      if (item.name === "node_modules" || item.name === ".git") continue;
      out.push(...walk(full));
    } else {
      if (SHOULD_SCAN(full)) out.push(full);
    }
  }
  return out;
}

function dedupe(arr) {
  const set = new Set(arr.map((s) => s.trim()));
  return Array.from(set).filter(Boolean);
}

function extractFromText(txt) {
  const found = [];
  for (const rx of REGEXES) {
    let m;
    while ((m = rx.exec(txt)) !== null) {
      // grupo 1 é o bloco capturado
      const raw = (m[1] ?? "").toString();
      // normaliza quebras e espaços
      const norm = raw
        .replace(/\r/g, "")
        .replace(/\t/g, "  ")
        .replace(/[ ]{3,}/g, "  ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      if (norm) found.push(norm);
    }
  }
  return dedupe(found);
}

function maybeParseToolsJSON(p) {
  try {
    const txt = fs.readFileSync(p, "utf8");
    const data = JSON.parse(txt);
    // tenta campos comuns: tools[].prompt, tools[].systemPrompt etc.
    const prompts = [];
    const dive = (obj) => {
      if (!obj || typeof obj !== "object") return;
      for (const [k, v] of Object.entries(obj)) {
        if (/(^|_)prompt$/i.test(k) && typeof v === "string") {
          prompts.push(v.trim());
        } else if (typeof v === "object") {
          dive(v);
        }
      }
    };
    dive(data);
    return dedupe(prompts);
  } catch (e) {
    return [];
  }
}

function run() {
  const files = walk(ROOT);
  const result = {};
  for (const file of files) {
    try {
      if (file.toLowerCase().endsWith("tools.json")) {
        const prompts = maybeParseToolsJSON(file);
        if (prompts.length) {
          result[path.relative(ROOT, file)] = { prompts };
        }
        continue;
      }
      const txt = fs.readFileSync(file, "utf8");
      const prompts = extractFromText(txt);
      if (prompts.length) {
        result[path.relative(ROOT, file)] = { prompts };
      }
    } catch {
      // ignora binários/imagens etc.
    }
  }

  // Ordena por chave pra ficar estável
  const sorted = Object.fromEntries(Object.entries(result).sort());
  fs.writeFileSync(
    path.join(ROOT, "prompts.json"),
    JSON.stringify(sorted, null, 2),
    "utf8"
  );

  // opcional: CSV simples
  const rows = [["file", "prompt"].join(",")];
  for (const [file, { prompts }] of Object.entries(sorted)) {
    for (const p of prompts) {
      const safe = '"' + p.replace(/"/g, '""') + '"';
      rows.push([file, safe].join(","));
    }
  }
  fs.writeFileSync(path.join(ROOT, "prompts.csv"), rows.join("\n"), "utf8");

  console.log(`✔ Extração concluída. Gerados: prompts.json e prompts.csv`);
}

run();
