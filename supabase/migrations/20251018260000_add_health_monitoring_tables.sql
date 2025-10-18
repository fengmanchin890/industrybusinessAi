-- ========================================
-- AI 健康監測系統 - 資料庫 Migration
-- ========================================

-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 患者資料表
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patient_code TEXT UNIQUE NOT NULL,
  patient_name TEXT NOT NULL,
  id_number TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  blood_type TEXT,
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  phone TEXT,
  email TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  medical_history TEXT[],
  chronic_conditions TEXT[],
  allergies TEXT[],
  status TEXT DEFAULT 'active', -- active, inactive, deceased
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 生命體征記錄表
CREATE TABLE IF NOT EXISTS vital_signs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  measurement_time TIMESTAMPTZ DEFAULT NOW(),
  systolic_bp INTEGER, -- 收縮壓
  diastolic_bp INTEGER, -- 舒張壓
  heart_rate INTEGER, -- 心率 (bpm)
  temperature DECIMAL(4,1), -- 體溫 (°C)
  respiratory_rate INTEGER, -- 呼吸率
  oxygen_saturation INTEGER, -- 血氧飽和度 (%)
  blood_glucose DECIMAL(5,1), -- 血糖 (mg/dL)
  weight_kg DECIMAL(5,2),
  notes TEXT,
  measured_by TEXT,
  location TEXT, -- home, clinic, hospital
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 健康指標分析表
CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  metric_date DATE DEFAULT CURRENT_DATE,
  bmi DECIMAL(5,2), -- Body Mass Index
  bmi_category TEXT, -- underweight, normal, overweight, obese
  avg_systolic_bp INTEGER,
  avg_diastolic_bp INTEGER,
  avg_heart_rate INTEGER,
  avg_blood_glucose DECIMAL(5,1),
  health_score INTEGER, -- 0-100
  risk_level TEXT, -- low, moderate, high, critical
  ai_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 健康警報表
CREATE TABLE IF NOT EXISTS health_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  vital_sign_id UUID REFERENCES vital_signs(id),
  alert_type TEXT NOT NULL, -- bp_high, bp_low, hr_abnormal, glucose_high, etc.
  severity TEXT NOT NULL, -- info, warning, critical
  title TEXT NOT NULL,
  description TEXT,
  measurement_value TEXT,
  normal_range TEXT,
  recommendation TEXT,
  status TEXT DEFAULT 'active', -- active, acknowledged, resolved
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 監測計劃表
CREATE TABLE IF NOT EXISTS monitoring_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  monitoring_frequency TEXT, -- daily, twice_daily, weekly
  start_date DATE NOT NULL,
  end_date DATE,
  target_metrics TEXT[], -- bp, hr, glucose, weight, etc.
  target_values JSONB, -- target ranges for each metric
  doctor_name TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active', -- active, paused, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 健康報告表
CREATE TABLE IF NOT EXISTS health_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL, -- daily, weekly, monthly, annual
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  total_measurements INTEGER,
  avg_health_score DECIMAL(5,2),
  alerts_count INTEGER,
  trends JSONB,
  ai_insights TEXT,
  recommendations TEXT[],
  generated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_patients_company ON patients(company_id);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_vital_signs_patient ON vital_signs(patient_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_time ON vital_signs(measurement_time);
CREATE INDEX IF NOT EXISTS idx_health_metrics_patient ON health_metrics(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_alerts_patient ON health_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_alerts_status ON health_alerts(status);
CREATE INDEX IF NOT EXISTS idx_monitoring_plans_patient ON monitoring_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_reports_patient ON health_reports(patient_id);

-- RLS 政策
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_reports ENABLE ROW LEVEL SECURITY;

-- Patients
DROP POLICY IF EXISTS "patients_select" ON patients;
CREATE POLICY "patients_select" ON patients FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "patients_insert" ON patients;
CREATE POLICY "patients_insert" ON patients FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "patients_update" ON patients;
CREATE POLICY "patients_update" ON patients FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Vital Signs
DROP POLICY IF EXISTS "vital_signs_select" ON vital_signs;
CREATE POLICY "vital_signs_select" ON vital_signs FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "vital_signs_insert" ON vital_signs;
CREATE POLICY "vital_signs_insert" ON vital_signs FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Health Metrics
DROP POLICY IF EXISTS "health_metrics_select" ON health_metrics;
CREATE POLICY "health_metrics_select" ON health_metrics FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Health Alerts
DROP POLICY IF EXISTS "health_alerts_select" ON health_alerts;
CREATE POLICY "health_alerts_select" ON health_alerts FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "health_alerts_update" ON health_alerts;
CREATE POLICY "health_alerts_update" ON health_alerts FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Monitoring Plans
DROP POLICY IF EXISTS "monitoring_plans_select" ON monitoring_plans;
CREATE POLICY "monitoring_plans_select" ON monitoring_plans FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Health Reports
DROP POLICY IF EXISTS "health_reports_select" ON health_reports;
CREATE POLICY "health_reports_select" ON health_reports FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- 輔助函數：獲取健康監測統計
CREATE OR REPLACE FUNCTION get_health_monitoring_stats(p_company_id UUID)
RETURNS TABLE (
  total_patients BIGINT,
  active_patients BIGINT,
  total_measurements_today BIGINT,
  active_alerts BIGINT,
  critical_alerts BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM patients WHERE company_id = p_company_id)::BIGINT,
    (SELECT COUNT(*) FROM patients WHERE company_id = p_company_id AND status = 'active')::BIGINT,
    (SELECT COUNT(*) FROM vital_signs WHERE company_id = p_company_id AND measurement_time >= CURRENT_DATE)::BIGINT,
    (SELECT COUNT(*) FROM health_alerts WHERE company_id = p_company_id AND status = 'active')::BIGINT,
    (SELECT COUNT(*) FROM health_alerts WHERE company_id = p_company_id AND status = 'active' AND severity = 'critical')::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 輔助函數：計算 BMI
CREATE OR REPLACE FUNCTION calculate_bmi(height_cm DECIMAL, weight_kg DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  IF height_cm IS NULL OR weight_kg IS NULL OR height_cm <= 0 OR weight_kg <= 0 THEN
    RETURN NULL;
  END IF;
  RETURN ROUND((weight_kg / ((height_cm / 100) * (height_cm / 100)))::DECIMAL, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 輔助函數：獲取 BMI 類別
CREATE OR REPLACE FUNCTION get_bmi_category(bmi DECIMAL)
RETURNS TEXT AS $$
BEGIN
  IF bmi IS NULL THEN RETURN NULL;
  ELSIF bmi < 18.5 THEN RETURN 'underweight';
  ELSIF bmi < 25 THEN RETURN 'normal';
  ELSIF bmi < 30 THEN RETURN 'overweight';
  ELSE RETURN 'obese';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DO $$ BEGIN
  RAISE NOTICE '✅ AI 健康監測系統 - 資料庫完成';
END $$;

