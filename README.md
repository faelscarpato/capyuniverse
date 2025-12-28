# 🐹 CapyUniverse

Ecossistema modular de ferramentas web com **Inteligência Artificial aplicada a problemas reais**, focado em **produtividade, desenvolvimento, análise de dados e automação**, com arquitetura orientada a agentes.

🔗 **Demo:** https://faelscarpato.github.io/capyuniverse/

---

## 🚀 Visão Geral

CapyUniverse é um **hub de aplicações de IA** que concentra múltiplas ferramentas especializadas (CapyTools), todas construídas para explorar **integração prática de LLMs**, pipelines simples de dados e experiências web modernas.

O projeto funciona como um **laboratório de engenharia de IA aplicada**, onde cada ferramenta resolve um problema específico, mas compartilha princípios comuns de arquitetura, integração com APIs e experimentação contínua.

---

## 🧠 CapyTools Principais (Atual)

### 🧩 **CapyChat**
Chat inteligente com suporte a múltiplos modelos de linguagem.
- Integração com **Gemini API e OpenAI**
- Controle de contexto e prompts
- Base para testes de UX conversacional e agentes

---

### 📄 **CapyDoc / CapyPDF**
Ferramentas de análise e interpretação de documentos.
- Upload e leitura de PDFs e textos
- Extração de informações com IA
- Resumos, insights e respostas baseadas no conteúdo
- Exploração de pipelines simples: documento → processamento → IA → output

---

### 💻 **CapyIDE**
IDE web com assistência de IA para desenvolvimento.
- Geração e correção de código via LLM
- Análise de trechos de código
- Suporte a múltiplas linguagens
- Experimentação de IA como copiloto de desenvolvimento

---

### 🧠 **CapyPrompt**
Ferramenta focada em engenharia de prompts.
- Criação, refinamento e organização de prompts
- Testes rápidos com diferentes modelos
- Apoio ao design de prompts reutilizáveis

---

### 📊 **CapyVersus**
Comparador inteligente com apoio de IA.
- Comparação de produtos, ideias ou conceitos
- Estruturação de critérios e análises
- Uso de IA para síntese e avaliação comparativa

---

### 🧪 **Outras CapyTools**
O ecossistema inclui ferramentas experimentais voltadas a:
- OCR e extração de texto
- Análise visual e de imagens
- Geração de conteúdo
- Dashboards e utilitários baseados em IA

---

## 🧱 Arquitetura Geral

- Estrutura **modular**, onde cada CapyTool funciona de forma independente
- Serviços de IA desacoplados da interface
- Integração via APIs REST
- Facilidade para troca de modelos de IA
- Pipelines simples para processamento e análise de dados

📄 Detalhes técnicos completos em `docs/ARCHITECTURE.md`

---

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript, React, Vite
- **IA:** Gemini API, OpenAI API, LLMs via HTTP
- **Dados:** JSON, estruturas em memória, pipelines simples
- **Outros:** Git, APIs REST, experimentação local

---

## ▶️ Como Rodar Localmente

```bash
npm install
npm run dev