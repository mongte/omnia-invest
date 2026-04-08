-- ============================================================
-- Trading Data Pipeline - 전체 DB 마이그레이션
-- 새 환경에서 1회 실행. Supabase SQL Editor 또는 MCP execute_sql 사용.
-- ============================================================

-- 1. 확장 설치
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. trading 스키마
CREATE SCHEMA IF NOT EXISTS trading;

-- 3. 테이블
CREATE TABLE IF NOT EXISTS trading.watch_universe (
  id            BIGSERIAL PRIMARY KEY,
  stock_code    TEXT        NOT NULL,
  corp_code     TEXT,
  corp_name     TEXT        NOT NULL,
  market        TEXT        NOT NULL DEFAULT 'KOSPI',
  universe_type TEXT        NOT NULL DEFAULT 'volume_top200',
  rank          INT,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  selected_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deselected_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (stock_code, market, universe_type)
);

CREATE TABLE IF NOT EXISTS trading.stock_fundamentals (
  id            BIGSERIAL PRIMARY KEY,
  stock_code    TEXT        NOT NULL,
  market        TEXT        NOT NULL DEFAULT 'KOSPI',
  corp_name     TEXT,
  fetch_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  base_price    BIGINT,
  cur_price     BIGINT,
  per           NUMERIC(10,2),
  pbr           NUMERIC(10,2),
  eps           BIGINT,
  bps           BIGINT,
  roe           NUMERIC(10,2),
  market_cap    BIGINT,
  shares_float  BIGINT,
  foreign_ratio NUMERIC(8,2),
  week52_high   BIGINT,
  week52_low    BIGINT,
  change_rate   NUMERIC(8,4),
  volume        BIGINT,
  source        TEXT        NOT NULL DEFAULT 'kiwoom',
  raw_data      JSONB,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (stock_code, market, fetch_date)
);

CREATE TABLE IF NOT EXISTS trading.ohlcv_daily (
  id            BIGSERIAL PRIMARY KEY,
  stock_code    TEXT        NOT NULL,
  market        TEXT        NOT NULL DEFAULT 'KOSPI',
  trade_date    DATE        NOT NULL,
  open_price    BIGINT      NOT NULL,
  high_price    BIGINT      NOT NULL,
  low_price     BIGINT      NOT NULL,
  close_price   BIGINT      NOT NULL,
  volume        BIGINT      NOT NULL DEFAULT 0,
  trading_value BIGINT,
  change_rate   NUMERIC(8,4),
  prev_close    BIGINT,
  source        TEXT        NOT NULL DEFAULT 'kiwoom',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (stock_code, market, trade_date)
);

CREATE TABLE IF NOT EXISTS trading.ohlcv_snapshot (
  id            BIGSERIAL PRIMARY KEY,
  stock_code    TEXT        NOT NULL,
  market        TEXT        NOT NULL DEFAULT 'KOSPI',
  snapshot_type TEXT        NOT NULL,
  snapshot_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  open_price    BIGINT,
  high_price    BIGINT,
  low_price     BIGINT,
  close_price   BIGINT,
  volume        BIGINT,
  change_rate   NUMERIC(8,4),
  ma5           NUMERIC(14,2),
  ma20          NUMERIC(14,2),
  ma60          NUMERIC(14,2),
  ma120         NUMERIC(14,2),
  rsi14         NUMERIC(6,3),
  macd          NUMERIC(14,4),
  macd_signal   NUMERIC(14,4),
  source        TEXT        NOT NULL DEFAULT 'kiwoom',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trading.disclosures (
  id              BIGSERIAL PRIMARY KEY,
  rcept_no        TEXT        NOT NULL UNIQUE,
  stock_code      TEXT        NOT NULL,
  corp_code       TEXT,
  corp_name       TEXT,
  market          TEXT        NOT NULL DEFAULT 'KOSPI',
  report_name     TEXT        NOT NULL,
  filer_name      TEXT,
  rcept_date      DATE        NOT NULL,
  disclosure_type TEXT        NOT NULL DEFAULT 'etc',
  raw_data        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trading.financial_statements (
  id              BIGSERIAL PRIMARY KEY,
  corp_code       TEXT        NOT NULL,
  stock_code      TEXT        NOT NULL,
  market          TEXT        NOT NULL DEFAULT 'KOSPI',
  bsns_year       TEXT        NOT NULL,
  reprt_code      TEXT        NOT NULL,
  fs_div          TEXT        NOT NULL,
  sj_div          TEXT        NOT NULL,
  account_id      TEXT        NOT NULL,
  account_name    TEXT,
  current_amount  BIGINT,
  prev_amount     BIGINT,
  prev2_amount    BIGINT,
  currency        TEXT        NOT NULL DEFAULT 'KRW',
  rcept_no        TEXT,
  source          TEXT        NOT NULL DEFAULT 'opendart',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (corp_code, bsns_year, reprt_code, fs_div, sj_div, account_id)
);

CREATE TABLE IF NOT EXISTS trading.sync_log (
  id            BIGSERIAL PRIMARY KEY,
  job_name      TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'started',
  rows_affected INT         DEFAULT 0,
  error_message TEXT,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at   TIMESTAMPTZ
);

-- 4. 인덱스
CREATE INDEX IF NOT EXISTS idx_wu_market_type    ON trading.watch_universe (market, universe_type, is_active);
CREATE INDEX IF NOT EXISTS idx_sf_code_date      ON trading.stock_fundamentals (stock_code, fetch_date DESC);
CREATE INDEX IF NOT EXISTS idx_ohlcv_code_date   ON trading.ohlcv_daily (stock_code, trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_snap_code_type    ON trading.ohlcv_snapshot (stock_code, snapshot_type, snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_disc_code_date    ON trading.disclosures (stock_code, rcept_date DESC);
CREATE INDEX IF NOT EXISTS idx_disc_type         ON trading.disclosures (disclosure_type, rcept_date DESC);
CREATE INDEX IF NOT EXISTS idx_fs_corp_year      ON trading.financial_statements (corp_code, bsns_year, reprt_code);

-- 5. RLS 비활성화 (파이프라인 전용)
ALTER TABLE trading.watch_universe       DISABLE ROW LEVEL SECURITY;
ALTER TABLE trading.stock_fundamentals   DISABLE ROW LEVEL SECURITY;
ALTER TABLE trading.ohlcv_daily          DISABLE ROW LEVEL SECURITY;
ALTER TABLE trading.ohlcv_snapshot       DISABLE ROW LEVEL SECURITY;
ALTER TABLE trading.disclosures          DISABLE ROW LEVEL SECURITY;
ALTER TABLE trading.financial_statements DISABLE ROW LEVEL SECURITY;
ALTER TABLE trading.sync_log             DISABLE ROW LEVEL SECURITY;

-- 6. 권한
GRANT USAGE ON SCHEMA trading TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA trading TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA trading TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA trading TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA trading GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA trading GRANT ALL ON SEQUENCES TO service_role;

-- 7. DB 함수

-- Edge Function → trading 스키마 접근
CREATE OR REPLACE FUNCTION trading.exec_sql(query text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  EXECUTE query;
  RETURN json_build_object('ok', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- 활성 종목 목록
CREATE OR REPLACE FUNCTION trading.get_active_universe()
RETURNS TABLE(stock_code text, corp_code text, corp_name text, rank int)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT stock_code, corp_code, corp_name, rank
  FROM trading.watch_universe
  WHERE is_active = TRUE
  ORDER BY rank;
$$;

-- 데이터 보존 정책 (ohlcv 1년, 공시 6개월, 재무 2년)
CREATE OR REPLACE FUNCTION trading.cleanup_old_data()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM trading.ohlcv_daily WHERE trade_date < CURRENT_DATE - 365;
  DELETE FROM trading.stock_fundamentals WHERE id NOT IN (
    SELECT DISTINCT ON (stock_code) id FROM trading.stock_fundamentals ORDER BY stock_code, fetch_date DESC
  );
  DELETE FROM trading.disclosures WHERE rcept_date < CURRENT_DATE - 180;
  DELETE FROM trading.financial_statements WHERE bsns_year::int < EXTRACT(YEAR FROM CURRENT_DATE)::int - 2;
  INSERT INTO trading.sync_log (job_name, status, finished_at) VALUES ('weekly-cleanup', 'success', NOW());
END;
$$;

-- 공시 유형 자동 분류
CREATE OR REPLACE FUNCTION trading.classify_disclosure_type(report_name text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF report_name ~* '(사업보고서|분기보고서|반기보고서|영업실적|매출액|실적)' THEN RETURN 'earnings';
  ELSIF report_name ~* '(배당|주주환원)' THEN RETURN 'dividend';
  ELSIF report_name ~* '(유상증자|무상증자|전환사채|신주인수권부사채|자본)' THEN RETURN 'capital';
  ELSIF report_name ~* '(자기주식|자사주)' THEN RETURN 'buyback';
  ELSIF report_name ~* '(대량보유|임원|주요주주|지분)' THEN RETURN 'ownership';
  ELSE RETURN 'etc';
  END IF;
END;
$$;

-- trading → public.stocks 동기화
CREATE OR REPLACE FUNCTION trading.sync_to_public_stocks()
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE synced integer := 0;
BEGIN
  INSERT INTO public.stocks (id, code, name, market, price, change, change_rate, rank, created_at, updated_at)
  SELECT wu.stock_code, wu.stock_code, wu.corp_name, wu.market,
    COALESCE(sf.cur_price, 0)::integer, 0, COALESCE(sf.change_rate, 0)::numeric,
    wu.rank, NOW(), NOW()
  FROM trading.watch_universe wu
  LEFT JOIN trading.stock_fundamentals sf
    ON sf.stock_code = wu.stock_code
    AND sf.fetch_date = (SELECT MAX(fetch_date) FROM trading.stock_fundamentals WHERE stock_code = wu.stock_code)
  WHERE wu.is_active = TRUE
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, price = EXCLUDED.price,
    change_rate = EXCLUDED.change_rate, rank = EXCLUDED.rank, updated_at = NOW();
  GET DIAGNOSTICS synced = ROW_COUNT;
  RETURN synced;
END;
$$;

-- trading → public.disclosures 동기화
CREATE OR REPLACE FUNCTION trading.sync_to_public_disclosures()
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE synced integer := 0;
BEGIN
  DELETE FROM public.disclosures WHERE id IN (SELECT rcept_no FROM trading.disclosures);
  INSERT INTO public.disclosures (id, stock_id, disclosure_date, title, type, importance, created_at)
  SELECT td.rcept_no, s.id, td.rcept_date, td.report_name,
    CASE td.disclosure_type WHEN 'earnings' THEN 'earnings' WHEN 'ownership' THEN 'ownership' ELSE 'other' END,
    CASE td.disclosure_type WHEN 'earnings' THEN 'high' WHEN 'dividend' THEN 'medium' WHEN 'capital' THEN 'medium'
      WHEN 'buyback' THEN 'medium' WHEN 'ownership' THEN 'medium' ELSE 'low' END,
    td.created_at
  FROM trading.disclosures td
  INNER JOIN public.stocks s ON s.code = td.stock_code
  WHERE td.rcept_date >= CURRENT_DATE - 180
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, type = EXCLUDED.type, importance = EXCLUDED.importance;
  GET DIAGNOSTICS synced = ROW_COUNT;
  RETURN synced;
END;
$$;

-- 파이프라인 검증 함수 (REST API에서 호출 가능)
CREATE OR REPLACE FUNCTION public.check_trading_pipeline()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result json;
BEGIN
  SELECT json_build_object(
    'tables', (SELECT json_object_agg(tbl, cnt) FROM (
      SELECT 'watch_universe' as tbl, COUNT(*) as cnt FROM trading.watch_universe
      UNION ALL SELECT 'stock_fundamentals', COUNT(*) FROM trading.stock_fundamentals
      UNION ALL SELECT 'ohlcv_daily', COUNT(*) FROM trading.ohlcv_daily
      UNION ALL SELECT 'ohlcv_snapshot', COUNT(*) FROM trading.ohlcv_snapshot
      UNION ALL SELECT 'disclosures', COUNT(*) FROM trading.disclosures
      UNION ALL SELECT 'financial_statements', COUNT(*) FROM trading.financial_statements
      UNION ALL SELECT 'sync_log', COUNT(*) FROM trading.sync_log
    ) t),
    'functions', (SELECT json_agg(routine_name ORDER BY routine_name) FROM information_schema.routines WHERE routine_schema = 'trading'),
    'cron_jobs', (SELECT json_agg(json_build_object('name', jobname, 'schedule', schedule, 'active', active) ORDER BY jobid) FROM cron.job),
    'ohlcv_range', (SELECT json_build_object('min', MIN(trade_date), 'max', MAX(trade_date), 'stocks', COUNT(DISTINCT stock_code)) FROM trading.ohlcv_daily),
    'recent_sync', (SELECT json_agg(json_build_object('job', job_name, 'status', status, 'rows', rows_affected, 'at', finished_at) ORDER BY started_at DESC) FROM (SELECT * FROM trading.sync_log ORDER BY started_at DESC LIMIT 5) s)
  ) INTO result;
  RETURN result;
END;
$$;

COMMENT ON SCHEMA trading IS '데이트레이딩 데이터 파이프라인 - KOSPI 기준';
