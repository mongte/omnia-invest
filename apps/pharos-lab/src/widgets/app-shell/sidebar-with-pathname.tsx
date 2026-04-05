'use client';

import { usePathname } from 'next/navigation';
import { AppSidebar } from './app-sidebar';

export function SidebarWithPathname() {
  const pathname = usePathname();
  return <AppSidebar pathname={pathname} />;
}
