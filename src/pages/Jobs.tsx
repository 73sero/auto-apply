import { useState } from 'react';
import { Search, Filter, ExternalLink } from 'lucide-react';
import { mockJobs } from '../data/mockJobs';
import { Job } from '../types';

export default function Jobs() {
  const [filter, setFilter] = useState('');
  const [source, setSource] = useState('all');

  const filtered = mockJobs.filter((j: Job) => {
    const matchesText = `${j.title} ${j.company} ${j.location}`.toLowerCase().includes(filter.toLowerCase());
    const matchesSource = source === 'all' || j.source === source;
    return matchesText && matchesSource;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Jobangebote</h1>
        <p className="text-slate-400 mt-1">Gefundene Stellen von LinkedIn, Indeed & Co.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Suche nach Titel, Firma oder Ort..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Alle Quellen</option>
            <option value="linkedin">LinkedIn</option>
            <option value="indeed">Indeed</option>
            <option value="stepstone">StepStone</option>
          </select>
        </div>
      </div>
      <div className="space-y-3">
        {filtered.map((job: Job) => (
          <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-600 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">{job.title}</h3>
                <p className="text-slate-400 text-sm">{job.company} · {job.location}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {job.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-300">{t}</span>
                  ))}
                  {job.salary && <span className="px-2 py-0.5 bg-green-900/30 text-green-400 rounded text-xs">{job.salary}</span>}
                  <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded text-xs">{job.source}</span>
                  <span className="px-2 py-0.5 bg-amber-900/30 text-amber-400 rounded text-xs">{job.matchScore}% Match</span>
                </div>
              </div>
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-slate-800 rounded-lg transition-colors shrink-0">
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
