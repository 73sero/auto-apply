import { Bell, Menu, Search, Zap } from 'lucide-react';

interface TopbarProps {
  onMenu: () => void;
}

export default function Topbar({ onMenu }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-800 bg-ink-950/80 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        className="btn-ghost h-9 w-9 p-0 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden flex-1 max-w-lg sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input
          type="search"
          placeholder="Search jobs, companies, tags…"
          className="input pl-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button type="button" className="btn-secondary hidden sm:inline-flex">
          <Zap className="h-4 w-4 text-amber-400" />
          Run scrape
        </button>
        <button
          type="button"
          className="btn-ghost relative h-9 w-9 p-0"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-500" />
        </button>
        <div
          className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-800 ring-2 ring-ink-800"
          aria-label="Account"
        />
      </div>
    </header>
  );
}
