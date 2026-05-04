import { randomUUID } from "node:crypto";
import type { CoverLetter, Job, Resume } from "./types.js";

export interface CoverLetterOptions {
  tone?: CoverLetter["tone"];
  language?: string;
  recipient?: string;
  /** When true, sends a real OpenAI request. Otherwise composes the deterministic local letter. */
  useLLM?: boolean;
  model?: string;
  apiKey?: string;
  /** Optional candidate name override. Defaults to resume contact email's local-part. */
  candidateName?: string;
}

const DEFAULTS: Required<Pick<CoverLetterOptions, "tone" | "language" | "model" | "useLLM">> = {
  tone: "friendly",
  language: "en",
  model: "gpt-4o-mini",
  useLLM: false,
};

export async function generateCoverLetter(
  resume: Resume,
  job: Job,
  options: CoverLetterOptions = {},
): Promise<CoverLetter> {
  const opts = { ...DEFAULTS, ...options };
  const candidateName = opts.candidateName ?? deriveName(resume);

  const body = opts.useLLM
    ? await callOpenAIForCoverLetter(resume, job, opts, candidateName)
    : composeLocalLetter(resume, job, opts, candidateName);

  return {
    id: randomUUID(),
    jobId: job.id,
    resumeId: resume.id,
    recipient: opts.recipient,
    subject: `Application for ${job.title} at ${job.company}`,
    body,
    tone: opts.tone,
    language: opts.language,
    generatedAt: new Date().toISOString(),
    model: opts.useLLM ? opts.model : "local-template-v1",
  };
}

function composeLocalLetter(
  resume: Resume,
  job: Job,
  opts: Required<Pick<CoverLetterOptions, "tone" | "language" | "model" | "useLLM">> & CoverLetterOptions,
  candidateName: string,
): string {
  const greeting = buildGreeting(opts.recipient, opts.tone);
  const opener = buildOpener(job, opts.tone);
  const fitParagraph = buildFitParagraph(resume, job);
  const evidenceParagraph = buildEvidenceParagraph(resume, job);
  const closer = buildCloser(job, opts.tone);
  const sign = `Best regards,\n${candidateName}`;

  return [greeting, opener, fitParagraph, evidenceParagraph, closer, sign].join("\n\n");
}

function buildGreeting(recipient: string | undefined, tone: CoverLetter["tone"]): string {
  if (recipient) return `Dear ${recipient},`;
  if (tone === "formal") return "Dear Hiring Manager,";
  if (tone === "concise") return "Hello,";
  return "Hi there,";
}

function buildOpener(job: Job, tone: CoverLetter["tone"]): string {
  const enthusiasm =
    tone === "enthusiastic"
      ? "I was genuinely excited"
      : tone === "concise"
        ? "I'm writing"
        : "I'm reaching out";
  return `${enthusiasm} to apply for the ${job.title} position at ${job.company}. The role's focus on ${describeFocus(job)} maps closely to the work I want to be doing next.`;
}

function buildFitParagraph(resume: Resume, job: Job): string {
  const sharedSkills = resume.skills.filter((s) =>
    job.technologies.some((t) => t.toLowerCase() === s.toLowerCase()),
  );
  const skillsSentence =
    sharedSkills.length > 0
      ? `On the technical side, I work day-to-day with ${sharedSkills.slice(0, 5).join(", ")}, which mirrors the stack you describe.`
      : `My background spans ${resume.skills.slice(0, 5).join(", ")}, and I pick up new stacks quickly.`;

  const summarySentence = resume.summary
    ? resume.summary
    : `I've spent the last several years shipping software that has to be reliable, fast, and maintainable.`;

  return `${summarySentence} ${skillsSentence}`;
}

function buildEvidenceParagraph(resume: Resume, job: Job): string {
  const top = resume.experience[0];
  if (!top) {
    return `I'd welcome the chance to walk you through projects I've led that mirror the responsibilities you've outlined.`;
  }
  const achievement =
    top.achievements[0] ??
    top.description ??
    `delivered measurable impact on the team's roadmap`;
  const tieIn = job.responsibilities[0]
    ? ` That experience translates directly into your need to ${lower(job.responsibilities[0])}.`
    : "";
  return `Most recently, as ${top.title} at ${top.company}, I ${lower(achievement).replace(/\.$/, "")}.${tieIn}`;
}

function buildCloser(job: Job, tone: CoverLetter["tone"]): string {
  if (tone === "concise") {
    return `Happy to share more on a call. Thanks for considering my application.`;
  }
  if (tone === "formal") {
    return `I would welcome the opportunity to discuss how my background aligns with ${job.company}'s goals. Thank you for your time and consideration.`;
  }
  return `I'd love to chat about how I can help ${job.company} ship the next chapter of this product. Thanks so much for considering my application.`;
}

function describeFocus(job: Job): string {
  if (job.responsibilities.length > 0) return lower(job.responsibilities[0]!).replace(/\.$/, "");
  if (job.technologies.length > 0) return job.technologies.slice(0, 3).join(", ");
  return "the problem space described in the listing";
}

function deriveName(resume: Resume): string {
  if (resume.contact.email) {
    const local = resume.contact.email.split("@")[0] ?? "Candidate";
    return local
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
  return "Candidate";
}

function lower(text: string): string {
  if (!text) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/**
 * Real OpenAI invocation lives here. The MVP scaffolds the call so the wiring
 * is obvious; the body is intentionally a comment-driven placeholder so we do
 * not require the SDK at install time.
 */
async function callOpenAIForCoverLetter(
  resume: Resume,
  job: Job,
  opts: CoverLetterOptions,
  candidateName: string,
): Promise<string> {
  // const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY;
  // if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  //
  // const client = new OpenAI({ apiKey });
  // const response = await client.chat.completions.create({
  //   model: opts.model ?? "gpt-4o-mini",
  //   messages: [
  //     {
  //       role: "system",
  //       content: `You write tailored cover letters in ${opts.language ?? "en"} with a ${opts.tone ?? "friendly"} tone.`,
  //     },
  //     { role: "user", content: buildCoverLetterPrompt(resume, job, candidateName) },
  //   ],
  //   temperature: 0.6,
  //   max_tokens: 500,
  // });
  // return response.choices[0]?.message?.content?.trim() ?? composeLocalLetter(resume, job, opts as never, candidateName);

  return composeLocalLetter(
    resume,
    job,
    { ...DEFAULTS, ...opts } as Required<Pick<CoverLetterOptions, "tone" | "language" | "model" | "useLLM">> &
      CoverLetterOptions,
    candidateName,
  );
}
