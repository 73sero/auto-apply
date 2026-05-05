import Database, { type Database as DB, type Statement } from 'better-sqlite3';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const REPO_ROOT = resolve(__dirname, '..');
const PROJECT_ROOT = resolve(REPO_ROOT, '..');
const SCHEMA_PATH = resolve(PROJECT_ROOT, 'db', 'schema.sql');
const SEED_PATH = resolve(PROJECT_ROOT, 'db', 'seed.sql');
const DEFAULT_DB_PATH = resolve(PROJECT_ROOT, 'db', 'autoapply.sqlite');

export type ApplicationStatus =
  | 'draft'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'withdrew';

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface Company {
  id: number;
  name: string;
  website: string | null;
  notes: string | null;
}

export interface Resume {
  id: number;
  user_id: number;
  content: string;
  parsed_data: string | null;
  created_at: string;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  description: string | null;
  url: string | null;
  source: string | null;
  location: string | null;
  salary: string | null;
  created_at: string;
}

export interface CoverLetter {
  id: number;
  user_id: number;
  job_id: number;
  content: string;
  generated_at: string;
}

export interface Application {
  id: number;
  user_id: number;
  job_id: number;
  resume_id: number | null;
  cover_letter_id: number | null;
  status: ApplicationStatus;
  salary_requested: string | null;
  notes: string | null;
  applied_at: string | null;
  updated_at: string;
}

export interface UserPreferences {
  user_id: number;
  preferred_titles: string | null;
  preferred_locations: string | null;
  preferred_sources: string | null;
  min_salary: string | null;
  remote_only: number;
  auto_apply: number;
  updated_at: string;
}

export interface OpenDbOptions {
  path?: string;
  readonly?: boolean;
  applySchema?: boolean;
  seed?: boolean;
}

let _db: DB | null = null;

const EXTRA_SCHEMA = `
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id              INTEGER PRIMARY KEY,
  preferred_titles     TEXT,
  preferred_locations  TEXT,
  preferred_sources    TEXT,
  min_salary           TEXT,
  remote_only          INTEGER NOT NULL DEFAULT 0,
  auto_apply           INTEGER NOT NULL DEFAULT 0,
  updated_at           TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saved_jobs (
  user_id    INTEGER NOT NULL,
  job_id     INTEGER NOT NULL,
  saved_at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, job_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id)  REFERENCES jobs(id)  ON DELETE CASCADE
);
`;

function ensureDbDir(path: string): void {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function openDb(opts: OpenDbOptions = {}): DB {
  const path = opts.path ?? DEFAULT_DB_PATH;
  ensureDbDir(path);
  const db = new Database(path, { readonly: opts.readonly ?? false });
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  if (opts.applySchema && existsSync(SCHEMA_PATH)) {
    db.exec(readFileSync(SCHEMA_PATH, 'utf8'));
  }
  // Always ensure extension tables exist (added by backend)
  db.exec(EXTRA_SCHEMA);
  if (opts.seed && existsSync(SEED_PATH)) {
    db.exec(readFileSync(SEED_PATH, 'utf8'));
  }
  return db;
}

export function getDb(): DB {
  if (!_db) {
    _db = openDb({ applySchema: true });
    ensureDefaultUser(_db);
  }
  return _db;
}

export function setDb(db: DB): void {
  _db = db;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

const stmtCache = new WeakMap<DB, Map<string, Statement>>();

function prep<T extends unknown[] = unknown[]>(db: DB, sql: string): Statement<T> {
  let cache = stmtCache.get(db);
  if (!cache) {
    cache = new Map();
    stmtCache.set(db, cache);
  }
  let s = cache.get(sql);
  if (!s) {
    s = db.prepare(sql);
    cache.set(sql, s);
  }
  return s as Statement<T>;
}

// ---- Users ----------------------------------------------------------------

export function createUser(input: { email: string; name: string }, db: DB = getDb()): User {
  const info = prep(db, 'INSERT INTO users (email, name) VALUES (?, ?)').run(input.email, input.name);
  return getUserById(Number(info.lastInsertRowid), db)!;
}

export function getUserById(id: number, db: DB = getDb()): User | null {
  return (prep(db, 'SELECT * FROM users WHERE id = ?').get(id) as User | undefined) ?? null;
}

export function getUserByEmail(email: string, db: DB = getDb()): User | null {
  return (prep(db, 'SELECT * FROM users WHERE email = ?').get(email) as User | undefined) ?? null;
}

export function listUsers(db: DB = getDb()): User[] {
  return prep(db, 'SELECT * FROM users ORDER BY id').all() as User[];
}

export function updateUser(
  id: number,
  patch: { email?: string; name?: string },
  db: DB = getDb(),
): User | null {
  const sets: string[] = [];
  const params: unknown[] = [];
  if (patch.email !== undefined) {
    sets.push('email = ?');
    params.push(patch.email);
  }
  if (patch.name !== undefined) {
    sets.push('name = ?');
    params.push(patch.name);
  }
  if (sets.length === 0) return getUserById(id, db);
  params.push(id);
  db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  return getUserById(id, db);
}

/** Ensure there is at least one user (id=1) so single-user MVP routes work. */
export function ensureDefaultUser(db: DB = getDb()): User {
  const existing = getUserById(1, db);
  if (existing) return existing;
  const any = prep(db, 'SELECT * FROM users ORDER BY id LIMIT 1').get() as User | undefined;
  if (any) return any;
  return createUser({ email: 'me@autoapply.local', name: 'Default User' }, db);
}

// ---- Companies ------------------------------------------------------------

export function upsertCompany(
  input: { name: string; website?: string | null; notes?: string | null },
  db: DB = getDb(),
): Company {
  prep(
    db,
    `INSERT INTO companies (name, website, notes) VALUES (?, ?, ?)
     ON CONFLICT(name) DO UPDATE SET
       website = COALESCE(excluded.website, companies.website),
       notes   = COALESCE(excluded.notes,   companies.notes)`,
  ).run(input.name, input.website ?? null, input.notes ?? null);
  return prep(db, 'SELECT * FROM companies WHERE name = ?').get(input.name) as Company;
}

export function listCompanies(db: DB = getDb()): Company[] {
  return prep(db, 'SELECT * FROM companies ORDER BY name').all() as Company[];
}

// ---- Resumes --------------------------------------------------------------

export function createResume(
  input: { user_id: number; content: string; parsed_data?: string | object | null },
  db: DB = getDb(),
): Resume {
  const parsed =
    input.parsed_data == null
      ? null
      : typeof input.parsed_data === 'string'
        ? input.parsed_data
        : JSON.stringify(input.parsed_data);
  const info = prep(db, 'INSERT INTO resumes (user_id, content, parsed_data) VALUES (?, ?, ?)').run(
    input.user_id,
    input.content,
    parsed,
  );
  return prep(db, 'SELECT * FROM resumes WHERE id = ?').get(Number(info.lastInsertRowid)) as Resume;
}

export function getResumeById(id: number, db: DB = getDb()): Resume | null {
  return (prep(db, 'SELECT * FROM resumes WHERE id = ?').get(id) as Resume | undefined) ?? null;
}

export function listResumesForUser(userId: number, db: DB = getDb()): Resume[] {
  return prep(db, 'SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC').all(userId) as Resume[];
}

export function deleteResume(id: number, db: DB = getDb()): boolean {
  const info = prep(db, 'DELETE FROM resumes WHERE id = ?').run(id);
  return info.changes > 0;
}

// ---- Jobs -----------------------------------------------------------------

export function createJob(
  input: {
    title: string;
    company: string;
    description?: string | null;
    url?: string | null;
    source?: string | null;
    location?: string | null;
    salary?: string | null;
  },
  db: DB = getDb(),
): Job {
  const info = prep(
    db,
    `INSERT INTO jobs (title, company, description, url, source, location, salary)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    input.title,
    input.company,
    input.description ?? null,
    input.url ?? null,
    input.source ?? null,
    input.location ?? null,
    input.salary ?? null,
  );
  return prep(db, 'SELECT * FROM jobs WHERE id = ?').get(Number(info.lastInsertRowid)) as Job;
}

/** Insert a job, or return existing job if URL already exists. */
export function upsertJobByUrl(
  input: {
    title: string;
    company: string;
    description?: string | null;
    url?: string | null;
    source?: string | null;
    location?: string | null;
    salary?: string | null;
  },
  db: DB = getDb(),
): Job {
  if (input.url) {
    const existing = getJobByUrl(input.url, db);
    if (existing) return existing;
  }
  return createJob(input, db);
}

export function getJobById(id: number, db: DB = getDb()): Job | null {
  return (prep(db, 'SELECT * FROM jobs WHERE id = ?').get(id) as Job | undefined) ?? null;
}

export function getJobByUrl(url: string, db: DB = getDb()): Job | null {
  return (prep(db, 'SELECT * FROM jobs WHERE url = ?').get(url) as Job | undefined) ?? null;
}

export function listJobs(
  filter: {
    source?: string;
    company?: string;
    location?: string;
    q?: string;
    limit?: number;
    offset?: number;
  } = {},
  db: DB = getDb(),
): Job[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.source) {
    where.push('source = ?');
    params.push(filter.source);
  }
  if (filter.company) {
    where.push('company LIKE ?');
    params.push(`%${filter.company}%`);
  }
  if (filter.location) {
    where.push('COALESCE(location, "") LIKE ?');
    params.push(`%${filter.location}%`);
  }
  if (filter.q) {
    where.push('(title LIKE ? OR COALESCE(description, "") LIKE ? OR company LIKE ?)');
    const term = `%${filter.q}%`;
    params.push(term, term, term);
  }
  let sql =
    'SELECT * FROM jobs' +
    (where.length ? ' WHERE ' + where.join(' AND ') : '') +
    ' ORDER BY created_at DESC';
  if (filter.limit) {
    sql += ' LIMIT ?';
    params.push(filter.limit);
    if (filter.offset) {
      sql += ' OFFSET ?';
      params.push(filter.offset);
    }
  }
  return db.prepare(sql).all(...params) as Job[];
}

export function deleteJob(id: number, db: DB = getDb()): boolean {
  const info = prep(db, 'DELETE FROM jobs WHERE id = ?').run(id);
  return info.changes > 0;
}

// ---- Saved jobs -----------------------------------------------------------

export function saveJobForUser(userId: number, jobId: number, db: DB = getDb()): void {
  prep(db, 'INSERT OR IGNORE INTO saved_jobs (user_id, job_id) VALUES (?, ?)').run(userId, jobId);
}

export function listSavedJobs(userId: number, db: DB = getDb()): Job[] {
  return prep(
    db,
    `SELECT j.* FROM saved_jobs s JOIN jobs j ON j.id = s.job_id
     WHERE s.user_id = ? ORDER BY s.saved_at DESC`,
  ).all(userId) as Job[];
}

// ---- Cover letters --------------------------------------------------------

export function createCoverLetter(
  input: { user_id: number; job_id: number; content: string },
  db: DB = getDb(),
): CoverLetter {
  const info = prep(db, 'INSERT INTO cover_letters (user_id, job_id, content) VALUES (?, ?, ?)').run(
    input.user_id,
    input.job_id,
    input.content,
  );
  return prep(db, 'SELECT * FROM cover_letters WHERE id = ?').get(
    Number(info.lastInsertRowid),
  ) as CoverLetter;
}

export function getCoverLetterById(id: number, db: DB = getDb()): CoverLetter | null {
  return (
    (prep(db, 'SELECT * FROM cover_letters WHERE id = ?').get(id) as CoverLetter | undefined) ?? null
  );
}

// ---- Applications ---------------------------------------------------------

export function createApplication(
  input: {
    user_id: number;
    job_id: number;
    resume_id?: number | null;
    cover_letter_id?: number | null;
    status?: ApplicationStatus;
    salary_requested?: string | null;
    notes?: string | null;
    applied_at?: string | null;
  },
  db: DB = getDb(),
): Application {
  const info = prep(
    db,
    `INSERT INTO applications
       (user_id, job_id, resume_id, cover_letter_id, status, salary_requested, notes, applied_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    input.user_id,
    input.job_id,
    input.resume_id ?? null,
    input.cover_letter_id ?? null,
    input.status ?? 'draft',
    input.salary_requested ?? null,
    input.notes ?? null,
    input.applied_at ?? null,
  );
  return prep(db, 'SELECT * FROM applications WHERE id = ?').get(
    Number(info.lastInsertRowid),
  ) as Application;
}

export function updateApplication(
  id: number,
  patch: {
    status?: ApplicationStatus;
    notes?: string | null;
    salary_requested?: string | null;
    applied_at?: string | null;
    resume_id?: number | null;
    cover_letter_id?: number | null;
  },
  db: DB = getDb(),
): Application | null {
  const sets: string[] = [];
  const params: unknown[] = [];
  if (patch.status !== undefined) {
    sets.push('status = ?');
    params.push(patch.status);
    if (patch.status === 'applied') {
      sets.push("applied_at = COALESCE(applied_at, datetime('now'))");
    }
  }
  if (patch.notes !== undefined) {
    sets.push('notes = ?');
    params.push(patch.notes);
  }
  if (patch.salary_requested !== undefined) {
    sets.push('salary_requested = ?');
    params.push(patch.salary_requested);
  }
  if (patch.applied_at !== undefined) {
    sets.push('applied_at = ?');
    params.push(patch.applied_at);
  }
  if (patch.resume_id !== undefined) {
    sets.push('resume_id = ?');
    params.push(patch.resume_id);
  }
  if (patch.cover_letter_id !== undefined) {
    sets.push('cover_letter_id = ?');
    params.push(patch.cover_letter_id);
  }
  if (sets.length === 0) return getApplicationById(id, db);
  params.push(id);
  db.prepare(`UPDATE applications SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  return getApplicationById(id, db);
}

export function updateApplicationStatus(
  id: number,
  status: ApplicationStatus,
  db: DB = getDb(),
): Application | null {
  return updateApplication(id, { status }, db);
}

export function getApplicationById(id: number, db: DB = getDb()): Application | null {
  return (
    (prep(db, 'SELECT * FROM applications WHERE id = ?').get(id) as Application | undefined) ?? null
  );
}

export interface ApplicationWithJob extends Application {
  job: Job | null;
}

export function getApplicationWithJob(id: number, db: DB = getDb()): ApplicationWithJob | null {
  const app = getApplicationById(id, db);
  if (!app) return null;
  return { ...app, job: getJobById(app.job_id, db) };
}

export function listApplicationsForUser(
  userId: number,
  filter: { status?: ApplicationStatus } = {},
  db: DB = getDb(),
): Application[] {
  if (filter.status) {
    return prep(
      db,
      'SELECT * FROM applications WHERE user_id = ? AND status = ? ORDER BY updated_at DESC',
    ).all(userId, filter.status) as Application[];
  }
  return prep(db, 'SELECT * FROM applications WHERE user_id = ? ORDER BY updated_at DESC').all(
    userId,
  ) as Application[];
}

export function listApplicationsWithJobs(
  userId: number,
  db: DB = getDb(),
): ApplicationWithJob[] {
  const apps = listApplicationsForUser(userId, {}, db);
  return apps.map(a => ({ ...a, job: getJobById(a.job_id, db) }));
}

export function pipelineCounts(
  userId: number,
  db: DB = getDb(),
): Record<ApplicationStatus, number> {
  const rows = prep(
    db,
    'SELECT status, COUNT(*) AS n FROM applications WHERE user_id = ? GROUP BY status',
  ).all(userId) as Array<{ status: ApplicationStatus; n: number }>;
  const out: Record<ApplicationStatus, number> = {
    draft: 0,
    applied: 0,
    screening: 0,
    interview: 0,
    offer: 0,
    accepted: 0,
    rejected: 0,
    withdrew: 0,
  };
  for (const r of rows) out[r.status] = r.n;
  return out;
}

// ---- User preferences -----------------------------------------------------

export function getUserPreferences(userId: number, db: DB = getDb()): UserPreferences {
  const row = prep(db, 'SELECT * FROM user_preferences WHERE user_id = ?').get(userId) as
    | UserPreferences
    | undefined;
  if (row) return row;
  prep(db, 'INSERT INTO user_preferences (user_id) VALUES (?)').run(userId);
  return prep(db, 'SELECT * FROM user_preferences WHERE user_id = ?').get(userId) as UserPreferences;
}

export function updateUserPreferences(
  userId: number,
  patch: {
    preferred_titles?: string | null;
    preferred_locations?: string | null;
    preferred_sources?: string | null;
    min_salary?: string | null;
    remote_only?: boolean | number;
    auto_apply?: boolean | number;
  },
  db: DB = getDb(),
): UserPreferences {
  getUserPreferences(userId, db); // ensure row exists
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const key of [
    'preferred_titles',
    'preferred_locations',
    'preferred_sources',
    'min_salary',
  ] as const) {
    if (patch[key] !== undefined) {
      sets.push(`${key} = ?`);
      params.push(patch[key]);
    }
  }
  if (patch.remote_only !== undefined) {
    sets.push('remote_only = ?');
    params.push(patch.remote_only ? 1 : 0);
  }
  if (patch.auto_apply !== undefined) {
    sets.push('auto_apply = ?');
    params.push(patch.auto_apply ? 1 : 0);
  }
  sets.push("updated_at = datetime('now')");
  params.push(userId);
  db.prepare(`UPDATE user_preferences SET ${sets.join(', ')} WHERE user_id = ?`).run(...params);
  return getUserPreferences(userId, db);
}

// ---- Transactions ---------------------------------------------------------

export function transaction<T>(fn: (db: DB) => T, db: DB = getDb()): T {
  return db.transaction(fn)(db);
}
