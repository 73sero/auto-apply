import express from "express";
import cors from "cors";
import { env } from "./config/env";
import scrapeRouter from "./routes/scrape";
import cvRouter from "./routes/cv";
import applyRouter from "./routes/apply";
import pipelineRouter from "./routes/pipeline";
import jobsRouter from "./routes/jobs";

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, env: env.nodeEnv });
});

app.use("/api/scrape", scrapeRouter);
app.use("/api/cv", cvRouter);
app.use("/api/apply", applyRouter);
app.use("/api/jobs", pipelineRouter);
app.use("/api/jobs", jobsRouter);

app.listen(env.port, () => {
  console.log(`AutoApply API listening on http://localhost:${env.port}`);
});
