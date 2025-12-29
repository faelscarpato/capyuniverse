# 🐹 CapyUniverse — Technical Architecture

CapyUniverse is an experimental, modular hub for applied artificial intelligence. Rather than a single product, it is a platform for rapidly building and testing tools and experiences powered by large language models (LLMs), simple data pipelines and modern web interfaces. This document describes how CapyUniverse is organized, how it integrates LLMs, and how data flows through the system.

## ✨ Goals & Principles

CapyUniverse is designed with the following goals:

- Modularity: Each tool ("CapyTool") lives in its own module and can be added or removed without affecting the rest of the system.
- Separation of concerns: UI logic, AI/LLM logic and data handling are isolated into separate layers to simplify development and testing.
- Flexibility: The system supports multiple LLM providers and is built around configurable services rather than hard‑coding a single model or API.
- Ease of experimentation: Developers should be able to spin up new tools quickly, try out prompts and pipelines, and swap out providers as needed.

## 🎯 High‑Level Components

CapyUniverse consists of three principal layers:

- UI Layer – A set of React components (built with Vite) that define the interfaces for each CapyTool. The UI layer handles user interaction, collects inputs and displays responses.
- Service Layer – Responsible for calling LLM APIs and other back‑end services. Each CapyTool uses its own service functions, but they share a common core that wraps HTTP requests to providers such as Gemini and OpenAI.
- Data/State Layer – Manages local state (e.g. conversation context, uploaded files) and simple persistence. Currently, this layer is implemented in memory and via IndexedDB for persistence within the browser.

User → UI (React) → CapyService (LLM) → Processing & Post‑processing → UI Response

##  1. UI Layer

Built with React and Vite for fast iteration and modern tooling.

- Each CapyTool exposes its own interface components — e.g. a chat panel for conversational tools, an upload component for document analysis or OCR, and editors for coding tools.
- Handles input validation and basic pre‑processing (e.g. reading a file into text) before handing off to the service layer.

## 2. Service Layer (LLM & Back‑end Integration)

LLM Clients: CapyUniverse integrates multiple LLM providers. Generic wrappers encapsulate the HTTP calls and handle authentication using environment variables. For example:

GeminiClient calls the Gemini API with user prompts, handles temperature/timeout settings and returns raw responses.

OpenAIClient does the same for OpenAI’s API.

- Context & Prompt Engineering: Before calling an LLM, the service functions build prompts that include relevant context. For conversation tools, the context is maintained in memory (e.g. an array of messages); for document processing, the context includes extracted text or metadata.
- Post‑processing: After receiving the LLM response, the service layer may perform clean‑up (e.g. trimming, extracting code blocks) and then passes structured data back to the UI.
- Key Management: API keys are never hard‑coded. They are loaded from a .env file (see .env.example) at build time, ensuring credentials remain private.

## 3. Data & State Layer

- Local State: The UI uses React state and context providers to track session data such as chat history or open files.
- IndexedDB / Browser Storage: For tools that require persistence across sessions (e.g. saving a draft or caching results), CapyUniverse uses IndexedDB via a small abstraction.
- Future Persistence: The roadmap includes optional integration with a backend or database to store documents, embeddings or conversation logs. Until then, all state remains on the client.

# 🔌 Integrating New CapyTools

A CapyTool is a self‑contained module under the apps/ or tools/ directory. To add a new tool:

- Create a new folder (e.g. apps/CapyMyTool) containing a React component for the UI.
- Implement service functions for your tool under services/ or within the tool folder. Reuse existing LLM wrappers when possible.
- Define a route or navigation link so the tool appears in the CapyUniverse interface.
- Include any pre‑processing or post‑processing needed for your pipeline.
- Document the tool in the README and optionally add docs in /docs.

Because the LLM integration is decoupled, you can switch providers (Gemini, OpenAI, etc.) by adjusting the service functions or configuration.

# 🧠 LLM & Context Management

Working with LLMs requires careful prompt engineering and context management. CapyUniverse uses the following patterns:

- Prompt Templates: Each tool defines its own base prompt (e.g. for summarisation or code generation) stored as a string constant or loaded from JSON. The tool inserts user input and context as variables.
- Conversation Context: Conversational tools maintain an array of messages (role + content) which is passed along with the prompt. This array is reset or trimmed according to the LLM’s token limits.
- Document & Data Context: For document analysis, the text is segmented (if necessary) to meet token limits. Each chunk is processed and summarised separately, then combined.
- Error Handling: Service functions catch errors from the LLM API (network, quota, etc.) and return user‑friendly messages.

  # 📦 Data Pipelines (Examples)

CapyUniverse includes several pipeline patterns:

***Document Summarisation***
- Upload a PDF/Document.
- Extract text via JS libraries (e.g. pdf.js for PDFs).
- Break text into manageable chunks (by sentence or paragraph).
- Call LLM to summarise each chunk.
- Merge chunk summaries and call LLM again to produce a final summary.
- Display the summary to the user.
***Code Analysis***
- User submits code snippet via the IDE.
- Service composes a prompt that instructs the LLM to identify bugs/refactor suggestions.
- LLM returns a suggestion along with patch/annotation.
- UI displays the suggestion and allows the user to apply or ignore changes.
***Prompt Refinement***-
- User enters an initial prompt idea.
- Service calls LLM to improve or extend the prompt using best practices.
- Output is returned as an improved prompt template.
- These pipelines can be combined or modified to fit new tasks. The architecture deliberately avoids heavy server‑side dependencies so that experiments remain easy to run locally.

# 📈 Extensibility & Roadmap

CapyUniverse is a living project. Planned enhancements include:

- Unified router/navigation for switching between CapyTools.
- A persistent database or vector store for embeddings and document retrieval.
- A shared context manager for conversation memory beyond a single session.
- Tests (unit & integration) for service functions and UI components.
- Deployment scripts and containerization for running CapyUniverse in the cloud.


``
Contributions and experiments are welcome. Because the project is designed for learning, modules may come and go; what remains constant is the architecture focused on decoupled UI, services and data pipelines.
``
