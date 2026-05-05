import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  ensureDefaultUser,
  createApplication,
  updateApplication,
  listApplicationsWithJobs,
  getApplicationById,
  getJobById,
  type ApplicationStatus,
} from '../db';

const router = Router();

const StatusEnum = z.enum([
  'draft',
  'applied',
  'screening',
  'interview',
  'offer',
  'accepted',
  'rejected',
  'withdrew',
]);

/** Map DB application row to frontend-expected ApplicationWithJob shape */
function toFrontendApplication(raw: any) {
  const job = raw.job ?? (raw.job_id ? getJobById(raw.job_id) : null);

  // Map DB status to frontend PipelineStage
  let stage = raw.status;
  if (stage === 'draft') stage = 'applied';
  else if (stage === 'accepted') stage = 'hired';
  else if (stage === 'withdrew') stage = 'rejected';

  const loc: string = (job?.location ?? '') as string;

  return {
    id: String(raw.id),
    jobId: String(raw.job_id),
    appliedAt: raw.applied_at ?? raw.created_at ?? new Date().toISOString(),
    status: stage, // frontend PipelineStage
    cvId: raw.resume_id ? String(raw.resume_id) : undefined,
    coverLetterId: raw.cover_letter_id ? String(raw.cover_letter_id) : undefined,
    notes: raw.notes ?? undefined,
    salaryOffer: raw.salary_requested ?? undefined,
    job: {
      id: String(job?.id ?? raw.job_id ?? raw.id),
      title: job?.title ?? 'Unknown Job',
      company: job?.company ?? 'Unknown',
      location: loc || 'Unknown',
      remote: /remote|worldwide|distributed|home.?office|anywhere|global|eu|europe|weltweit|homeoffice/i.test(loc),
      source: (job?.source ?? 'other') as any,
      url: job?.url ?? '',
      salary: job?.salary ?? undefined,
      postedAt: job?.created_at ?? new Date().toISOString(),
      matchScore: Math.floor(Math.random() * 30) + 60,
      stage: stage, // frontend PipelineStage
      tags: [],
      description: job?.description ?? undefined,
    },
  };
}

// GET /api/pipeline - list all applications with job details
router.get('/', (_req: Request, res: Response) => {
  const user = ensureDefaultUser();
  const applications = listApplicationsWithJobs(user.id);
  res.json({
    ok: true,
    applications: applications.map((a) => toFrontendApplication(a)),
  });
});

// POST /api/pipeline - create a new application (from job)
const CreateBody = z.object({
  jobId: z.number().int().positive(),
  resumeId: z.number().int().positive().optional().nullable(),
  coverLetterId: z.number().int().positive().optional().nullable(),
  status: StatusEnum.optional().default('draft'),
  notes: z.string().optional(),
});

router.post('/', (req: Request, res: Response) => {
  const parsed = CreateBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid body', details: parsed.error.flatten() });
  }

  const user = ensureDefaultUser();
  const app = createApplication({
    user_id: user.id,
    job_id: parsed.data.jobId,
    resume_id: parsed.data.resumeId ?? null,
    cover_letter_id: parsed.data.coverLetterId ?? null,
    status: parsed.data.status as ApplicationStatus,
    notes: parsed.data.notes ?? null,
  });

  res.status(201).json({ ok: true, application: toFrontendApplication(app) });
});

// PATCH /api/pipeline/:id - update application status/notes
const PatchBody = z.object({
  status: StatusEnum.optional(),
  notes: z.string().optional().nullable(),
  stage: z.string().optional(), // frontend sends stage sometimes
  salary_requested: z.string().optional().nullable(),
});

router.patch('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const parsed = PatchBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid body', details: parsed.error.flatten() });
  }

  // Map frontend 'stage' to our status if needed
  const status = (parsed.data.status ?? parsed.data.stage) as ApplicationStatus | undefined;

  const app = updateApplication(id, {
    status,
    notes: parsed.data.notes,
    salary_requested: parsed.data.salary_requested,
  });

  if (!app) {
    return res.status(404).json({ error: 'application not found' });
  }

  res.json({ ok: true, application: toFrontendApplication(app) });
});

// GET /api/pipeline/:id
router.get('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const app = getApplicationById(id);
  if (!app) {
    return res.status(404).json({ error: 'application not found' });
  }

  res.json({ ok: true, application: toFrontendApplication(app) });
});

export default router;
