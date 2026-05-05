# API Reference

## Base URL
```
http://localhost:4000
```

---

## Health Check
### GET /health
```json
{ "ok": true, "env": "development" }
```

---

## Jobs

### GET /api/jobs
Query params: `?source=...&company=...&location=...&q=...&limit=...&offset=...`
```json
{ "ok": true, "jobs": [...], "count": 42 }
```

### GET /api/jobs/pipeline
Returns pipeline stats (counts per stage)
```json
{ "ok": true, "stats": { "applied": 5, "screening": 2, ... } }
```

### POST /api/jobs/save
Body: `{ jobId: number }` or `{ job: { title, company, url, ... } }`
```json
{ "ok": true, "jobId": 123 }
```

---

## Scrape / Search

### POST /api/scrape/search
Body:
```json
{
  "query": "software engineer",
  "location": "remote",
  "sources": ["remotive", "remoteok"],
  "limit": 10
}
```
Response:
```json
{
  "ok": true,
  "query": "software engineer",
  "jobs": [
    {
      "id": "123",
      "title": "Senior Frontend Dev",
      "company": "Acme Corp",
      "location": "Remote",
      "remote": true,
      "source": "remotive",
      "url": "https://...",
      "salary": "$120k - $150k",
      "matchScore": 87
    }
  ]
}
```

---

## Pipeline (Applications)

### GET /api/pipeline
```json
{
  "ok": true,
  "applications": [
    {
      "id": 1,
      "job_id": 123,
      "status": "applied",
      "notes": "Follow up in 1 week",
      "job": { "title": "...", "company": "...", ... }
    }
  ]
}
```

### POST /api/pipeline
Body: `{ jobId: number, resumeId?: number, coverLetterId?: number, status: "draft" }`

### PATCH /api/pipeline/:id
Body: `{ status: "interview", notes?: string }`

---

## Apply

### POST /api/apply
Body:
```json
{
  "jobId": 123,
  "cvId": 1,
  "personalizeCv": true,
  "generateCoverLetter": true
}
```
Response:
```json
{
  "ok": true,
  "application": { "id": "1", "status": "applied" },
  "personalizedCv": "Adapted CV text...",
  "generatedLetter": "Dear Hiring Manager...",
  "note": "Application tracked."
}
```

---

## CV

### POST /api/cv/upload
Multipart: `file=...`
Same for text-only: `{ text: "CV content..." }`

### POST /api/cv/adapt
Body: `{ cvId: 1, jobId: 123 }` or `{ cvText: "...", jobDescription: "..." }`

### POST /api/cv/cover-letter
Body: `{ cvId: 1, jobId: 123, template: "formal" }`

### POST /api/cv/analyze
Body: `{ cvText: "..." }`

---

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| PORT | No | API port (default: 4000) |
| CORS_ORIGIN | No | Frontend URL |
| OPENAI_API_KEY | No | OpenAI for AI features |
| OPENAI_MODEL | No | Model (default: gpt-4o-mini) |
| SERPAPI_KEY | No | Google Jobs via SerpAPI |
| JOOBLE_API_KEY | No | Jooble job board |
| ADZUNA_APP_ID | No | Adzuna jobs |
| ADZUNA_APP_KEY | No | Adzuna jobs |
