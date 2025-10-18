-- ========================================
-- AI 倉儲排班系統 - 數據庫表結構
-- ========================================

-- 1. 員工表
CREATE TABLE IF NOT EXISTS warehouse_employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  position TEXT NOT NULL, -- 職位：forklift_driver, picker, packer, supervisor
  skill_level INTEGER DEFAULT 1, -- 技能等級 1-5
  hourly_rate DECIMAL(10, 2),
  max_hours_per_week INTEGER DEFAULT 40,
  preferred_shifts TEXT[], -- 偏好班次：morning, afternoon, night
  availability_days TEXT[], -- 可工作日：monday, tuesday, ...
  status TEXT DEFAULT 'active', -- active, inactive, on_leave
  hire_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 倉儲區域表
CREATE TABLE IF NOT EXISTS warehouse_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  zone_code TEXT NOT NULL,
  zone_name TEXT NOT NULL,
  zone_type TEXT NOT NULL, -- receiving, storage, picking, packing, shipping
  required_staff_count INTEGER DEFAULT 1,
  area_sqm DECIMAL(10, 2),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 班次定義表
CREATE TABLE IF NOT EXISTS shift_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shift_name TEXT NOT NULL,
  shift_type TEXT NOT NULL, -- morning, afternoon, night, flexible
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 60,
  required_positions JSONB, -- {"forklift_driver": 2, "picker": 5, "packer": 3}
  hourly_multiplier DECIMAL(5, 2) DEFAULT 1.0, -- 薪資倍數
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 排班表
CREATE TABLE IF NOT EXISTS work_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES warehouse_employees(id) ON DELETE CASCADE,
  shift_template_id UUID REFERENCES shift_templates(id),
  zone_id UUID REFERENCES warehouse_zones(id),
  schedule_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  actual_start_time TIME,
  actual_end_time TIME,
  status TEXT DEFAULT 'scheduled', -- scheduled, confirmed, in_progress, completed, cancelled
  ai_optimized BOOLEAN DEFAULT false,
  ai_confidence_score DECIMAL(5, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, schedule_date, start_time)
);

-- 5. 工作負載預測表
CREATE TABLE IF NOT EXISTS workload_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  shift_type TEXT NOT NULL,
  zone_id UUID REFERENCES warehouse_zones(id),
  predicted_volume INTEGER, -- 預計處理量
  predicted_staff_needed INTEGER,
  confidence_level DECIMAL(5, 2),
  actual_volume INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, forecast_date, shift_type, zone_id)
);

-- 6. 排班指標表
CREATE TABLE IF NOT EXISTS scheduling_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  metric_date DATE DEFAULT CURRENT_DATE,
  total_shifts INTEGER DEFAULT 0,
  filled_shifts INTEGER DEFAULT 0,
  unfilled_shifts INTEGER DEFAULT 0,
  overtime_hours DECIMAL(10, 2) DEFAULT 0,
  labor_cost DECIMAL(15, 2) DEFAULT 0,
  efficiency_score DECIMAL(5, 2),
  employee_satisfaction_score DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_employees_company ON warehouse_employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON warehouse_employees(status);
CREATE INDEX IF NOT EXISTS idx_zones_company ON warehouse_zones(company_id);
CREATE INDEX IF NOT EXISTS idx_schedules_employee ON work_schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON work_schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_schedules_company ON work_schedules(company_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_company_date ON workload_forecasts(company_id, forecast_date);

-- 啟用 RLS
ALTER TABLE warehouse_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE workload_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_metrics ENABLE ROW LEVEL SECURITY;

-- RLS 政策
DROP POLICY IF EXISTS "employees_select" ON warehouse_employees;
CREATE POLICY "employees_select" ON warehouse_employees FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "zones_select" ON warehouse_zones;
CREATE POLICY "zones_select" ON warehouse_zones FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "shift_templates_select" ON shift_templates;
CREATE POLICY "shift_templates_select" ON shift_templates FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "schedules_select" ON work_schedules;
CREATE POLICY "schedules_select" ON work_schedules FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "forecasts_select" ON workload_forecasts;
CREATE POLICY "forecasts_select" ON workload_forecasts FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "metrics_select" ON scheduling_metrics;
CREATE POLICY "metrics_select" ON scheduling_metrics FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- 輔助函數：獲取排班統計
CREATE OR REPLACE FUNCTION get_scheduling_stats(p_company_id UUID, p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  total_employees BIGINT,
  active_employees BIGINT,
  total_shifts BIGINT,
  filled_shifts BIGINT,
  fill_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM warehouse_employees WHERE company_id = p_company_id)::BIGINT,
    (SELECT COUNT(*) FROM warehouse_employees WHERE company_id = p_company_id AND status = 'active')::BIGINT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status IN ('confirmed', 'in_progress', 'completed'))::BIGINT,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE status IN ('confirmed', 'in_progress', 'completed'))::NUMERIC / COUNT(*)::NUMERIC * 100)
      ELSE 0
    END
  FROM work_schedules
  WHERE company_id = p_company_id 
    AND schedule_date >= CURRENT_DATE 
    AND schedule_date < CURRENT_DATE + (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 輔助函數：檢查員工可用性
CREATE OR REPLACE FUNCTION check_employee_availability(
  p_employee_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_conflict_count
  FROM work_schedules
  WHERE employee_id = p_employee_id
    AND schedule_date = p_date
    AND status NOT IN ('cancelled')
    AND (
      (start_time <= p_start_time AND end_time > p_start_time)
      OR (start_time < p_end_time AND end_time >= p_end_time)
      OR (start_time >= p_start_time AND end_time <= p_end_time)
    );
  
  RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN RAISE NOTICE '✅ AI 倉儲排班系統 - 資料庫完成'; END $$;

