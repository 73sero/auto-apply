import { useState } from 'react';
import { CheckCircle, Clock, XCircle, ArrowRight, Filter } from 'lucide-react';
import { mockJobs } from '../data/mockJobs';
import { PipelineStage } from '../types';

const stages: { id: PipelineStage; label: string; color: string; icon: any }[] = [
  { id: 'discovered', label: 'Entdeckt', color: 'border-slate-500 text-slate-400', icon: Clock },
  { id: 'matched', label: 'Gematched', color: 'border-blue-500 text-blue-400', icon: ArrowRight },
  { id: 'applied', label: 'Beworben', color: 'border-amber-500 text-amber-400', icon: ArrowRight },
  { id: 'interview', label: 'Interview', color: 'border-purple-500 text-purple-400', icon: ArrowRight },
  { id: 'offer', label: 'Angebot', color: 'border-green-500 text-green-400', icon: CheckCircle },
  { id: 'rejected', label: 'Abgelehnt', color: 'border-red-500 text-red-400', icon: XCircle },
];

export default function Pipeline() {
  const [activeStage, setActiveStage] = useState<PipelineStage | 'all'>('all');
  const jobs = mockJobs;

  const filtered = activeStage === 'all' ? jobs : jobs.filter((j) => j.stage === activeStage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bewerbungs-Pipeline</h1>
        <p className="text-slate-400 mt-1">Verfolge den Status aller Bewerbungen</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveStage('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            activeStage === 'all' ? 'bg-slate-800 border-slate-500' : 'bg-transparent border-slate-700 hover:border-slate-500'
          }`}
        >
          <Filter className="w-3 h-3 inline mr-1" /> Alle
        </button>
        {stages.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStage(s.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                activeStage === s.id ? `bg-slate-800 ${s.color.split(' ')[0]}` : 'bg-transparent border-slate-700 hover:border-slate-500'
              }`}
            >
              <Icon className={`w-3 h-3 inline mr-1`} /> {s.label}
            </button>
          );
        })}
      </div>
      <div className="space-y-3">
        {filtered.map((job) => {
          const stage = stages.find((s) => s.id === job.stage) || stages[0];
          const Icon = stage.icon;
          return (
            <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="text-slate-400 text-sm">{job.company} · {job.location}</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${stage.color} text-xs font-medium`}>
                  <Icon className="w-3 h-3" /> {stage.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
