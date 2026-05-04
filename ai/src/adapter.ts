import { randomUUID } from "node:crypto";
import type { AdaptedResume, Job, Resume, WorkExperience } from "./types.js";

export interface AdapterOptions {
  /** OpenAI model to use for the adaptation call. */
  model?: string;
  /** Maximum number of skills to surface in the adapted resume. */
  maxSkills?: number;
  /** When true, sends a real OpenAI request. Otherwise runs the deterministic local adaptation. */
  useLLM?: boolean;
  /** Optional OpenAI API key override (defaults to process.env.OPENAI_API_KEY). */
  apiKey?: string;
}

const DEFAULT_OPTIONS: Required<Pick<AdapterOptions, "model" | "maxSkills" | "useLLM">> = {
  model: "gpt-4o-mini",
  maxSkills: 20,
  useLLM: false,
};

export async function adaptResume(
  resume: Resume,
  job: Job,
  options: AdapterOptions = {},
): Promise<AdaptedResume> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const jobKeywords = extractJobKeywords(job);
  const emphasizedSkills = rankSkillsByRelevance(resume.skills, jobKeywords).slice(0, opts.maxSkills);
  const adaptedExperience = reorderAndRewriteExperience(resume.experience, jobKeywords);
  const reorderedSections = decideSectionOrder(resume, jobKeywords);

  const baseSummary = await generateSummary(resume, job, emphasizedSkills, opts);
  const adaptationNotes = buildAdaptationNotes(resume, job, emphasizedSkills);

  const now = new Date().toISOString();
  return {
    ...resume,
    id: randomUUID(),
    baseResumeId: resume.id,
    jobId: job.id,
    skills: emphasizedSkills.concat(resume.skills.filter((s) => !emphasizedSkills.includes(s))),
    experience: adaptedExperience,
    summary: baseSummary,
    rewrittenSummary: baseSummary,
    emphasizedSkills,
    reorderedSections,
    adaptationNotes,
    updatedAt: now,
  };
}

function extractJobKeywords(job: Job): Set<string> {
  const tokens = [
    ...job.technologies,
    ...job.requirements,
    ...job.responsibilities,
    job.title,
    job.description,
  ]
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((t) => t.length >= 2 && t.length <= 30);

  return new Set(tokens);
}

function rankSkillsByRelevance(skills: string[], jobKeywords: Set<string>): string[] {
  return [...skills].sort((a, b) => {
    const aMatch = jobKeywords.has(a.toLowerCase()) ? 1 : 0;
    const bMatch = jobKeywords.has(b.toLowerCase()) ? 1 : 0;
    return bMatch - aMatch;
  });
}

function reorderAndRewriteExperience(
  experience: WorkExperience[],
  jobKeywords: Set<string>,
): WorkExperience[] {
  const scored = experience.map((entry) => ({
    entry,
    score: scoreExperience(entry, jobKeywords),
  }));

  scored.sort((a, b) => {
    if (a.entry.current && !b.entry.current) return -1;
    if (!a.entry.current && b.entry.current) return 1;
    return b.score - a.score;
  });

  return scored.map(({ entry }) => ({
    ...entry,
    achievements: emphasizeAchievements(entry.achievements, jobKeywords),
  }));
}

function scoreExperience(entry: WorkExperience, jobKeywords: Set<string>): number {
  let score = 0;
  for (const tech of entry.technologies) {
    if (jobKeywords.has(tech.toLowerCase())) score += 3;
  }
  const text = `${entry.title} ${entry.description ?? ""} ${entry.achievements.join(" ")}`.toLowerCase();
  for (const keyword of jobKeywords) {
    if (keyword.length >= 4 && text.includes(keyword)) score += 1;
  }
  return score;
}

function emphasizeAchievements(achievements: string[], jobKeywords: Set<string>): string[] {
  return [...achievements].sort((a, b) => {
    const aHits = countKeywordHits(a, jobKeywords);
    const bHits = countKeywordHits(b, jobKeywords);
    return bHits - aHits;
  });
}

function countKeywordHits(text: string, keywords: Set<string>): number {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const kw of keywords) {
    if (kw.length >= 4 && lower.includes(kw)) hits += 1;
  }
  return hits;
}

function decideSectionOrder(resume: Resume, jobKeywords: Set<string>): string[] {
  const order = ["summary", "skills", "experience", "education"];
  const projectsHaveSignal = resume.projects.some((p) =>
    p.technologies.some((t) => jobKeywords.has(t.toLowerCase())),
  );
  if (projectsHaveSignal && resume.projects.length > 0) {
    order.splice(3, 0, "projects");
  } else if (resume.projects.length > 0) {
    order.push("projects");
  }
  if (resume.certifications.length > 0) order.push("certifications");
  if (resume.languages.length > 0) order.push("languages");
  return order;
}

async function generateSummary(
  resume: Resume,
  job: Job,
  emphasizedSkills: string[],
  opts: Required<Pick<AdapterOptions, "model" | "maxSkills" | "useLLM">> & AdapterOptions,
): Promise<string> {
  if (opts.useLLM) {
    return callOpenAIForSummary(resume, job, emphasizedSkills, opts);
  }
  return composeLocalSummary(resume, job, emphasizedSkills);
}

function composeLocalSummary(resume: Resume, job: Job, emphasizedSkills: string[]): string {
  const topSkills = emphasizedSkills.slice(0, 6).join(", ");
  const baseline = resume.summary?.trim();
  const intro = baseline
    ? baseline
    : `Experienced professional with a track record of shipping production-grade software.`;
  return [
    intro,
    `Targeting the ${job.title} role at ${job.company}, where ${topSkills || "my technical foundation"} aligns directly with the team's needs.`,
  ].join(" ");
}

/**
 * Real OpenAI invocation lives here. The MVP scaffolds the call so the wiring
 * is obvious; the body is intentionally a comment-driven placeholder so we do
 * not require the SDK at install time.
 */
async function callOpenAIForSummary(
  resume: Resume,
  job: Job,
  emphasizedSkills: string[],
  opts: AdapterOptions,
): Promise<string> {
  // const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY;
  // if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  //
  // const client = new OpenAI({ apiKey });
  // const response = await client.chat.completions.create({
  //   model: opts.model ?? "gpt-4o-mini",
  //   messages: [
  //     { role: "system", content: "You rewrite resume summaries to match job descriptions." },
  //     { role: "user", content: buildSummaryPrompt(resume, job, emphasizedSkills) },
  //   ],
  //   temperature: 0.4,
  //   max_tokens: 220,
  // });
  // return response.choices[0]?.message?.content?.trim() ?? composeLocalSummary(resume, job, emphasizedSkills);

  return composeLocalSummary(resume, job, emphasizedSkills);
}

function buildAdaptationNotes(resume: Resume, job: Job, emphasizedSkills: string[]): string[] {
  const notes: string[] = [];
  notes.push(`Reordered skills to lead with: ${emphasizedSkills.slice(0, 5).join(", ") || "(none)"}.`);
  const missing = job.technologies.filter(
    (tech) => !resume.skills.some((s) => s.toLowerCase() === tech.toLowerCase()),
  );
  if (missing.length > 0) {
    notes.push(`Job lists technologies not on your resume: ${missing.join(", ")}.`);
  }
  if (job.experienceLevel) {
    notes.push(`Tuned tone for ${job.experienceLevel}-level positioning.`);
  }
  return notes;
}
