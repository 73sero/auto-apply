import { useState } from 'react';
import { Key, Globe, Save } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    openaiKey: '',
    email: 'serdar@example.com',
    language: 'de',
    autoApply: false,
    jobSources: { linkedin: true, indeed: true, stepstone: true, xing: false },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
        <p className="text-slate-400 mt-1">API-Keys, Präferenzen & Automatisierung</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="pb-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">KI & APIs</h3>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">OpenAI API Key</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={settings.openaiKey}
                onChange={(e) => setSettings((s) => ({ ...s, openaiKey: e.target.value }))}
                placeholder="sk-..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Wird ausschließlich lokal gespeichert.</p>
          </div>
        </div>
        <div className="pb-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Profil</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">E-Mail für Bewerbungen</label>
              <input
                value={settings.email}
                onChange={(e) => setSettings((s) => ({ ...s, email: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Sprache</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings((s) => ({ ...s, language: e.target.value }))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="de">Deutsch</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
        <div className="pb-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Job-Quellen</h3>
          <div className="space-y-2">
            {Object.entries(settings.jobSources).map(([source, enabled]) => (
              <label key={source} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      jobSources: { ...s.jobSources, [source]: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600"
                />
                <Globe className="w-4 h-4 text-slate-500" />
                <span className="text-sm capitalize">{source}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoApply}
              onChange={(e) => setSettings((s) => ({ ...s, autoApply: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600"
            />
            <span className="text-sm">Auto-Apply aktivieren (experimentell)</span>
          </label>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
          <Save className="w-4 h-4" /> Speichern
        </button>
      </div>
    </div>
  );
}
