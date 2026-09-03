# LAF AI Platform (LAF-Rebuild) - Run Instructions

## 🌐 Active Live URL & AWS Deployment
- **Active AWS Host IP**: `98.89.32.42`
- **Primary Live URL (nip.io)**: https://98.89.32.42.nip.io
- **HTTP Live URL**: http://98.89.32.42
- **Target Host**: AWS EC2 / Lightsail (`ubuntu@98.89.32.42`)
- **Docker Container**: `laf-ai-product`

---

## Project Overview
**LAF (Look At Future)** is an Autonomous Fast Multimodal AI Product Platform featuring:
- **Frontend**: React 19, Vite, Lucide Icons, Marked (Markdown renderer), Highlight.js
- **Backend**: Node.js, Express, Helmet, SQLite3 database, JWT Authentication, Ollama integration

---

## Prerequisites
- **Node.js**: v18+ (tested on Node v26.x)
- **npm**: v9+

---

## Local Installation & Setup

1. Open your terminal and navigate to the project directory:
   ```bash
   cd /home/purushothaman/Videos/Projects/LAF-Rebuild
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configuration (`.env` file):
   ```env
   PORT=3000
   LAF_API_KEY=sk-VxsIAi0YwNN4KtS3ZPnb7h273DBLkaii4F6VQYOrRf0Hz6fC
   ```

---

## Running the Project Locally

### Method 1: Production Mode (Build + Express Server - Recommended)
1. Build the frontend assets:
   ```bash
   npm run build
   ```

2. Start the Express server:
   ```bash
   npm start
   ```

3. Open your browser at:
   ```
   http://localhost:3000
   ```

---

### Method 2: Development Mode (Hot Reloading Frontend + Backend)
Run both backend nodemon and Vite development server concurrently:
```bash
npm run dev
```
- Frontend dev server: `http://localhost:5173`
- Backend API server: `http://localhost:3000`

---

## Cloud Deployment Scripts
- **Deploy to AWS**: `./deploy.sh`
- **Sync & Update**: `./sync_all.sh` or `./update_laf.sh`
