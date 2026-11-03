# LAF AI Platform — Session Memory & Architecture Handover

> **Project:** LAF AI Platform ("Look At Future")  
> **Workspace Path:** `/home/purushothaman/Videos/Projects/LAF-Rebuild`  
> **Repository:** [https://github.com/Purushothamanks/LAF---Rebuild.git](https://github.com/Purushothamanks/LAF---Rebuild.git) (Branch: `main`)  
> **Live Production:** [https://lafsai.web.app](https://lafsai.web.app) | [https://lafsai.firebaseapp.com](https://lafsai.firebaseapp.com)  
> **Last Verified Date:** Wednesday, November 4, 2026 (IST)  
> **Latest Git Commits:** `634689f` & `905f69d`

---

## 1. Verified Core Architecture & Recent Implementations

### 1.1 Dual-Layer Ambient Bottom Glow (Zero Text Interference)
- **Layer 1 (Background):**
  - `.gemini-ambient-bottom-glow` is rendered on `z-index: 1; pointer-events: none;` directly behind all chat content.
  - Sub-elements:
    - `.gemini-glow-base`: Soft luminous blue base tint at bottom edge.
    - `.gemini-glow-core`: Primary sweeping radial gradient aura (`rgba(59, 130, 246, 0.32)`).
    - `.gemini-glow-orb`: Dynamic soft cyan/violet accent orb travelling horizontally.
    - `.gemini-glow-beam`: Subtle 1.5px luminous animated baseline wave.
- **Top-Half Smooth Fade Out:**
  - Masked with `-webkit-mask-image` and `mask-image`:
    `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 20%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.08) 80%, rgba(0,0,0,0) 100%)`
  - Reaches 0% opacity by half-screen (`45vh` / max 440px desktop; `38vh` / max 300px mobile).
- **Layer 2 (Foreground Text):**
  - `.chat-messages-scroll` sits on `z-index: 2; position: relative;` with transparent background.
  - User and assistant messages, code snippets, tables, and buttons have 100% crisp visibility with zero blur, washing out, or covering.

---

### 1.2 Omnichannel Mobile-First Viewport Lock & Dynamic Keyboard Handling
- **Mobile Keyboard & Viewport Synchronization:**
  - Added `interactive-widget=resizes-content` to `meta[name="viewport"]` in `index.html`.
  - Root containers: `html, body` have `overflow: hidden; height: 100%;` and `#root` has `height: 100dvh; display: flex; flex-direction: column;`.
  - On mobile, `.chat-bottom-input-anchor` is structured as a relative flex item (`position: relative; flex-shrink: 0; z-index: 50;`) at the base of the chat column.
  - When the virtual keyboard opens or user sends an input, the input bar docks firmly directly above the keyboard and NEVER hides or slips below the screen.
  - Converted message scrolling from global `scrollIntoView()` to container-scoped `chatMessagesScrollRef.current.scrollTo(...)`, ensuring zero document or window displacement.

---

### 1.3 Chat Input Ergonomics & Dynamic Send Button
- **Desktop Positioning:** Floating clean anchor with `bottom: 24px; z-index: 50;` for modern breathing room.
- **Mobile Positioning:** Docked flex base with `padding: 6px 12px calc(8px + env(safe-area-inset-bottom, 8px)) 12px; z-index: 50;`.
- **Dynamic Themed Send Button:**
  - Auto-adapts based on active theme (`dark`, `cyber`, `light`).
  - Active state lights up with blue accent (`#3b82f6`) when prompt text or an attachment is present.
  - Hover elevation with active scale depression (`scale(0.98)`).

---

### 1.4 Hero Animations & Logo Intro Spin
- **Emblem Spin:** `.laf-logo-intro-spin` runs a 1-second 360° rotational easing on mount.
- **Heading:** "Where Imagination Meets Intelligence."
- **Live Subheading:** Animated live typing effect with Thanos snap particle disintegration before looping.
- **Removed Deprecated Badges:** "Look At Future • 2026 Engine" badge removed for minimalist design.

---

### 1.5 Dynamic Temporal Grounding (No Hardcoded Dates)
- Replaced previous hardcoded date citations with dynamic date generation:
  - System prompts in `server/services/aiEngine.js`, `server/services/customKnowledge.js`, and `src/utils/aiClient.js` now dynamically compute `new Date()`.
  - Current day, month, date, and year (e.g., `November 2026`) are accurately cited in both conversational answers and LAF Canvas generated documents.

---

### 1.6 LAF Canvas & Smart Routing
- **Smart Auto-Open:**
  - Uploading a PDF, document, or image now stays directly in chat for comprehensive inline conversational breakdown.
  - Canvas only auto-opens when the user explicitly requests document generation (e.g., *"give me as doc"*, *"generate me as a file"*, *"show as canvas"*).
- **Mobile Canvas Header Clean Separation:**
  - Row 1: Document title and icon on the left; isolated `( X )` dismiss button on far right.
  - Row 2: Tabs `[Document] [Markdown]` on left; action buttons `[Copy] [Export]` on right.
  - Removed full-screen toggle for cleaner workflow.
  - Added `overflow-wrap: break-word`, `word-break: break-word`, and `hyphens: auto` to prevent awkward word splitting.

---

### 1.7 Multimodal File & Image Verification Viewer
- File and image uploads cache their data blobs in `attachmentCacheRef`.
- Clicking on the attached preview chip opens an interactive modal viewer allowing users to inspect the document or image, "Open in New Tab", or "Download".

---

## 2. Key File Directory Map

| Path | Purpose |
| :--- | :--- |
| `src/components/ChatView.jsx` | Primary chat pane, ambient glow container, hero header, messages scroll, sticky input, and file viewer modal |
| `src/components/LafCanvas.jsx` | LAF Canvas document viewer, live markdown editor, export & copy controls |
| `src/index.css` | Design system variables, layout constraints, ambient glow animations, media queries |
| `src/App.jsx` | Root application layout, session management, viewport sizing (`100dvh`) |
| `src/utils/aiClient.js` | Frontend AI client, multi-model candidate chain, dynamic system prompt grounding |
| `src/utils/agentEngine.js` | Autonomous agent execution, artifact parsing, Canvas auto-open heuristics |
| `server/services/aiEngine.js` | Express backend AI routing, Gemini multimodal fallback, dynamic system instructions |
| `server/services/customKnowledge.js` | Local high-speed knowledge base and verified temporal facts |
| `server/routes/chat.js` | Authenticated conversation endpoints, attachment and history persistence |

---

## 3. Operational CLI Guide

### Rebuilding Frontend
```bash
npm run build
```

### Starting Local Backend Server
```bash
npm start
# Server listens on http://localhost:3000
```

### Deploying to Live Firebase
```bash
firebase deploy --only hosting
# Target: https://lafsai.web.app
```

### Git Commit & Push
```bash
git add .
git commit -m "feat/fix: description of updates"
git push origin main
```

---

## 4. Security & Configuration Best Practices
- **Never hardcode API keys:** Always read via `process.env` or `import.meta.env.VITE_GEMINI_API_KEY`.
- **Git Ignore:** Ensure `.env`, `.pem`, and build outputs stay in `.gitignore`.
