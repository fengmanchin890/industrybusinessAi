-- ========================================
-- AI 藥物管理系統 - 數據庫表結構
-- ========================================

-- 1. 藥物主表
CREATE TABLE IF NOT EXISTS drugs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  drug_code TEXT UNIQUE NOT NULL,
  drug_name TEXT NOT NULL,
  generic_name TEXT,
  drug_category TEXT NOT NULL, -- antibiotic, painkiller, antiviral, etc.
  dosage_form TEXT NOT NULL, -- tablet, capsule, injection, syrup
  strength TEXT NOT NULL, -- 500mg, 10mg/ml, etc.
  manufacturer TEXT,
  requires_prescription BOOLEAN DEFAULT true,
  controlled_substance BOOLEAN DEFAULT false,
  storage_requirements TEXT,
  side_effects TEXT[],
  contraindications TEXT[],
  interactions TEXT[],
  max_daily_dose TEXT,
  unit_price DECIMAL(10, 2),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 藥物庫存表
CREATE TABLE IF NOT EXISTS drug_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  batch_number TEXT,
  quantity INTEGER DEFAULT 0,
  expiry_date DATE,
  manufacturing_date DATE,
  location TEXT,
  min_stock_level INTEGER DEFAULT 10,
  status TEXT DEFAULT 'available', -- available, expired, recalled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 處方表
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  prescription_number TEXT UNIQUE NOT NULL,
  patient_name TEXT NOT NULL,
  patient_id_number TEXT,
  patient_age INTEGER,
  patient_weight DECIMAL(5, 2),
  patient_allergies TEXT[],
  doctor_name TEXT NOT NULL,
  doctor_license TEXT,
  diagnosis TEXT,
  prescription_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending', -- pending, dispensed, cancelled
  notes TEXT,
  ai_checked BOOLEAN DEFAULT false,
  ai_warnings TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 處方明細表
CREATE TABLE IF NOT EXISTS prescription_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  drug_id UUID NOT NULL REFERENCES drugs(id),
  quantity INTEGER NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration_days INTEGER,
  instructions TEXT,
  ai_risk_score DECIMAL(5, 2),
  ai_warnings TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 配藥記錄表
CREATE TABLE IF NOT EXISTS dispensing_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  prescription_id UUID NOT NULL REFERENCES prescriptions(id),
  drug_id UUID NOT NULL REFERENCES drugs(id),
  quantity_dispensed INTEGER NOT NULL,
  batch_number TEXT,
  dispensed_by UUID REFERENCES users(id),
  dispensed_at TIMESTAMPTZ DEFAULT NOW(),
  patient_counseled BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 藥物警示記錄表
CREATE TABLE IF NOT EXISTS drug_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  prescription_id UUID REFERENCES prescriptions(id),
  alert_type TEXT NOT NULL, -- interaction, allergy, overdose, contraindication
  severity TEXT NOT NULL, -- critical, high, moderate, low
  message TEXT NOT NULL,
  drugs_involved UUID[],
  recommendations TEXT[],
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 藥物使用統計表
CREATE TABLE IF NOT EXISTS drug_usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  metric_date DATE DEFAULT CURRENT_DATE,
  total_prescriptions INTEGER DEFAULT 0,
  total_dispensed INTEGER DEFAULT 0,
  ai_warnings_generated INTEGER DEFAULT 0,
  critical_alerts INTEGER DEFAULT 0,
  average_processing_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_drugs_company ON drugs(company_id);
CREATE INDEX IF NOT EXISTS idx_drugs_category ON drugs(drug_category);
CREATE INDEX IF NOT EXISTS idx_drug_inventory_drug ON drug_inventory(drug_id);
CREATE INDEX IF NOT EXISTS idx_drug_inventory_expiry ON drug_inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_company ON prescriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(prescription_date);
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_drug ON prescription_items(drug_id);
CREATE INDEX IF NOT EXISTS idx_dispensing_prescription ON dispensing_records(prescription_id);
CREATE INDEX IF NOT EXISTS idx_alerts_company ON drug_alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON drug_alerts(severity);

-- 啟用 RLS
ALTER TABLE drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispensing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_usage_metrics ENABLE ROW LEVEL SECURITY;

-- RLS 政策
DROP POLICY IF EXISTS "drugs_select" ON drugs;
CREATE POLICY "drugs_select" ON drugs FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "drug_inventory_select" ON drug_inventory;
CREATE POLICY "drug_inventory_select" ON drug_inventory FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "prescriptions_select" ON prescriptions;
CREATE POLICY "prescriptions_select" ON prescriptions FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "prescription_items_select" ON prescription_items;
CREATE POLICY "prescription_items_select" ON prescription_items FOR SELECT TO authenticated
  USING (prescription_id IN (SELECT id FROM prescriptions WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));

DROP POLICY IF EXISTS "dispensing_select" ON dispensing_records;
CREATE POLICY "dispensing_select" ON dispensing_records FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "alerts_select" ON drug_alerts;
CREATE POLICY "alerts_select" ON drug_alerts FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "metrics_select" ON drug_usage_metrics;
CREATE POLICY "metrics_select" ON drug_usage_metrics FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- 輔助函數：獲取藥物統計
CREATE OR REPLACE FUNCTION get_drug_stats(p_company_id UUID)
RETURNS TABLE (
  total_drugs BIGINT,
  total_prescriptions BIGINT,
  pending_prescriptions BIGINT,
  low_stock_drugs BIGINT,
  expired_stock BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM drugs WHERE company_id = p_company_id AND status = 'active')::BIGINT,
    (SELECT COUNT(*) FROM prescriptions WHERE company_id = p_company_id AND prescription_date >= CURRENT_DATE - 30)::BIGINT,
    (SELECT COUNT(*) FROM prescriptions WHERE company_id = p_company_id AND status = 'pending')::BIGINT,
    (SELECT COUNT(DISTINCT drug_id) FROM drug_inventory WHERE company_id = p_company_id AND quantity <= min_stock_level)::BIGINT,
    (SELECT COUNT(*) FROM drug_inventory WHERE company_id = p_company_id AND expiry_date < CURRENT_DATE AND status = 'available')::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 輔助函數：檢查藥物相互作用
CREATE OR REPLACE FUNCTION check_drug_interactions(p_drug_ids UUID[])
RETURNS TABLE (
  has_interaction BOOLEAN,
  interaction_details TEXT[]
) AS $$
DECLARE
  v_interactions TEXT[] := ARRAY[]::TEXT[];
  v_has_interaction BOOLEAN := false;
BEGIN
  -- 簡化版本：實際應該有更複雜的相互作用數據庫
  IF array_length(p_drug_ids, 1) > 1 THEN
    v_has_interaction := true;
    v_interactions := ARRAY['檢測到多種藥物，請注意可能的相互作用'];
  END IF;
  
  RETURN QUERY SELECT v_has_interaction, v_interactions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN RAISE NOTICE '✅ AI 藥物管理系統 - 資料庫完成'; END $$;

