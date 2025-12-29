# 🐹 CapyUniverse

<img width="1366" height="708" alt="CapyUniverse Hero" src="https://github.com/user-attachments/assets/68894afd-07c5-4866-82db-594502ffe948" />

> Plataforma experimental e modular para **Inteligência Artificial aplicada**, focada no desenvolvimento de ferramentas, automações e experiências web utilizando LLMs, dados e interfaces modernas.

🔗 **Demo:** https://faelscarpato.github.io/capyuniverse/
🔗 **Eng** https://github.com/faelscarpato/capyuniverse/docs/README_EN.md

---

## 🚀 Visão Geral

CapyUniverse **não é uma ferramenta única** e **não é um produto fechado**.

É um **hub experimental de IA aplicada**, criado para estudar, testar e evoluir soluções que envolvem:

- Integração com modelos de linguagem (LLMs)
- Fluxos simples de dados e contexto
- Automações orientadas a uso real
- Interfaces web para interação prática com IA

O projeto funciona como um **laboratório contínuo de engenharia**, onde ferramentas e experimentos surgem, evoluem ou são descartados conforme aprendizados técnicos e necessidades reais.

---

## 🎯 Objetivo do Projeto

O objetivo do CapyUniverse é **transformar IA em algo utilizável**, indo além de demos isoladas ou notebooks, explorando:

- IA integrada a aplicações web reais
- Fluxos completos: **input → processamento → IA → output**
- Experimentação de UX para sistemas inteligentes
- Arquitetura flexível para múltiplos casos de uso

---

## 🧩 O que existe hoje no CapyUniverse

O ecossistema é composto por **múltiplas ferramentas e experimentos**, que podem variar ao longo do tempo, incluindo:

- Interfaces conversacionais com IA (não limitadas a um único chat)
- Ferramentas de leitura, análise e transformação de conteúdo
- Ambientes de apoio ao desenvolvimento com IA
- Utilitários para experimentação de prompts e contexto
- Experimentos com OCR, análise de texto e dados
- Prototipação rápida de ideias baseadas em LLMs

👉 As ferramentas **não são fixas**, nem todas estão sempre ativas.  
O foco está na **arquitetura, experimentação e aprendizado**, não no nome de cada módulo.

---

## 🧱 Arquitetura Conceitual

O projeto segue princípios simples e intencionais:

- Estrutura **modular**
- Ferramentas independentes reutilizando lógica comum
- Camada de IA desacoplada da interface
- Facilidade para trocar modelos e provedores
- Pipelines simples de processamento de dados

**Fluxo típico:**

Usuário → Interface Web → Serviço de IA → Processamento → Resposta


📄 Detalhamento técnico em `docs/ARCHITECTURE.md`

---

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript, React, Vite
- **IA:** Gemini API, OpenAI API (via HTTP)
- **Dados:** JSON, estado em memória, pipelines simples
- **Outros:** Git, APIs REST, experimentação local

---

## 🖼️ Capturas de Tela

<img width="410" height="231" alt="CapyUniverse Screenshot 1" src="https://github.com/user-attachments/assets/23383370-37b6-4be9-9ed9-5e531629fde5" />
<img width="410" height="231" alt="CapyUniverse Screenshot 2" src="https://github.com/user-attachments/assets/7f61d300-daa5-4729-9302-ee99d4345f66" />

---

## ▶️ Como Rodar Localmente

```bash
npm install
npm run dev
```
---

Configure as variáveis de ambiente usando .env.example.

## 🔐 Variáveis de Ambiente
```
VITE_GEMINI_API_KEY=
VITE_OPENAI_API_KEY=
```

## 🗺️ Direção Técnica (Roadmap Aberto)

- Consolidação da camada de serviços de IA
- Melhoria dos fluxos de dados e gerenciamento de contexto
- Organização do projeto como hub / monorepo
- Integração opcional com persistência de dados
- Testes e validações dos serviços de IA

## 📜 Licença

MIT

---
