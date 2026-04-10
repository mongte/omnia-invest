import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/shared/types/supabase';

// GoTrueClient가 Navigator Lock을 steal: true로 요청하면서 경합 에러 발생.
// 싱글턴이므로 인스턴스 경합은 없음 — lock을 no-op으로 대체하여 에러 억제.
// 주의: serialLock은 GoTrueClient의 재진입 lock 패턴과 교착 상태를 일으킴.
function noopLock(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<unknown>,
): Promise<unknown> {
  return fn();
}

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient<Database>>;

let client: SupabaseBrowserClient | null = null;

export function createSupabaseBrowser(): SupabaseBrowserClient {
  if (client) return client;
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        lock: noopLock,
      },
    },
  );
  return client;
}
