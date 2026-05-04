export type PipelineStage =
  | 'discovered'
  | 'matched'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected';

export type JobSource = 'linkedin' | 'indeed' | 'stepstone' | 'xing' | 'other';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  source: JobSource;
  url: string;
  salary?: string;
  postedAt: string;
  matchScore: number;
  stage: PipelineStage;
  tags: string[];
  description?: string;
}

export interface Application {
  id: string;
  jobId: string;
  appliedAt: string;
  cvVersionId?: string;
  coverLetterId?: string;
  notes?: string;
}

export interface CVProfile {
  fullName: string;
  headline: string;
  email: string;
  phone?: string;
  location?: string;
  summary: string;
  skills: string[];
  experience: Array<{
    company: string;
    role: string;
    start: string;
    end?: string;
    bullets: string[];
  }>;
}

export interface AppSettings {
  openAiApiKey: string;
  scrapeSources: JobSource[];
  autoApplyEnabled: boolean;
  dailyApplicationLimit: number;
  preferredLocations: string[];
  remoteOnly: boolean;
}
