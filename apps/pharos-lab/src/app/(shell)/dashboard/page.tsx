import type { Metadata } from 'next';
import { DashboardView } from '@/views/dashboard';
import { fetchRankingList } from '@/shared/api/dashboard';

export const metadata: Metadata = {
  title: '대시보드 | Pharos Lab',
};

export default async function DashboardPage() {
  const initialStocks = await fetchRankingList(50);

  return <DashboardView initialStocks={initialStocks} />;
}
