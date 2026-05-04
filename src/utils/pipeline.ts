import type { PipelineStage } from '@/types';

export const pipelineStages: { id: PipelineStage; label: string; tone: string }[] = [
  { id: 'discovered', label: 'Discovered', tone: 'border-ink-700 bg-ink-800/60 text-ink-200' },
  { id: 'matched', label: 'Matched', tone: 'border-brand-500/40 bg-brand-500/10 text-brand-300' },
  { id: 'applied', label: 'Applied', tone: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
  { id: 'interview', label: 'Interview', tone: 'border-violet-500/40 bg-violet-500/10 text-violet-300' },
  { id: 'offer', label: 'Offer', tone: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
  { id: 'rejected', label: 'Rejected', tone: 'border-rose-500/40 bg-rose-500/10 text-rose-300' },
];

export function stageMeta(stage: PipelineStage) {
  return pipelineStages.find((s) => s.id === stage) ?? pipelineStages[0];
}
