import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Search,
  ExternalLink,
  Loader2,
  Send,
  FileText,
  ChevronLeft,
  ChevronRight,
  MapPin,
  X,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { api, ApiError } from '@/utils/api';
import type { Job, JobSearchRequest, JobSource } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const SOURCES: { value: JobSource | 'all'; label: string }[] = [
  { value: 'all', label: 'All sources' },
  { value: 'remotive', label: 'Remotive (Remote)' },
  { value: 'remoteok', label: 'RemoteOK' },
  { value: 'arbeitnow', label: 'Arbeitnow (DE)' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'stepstone', label: 'StepStone' },
  { value: 'xing', label: 'Xing' },
];

const PAGE_SIZE = 8;

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useLocalStorage<Job[]>('autoapply.jobs.v2', []);
  const [loading, setLoading] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [minScore, setMinScore] = useState(0);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [applyModal, setApplyModal] = useState<Job | null>(null);
  const [personalizeCv, setPersonalizeCv] = useState(true);
  const [generateCL, setGenerateCL] = useState(true);

  const { register, handleSubmit } = useForm<JobSearchRequest>({
    defaultValues: { query: '', location: '', source: 'all' },
  });

  const onSearch = async (values: JobSearchRequest) => {
    if (!values.query.trim()) {
      toast.error('Please enter keywords to search.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.jobs.search(values);
      setJobs(data.jobs ?? []);
      setPage(1);
      toast.success(`Found ${data.jobs?.length ?? 0} jobs.`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Search failed';
      toast.error(msg, { description: 'Showing cached results.' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(
    () =>
      jobs.filter(
        (j) => j.matchScore >= minScore && (!remoteOnly || j.remote),
      ),
    [jobs, minScore, remoteOnly],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleApply = async () => {
    if (!applyModal) return;
    setApplyingId(applyModal.id);
    try {
      await api.jobs.apply({
        job: {
          title: applyModal.title,
          company: applyModal.company,
          url: applyModal.url,
          description: applyModal.description,
          location: applyModal.location,
          source: applyModal.source,
          salary: applyModal.salary,
        },
        personalizeCv,
        generateCoverLetter: generateCL,
      });
      toast.success(`Applied to ${applyModal.company}`);
      setJobs((prev) =>
        prev.map((j) => (j.id === applyModal.id ? { ...j, stage: 'applied' } : j)),
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Apply failed';
      toast.error(msg);
    } finally {
      setApplyingId(null);
      setApplyModal(null);
    }
  };

  const handleAdaptCV = (job: Job) => {
    navigate(`/cv?jobId=${encodeURIComponent(job.id)}&title=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        description="Search across multiple remote job boards."
      />

      <form
        onSubmit={handleSubmit(onSearch)}
        className="card p-4 grid grid-cols-1 sm:grid-cols-12 gap-3"
      >
        <div className="sm:col-span-5">
          <label className="label">Keywords</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              {...register('query')}
              placeholder="e.g. React Engineer, Backend Go..."
              className="input pl-9"
            />
          </div>
        </div>
        <div className="sm:col-span-3">
          <label className="label">Location</label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              {...register('location')}
              placeholder="Berlin, Remote, EU..."
              className="input pl-9"
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Source</label>
          <select {...register('source')} className="input">
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2 flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search
          </button>
        </div>
      </form>

      <div className="card p-3 flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-ink-400">Min match</span>
          <input
            type="range"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="accent-brand-500"
          />
          <span className="font-mono text-xs w-9 text-ink-200">{minScore}%</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(e) => setRemoteOnly(e.target.checked)}
            className="h-4 w-4 rounded border-ink-600 bg-ink-800 accent-brand-500"
          />
          <span className="text-ink-300">Remote only</span>
        </label>
        <span className="ml-auto text-ink-500 text-xs">
          {filtered.length} job{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/80 text-ink-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Location</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Salary</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Source</th>
                <th className="px-4 py-3 text-left">Match</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-ink-500">
                    No jobs match your filters.
                  </td>
                </tr>
              )}
              {paged.map((job) => (
                <tr key={job.id} className="hover:bg-ink-900/40">
                  <td className="px-4 py-3 font-medium text-ink-50">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-brand-300 inline-flex items-center gap-1"
                    >
                      {job.title}
                      <ExternalLink className="h-3 w-3 text-ink-500" />
                    </a>
                  </td>
                  <td className="px-4 py-3 text-ink-300">{job.company}</td>
                  <td className="px-4 py-3 text-ink-400 hidden md:table-cell">
                    {job.location}
                    {job.remote && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-emerald-400">
                        Remote
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-400 hidden lg:table-cell">
                    {job.salary ?? '—'}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="badge border-ink-700 bg-ink-800 text-ink-300 capitalize">
                      {job.source}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        job.matchScore >= 85
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                          : job.matchScore >= 70
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                          : 'border-ink-700 bg-ink-800 text-ink-300'
                      }`}
                    >
                      {job.matchScore}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleAdaptCV(job)}
                        className="btn-ghost h-8 px-2 text-xs"
                        title="Adapt CV for this job"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Adapt CV</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setApplyModal(job)}
                        disabled={applyingId === job.id || job.stage === 'applied'}
                        className="btn-primary h-8 px-3 text-xs"
                      >
                        {applyingId === job.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        {job.stage === 'applied' ? 'Applied' : 'Apply'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-ink-800 px-4 py-3 text-xs text-ink-400">
          <span>
            Page {page} / {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-ghost h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {applyModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4"
          onClick={() => setApplyModal(null)}
        >
          <div
            className="card max-w-lg w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-ink-50">{applyModal.title}</h3>
                <p className="text-sm text-ink-400">
                  {applyModal.company} · {applyModal.location}
                </p>
              </div>
              <button onClick={() => setApplyModal(null)} className="btn-ghost h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={personalizeCv}
                  onChange={(e) => setPersonalizeCv(e.target.checked)}
                  className="h-4 w-4 rounded border-ink-600 bg-ink-800 accent-brand-500"
                />
                <span className="text-sm text-ink-200">Personalize CV for this job (AI)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateCL}
                  onChange={(e) => setGenerateCL(e.target.checked)}
                  className="h-4 w-4 rounded border-ink-600 bg-ink-800 accent-brand-500"
                />
                <span className="text-sm text-ink-200">Generate cover letter (AI)</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-ink-800">
              <button onClick={() => setApplyModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleApply} className="btn-primary">
                {applyingId === applyModal.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Apply Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
