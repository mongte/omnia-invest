import type { Metadata } from 'next';
import { VirtualTradingView } from '@/views/virtual-trading';

export const metadata: Metadata = {
  title: '가상 투자 | Pharos Lab',
};

export default function VirtualTradingPage() {
  return <VirtualTradingView />;
}
