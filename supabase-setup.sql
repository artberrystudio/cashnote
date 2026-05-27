-- ============================================================
-- CashNote — Supabase 초기 설정 SQL
-- Supabase 대시보드 > SQL Editor 에서 실행하세요
-- ============================================================

-- 1. income_records 테이블 생성
CREATE TABLE IF NOT EXISTS public.income_records (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  amount      INTEGER     NOT NULL CHECK (amount > 0),
  category    TEXT        NOT NULL CHECK (category IN ('freelance','content','invest','sales','consult','other')),
  date        TEXT        NOT NULL,   -- YYYY-MM-DD
  memo        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Row Level Security 활성화
ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;

-- 3. 정책: 본인 데이터만 읽기/쓰기/수정/삭제
CREATE POLICY "owner_all" ON public.income_records
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. 인덱스 (날짜순 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_income_records_user_date
  ON public.income_records (user_id, date DESC);

-- ============================================================
-- ★ 중요: 익명 로그인도 활성화해야 합니다
--   Authentication → Settings → "Allow anonymous sign-ins" ON
-- ============================================================
