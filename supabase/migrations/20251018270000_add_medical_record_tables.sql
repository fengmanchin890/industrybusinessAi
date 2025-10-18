-- ========================================
-- AI 病歷助理系統 - 資料庫 Migration
-- ========================================

-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 病歷記錄表
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  record_number TEXT UNIQUE NOT NULL,
  patient_name TEXT NOT NULL,
  patient_id_number TEXT,
  patient_age INTEGER,
  patient_gender TEXT CHECK (patient_gender IN ('male', 'female', 'other')),
  patient_blood_type TEXT,
  visit_date TIMESTAMPTZ DEFAULT NOW(),
  visit_type TEXT, -- outpatient, emergency, inpatient
  department TEXT,
  doctor_name TEXT NOT NULL,
  doctor_license TEXT,
  chief_complaint TEXT NOT NULL, -- 主訴
  present_illness TEXT, -- 現病史
  past_history TEXT[], -- 既往史
  family_history TEXT[], -- 家族史
  allergy_history TEXT[], -- 過敏史
  symptoms TEXT[], -- 症狀列表
  vital_signs JSONB, -- 生命體征
  physical_examination TEXT, -- 體格檢查
  laboratory_results JSONB, -- 檢驗結果
  imaging_results JSONB, -- 影像檢查結果
  diagnosis TEXT, -- 診斷
  icd_codes TEXT[], -- ICD 診斷代碼
  treatment_plan TEXT, -- 治療計劃
  medications JSONB, -- 用藥記錄
  procedures TEXT[], -- 處置/手術
  follow_up TEXT, -- 追蹤建議
  notes TEXT, -- 備註
  status TEXT DEFAULT 'draft', -- draft, completed, reviewed, archived
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AI 病歷分析表
CREATE TABLE IF NOT EXISTS medical_record_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL, -- summary, diagnosis_suggestion, risk_assessment, medication_check
  ai_summary TEXT, -- AI 摘要
  key_points TEXT[], -- 關鍵點
  symptom_analysis JSONB, -- 症狀分析
  diagnosis_suggestions TEXT[], -- 診斷建議
  risk_factors TEXT[], -- 風險因素
  risk_level TEXT, -- low, moderate, high, critical
  medication_interactions TEXT[], -- 藥物交互作用
  treatment_recommendations TEXT[], -- 治療建議
  follow_up_suggestions TEXT[], -- 追蹤建議
  confidence_score DECIMAL(5,2), -- AI 信心度 0-100
  processing_time_ms INTEGER, -- 處理時間(毫秒)
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 病歷模板表
CREATE TABLE IF NOT EXISTS medical_record_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  department TEXT,
  visit_type TEXT,
  template_content JSONB NOT NULL, -- 模板內容結構
  fields TEXT[], -- 必填欄位
  is_default BOOLEAN DEFAULT false,
  created_by TEXT,
  status TEXT DEFAULT 'active', -- active, inactive
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 症狀字典表
CREATE TABLE IF NOT EXISTS symptom_dictionary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symptom_code TEXT UNIQUE NOT NULL,
  symptom_name_zh TEXT NOT NULL,
  symptom_name_en TEXT,
  category TEXT, -- respiratory, cardiovascular, digestive, etc.
  severity_levels TEXT[], -- mild, moderate, severe
  related_conditions TEXT[], -- 相關疾病
  icd_codes TEXT[], -- 關聯 ICD 代碼
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 診斷建議記錄表
CREATE TABLE IF NOT EXISTS diagnosis_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  suggestion_text TEXT NOT NULL,
  icd_code TEXT,
  confidence_score DECIMAL(5,2),
  reasoning TEXT, -- AI 推理依據
  supporting_symptoms TEXT[],
  supporting_tests TEXT[],
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 病歷審核記錄表
CREATE TABLE IF NOT EXISTS medical_record_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  review_type TEXT, -- quality_check, peer_review, supervisor_review
  review_status TEXT, -- approved, needs_revision, rejected
  review_comments TEXT,
  issues_found TEXT[],
  corrections_made TEXT[],
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_medical_records_company ON medical_records(company_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_date ON medical_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor ON medical_records(doctor_name);
CREATE INDEX IF NOT EXISTS idx_medical_records_status ON medical_records(status);
CREATE INDEX IF NOT EXISTS idx_medical_record_analysis_record ON medical_record_analysis(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_suggestions_record ON diagnosis_suggestions(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_medical_record_reviews_record ON medical_record_reviews(medical_record_id);

-- RLS 政策
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_record_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_record_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_dictionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_record_reviews ENABLE ROW LEVEL SECURITY;

-- Medical Records
DROP POLICY IF EXISTS "medical_records_select" ON medical_records;
CREATE POLICY "medical_records_select" ON medical_records FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "medical_records_insert" ON medical_records;
CREATE POLICY "medical_records_insert" ON medical_records FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "medical_records_update" ON medical_records;
CREATE POLICY "medical_records_update" ON medical_records FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Medical Record Analysis
DROP POLICY IF EXISTS "medical_record_analysis_select" ON medical_record_analysis;
CREATE POLICY "medical_record_analysis_select" ON medical_record_analysis FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "medical_record_analysis_insert" ON medical_record_analysis;
CREATE POLICY "medical_record_analysis_insert" ON medical_record_analysis FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Templates
DROP POLICY IF EXISTS "medical_record_templates_select" ON medical_record_templates;
CREATE POLICY "medical_record_templates_select" ON medical_record_templates FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Symptom Dictionary (公開讀取)
DROP POLICY IF EXISTS "symptom_dictionary_select" ON symptom_dictionary;
CREATE POLICY "symptom_dictionary_select" ON symptom_dictionary FOR SELECT TO authenticated
  USING (true);

-- Diagnosis Suggestions
DROP POLICY IF EXISTS "diagnosis_suggestions_select" ON diagnosis_suggestions;
CREATE POLICY "diagnosis_suggestions_select" ON diagnosis_suggestions FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "diagnosis_suggestions_update" ON diagnosis_suggestions;
CREATE POLICY "diagnosis_suggestions_update" ON diagnosis_suggestions FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Reviews
DROP POLICY IF EXISTS "medical_record_reviews_select" ON medical_record_reviews;
CREATE POLICY "medical_record_reviews_select" ON medical_record_reviews FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- 輔助函數：獲取病歷統計
CREATE OR REPLACE FUNCTION get_medical_record_stats(p_company_id UUID)
RETURNS TABLE (
  total_records BIGINT,
  records_today BIGINT,
  pending_reviews BIGINT,
  high_risk_cases BIGINT,
  ai_analyses_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM medical_records WHERE company_id = p_company_id)::BIGINT,
    (SELECT COUNT(*) FROM medical_records WHERE company_id = p_company_id AND visit_date >= CURRENT_DATE)::BIGINT,
    (SELECT COUNT(*) FROM medical_records WHERE company_id = p_company_id AND status = 'draft')::BIGINT,
    (SELECT COUNT(*) FROM medical_record_analysis WHERE company_id = p_company_id AND risk_level IN ('high', 'critical'))::BIGINT,
    (SELECT COUNT(*) FROM medical_record_analysis WHERE company_id = p_company_id)::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 輔助函數：搜尋病歷
CREATE OR REPLACE FUNCTION search_medical_records(
  p_company_id UUID,
  p_search_term TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  record_number TEXT,
  patient_name TEXT,
  visit_date TIMESTAMPTZ,
  doctor_name TEXT,
  chief_complaint TEXT,
  diagnosis TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mr.id,
    mr.record_number,
    mr.patient_name,
    mr.visit_date,
    mr.doctor_name,
    mr.chief_complaint,
    mr.diagnosis,
    mr.status
  FROM medical_records mr
  WHERE mr.company_id = p_company_id
    AND (
      mr.patient_name ILIKE '%' || p_search_term || '%' OR
      mr.record_number ILIKE '%' || p_search_term || '%' OR
      mr.chief_complaint ILIKE '%' || p_search_term || '%' OR
      mr.diagnosis ILIKE '%' || p_search_term || '%'
    )
  ORDER BY mr.visit_date DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  RAISE NOTICE '✅ AI 病歷助理系統 - 資料庫完成';
END $$;

