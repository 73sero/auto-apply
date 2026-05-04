import { Router, Request, Response } from "express";
import { openaiService } from "../services/openai";

const router = Router();

router.post("/analyze", async (req: Request, res: Response) => {
  const { cvText } = req.body ?? {};
  if (typeof cvText !== "string" || cvText.length === 0) {
    return res.status(400).json({ error: "cvText is required" });
  }

  const analysis = await openaiService.analyzeCv(cvText);
  res.json({ ok: true, analysis });
});

router.post("/adapt", async (req: Request, res: Response) => {
  const { cvText, jobDescription } = req.body ?? {};
  if (typeof cvText !== "string" || typeof jobDescription !== "string") {
    return res
      .status(400)
      .json({ error: "cvText and jobDescription are required" });
  }

  const adapted = await openaiService.adaptCv(cvText, jobDescription);
  res.json({ ok: true, adapted });
});

export default router;
