import Database, { type Database as DB, type Statement } from 'better-sqlite3';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const SCHEMA_PATH = resolve(REPO_ROOT, 'db', 'schema.sql');
const SEED_PATH = resolve(REPO_ROOT, 'db', 'seed.sql');
const DEFAULT_DB_PATH = resolve(REPO_ROOT, 'db', 'autoapply.sqlite');

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

export interface OpenDbOptions {
  path?: string;
  readonly?: boolean;
  applySchema?: boolean;
  seed?: boolean;
}

let _db: DB | null = null;

export function openDb(opts: OpenDbOptions = {}): DB {
  const path = opts.path ?? DEFAULT_DB_PATH;
  const db = new Database(path, { readonly: opts.readonly ?? false });
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  if (opts.applySchema && existsSync(SCHEMA_PATH)) {
    db.exec(readFileSync(SCHEMA_PATH, 'utf8'));
  }
  if (opts.seed && existsSync(SEED_PATH)) {
    db.exec(readFileSync(SEED_PATH, 'utf8'));
  }
  return db;
}

export function getDb(): DB {
  if (!_db) {
    _db = openDb({ applySchema: true });
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

export function getJobById(id: number, db: DB = getDb()): Job | null {
  return (prep(db, 'SELECT * FROM jobs WHERE id = ?').get(id) as Job | undefined) ?? null;
}

export function getJobByUrl(url: string, db: DB = getDb()): Job | null {
  return (prep(db, 'SELECT * FROM jobs WHERE url = ?').get(url) as Job | undefined) ?? null;
}

export function listJobs(
  filter: { source?: string; company?: string; limit?: number } = {},
  db: DB = getDb(),
): Job[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.source) {
    where.push('source = ?');
    params.push(filter.source);
  }
  if (filter.company) {
    where.push('company = ?');
    params.push(filter.company);
  }
  const sql =
    'SELECT * FROM jobs' +
    (where.length ? ' WHERE ' + where.join(' AND ') : '') +
    ' ORDER BY created_at DESC' +
    (filter.limit ? ' LIMIT ?' : '');
  if (filter.limit) params.push(filter.limit);
  return db.prepare(sql).all(...params) as Job[];
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

export function updateApplicationStatus(
  id: number,
  status: ApplicationStatus,
  db: DB = getDb(),
): Application | null {
  const appliedAt = status === 'applied' ? `, applied_at = COALESCE(applied_at, datetime('now'))` : '';
  prep(db, `UPDATE applications SET status = ?${appliedAt} WHERE id = ?`).run(status, id);
  return getApplicationById(id, db);
}

export function getApplicationById(id: number, db: DB = getDb()): Application | null {
  return (
    (prep(db, 'SELECT * FROM applications WHERE id = ?').get(id) as Application | undefined) ?? null
  );
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

// ---- Transactions ---------------------------------------------------------

export function transaction<T>(fn: (db: DB) => T, db: DB = getDb()): T {
  return db.transaction(fn)(db);
}
