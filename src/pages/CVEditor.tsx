import { useState } from 'react';
import { Save, FileText, Sparkles } from 'lucide-react';

export default function CVEditor() {
  const [cv, setCv] = useState({
    name: 'Serdar Saglam',
    headline: 'Informatik-Student & Sales Professional',
    email: 'serdar@example.com',
    summary: 'B.Sc. Informatik TU Darmstadt mit Fortune-500-Sales-Background. Spezialisiert auf Code, Deals & Growth.',
    skills: ['React', 'TypeScript', 'Python', 'Java', 'SQL', 'Salesforce'],
  });

  const handleChange = (field: string, value: string) => {
    setCv((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lebenslauf Editor</h1>
        <p className="text-slate-400 mt-1">Deinen CV anpassen oder KI-generieren lassen</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
          <input
            value={cv.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Headline</label>
          <input
            value={cv.headline}
            onChange={(e) => handleChange('headline', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">E-Mail</label>
          <input
            value={cv.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Zusammenfassung</label>
          <textarea
            value={cv.summary}
            onChange={(e) => handleChange('summary', e.target.value)}
            rows={4}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Skills (durch Komma getrennt)</label>
          <input
            value={cv.skills.join(', ')}
            onChange={(e) => handleChange('skills', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
            <Save className="w-4 h-4" /> Speichern
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">
            <FileText className="w-4 h-4" /> PDF Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium transition-colors">
            <Sparkles className="w-4 h-4" /> KI optimieren
          </button>
        </div>
      </div>
    </div>
  );
}
