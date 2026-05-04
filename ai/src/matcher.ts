import type { Job, MatchBreakdown, MatchResult, UserProfile } from "./types.js";

const SENIORITY_RANK: Record<string, number> = {
  intern: 0,
  junior: 1,
  mid: 2,
  senior: 3,
  lead: 4,
  principal: 5,
};

const WEIGHTS = {
  skills: 0.35,
  experience: 0.15,
  location: 0.1,
  workMode: 0.1,
  employmentType: 0.05,
  seniority: 0.15,
  salary: 0.1,
} as const;

export interface MatchOptions {
  /** Minimum score (0-100) at which `recommend` is set to true. */
  recommendThreshold?: number;
}

export function matchJob(profile: UserProfile, job: Job, options: MatchOptions = {}): MatchResult {
  const threshold = options.recommendThreshold ?? 70;

  const skillsResult = scoreSkills(profile.skills, job);
  const experienceScore = scoreExperience(profile.yearsOfExperience, job);
  const locationScore = scoreLocation(profile.targetLocations, job);
  const workModeScore = scoreWorkMode(profile.preferredWorkModes, job);
  const employmentTypeScore = scoreEmploymentType(profile.preferredEmploymentTypes, job);
  const seniorityScore = scoreSeniority(profile.experienceLevel, job);
  const salaryScore = scoreSalary(profile.minSalary, job);

  const breakdown: MatchBreakdown = {
    skills: round(skillsResult.score),
    experience: round(experienceScore),
    location: round(locationScore),
    workMode: round(workModeScore),
    employmentType: round(employmentTypeScore),
    seniority: round(seniorityScore),
    salary: round(salaryScore),
  };

  const weighted =
    breakdown.skills * WEIGHTS.skills +
    breakdown.experience * WEIGHTS.experience +
    breakdown.location * WEIGHTS.location +
    breakdown.workMode * WEIGHTS.workMode +
    breakdown.employmentType * WEIGHTS.employmentType +
    breakdown.seniority * WEIGHTS.seniority +
    breakdown.salary * WEIGHTS.salary;

  const score = clamp(round(weighted), 0, 100);
  const reasons = buildReasons(breakdown, skillsResult.matched);
  const warnings = buildWarnings(breakdown, profile, job);

  return {
    jobId: job.id,
    userId: profile.id,
    score,
    breakdown,
    matchedSkills: skillsResult.matched,
    missingSkills: skillsResult.missing,
    reasons,
    warnings,
    recommend: score >= threshold && warnings.length < 3,
    computedAt: new Date().toISOString(),
  };
}

export function rankJobs(profile: UserProfile, jobs: Job[], options: MatchOptions = {}): MatchResult[] {
  return jobs
    .map((job) => matchJob(profile, job, options))
    .sort((a, b) => b.score - a.score);
}

interface SkillsResult {
  score: number;
  matched: string[];
  missing: string[];
}

function scoreSkills(profileSkills: string[], job: Job): SkillsResult {
  const required = new Set(
    [...(job.technologies ?? []), ...extractSkillsFromRequirements(job.requirements)].map((s) =>
      s.toLowerCase(),
    ),
  );
  const owned = new Set(profileSkills.map((s) => s.toLowerCase()));

  if (required.size === 0) return { score: 60, matched: [], missing: [] };

  const matched: string[] = [];
  const missing: string[] = [];
  for (const skill of required) {
    if (owned.has(skill)) matched.push(skill);
    else missing.push(skill);
  }

  const coverage = matched.length / required.size;
  return { score: coverage * 100, matched, missing };
}

function scoreExperience(years: number, job: Job): number {
  const required = inferYearsFromText(`${job.description}\n${job.requirements.join("\n")}`);
  if (required == null) return 70;
  if (years >= required) return Math.min(100, 90 + (years - required) * 2);
  const gap = required - years;
  return Math.max(0, 90 - gap * 20);
}

function scoreLocation(targets: string[], job: Job): number {
  if (job.workMode === "remote") return 100;
  if (!job.location) return 60;
  if (targets.length === 0) return 70;
  const jobLoc = job.location.toLowerCase();
  return targets.some((t) => jobLoc.includes(t.toLowerCase())) ? 100 : 30;
}

function scoreWorkMode(preferred: UserProfile["preferredWorkModes"], job: Job): number {
  if (preferred.length === 0) return 80;
  if (!job.workMode) return 60;
  return preferred.includes(job.workMode) ? 100 : 25;
}

function scoreEmploymentType(preferred: UserProfile["preferredEmploymentTypes"], job: Job): number {
  if (preferred.length === 0) return 80;
  if (!job.employmentType) return 60;
  return preferred.includes(job.employmentType) ? 100 : 30;
}

function scoreSeniority(level: UserProfile["experienceLevel"], job: Job): number {
  if (!job.experienceLevel) return 70;
  const userRank = SENIORITY_RANK[level];
  const jobRank = SENIORITY_RANK[job.experienceLevel];
  if (userRank === undefined || jobRank === undefined) return 60;
  const diff = Math.abs(userRank - jobRank);
  if (diff === 0) return 100;
  if (diff === 1) return 75;
  if (diff === 2) return 45;
  return 20;
}

function scoreSalary(minSalary: number | undefined, job: Job): number {
  if (!minSalary) return 70;
  if (job.salaryMax == null && job.salaryMin == null) return 60;
  const offered = job.salaryMax ?? job.salaryMin ?? 0;
  if (offered >= minSalary) return 100;
  const ratio = offered / minSalary;
  return Math.max(0, ratio * 100);
}

function buildReasons(breakdown: MatchBreakdown, matchedSkills: string[]): string[] {
  const reasons: string[] = [];
  if (breakdown.skills >= 75) {
    reasons.push(`Strong skills overlap (${matchedSkills.length} matching technologies).`);
  }
  if (breakdown.seniority >= 90) reasons.push("Seniority level matches the role.");
  if (breakdown.workMode >= 90) reasons.push("Work mode aligns with preferences.");
  if (breakdown.location >= 90) reasons.push("Location matches your target areas.");
  if (breakdown.salary >= 90) reasons.push("Compensation meets or exceeds your minimum.");
  return reasons;
}

function buildWarnings(breakdown: MatchBreakdown, profile: UserProfile, job: Job): string[] {
  const warnings: string[] = [];
  if (breakdown.skills < 40) warnings.push("Significant skills gap detected.");
  if (breakdown.seniority < 50) warnings.push("Seniority mismatch — role may be too junior or too senior.");
  if (breakdown.location < 40 && job.workMode !== "remote") {
    warnings.push("Location is outside your target areas and the role is not remote.");
  }
  if (breakdown.salary < 50 && profile.minSalary) {
    warnings.push("Listed salary is below your stated minimum.");
  }
  if (breakdown.workMode < 40) warnings.push("Work mode does not match your preferences.");
  return warnings;
}

function extractSkillsFromRequirements(requirements: string[]): string[] {
  const tokens = requirements.flatMap((req) =>
    req
      .replace(/[()]/g, " ")
      .split(/[,;/]| and | or /i)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2 && t.length <= 30),
  );
  return tokens;
}

function inferYearsFromText(text: string): number | null {
  const match = text.match(/(\d{1,2})\s*\+?\s*(?:years?|yrs?)/i);
  return match ? Number(match[1]) : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
