-- ========================================
-- AI 數據治理系統 - 資料庫表結構
-- ========================================
-- 創建時間：2025-10-18
-- 適用於：政府/教育機構的數據管理與合規
-- ========================================

-- 1. 數據資產表
CREATE TABLE IF NOT EXISTS data_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 資產基本信息
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('database', 'file', 'api', 'document', 'dataset', 'system')),
  description TEXT,
  
  -- 位置和來源
  location TEXT NOT NULL, -- 物理位置、伺服器、檔案路徑
  data_source TEXT, -- 數據來源系統
  owner_department TEXT, -- 負責部門
  owner_contact TEXT, -- 負責人聯絡方式
  
  -- 數據分類
  classification_level TEXT NOT NULL CHECK (classification_level IN ('public', 'internal', 'confidential', 'secret', 'top-secret')),
  data_categories TEXT[] DEFAULT '{}', -- 個人資料、財務資料、敏感資料等
  
  -- 技術細節
  data_format TEXT, -- JSON, CSV, PDF, Database等
  size_bytes BIGINT,
  record_count INTEGER,
  last_updated TIMESTAMPTZ,
  
  -- 安全措施
  encryption_status TEXT CHECK (encryption_status IN ('none', 'at-rest', 'in-transit', 'both')),
  access_control_type TEXT CHECK (access_control_type IN ('public', 'role-based', 'user-based', 'none')),
  backup_status TEXT CHECK (backup_status IN ('none', 'daily', 'weekly', 'monthly')),
  
  -- 合規標記
  is_personal_data BOOLEAN DEFAULT false, -- 是否包含個人資料
  is_sensitive BOOLEAN DEFAULT false, -- 是否為敏感資料
  requires_audit BOOLEAN DEFAULT false, -- 是否需要審計
  retention_period_days INTEGER, -- 保留期限（天）
  
  -- 狀態
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted', 'under-review')),
  
  -- 元數據
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 數據分類規則表
CREATE TABLE IF NOT EXISTS classification_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 規則定義
  rule_name TEXT NOT NULL,
  rule_description TEXT,
  classification_level TEXT NOT NULL CHECK (classification_level IN ('public', 'internal', 'confidential', 'secret', 'top-secret')),
  
  -- 匹配條件
  match_criteria JSONB NOT NULL, -- 自動分類的匹配條件
  keywords TEXT[] DEFAULT '{}', -- 關鍵字匹配
  patterns TEXT[] DEFAULT '{}', -- 正則表達式模式
  
  -- 自動化設置
  auto_classify BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0, -- 規則優先級
  
  -- 狀態
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 合規檢查表
CREATE TABLE IF NOT EXISTS compliance_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 檢查基本信息
  check_name TEXT NOT NULL,
  check_type TEXT NOT NULL CHECK (check_type IN ('gdpr', 'hipaa', 'pdpa', 'sox', 'iso27001', 'custom')),
  description TEXT,
  
  -- 檢查對象
  data_asset_id UUID REFERENCES data_assets(id) ON DELETE CASCADE,
  scope TEXT, -- 檢查範圍
  
  -- 檢查結果
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'passed', 'failed', 'warning')),
  compliance_score INTEGER CHECK (compliance_score BETWEEN 0 AND 100),
  
  -- 發現的問題
  issues_found JSONB DEFAULT '[]'::jsonb,
  recommendations TEXT[] DEFAULT '{}',
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  -- AI 分析
  ai_analysis TEXT,
  ai_confidence_score DECIMAL(5, 2),
  
  -- 執行信息
  checked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_at TIMESTAMPTZ,
  next_check_date TIMESTAMPTZ,
  
  -- 審核
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 訪問控制記錄表
CREATE TABLE IF NOT EXISTS access_control_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 訪問主體
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_role TEXT,
  user_department TEXT,
  
  -- 訪問對象
  data_asset_id UUID REFERENCES data_assets(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  
  -- 訪問詳情
  access_type TEXT NOT NULL CHECK (access_type IN ('read', 'write', 'delete', 'export', 'share')),
  access_result TEXT CHECK (access_result IN ('granted', 'denied', 'pending')),
  denial_reason TEXT,
  
  -- 訪問上下文
  ip_address TEXT,
  user_agent TEXT,
  access_location TEXT,
  access_purpose TEXT, -- 訪問目的
  
  -- 時間信息
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  session_duration_seconds INTEGER,
  
  -- 異常檢測
  is_anomaly BOOLEAN DEFAULT false,
  anomaly_reason TEXT,
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 數據品質評估表
CREATE TABLE IF NOT EXISTS data_quality_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  data_asset_id UUID REFERENCES data_assets(id) ON DELETE CASCADE,
  
  -- 評估維度
  completeness_score INTEGER CHECK (completeness_score BETWEEN 0 AND 100),
  accuracy_score INTEGER CHECK (accuracy_score BETWEEN 0 AND 100),
  consistency_score INTEGER CHECK (consistency_score BETWEEN 0 AND 100),
  timeliness_score INTEGER CHECK (timeliness_score BETWEEN 0 AND 100),
  validity_score INTEGER CHECK (validity_score BETWEEN 0 AND 100),
  
  -- 總分
  overall_quality_score INTEGER CHECK (overall_quality_score BETWEEN 0 AND 100),
  quality_grade TEXT CHECK (quality_grade IN ('A', 'B', 'C', 'D', 'F')),
  
  -- 問題詳情
  issues_detected JSONB DEFAULT '[]'::jsonb,
  improvement_suggestions TEXT[] DEFAULT '{}',
  
  -- AI 分析
  ai_insights TEXT,
  
  -- 執行信息
  assessed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 隱私影響評估表
CREATE TABLE IF NOT EXISTS privacy_impact_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 評估基本信息
  assessment_name TEXT NOT NULL,
  data_asset_id UUID REFERENCES data_assets(id) ON DELETE CASCADE,
  assessment_type TEXT CHECK (assessment_type IN ('new-system', 'system-change', 'data-breach', 'periodic-review')),
  
  -- 個人資料處理
  personal_data_types TEXT[] DEFAULT '{}', -- 姓名、身份證、地址等
  data_subjects TEXT[] DEFAULT '{}', -- 員工、客戶、學生等
  processing_purposes TEXT[] DEFAULT '{}',
  data_retention_period TEXT,
  
  -- 風險評估
  privacy_risks JSONB DEFAULT '[]'::jsonb,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  mitigation_measures TEXT[] DEFAULT '{}',
  
  -- 合規性
  legal_basis TEXT,
  consent_obtained BOOLEAN DEFAULT false,
  data_minimization_applied BOOLEAN DEFAULT false,
  purpose_limitation_applied BOOLEAN DEFAULT false,
  
  -- AI 分析
  ai_risk_analysis TEXT,
  ai_recommendations TEXT[] DEFAULT '{}',
  
  -- 評估狀態
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in-review', 'approved', 'rejected')),
  
  -- 審核
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  approval_notes TEXT,
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 審計日誌表
CREATE TABLE IF NOT EXISTS governance_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 事件信息
  event_type TEXT NOT NULL CHECK (event_type IN ('access', 'modification', 'deletion', 'export', 'classification', 'compliance-check', 'policy-change')),
  event_category TEXT CHECK (event_category IN ('security', 'compliance', 'privacy', 'quality', 'access-control')),
  severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  
  -- 主體和對象
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  target_type TEXT, -- 資產、規則、評估等
  target_id UUID,
  target_name TEXT,
  
  -- 動作詳情
  action TEXT NOT NULL,
  description TEXT,
  changes JSONB, -- 變更前後的值
  
  -- 上下文
  ip_address TEXT,
  user_agent TEXT,
  location TEXT,
  
  -- 時間
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 索引用
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 創建索引
-- ========================================

CREATE INDEX IF NOT EXISTS idx_data_assets_company_id ON data_assets(company_id);
CREATE INDEX IF NOT EXISTS idx_data_assets_classification ON data_assets(classification_level);
CREATE INDEX IF NOT EXISTS idx_data_assets_status ON data_assets(status);
CREATE INDEX IF NOT EXISTS idx_data_assets_owner ON data_assets(owner_department);

CREATE INDEX IF NOT EXISTS idx_classification_rules_company_id ON classification_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_classification_rules_active ON classification_rules(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_compliance_checks_company_id ON compliance_checks(company_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_asset ON compliance_checks(data_asset_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_status ON compliance_checks(status);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_risk ON compliance_checks(risk_level);

CREATE INDEX IF NOT EXISTS idx_access_records_company_id ON access_control_records(company_id);
CREATE INDEX IF NOT EXISTS idx_access_records_user ON access_control_records(user_id);
CREATE INDEX IF NOT EXISTS idx_access_records_asset ON access_control_records(data_asset_id);
CREATE INDEX IF NOT EXISTS idx_access_records_time ON access_control_records(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_records_anomaly ON access_control_records(is_anomaly) WHERE is_anomaly = true;

CREATE INDEX IF NOT EXISTS idx_quality_assessments_company_id ON data_quality_assessments(company_id);
CREATE INDEX IF NOT EXISTS idx_quality_assessments_asset ON data_quality_assessments(data_asset_id);

CREATE INDEX IF NOT EXISTS idx_privacy_assessments_company_id ON privacy_impact_assessments(company_id);
CREATE INDEX IF NOT EXISTS idx_privacy_assessments_status ON privacy_impact_assessments(status);
CREATE INDEX IF NOT EXISTS idx_privacy_assessments_risk ON privacy_impact_assessments(risk_level);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON governance_audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON governance_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON governance_audit_logs(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON governance_audit_logs(severity);

-- ========================================
-- 啟用 RLS
-- ========================================

ALTER TABLE data_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE classification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_control_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_impact_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_audit_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS 策略
-- ========================================

-- data_assets
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their company's data assets" ON data_assets;
  CREATE POLICY "Users can view their company's data assets" ON data_assets FOR SELECT
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their company's data assets" ON data_assets;
  CREATE POLICY "Users can manage their company's data assets" ON data_assets FOR ALL
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- classification_rules
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their company's classification rules" ON classification_rules;
  CREATE POLICY "Users can view their company's classification rules" ON classification_rules FOR SELECT
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their company's classification rules" ON classification_rules;
  CREATE POLICY "Users can manage their company's classification rules" ON classification_rules FOR ALL
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- compliance_checks
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their company's compliance checks" ON compliance_checks;
  CREATE POLICY "Users can view their company's compliance checks" ON compliance_checks FOR SELECT
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their company's compliance checks" ON compliance_checks;
  CREATE POLICY "Users can manage their company's compliance checks" ON compliance_checks FOR ALL
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- access_control_records (只能查看，不能修改)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their company's access records" ON access_control_records;
  CREATE POLICY "Users can view their company's access records" ON access_control_records FOR SELECT
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- data_quality_assessments
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their company's quality assessments" ON data_quality_assessments;
  CREATE POLICY "Users can view their company's quality assessments" ON data_quality_assessments FOR SELECT
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their company's quality assessments" ON data_quality_assessments;
  CREATE POLICY "Users can manage their company's quality assessments" ON data_quality_assessments FOR ALL
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- privacy_impact_assessments
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their company's privacy assessments" ON privacy_impact_assessments;
  CREATE POLICY "Users can view their company's privacy assessments" ON privacy_impact_assessments FOR SELECT
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their company's privacy assessments" ON privacy_impact_assessments;
  CREATE POLICY "Users can manage their company's privacy assessments" ON privacy_impact_assessments FOR ALL
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- governance_audit_logs (只能查看)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their company's audit logs" ON governance_audit_logs;
  CREATE POLICY "Users can view their company's audit logs" ON governance_audit_logs FOR SELECT
    USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ========================================
-- 創建觸發器
-- ========================================

CREATE OR REPLACE FUNCTION update_data_governance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_data_assets_updated_at ON data_assets;
CREATE TRIGGER update_data_assets_updated_at
  BEFORE UPDATE ON data_assets FOR EACH ROW EXECUTE FUNCTION update_data_governance_updated_at();

DROP TRIGGER IF EXISTS update_classification_rules_updated_at ON classification_rules;
CREATE TRIGGER update_classification_rules_updated_at
  BEFORE UPDATE ON classification_rules FOR EACH ROW EXECUTE FUNCTION update_data_governance_updated_at();

DROP TRIGGER IF EXISTS update_compliance_checks_updated_at ON compliance_checks;
CREATE TRIGGER update_compliance_checks_updated_at
  BEFORE UPDATE ON compliance_checks FOR EACH ROW EXECUTE FUNCTION update_data_governance_updated_at();

DROP TRIGGER IF EXISTS update_data_quality_assessments_updated_at ON data_quality_assessments;
CREATE TRIGGER update_data_quality_assessments_updated_at
  BEFORE UPDATE ON data_quality_assessments FOR EACH ROW EXECUTE FUNCTION update_data_governance_updated_at();

DROP TRIGGER IF EXISTS update_privacy_impact_assessments_updated_at ON privacy_impact_assessments;
CREATE TRIGGER update_privacy_impact_assessments_updated_at
  BEFORE UPDATE ON privacy_impact_assessments FOR EACH ROW EXECUTE FUNCTION update_data_governance_updated_at();

-- ========================================
-- 創建實用函數
-- ========================================

-- 獲取公司的數據治理統計
CREATE OR REPLACE FUNCTION get_governance_stats(p_company_id UUID)
RETURNS TABLE (
  total_assets BIGINT,
  classified_assets BIGINT,
  compliant_assets BIGINT,
  high_risk_assets BIGINT,
  pending_assessments BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT da.id)::BIGINT as total_assets,
    COUNT(DISTINCT CASE WHEN da.classification_level IS NOT NULL THEN da.id END)::BIGINT as classified_assets,
    COUNT(DISTINCT CASE WHEN cc.status = 'passed' THEN da.id END)::BIGINT as compliant_assets,
    COUNT(DISTINCT CASE WHEN cc.risk_level IN ('high', 'critical') THEN da.id END)::BIGINT as high_risk_assets,
    COUNT(DISTINCT CASE WHEN cc.status = 'pending' THEN cc.id END)::BIGINT as pending_assessments
  FROM data_assets da
  LEFT JOIN compliance_checks cc ON da.id = cc.data_asset_id
  WHERE da.company_id = p_company_id AND da.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 添加表註釋
-- ========================================

COMMENT ON TABLE data_assets IS '數據資產管理表';
COMMENT ON TABLE classification_rules IS '數據分類規則表';
COMMENT ON TABLE compliance_checks IS '合規檢查記錄表';
COMMENT ON TABLE access_control_records IS '訪問控制記錄表';
COMMENT ON TABLE data_quality_assessments IS '數據品質評估表';
COMMENT ON TABLE privacy_impact_assessments IS '隱私影響評估表';
COMMENT ON TABLE governance_audit_logs IS '審計日誌表';

-- ========================================
-- ✅ 完成！
-- ========================================
SELECT 
  '✅ 數據治理系統數據庫安裝完成！' as status,
  COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%governance%' OR table_name LIKE 'data_assets' OR table_name LIKE '%classification%' OR table_name LIKE '%compliance%' OR table_name LIKE '%privacy%');

