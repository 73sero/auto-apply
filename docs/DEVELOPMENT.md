# Development Guide

## File Map

### Frontend (`src/`)
| File | Purpose |
|------|---------|
| App.tsx | Router, sidebar layout, context providers |
| pages/Jobs.tsx | Job search, filtering, apply dialog |
| pages/CVEditor.tsx | CV upload, edit, adapt |
| pages/CoverLetter.tsx | Cover letter generator |
| pages/Pipeline.tsx | Kanban board, drag & drop |
| pages/Dashboard.tsx | Stats overview |
| pages/Settings.tsx | User preferences |
| utils/api.ts | API client (fetch wrapper) |
| utils/pipeline.ts | Pipeline stage definitions |
| types/index.ts | Shared TS interfaces |

### Backend (`server/src/`)
| File | Purpose |
|------|---------|
| index.ts | Express server, route mounting |
| db.ts | SQLite layer, all CRUD |
| config/env.ts | Environment variables |
| routes/scrape.ts | Job search endpoint (multi-source) |
| routes/jobs.ts | Job listing, saving, pipeline stats |
| routes/pipeline.ts | Application CRUD (DB-backed) |
| routes/apply.ts | Apply with CV + cover letter |
| routes/cv.ts | CV upload, adapt, analyze |
| services/scrapers.ts | Multi-source scraper logic |
| services/openai.ts | OpenAI API integration |

### Database (`db/`)
| File | Purpose |
|------|---------|
| schema.sql | Full SQLite DDL |
| autoapply.sqlite | Live database (gitignored) |

---

## How to Add a New Job Source

1. Edit `server/src/services/scrapers.ts`
2. Add `SourceEnum` entry
3. Implement scraper function
4. Add to `ALL_SOURCES` array
5. Update frontend dropdown in `src/pages/Settings.tsx`
6. Update `src/types/index.ts` `JobSource` union

---

## How the Apply Flow Works

```
Frontend (Jobs.tsx)
  user clicks "Apply" on job
  → opens modal with options [Personalize CV] [Generate CL]
  → POST /api/apply

Backend (apply.ts)
  → creates/upserts job in DB
  → creates application row (status=draft)
  → if personalizeCv:
       calls openaiService.adaptCv()
       returns adapted text
  → if generateCoverLetter:
       calls openaiService.generateCoverLetter()
       saves to cover_letters table
  → updates application to status=applied
  → returns { application, personalizedCv, generatedLetter }

Frontend
  → shows success toast
  → updates job stage to "applied" in localStorage
  → user sees application in Pipeline
```

---

## Debugging

### Backend not responding?
```bash
cd server && node dist/index.js
# Check: curl http://localhost:4000/health
```

### Frontend blank / white screen?
- Check `vite.config.ts` has `base: './'`
- Check browser console for CORS errors
- Check `src/utils/api.ts` has correct `API_BASE`

### Pipeline cards not showing?
- Check backend GET /api/pipeline returns `{ applications: [...] }`
- Check localStorage key `autoapply.applications`

---

## Testing

```bash
# Manual API test
curl -X POST http://localhost:4000/api/scrape/search \\
  -H "Content-Type: application/json" \\
  -d '{"query":"software","sources":["remotive"],"limit":5}'

# Test DB query
cd server
node -e "const { getDb } = require('./dist/db'); console.log(getDb().prepare('SELECT COUNT(*) as n FROM jobs').get())"
```
