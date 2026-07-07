export interface Preset {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const PRESETS: Preset[] = [
  {
    id: 'technical-spec',
    name: '🪐 API & Web Technology Spec',
    description: 'Perfect for testing Explain Mode. Contains terms like SSE, LCP, DOM, and API latency.',
    content: `# Web App Optimization Specification

To achieve maximum performance on modern client-side applications, we must implement several key technologies:

1. **SSE (Server-Sent Events)**:
   This protocol allows the backend server to push real-time text streams directly to our client interface over a single, persistent HTTP connection, avoiding the overhead of WebSockets or polling.

2. **API Latency Mitigation**:
   We will establish an edge proxy gateway to cache static routes, minimizing API latency and lowering time-to-first-byte (TTFB).

3. **DOM Rendering & LCP (Largest Contentful Paint)**:
   By deferring non-critical scripts, we minimize blocking time for the main browser DOM tree, accelerating LCP rendering and leading to a more responsive user interface.

4. **CRUD Actions**:
   Our state pipeline will wrap basic CRUD endpoints, keeping sync latency to a minimum.
`
  },
  {
    id: 'messy-outline',
    name: '📝 Messy Layout Draft',
    description: 'Perfect for testing Original (Hybrid) Mode. Contains bad grammar, messy spacing, and broken tables.',
    content: `#   Weekly Meeting Outline   
    
Here are some   rough notes from the team meeting today.   
We really need to fix our db query speeds because it is super slow.  

| TaskName |   Assignee | Status |
|---|---|---|
|   Scaffold project | John | Done|
| Write routes|Alice|   In Progress|
|Test client  |  Bob |Todo|

Some list elements:
*    We should use typescript for the codebase
* it is more   safe
*  let us build it this week!
`
  },
  {
    id: 'expansion-draft',
    name: '🚀 Expansion Draft',
    description: 'Perfect for testing Expand Mode. A short, incomplete draft that Gemini can elaborate on.',
    content: `# Project Pitch: AI Assisted Editor

We are building a tool called MarkUpdraft. It helps users edit Markdown. 

The main value is that it saves tokens by doing block-level selection edits. It also does real-time streaming, and explain modes.
`
  }
];
