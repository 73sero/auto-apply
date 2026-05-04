import { randomUUID } from "node:crypto";
import type {
  ContactInfo,
  Education,
  ProjectEntry,
  Resume,
  WorkExperience,
} from "./types.js";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(\+?\d{1,3}[\s-]?)?(\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/;
const LINKEDIN_RE = /(https?:\/\/)?(www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+/i;
const GITHUB_RE = /(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9_-]+/i;
const WEBSITE_RE = /https?:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}(\/[^\s]*)?/i;

const SECTION_HEADERS: Record<string, string[]> = {
  summary: ["summary", "profile", "about", "objective"],
  experience: ["experience", "work experience", "employment", "professional experience"],
  education: ["education", "academic", "qualifications"],
  skills: ["skills", "technical skills", "core competencies", "technologies"],
  projects: ["projects", "personal projects", "selected projects"],
  certifications: ["certifications", "certificates", "licenses"],
  languages: ["languages", "spoken languages"],
};

const KNOWN_SKILLS = [
  "javascript", "typescript", "python", "java", "go", "rust", "c++", "c#", "ruby", "php",
  "react", "vue", "angular", "svelte", "next.js", "nuxt", "remix",
  "node.js", "express", "fastify", "nestjs", "django", "flask", "fastapi", "spring", "rails",
  "postgresql", "mysql", "mongodb", "redis", "sqlite", "elasticsearch",
  "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "ansible",
  "git", "github", "gitlab", "ci/cd", "jenkins",
  "graphql", "rest", "grpc", "websockets",
  "html", "css", "tailwind", "sass", "webpack", "vite",
  "playwright", "cypress", "jest", "vitest", "pytest",
  "openai", "langchain", "tensorflow", "pytorch", "pandas", "numpy",
];

interface ParsedSections {
  summary?: string;
  experience?: string;
  education?: string;
  skills?: string;
  projects?: string;
  certifications?: string;
  languages?: string;
}

export interface ParseResumeOptions {
  userId: string;
  /** Optional override id for the resume record. */
  resumeId?: string;
}

export function parseResume(rawText: string, options: ParseResumeOptions): Resume {
  const text = normalizeText(rawText);
  const sections = splitIntoSections(text);

  const contact = extractContact(text);
  const summary = sections.summary?.trim();
  const skills = extractSkills(sections.skills, text);
  const experience = extractExperience(sections.experience);
  const education = extractEducation(sections.education);
  const projects = extractProjects(sections.projects);
  const certifications = extractList(sections.certifications);
  const languages = extractList(sections.languages);

  const now = new Date().toISOString();

  return {
    id: options.resumeId ?? randomUUID(),
    userId: options.userId,
    rawText: text,
    contact,
    summary,
    skills,
    experience,
    education,
    projects,
    certifications,
    languages,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Placeholder PDF parser. In production this would shell out to a PDF library
 * (pdf-parse, pdfjs-dist) to extract text, then call `parseResume`.
 *
 * For the MVP we accept a Buffer and treat it as UTF-8 text so the pipeline
 * is wired end-to-end without a hard dependency.
 */
export function parsePdfResume(buffer: Buffer, options: ParseResumeOptions): Resume {
  const text = buffer.toString("utf-8");
  return parseResume(text, options);
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[  ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitIntoSections(text: string): ParsedSections {
  const lines = text.split("\n");
  const sections: ParsedSections = {};
  let currentKey: keyof ParsedSections | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (currentKey && buffer.length > 0) {
      sections[currentKey] = buffer.join("\n").trim();
    }
    buffer = [];
  };

  for (const line of lines) {
    const header = matchSectionHeader(line);
    if (header) {
      flush();
      currentKey = header;
      continue;
    }
    if (currentKey) buffer.push(line);
  }
  flush();
  return sections;
}

function matchSectionHeader(line: string): keyof ParsedSections | null {
  const cleaned = line.trim().toLowerCase().replace(/[:.\-_*]+$/g, "").trim();
  if (cleaned.length === 0 || cleaned.length > 40) return null;
  for (const [key, aliases] of Object.entries(SECTION_HEADERS)) {
    if (aliases.includes(cleaned)) return key as keyof ParsedSections;
  }
  return null;
}

function extractContact(text: string): ContactInfo {
  const email = text.match(EMAIL_RE)?.[0];
  const phone = text.match(PHONE_RE)?.[0];
  const linkedin = text.match(LINKEDIN_RE)?.[0];
  const github = text.match(GITHUB_RE)?.[0];
  const websiteMatch = text.match(WEBSITE_RE)?.[0];
  const website =
    websiteMatch && !websiteMatch.includes("linkedin.com") && !websiteMatch.includes("github.com")
      ? websiteMatch
      : undefined;

  const location = extractLocation(text);

  return { email, phone, linkedin, github, website, location };
}

function extractLocation(text: string): string | undefined {
  const firstLines = text.split("\n").slice(0, 8);
  const cityLine = firstLines.find((line) =>
    /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),\s?([A-Z]{2}|[A-Z][a-z]+)\b/.test(line),
  );
  return cityLine?.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),\s?([A-Z]{2}|[A-Z][a-z]+)\b/)?.[0];
}

function extractSkills(skillsSection: string | undefined, fullText: string): string[] {
  const found = new Set<string>();
  const haystack = (skillsSection ?? fullText).toLowerCase();

  for (const skill of KNOWN_SKILLS) {
    const pattern = new RegExp(`(?:^|[^a-z0-9+#.])${escapeRegex(skill)}(?:$|[^a-z0-9+#.])`, "i");
    if (pattern.test(haystack)) found.add(skill);
  }

  if (skillsSection) {
    for (const token of skillsSection.split(/[,•·|\n;]/)) {
      const cleaned = token.trim().replace(/^[-*•]\s*/, "");
      if (cleaned.length >= 2 && cleaned.length <= 40 && /[A-Za-z]/.test(cleaned)) {
        found.add(cleaned.toLowerCase());
      }
    }
  }

  return [...found].sort();
}

function extractExperience(section: string | undefined): WorkExperience[] {
  if (!section) return [];
  const blocks = section.split(/\n\s*\n/).filter((b) => b.trim().length > 0);
  return blocks.map((block) => parseExperienceBlock(block));
}

function parseExperienceBlock(block: string): WorkExperience {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
  const header = lines[0] ?? "";
  const subheader = lines[1] ?? "";

  const dateRange = block.match(
    /(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s?\d{4}|\b\d{4})\s*[-–—to]+\s*(Present|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s?\d{4}|\b\d{4})/i,
  );

  const [titleRaw, companyRaw] = header.split(/\s+(?:at|@|,|—|–|\|)\s+/);
  const title = titleRaw?.trim() ?? "Unknown";
  const company = (companyRaw ?? subheader).trim() || "Unknown";

  const achievements = lines
    .slice(1)
    .filter((line) => /^[-*•]/.test(line))
    .map((line) => line.replace(/^[-*•]\s?/, "").trim());

  const description = lines
    .slice(1)
    .filter((line) => !/^[-*•]/.test(line) && !dateRange?.[0]?.includes(line))
    .join(" ")
    .trim();

  const technologies = inferTechnologies(block);
  const current = /present|current/i.test(dateRange?.[2] ?? "");

  return {
    company,
    title,
    startDate: dateRange?.[1],
    endDate: current ? undefined : dateRange?.[2],
    current,
    description: description || undefined,
    achievements,
    technologies,
  };
}

function extractEducation(section: string | undefined): Education[] {
  if (!section) return [];
  const blocks = section.split(/\n\s*\n/).filter((b) => b.trim().length > 0);
  return blocks.map((block) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const institution = lines[0] ?? "Unknown";
    const degreeLine = lines[1] ?? "";
    const dateRange = block.match(/(\b\d{4})\s*[-–—to]+\s*(Present|\b\d{4})/i);
    const gpaMatch = block.match(/GPA[:\s]+(\d\.\d{1,2})/i);
    const [degree, field] = degreeLine.split(/,\s+|\s+in\s+/i);

    return {
      institution,
      degree: degree?.trim() ?? degreeLine,
      field: field?.trim(),
      startDate: dateRange?.[1],
      endDate: dateRange?.[2],
      gpa: gpaMatch ? Number(gpaMatch[1]) : undefined,
    };
  });
}

function extractProjects(section: string | undefined): ProjectEntry[] {
  if (!section) return [];
  const blocks = section.split(/\n\s*\n/).filter((b) => b.trim().length > 0);
  return blocks.map((block) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const name = lines[0] ?? "Untitled Project";
    const description = lines.slice(1).filter((l) => !/^https?:/i.test(l)).join(" ");
    const url = lines.find((l) => /^https?:/i.test(l));
    return {
      name,
      description: description || undefined,
      technologies: inferTechnologies(block),
      url,
    };
  });
}

function extractList(section: string | undefined): string[] {
  if (!section) return [];
  return section
    .split(/[\n,•·|;]/)
    .map((entry) => entry.replace(/^[-*•]\s*/, "").trim())
    .filter((entry) => entry.length > 0 && entry.length < 80);
}

function inferTechnologies(text: string): string[] {
  const lower = text.toLowerCase();
  return KNOWN_SKILLS.filter((skill) => {
    const pattern = new RegExp(`(?:^|[^a-z0-9+#.])${escapeRegex(skill)}(?:$|[^a-z0-9+#.])`, "i");
    return pattern.test(lower);
  });
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
