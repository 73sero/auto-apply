export type ExperienceLevel = "intern" | "junior" | "mid" | "senior" | "lead" | "principal";

export type EmploymentType = "full-time" | "part-time" | "contract" | "freelance" | "internship";

export type WorkMode = "remote" | "hybrid" | "onsite";

export interface ContactInfo {
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  gpa?: number;
}

export interface WorkExperience {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  location?: string;
  description?: string;
  achievements: string[];
  technologies: string[];
}

export interface ProjectEntry {
  name: string;
  description?: string;
  technologies: string[];
  url?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  headline?: string;
  contact: ContactInfo;
  summary?: string;
  targetRoles: string[];
  targetLocations: string[];
  preferredWorkModes: WorkMode[];
  preferredEmploymentTypes: EmploymentType[];
  minSalary?: number;
  currency?: string;
  languages: string[];
  skills: string[];
  yearsOfExperience: number;
  experienceLevel: ExperienceLevel;
}

export interface Resume {
  id: string;
  userId: string;
  rawText: string;
  contact: ContactInfo;
  summary?: string;
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
  projects: ProjectEntry[];
  certifications: string[];
  languages: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  source: "linkedin" | "indeed" | "stepstone" | "xing" | "other";
  externalId?: string;
  url: string;
  title: string;
  company: string;
  location?: string;
  workMode?: WorkMode;
  employmentType?: EmploymentType;
  experienceLevel?: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  postedAt?: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  technologies: string[];
  benefits?: string[];
}

export interface CoverLetter {
  id: string;
  jobId: string;
  resumeId: string;
  recipient?: string;
  subject?: string;
  body: string;
  tone: "formal" | "friendly" | "enthusiastic" | "concise";
  language: string;
  generatedAt: string;
  model?: string;
}

export interface MatchBreakdown {
  skills: number;
  experience: number;
  location: number;
  workMode: number;
  employmentType: number;
  seniority: number;
  salary: number;
}

export interface MatchResult {
  jobId: string;
  userId: string;
  score: number;
  breakdown: MatchBreakdown;
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
  warnings: string[];
  recommend: boolean;
  computedAt: string;
}

export interface AdaptedResume extends Resume {
  jobId: string;
  baseResumeId: string;
  emphasizedSkills: string[];
  rewrittenSummary?: string;
  reorderedSections: string[];
  adaptationNotes: string[];
}
