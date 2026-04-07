// monthly-financial-sync — 분기 재무제표 자동 수집
// Supabase Edge Function (deploy: supabase functions deploy monthly-financial-sync)
// Secrets 필요: DART_API_KEY

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { notifyDiscord } from "../_shared/discord-notify.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
const DART = "https://opendart.fss.or.kr/api";

function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
function esc(s: string | undefined | null): string { return (s || "").replace(/'/g, "''"); }

async function execSql(query: string): Promise<void> {
  await supabase.rpc("exec_sql", { query });
}

function getLatestReportPeriod(): { bsns_year: string; reprt_code: string } {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  if (month <= 3) return { bsns_year: String(year - 1), reprt_code: "11014" };
  if (month <= 5) return { bsns_year: String(year), reprt_code: "11013" };
  if (month <= 8) return { bsns_year: String(year), reprt_code: "11012" };
  if (month <= 11) return { bsns_year: String(year), reprt_code: "11014" };
  return { bsns_year: String(year), reprt_code: "11014" };
}

Deno.serve(async () => {
  const startTime = Date.now();
  let rows = 0;
  try {
    const dartKey = Deno.env.get("DART_API_KEY")!;
    const { data: universe } = await supabase.rpc("get_active_universe");
    const corps = (universe || []).filter((u: Record<string,string|null>) => u.corp_code);
    const { bsns_year, reprt_code } = getLatestReportPeriod();

    for (const corp of corps) {
      try {
        const url = `${DART}/fnlttSinglAcntAll.json?crtfc_key=${dartKey}&corp_code=${corp.corp_code}&bsns_year=${bsns_year}&reprt_code=${reprt_code}&fs_div=CFS`;
        const res = await fetch(url);
        const d = await res.json();
        if (d.status === "000" && d.list) {
          for (const item of d.list) {
            const curAmt = item.thstrm_amount ? `${parseInt(item.thstrm_amount.replace(/,/g,''))}` : "NULL";
            const prevAmt = item.frmtrm_amount ? `${parseInt(item.frmtrm_amount.replace(/,/g,''))}` : "NULL";
            const prev2Amt = item.bfefrmtrm_amount ? `${parseInt(item.bfefrmtrm_amount.replace(/,/g,''))}` : "NULL";
            await execSql(
              `INSERT INTO trading.financial_statements (corp_code,stock_code,market,bsns_year,reprt_code,fs_div,sj_div,account_id,account_name,current_amount,prev_amount,prev2_amount,currency,rcept_no,source) VALUES ('${corp.corp_code}','${corp.stock_code}','KOSPI','${bsns_year}','${reprt_code}','CFS','${esc(item.sj_div)}','${esc(item.account_id)}','${esc(item.account_nm)}',${curAmt},${prevAmt},${prev2Amt},'KRW','${esc(item.rcept_no)}','opendart') ON CONFLICT (corp_code,bsns_year,reprt_code,fs_div,sj_div,account_id) DO UPDATE SET current_amount=EXCLUDED.current_amount,prev_amount=EXCLUDED.prev_amount`
            );
            rows++;
          }
        }
      } catch (_) { /* skip */ }
      await sleep(1000);
    }

    await execSql(`INSERT INTO trading.sync_log (job_name,status,rows_affected,finished_at) VALUES ('monthly-financial-sync','success',${rows},NOW())`);
    await notifyDiscord({ jobName: "monthly-financial-sync", status: "success", rows, elapsedMs: Date.now() - startTime });
    return new Response(JSON.stringify({ ok: true, rows }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    await notifyDiscord({ jobName: "monthly-financial-sync", status: "error", rows: 0, elapsedMs: Date.now() - startTime, errors: [String(e)] });
    try { await execSql(`INSERT INTO trading.sync_log (job_name,status,error_message,finished_at) VALUES ('monthly-financial-sync','error','${String(e).replace(/'/g,"''").slice(0,500)}',NOW())`); } catch (_) {}
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
