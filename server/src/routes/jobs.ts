import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    jobs: [],
    note: "stub implementation — job store not yet wired",
  });
});

export default router;
