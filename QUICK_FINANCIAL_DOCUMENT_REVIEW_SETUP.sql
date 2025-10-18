-- ========================================
-- AI 財務文件審核系統 - 快速設置 SQL
-- ========================================
-- 在 Supabase Dashboard SQL Editor 中執行此檔案
-- 一次性創建所有表格、導入種子數據、設置 RLS
-- ========================================

-- 首先，確保所有需要的擴展已啟用
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. 文件類型定義表
-- ========================================
CREATE TABLE IF NOT EXISTS document_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type_code TEXT UNIQUE NOT NULL,
  type_name TEXT NOT NULL,
  type_name_en TEXT,
  category TEXT NOT NULL,
  required_fields JSONB DEFAULT '[]'::jsonb,
  compliance_rules JSONB DEFAULT '[]'::jsonb,
  risk_factors JSONB DEFAULT '[]'::jsonb,
  ai_check_points TEXT[] DEFAULT '{}',
  auto_approval_threshold DECIMAL(5, 2) DEFAULT 90.00,
  manual_review_threshold DECIMAL(5, 2) DEFAULT 70.00,
  max_file_size_mb INTEGER DEFAULT 10,
  allowed_formats TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx', 'jpg', 'png'],
  retention_days INTEGER DEFAULT 2555,
  is_active BOOLEAN DEFAULT true,
  requires_certification BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 2. 財務文件表
-- ========================================
CREATE TABLE IF NOT EXISTS financial_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_number TEXT NOT NULL,
  document_type_id UUID NOT NULL REFERENCES document_types(id),
  document_title TEXT NOT NULL,
  document_description TEXT,
  file_url TEXT,
  file_name TEXT NOT NULL,
  file_size_kb INTEGER,
  file_format TEXT NOT NULL,
  file_hash TEXT,
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_by_name TEXT,
  submission_date TIMESTAMPTZ DEFAULT NOW(),
  source_system TEXT,
  customer_id TEXT,
  customer_name TEXT,
  customer_id_number TEXT,
  case_number TEXT,
  loan_amount DECIMAL(15, 2),
  investment_amount DECIMAL(15, 2),
  review_status TEXT DEFAULT 'pending' CHECK (
    review_status IN ('pending', 'processing', 'approved', 'rejected', 'requires_info', 'on_hold')
  ),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  ai_confidence_score DECIMAL(5, 2),
  ai_risk_score DECIMAL(5, 2),
  ai_compliance_score DECIMAL(5, 2),
  ai_completeness_score DECIMAL(5, 2),
  ai_findings JSONB DEFAULT '[]'::jsonb,
  risk_factors_detected TEXT[] DEFAULT '{}',
  missing_information TEXT[] DEFAULT '{}',
  compliance_issues TEXT[] DEFAULT '{}',
  ai_recommendation TEXT,
  ai_reasoning TEXT,
  ai_summary TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by_name TEXT,
  review_date TIMESTAMPTZ,
  review_notes TEXT,
  reviewer_decision TEXT,
  final_decision TEXT,
  final_decision_by UUID REFERENCES users(id) ON DELETE SET NULL,
  final_decision_date TIMESTAMPTZ,
  final_decision_notes TEXT,
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. 文件審核歷史表
-- ========================================
CREATE TABLE IF NOT EXISTS document_review_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES financial_documents(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  action_by UUID REFERENCES users(id) ON DELETE SET NULL,
  action_by_name TEXT,
  action_date TIMESTAMPTZ DEFAULT NOW(),
  previous_status TEXT,
  new_status TEXT,
  notes TEXT,
  changes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 4. 合規規則表
-- ========================================
CREATE TABLE IF NOT EXISTS compliance_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_code TEXT UNIQUE NOT NULL,
  rule_name TEXT NOT NULL,
  rule_description TEXT NOT NULL,
  category TEXT NOT NULL,
  applicable_document_types UUID[] DEFAULT '{}',
  applicable_regions TEXT[] DEFAULT '{}',
  rule_logic JSONB NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  check_fields TEXT[] DEFAULT '{}',
  validation_criteria JSONB DEFAULT '{}'::jsonb,
  violation_action TEXT DEFAULT 'flag' CHECK (violation_action IN ('flag', 'warn', 'block')),
  violation_message TEXT,
  regulatory_reference TEXT,
  regulatory_body TEXT,
  effective_date DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 5. 文件審核指標表
-- ========================================
CREATE TABLE IF NOT EXISTS document_review_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_type_id UUID REFERENCES document_types(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metric_period TEXT DEFAULT 'daily' CHECK (metric_period IN ('daily', 'weekly', 'monthly')),
  total_documents INTEGER DEFAULT 0,
  pending_documents INTEGER DEFAULT 0,
  approved_documents INTEGER DEFAULT 0,
  rejected_documents INTEGER DEFAULT 0,
  avg_processing_time_hours DECIMAL(10, 2),
  avg_review_time_hours DECIMAL(10, 2),
  auto_approval_rate DECIMAL(5, 2),
  manual_review_rate DECIMAL(5, 2),
  avg_ai_confidence DECIMAL(5, 2),
  avg_ai_risk_score DECIMAL(5, 2),
  ai_accuracy_rate DECIMAL(5, 2),
  high_risk_count INTEGER DEFAULT 0,
  compliance_violations_count INTEGER DEFAULT 0,
  missing_info_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 6. 文件模板表
-- ========================================
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  document_type_id UUID NOT NULL REFERENCES document_types(id),
  template_name TEXT NOT NULL,
  template_description TEXT,
  template_structure JSONB NOT NULL,
  required_sections TEXT[] DEFAULT '{}',
  optional_sections TEXT[] DEFAULT '{}',
  verification_checklist JSONB DEFAULT '[]'::jsonb,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 索引
-- ========================================
CREATE INDEX IF NOT EXISTS idx_financial_documents_company ON financial_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_documents_type ON financial_documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_financial_documents_status ON financial_documents(review_status);
CREATE INDEX IF NOT EXISTS idx_financial_documents_submission_date ON financial_documents(submission_date);
CREATE INDEX IF NOT EXISTS idx_financial_documents_customer ON financial_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_financial_documents_case ON financial_documents(case_number);
CREATE INDEX IF NOT EXISTS idx_review_history_document ON document_review_history(document_id);
CREATE INDEX IF NOT EXISTS idx_review_history_company ON document_review_history(company_id);
CREATE INDEX IF NOT EXISTS idx_review_history_date ON document_review_history(action_date);
CREATE INDEX IF NOT EXISTS idx_review_metrics_company ON document_review_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_review_metrics_date ON document_review_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_review_metrics_type ON document_review_metrics(document_type_id);

-- ========================================
-- RLS 政策
-- ========================================
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_review_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_review_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- document_types: 所有認證用戶可讀
CREATE POLICY "document_types_select" ON document_types
  FOR SELECT TO authenticated
  USING (true);

-- financial_documents: 只能看自己公司的文件
CREATE POLICY "financial_documents_select" ON financial_documents
  FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "financial_documents_insert" ON financial_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "financial_documents_update" ON financial_documents
  FOR UPDATE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- document_review_history: 只能看自己公司的歷史
CREATE POLICY "document_review_history_select" ON document_review_history
  FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "document_review_history_insert" ON document_review_history
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- compliance_rules: 所有認證用戶可讀
CREATE POLICY "compliance_rules_select" ON compliance_rules
  FOR SELECT TO authenticated
  USING (true);

-- document_review_metrics: 只能看自己公司的指標
CREATE POLICY "document_review_metrics_select" ON document_review_metrics
  FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- document_templates: 可看系統模板和自己公司的模板
CREATE POLICY "document_templates_select" ON document_templates
  FOR SELECT TO authenticated
  USING (
    company_id IS NULL OR company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- ========================================
-- 函數：獲取文件審核統計
-- ========================================
CREATE OR REPLACE FUNCTION get_document_review_stats(
  p_company_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_documents BIGINT,
  pending_count BIGINT,
  approved_count BIGINT,
  rejected_count BIGINT,
  avg_ai_confidence NUMERIC,
  avg_processing_hours NUMERIC,
  high_risk_count BIGINT,
  compliance_issue_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_documents,
    COUNT(*) FILTER (WHERE review_status = 'pending')::BIGINT as pending_count,
    COUNT(*) FILTER (WHERE review_status = 'approved')::BIGINT as approved_count,
    COUNT(*) FILTER (WHERE review_status = 'rejected')::BIGINT as rejected_count,
    AVG(ai_confidence_score) as avg_ai_confidence,
    AVG(EXTRACT(EPOCH FROM (processed_at - submission_date)) / 3600) as avg_processing_hours,
    COUNT(*) FILTER (WHERE ai_risk_score > 70)::BIGINT as high_risk_count,
    SUM(COALESCE(array_length(compliance_issues, 1), 0))::BIGINT as compliance_issue_count
  FROM financial_documents
  WHERE company_id = p_company_id
    AND submission_date >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 函數：更新文件狀態並記錄歷史
-- ========================================
CREATE OR REPLACE FUNCTION update_document_status(
  p_document_id UUID,
  p_new_status TEXT,
  p_user_id UUID,
  p_user_name TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_company_id UUID;
  v_old_status TEXT;
BEGIN
  SELECT company_id, review_status INTO v_company_id, v_old_status
  FROM financial_documents
  WHERE id = p_document_id;
  
  UPDATE financial_documents
  SET 
    review_status = p_new_status,
    reviewed_by = p_user_id,
    reviewed_by_name = p_user_name,
    review_date = NOW(),
    review_notes = COALESCE(p_notes, review_notes),
    updated_at = NOW()
  WHERE id = p_document_id;
  
  INSERT INTO document_review_history (
    document_id,
    company_id,
    action,
    action_by,
    action_by_name,
    previous_status,
    new_status,
    notes
  ) VALUES (
    p_document_id,
    v_company_id,
    'status_changed',
    p_user_id,
    p_user_name,
    v_old_status,
    p_new_status,
    p_notes
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 種子數據：文件類型
-- ========================================
INSERT INTO document_types (type_code, type_name, type_name_en, category, required_fields, ai_check_points, allowed_formats)
VALUES
  (
    'loan_application',
    '個人信貸申請',
    'Personal Loan Application',
    '貸款',
    '["customer_name", "customer_id_number", "loan_amount", "income_proof"]'::jsonb,
    ARRAY['身份驗證', '收入證明', '信用評分', '負債比例'],
    ARRAY['pdf', 'jpg', 'png', 'doc', 'docx']
  ),
  (
    'business_loan',
    '企業貸款申請',
    'Business Loan Application',
    '貸款',
    '["company_name", "company_id", "loan_amount", "financial_statements", "business_plan"]'::jsonb,
    ARRAY['公司資格', '財務狀況', '營業歷史', '擔保品'],
    ARRAY['pdf', 'xls', 'xlsx', 'doc', 'docx']
  ),
  (
    'investment_application',
    '投資申請',
    'Investment Application',
    '投資',
    '["customer_name", "customer_id_number", "investment_amount", "risk_profile"]'::jsonb,
    ARRAY['KYC驗證', '風險評估', '資金來源', '投資經驗'],
    ARRAY['pdf', 'jpg', 'png']
  ),
  (
    'financial_statement',
    '財務報表',
    'Financial Statement',
    '財務文件',
    '["company_name", "reporting_period", "balance_sheet", "income_statement"]'::jsonb,
    ARRAY['會計準則', '數據完整性', '審計意見', '財務比率'],
    ARRAY['pdf', 'xls', 'xlsx']
  ),
  (
    'contract_review',
    '合約審核',
    'Contract Review',
    '合約',
    '["contract_type", "parties", "contract_value", "terms"]'::jsonb,
    ARRAY['合約條款', '法律合規', '風險條款', '履約條件'],
    ARRAY['pdf', 'doc', 'docx']
  ),
  (
    'kyc_document',
    'KYC 文件',
    'KYC Document',
    '合規',
    '["customer_name", "id_number", "address_proof", "income_proof"]'::jsonb,
    ARRAY['身份驗證', '地址驗證', '資金來源', 'PEP檢查'],
    ARRAY['pdf', 'jpg', 'png']
  );

-- ========================================
-- 種子數據：合規規則
-- ========================================
INSERT INTO compliance_rules (
  rule_code, rule_name, rule_description, category, severity, 
  check_fields, violation_action, violation_message, is_mandatory
)
VALUES
  (
    'KYC_001',
    '客戶身份驗證',
    '所有客戶必須提供有效的身份證明文件',
    'kyc',
    'critical',
    ARRAY['customer_id_number', 'customer_name'],
    'block',
    '缺少必要的客戶身份信息，請補充身份證明文件',
    true
  ),
  (
    'AML_001',
    '大額交易申報',
    '超過50萬元的交易需要額外的資金來源證明',
    'aml',
    'high',
    ARRAY['loan_amount', 'investment_amount'],
    'flag',
    '此交易金額需要提供資金來源證明',
    true
  ),
  (
    'CREDIT_001',
    '信用評估',
    '貸款申請需要進行信用評估',
    'credit',
    'high',
    ARRAY['customer_id_number'],
    'flag',
    '請完成信用評估流程',
    true
  ),
  (
    'DOC_001',
    '文件完整性',
    '所有申請文件必須包含必要的欄位',
    'general',
    'medium',
    ARRAY['document_title', 'customer_name', 'file_url'],
    'flag',
    '文件信息不完整，請補充必要欄位',
    true
  );

-- ========================================
-- 測試數據：文件（可選）
-- ========================================
-- 注意：這裡使用了一個假設的 company_id
-- 實際使用時，請替換為真實的 company_id

-- 取得第一個金融公司的 ID（如果存在）
DO $$
DECLARE
  v_company_id UUID;
  v_doc_type_loan UUID;
  v_doc_type_invest UUID;
BEGIN
  -- 嘗試獲取一個金融公司
  SELECT id INTO v_company_id 
  FROM companies 
  WHERE industry = 'finance' 
  LIMIT 1;
  
  IF v_company_id IS NOT NULL THEN
    -- 獲取文件類型 ID
    SELECT id INTO v_doc_type_loan FROM document_types WHERE type_code = 'loan_application';
    SELECT id INTO v_doc_type_invest FROM document_types WHERE type_code = 'investment_application';
    
    -- 插入示例文件
    INSERT INTO financial_documents (
      company_id, document_number, document_type_id, document_title, 
      customer_name, customer_id_number, loan_amount, review_status, 
      priority, file_name, file_format, submission_date
    ) VALUES
      (
        v_company_id, 'LOAN-2025-001', v_doc_type_loan, '個人信貸申請 - 測試客戶A',
        '測試客戶A', 'A123456789', 500000, 'pending', 'normal',
        'loan_application_001.pdf', 'pdf', NOW() - INTERVAL '2 hours'
      ),
      (
        v_company_id, 'INVEST-2025-001', v_doc_type_invest, '基金投資申請 - 測試客戶B',
        '測試客戶B', 'B987654321', 2000000, 'pending', 'high',
        'investment_application_001.pdf', 'pdf', NOW() - INTERVAL '5 hours'
      );
      
    RAISE NOTICE '✅ 已為公司 % 創建測試文件', v_company_id;
  ELSE
    RAISE NOTICE '⚠️ 未找到金融公司，跳過測試數據創建';
  END IF;
END $$;

-- ========================================
-- 完成訊息
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ AI 財務文件審核系統設置完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 已創建表格：';
  RAISE NOTICE '   ✓ document_types (文件類型)';
  RAISE NOTICE '   ✓ financial_documents (財務文件)';
  RAISE NOTICE '   ✓ document_review_history (審核歷史)';
  RAISE NOTICE '   ✓ compliance_rules (合規規則)';
  RAISE NOTICE '   ✓ document_review_metrics (審核指標)';
  RAISE NOTICE '   ✓ document_templates (文件模板)';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 已啟用 Row Level Security (RLS)';
  RAISE NOTICE '📊 已創建函數和索引';
  RAISE NOTICE '🌱 已導入種子數據';
  RAISE NOTICE '';
  RAISE NOTICE '📝 下一步：';
  RAISE NOTICE '   1. 部署 Edge Function: document-review-analyzer';
  RAISE NOTICE '   2. 在前端安裝 AI 文件審核模組';
  RAISE NOTICE '   3. 使用金融公司帳號登入測試';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 系統已準備就緒！';
  RAISE NOTICE '========================================';
END $$;

