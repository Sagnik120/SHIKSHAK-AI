<div align="center">

# 🎓 Shikshak AI (शिक्षक AI)

### Autonomous, Multimodal AI Educator with Real-Time Pedagogical Adaptation & Viseme Lip-Synced Video Instruction

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite WAL](https://img.shields.io/badge/SQLite-WAL_Mode-003B57?style=flat&logo=sqlite&logoColor=white)](https://sqlite.org/wal.html)
[![BGE-M3 RAG](https://img.shields.io/badge/RAG-BGE--M3_Hybrid-FF6F00?style=flat)](https://huggingface.co/BAAI/bge-m3)
[![Google Gemini](https://img.shields.io/badge/LLM-Google_Gemini-4285F4?style=flat&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](#-option-c--docker)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Now-6C63FF?style=flat)](https://shikshak-ai.onrender.com/)

**Build Fast with AI Hackathon** · *AI Teacher Track*

[Overview](#-project-overview) · [Features](#-key-features) · [Architecture](#%EF%B8%8F-system-architecture) · [Tech Stack](#%EF%B8%8F-technologies-used) · [Setup](#%EF%B8%8F-setup--installation) · [Run](#-how-to-run-the-project) · [Demo](#-demo) · [Team](#-team)

</div>

---

## 💡 Project Overview

**Shikshak AI** is an autonomous AI teacher. It turns unstructured study material, such as textbooks, PDFs, lecture notes or a topic name, into **interactive, adaptive, video-based lessons** delivered by a lip-synced AI avatar.

Most AI learning tools are **passive chatbots**: they wait for a question and reply with a wall of text. Human tutors are far more effective because they *plan*, *explain*, *check understanding* and *adapt*, but they don't scale. Shikshak AI closes that gap with a **multi-agent pedagogical state machine** that teaches the way a good tutor does:

> **Plans** a curriculum → **explains** with voice, avatar and visual boards → **questions** the learner → **evaluates** free-form answers against rubrics → **diagnoses misconceptions** → **adapts** the lesson in real time.

Every explanation is **grounded in the learner's own material** through hybrid RAG, so the AI teaches from the source and doesn't hallucinate. The system also tracks long-term mastery with a **skill map**, **personalised learning paths**, **placement checks** and **spaced-repetition reviews**.

### 🎯 Problem → Solution

| Problem | How Shikshak AI solves it |
| :--- | :--- |
| One-size-fits-all content | 7-state FSM that adapts each step to the learner's answers |
| Hallucinating AI tutors | BGE-M3 hybrid retrieval + cross-encoder reranking + grounding verifier |
| Answers graded by keyword matching | Rubric-based semantic evaluation + misconception taxonomy |
| Text-only learning | Avatar video with Edge-TTS voice, 24 FPS visemes, LaTeX/plot/code boards |
| No sense of progress | Skill map, learning path, placement check, spaced review, reports |
| Language barriers | Full English + Hindi (हिन्दी) interface |

---

## ✨ Key Features

### 🧠 Adaptive teaching engine
- **7-state pedagogical FSM:** `UNDERSTAND → PLAN → EXPLAIN → DEMONSTRATE → QUESTION → EVALUATE → ADAPT → CONTINUE`
- **Specialised agents:** Planner, Explainer, Questioner, Assessment Agent and Adaptation Controller
- **Adaptive remediation:** after each checkpoint the controller decides `ALLOW` (continue), `MODIFY` (re-explain more simply), `REGENERATE` (new remediation path) or `HUMAN` (escalate to a mentor)
- **Why-Log:** records the reason behind every adaptation, so learners can see why the lesson changed
- **Difficulty calibrator:** adjusts question difficulty to the learner's performance

### 📚 Grounded knowledge (RAG)
- Document parsing → semantic chunking → **BGE-M3 dense + sparse embeddings** → **ChromaDB**
- **Cross-encoder reranking** and a **grounding verifier** keep answers tied to the source

### 📝 Intelligent assessment (ML Core)
- Concept extraction from uploaded material
- **Multi-criterion rubric evaluation** of free-form answers
- **Misconception taxonomy:** identifies *what* the learner got wrong, not just *that* they were wrong
- Visual suggestion engine picks the best visual aid for each concept

### 🎬 Multimodal video instruction
- **Edge-TTS** speech synthesis
- **24 FPS viseme lip-sync** for the teacher avatar
- Visual boards rendered with **LaTeX, Matplotlib, Pygments and Graphviz**
- **FFmpeg compositor** merges everything into video segments streamed over **WebSocket**

### 🗺️ Learning journey
- **AI skill map:** every concept with its mastery state and prerequisites
- **Learning path:** a step-by-step route to any goal ("Learn AI from zero", a track, or any custom topic)
- **Placement check:** about 6 adaptive questions that skip what you already know
- **Spaced review (Refresh):** brings concepts back before you forget them
- **Practice Lab:** interactive simulations and code challenges
- **Diagnostic reports:** strengths, gaps and misconceptions after each lesson

### 🔐 Production-grade platform
- JWT access tokens + **rotating HTTP-only refresh tokens**, bcrypt hashing, login lockout
- OTP email verification (SMTP / Resend) with a dev fallback
- **Durable sessions:** FSM state is persisted in SQLite WAL, so interrupted lessons resume exactly where they stopped
- Agent trace sink (MLOps) records every agent call for observability
- Bilingual UI (English / Hindi) and Docker deployment

---

## 🏗️ System Architecture

<div align="center">

![Shikshak AI System Architecture](docs/images/shikshak_system_architecture.png)

*Fig. 1. End-to-end architecture of Shikshak AI: the multi-agent pedagogical FSM, hybrid RAG grounding, rubric-based ML evaluation and multimodal avatar video synthesis.*

</div>

### 🔄 End-to-end flow

```
 Learner ──► Next.js Frontend ──REST/WS──► FastAPI Backend (JWT Auth, Session Manager)
                                                  │
           ┌──────────────────────────────────────┼─────────────────────────────────┐
           ▼                                      ▼                                 ▼
   RAG Pipeline                     Agent Orchestrator (7-State FSM)           ML Core
   Parse → Chunk → BGE-M3     ◄───  Planner · Explainer · Questioner   ───►  Rubric Eval
   → ChromaDB → Rerank              Assessment · Adaptation Controller       Misconceptions
   → Grounding                                    │   ▲                      Concepts
                                                  │   └── ADAPT loop (ALLOW/MODIFY/REGENERATE/HUMAN)
                                                  ▼
                               Avatar & Voice Engine (Edge-TTS · Visemes · Boards · FFmpeg)
                                                  │
                                                  ▼  WebSocket stream
                                           Classroom (Learner)
                                                  │
                            SQLite WAL  ◄─────────┴────────►  Agent Trace Sink (MLOps)
               (sessions, mastery, skill map, reviews, reports)
```

1. **Ingest:** the learner uploads material or picks a topic. It is parsed, chunked, embedded with BGE-M3 and indexed in ChromaDB.
2. **Plan:** the Planner Agent retrieves grounded context and uses Gemini to build a structured lesson plan.
3. **Explain:** the Explainer writes the script. The media engine renders voice, avatar visemes and visual boards, and FFmpeg composes the video.
4. **Stream:** segments are streamed live to the classroom over WebSocket.
5. **Question & evaluate:** the Questioner asks a checkpoint question. The ML Core grades the answer against a rubric and detects misconceptions.
6. **Adapt:** the Adaptation Controller continues, re-explains, regenerates the path or escalates to a human. The Why-Log records the reason.
7. **Persist & review:** mastery updates the skill map and learning path, spaced reviews are scheduled, and a diagnostic report is generated.

---

## 🛠️ Technologies Used

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, TanStack Query, Motion, React Three Fiber, Lucide, Sonner |
| **Legacy frontend** | Vanilla HTML5 / CSS3 / JavaScript SPA (`modules/frontend`) |
| **Backend** | Python 3.10+, FastAPI, WebSockets, Pydantic, Uvicorn |
| **Database** | SQLite (WAL mode), SQLAlchemy ORM |
| **LLM / Agents** | Google Gemini, custom multi-agent orchestration (FSM) |
| **RAG** | BGE-M3 hybrid embeddings, ChromaDB, cross-encoder reranker |
| **ML / NLP** | Rubric evaluator, misconception taxonomy, concept extraction |
| **Media** | Edge-TTS, viseme generator, LaTeX, Matplotlib, Pygments, Graphviz, FFmpeg |
| **Security** | JWT, rotating refresh tokens, bcrypt, rate limiting, OTP verification |
| **DevOps** | Docker, Docker Compose, Render, pytest |

---

## 📁 Project Structure

```
SHIKSHAK-AI/
├── FRONTEND/                     # Next.js 16 web app (learner, mentor, admin)
│   └── src/
│       ├── app/                  # Routes: dashboard, path, learn, lab, refresh, report, progress…
│       ├── components/           # UI, lesson, lab, layout components
│       ├── features/classroom/   # Live classroom controller + panels
│       └── core/                 # API client, types, i18n (en / hi)
├── modules/
│   ├── backend/                  # FastAPI app: API routes, WebSocket, DB models, services
│   ├── ai_agent_orchestration/   # Agents, prompts, schemas, 7-state FSM orchestrator
│   ├── rag/                      # Parsing, chunking, embedding, indexing, retrieval, grounding
│   ├── ml_core/                  # Answer evaluation, misconceptions, concept extraction
│   ├── avatar_voice/             # TTS, avatar visemes, visual boards, FFmpeg compositor
│   ├── mlops/                    # Agent trace logging
│   └── frontend/                 # Legacy static frontend
├── scripts/                      # Server runner, preflight checks, diagnostics, E2E scripts
├── tests/                        # unit / integration / e2e / smoke / eval suites
├── docs/                         # Architecture, deployment, curriculum, specs, images
├── data/  chroma_db/  models/    # Runtime data, vector store, downloaded models
├── Dockerfile  docker-compose.yml
├── requirements.txt  requirements-lite.txt
└── .env.example
```

---

## ⚙️ Setup & Installation

### Prerequisites

| Tool | Version | Notes |
| :--- | :--- | :--- |
| Python | 3.10+ | Backend and AI modules |
| Node.js | 20+ | Next.js frontend |
| pnpm | 9+ | `npm i -g pnpm` |
| FFmpeg | any recent | Must be on your system `PATH` (video composition) |
| Git | any | |
| Gemini API key | — | Free from [Google AI Studio](https://aistudio.google.com/app/apikey) |

### 1. Clone the repository
```bash
git clone https://github.com/Sagnik120/SHIKSHAK-AI.git
cd SHIKSHAK-AI
```

### 2. Set up the Python backend
```bash
python -m venv .venv

# macOS / Linux
source .venv/bin/activate
# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1

pip install --upgrade pip
pip install -r requirements.txt        # full install (RAG models, media)
# or: pip install -r requirements-lite.txt   # lighter install for low-resource machines
```

Optional: pre-download the embedding and reranker models.
```bash
python scripts/setup_and_download_models.py
```

### 3. Configure environment variables
```bash
# macOS / Linux
cp .env.example .env
# Windows
Copy-Item .env.example .env
```

Edit `.env` and set at least:

| Variable | Required | Description |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | ✅ | Your Google Gemini API key |
| `GEMINI_MODEL` | — | Defaults to `gemini-3.5-flash-lite` |
| `SECRET_KEY` | ✅ | Any long random string (used to sign JWTs) |
| `DATABASE_URL` | — | Defaults to `sqlite:///data/shikshak.db` |
| `SMTP_*` / `RESEND_API_KEY` | — | Email for OTPs. If left blank with `EMAIL_DEV_FALLBACK=true`, OTP codes are returned in the API response (`dev_otp`) for local testing |
| `CHROMA_PERSIST_DIR` | — | Vector store location (default `chroma_db`) |

Generate a secret key:
```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### 4. Set up the Next.js frontend
```bash
cd FRONTEND
pnpm install
cd ..
```
The frontend reaches the backend at `http://localhost:8000` by default. To point it elsewhere, create `FRONTEND/.env.local`:
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 5. (Optional) Verify your setup
```bash
python scripts/preflight_check.py
```

---

## 🚀 How to Run the Project

### Option A: Full stack (recommended)

Use **two terminals**.

**Terminal 1: backend (FastAPI)**
```bash
source .venv/bin/activate
python scripts/run_server.py
# or: uvicorn modules.backend.src.main:app --reload --port 8000
```
➡️ API at **http://localhost:8000** · interactive docs at **http://localhost:8000/docs**

**Terminal 2: frontend (Next.js)**
```bash
cd FRONTEND
pnpm dev
```
➡️ Open **http://localhost:3000** 🎉

### Option B: Backend + legacy static UI only
```bash
python scripts/run_server.py
```
➡️ Open **http://localhost:8000** (the backend serves the static frontend in `modules/frontend`).

### Option C: Docker
```bash
cp .env.example .env     # add GEMINI_API_KEY and SECRET_KEY
docker compose up --build
```
➡️ Open **http://localhost:8000**. Accounts, lessons and the vector store persist in Docker volumes.

### Production build of the frontend
```bash
cd FRONTEND
pnpm build && pnpm start
```

### 🧪 Running tests
```bash
pytest                       # all suites
pytest tests/unit            # fast unit tests
pytest tests/integration     # cross-module tests
python scripts/e2e_full_pipeline.py   # full ingestion → lesson → evaluation pipeline
```

### 🧭 Try it in 2 minutes (judge walkthrough)
1. **Sign up** at `http://localhost:3000` and verify with the OTP (shown on screen in dev mode).
2. Open **Learning path** and choose **"Learn AI from zero"**, or pick any topic on the skill map.
3. Optionally take the **placement check** to skip concepts you already know.
4. Click **Start** on the next step to enter the **Classroom**. Watch the avatar explain with voice and visual boards.
5. Answer a checkpoint question **incorrectly** on purpose and watch the lesson **adapt** in real time.
6. Finish the lesson and open the **Report** for a diagnosis of your strengths, gaps and misconceptions.
7. Explore the **Practice Lab** and **Refresh** (spaced review).

### 🩺 Troubleshooting
| Issue | Fix |
| :--- | :--- |
| `ffmpeg not found` | Install FFmpeg and add it to `PATH` (`brew install ffmpeg` / `choco install ffmpeg` / `apt install ffmpeg`) |
| Frontend can't reach the API | Make sure the backend is on port 8000, or set `NEXT_PUBLIC_BACKEND_URL` |
| Slow first lesson | The embedding models download on first run. Run `scripts/setup_and_download_models.py` beforehand |
| No OTP email | Set `EMAIL_DEV_FALLBACK=true` for local use; the code appears in the response/UI |
| Low memory | Use `requirements-lite.txt` |

---

## 🎥 Demo

### 🎥 Demo video & materials
**[▶️ Watch the demo video and materials on Google Drive](https://drive.google.com/drive/folders/1ibsr1tZanhtruCBbIwiGkAy0mXx35XLY?usp=drive_link)** · **[🌐 Live demo](https://shikshak-ai.onrender.com/)**

---

## 📖 Further Documentation
- [Deployment guide](docs/DEPLOYMENT.md)
- [CBSE AI curriculum alignment](docs/CBSE_AI_CURRICULUM_GUIDE.md)
- [Frontend README](FRONTEND/README.md)
- [Scripts reference](scripts/README.md)
- [Specifications](docs/spec/) · [System docs](docs/system/)

---

## 👥 Team

| Name | GitHub |
| :--- | :--- |
| **Sagnik Chandra** | [@Sagnik120](https://github.com/Sagnik120) |
| **Shrusti Jain** | [@svj31](https://github.com/svj31) |

<div align="center">

**Made with ❤️ for learners everywhere · शिक्षा सबके लिए**

</div>
