import { Router, Request, Response } from "express";

const router = Router();

router.post("/", (req: Request, res: Response) => {
  const { jobId, cvId, coverLetterId } = req.body ?? {};
  if (!jobId) {
    return res.status(400).json({ error: "jobId is required" });
  }

  res.json({
    ok: true,
    application: {
      id: `app-${Date.now()}`,
      jobId,
      cvId: cvId ?? null,
      coverLetterId: coverLetterId ?? null,
      status: "queued",
      submittedAt: null,
    },
    note: "stub implementation — auto-apply pipeline not yet wired",
  });
});

export default router;
