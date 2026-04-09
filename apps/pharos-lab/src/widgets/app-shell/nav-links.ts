import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, TrendingUp } from 'lucide-react';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/virtual-trading', label: '가상 투자', icon: TrendingUp, disabled: true },
];
