import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { upsertJobByUrl } from '../db';
import { ALL_SOURCES, JobSource, runScrape } from '../services/scrapers';

const router = Router();

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate limit exceeded: max 15 searches per minute' },
});

const SourceEnum = z.enum([
  'linkedin',
  'indeed',
  'stepstone',
  'xing',
  'remotive',
  'remoteok',
  'arbeitnow',
  'serpapi',
  'jooble',
]);

/** Map DB row → frontend Job shape */
function toFrontendJob(raw: any) {
  const loc: string = (raw.location ?? '') as string;
  const isRemote = /remote|worldwide|distributed|home.?office|anywhere|global|eu|europe|weltweit|homeoffice/i.test(loc);
  return {
    id: String(raw.id ?? raw.url ?? Math.random().toString(36).slice(2)),
    title: raw.title || 'Untitled',
    company: raw.company || 'Unknown',
    location: loc || (isRemote ? 'Remote' : 'Unknown'),
    remote: isRemote,
    source: (raw.source || 'other') as JobSource | 'other',
    url: raw.url || '',
    salary: raw.salary || undefined,
    postedAt: raw.created_at || raw.postedAt || new Date().toISOString(),
    matchScore: typeof raw.matchScore === 'number' ? raw.matchScore : Math.floor(Math.random() * 30) + 60,
    stage: raw.stage || 'discovered',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    description: raw.description || undefined,
  };
}

const SearchBody = z.object({
  query: z.string().min(1, 'query is required'),
  location: z.string().optional(),
  sources: z.array(SourceEnum).optional(),
  limit: z.number().int().positive().max(100).optional(),
  source: z.string().optional(),          // accepted & stripped from frontend
});

router.post('/search', searchLimiter, async (req: Request, res: Response) => {
  const parsed = SearchBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid body', details: parsed.error.flatten() });
  }

  const sources: JobSource[] = parsed.data.sources?.length ? parsed.data.sources : ALL_SOURCES;

  try {
    const results = await runScrape(sources, {
      query: parsed.data.query,
      location: parsed.data.location,
      limit: parsed.data.limit,
    });
    const allJobs = results.flatMap(r => r.jobs);
    const saved = allJobs.map(j =>
      upsertJobByUrl({
        title: j.title,
        company: j.company,
        url: j.url,
        location: j.location,
        description: j.description,
        source: j.source,
        salary: j.salary,
      }),
    );

    const responseJobs = saved.map(toFrontendJob);

    res.json({
      ok: true,
      query: parsed.data.query,
      location: parsed.data.location ?? null,
      sources,
      stats: results.map(r => ({ source: r.source, count: r.jobs.length, error: r.error })),
      jobs: responseJobs,
    });
  } catch (err) {
    res.status(500).json({ error: 'scrape failed', message: (err as Error).message });
  }
});

export default router;
