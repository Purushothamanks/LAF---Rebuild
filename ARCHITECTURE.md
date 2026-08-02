# LAF Architecture & Security Specification

## 1. Overview
LAF ("Look At Future") is designed as a secure, fast, human-minded reasoning AI platform equipped with multimodal capabilities (Image, Audio, Video), live global intelligence feeds, and isolated per-user databases with end-to-end encryption (E2EE).

---

## 2. Fast Reasoning Engine Architecture
- **Primary Model Routing**: Auto-routes queries to high-performance LLM backends (Gemini 1.5 Flash / Pollinations Fast Reasoning Engine / Groq).
- **Conciseness Controller**:
  - **Short Mode (Default)**: Returns direct, concise answers in 2-4 sentences.
  - **Detailed Mode**: Detects user intent ("explain in detail", "elaborate") or UI toggle to expand into comprehensive step-by-step documentation.
- **Memory Integration**: Automatically scans the user's isolated database for historical conversation context when queries mention past discussions.

---

## 3. Database Isolation & Security Model
- **Passwordless Authentication**: Users enter a unique username, generating a signed HMAC token.
- **Database Partitioning**: Each username is hashed into a unique key, provisioning an isolated database file under `./data/users/user_{hash}.json`.
- **End-to-End Encryption**:
  - All chat payloads are encrypted using AES-256-GCM prior to persistence.
  - Encryption keys are derived per user using PBKDF2 with 10,000 iterations.
- **Threat Shield**:
  - Express Rate Limiting (300 requests / 15 minutes).
  - Input/Output sanitization filtering XSS, script injection, and prompt attacks.
  - Helmet HTTP Security Headers.

---

## 4. Multimodal Generation Engine
- **Image Generation**: Powered by FLUX.1-HD and SDXL Turbo endpoints with customizable resolutions and aspect ratios.
- **Audio Generation**: Text-to-Speech synthesis supporting natural voice profiles and MP3 audio downloads.
- **Video Motion Engine**: Text-to-video rendering pipeline delivering animated motion video previews.

---

## 5. Live World Trends Engine
- **Auto-Update Scheduler**: Scrapes and aggregates breaking news every 15 minutes across AI & Technology, Global Business, and Future Science categories.
