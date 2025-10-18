-- ========================================
-- AI 財務文件審核系統 - 數據庫表結構
-- ========================================
-- 創建時間：2025-10-18
-- 用途：為金融公司提供 AI 驅動的文件審核功能
-- ========================================

-- 1. 文件類型定義表
CREATE TABLE IF NOT EXISTS document_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 文件類型資訊
  type_code TEXT UNIQUE NOT NULL, -- 類型代碼 (loan_app, financial_stmt, contract等)
  type_name TEXT NOT NULL, -- 類型名稱
  type_name_en TEXT,
  category TEXT NOT NULL, -- 類別（貸款、投資、合規、合同等）
  
  -- 審核要求
  required_fields JSONB DEFAULT '[]'::jsonb, -- 必須包含的欄位
  compliance_rules JSONB DEFAULT '[]'::jsonb, -- 合規規則
  risk_factors JSONB DEFAULT '[]'::jsonb, -- 風險因子
  
  -- AI 分析設定
  ai_check_points TEXT[] DEFAULT '{}', -- AI 檢查點
  auto_approval_threshold DECIMAL(5, 2) DEFAULT 90.00, -- 自動通過門檻
  manual_review_threshold DECIMAL(5, 2) DEFAULT 70.00, -- 人工審核門檻
  
  -- 文件要求
  max_file_size_mb INTEGER DEFAULT 10,
  allowed_formats TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx', 'jpg', 'png'],
  retention_days INTEGER DEFAULT 2555, -- 保存天數（7年）
  
  -- 狀態
  is_active BOOLEAN DEFAULT true,
  requires_certification BOOLEAN DEFAULT false, -- 是否需要認證
  
  -- 元數據
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 財務文件表
CREATE TABLE IF NOT EXISTS financial_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 所屬公司
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 文件基本資訊
  document_number TEXT NOT NULL, -- 文件編號
  document_type_id UUID NOT NULL REFERENCES document_types(id),
  document_title TEXT NOT NULL,
  document_description TEXT,
  
  -- 文件內容
  file_url TEXT, -- 文件存儲 URL（Supabase Storage）
  file_name TEXT NOT NULL,
  file_size_kb INTEGER,
  file_format TEXT NOT NULL,
  file_hash TEXT, -- 文件哈希值（防篡改）
  
  -- 文件來源
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_by_name TEXT,
  submission_date TIMESTAMPTZ DEFAULT NOW(),
  source_system TEXT, -- 來源系統（manual, api, email等）
  
  -- 客戶/案件信息
  customer_id TEXT, -- 客戶ID
  customer_name TEXT,
  customer_id_number TEXT, -- 身份證/統編
  case_number TEXT, -- 案件編號
  loan_amount DECIMAL(15, 2), -- 貸款金額（如適用）
  investment_amount DECIMAL(15, 2), -- 投資金額（如適用）
  
  -- 審核狀態
  review_status TEXT DEFAULT 'pending' CHECK (
    review_status IN ('pending', 'processing', 'approved', 'rejected', 'requires_info', 'on_hold')
  ),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- AI 分析結果
  ai_confidence_score DECIMAL(5, 2), -- AI 信心分數 (0-100)
  ai_risk_score DECIMAL(5, 2), -- 風險分數 (0-100)
  ai_compliance_score DECIMAL(5, 2), -- 合規分數 (0-100)
  ai_completeness_score DECIMAL(5, 2), -- 完整性分數 (0-100)
  
  -- AI 發現的問題
  ai_findings JSONB DEFAULT '[]'::jsonb, -- AI 發現的問題列表
  risk_factors_detected TEXT[] DEFAULT '{}', -- 檢測到的風險因素
  missing_information TEXT[] DEFAULT '{}', -- 缺失的信息
  compliance_issues TEXT[] DEFAULT '{}', -- 合規問題
  
  -- AI 建議
  ai_recommendation TEXT, -- AI 建議 (approve/reject/review)
  ai_reasoning TEXT, -- AI 推理說明
  ai_summary TEXT, -- AI 摘要
  
  -- 人工審核
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by_name TEXT,
  review_date TIMESTAMPTZ,
  review_notes TEXT,
  reviewer_decision TEXT, -- 審核員決定
  
  -- 最終決定
  final_decision TEXT, -- approve/reject
  final_decision_by UUID REFERENCES users(id) ON DELETE SET NULL,
  final_decision_date TIMESTAMPTZ,
  final_decision_notes TEXT,
  
  -- 時間戳
  processed_at TIMESTAMPTZ, -- AI 處理完成時間
  completed_at TIMESTAMPTZ, -- 審核完成時間
  
  -- 元數據
  metadata JSONB DEFAULT '{}'::jsonb, -- 額外元數據
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 文件審核歷史表
CREATE TABLE IF NOT EXISTS document_review_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  document_id UUID NOT NULL REFERENCES financial_documents(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 審核動作
  action TEXT NOT NULL, -- submitted, ai_analyzed, reviewed, approved, rejected等
  action_by UUID REFERENCES users(id) ON DELETE SET NULL,
  action_by_name TEXT,
  action_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- 審核詳情
  previous_status TEXT,
  new_status TEXT,
  notes TEXT,
  
  -- 變更內容
  changes JSONB DEFAULT '{}'::jsonb,
  
  -- 元數據
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 合規規則表
CREATE TABLE IF NOT EXISTS compliance_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 規則資訊
  rule_code TEXT UNIQUE NOT NULL,
  rule_name TEXT NOT NULL,
  rule_description TEXT NOT NULL,
  category TEXT NOT NULL, -- kyc, aml, credit, risk等
  
  -- 適用範圍
  applicable_document_types UUID[] DEFAULT '{}', -- 適用的文件類型
  applicable_regions TEXT[] DEFAULT '{}', -- 適用地區
  
  -- 規則定義
  rule_logic JSONB NOT NULL, -- 規則邏輯（JSON 格式）
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- 檢查內容
  check_fields TEXT[] DEFAULT '{}', -- 需要檢查的欄位
  validation_criteria JSONB DEFAULT '{}'::jsonb,
  
  -- 違規處理
  violation_action TEXT DEFAULT 'flag' CHECK (violation_action IN ('flag', 'warn', 'block')),
  violation_message TEXT,
  
  -- 監管要求
  regulatory_reference TEXT, -- 監管法規參考
  regulatory_body TEXT, -- 監管機構
  effective_date DATE,
  expiry_date DATE,
  
  -- 狀態
  is_active BOOLEAN DEFAULT true,
  is_mandatory BOOLEAN DEFAULT true,
  
  -- 元數據
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 文件審核指標表
CREATE TABLE IF NOT EXISTS document_review_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_type_id UUID REFERENCES document_types(id) ON DELETE CASCADE,
  
  -- 時間範圍
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metric_period TEXT DEFAULT 'daily' CHECK (metric_period IN ('daily', 'weekly', 'monthly')),
  
  -- 文件統計
  total_documents INTEGER DEFAULT 0,
  pending_documents INTEGER DEFAULT 0,
  approved_documents INTEGER DEFAULT 0,
  rejected_documents INTEGER DEFAULT 0,
  
  -- 處理效率
  avg_processing_time_hours DECIMAL(10, 2),
  avg_review_time_hours DECIMAL(10, 2),
  auto_approval_rate DECIMAL(5, 2),
  manual_review_rate DECIMAL(5, 2),
  
  -- AI 性能
  avg_ai_confidence DECIMAL(5, 2),
  avg_ai_risk_score DECIMAL(5, 2),
  ai_accuracy_rate DECIMAL(5, 2), -- AI 準確率（與人工審核對比）
  
  -- 風險統計
  high_risk_count INTEGER DEFAULT 0,
  compliance_violations_count INTEGER DEFAULT 0,
  missing_info_count INTEGER DEFAULT 0,
  
  -- 元數據
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 文件模板表
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL = 系統模板
  document_type_id UUID NOT NULL REFERENCES document_types(id),
  
  -- 模板資訊
  template_name TEXT NOT NULL,
  template_description TEXT,
  
  -- 模板內容
  template_structure JSONB NOT NULL, -- 文件結構定義
  required_sections TEXT[] DEFAULT '{}',
  optional_sections TEXT[] DEFAULT '{}',
  
  -- 審核檢查點
  verification_checklist JSONB DEFAULT '[]'::jsonb,
  
  -- 使用統計
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- 狀態
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- 元數據
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 索引 (Indexes)
-- ========================================

-- financial_documents 索引
CREATE INDEX IF NOT EXISTS idx_financial_documents_company ON financial_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_documents_type ON financial_documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_financial_documents_status ON financial_documents(review_status);
CREATE INDEX IF NOT EXISTS idx_financial_documents_submission_date ON financial_documents(submission_date);
CREATE INDEX IF NOT EXISTS idx_financial_documents_customer ON financial_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_financial_documents_case ON financial_documents(case_number);

-- document_review_history 索引
CREATE INDEX IF NOT EXISTS idx_review_history_document ON document_review_history(document_id);
CREATE INDEX IF NOT EXISTS idx_review_history_company ON document_review_history(company_id);
CREATE INDEX IF NOT EXISTS idx_review_history_date ON document_review_history(action_date);

-- document_review_metrics 索引
CREATE INDEX IF NOT EXISTS idx_review_metrics_company ON document_review_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_review_metrics_date ON document_review_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_review_metrics_type ON document_review_metrics(document_type_id);

-- ========================================
-- Row Level Security (RLS) 政策
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
-- 函數 (Functions)
-- ========================================

-- 函數：獲取文件審核統計
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

-- 函數：更新文件狀態並記錄歷史
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
  -- 獲取當前狀態
  SELECT company_id, review_status INTO v_company_id, v_old_status
  FROM financial_documents
  WHERE id = p_document_id;
  
  -- 更新文件狀態
  UPDATE financial_documents
  SET 
    review_status = p_new_status,
    reviewed_by = p_user_id,
    reviewed_by_name = p_user_name,
    review_date = NOW(),
    review_notes = COALESCE(p_notes, review_notes),
    updated_at = NOW()
  WHERE id = p_document_id;
  
  -- 記錄審核歷史
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
-- 完成訊息
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ AI 財務文件審核系統 - 資料庫表結構創建完成';
  RAISE NOTICE '📋 已創建表格：';
  RAISE NOTICE '   - document_types (文件類型)';
  RAISE NOTICE '   - financial_documents (財務文件)';
  RAISE NOTICE '   - document_review_history (審核歷史)';
  RAISE NOTICE '   - compliance_rules (合規規則)';
  RAISE NOTICE '   - document_review_metrics (審核指標)';
  RAISE NOTICE '   - document_templates (文件模板)';
  RAISE NOTICE '🔐 RLS 政策已啟用';
  RAISE NOTICE '📊 已創建函數和索引';
END $$;

