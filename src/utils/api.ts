/// <reference types="vite/client" />
import type {
  CVVersion,
  Job,
  JobSearchRequest,
  ApplicationWithJob,
  ApplicationStatus,
} from '@/types';

export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:4000';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request(path: string, init: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  };

  const isFormData = init.body instanceof FormData;
  if (init.body && !isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch (err) {
    throw new ApiError(`Network error: ${(err as Error).message}`, 0);
  }

  const contentType = res.headers.get('content-type') ?? '';
  const payload: unknown = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : null) ?? `Request failed with ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return payload;
}

export const api = {
  pipeline: {
    get: () => request('/api/pipeline') as Promise<{ applications: ApplicationWithJob[] }>,
    update: (id: string, status: ApplicationStatus, notes?: string) =>
      request(`/api/pipeline/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      }),
    create: (jobId: number, resumeId?: number | null, coverLetterId?: number | null) =>
      request('/api/pipeline', {
        method: 'POST',
        body: JSON.stringify({ jobId, resumeId, coverLetterId }),
      }),
  },
  jobs: {
    search: (body: JobSearchRequest) =>
      request('/api/scrape/search', {
        method: 'POST',
        body: JSON.stringify(body),
      }) as Promise<{ jobs: Job[] }>,
    apply: (params: {
      jobId?: string | number;
      job?: { title: string; company: string; url?: string; description?: string; location?: string; source?: string; salary?: string };
      cvId?: string | number;
      coverLetterId?: string | number;
      personalizeCv?: boolean;
      generateCoverLetter?: boolean;
    }) =>
      request('/api/apply', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  },
  cv: {
    upload: async (form: FormData): Promise<CVVersion> => {
      const raw = await request('/api/cv/upload', {
        method: 'POST',
        body: form,
      });
      return {
        id: String(raw.id),
        name: raw.name,
        content: raw.content,
        createdAt: new Date().toISOString(),
      };
    },
    adapt: (cvId: string, jobId: string) =>
      request('/api/cv/adapt', {
        method: 'POST',
        body: JSON.stringify({ cvId, jobId }),
      }),
    coverLetter: (params: {
      jobId?: string;
      company: string;
      position: string;
      template: 'formal' | 'modern' | 'creative';
      cvSummary?: string;
    }) =>
      request('/api/cv/cover-letter', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  },
};
