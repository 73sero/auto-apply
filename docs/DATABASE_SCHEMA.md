# Database Schema

SQLite database: `db/autoapply.sqlite`

## ERD

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   users     │────<│  resumes    │     │  companies  │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │     │ id (PK)     │
│ email       │     │ user_id (FK)│     │ name (UQ)   │
│ name        │     │ content     │     │ website     │
│ created_at  │     │ parsed_data │     │ notes       │
└─────────────┘     │ created_at  │     └─────────────┘
                    └─────────────┘
                           │
                           │
┌─────────────┐     ┌─────┴───────┐     ┌─────────────┐
│ saved_jobs  │     │applications │     │cover_letters│
├─────────────┤     ├─────────────┤     ├─────────────┤
│ user_id (FK)│     │ id (PK)     │     │ id (PK)     │
│ job_id (FK) │────<│ user_id (FK)│     │ user_id (FK)│
│ saved_at    │     │ job_id (FK) │     │ job_id (FK) │
└─────────────┘     │ resume_id   │     │ content     │
                    │ cover_letter│     │ generated_at│
┌─────────────┐     │ status      │     └─────────────┘
│    jobs     │────<│ salary_req  │
├─────────────┤     │ notes       │     ┌─────────────┐
│ id (PK)     │     │ applied_at  │     │user_prefs   │
│ title       │     │ updated_at  │     ├─────────────┤
│ company     │     └─────────────┘     │ user_id (PK)│
│ description │                           │ titles      │
│ url         │                           │ locations   │
│ source      │                           │ sources     │
│ location    │                           │ min_salary  │
│ salary      │                           │ remote_only │
│ created_at  │                           │ auto_apply  │
└─────────────┘                           └─────────────┘
```

## Tables

### users
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| email | TEXT | |
| name | TEXT | |
| created_at | TEXT | ISO timestamp |

### companies
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| name | TEXT UNIQUE | |
| website | TEXT | nullable |
| notes | TEXT | nullable |

### jobs
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| title | TEXT NOT NULL | |
| company | TEXT NOT NULL | |
| description | TEXT | |
| url | TEXT | |
| source | TEXT | |
| location | TEXT | |
| salary | TEXT | |
| created_at | TEXT | default: now |

### resumes
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER FK → users.id | ON DELETE CASCADE |
| content | TEXT NOT NULL | CV text |
| parsed_data | TEXT | JSON metadata |
| created_at | TEXT | default: now |

### cover_letters
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER FK | |
| job_id | INTEGER FK | |
| content | TEXT NOT NULL | Generated letter |
| generated_at | TEXT | default: now |

### applications (Pipeline)
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER FK | |
| job_id | INTEGER FK | |
| resume_id | INTEGER FK | nullable |
| cover_letter_id | INTEGER FK | nullable |
| status | TEXT NOT NULL | draft/applied/screening/interview/offer/accepted/rejected/withdrew |
| salary_requested | TEXT | nullable |
| notes | TEXT | nullable |
| applied_at | TEXT | nullable |
| updated_at | TEXT | default: now |

### user_preferences
| Column | Type | Notes |
|--------|------|-------|
| user_id | INTEGER PK FK | |
| preferred_titles | TEXT | |
| preferred_locations | TEXT | |
| preferred_sources | TEXT | |
| min_salary | TEXT | |
| remote_only | INTEGER | 0/1 |
| auto_apply | INTEGER | 0/1 |
| updated_at | TEXT | |

### saved_jobs
| Column | Type | Notes |
|--------|------|-------|
| user_id | INTEGER FK | Composite PK |
| job_id | INTEGER FK | Composite PK |
| saved_at | TEXT | |
