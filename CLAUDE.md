# AutoApply Pro — Claude Code Project Context

## Vision
A fully automated job application platform. User uploads CV + career direction → AI scrapes job boards → matches → adapts CV per job → generates cover letters → auto-applies → tracks pipeline (applied, interview, offer, rejected) → CRM dashboard.

## Stack
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS v3 + PWA
- **State:** React Context + localStorage (MVP), later SQLite/PouchDB
- **Backend:** Node/Express API + Playwright (scraping) + OpenAI API (CV/cover letter)
- **Database:** SQLite (local) / IndexedDB (browser fallback)
- **Scrapers:** LinkedIn, Indeed, StepStone, XING (via Playwright + stealth mods)
- **AI:** OpenAI GPT-4o-mini for CV adaptation + cover letters
- **Desktop wrapper:** Tauri (later phase)

## Design System
- Primary: `#0f172a` (slate-900)
- Accent: `#3b82f6` (blue-500)
- Success: `#22c55e` (green-500)
- Warning: `#f59e0b` (amber-500)
- Danger: `#ef4444` (red-500)
- Font: Inter + JetBrains Mono for code

## Architecture
```
App
├── Onboarding (CV upload + goals)
├── Dashboard (job pipeline)
├── Job Discovery (scraper results)
├── Match Review (AI-matched jobs)
├── CV Editor (adapt per job)
├── Cover Letter (generate/edit)
├── Application Tracker (CRM pipeline)
├── Settings (API keys, preferences)
└── Analytics (stats & insights)
```

## Agent Responsibilities
- **Frontend Agent:** React components, routing, state management, PWA
- **Backend Agent:** API routes, scrapers, OpenAI integration
- **CV/Apply Agent:** CV parser, adaptation engine, cover letter generator
- **DB/CRM Agent:** Schema, migrations, pipeline logic, data layer

## Rules
- Use TypeScript everywhere
- Write tests for critical paths
- No secrets in code (use .env)
- Mobile-first responsive design
- Dark mode as default
