
# 🐹 CapyUniverse

Plataforma experimental e modular para **Inteligência Artificial aplicada**, focada em desenvolvimento de ferramentas, automações e experiências web com LLMs, dados e interfaces modernas.

🔗 Demo: https://faelscarpato.github.io/capyuniverse/

---

## 🚀 Visão Geral

CapyUniverse **não é uma ferramenta única** e **não é um produto fechado**.

É um **hub experimental de IA aplicada**, criado para estudar, testar e evoluir:
- integrações com modelos de linguagem (LLMs)
- fluxos de dados simples
- automações orientadas a contexto
- interfaces web para uso real de IA

O projeto funciona como um **laboratório contínuo de engenharia**, onde diferentes ferramentas e experimentos convivem, evoluem ou são substituídos conforme aprendizados técnicos e necessidades reais.

---

## 🎯 Objetivo do Projeto

O objetivo principal do CapyUniverse é **transformar IA em algo utilizável**, indo além de demos isoladas ou notebooks, explorando:

- IA integrada a aplicações web reais
- Fluxos completos: input → processamento → IA → output
- Experimentação com UX para sistemas inteligentes
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
O foco está na **arquitetura e no aprendizado**, não no nome de cada módulo.

---


## 🧱 Arquitetura Conceitual

O projeto segue princípios simples:

- Estrutura **modular**
- Ferramentas independentes, porém reutilizando lógica comum
- Camada de IA desacoplada da interface
- Facilidade para trocar modelos e provedores
- Pipelines simples de processamento de dados

Fluxo típico:

Usuário → Interface Web → Serviço de IA → Processamento → Resposta

📄 Detalhamento técnico em `docs/ARCHITECTURE.md`

---

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript, React, Vite
- **IA:** Gemini API, OpenAI API (via HTTP)
- **Dados:** JSON, estado em memória, pipelines simples
- **Outros:** Git, APIs REST, experimentação local

---

## ▶️ Como Rodar Localmente

```bash
npm install
npm run dev