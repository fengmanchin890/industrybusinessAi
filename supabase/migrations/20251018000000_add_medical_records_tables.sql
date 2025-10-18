-- ========================================
-- AI 病歷分析系統 - 數據庫表結構
-- ========================================
-- 創建時間：2025-10-18
-- ========================================

-- 1. 患者基本資料表
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL, -- 醫院內部患者編號
  patient_name TEXT NOT NULL,
  date_of_birth DATE,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  blood_type TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  address TEXT,
  insurance_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 複合唯一索引
  CONSTRAINT unique_patient_id_per_company UNIQUE (company_id, patient_id)
);

-- 2. 病歷記錄表
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  record_number TEXT NOT NULL, -- 病歷編號
  visit_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visit_type TEXT CHECK (visit_type IN ('outpatient', 'emergency', 'inpatient', 'followup')),
  department TEXT,
  attending_doctor TEXT,
  
  -- 主訴和症狀
  chief_complaint TEXT NOT NULL,
  symptoms TEXT[] DEFAULT '{}',
  symptom_duration TEXT,
  symptom_severity TEXT CHECK (symptom_severity IN ('mild', 'moderate', 'severe', 'critical')),
  
  -- 生命徵象
  vital_signs JSONB DEFAULT '{}'::jsonb, -- {bloodPressure, heartRate, temperature, respiratoryRate, oxygenSaturation, weight, height}
  
  -- 病史
  medical_history TEXT[] DEFAULT '{}',
  surgical_history TEXT[] DEFAULT '{}',
  family_history TEXT[] DEFAULT '{}',
  social_history TEXT,
  
  -- 用藥和過敏
  current_medications TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  
  -- 檢查
  physical_examination TEXT,
  laboratory_results JSONB DEFAULT '[]'::jsonb,
  imaging_results JSONB DEFAULT '[]'::jsonb,
  
  -- 診斷和治療
  diagnosis TEXT[] DEFAULT '{}',
  icd_codes TEXT[] DEFAULT '{}',
  treatment_plan TEXT[] DEFAULT '{}',
  prescriptions JSONB DEFAULT '[]'::jsonb,
  procedures JSONB DEFAULT '[]'::jsonb,
  
  -- 追蹤
  follow_up_instructions TEXT,
  follow_up_date TIMESTAMPTZ,
  
  -- 醫師備註
  doctor_notes TEXT,
  
  -- 狀態
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  
  -- 元數據
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_record_number_per_company UNIQUE (company_id, record_number)
);

-- 3. AI 分析結果表
CREATE TABLE IF NOT EXISTS medical_ai_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  
  -- AI 分析結果
  summary TEXT,
  key_findings TEXT[] DEFAULT '{}',
  risk_factors TEXT[] DEFAULT '{}',
  suggested_diagnosis TEXT[] DEFAULT '{}',
  medication_interactions TEXT[] DEFAULT '{}',
  follow_up_recommendations TEXT[] DEFAULT '{}',
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  
  -- AI 模型資訊
  ai_model TEXT,
  confidence_score DECIMAL(5, 2),
  
  -- 分析時間
  analysis_duration_seconds INTEGER,
  
  -- 審核狀態
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 醫療統計表
CREATE TABLE IF NOT EXISTS medical_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- 統計數據
  total_records INTEGER DEFAULT 0,
  analyzed_records INTEGER DEFAULT 0,
  avg_analysis_time_seconds INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- 按緊急程度統計
  low_urgency_count INTEGER DEFAULT 0,
  medium_urgency_count INTEGER DEFAULT 0,
  high_urgency_count INTEGER DEFAULT 0,
  critical_urgency_count INTEGER DEFAULT 0,
  
  -- 按部門統計
  department_stats JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_company_stat_date UNIQUE (company_id, stat_date)
);

-- ========================================
-- 創建索引
-- ========================================

-- patients 索引
CREATE INDEX IF NOT EXISTS idx_patients_company_id ON patients(company_id);
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(patient_name);

-- medical_records 索引
CREATE INDEX IF NOT EXISTS idx_medical_records_company_id ON medical_records(company_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_date ON medical_records(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_record_number ON medical_records(record_number);
CREATE INDEX IF NOT EXISTS idx_medical_records_status ON medical_records(status);
CREATE INDEX IF NOT EXISTS idx_medical_records_company_date ON medical_records(company_id, visit_date DESC);

-- medical_ai_analysis 索引
CREATE INDEX IF NOT EXISTS idx_medical_ai_analysis_company_id ON medical_ai_analysis(company_id);
CREATE INDEX IF NOT EXISTS idx_medical_ai_analysis_record_id ON medical_ai_analysis(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_medical_ai_analysis_urgency ON medical_ai_analysis(urgency_level);
CREATE INDEX IF NOT EXISTS idx_medical_ai_analysis_created_at ON medical_ai_analysis(created_at DESC);

-- medical_stats 索引
CREATE INDEX IF NOT EXISTS idx_medical_stats_company_date ON medical_stats(company_id, stat_date DESC);

-- ========================================
-- 啟用 RLS
-- ========================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_stats ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS 策略
-- ========================================

-- patients 策略
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their company's patients" ON patients;
  CREATE POLICY "Users can view their company's patients" ON patients FOR SELECT
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their company's patients" ON patients;
  CREATE POLICY "Users can manage their company's patients" ON patients FOR ALL
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- medical_records 策略
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their company's medical records" ON medical_records;
  CREATE POLICY "Users can view their company's medical records" ON medical_records FOR SELECT
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their company's medical records" ON medical_records;
  CREATE POLICY "Users can manage their company's medical records" ON medical_records FOR ALL
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- medical_ai_analysis 策略
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their company's AI analysis" ON medical_ai_analysis;
  CREATE POLICY "Users can view their company's AI analysis" ON medical_ai_analysis FOR SELECT
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their company's AI analysis" ON medical_ai_analysis;
  CREATE POLICY "Users can manage their company's AI analysis" ON medical_ai_analysis FOR ALL
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- medical_stats 策略
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their company's medical stats" ON medical_stats;
  CREATE POLICY "Users can view their company's medical stats" ON medical_stats FOR SELECT
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ========================================
-- 創建觸發器和函數
-- ========================================

-- 更新 updated_at 的觸發器函數
CREATE OR REPLACE FUNCTION update_medical_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為各表創建觸發器
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_medical_updated_at();

DROP TRIGGER IF EXISTS update_medical_records_updated_at ON medical_records;
CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION update_medical_updated_at();

DROP TRIGGER IF EXISTS update_medical_ai_analysis_updated_at ON medical_ai_analysis;
CREATE TRIGGER update_medical_ai_analysis_updated_at
  BEFORE UPDATE ON medical_ai_analysis FOR EACH ROW EXECUTE FUNCTION update_medical_updated_at();

DROP TRIGGER IF EXISTS update_medical_stats_updated_at ON medical_stats;
CREATE TRIGGER update_medical_stats_updated_at
  BEFORE UPDATE ON medical_stats FOR EACH ROW EXECUTE FUNCTION update_medical_updated_at();

-- ========================================
-- 創建統計函數
-- ========================================

-- 獲取今日統計
CREATE OR REPLACE FUNCTION get_medical_today_stats(p_company_id UUID)
RETURNS TABLE (
  total_records BIGINT,
  analyzed_today BIGINT,
  avg_analysis_time INTEGER,
  accuracy_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT mr.id)::BIGINT as total_records,
    COUNT(DISTINCT maa.id)::BIGINT as analyzed_today,
    COALESCE(AVG(maa.analysis_duration_seconds)::INTEGER, 45) as avg_analysis_time,
    COALESCE(AVG(maa.confidence_score), 92.0) as accuracy_rate
  FROM medical_records mr
  LEFT JOIN medical_ai_analysis maa ON mr.id = maa.medical_record_id
    AND DATE(maa.created_at) = CURRENT_DATE
  WHERE mr.company_id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 插入示例數據
-- ========================================

-- 注意：這些是示例數據，生產環境應該刪除

-- 為 fenghospital 公司添加示例患者和病歷
DO $$ 
DECLARE
  v_company_id UUID;
  v_patient1_id UUID;
  v_patient2_id UUID;
  v_record1_id UUID;
  v_record2_id UUID;
BEGIN
  -- 查找 fenghospital 公司ID（如果存在）
  SELECT id INTO v_company_id FROM companies WHERE name ILIKE '%hospital%' LIMIT 1;
  
  IF v_company_id IS NOT NULL THEN
    -- 插入患者1
    INSERT INTO patients (company_id, patient_id, patient_name, age, gender, contact_phone)
    VALUES (v_company_id, 'P001', '王小明', 65, 'male', '0912-345-678')
    ON CONFLICT (company_id, patient_id) DO NOTHING
    RETURNING id INTO v_patient1_id;
    
    -- 如果沒有返回ID，查詢現有的
    IF v_patient1_id IS NULL THEN
      SELECT id INTO v_patient1_id FROM patients WHERE company_id = v_company_id AND patient_id = 'P001';
    END IF;
    
    -- 插入患者2
    INSERT INTO patients (company_id, patient_id, patient_name, age, gender, contact_phone)
    VALUES (v_company_id, 'P002', '李美華', 45, 'female', '0923-456-789')
    ON CONFLICT (company_id, patient_id) DO NOTHING
    RETURNING id INTO v_patient2_id;
    
    IF v_patient2_id IS NULL THEN
      SELECT id INTO v_patient2_id FROM patients WHERE company_id = v_company_id AND patient_id = 'P002';
    END IF;
    
    -- 插入病歷1（如果患者存在）
    IF v_patient1_id IS NOT NULL THEN
      INSERT INTO medical_records (
        company_id, patient_id, record_number, visit_date, visit_type, department,
        chief_complaint, symptoms, vital_signs, medical_history, current_medications,
        allergies, physical_examination, diagnosis, treatment_plan, doctor_notes
      )
      VALUES (
        v_company_id, v_patient1_id, 'MR-2025-001', '2025-10-15'::TIMESTAMPTZ, 'emergency', '心臟內科',
        '胸痛、呼吸困難', ARRAY['胸痛', '呼吸困難', '冷汗'],
        '{"bloodPressure": "160/95", "heartRate": 105, "temperature": 37.2, "respiratoryRate": 22, "oxygenSaturation": 94}'::JSONB,
        ARRAY['高血壓 (10年)', '糖尿病 (5年)'], ARRAY['降血壓藥', '降血糖藥'],
        ARRAY['無已知過敏'], '心音規則，無雜音，肺部聽診正常',
        ARRAY['冠狀動脈疾病', '穩定型心絞痛'], ARRAY['持續藥物治療', '心臟導管檢查', '生活型態調整'],
        '患者需要密切監測，建議住院觀察'
      )
      ON CONFLICT (company_id, record_number) DO NOTHING
      RETURNING id INTO v_record1_id;
    END IF;
    
    -- 插入病歷2
    IF v_patient2_id IS NOT NULL THEN
      INSERT INTO medical_records (
        company_id, patient_id, record_number, visit_date, visit_type, department,
        chief_complaint, symptoms, vital_signs, medical_history, current_medications,
        allergies, physical_examination, diagnosis, treatment_plan, doctor_notes
      )
      VALUES (
        v_company_id, v_patient2_id, 'MR-2025-002', '2025-10-16'::TIMESTAMPTZ, 'outpatient', '神經內科',
        '頭痛、噁心', ARRAY['頭痛', '噁心', '畏光'],
        '{"bloodPressure": "140/90", "heartRate": 78, "temperature": 36.8, "respiratoryRate": 16, "oxygenSaturation": 98}'::JSONB,
        ARRAY['偏頭痛 (3年)'], ARRAY['止痛藥'],
        ARRAY['無已知過敏'], '神經學檢查正常，頸部僵硬，瞳孔對光反應正常',
        ARRAY['偏頭痛', '高血壓'], ARRAY['止痛藥物', '血壓控制', '生活型態調整'],
        '建議進行進一步檢查排除其他原因'
      )
      ON CONFLICT (company_id, record_number) DO NOTHING
      RETURNING id INTO v_record2_id;
    END IF;
  END IF;
END $$;

-- 添加表註釋
COMMENT ON TABLE patients IS '患者基本資料表';
COMMENT ON TABLE medical_records IS '病歷記錄表';
COMMENT ON TABLE medical_ai_analysis IS 'AI 病歷分析結果表';
COMMENT ON TABLE medical_stats IS '醫療統計數據表';

-- ========================================
-- ✅ 完成！
-- ========================================
SELECT 
  '✅ 醫療系統數據庫安裝完成！' as status,
  COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE 'medical%' OR table_name = 'patients');

