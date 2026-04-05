import type { Metadata } from 'next';
import { DashboardView } from '@/views/dashboard';

export const metadata: Metadata = {
  title: '대시보드 | Pharos Lab',
};

export default function DashboardPage() {
  return <DashboardView />;
}
