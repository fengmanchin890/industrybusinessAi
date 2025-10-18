-- ========================================
-- AI 藥物管理系統 - 數據庫表結構
-- ========================================
-- 創建時間：2025-10-18
-- ========================================

-- 1. 藥物資料庫表
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 藥物基本信息
  drug_code TEXT UNIQUE NOT NULL, -- 藥品代碼
  drug_name TEXT NOT NULL, -- 商品名
  generic_name TEXT NOT NULL, -- 學名/成分名
  drug_name_en TEXT, -- 英文名
  
  -- 分類
  category TEXT NOT NULL, -- 藥物分類（抗生素、心血管用藥等）
  atc_code TEXT, -- ATC 解剖治療化學分類代碼
  therapeutic_class TEXT, -- 治療分類
  
  -- 劑型和規格
  dosage_form TEXT NOT NULL, -- 劑型（錠劑、膠囊、注射劑等）
  strength TEXT NOT NULL, -- 劑量/濃度
  unit TEXT NOT NULL, -- 單位（mg, ml 等）
  
  -- 用藥指引
  standard_dosage TEXT, -- 標準劑量
  max_daily_dose TEXT, -- 最大日劑量
  administration_route TEXT[], -- 給藥途徑
  frequency_options TEXT[], -- 頻率選項
  
  -- 安全信息
  contraindications TEXT[] DEFAULT '{}', -- 禁忌症
  warnings TEXT[] DEFAULT '{}', -- 警告事項
  precautions TEXT[] DEFAULT '{}', -- 注意事項
  side_effects TEXT[] DEFAULT '{}', -- 副作用
  pregnancy_category TEXT, -- 妊娠分級
  
  -- 交互作用（簡化版本，詳細的在 drug_interactions 表）
  interaction_summary TEXT,
  
  -- 藥物動力學
  pharmacokinetics JSONB DEFAULT '{}'::jsonb, -- 吸收、代謝、排泄等信息
  
  -- 儲存條件
  storage_conditions TEXT,
  shelf_life TEXT,
  
  -- 製造商信息
  manufacturer TEXT,
  supplier TEXT,
  
  -- 健保和價格
  nhi_code TEXT, -- 健保代碼
  nhi_price DECIMAL(10, 2), -- 健保價格
  is_nhi_covered BOOLEAN DEFAULT false, -- 是否健保給付
  
  -- 狀態
  is_active BOOLEAN DEFAULT true,
  is_controlled BOOLEAN DEFAULT false, -- 是否為管制藥品
  controlled_level INTEGER, -- 管制級別（1-4級）
  
  -- 元數據
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 藥物交互作用表
CREATE TABLE IF NOT EXISTS drug_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  drug_a_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  drug_b_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  
  -- 交互作用信息
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'contraindicated')),
  interaction_type TEXT NOT NULL, -- 藥物動力學、藥效學等
  
  description TEXT NOT NULL,
  mechanism TEXT, -- 作用機轉
  clinical_effect TEXT NOT NULL, -- 臨床效果
  recommendation TEXT NOT NULL, -- 處理建議
  
  -- 證據等級
  evidence_level TEXT, -- A, B, C, D
  documentation_quality TEXT, -- 文獻品質
  
  -- 參考來源
  reference_links TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 確保不重複
  CONSTRAINT unique_drug_pair UNIQUE (drug_a_id, drug_b_id)
);

-- 3. 處方記錄表
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 關聯
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
  
  -- 處方信息
  prescription_number TEXT NOT NULL,
  prescription_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 醫師信息
  prescribing_doctor TEXT NOT NULL,
  doctor_license TEXT,
  department TEXT,
  
  -- 處方狀態
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
  
  -- 處方期限
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- 重複領藥
  refills_allowed INTEGER DEFAULT 0,
  refills_remaining INTEGER DEFAULT 0,
  
  -- 備註
  notes TEXT,
  special_instructions TEXT,
  
  -- 審核
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_prescription_number_per_company UNIQUE (company_id, prescription_number)
);

-- 4. 處方明細表
CREATE TABLE IF NOT EXISTS prescription_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE RESTRICT,
  
  -- 用藥信息
  dosage TEXT NOT NULL, -- 每次劑量
  frequency TEXT NOT NULL, -- 頻率
  duration TEXT NOT NULL, -- 療程
  total_quantity DECIMAL(10, 2) NOT NULL, -- 總量
  unit TEXT NOT NULL, -- 單位
  
  -- 給藥途徑和時機
  administration_route TEXT NOT NULL,
  administration_timing TEXT[], -- 飯前、飯後等
  
  -- 用藥指示
  instructions TEXT,
  special_notes TEXT,
  
  -- 領藥記錄
  dispensed BOOLEAN DEFAULT false,
  dispensed_quantity DECIMAL(10, 2),
  dispensed_at TIMESTAMPTZ,
  dispensed_by TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 病患過敏記錄表
CREATE TABLE IF NOT EXISTS patient_allergies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- 過敏源
  allergen_type TEXT NOT NULL CHECK (allergen_type IN ('medication', 'food', 'environmental', 'other')),
  allergen_name TEXT NOT NULL,
  medication_id UUID REFERENCES medications(id) ON DELETE SET NULL, -- 如果是藥物過敏
  
  -- 反應
  reaction_severity TEXT NOT NULL CHECK (reaction_severity IN ('mild', 'moderate', 'severe', 'life-threatening')),
  reaction_symptoms TEXT[] DEFAULT '{}',
  reaction_description TEXT,
  
  -- 發生時間和確認
  onset_date DATE,
  verified BOOLEAN DEFAULT false,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  
  -- 備註
  notes TEXT,
  
  -- 狀態
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AI 交互作用檢查記錄表
CREATE TABLE IF NOT EXISTS drug_interaction_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 檢查對象
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  
  -- 檢查的藥物列表
  medications_checked JSONB NOT NULL, -- [{medication_id, drug_name, dosage}]
  
  -- AI 分析結果
  interactions_found JSONB DEFAULT '[]'::jsonb, -- [{drug_a, drug_b, severity, description, recommendation}]
  allergies_detected JSONB DEFAULT '[]'::jsonb, -- 檢測到的過敏反應
  contraindications_found JSONB DEFAULT '[]'::jsonb, -- 檢測到的禁忌症
  
  -- 風險評分
  overall_risk_score INTEGER CHECK (overall_risk_score BETWEEN 0 AND 100),
  risk_level TEXT CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
  
  -- AI 建議
  ai_recommendations TEXT[] DEFAULT '{}',
  clinical_alerts TEXT[] DEFAULT '{}',
  
  -- AI 模型信息
  ai_model TEXT,
  model_version TEXT,
  confidence_score DECIMAL(5, 2),
  
  -- 處理狀態
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- 執行信息
  check_duration_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 創建索引
-- ========================================

-- medications 索引
CREATE INDEX IF NOT EXISTS idx_medications_drug_code ON medications(drug_code);
CREATE INDEX IF NOT EXISTS idx_medications_drug_name ON medications(drug_name);
CREATE INDEX IF NOT EXISTS idx_medications_generic_name ON medications(generic_name);
CREATE INDEX IF NOT EXISTS idx_medications_category ON medications(category);
CREATE INDEX IF NOT EXISTS idx_medications_atc_code ON medications(atc_code);
CREATE INDEX IF NOT EXISTS idx_medications_active ON medications(is_active) WHERE is_active = true;

-- drug_interactions 索引
CREATE INDEX IF NOT EXISTS idx_drug_interactions_drug_a ON drug_interactions(drug_a_id);
CREATE INDEX IF NOT EXISTS idx_drug_interactions_drug_b ON drug_interactions(drug_b_id);
CREATE INDEX IF NOT EXISTS idx_drug_interactions_severity ON drug_interactions(severity);

-- prescriptions 索引
CREATE INDEX IF NOT EXISTS idx_prescriptions_company_id ON prescriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(prescription_date DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_number ON prescriptions(prescription_number);

-- prescription_items 索引
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription_id ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_medication_id ON prescription_items(medication_id);

-- patient_allergies 索引
CREATE INDEX IF NOT EXISTS idx_patient_allergies_company_id ON patient_allergies(company_id);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient_id ON patient_allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_medication_id ON patient_allergies(medication_id);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_active ON patient_allergies(is_active) WHERE is_active = true;

-- drug_interaction_checks 索引
CREATE INDEX IF NOT EXISTS idx_drug_checks_company_id ON drug_interaction_checks(company_id);
CREATE INDEX IF NOT EXISTS idx_drug_checks_patient_id ON drug_interaction_checks(patient_id);
CREATE INDEX IF NOT EXISTS idx_drug_checks_created_at ON drug_interaction_checks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drug_checks_risk_level ON drug_interaction_checks(risk_level);

-- ========================================
-- 啟用 RLS
-- ========================================

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_interaction_checks ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS 策略
-- ========================================

-- medications - 所有用戶都可以查看（藥物資料庫是公開的）
CREATE POLICY "Anyone can view medications" ON medications FOR SELECT USING (true);

-- drug_interactions - 所有用戶都可以查看
CREATE POLICY "Anyone can view drug interactions" ON drug_interactions FOR SELECT USING (true);

-- prescriptions - 只能查看自己公司的
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their company's prescriptions" ON prescriptions;
  CREATE POLICY "Users can view their company's prescriptions" ON prescriptions FOR SELECT
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their company's prescriptions" ON prescriptions;
  CREATE POLICY "Users can manage their company's prescriptions" ON prescriptions FOR ALL
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- prescription_items - 通過 prescription 關聯控制
CREATE POLICY "Users can view prescription items" ON prescription_items FOR SELECT
  USING (prescription_id IN (SELECT id FROM prescriptions WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage prescription items" ON prescription_items FOR ALL
  USING (prescription_id IN (SELECT id FROM prescriptions WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())));

-- patient_allergies - 只能查看自己公司的
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their company's patient allergies" ON patient_allergies;
  CREATE POLICY "Users can view their company's patient allergies" ON patient_allergies FOR SELECT
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their company's patient allergies" ON patient_allergies;
  CREATE POLICY "Users can manage their company's patient allergies" ON patient_allergies FOR ALL
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- drug_interaction_checks - 只能查看自己公司的
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their company's drug checks" ON drug_interaction_checks;
  CREATE POLICY "Users can view their company's drug checks" ON drug_interaction_checks FOR SELECT
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their company's drug checks" ON drug_interaction_checks;
  CREATE POLICY "Users can manage their company's drug checks" ON drug_interaction_checks FOR ALL
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ========================================
-- 創建觸發器
-- ========================================

-- 更新 updated_at 的觸發器函數
CREATE OR REPLACE FUNCTION update_drug_management_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為各表創建觸發器
DROP TRIGGER IF EXISTS update_medications_updated_at ON medications;
CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON medications FOR EACH ROW EXECUTE FUNCTION update_drug_management_updated_at();

DROP TRIGGER IF EXISTS update_drug_interactions_updated_at ON drug_interactions;
CREATE TRIGGER update_drug_interactions_updated_at
  BEFORE UPDATE ON drug_interactions FOR EACH ROW EXECUTE FUNCTION update_drug_management_updated_at();

DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON prescriptions;
CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_drug_management_updated_at();

DROP TRIGGER IF EXISTS update_prescription_items_updated_at ON prescription_items;
CREATE TRIGGER update_prescription_items_updated_at
  BEFORE UPDATE ON prescription_items FOR EACH ROW EXECUTE FUNCTION update_drug_management_updated_at();

DROP TRIGGER IF EXISTS update_patient_allergies_updated_at ON patient_allergies;
CREATE TRIGGER update_patient_allergies_updated_at
  BEFORE UPDATE ON patient_allergies FOR EACH ROW EXECUTE FUNCTION update_drug_management_updated_at();

DROP TRIGGER IF EXISTS update_drug_interaction_checks_updated_at ON drug_interaction_checks;
CREATE TRIGGER update_drug_interaction_checks_updated_at
  BEFORE UPDATE ON drug_interaction_checks FOR EACH ROW EXECUTE FUNCTION update_drug_management_updated_at();

-- ========================================
-- 創建實用函數
-- ========================================

-- 檢查兩種藥物是否有交互作用
CREATE OR REPLACE FUNCTION check_drug_interaction(drug_a UUID, drug_b UUID)
RETURNS TABLE (
  has_interaction BOOLEAN,
  severity TEXT,
  description TEXT,
  recommendation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    true as has_interaction,
    di.severity,
    di.description,
    di.recommendation
  FROM drug_interactions di
  WHERE (di.drug_a_id = drug_a AND di.drug_b_id = drug_b)
     OR (di.drug_a_id = drug_b AND di.drug_b_id = drug_a)
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 獲取病患的所有活躍過敏記錄
CREATE OR REPLACE FUNCTION get_patient_active_allergies(p_patient_id UUID)
RETURNS TABLE (
  allergen_name TEXT,
  allergen_type TEXT,
  medication_id UUID,
  reaction_severity TEXT,
  reaction_symptoms TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pa.allergen_name,
    pa.allergen_type,
    pa.medication_id,
    pa.reaction_severity,
    pa.reaction_symptoms
  FROM patient_allergies pa
  WHERE pa.patient_id = p_patient_id
    AND pa.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 添加表註釋
-- ========================================

COMMENT ON TABLE medications IS '藥物資料庫';
COMMENT ON TABLE drug_interactions IS '藥物交互作用資料庫';
COMMENT ON TABLE prescriptions IS '處方記錄';
COMMENT ON TABLE prescription_items IS '處方明細';
COMMENT ON TABLE patient_allergies IS '病患過敏記錄';
COMMENT ON TABLE drug_interaction_checks IS 'AI 藥物交互作用檢查記錄';

-- ========================================
-- ✅ 完成！
-- ========================================
SELECT 
  '✅ 藥物管理系統數據庫安裝完成！' as status,
  COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%medication%' OR table_name LIKE '%prescription%' OR table_name LIKE '%drug%' OR table_name LIKE '%allerg%');

