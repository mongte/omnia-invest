import type { Metadata } from 'next';
import { DashboardView } from '@/views/dashboard';
import { fetchRankingList } from '@/shared/api/dashboard';

export const metadata: Metadata = {
  title: '대시보드 | Pharos Lab',
};

export default async function DashboardPage() {
  const { items: initialStocks } = await fetchRankingList(50, 0);

  return <DashboardView initialStocks={initialStocks} />;
}
