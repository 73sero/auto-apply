import { Router, Request, Response } from "express";

type PipelineStatus =
  | "discovered"
  | "matched"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

interface PipelineEntry {
  id: string;
  jobId: string;
  status: PipelineStatus;
  notes?: string;
  updatedAt: string;
}

const pipeline: PipelineEntry[] = [];

const router = Router();

router.get("/pipeline", (_req: Request, res: Response) => {
  res.json({ ok: true, pipeline });
});

router.post("/pipeline", (req: Request, res: Response) => {
  const { jobId, status, notes } = req.body ?? {};
  if (!jobId || !status) {
    return res.status(400).json({ error: "jobId and status are required" });
  }

  const entry: PipelineEntry = {
    id: `pipe-${Date.now()}`,
    jobId,
    status,
    notes,
    updatedAt: new Date().toISOString(),
  };
  pipeline.push(entry);

  res.status(201).json({ ok: true, entry });
});

export default router;
