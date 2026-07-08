# 🪐 MarkUpdraft

MarkUpdraft is a dual-pane web application that transforms raw or messy Markdown into highly visual, structured, and modern documents using token-efficient, real-time, AI-assisted modifications powered by Gemini.

The project is structured as a monorepo-style setup with a React client and an Express proxy server.

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite + TypeScript)
- **Styling:** Tailwind CSS with `@tailwindcss/typography` (Notion-like prose rendering)
- **Backend:** Node.js + Express (secure API proxy gateway)
- **AI Integration:** Official `@google/genai` SDK (using `gemini-2.5-flash`)
- **Data Flow:** HTTP Streaming (Server-Sent Events) for live generation & structured JSON mapping for tooltip explanations

---

## 📋 Prerequisites

Before setting up, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **pnpm** (preferred package manager)

You will also need a **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).

---

## ⚙️ Configuration

To protect your API credentials, the frontend proxy is configured to route all Gemini API calls securely through the Express backend.

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
   > ⚠️ **Important:** Keep `PORT=3001` as the client configuration is pre-configured to point to `http://localhost:3001/api/transform`.

---

## 🚀 Getting Started

### 1. Install Dependencies
From the workspace root directory, run the following command to install dependencies for both the frontend client and the backend server:
```bash
pnpm install-all
```

### 2. Run the Application
Start both the client and server concurrently using:
```bash
pnpm dev
```

This will launch:
- 🌐 **Vite Client:** [http://localhost:5173](http://localhost:5173)
- 🔌 **Express Backend:** [http://localhost:3001](http://localhost:3001)

### Alternative: Individual Component Start
If you prefer to run the client and server in separate terminal sessions, you can run:

* **Backend Server only:**
  ```bash
  pnpm dev:server
  ```
  *(Or `cd server && pnpm dev`)*

* **Vite Client only:**
  ```bash
  pnpm dev:client
  ```
  *(Or `cd client && pnpm dev`)*

---

## 🧠 Features & AI Processing Modes

MarkUpdraft contains a **Token-Optimized AI Transformation Control Center** with four distinct processing modes:

1. **Original (Hybrid Smooth):** 
   Uses local JavaScript parsers (Prettier) to first format raw syntax structures (spacing, tables, lists) and then routes the output to Gemini for advanced grammatical smoothing without rewriting structural layout.
2. **Summarize (Streamed):** 
   Condenses selected text into a highly structured, scannable, bulleted Markdown layout via SSE streaming.
3. **Explain (JSON Extraction):** 
   Extracts complex terms or jargon from the selection as JSON and renders them on the frontend with interactive hover tooltips in the preview pane.
4. **Expand (Streamed):** 
   Elaborates on selected text blocks and completes partial thoughts, streamed in real-time.

### 💡 Block-Level Optimization (Token Efficiency)
To minimize API token usage and latency:
- Select a paragraph or section in the editor pane before choosing an AI transformation.
- The system will process **only** the selected text segment, rather than performing a full document rewrite.

---

## 📁 Project Directory Map

```filepath
MarkUpdraft/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/          # Reusable UI widgets
│   │   ├── App.tsx              # Main dual-pane interface
│   │   └── index.css            # Custom typography and styling
│   ├── package.json
│   └── vite.config.ts
├── server/                      # Express backend proxy
│   ├── index.js                 # API server implementation
│   ├── .env                     # Local environment file (API Key)
│   └── package.json
├── package.json                 # Workspace-level package script runner
└── MarkUpdraft Project Specification.md
```
