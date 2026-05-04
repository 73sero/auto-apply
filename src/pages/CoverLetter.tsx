import { useState } from 'react';
import { Copy, Sparkles, Mail } from 'lucide-react';

export default function CoverLetter() {
  const [letter, setLetter] = useState(
    `Sehr geehrte Damen und Herren,\n\n` +
    `ich freue mich, mich auf die ausgeschriebene Position zu bewerben. ` +
    `Mit meinem Hintergrund in Informatik und praktischer Sales-Erfahrung ` +
    `bringe ich eine einzigartige Kombination aus technischem Know-how und ` +
    `kommunikativer Stärke mit.\n\n` +
    `Ich würde mich freuen, dies in einem persönlichen Gespräch näher vorzustellen.`
  );
  const [targetJob, setTargetJob] = useState('');

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Anschreiben Generator</h1>
        <p className="text-slate-400 mt-1">Passende Anschreiben per KI oder manuell erstellen</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Ziel-Job (Titel oder Firmenname)</label>
          <input
            value={targetJob}
            onChange={(e) => setTargetJob(e.target.value)}
            placeholder="z.B. Software Engineer bei Google"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium transition-colors">
            <Sparkles className="w-4 h-4" /> KI generieren
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">
            <Copy className="w-4 h-4" /> Kopieren
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">
            <Mail className="w-4 h-4" /> Per E-Mail
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Anschreiben</label>
          <textarea
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            rows={14}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
