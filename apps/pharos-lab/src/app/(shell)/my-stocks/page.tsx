import { MyStocksView } from '@/views/my-stocks/my-stocks-view';

export default function MyStocksPage() {
  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">내 주식</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          보유 종목을 관리하고 pharos 신호를 확인하세요
        </p>
      </div>
      <MyStocksView />
    </main>
  );
}
