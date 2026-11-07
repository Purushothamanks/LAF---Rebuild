# LAF AI Platform — Session Memory & Architecture Handover

> **Project:** LAF AI Platform ("Look At Future")  
> **Workspace Path:** `/home/purushothaman/Videos/Projects/LAF-Rebuild`  
> **Repository:** [https://github.com/Purushothamanks/LAF---Rebuild.git](https://github.com/Purushothamanks/LAF---Rebuild.git) (Branch: `main`)  
> **Live Production:** [https://lafsai.web.app](https://lafsai.web.app) | [https://lafsai.firebaseapp.com](https://lafsai.firebaseapp.com)  
> **Last Verified Date:** Saturday, November 7, 2026 (IST)  
> **Latest Git Commits:** `46f2e0d` (Local feature updates ready for stage & commit)

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
- **Mobile Positioning:** Elevated floating pill card with `bottom: calc(20px + env(safe-area-inset-bottom, 12px)); z-index: 50;` lifted cleanly above the bottom edge and home gesture indicator, accompanied by `padding: 0 12px;`, `border-radius: 28px;`, and ambient blue drop-shadow.
- **Scroll Clearance:** `.chat-messages-scroll` configured with `calc(115px + env(safe-area-inset-bottom, 16px))` bottom padding on mobile so the latest conversation messages remain fully visible above the floating bar.
- **Dynamic Themed Send Button:**
  - Auto-adapts based on active theme (`dark`, `light`).
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

### 1.8 Top-Right User Circle Avatar & Settings Menu, and Compact Floating Sidebar
- **User Profile & Settings Removed from Sidebar:**
  - Removed user profile card and Settings option from inside the floating sidebar (`src/components/Navigation.jsx`), keeping the sidebar focused purely on new chats and conversation history.
- **Top-Right Circular User Avatar (`src/components/UserMenu.jsx`):**
  - Renders an elegant circular avatar button displaying the user's uppercase first initial (e.g., `P` for Purushothaman).
  - High-end aesthetics with gradient blue background, 1.5px border, and ambient glow.
  - Clicking triggers a responsive floating dropdown popover displaying the user profile header and the **Settings** option (which opens `SettingsModal`), along with Help & Feedback, Download/Share app, Clear all chats, and Log out.
  - Symmetrically aligned with the top-left bar (`top: 16px; right: 16px;` on desktop; `top: 12px; right: 12px;` on mobile).
- **Floating Sidebar Size Reduction:**
  - Reduced sidebar width from `260px` to `210px` on desktop and `195px` on mobile.
  - Reduced padding from `18px 16px` to `12px 10px` on desktop and `10px 8px` on mobile.
  - Re-proportioned inner action buttons and recent chat history items with sleek, compact typography.
- **Local WiFi Network Binding:**
  - Configured `vite.config.js` with `host: '0.0.0.0'` alongside Express `server/index.js` listening on `0.0.0.0:3000` for multi-device testing over WiFi.

---

### 1.9 Unified LAF Model Branding & Context-Aware Blueprint/Graph Image Engine
- **Unified Clean Model Naming (`LAF 1.0 Lite`, `LAF 1.5 Lite`, `LAF 1.0 Flash`, `LAF 2.0 Flash`, `LAF 4.0 Flagship`):**
  - Replaced legacy provider labels with clean LAF branding.
  - Added centralized model name formatter `getLafModelDisplayName` in both backend (`server/services/aiEngine.js`) and frontend (`src/utils/aiClient.js`).
  - Added frontend sanitizer `formatLafProvider` in `src/components/ChatView.jsx` to dynamically sanitize existing chat messages and new responses, guaranteeing zero "Gemini" mentions across all message headers.
- **Root-Cause Elimination of Irrelevant Girl/Portrait Images on Technical Requests:**
  - Queries for blueprints, graphs, flowcharts, architectures, or technical workflows receive dedicated schematic prompts and enforce strict negative prompts against portraits/models.

---

### 1.10 UI/UX Overhaul: Royal Blue Charcoal Theme, Circular Controls, Typing Streaming, & Thanos Snap

- **Dark & Light Mode Consolidation (Royal Blue Charcoal):**
  - Deprecated and purged all `cyber` and legacy theme selectors. Strictly two modes supported:
    - **Dark Mode (Royal Blue Charcoal):** Canvas `#090d16`, sidebar `#0f1523`, elevated card `#151c2e`, border `#1e293b`, royal blue accents `#3b82f6`, crisp text `#f8fafc`.
    - **Light Mode:** Canvas `#f8fafc`, card `#ffffff`, borders `#cbd5e1`, text `#0f172a`.
  - Guaranteed WCAG 2.1 AAA contrast for all headings, text, cards, and input fields.
- **Settings Modal Cleanup:**
  - Removed "Custom Reasoning API Key (Optional)" and "Backend Server URL (Optional)" input fields, states, and action buttons. Settings modal is now clean and uncluttered.
- **Strictly Circular Chat Input Action Buttons:**
  - Mobile & desktop action buttons (`mic`, `attachment`, `send`/`stop`) enforce strict 1:1 circular geometry:
    `width: 38px !important; height: 38px !important; border-radius: 50% !important; aspect-ratio: 1 / 1 !important;`.
  - Styled with dark circular background (`#151c2e` in dark mode, `#1e293b` in light mode) and vibrant royal blue icons (`#3b82f6`).
- **Floating Input Bar & Mobile Keyboard Jump Neutralization:**
  - Root cause eliminated on 1st new chat: removed locked `overflow-y: hidden` and `height: 100%` on `.chat-scroll-empty`. Replaced with responsive `margin: auto 0` centering and auto-scrolling container.
  - Added `onFocus={() => window.scrollTo(0, 0)}` to prompt textarea so mobile viewports never jump or displace the hero layout.
- **Hero Subtitle Thanos Snap Dust Particle Disintegration:**
  - Subheading: `"Experience live LAF Canvas preview, real-time code synthesis, multimodal generation, and high-speed reasoning."`
  - Rendered via `TypewriterHeroSubheading`: streams text at ~30ms/char, holds for 3.2s, dissolves across words into floating `.thanos-ash-particle` dust with randomized dispersion vectors (`--dx`, `--dy`, `--rot`), pauses briefly in void, and seamlessly repeats.
- **Live Text Typing Streaming with Blinking Cursor:**
  - Corrected typewriter streaming in `streamTextResponse`: message initializes empty and characters stream in smoothly tick-by-tick with an interactive pulsing cursor (`.laf-typing-cursor`).
- **Interruptible Generation (Send / Stop Toggle):**
  - While AI responds (`loading || isStreaming`), send button transforms into a dark circular Stop button (`Square` icon with red active accent).
  - Clicking halts network streaming via `AbortController`, stops typewriter interval, and cleanly preserves partial response.
- **Message Edit & Restart Thanos Snap Disintegration (Slow & Smooth):**
  - When user edits a past prompt and clicks "Save & Restart", the edited prompt and all subsequent assistant responses trigger a dust particle disintegration effect (`.chat-message-row.thanos-snap-active`) running `@keyframes thanosRowSlowDisintegrate` with a smooth 1450ms duration and staggered cascade delay before clearing and streaming the refreshed query.
- **Under-Input Disclaimer & Tiered Task Complexity Routing (`LAF 4.0 Flagship`):**
  - Added clean responsive disclaimer centered beneath the floating bar: `Laf is AI and can make mistakes.`
  - Tiered task complexity classifier (`getCandidateModelsForTask`):
    - **Light Tasks:** `gemini-3.1-flash-lite` / `gemini-3.5-flash-lite` (`LAF 1.0 Lite` / `LAF 1.5 Lite`) prioritized for simple everyday questions, definitions, and chit-chat.
    - **Moderate Tasks:** `gemini-3.8-flash` / `gemini-flash-latest` (`LAF 2.0 Flash` / `LAF 1.0 Flash`) prioritized for standard coding, summaries, explanations, and documents.
    - **Very Complex Tasks:** `gemini-4-argon` branded as **`LAF 4.0 Flagship`** reserved strictly for deep architectural engineering, math proofs, algorithm design, and heavy multi-step reasoning.
- **Image Generation Over-Routing Elimination:**
  - Removed broad domain triggers (`game`, `engine`, `code`, `system`, `ai`) and conversational history leakage that hijacked general image generation requests into SVG blueprints. Pure AI image requests now consistently render high-fidelity visual art via Pollinations/FLUX.1 unless explicitly asked for a blueprint/schematic diagram.
- **Send Button Visual Uniformity:**
  - Ensured the send icon inside the button maintains 100% vibrant royal blue (`#3b82f6`) matching the mic and paperclip icons at all times without light-blue opacity washing out.
- **New Chat Keyboard Jump Neutralization:**
  - Fully removed `overflow-y: hidden` and `touch-action: pan-x` from empty chat containers, ensuring the page remains rock-solid on mobile when the input bar is touched, with only the input bar floating above the keyboard.

---

## 2. Key File Directory Map

| Path | Purpose |
| :--- | :--- |
| `src/components/UserMenu.jsx` | Top-right circular user initial button, popover dropdown menu, Settings trigger |
| `src/components/Navigation.jsx` | Compact floating sidebar, new chat button, recent conversations, clear all chats |
| `src/components/ChatView.jsx` | Primary chat pane, ambient glow container, hero header, messages scroll, sticky input, and file viewer modal |
| `src/components/SettingsModal.jsx` | Streamlined profile, theme toggle (Dark / Light), and legal information |
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

---

## 4. Security & Configuration Best Practices
- **Never hardcode API keys:** Always read via `process.env` or `import.meta.env.VITE_GEMINI_API_KEY`.
- **Git Ignore:** Ensure `.env`, `.pem`, and build outputs stay in `.gitignore`.
