export type PipelineStage =
  | 'discovered'
  | 'matched'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'accepted'
  | 'hired'
  | 'rejected'
  | 'withdrew';

export type ApplicationStatus =
  | 'draft'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'withdrew';

export type JobSource =
  | 'linkedin'
  | 'indeed'
  | 'stepstone'
  | 'xing'
  | 'remotive'
  | 'remoteok'
  | 'arbeitnow'
  | 'serpapi'
  | 'jooble'
  | 'other';

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
  status: PipelineStage;
  cvId?: string;
  coverLetterId?: string;
  notes?: string;
  contact?: string;
  deadline?: string;
  salaryOffer?: string;
}

export interface ApplicationWithJob extends Application {
  job: Job;
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

export interface CVVersion {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  jobId?: string;
}

export interface CoverLetterTemplate {
  id: 'formal' | 'modern' | 'creative';
  name: string;
  description: string;
  body: string;
}

export interface PipelineStats {
  totalJobs: number;
  applied: number;
  screening: number;
  interview: number;
  offer: number;
  rejected: number;
}

export interface PipelineResponse {
  stats: PipelineStats;
  applications: Array<Application & { job: Job }>;
}

export interface JobSearchRequest {
  query: string;
  location?: string;
  source?: JobSource | 'all';
}

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  linkedinUrl: string;
}

export interface JobPreferences {
  desiredRole: string;
  preferredLocation: string;
  remotePercentage: number;
  salaryMin: number;
  salaryMax: number;
}

export interface NotificationPreferences {
  emailOnNewMatch: boolean;
  emailOnInterview: boolean;
  emailOnOffer: boolean;
  pushDailyDigest: boolean;
}

export interface AppSettings {
  openAiApiKey: string;
  scrapeSources: JobSource[];
  autoApplyEnabled: boolean;
  dailyApplicationLimit: number;
  preferredLocations: string[];
  remoteOnly: boolean;
  profile: UserProfile;
  jobPreferences: JobPreferences;
  defaultCoverLetterTemplate: 'formal' | 'modern' | 'creative';
  notifications: NotificationPreferences;
}
