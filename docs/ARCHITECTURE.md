# 🧱 CapyUniverse — Technical Architecture

CapyUniverse is an experimental and modular platform focused on **applied artificial intelligence**.
Rather than a single product, it operates as a **hub for building, testing and evolving AI-powered web tools** using LLMs, simple data pipelines and modern front-end architectures.

This document describes the technical foundations of the project.

---

## 🎯 Architectural Goals

- Enable fast experimentation with LLM-based features
- Keep AI services decoupled from the user interface
- Support multiple AI providers with minimal changes
- Favor clarity, simplicity and evolvability over premature complexity
- Treat AI as part of the application flow, not a side feature

---

## 🧩 High-Level Architecture

CapyUniverse follows a **modular, layered architecture**:

User
↓
Web Interface (UI)
↓
Application Logic
↓
AI Services Layer
↓
LLM Providers


Each layer has a clear responsibility and minimal coupling.

---

## 🖥️ 1. Interface Layer (UI)

- Built with HTML, CSS, JavaScript, React and Vite
- Responsible only for user interaction and presentation
- No direct knowledge of LLM providers or API details
- Communicates with the application layer via well-defined functions

This separation allows UI changes without impacting AI logic.

---

## ⚙️ 2. Application Logic Layer

- Orchestrates user actions and application state
- Prepares inputs for AI services
- Handles validation, formatting and basic transformations
- Manages context and conversation state when applicable

This layer acts as the **brain of the application flow**.

---

## 🧠 3. AI Services Layer

The AI layer is designed to be **provider-agnostic**.

Responsibilities:
- Centralize prompt construction
- Control context size and structure
- Normalize responses from different LLMs
- Isolate API-specific logic

Typical responsibilities include:
- Prompt templates
- Context injection
- Token and response handling
- Error normalization

---

## 🔌 4. LLM Providers

Currently supported through HTTP APIs:
- Gemini API
- OpenAI API

The architecture allows:
- Switching providers without rewriting the UI
- Running A/B experiments with different models
- Extending to new providers with minimal effort

---

## 🔄 Data & Context Pipelines

CapyUniverse uses **simple but explicit pipelines**.

Typical flow:

Input
→ Pre-processing
→ Context assembly
→ Prompt execution
→ Post-processing
→ Output


Key characteristics:
- JSON-based structures
- Stateless by default
- Context built per request
- Optional short-term memory per tool

This approach keeps behavior predictable and debuggable.

---

## 🧪 Experimentation Philosophy

CapyUniverse is intentionally built to support:
- Disposable experiments
- Rapid iteration
- Replacement of tools over time

Not all tools are meant to be permanent.
The architecture prioritizes **learning and evolution**.

---

## 🚀 Future Directions

- Shared context manager across tools
- Optional persistence layer
- Stronger validation of AI outputs
- Automated testing for AI services
- Gradual evolution into a monorepo

---

## 📌 Summary

CapyUniverse treats AI as **a first-class architectural concern**.
The system is designed to be simple, modular and adaptable, allowing continuous exploration of how LLMs can power real web applications.
