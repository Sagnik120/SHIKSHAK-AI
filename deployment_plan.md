# Shikshak AI — Deployment Plan (Vercel + Render, no card, ₹0)

*Free-tier rules checked on 2 Oct 2026. Every number marked **measured** was tested on a copy of this project. Nothing in your repo was changed.*

---

## 1. Verdict

**Yes, it can work: Vercel for the website and Render for the backend. No credit card is needed for either.**
It works only if the backend runs in a **"lite mode"**, because Render's free machine is tiny and the project's default settings need about 3× more memory than it has.

| Part | Host | Free-tier reality (checked Oct 2026) |
|---|---|---|
| Website (`FRONTEND/`, Next.js) | **Vercel Hobby** | 100 GB bandwidth/month, 1M function calls, 100 deploys/day. **Non-commercial use only** (a project demo is fine). No card needed. |
| Backend (FastAPI, lessons, AI, video) | **Render Free web service** | **512 MB RAM, 0.1 CPU**, sleeps after 15 min idle (wakes in 30–60 s), 750 free hours/month, **disk is wiped on every restart/redeploy/sleep**. No card needed. WebSockets work. |
| AI teacher (LLM) | **Google Gemini free key** | No card. About 15 requests/min and 500–1,000 requests/day on Flash-Lite models (sources disagree slightly). If the quota runs out, the app switches to its built-in offline teacher instead of crashing. |
| Keep-awake pinger (optional) | **UptimeRobot free** | 50 monitors, pings every 5 min. Free plan is non-commercial. |

> Bandwidth note: one source says Render's free bandwidth is 5 GB/month (cut in 2026), another says 100 GB. Our videos are small (~0.4 MB per segment in lite mode), so either is plenty.

---

## 2. What I tested (so you don't have to redo things)

I ran the project's own 37-step end-to-end test suite (signup → upload → plan → live classroom over WebSocket → questions → grading → report → resume after disconnect) against a stripped-down copy, on my Mac. Peak memory counts the server plus its ffmpeg child processes.

| Setup | Result |
|---|---|
| **Default settings** (1080p video) | One 40-second clip used **1.5 GB RAM** and **~22 CPU-seconds**. Impossible on 512 MB / 0.1 CPU. |
| Remove the heavy ML libraries only (no code change) | Server runs, **but every document upload fails** with a "503: embedding model unavailable". The app refuses fake embeddings on purpose, so it never pretends to use your document. |
| **Lite mode** (this plan) | **37 of 37 steps passed. Peak memory was 350 MB.** One lite clip used ~90 MB of Python memory. |
| Same lite mode, with scikit-learn added | Peak 423 MB. Too close to the 512 MB limit, so it's left out. |
| Production-mode boot | Passes. Idle memory is ~108 MB. Demo login works. CORS accepts your Vercel URL and Vercel preview URLs and rejects other sites. |
| Frontend `pnpm build` | Passes (18 routes). |

**Not tested:** the real Render machine, or Linux. I ran everything on macOS with Python 3.14, and Render will use Python 3.12 on Linux. Its 0.1 CPU is far slower than my Mac, so expect video to be slow there (see §7). Treat the first Render deploy as the final check.

---

## 3. What "lite mode" means (the honest trade-offs)

You asked to mock or simplify RAG and handle video "in some manner". Lite mode does that with two switches (environment variables). Both are off by default, so **localhost keeps full quality**.

| Feature | On the free online demo (lite) | On localhost (full) |
|---|---|---|
| Sign-up, login, OTP shown on screen, dashboard, reports, progress | ✅ Works the same | ✅ |
| Lesson creation from a **topic** | ✅ Works (Gemini) | ✅ |
| **Document upload → lesson** | ✅ Works with keyword-based retrieval (`EMBEDDING_BACKEND=lexical`): finds passages by word overlap, **not by meaning** | AI-model retrieval (BGE-M3 + reranker) |
| Teaching, checkpoint questions, grading, adaptation, resume | ✅ Works. Grading goes straight to the Gemini judge (the small similarity model is skipped) | ✅ |
| **Video** (`VIDEO_MODE=lite`) | ✅ Real mp4 with **teacher's voice + the board/slide**, low-res, with captions. **No animated talking-head face**; slides only | Full 1080p video with the animated avatar |
| Hindi text on the board | ⚠️ May look unshaped (the Linux package for Hindi shaping can't be installed on Render's Python runtime) | ✅ |

### Ready-to-paste "Resource constraints" text (for README / presentation)
> The live demo runs on free tiers (Vercel + Render: 512 MB RAM, 0.1 CPU). To fit, the hosted build uses
> keyword-based retrieval instead of the BGE-M3 embedding + reranker models, and renders slide-and-voice
> video instead of the 1080p animated-avatar video. The full pipeline (AI-model RAG, avatar video)
> is in the same codebase and runs on localhost. Measured: the full 1080p render needs ~1.5 GB RAM per clip.

---

## 4. The code changes (already made, not committed)

Config alone isn't enough (§2, row 2), so I made a **small change in your working folder** (3 edited files, 3 new files, nothing committed or pushed):

| File | What it does |
|---|---|
| [factory.py](modules/rag/src/embedding/factory.py) | adds the `lexical` option for document search |
| [lexical.py](modules/rag/src/embedding/lexical.py) *(new)* | the keyword-based search itself (no AI model) |
| [ffmpeg_compositor.py](modules/avatar_voice/src/compositor/ffmpeg_compositor.py) | adds lite video (voice + slide, low-res, 1 thread) |
| [avatar factory.py](modules/avatar_voice/src/avatar/factory.py), [null_avatar.py](modules/avatar_voice/src/avatar/null_avatar.py) *(new)* | skips the animated face in lite mode |
| [requirements-lite.txt](requirements-lite.txt) *(new)* | small install list for the hosted backend |

**How localhost vs deployment switching works: one codebase, one branch, no separate deploy branch.** The mode is chosen only by environment variables:

| | Localhost | Deployed (Render) |
|---|---|---|
| `VIDEO_MODE` | not set → full 1080p avatar video | `lite` |
| `EMBEDDING_BACKEND` | not set → BGE-M3 AI retrieval | `lexical` |
| Install file | `requirements.txt` | `requirements-lite.txt` |

If those variables aren't set, the code takes the exact same path as before. I re-ran the project's existing unit tests with default settings to confirm (result in my message to you).

---

## 5. Step-by-step deployment

### Step 0 — Get these ready (10 min) — see also the account checklist in §10
1. **Gemini key:** <https://aistudio.google.com/> → *Get API key* → copy. Keep it private.
2. **Secret key:** run in Terminal and copy the output:
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(64))"
   ```
3. **A private demo password** (e.g. `Demo@Evaluator2026`). The default (`DemoStudent@123`, also for the **admin** demo account) is public in the repo, so don't leave it.

### Step 1 — Push the changes to GitHub (your teammate does this, 5 min)
Render and Vercel deploy from GitHub, so the changes must be on `main` of the repo that the teammate's accounts connect to. I did **not** commit anything. In the project folder:
```bash
git add modules/rag/src/embedding modules/avatar_voice/src requirements-lite.txt deployment_plan.md
git commit -m "Add lite mode for free-tier hosting"
git push origin main
```
(Safe for localhost: defaults are unchanged. If you'd rather review first, push to a branch like `deploy-lite` and deploy that branch instead.)

### Step 2 — Backend on Render (15 min + ~8 min first build)
1. Go to <https://render.com> → **Get Started** → **Sign in with GitHub**. No card is asked for.
2. **New + → Web Service** → connect GitHub → pick `SHIKSHAK-AI`.
3. Fill in:

   | Field | Value |
   |---|---|
   | Name | `shikshak-api` |
   | Branch | `main` |
   | Region | Singapore (closest to India) |
   | Runtime / Language | **Python 3** |
   | Build Command | `pip install --upgrade pip && pip install -r requirements-lite.txt` |
   | Start Command | `python scripts/run_server.py` |
   | Instance Type | **Free** |
   | Health Check Path | `/health` |

4. **Environment Variables** (Advanced → Add):

   | Key | Value |
   |---|---|
   | `PYTHON_VERSION` | `3.12.8` |
   | `ENVIRONMENT` | `production` |
   | `SECRET_KEY` | the secret from Step 0 |
   | `GEMINI_API_KEY` | your Gemini key |
   | `DEFAULT_DEMO_PASSWORD` | your private password from Step 0 |
   | `VIDEO_MODE` | `lite` |
   | `EMBEDDING_BACKEND` | `lexical` |
   | `RERANKER_ENABLED` | `false` |
   | `RENDER_WORKERS` | `1` |
   | `WARM_GRADER` | `false` |
   | `MALLOC_ARENA_MAX` | `2` |
   | `TRUST_PROXY_HEADERS` | `true` |
   | `CORS_ORIGINS` | `https://placeholder.vercel.app` *(fix in Step 4)* |
   | `PUBLIC_BASE_URL` | `https://placeholder.vercel.app` *(fix in Step 4)* |

   Leave all email/SMTP variables empty. The sign-up code (OTP) appears on screen, so no email is needed.
5. Click **Create Web Service**. Watch the **Logs**. After ~5–8 min you'll see "Your service is live".
6. Open `https://shikshak-api.onrender.com/health` (your own URL is shown at the top of the page). You should see `{"status":"ok", ...}` ✅. **Copy this URL.**

### Step 3 — Website on Vercel (10 min)
1. Go to <https://vercel.com/signup> → **Continue with GitHub** → choose **Hobby**.
2. **Add New → Project** → import `SHIKSHAK-AI`.
3. On the configure screen:
   - **Root Directory:** click *Edit* → select **`FRONTEND`** ← important
   - **Framework:** Next.js (auto-detected)
   - **Environment Variables:** `NEXT_PUBLIC_BACKEND_URL` = `https://shikshak-api.onrender.com` (your Render URL, **no trailing `/`**)
4. Click **Deploy** (1–3 min). You get a URL like `https://shikshak-ai-xxxx.vercel.app`. **Copy it.**

### Step 4 — Connect them (5 min)
1. Render → your service → **Environment** → edit:
   - `CORS_ORIGINS` = your exact Vercel URL (no trailing `/`)
   - `PUBLIC_BASE_URL` = same URL
   - Add `CORS_ORIGIN_REGEX` = `^https://<your-vercel-project-name>(-[a-z0-9-]+)?\.vercel\.app$`
2. Save. Render restarts the service automatically (~1 min).

### Step 5 — Keep it awake (optional, recommended, 5 min)
Without this, the first visitor after 15 idle minutes waits 30–60 s **and the disk is wiped** (accounts and lessons reset; the 3 demo accounts are re-created on every start).
1. <https://uptimerobot.com> → sign up (free, no card) → **Add New Monitor**.
2. Type **HTTP(s)**, URL `https://shikshak-api.onrender.com/health`, interval **5 minutes**.
3. One always-on service uses ~744 of the 750 free hours/month, so it fits. Keep it to this one service.

### Step 6 — Test it (10 min)
Open your Vercel URL:
1. ✅ The landing page loads.
2. ✅ **Log in** with `demo@shikshak.ai` and your private demo password. Or sign up: the OTP is shown on screen.
3. ✅ **New lesson** from a topic (e.g. *"Newton's laws"*, short time budget, 5 min) → the plan appears.
4. ✅ Open the classroom → the teacher's voice and board play; answer a checkpoint question.
5. ✅ Upload `demo_data/demo_documnet/Class9_Force_and_Laws_of_Motion.pdf` → lesson from the document.
6. ✅ Finish → the report page shows.

---

## 6. Demo plan (how to present it)

1. **Open the site 2–3 minutes before presenting**, so the backend is awake.
2. **Start the first lesson early** (with a 5-minute budget, about 2 concepts) and talk through the architecture while it prepares.
3. Show the **flow online**: login → topic lesson → voice + board → question → adaptation → report → progress.
4. For **best quality**, run locally (§8) and show: AI-model RAG on an uploaded document, and the animated-avatar video. Say clearly that the online version is the resource-constrained build.
5. Keep a **screen recording** of the full localhost flow as a backup.

---

## 7. Risks and limits (read before demo day)

| Risk | What happens | What to do |
|---|---|---|
| **Slow video on Render** (0.1 CPU, **estimated, not tested on Render**) | Lite video takes ~4 CPU-seconds per 40 s clip on my Mac, so expect roughly **1–2 minutes of waiting per segment** on Render. The code allows up to 180 s per clip. | Use short time budgets; start the lesson early; use the localhost recording if needed. |
| **Voice** (edge-tts calls a Microsoft service) | If Render's network is blocked from it, the app automatically falls back to a synthetic tone voice with captions. | Test once in Step 6. If it's tone-only, say so in the demo; real voice is on localhost. |
| **Data resets** | Free disk is wiped on restart, redeploy or sleep. Lessons made before are gone. | Keep-awake pinger (Step 5); create the demo lesson right before presenting. |
| **Cold start** | 30–60 s first load after sleep | Pinger, or open the site early. |
| **Gemini quota** | If the free quota runs out, the app falls back to the offline teacher (weaker lessons, still works) | Don't run big tests the same day. Add `GEMINI_FALLBACK_MODEL` if you have a second key. |
| **Memory** | Measured: ~265 MB steady (no growth over the whole test) plus a ~70 MB burst while a video is made, so ~350 MB peak in a stress test (~30% spare). Many simultaneous users could still exceed it | Keep `RENDER_WORKERS=1`; demo with one or two people at a time. |
| **Public demo logins** | `demo@`, `teacher@`, `admin@shikshak.ai` exist on a public URL | Use the private password (Step 0). Set `SEED_DEFAULT_USERS=false` if you don't want them at all. |
| **Free-tier rules change** | HF, Oracle and Render all changed in 2026 | Re-check the Render and Vercel pricing pages the day before. |

**Troubleshooting**

| Symptom | Likely cause | Fix |
|---|---|---|
| Browser console (F12) shows a CORS error | `CORS_ORIGINS` doesn't exactly match your Vercel URL | Fix it in Render, no trailing `/`, wait for the restart |
| Site tries to reach `localhost:8000` | `NEXT_PUBLIC_BACKEND_URL` missing at build time | Add it in Vercel → Deployments → **Redeploy** (it needs a rebuild) |
| Render build fails on Python version | `PYTHON_VERSION` not accepted | Pick a version from Render's supported-Python list (3.12.x or 3.13.x) |
| "Out of memory" in Render logs | Too many parallel renders/users | Check `RENDER_WORKERS=1` and `MALLOC_ARENA_MAX=2` are set |
| Upload says "embedding model unavailable" | `EMBEDDING_BACKEND=lexical` not set, or the changes aren't pushed to the branch Render deploys | Check the env var and that Render deploys `main` |
| Classroom stuck "preparing video" for minutes | Slow 0.1 CPU | Wait (up to ~3 min per segment); use a shorter lesson |

---

## 8. Full quality on localhost (nothing to change)

```bash
cd ~/Documents/Projects/SHIKSHAK-AI
cp .env.example .env            # add GEMINI_API_KEY; leave the model settings at their defaults
python scripts/run_server.py    # backend  → http://localhost:8000
cd FRONTEND && pnpm install && pnpm dev   # website → http://localhost:3000
```

---

## 9. Why not the other options?

| Option | Why not |
|---|---|
| Whole app on Vercel | Backend is too big (1.5 GB vs 250 MB limit), needs WebSockets, a writable disk and jobs longer than 60 s |
| Hugging Face Spaces | Since July 2026, Docker Spaces need the $9/month PRO plan. HF's free-inference question doesn't matter here: our models run inside the backend and the LLM is Gemini |
| Oracle Cloud Always Free | Better hardware (12 GB RAM, always on), but **needs a card for identity check**. You ruled that out. Best upgrade path if you ever allow it |
| Koyeb free / Railway | Same 512 MB class; Koyeb now asks for a card |
| Laptop + Cloudflare Tunnel | Works with no card and full quality, but only while your laptop is on and the URL changes each restart. Good as a backup |

### Sources (checked 2 Oct 2026)
- Render: [free web services](https://render.com/docs/free), [free tier 2026 changes](https://agentdeals.dev/vendor/render), [specs and limits](https://www.srvrlss.io/provider/render/)
- Vercel: [limits](https://vercel.com/docs/limits), [fair use / Hobby allotments](https://vercel.com/docs/limits/fair-use-guidelines)
- Gemini API free tier: [limits guide](https://www.scriptbyai.com/gemini-api-free-tier-limits/), [2026 pricing](https://www.cloudzero.com/blog/gemini-pricing/)
- UptimeRobot: [free plan limits](https://stillup.org/blog/uptimerobot-free-plan-limits)
- Hugging Face change: [forum thread](https://discuss.huggingface.co/t/docker-sdk-now-marked-as-paid-when-creating-a-new-space/177580) · Oracle cut: [InfoQ](https://www.infoq.com/news/2026/07/oracle-cloud-free-tier-limits/)

Note: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) is out of date (it describes Hugging Face and the old frontend). Use this plan instead.

---

## 10. Your checklist: accounts and manual actions

Use your **teammate's** accounts (Sagnik120 owns the repo, so no fork is needed). Everything below is free and needs **no card**.

| # | Do this | Where | Time |
|---|---|---|---|
| 1 | Create/confirm a **GitHub** login with push access to `Sagnik120/SHIKSHAK-AI` | github.com | 0–5 min |
| 2 | **Gemini API key** (Google account) | aistudio.google.com → Get API key | 3 min |
| 3 | **Render account**: *Sign in with GitHub*, then allow access to the repo | render.com | 5 min |
| 4 | **Vercel account**: *Continue with GitHub*, choose **Hobby**, allow access to the repo | vercel.com/signup | 5 min |
| 5 | **UptimeRobot account** (optional keep-awake) | uptimerobot.com | 5 min |
| 6 | Generate the **secret key** and choose a **private demo password** (Step 0) | Terminal | 2 min |
| 7 | **Commit and push** the changes (Step 1). I haven't committed anything | Terminal | 5 min |
| 8 | Do Steps 2 → 4 (Render, Vercel, connect them), then the Step 6 test | Browser | ~45 min |

Share the Gemini key and secret key only with whoever does the deployment. Never paste them into code or GitHub.
