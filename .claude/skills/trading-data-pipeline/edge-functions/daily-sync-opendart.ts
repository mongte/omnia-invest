// daily-sync-opendart — OpenDART 공시 수집 + 분류 + public 동기화
// Supabase Edge Function (deploy: supabase functions deploy daily-sync-opendart)
// Secrets 필요: DART_API_KEY

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
const DART = "https://opendart.fss.or.kr/api";

function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
function esc(s: string | undefined | null): string { return (s || "").replace(/'/g, "''"); }
function fmtDate(d: string): string {
  if (!d || d.length !== 8) return d || "";
  return `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
}
function today8(): string {
  const d = new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
}
function yesterday8(): string {
  const d = new Date(Date.now() - 86400000); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
}

async function execSql(query: string): Promise<void> {
  await supabase.rpc("exec_sql", { query });
}

Deno.serve(async () => {
  let rows = 0;
  const errors: string[] = [];
  try {
    const dartKey = Deno.env.get("DART_API_KEY")!;

    // 1. 공시 수집 + 자동 분류
    try {
      const { data: universe } = await supabase.rpc("get_active_universe");
      const corps = (universe || []).filter((u: Record<string,string|null>) => u.corp_code);
      const bgn = yesterday8();
      const end = today8();
      for (const corp of corps) {
        try {
          const url = `${DART}/list.json?crtfc_key=${dartKey}&corp_code=${corp.corp_code}&bgn_de=${bgn}&end_de=${end}&page_count=20`;
          const res = await fetch(url);
          const d = await res.json();
          if (d.status === "000" && d.list) {
            for (const item of d.list) {
              await execSql(
                `INSERT INTO trading.disclosures (rcept_no,stock_code,corp_code,corp_name,market,report_name,filer_name,rcept_date,disclosure_type) VALUES ('${esc(item.rcept_no)}','${corp.stock_code}','${corp.corp_code}','${esc(item.corp_name)}','KOSPI','${esc(item.report_nm)}','${esc(item.flr_nm)}','${fmtDate(item.rcept_dt)}',trading.classify_disclosure_type('${esc(item.report_nm)}')) ON CONFLICT (rcept_no) DO NOTHING`
              );
              rows++;
            }
          }
        } catch (_) { /* skip */ }
        await sleep(1000);
      }
    } catch (e) { errors.push(`disclosures: ${e}`); }

    // 2. public 동기화
    try {
      await execSql(`SELECT trading.sync_to_public_stocks()`);
      await execSql(`SELECT trading.sync_to_public_disclosures()`);
    } catch (e) { errors.push(`public_sync: ${e}`); }

    // 3. sync_log
    const status = errors.length > 0 ? "partial" : "success";
    const errMsg = errors.length > 0 ? `'${errors.join(";").replace(/'/g,"''").slice(0,500)}'` : "NULL";
    await execSql(`INSERT INTO trading.sync_log (job_name,status,rows_affected,error_message,finished_at) VALUES ('daily-sync-opendart','${status}',${rows},${errMsg},NOW())`);

    return new Response(JSON.stringify({ ok: true, rows, errors }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    try { await execSql(`INSERT INTO trading.sync_log (job_name,status,error_message,finished_at) VALUES ('daily-sync-opendart','error','${String(e).replace(/'/g,"''").slice(0,500)}',NOW())`); } catch (_) {}
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
