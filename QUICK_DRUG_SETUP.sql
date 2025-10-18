-- ==========================================
-- AI 藥物管理系統 - 完整設置 SQL
-- 在 Supabase Dashboard SQL Editor 中執行此檔案
-- ==========================================
-- 一次性創建所有表格和導入種子數據
-- ==========================================

-- 1. 藥物資料庫表
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drug_code TEXT UNIQUE NOT NULL,
  drug_name TEXT NOT NULL,
  generic_name TEXT NOT NULL,
  drug_name_en TEXT,
  category TEXT NOT NULL,
  atc_code TEXT,
  therapeutic_class TEXT,
  dosage_form TEXT NOT NULL,
  strength TEXT NOT NULL,
  unit TEXT NOT NULL,
  standard_dosage TEXT,
  max_daily_dose TEXT,
  administration_route TEXT[] DEFAULT '{}',
  frequency_options TEXT[] DEFAULT '{}',
  contraindications TEXT[] DEFAULT '{}',
  warnings TEXT[] DEFAULT '{}',
  precautions TEXT[] DEFAULT '{}',
  side_effects TEXT[] DEFAULT '{}',
  pregnancy_category TEXT,
  interaction_summary TEXT,
  pharmacokinetics JSONB DEFAULT '{}'::jsonb,
  storage_conditions TEXT,
  shelf_life TEXT,
  manufacturer TEXT,
  supplier TEXT,
  nhi_code TEXT,
  nhi_price DECIMAL(10, 2),
  is_nhi_covered BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_controlled BOOLEAN DEFAULT false,
  controlled_level INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 藥物交互作用表
CREATE TABLE IF NOT EXISTS drug_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drug_a_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  drug_b_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'contraindicated')),
  interaction_type TEXT NOT NULL,
  description TEXT NOT NULL,
  mechanism TEXT,
  clinical_effect TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  evidence_level TEXT,
  documentation_quality TEXT,
  reference_links TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_drug_pair UNIQUE (drug_a_id, drug_b_id)
);

-- 3. 處方記錄表
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
  prescription_number TEXT NOT NULL,
  prescription_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  prescribing_doctor TEXT NOT NULL,
  doctor_license TEXT,
  department TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  refills_allowed INTEGER DEFAULT 0,
  refills_remaining INTEGER DEFAULT 0,
  notes TEXT,
  special_instructions TEXT,
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
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  total_quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  administration_route TEXT NOT NULL,
  administration_timing TEXT[] DEFAULT '{}',
  instructions TEXT,
  special_notes TEXT,
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
  allergen_type TEXT NOT NULL CHECK (allergen_type IN ('medication', 'food', 'environmental', 'other')),
  allergen_name TEXT NOT NULL,
  medication_id UUID REFERENCES medications(id) ON DELETE SET NULL,
  reaction_severity TEXT NOT NULL CHECK (reaction_severity IN ('mild', 'moderate', 'severe', 'life-threatening')),
  reaction_symptoms TEXT[] DEFAULT '{}',
  reaction_description TEXT,
  onset_date DATE,
  verified BOOLEAN DEFAULT false,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AI 交互作用檢查記錄表
CREATE TABLE IF NOT EXISTS drug_interaction_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  medications_checked JSONB NOT NULL,
  interactions_found JSONB DEFAULT '[]'::jsonb,
  allergies_detected JSONB DEFAULT '[]'::jsonb,
  contraindications_found JSONB DEFAULT '[]'::jsonb,
  overall_risk_score INTEGER CHECK (overall_risk_score BETWEEN 0 AND 100),
  risk_level TEXT CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
  ai_recommendations TEXT[] DEFAULT '{}',
  clinical_alerts TEXT[] DEFAULT '{}',
  ai_model TEXT,
  model_version TEXT,
  confidence_score DECIMAL(5, 2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  check_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_medications_drug_name ON medications(drug_name);
CREATE INDEX IF NOT EXISTS idx_medications_generic_name ON medications(generic_name);
CREATE INDEX IF NOT EXISTS idx_medications_category ON medications(category);
CREATE INDEX IF NOT EXISTS idx_medications_active ON medications(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_drug_interactions_drug_a ON drug_interactions(drug_a_id);
CREATE INDEX IF NOT EXISTS idx_drug_interactions_drug_b ON drug_interactions(drug_b_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_company_id ON prescriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient_id ON patient_allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_drug_checks_company_id ON drug_interaction_checks(company_id);

-- 啟用 RLS
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_interaction_checks ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Anyone can view medications" ON medications FOR SELECT USING (true);
CREATE POLICY "Anyone can view drug interactions" ON drug_interactions FOR SELECT USING (true);

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their company's prescriptions" ON prescriptions;
  CREATE POLICY "Users can view their company's prescriptions" ON prescriptions FOR SELECT
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their company's prescriptions" ON prescriptions;
  CREATE POLICY "Users can manage their company's prescriptions" ON prescriptions FOR ALL
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "Users can view prescription items" ON prescription_items FOR SELECT
  USING (prescription_id IN (SELECT id FROM prescriptions WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage prescription items" ON prescription_items FOR ALL
  USING (prescription_id IN (SELECT id FROM prescriptions WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())));

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their company's patient allergies" ON patient_allergies;
  CREATE POLICY "Users can view their company's patient allergies" ON patient_allergies FOR SELECT
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their company's patient allergies" ON patient_allergies;
  CREATE POLICY "Users can manage their company's patient allergies" ON patient_allergies FOR ALL
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their company's drug checks" ON drug_interaction_checks;
  CREATE POLICY "Users can view their company's drug checks" ON drug_interaction_checks FOR SELECT
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their company's drug checks" ON drug_interaction_checks;
  CREATE POLICY "Users can manage their company's drug checks" ON drug_interaction_checks FOR ALL
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ==========================================
-- 導入種子數據 - 常用藥物
-- ==========================================

INSERT INTO medications (drug_code, drug_name, generic_name, drug_name_en, category, atc_code, therapeutic_class, dosage_form, strength, unit, standard_dosage, max_daily_dose, administration_route, frequency_options, contraindications, warnings, side_effects, pregnancy_category, is_nhi_covered, nhi_price, manufacturer) VALUES
('WAR001', '可邁丁', 'Warfarin', 'Coumadin', '抗凝血劑', 'B01AA03', 'Anticoagulants', '錠劑', '5', 'mg', '2-10mg每日一次', '10mg', ARRAY['口服'], ARRAY['每日一次', '每日兩次'], ARRAY['懷孕', '嚴重出血傾向', '嚴重肝病', '近期手術或創傷'], ARRAY['需定期監測INR', '避免與阿斯匹靈併用', '注意出血風險'], ARRAY['出血', '皮疹', '腹瀉', '噁心'], 'X', true, 2.5, '台灣製藥公司'),
('ASP001', '阿斯匹靈', 'Aspirin', 'Aspirin', '解熱鎮痛劑', 'N02BA01', 'NSAIDs', '錠劑', '100', 'mg', '75-325mg每日一次', '325mg', ARRAY['口服'], ARRAY['每日一次'], ARRAY['胃潰瘍', '出血傾向', '對阿斯匹靈過敏', '嚴重腎功能不全'], ARRAY['飯後服用', '注意胃腸道出血', '兒童使用需注意雷氏症候群'], ARRAY['胃痛', '噁心', '出血'], 'C', true, 1.0, '拜耳'),
('DIG001', '毛地黃', 'Digoxin', 'Lanoxin', '強心劑', 'C01AA05', 'Cardiac Glycosides', '錠劑', '0.25', 'mg', '0.125-0.25mg每日一次', '0.5mg', ARRAY['口服'], ARRAY['每日一次'], ARRAY['房室傳導阻滯', '心室心律不整', '低血鉀'], ARRAY['治療窗窄', '需監測血中濃度', '注意毒性症狀'], ARRAY['噁心', '嘔吐', '視覺異常', '心律不整'], 'C', true, 3.2, 'GSK'),
('MET001', '美福明', 'Metformin', 'Glucophage', '降血糖藥', 'A10BA02', 'Biguanides', '錠劑', '500', 'mg', '500-2000mg每日', '2550mg', ARRAY['口服'], ARRAY['每日兩次', '每日三次'], ARRAY['腎功能不全', '嚴重感染', '脫水', '酒精中毒'], ARRAY['需定期檢查腎功能', '避免與顯影劑同時使用', '注意乳酸中毒風險'], ARRAY['腹瀉', '噁心', '腹脹', '金屬味'], 'B', true, 2.0, 'Merck'),
('LIS001', '賴諾普利', 'Lisinopril', 'Prinivil', 'ACE抑制劑', 'C09AA03', 'ACE Inhibitors', '錠劑', '10', 'mg', '5-40mg每日一次', '40mg', ARRAY['口服'], ARRAY['每日一次'], ARRAY['懷孕', '雙側腎動脈狹窄', '血管性水腫病史'], ARRAY['首次服用可能低血壓', '定期監測腎功能', '避免與鉀補充劑併用'], ARRAY['咳嗽', '頭暈', '高血鉀', '疲勞'], 'D', true, 4.5, 'AstraZeneca'),
('AMO001', '安莫西林', 'Amoxicillin', 'Amoxil', '抗生素', 'J01CA04', 'Penicillins', '膠囊', '500', 'mg', '250-500mg每8小時', '3000mg', ARRAY['口服'], ARRAY['每8小時', '每12小時'], ARRAY['青黴素過敏'], ARRAY['完成整個療程', '注意過敏反應', '可能影響避孕效果'], ARRAY['腹瀉', '噁心', '皮疹', '嘔吐'], 'B', true, 5.0, 'GSK'),
('ATO001', '立普妥', 'Atorvastatin', 'Lipitor', '降血脂藥', 'C10AA05', 'Statins', '錠劑', '20', 'mg', '10-80mg每日一次', '80mg', ARRAY['口服'], ARRAY['每日一次'], ARRAY['活動性肝病', '懷孕', '哺乳'], ARRAY['可能肌肉病變', '定期檢查肝功能', '避免葡萄柚汁'], ARRAY['肌肉痛', '頭痛', '腹瀉', '肝酵素升高'], 'X', true, 10.0, 'Pfizer'),
('OME001', '耐適恩', 'Omeprazole', 'Prilosec', '胃藥', 'A02BC01', 'Proton Pump Inhibitors', '膠囊', '20', 'mg', '20-40mg每日一次', '40mg', ARRAY['口服'], ARRAY['每日一次'], ARRAY['對本品過敏'], ARRAY['長期使用需注意', '可能影響鈣、鎂、維生素B12吸收', '飯前服用'], ARRAY['頭痛', '腹瀉', '噁心', '腹痛'], 'C', true, 8.0, 'AstraZeneca'),
('LEV001', '驅特異', 'Levocetirizine', 'Xyzal', '抗組織胺', 'R06AE09', 'Antihistamines', '錠劑', '5', 'mg', '5mg每日一次', '5mg', ARRAY['口服'], ARRAY['每日一次'], ARRAY['嚴重腎功能不全', '末期腎病'], ARRAY['可能嗜睡', '避免駕駛', '避免飲酒'], ARRAY['嗜睡', '疲倦', '口乾', '頭痛'], 'B', true, 6.5, 'UCB'),
('PAR001', '普拿疼', 'Paracetamol', 'Panadol', '解熱鎮痛劑', 'N02BE01', 'Analgesics', '錠劑', '500', 'mg', '500-1000mg每4-6小時', '4000mg', ARRAY['口服'], ARRAY['每4-6小時', '需要時使用'], ARRAY['嚴重肝功能不全'], ARRAY['不可超過最大劑量', '避免飲酒', '注意肝毒性'], ARRAY['少見', '過量可致肝衰竭'], 'B', true, 1.5, 'GSK')
ON CONFLICT (drug_code) DO NOTHING;

-- ==========================================
-- 導入藥物交互作用數據
-- ==========================================

-- 首先取得藥物 ID
DO $$
DECLARE
  v_war_id UUID; v_asp_id UUID; v_dig_id UUID; v_met_id UUID;
  v_lis_id UUID; v_ato_id UUID; v_ome_id UUID; v_par_id UUID;
BEGIN
  SELECT id INTO v_war_id FROM medications WHERE drug_code = 'WAR001';
  SELECT id INTO v_asp_id FROM medications WHERE drug_code = 'ASP001';
  SELECT id INTO v_dig_id FROM medications WHERE drug_code = 'DIG001';
  SELECT id INTO v_met_id FROM medications WHERE drug_code = 'MET001';
  SELECT id INTO v_lis_id FROM medications WHERE drug_code = 'LIS001';
  SELECT id INTO v_ato_id FROM medications WHERE drug_code = 'ATO001';
  SELECT id INTO v_ome_id FROM medications WHERE drug_code = 'OME001';
  SELECT id INTO v_par_id FROM medications WHERE drug_code = 'PAR001';

  -- 插入交互作用
  INSERT INTO drug_interactions (drug_a_id, drug_b_id, severity, interaction_type, description, mechanism, clinical_effect, recommendation, evidence_level, documentation_quality) VALUES
  (v_war_id, v_asp_id, 'major', '藥效學交互作用', 'Warfarin 與 Aspirin 併用會顯著增加出血風險', '兩者皆具抗凝血作用，併用會產生加成效果', '可能導致嚴重出血，包括腦出血、消化道出血等', '除非有明確適應症，否則應避免併用。如必須併用，需密切監測INR和出血症狀，並考慮降低劑量', 'A', 'Excellent'),
  (v_war_id, v_dig_id, 'moderate', '藥物動力學交互作用', 'Warfarin 可能增加 Digoxin 的血中濃度', 'Warfarin 可能影響 Digoxin 的代謝', '可能增加 Digoxin 毒性風險', '併用時應監測 Digoxin 血中濃度和臨床症狀', 'B', 'Good'),
  (v_asp_id, v_lis_id, 'moderate', '藥效學交互作用', 'Aspirin 可能降低 ACE 抑制劑的降壓效果', 'NSAIDs 可能抑制前列腺素合成，減弱 ACE 抑制劑的效果', '血壓控制可能變差，腎功能可能惡化', '監測血壓和腎功能，必要時調整劑量', 'B', 'Good'),
  (v_met_id, v_lis_id, 'minor', '藥效學交互作用', 'ACE 抑制劑可能增強 Metformin 的降血糖效果', 'ACE 抑制劑可能改善胰島素敏感性', '血糖可能下降', '監測血糖，必要時調整劑量', 'C', 'Fair'),
  (v_ato_id, v_dig_id, 'moderate', '藥物動力學交互作用', 'Atorvastatin 可能增加 Digoxin 的血中濃度', 'Statin 類藥物可能影響 P-glycoprotein，減少 Digoxin 排除', 'Digoxin 毒性風險增加', '開始併用或調整劑量時，應監測 Digoxin 血中濃度', 'B', 'Good'),
  (v_ome_id, v_war_id, 'moderate', '藥物動力學交互作用', 'Omeprazole 可能增強 Warfarin 的抗凝血效果', 'Omeprazole 抑制 CYP2C19，減少 Warfarin 代謝', '出血風險增加', '密切監測 INR，必要時調整 Warfarin 劑量', 'B', 'Good'),
  (v_par_id, v_war_id, 'moderate', '藥效學交互作用', '長期或高劑量使用 Paracetamol 可能增強 Warfarin 的效果', '機轉不明確', 'INR 可能升高，出血風險增加', '如需長期使用 Paracetamol，應更頻繁監測 INR', 'B', 'Good')
  ON CONFLICT (drug_a_id, drug_b_id) DO NOTHING;

END $$;

-- ==========================================
-- 完成！
-- ==========================================

SELECT 
  '✅ 藥物管理系統安裝完成！' as status,
  (SELECT COUNT(*) FROM medications) as medications_count,
  (SELECT COUNT(*) FROM drug_interactions) as interactions_count;

