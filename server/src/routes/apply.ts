import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  ensureDefaultUser,
  getResumeById,
  getJobById,
  upsertJobByUrl,
  createApplication,
  updateApplication,
  createCoverLetter,
} from '../db';
import { openaiService } from '../services/openai';

const router = Router();

// POST /api/apply - Apply to a job with CV personalization & cover letter
const ApplyBody = z.object({
  jobId: z.number().int().positive().optional().nullable(),
  job: z.object({
    title: z.string().min(1),
    company: z.string().min(1),
    url: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    source: z.string().optional().nullable(),
    salary: z.string().optional().nullable(),
  }).optional(),
  cvId: z.number().int().positive().optional().nullable(),
  coverLetterId: z.number().int().positive().optional().nullable(),
  generateCoverLetter: z.boolean().optional().default(false),
  personalizeCv: z.boolean().optional().default(false),
});

router.post('/', async (req: Request, res: Response) => {
  const parsed = ApplyBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid body', details: parsed.error.flatten() });
  }

  const user = ensureDefaultUser();
  const { jobId, job: jobInput, cvId, coverLetterId, generateCoverLetter: genCL, personalizeCv } = parsed.data;

  try {
    // Find or create job
    let job = jobId ? getJobById(jobId) : null;
    if (!job && jobInput) {
      job = upsertJobByUrl({
        title: jobInput.title,
        company: jobInput.company,
        url: jobInput.url,
        description: jobInput.description,
        location: jobInput.location,
        source: jobInput.source,
        salary: jobInput.salary,
      });
    }
    if (!job) {
      return res.status(404).json({ error: 'job not found' });
    }

    // Get or create application
    let application = createApplication({
      user_id: user.id,
      job_id: job.id,
      resume_id: cvId ?? null,
      cover_letter_id: coverLetterId ?? null,
      status: 'draft',
    });

    let personalizedCv = null;
    let generatedLetter = null;

    // Personalize CV
    if (personalizeCv && cvId) {
      const resume = getResumeById(cvId);
      if (resume) {
        try {
          const jobDescription = [job.title, job.company, job.location, job.description].filter(Boolean).join('\n');
          const adapted = await openaiService.adaptCv(resume.content, jobDescription);
          personalizedCv = adapted.adaptedText;
        } catch (_e) {
          personalizedCv = resume.content;
        }
      }
    }

    // Generate cover letter
    if (genCL) {
      try {
        const resume = cvId ? getResumeById(cvId) : null;
        const jobDescription = [job.title, job.company, job.location, job.description].filter(Boolean).join('\n');
        const result = await openaiService.generateCoverLetter(
          resume?.content || '',
          jobDescription,
        );
        
        const savedCL = createCoverLetter({
          user_id: user.id,
          job_id: job.id,
          content: result.text,
        });
        
        generatedLetter = result.text;
        
        updateApplication(application.id, {
          cover_letter_id: savedCL.id,
        });
      } catch (_e) {
        // Continue without cover letter
      }
    }

    // Update to 'applied' status
    application = updateApplication(application.id, {
      status: 'applied',
      applied_at: new Date().toISOString(),
    })!;

    res.json({
      ok: true,
      application: {
        id: String(application.id),
        jobId: String(application.job_id),
        cvId: application.resume_id ? String(application.resume_id) : null,
        coverLetterId: application.cover_letter_id ? String(application.cover_letter_id) : null,
        status: application.status,
        submittedAt: application.applied_at,
      },
      personalizedCv,
      generatedLetter,
      note: "Application tracked. Auto-submission via Playwright coming soon.",
    });
  } catch (err) {
    res.status(500).json({ error: 'apply failed', message: (err as Error).message });
  }
});

export default router;
