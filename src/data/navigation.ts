import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Mail,
  KanbanSquare,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/cv', label: 'CV Editor', icon: FileText },
  { to: '/cover-letter', label: 'Cover Letter', icon: Mail },
  { to: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];
