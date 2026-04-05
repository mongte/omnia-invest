import type { ReactNode } from 'react';
import { SidebarWithPathname, AppHeader } from '@/widgets/app-shell';

interface ShellLayoutProps {
  children: ReactNode;
}

export default function ShellLayout({ children }: ShellLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarWithPathname />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
