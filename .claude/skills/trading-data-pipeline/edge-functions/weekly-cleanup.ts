// weekly-cleanup — 오래된 데이터 정리 + Discord 알림
// Supabase Edge Function (deploy: supabase functions deploy weekly-cleanup)
// pg_cron에서 net.http_post로 호출

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { notifyDiscord } from "../_shared/discord-notify.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async () => {
  const startTime = Date.now();
  try {
    await supabase.rpc("exec_sql", { query: "SELECT trading.cleanup_old_data()" });

    await notifyDiscord({ jobName: "weekly-cleanup", status: "success", rows: 0, elapsedMs: Date.now() - startTime });
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    await notifyDiscord({ jobName: "weekly-cleanup", status: "error", rows: 0, elapsedMs: Date.now() - startTime, errors: [String(e)] });
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
