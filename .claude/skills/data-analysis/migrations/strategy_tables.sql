-- ============================================================
-- Investment Strategy & Analysis Tables
-- trading 스키마 확장 - 전략 관리 + 분석 결과 저장
-- ============================================================

-- 1. 투자전략 마스터 테이블
CREATE TABLE IF NOT EXISTS trading.strategies (
  id            BIGSERIAL    PRIMARY KEY,
  name          TEXT         NOT NULL,
  version       TEXT         NOT NULL DEFAULT '1.0',
  description   TEXT,
  -- 전략 유형: factor, momentum, mean_reversion, ml, composite 등
  strategy_type TEXT         NOT NULL DEFAULT 'composite',
  -- 전략 파라미터 (JSON): 지표, 가중치, 임계값 등
  params        JSONB        NOT NULL DEFAULT '{}',
  -- 분석 대상 유니버스 필터 (null = watch_universe 전체)
  universe_filter JSONB,
  -- 활성화 상태: 동시에 하나만 active
  is_active     BOOLEAN      NOT NULL DEFAULT FALSE,
  activated_at  TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  -- 원본 보고서 (마크다운/텍스트)
  report_text   TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (name, version)
);

-- 2. 분석 실행 이력
CREATE TABLE IF NOT EXISTS trading.analysis_runs (
  id            BIGSERIAL    PRIMARY KEY,
  strategy_id   BIGINT       NOT NULL REFERENCES trading.strategies(id),
  -- 실행 상태: started, success, failed
  status        TEXT         NOT NULL DEFAULT 'started',
  -- 분석 기준일
  run_date      DATE         NOT NULL DEFAULT CURRENT_DATE,
  -- 대상 종목 수, 시그널 생성 수
  stocks_analyzed INT        DEFAULT 0,
  signals_generated INT      DEFAULT 0,
  -- 실행 메타데이터 (소요시간, 오류 등)
  metadata      JSONB        DEFAULT '{}',
  error_message TEXT,
  started_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  finished_at   TIMESTAMPTZ
);

-- 3. 종목별 전략 시그널
CREATE TABLE IF NOT EXISTS trading.strategy_signals (
  id            BIGSERIAL    PRIMARY KEY,
  run_id        BIGINT       NOT NULL REFERENCES trading.analysis_runs(id),
  strategy_id   BIGINT       NOT NULL REFERENCES trading.strategies(id),
  stock_code    TEXT         NOT NULL,
  signal_date   DATE         NOT NULL,
  -- 시그널: strong_buy, buy, hold, sell, strong_sell
  signal        TEXT         NOT NULL DEFAULT 'hold',
  -- 종합 점수 (0~100)
  total_score   NUMERIC(6,2) NOT NULL DEFAULT 50,
  -- 팩터별 점수 상세
  score_detail  JSONB        NOT NULL DEFAULT '{}',
  -- 기술적 지표 스냅샷 (분석 시점 기록)
  indicators    JSONB        DEFAULT '{}',
  -- 순위 (해당 분석 내)
  rank          INT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (run_id, stock_code)
);

-- 4. 인덱스
CREATE INDEX IF NOT EXISTS idx_strategies_active
  ON trading.strategies (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_runs_strategy_date
  ON trading.analysis_runs (strategy_id, run_date DESC);
CREATE INDEX IF NOT EXISTS idx_signals_stock_date
  ON trading.strategy_signals (stock_code, signal_date DESC);
CREATE INDEX IF NOT EXISTS idx_signals_run
  ON trading.strategy_signals (run_id);
CREATE INDEX IF NOT EXISTS idx_signals_score
  ON trading.strategy_signals (strategy_id, signal_date DESC, total_score DESC);

-- 5. RLS 비활성화 (파이프라인 전용)
ALTER TABLE trading.strategies       DISABLE ROW LEVEL SECURITY;
ALTER TABLE trading.analysis_runs    DISABLE ROW LEVEL SECURITY;
ALTER TABLE trading.strategy_signals DISABLE ROW LEVEL SECURITY;

-- 6. 권한
GRANT SELECT, INSERT, UPDATE, DELETE ON trading.strategies       TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON trading.analysis_runs    TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON trading.strategy_signals TO anon, authenticated;
GRANT ALL ON trading.strategies       TO service_role;
GRANT ALL ON trading.analysis_runs    TO service_role;
GRANT ALL ON trading.strategy_signals TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA trading TO anon, authenticated, service_role;

-- 7. 전략 활성화 함수 (기존 활성 전략 비활성화 + 지정 전략 활성화)
CREATE OR REPLACE FUNCTION trading.activate_strategy(p_strategy_id BIGINT)
RETURNS json LANGUAGE plpgsql AS $$
DECLARE
  prev_id BIGINT;
  result json;
BEGIN
  -- 현재 활성 전략 비활성화
  SELECT id INTO prev_id FROM trading.strategies WHERE is_active = TRUE;
  IF prev_id IS NOT NULL THEN
    UPDATE trading.strategies
    SET is_active = FALSE, deactivated_at = NOW(), updated_at = NOW()
    WHERE id = prev_id;
  END IF;

  -- 새 전략 활성화
  UPDATE trading.strategies
  SET is_active = TRUE, activated_at = NOW(), deactivated_at = NULL, updated_at = NOW()
  WHERE id = p_strategy_id;

  SELECT json_build_object(
    'ok', true,
    'activated', p_strategy_id,
    'deactivated', prev_id
  ) INTO result;
  RETURN result;
END;
$$;

-- 8. 활성 전략 조회 함수
CREATE OR REPLACE FUNCTION trading.get_active_strategy()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result json;
BEGIN
  SELECT row_to_json(s) INTO result
  FROM trading.strategies s
  WHERE s.is_active = TRUE
  LIMIT 1;
  RETURN COALESCE(result, '{}'::json);
END;
$$;

-- 9. 최신 시그널 조회 함수
CREATE OR REPLACE FUNCTION trading.get_latest_signals(p_strategy_id BIGINT DEFAULT NULL)
RETURNS TABLE(
  stock_code TEXT, signal TEXT, total_score NUMERIC,
  score_detail JSONB, rank INT, signal_date DATE
) LANGUAGE sql SECURITY DEFINER AS $$
  WITH active AS (
    SELECT COALESCE(p_strategy_id, (SELECT id FROM trading.strategies WHERE is_active = TRUE LIMIT 1)) AS sid
  ),
  latest_run AS (
    SELECT ar.id FROM trading.analysis_runs ar, active
    WHERE ar.strategy_id = active.sid AND ar.status = 'success'
    ORDER BY ar.run_date DESC LIMIT 1
  )
  SELECT ss.stock_code, ss.signal, ss.total_score,
         ss.score_detail, ss.rank, ss.signal_date
  FROM trading.strategy_signals ss, latest_run
  WHERE ss.run_id = latest_run.id
  ORDER BY ss.rank;
$$;
