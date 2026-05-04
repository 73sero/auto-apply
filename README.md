# 🎯 AutoApply Pro

> **AI-powered Job Application Platform** — built for everyone, because finding a job shouldn't be this hard.

## What It Does

1. **📄 Upload Your CV** — PDF or text
2. **🎯 Set Your Direction** — role, location, salary, remote preference
3. **🔍 Scrape Job Boards** — LinkedIn, Indeed, StepStone, Xing...
4. **🤖 AI Matches & Adapts** — CV tailored per job + cover letter generated
5. **📨 Auto-Applies** — submits applications automatically
6. **📊 Track Everything** — pipeline dashboard from applied to hired

## Architecture

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + React Router
- **Backend:** Express.js + TypeScript + SQLite
- **AI:** OpenAI API (GPT-4) for CV adaptation, cover letters, job matching
- **Scraper:** Cheerio + Playwright (headless browser for JS sites)
- **Pipeline:** Kanban-style tracker with salary tracking

## Getting Started

```bash
# Frontend
npm install
npm run dev        # http://localhost:5173

# Backend  
cd server
npm install
npm run dev        # http://localhost:4000
```

## Pages

| Page | Feature |
|------|---------|
| 📊 Dashboard | Stats, recent applications, upcoming interviews |
| 🔍 Jobs | Scrape + search + filter job listings |
| 📝 CV Editor | Upload, edit, AI-adapt per job |
| ✉️ Cover Letter | Auto-generate with AI |
| 🎯 Pipeline | Kanban board: Applied → Interview → Offer |
| ⚙️ Settings | API keys, preferences, account |

## GitHub

🔗 [github.com/73sero/auto-apply](https://github.com/73sero/auto-apply)

---
*Built with Claude Code AI Agents* 🚀
