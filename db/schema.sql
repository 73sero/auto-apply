-- AutoApply Pro - SQLite Schema
-- Status enum implemented via CHECK constraint on applications.status

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS companies (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL UNIQUE,
  website   TEXT,
  notes     TEXT
);

CREATE TABLE IF NOT EXISTS resumes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL,
  content      TEXT NOT NULL,
  parsed_data  TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jobs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL,
  company      TEXT NOT NULL,
  description  TEXT,
  url          TEXT UNIQUE,
  source       TEXT,
  location     TEXT,
  salary       TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cover_letters (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL,
  job_id        INTEGER NOT NULL,
  content       TEXT NOT NULL,
  generated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id)  REFERENCES jobs(id)  ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applications (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER NOT NULL,
  job_id           INTEGER NOT NULL,
  resume_id        INTEGER,
  cover_letter_id  INTEGER,
  status           TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','applied','screening','interview','offer','accepted','rejected','withdrew')),
  salary_requested TEXT,
  notes            TEXT,
  applied_at       TEXT,
  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE,
  FOREIGN KEY (job_id)          REFERENCES jobs(id)          ON DELETE CASCADE,
  FOREIGN KEY (resume_id)       REFERENCES resumes(id)       ON DELETE SET NULL,
  FOREIGN KEY (cover_letter_id) REFERENCES cover_letters(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_applications_user      ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status    ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_job       ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user           ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_job ON cover_letters(user_id, job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company           ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_source            ON jobs(source);

CREATE TRIGGER IF NOT EXISTS trg_applications_updated_at
AFTER UPDATE ON applications
FOR EACH ROW
BEGIN
  UPDATE applications SET updated_at = datetime('now') WHERE id = OLD.id;
END;
