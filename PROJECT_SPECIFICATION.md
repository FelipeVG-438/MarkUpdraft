# **Project MarkUpdraft: Specification & Architectural Prompt (Token-Optimized)**

You are an expert software engineering agent inside **Google Antigravity**. Your objective is to build **MarkUpdraft**, a dual-pane web application that transforms raw or messy Markdown into highly visual, structured, and modern documents using token-efficient, real-time, AI-assisted modifications.

Use this document as your master guide to plan, code, and test the system.

## **1\. Technical Stack Constraints**

To ensure modern development practices, clean modular architecture, and security, you must adhere strictly to this tech stack:

* **Frontend Framework:** React (using Vite for ultra-fast development and build bundling).  
* **Styling:** Tailwind CSS with @tailwindcss/typography to handle elite, Notion-like, beautiful typographic rendering via the prose class.  
* **Backend Server:** Node.js (with Express) or Next.js Serverless API routes to act as a secure proxy gateway.  
* **AI Engine:** Gemini 2.5/3.5 Flash via the official @google/genai SDK.  
* **Data Flow:** HTTP Streaming (Server-Sent Events) for text generation, or structured JSON parsing for token-efficient extractions.

## **2\. Software Requirements Specification**

### **Functional Requirements (FR)**

* **FR-1: Dual-Pane Layout:**  
  * Left side: A raw text area editor with Markdown input capabilities.  
  * Right side: A rendered output pane showcasing beautiful preview formatting.  
* **FR-2: Token-Optimized AI Transformation Control Center:**  
  * A clean control menu allowing users to select from four discrete processing modes:  
    1. Original (Hybrid Format): Uses local Javascript parsers (e.g., Prettier/markdown-it) to clean up raw syntax structures, spacing, and tables first. Passes text to Gemini only for advanced grammatical smoothing.  
    2. Summarize (Streamed): Condenses the selected text block into a highly structured, scannable, bulleted layout.  
    3. Explain (JSON Extraction): To avoid rewriting the entire text, Gemini scans the input and returns *only* a JSON object mapping complex terms to precise explanations: {"term": "explanation"}. The frontend automatically parses this and highlights the terms in the preview pane with interactive tooltips.  
    4. Expand (Streamed): Logically elaborates on the selected text block, completing partial thoughts.  
* **FR-3: Block-Level Transformation (Critical Token Optimization):**  
  * The user must be able to select a specific paragraph or section of text to transform. The API call will only send and process the *selected selection*, preventing redundant processing of the entire document.  
* **FR-4: Secure API Proxying:**  
  * The frontend must never expose the Google AI Studio API Key. All queries must flow securely through the backend server.  
* **FR-5: Modern Utilities Panel:**  
  * One-click "Copy to Clipboard" buttons for raw processed Markdown and rendered HTML.  
  * Fallback presets and rapid clear-text actions.  
* **FR-6: History State Undo:**  
  * Simple history state-stacking to let users revert individual block modifications or recover original inputs.

### **Non-Functional Requirements (NFR)**

* **NFR-1: Token and Cost Efficiency (Output Minimization):**  
  * The app must minimize output tokens by leveraging localized JSON extraction for explanations and client-side formatting where possible.  
  * Average token usage per document transformation should be reduced by up to 90% compared to full-document rewrite approaches.  
* **NFR-2: Streamed Progressive Rendering (Low Latency):**  
  * Summary and Expansion responses must stream character-by-character from the backend to prevent loading delays.  
* **NFR-3: Premium Visual Aesthetics (The Notion Feel):**  
  * Modern minimalist defaults, generous workspace padding, clean sans-serif headers, monospace code blocks, and toggle support for Light and Dark modes.  
* **NFR-4: Exception Boundaries:**  
  * Gracefully capture rate limits, API key issues, or JSON parsing errors. Notify the user via non-blocking UI alert cards.

## **3\. AI Prompt & Instruction Set**

When calling the Gemini API from the backend server, apply the following optimized instructions based on the requested execution mode:

### **For Summarize and Expand Modes (Streaming)**

Role: Markdown Transformation Engine  
Task: Process the input text according to the mode. Return ONLY the final formatted Markdown. Do not include introductory conversational text, and do NOT wrap the output in \`\`\`markdown blockquotes.

Modes:  
\- "Summarize": Extract core themes and action items into clean, scannable bullet points.  
\- "Expand": Elaborate logically on the text, filling in context while maintaining the original tone.

### **For Explain Mode (JSON Extraction \- Strict Schema)**

Role: Technical Term Extractor  
Task: Identify advanced terms, acronyms, or complex data metrics in the input text. Return a valid JSON object map where keys are the exact case-sensitive terms found in the text, and values are short, precise definitions.

Example Input: "We need to optimize our API latency and configure SSE for streaming."  
Example Output:  
{  
  "API latency": "The time it takes for a server to respond to a system request.",  
  "SSE": "Server-Sent Events; a technology allowing servers to push real-time updates to clients."  
}

Constraint: Return ONLY valid, minified JSON. Do not wrap in markdown code blocks.

## **4\. Phased Implementation Plan for Antigravity**

Please construct the codebase sequentially following these phases:

### **Phase 1: Environment & Workspace Setup**

1. Scaffold a Vite \+ React modern frontend project.  
2. Initialize a secure Express backend server or Next.js app layout.  
3. Configure Tailwind CSS along with @tailwindcss/typography.  
4. Establish environment variables for secure storage of GEMINI\_API\_KEY.

### **Phase 2: Interface Blueprinting**

1. Design the main dual-pane viewport with selection capabilities.  
2. Implement the text-editor area on the left and the markdown rendering wrapper (react-markdown inside a Tailwind prose container) on the right.  
3. Integrate the mode action controllers and custom utilities (Copy, Clear, Undo).

### **Phase 3: AI Streaming & JSON Extraction Proxy Development**

1. Write a server-side route (e.g., /api/transform) that initializes the official Google Gen AI SDK.  
2. Implement streaming mode responses and JSON extraction routes using Gemini's structured output capabilities.  
3. Build the SSE pipeline for real-time text streams.

### **Phase 4: State Coordination & Dynamic Tooltip Integration**

1. Hook up the client-side handlers to parse the incoming text streams.  
2. Integrate a dynamic tooltip parser in the React Markdown preview pane that highlights terms returned by the Explain JSON payload, showing interactive tooltips on hover.  
3. Polish UI with modern theme controls, animations, and clean status overlays.