import { Briefcase, TrendingUp, CheckCircle, Clock } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { label: 'Offene Jobs', value: 42, icon: Briefcase, color: 'text-blue-400' },
    { label: 'Bewerbungen', value: 12, icon: CheckCircle, color: 'text-green-400' },
    { label: 'Im Interview', value: 3, icon: TrendingUp, color: 'text-amber-400' },
    { label: 'Ausstehend', value: 5, icon: Clock, color: 'text-slate-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-slate-400 mt-1">Übersicht deiner Job-Suche</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">{s.label}</p>
                <p className="text-3xl font-bold mt-1">{s.value}</p>
              </div>
              <s.icon className={`w-8 h-8 ${s.color}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Letzte Aktivitäten</h2>
          <div className="text-slate-500 text-sm">Noch keine Aktivitäten — starte eine Jobsuche!</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Pipeline Status</h2>
          <div className="text-slate-500 text-sm">Pipeline wird hier angezeigt, sobald du Jobs hinzufügst.</div>
        </div>
      </div>
    </div>
  );
}
