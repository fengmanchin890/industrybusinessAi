-- ========================================
-- AI 護理排班系統 - 數據庫表結構
-- ========================================

-- 1. 護理人員表
CREATE TABLE IF NOT EXISTS nursing_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  staff_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL, -- 資深護理師, 護理師, 護理長
  employment_type TEXT DEFAULT 'full_time', -- full_time, part_time, contract
  skills TEXT[] NOT NULL, -- 專業技能陣列
  certifications TEXT[], -- 證照
  max_hours_per_week INTEGER DEFAULT 40,
  preferences TEXT[], -- 班別偏好: 日班, 小夜班, 夜班
  status TEXT DEFAULT 'available', -- available, busy, on_leave, off_duty
  contact_phone TEXT,
  contact_email TEXT,
  emergency_contact TEXT,
  hire_date DATE,
  years_experience INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 班次定義表
CREATE TABLE IF NOT EXISTS nursing_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shift_code TEXT NOT NULL,
  shift_date DATE NOT NULL,
  shift_time TEXT NOT NULL, -- 08:00-16:00
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours INTEGER NOT NULL,
  department TEXT NOT NULL, -- 內科, 外科, 急診, ICU, 兒科, 婦產科
  ward_location TEXT,
  required_skills TEXT[] NOT NULL,
  min_staff_required INTEGER DEFAULT 1,
  max_staff_allowed INTEGER DEFAULT 5,
  priority_level TEXT DEFAULT 'normal', -- critical, high, normal, low
  status TEXT DEFAULT 'pending', -- pending, scheduled, in_progress, completed, cancelled
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, shift_code, shift_date)
);

-- 3. 排班分配表
CREATE TABLE IF NOT EXISTS shift_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES nursing_shifts(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES nursing_staff(id) ON DELETE CASCADE,
  assignment_status TEXT DEFAULT 'assigned', -- assigned, confirmed, completed, cancelled
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  actual_hours DECIMAL(5, 2),
  performance_rating INTEGER CHECK (performance_rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shift_id, staff_id)
);

-- 4. 護理人員工時記錄表
CREATE TABLE IF NOT EXISTS staff_work_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES nursing_staff(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  total_hours DECIMAL(5, 2) DEFAULT 0,
  regular_hours DECIMAL(5, 2) DEFAULT 0,
  overtime_hours DECIMAL(5, 2) DEFAULT 0,
  total_shifts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, week_start_date)
);

-- 5. 排班優化記錄表
CREATE TABLE IF NOT EXISTS schedule_optimizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  optimization_date TIMESTAMPTZ DEFAULT NOW(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_shifts INTEGER DEFAULT 0,
  unscheduled_shifts INTEGER DEFAULT 0,
  scheduled_shifts INTEGER DEFAULT 0,
  coverage_rate DECIMAL(5, 2) DEFAULT 0,
  satisfaction_score DECIMAL(5, 2) DEFAULT 0,
  optimization_algorithm TEXT DEFAULT 'ai_based',
  optimization_parameters JSONB,
  ai_suggestions TEXT[],
  execution_time_ms INTEGER,
  optimized_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 排班衝突記錄表
CREATE TABLE IF NOT EXISTS schedule_conflicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  conflict_type TEXT NOT NULL, -- skill_mismatch, overtime, double_booking, understaffed
  severity TEXT NOT NULL, -- critical, high, moderate, low
  shift_id UUID REFERENCES nursing_shifts(id),
  staff_id UUID REFERENCES nursing_staff(id),
  description TEXT NOT NULL,
  resolution_status TEXT DEFAULT 'pending', -- pending, resolved, ignored
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 護理排班統計表
CREATE TABLE IF NOT EXISTS nursing_schedule_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  metric_date DATE DEFAULT CURRENT_DATE,
  total_staff INTEGER DEFAULT 0,
  available_staff INTEGER DEFAULT 0,
  total_shifts INTEGER DEFAULT 0,
  scheduled_shifts INTEGER DEFAULT 0,
  pending_shifts INTEGER DEFAULT 0,
  coverage_rate DECIMAL(5, 2) DEFAULT 0,
  average_workload_hours DECIMAL(5, 2) DEFAULT 0,
  satisfaction_rate DECIMAL(5, 2) DEFAULT 0,
  ai_optimizations_run INTEGER DEFAULT 0,
  conflicts_detected INTEGER DEFAULT 0,
  conflicts_resolved INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_nursing_staff_company ON nursing_staff(company_id);
CREATE INDEX IF NOT EXISTS idx_nursing_staff_status ON nursing_staff(status);
CREATE INDEX IF NOT EXISTS idx_nursing_staff_position ON nursing_staff(position);
CREATE INDEX IF NOT EXISTS idx_nursing_shifts_company ON nursing_shifts(company_id);
CREATE INDEX IF NOT EXISTS idx_nursing_shifts_date ON nursing_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_nursing_shifts_status ON nursing_shifts(status);
CREATE INDEX IF NOT EXISTS idx_nursing_shifts_department ON nursing_shifts(department);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift ON shift_assignments(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_staff ON shift_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_company ON shift_assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_staff_work_hours_staff ON staff_work_hours(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_work_hours_week ON staff_work_hours(week_start_date);
CREATE INDEX IF NOT EXISTS idx_schedule_conflicts_company ON schedule_conflicts(company_id);
CREATE INDEX IF NOT EXISTS idx_schedule_conflicts_status ON schedule_conflicts(resolution_status);

-- 啟用 RLS
ALTER TABLE nursing_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_work_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_schedule_metrics ENABLE ROW LEVEL SECURITY;

-- RLS 政策
DROP POLICY IF EXISTS "nursing_staff_select" ON nursing_staff;
CREATE POLICY "nursing_staff_select" ON nursing_staff FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "nursing_staff_insert" ON nursing_staff;
CREATE POLICY "nursing_staff_insert" ON nursing_staff FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "nursing_staff_update" ON nursing_staff;
CREATE POLICY "nursing_staff_update" ON nursing_staff FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "nursing_shifts_select" ON nursing_shifts;
CREATE POLICY "nursing_shifts_select" ON nursing_shifts FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "nursing_shifts_insert" ON nursing_shifts;
CREATE POLICY "nursing_shifts_insert" ON nursing_shifts FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "nursing_shifts_update" ON nursing_shifts;
CREATE POLICY "nursing_shifts_update" ON nursing_shifts FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "shift_assignments_select" ON shift_assignments;
CREATE POLICY "shift_assignments_select" ON shift_assignments FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "shift_assignments_insert" ON shift_assignments;
CREATE POLICY "shift_assignments_insert" ON shift_assignments FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "shift_assignments_update" ON shift_assignments;
CREATE POLICY "shift_assignments_update" ON shift_assignments FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "work_hours_select" ON staff_work_hours;
CREATE POLICY "work_hours_select" ON staff_work_hours FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "optimizations_select" ON schedule_optimizations;
CREATE POLICY "optimizations_select" ON schedule_optimizations FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "conflicts_select" ON schedule_conflicts;
CREATE POLICY "conflicts_select" ON schedule_conflicts FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "metrics_select" ON nursing_schedule_metrics;
CREATE POLICY "metrics_select" ON nursing_schedule_metrics FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- 輔助函數：獲取護理排班統計
CREATE OR REPLACE FUNCTION get_nursing_schedule_stats(p_company_id UUID)
RETURNS TABLE (
  total_staff BIGINT,
  available_staff BIGINT,
  total_shifts BIGINT,
  scheduled_shifts BIGINT,
  pending_shifts BIGINT,
  coverage_rate DECIMAL,
  avg_workload DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM nursing_staff WHERE company_id = p_company_id AND status != 'off_duty')::BIGINT,
    (SELECT COUNT(*) FROM nursing_staff WHERE company_id = p_company_id AND status = 'available')::BIGINT,
    (SELECT COUNT(*) FROM nursing_shifts WHERE company_id = p_company_id AND shift_date >= CURRENT_DATE)::BIGINT,
    (SELECT COUNT(*) FROM nursing_shifts WHERE company_id = p_company_id AND status = 'scheduled' AND shift_date >= CURRENT_DATE)::BIGINT,
    (SELECT COUNT(*) FROM nursing_shifts WHERE company_id = p_company_id AND status = 'pending' AND shift_date >= CURRENT_DATE)::BIGINT,
    CASE 
      WHEN (SELECT COUNT(*) FROM nursing_shifts WHERE company_id = p_company_id AND shift_date >= CURRENT_DATE) > 0
      THEN (SELECT COUNT(*) FROM nursing_shifts WHERE company_id = p_company_id AND status = 'scheduled' AND shift_date >= CURRENT_DATE)::DECIMAL * 100 / 
           (SELECT COUNT(*) FROM nursing_shifts WHERE company_id = p_company_id AND shift_date >= CURRENT_DATE)
      ELSE 0
    END,
    COALESCE((SELECT AVG(total_hours) FROM staff_work_hours WHERE company_id = p_company_id AND week_start_date >= CURRENT_DATE - 7), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 輔助函數：檢查護理人員技能匹配
CREATE OR REPLACE FUNCTION check_skill_match(p_staff_id UUID, p_shift_id UUID)
RETURNS TABLE (
  is_qualified BOOLEAN,
  matched_skills TEXT[],
  missing_skills TEXT[]
) AS $$
DECLARE
  v_staff_skills TEXT[];
  v_required_skills TEXT[];
  v_matched TEXT[];
  v_missing TEXT[];
BEGIN
  SELECT skills INTO v_staff_skills FROM nursing_staff WHERE id = p_staff_id;
  SELECT required_skills INTO v_required_skills FROM nursing_shifts WHERE id = p_shift_id;
  
  -- 計算匹配和缺失的技能
  v_matched := ARRAY(SELECT unnest(v_staff_skills) INTERSECT SELECT unnest(v_required_skills));
  v_missing := ARRAY(SELECT unnest(v_required_skills) EXCEPT SELECT unnest(v_staff_skills));
  
  RETURN QUERY SELECT 
    array_length(v_missing, 1) IS NULL OR array_length(v_missing, 1) = 0,
    v_matched,
    v_missing;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 輔助函數：計算護理人員本週工時
CREATE OR REPLACE FUNCTION calculate_weekly_hours(p_staff_id UUID, p_week_start DATE)
RETURNS DECIMAL AS $$
DECLARE
  v_total_hours DECIMAL;
BEGIN
  SELECT COALESCE(SUM(ns.duration_hours), 0) INTO v_total_hours
  FROM shift_assignments sa
  JOIN nursing_shifts ns ON sa.shift_id = ns.id
  WHERE sa.staff_id = p_staff_id
    AND ns.shift_date BETWEEN p_week_start AND p_week_start + 6
    AND sa.assignment_status IN ('assigned', 'confirmed', 'completed');
  
  RETURN v_total_hours;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 輔助函數：檢查排班衝突
CREATE OR REPLACE FUNCTION check_schedule_conflicts(p_staff_id UUID, p_shift_id UUID)
RETURNS TABLE (
  has_conflict BOOLEAN,
  conflict_type TEXT,
  conflict_description TEXT
) AS $$
DECLARE
  v_shift_date DATE;
  v_shift_start TIME;
  v_shift_end TIME;
  v_staff_max_hours INTEGER;
  v_weekly_hours DECIMAL;
  v_week_start DATE;
BEGIN
  -- 獲取班次信息
  SELECT shift_date, start_time, end_time INTO v_shift_date, v_shift_start, v_shift_end
  FROM nursing_shifts WHERE id = p_shift_id;
  
  -- 獲取護理人員信息
  SELECT max_hours_per_week INTO v_staff_max_hours FROM nursing_staff WHERE id = p_staff_id;
  
  -- 計算週起始日期
  v_week_start := date_trunc('week', v_shift_date)::DATE;
  
  -- 計算本週工時
  v_weekly_hours := calculate_weekly_hours(p_staff_id, v_week_start);
  
  -- 檢查是否超時
  IF v_weekly_hours >= v_staff_max_hours THEN
    RETURN QUERY SELECT TRUE, 'overtime'::TEXT, '護理人員本週工時已達上限'::TEXT;
    RETURN;
  END IF;
  
  -- 檢查同一時段是否已排班
  IF EXISTS (
    SELECT 1 FROM shift_assignments sa
    JOIN nursing_shifts ns ON sa.shift_id = ns.id
    WHERE sa.staff_id = p_staff_id
      AND ns.shift_date = v_shift_date
      AND ns.id != p_shift_id
      AND sa.assignment_status IN ('assigned', 'confirmed')
      AND (
        (ns.start_time, ns.end_time) OVERLAPS (v_shift_start, v_shift_end)
      )
  ) THEN
    RETURN QUERY SELECT TRUE, 'double_booking'::TEXT, '護理人員在此時段已有其他排班'::TEXT;
    RETURN;
  END IF;
  
  -- 無衝突
  RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN RAISE NOTICE '✅ AI 護理排班系統 - 資料庫完成'; END $$;
