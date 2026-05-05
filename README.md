# AutoApply Pro

> AI-powered automated job application platform — scrapes jobs, adapts your CV, generates cover letters, tracks applications.

---

## Quick Start

### Prerequisites
- **Node.js 20+**
- **Rust + Cargo** (for Tauri desktop build)
- **macOS** (primary target platform — Windows/Linux can be added)

### Backend
```bash
cd server
npm install
npx tsc            # compile TypeScript
node dist/index.js # start API on port 4000
```

### Frontend (Dev)
```bash
npm install
npm run dev        # Vite dev server
```

### Desktop App (Tauri)
```bash
npm run build      # build web assets
cd src-tauri && cargo build --release
# .app is in src-tauri/target/release/bundle/macos/
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Desktop | Tauri (Rust) — native macOS `.app` |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite (better-sqlite3) |
| AI | OpenAI GPT-4o-mini (CV adaptation, cover letters) |
| Scraping | Direct APIs (Remotive, RemoteOK, Arbeitnow) + optional SerpAPI/Jooble |

---

## Architecture

```
Desktop App (Tauri WebView)
  └─ React Frontend
       ├─ Dashboard (stats, pipeline overview)
       ├─ Jobs (search, filter, apply)
       ├─ CV Editor (upload, edit, adapt)
       ├─ Cover Letter (generate, templates)
       ├─ Pipeline (Kanban CRM, drag & drop)
       └─ Settings (API keys, preferences)

Backend API (Express, port 4000)
  ├─ /api/scrape/search  → scrape jobs from multiple sources
  ├─ /api/jobs           → list, save jobs
  ├─ /api/pipeline       → application CRUD (DB-backed!)
  ├─ /api/apply          → apply with CV personalization + cover letter
  ├─ /api/cv             → upload, adapt, analyze CVs
  ├─ /api/cv/cover-letter → generate cover letters
  └─ /health             → healthcheck

SQLite Database (db/autoapply.sqlite)
  ├─ users               → single default user (MVP)
  ├─ companies           → job companies
  ├─ jobs                → scraped job postings
  ├─ resumes             → uploaded CVs
  ├─ cover_letters       → generated cover letters
  ├─ applications        → applied jobs (pipeline tracking)
  └─ user_preferences    → settings
```

---

## Job Sources

| Source | Status | Requires API Key |
|--------|--------|-----------------|
| Remotive | Free, working | No |
| RemoteOK | Free, working | No |
| Arbeitnow | Free, working | No |
| Jooble | Working | Yes |
| SerpAPI | Working | Yes |
| Adzuna | Working | Yes |
| LinkedIn | Blocked by Cloudflare | — |
| Indeed | Blocked by Cloudflare | — |
| StepStone | Blocked by Cloudflare | — |
| Xing | Blocked by Cloudflare | — |

---

## Key Features

### 1. Job Search
- Search across 10+ job boards simultaneously
- Filter by match score, remote-only, source, location
- Real job data (no mocks)

### 2. CV Editor
- Upload PDF/TXT/Markdown CVs
- Edit inline with live word count
- AI adaptation per job posting (requires OpenAI key)
- Versions saved to SQLite

### 3. Cover Letter Generator
- 3 templates: formal, modern, creative
- AI-generated based on CV + job description
- Auto-saved to database

### 4. Apply Flow
- Click "Apply" on any job
- Options:
  - Personalize CV (AI rewrites your CV for this job)
  - Generate cover letter (AI writes a tailored letter)
- Application tracked automatically in Pipeline

### 5. Pipeline (Kanban CRM)
- Drag & drop between stages:
  **Applied → Screening → Interview → Offer → Rejected**
- Per-application notes, salary offer, deadline, contact
- Persistent in SQLite (survives app restarts)

---

## Environment Variables

Create `server/.env`:

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173
OPENAI_API_KEY=sk-...          # optional; mock mode if not set
OPENAI_MODEL=gpt-4o-mini
SERPAPI_KEY=...                # optional
JOOBLE_API_KEY=...             # optional
ADZUNA_APP_ID=...              # optional
ADZUNA_APP_KEY=...             # optional
```

---

## Project Structure

```
├── db/
│   ├── schema.sql              # SQLite schema
│   └── autoapply.sqlite        # local DB (gitignored)
├── server/
│   ├── src/
│   │   ├── db.ts              # DB layer (better-sqlite3)
│   │   ├── index.ts           # Express server
│   │   ├── config/env.ts      # env vars
│   │   ├── routes/
│   │   │   ├── scrape.ts      # job scraping
│   │   │   ├── jobs.ts        # job listing/saving
│   │   │   ├── pipeline.ts    # application pipeline (DB-backed)
│   │   │   ├── apply.ts       # apply with CV + CL
│   │   │   └── cv.ts          # CV upload/adapt/analyze
│   │   └── services/
│   │       ├── scrapers.ts    # multi-source scrapers
│   │       └── openai.ts      # OpenAI integration
│   └── package.json
├── src/                        # React frontend
│   ├── pages/
│   │   ├── Jobs.tsx           # job search + apply flow
│   │   ├── CVEditor.tsx       # CV upload/editor
│   │   ├── CoverLetter.tsx    # cover letter generator
│   │   ├── Pipeline.tsx       # kanban board
│   │   ├── Dashboard.tsx      # overview stats
│   │   └── Settings.tsx       # preferences
│   ├── components/            # shared UI components
│   ├── utils/
│   │   ├── api.ts             # API client
│   │   └── pipeline.ts        # pipeline helpers
│   ├── hooks/
│   │   └── useLocalStorage.ts # local storage hook
│   ├── types/
│   │   └── index.ts           # shared TypeScript types
│   └── App.tsx                 # router + layout
├── src-tauri/
│   ├── src/main.rs            # Tauri entry
│   └── Cargo.toml             # Rust deps
├── docs/
│   ├── PROJECT_STATUS.md      # this document
│   ├── ROADMAP.md             # future plans
│   ├── API_REFERENCE.md       # API endpoints
│   ├── DATABASE_SCHEMA.md     # DB tables & relations
│   └── DEVELOPMENT.md         # dev guide
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## Development Notes

### CV Upload → Adapt → Apply Flow
```
1. Upload PDF in CV Editor → parsed by pdf-parse → stored in DB
2. Search jobs in Jobs page → real data from APIs
3. Click "Apply" → dialog opens
4. Options: [x] Personalize CV  [x] Generate Cover Letter
5. Backend:
   - Calls OpenAI to adapt CV (if checked)
   - Calls OpenAI to generate cover letter (if checked)
   - Creates application in DB
   - Returns adapted CV + generated letter
6. Frontend: updates job stage to "applied", saves to localStorage
7. Pipeline: application appears in Kanban "Applied" column
```

### Backend-State Management
- Frontend uses **React Context + localStorage** (MVP)
- Backend uses **SQLite** for persistent data
- Data flows: API → localStorage → UI rendering
- In case of network loss, data is cached locally

---

## License

MIT — built for the job hunt. 🚀
