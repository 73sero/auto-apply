import { NavLink } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { navItems } from '@/data/navigation';
import { classNames } from '@/utils/format';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={classNames(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ink-800 bg-ink-900/80 backdrop-blur-md transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-ink-800 px-5">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-ink-50">AutoApply</p>
              <p className="text-[11px] uppercase tracking-wider text-brand-400">Pro</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost h-9 w-9 p-0 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="section-title px-3 pb-2">Workspace</p>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    classNames(
                      'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                      isActive
                        ? 'bg-brand-500/10 text-brand-200 ring-1 ring-inset ring-brand-500/30'
                        : 'text-ink-300 hover:bg-ink-800 hover:text-ink-50',
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-ink-800 p-4">
          <div className="card card-hover p-3">
            <p className="text-xs font-semibold text-ink-100">Auto-apply ready</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-400">
              Connect your CV and pick boards to scrape — we'll handle the rest.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
