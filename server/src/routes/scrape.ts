import { Router, Request, Response } from "express";

const router = Router();

router.post("/jobs", (req: Request, res: Response) => {
  const { keywords, location, sources } = req.body ?? {};

  res.json({
    ok: true,
    requested: {
      keywords: keywords ?? [],
      location: location ?? null,
      sources: sources ?? ["linkedin", "indeed", "stepstone", "xing"],
    },
    jobs: [
      {
        id: "stub-1",
        title: "Senior Frontend Engineer",
        company: "Acme GmbH",
        location: "Berlin, DE",
        source: "linkedin",
        url: "https://example.com/jobs/stub-1",
        postedAt: new Date().toISOString(),
      },
    ],
    note: "stub implementation — Playwright scrapers not yet wired",
  });
});

export default router;
