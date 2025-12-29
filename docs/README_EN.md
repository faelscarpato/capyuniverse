# 🐹 CapyUniverse

> Experimental and modular platform for **applied artificial intelligence**, focused on building tools, automations and web experiences using LLMs, data and modern interfaces.

🔗 Demo: https://faelscarpato.github.io/capyuniverse/

---

## 🚀 Overview

CapyUniverse is **not a single tool** and **not a closed product**.

It is an **experimental AI hub** created to explore, test and evolve:
- Integrations with large language models (LLMs)
- Simple data and context pipelines
- AI-driven automations
- Real-world web interfaces powered by AI

The project works as a **continuous engineering lab**, where tools and experiments are created, evolved or replaced based on technical learning and real needs.

---

## 🎯 Project Goal

The main goal of CapyUniverse is to **make AI usable in real applications**, going beyond isolated demos or notebooks by focusing on:

- AI embedded into real web applications
- Full application flows: input → processing → AI → output
- UX experimentation for intelligent systems
- Flexible architecture supporting multiple use cases

---

## 🧩 What exists today

CapyUniverse contains **multiple tools and experiments**, which may change over time, including:

- Conversational AI interfaces (not limited to a single chat)
- Content reading, analysis and transformation tools
- AI-assisted development utilities
- Prompt and context experimentation tools
- OCR and text analysis experiments
- Rapid prototyping of LLM-based ideas

👉 Tools are **not fixed** and may be replaced.
The focus is on **architecture and learning**, not on tool names.

---

## 🧱 Conceptual Architecture

The project follows a simple and intentional design:

- Modular structure
- Independent tools sharing common logic
- AI services decoupled from the UI
- Easy model and provider replacement
- Simple data processing pipelines

Typical flow:

User → Web Interface → AI Service → Processing → Response


Detailed documentation is available in `docs/ARCHITECTURE.md`.

---

## 🛠️ Tech Stack

- Frontend: HTML, CSS, JavaScript, React, Vite
- AI: Gemini API, OpenAI API (via HTTP)
- Data: JSON structures, in-memory state, simple pipelines
- Other: Git, REST APIs

---

## ▶️ Running Locally

```bash
npm install
npm run dev
```

Configure environment variables using .env.example.

## 🔐 Environment Variables
```
VITE_GEMINI_API_KEY=
VITE_OPENAI_API_KEY=
```

## 🗺️ Technical Direction

- Consolidation of AI service layer
- Improved context and data flows
- Optional persistence layer
- Stronger validation of AI outputs
- Progressive evolution into a monorepo

## 📜 License

MIT

---
