# 🪐 MarkUpdraft

> A dual-pane web workspace that transforms raw or messy Markdown into highly visual, structured, and modern documents using real-time, AI-assisted modifications powered by Google Gemini.

MarkUpdraft is built as a monorepo setup consisting of a React + Vite client and a secure Express server proxy.

---

## ✨ Features at a Glance

* **Horizontal Control Center:** Access all enhancement settings, preset loading, file uploading, and transform triggers from a clean, unified top bar.
* **Streamed AI Transformations:** 
  * **Original (Hybrid Smooth):** Formats raw Markdown structures (spacing, tables, lists) locally via Prettier and runs grammatical smoothing via Gemini.
  * **Summarize:** Condenses paragraphs and prose into clean bullet lists while keeping titles, sub-headers, and tables intact.
  * **Expand:** Logically elaborates on rough notes, filling in context while maintaining structural hierarchy.
* **Before/After Compare Tab:** Quickly toggle between the **Original** pre-transformed draft and your live **Preview** output.
* **Document Explorer Tabs:** Inspect enhanced drafts in **Preview**, **HTML**, or **Raw Markdown** modes with one-click copy utilities.
* **Local File Loader:** Load local `.md` documents directly into the editor.
* **Independent Scrolling & Bounded Panes:** Dual split-pane view with dedicated scrolling areas to keep the interface compact on any viewport size.
* **Beautiful Dark Mode:** Full class-based dark mode implementation togglable with a single click.

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite + TypeScript)
* **Styling:** Tailwind CSS with `@tailwindcss/typography` (for Notion-like prose rendering)
* **Backend:** Node.js + Express (secure API gateway)
* **AI Engine:** Official `@google/genai` SDK (using `gemini-2.5-flash`)
* **Streaming Protocol:** Server-Sent Events (SSE) with robust network-buffered JSON chunk parsing

---

## 📋 Prerequisites

Before setting up, ensure you have the following installed:
* **Node.js** (v18 or higher)
* **pnpm** (preferred package manager)

You will also need a **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).

---

## ⚙️ Configuration

To protect your API credentials, all Gemini API calls route securely through the Express backend.

1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Copy the `.env.example` file to create your local `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `server/.env` and update the variables:
   ```env
   GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
   PORT=3001
   ```
   > ⚠️ **Important:** Keep `PORT=3001` as the client is pre-configured to communicate with the proxy on this port.

---

## 🚀 Getting Started

### 1. Install Dependencies
From the workspace root directory, install packages for both the client and server:
```bash
pnpm install-all
```

### 2. Run the Application
Start the development server and Vite client concurrently:
```bash
pnpm dev
```

This launches:
* 🌐 **Vite Client:** [http://localhost:5173](http://localhost:5173)
* 🔌 **Express Backend:** [http://localhost:3001](http://localhost:3001)

### Alternative: Individual Component Start
If you prefer to run the components in separate terminal tabs:

* **Backend Server only:**
  ```bash
  pnpm dev:server
  ```
* **Vite Client only:**
  ```bash
  pnpm dev:client
  ```

---

## 💡 Block-Level Optimization (Token Efficiency)

To minimize API latency and token consumption, MarkUpdraft supports **cursor-targeted block execution**:
1. Position your cursor inside a specific paragraph, list item, or table in the editor.
2. The active block state indicator will show the estimated scope (e.g. `Active Block: Paragraph (approx. 25 words)`).
3. Click **Transform Selection** to run AI models on **only** that specific block, rather than rewriting the entire document.
4. To transform everything, select the full document text.

---

## 📁 Project Directory Map

```text
MarkUpdraft/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/          # Reusable UI widgets
│   │   ├── App.tsx              # Main layout, state, and stream reader
│   │   └── index.css            # Dark mode overrides & custom scrollbars
│   ├── package.json
│   └── vite.config.ts
├── server/                      # Express backend proxy
│   ├── index.js                 # API server and streaming Gemini integration
│   ├── .env                     # Local environment file (API Key)
│   └── package.json
├── package.json                 # Monorepo task runner script configuration
├── PROJECT_SPECIFICATION.md     # Original project request
└── README.md                    # Project documentation
```
