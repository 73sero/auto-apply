import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import CVEditor from './pages/CVEditor';
import CoverLetter from './pages/CoverLetter';
import Pipeline from './pages/Pipeline';
import Settings from './pages/Settings';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/cv" element={<CVEditor />} />
            <Route path="/cover-letter" element={<CoverLetter />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
