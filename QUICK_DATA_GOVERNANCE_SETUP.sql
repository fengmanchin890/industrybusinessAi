-- ==========================================
-- AI 數據治理系統 - 完整設置 SQL
-- 在 Supabase Dashboard SQL Editor 中執行此檔案
-- ==========================================
-- 一次性創建所有表格和導入測試數據
-- 適用於：政府/教育機構的數據管理
-- ==========================================

-- 1. 數據資產表
CREATE TABLE IF NOT EXISTS data_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('database', 'file', 'api', 'document', 'dataset', 'system')),
  description TEXT,
  location TEXT NOT NULL,
  data_source TEXT,
  owner_department TEXT,
  owner_contact TEXT,
  classification_level TEXT NOT NULL CHECK (classification_level IN ('public', 'internal', 'confidential', 'secret', 'top-secret')),
  data_categories TEXT[] DEFAULT '{}',
  data_format TEXT,
  size_bytes BIGINT,
  record_count INTEGER,
  last_updated TIMESTAMPTZ,
  encryption_status TEXT CHECK (encryption_status IN ('none', 'at-rest', 'in-transit', 'both')),
  access_control_type TEXT CHECK (access_control_type IN ('public', 'role-based', 'user-based', 'none')),
  backup_status TEXT CHECK (backup_status IN ('none', 'daily', 'weekly', 'monthly')),
  is_personal_data BOOLEAN DEFAULT false,
  is_sensitive BOOLEAN DEFAULT false,
  requires_audit BOOLEAN DEFAULT false,
  retention_period_days INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted', 'under-review')),
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
  rule_name TEXT NOT NULL,
  rule_description TEXT,
  classification_level TEXT NOT NULL CHECK (classification_level IN ('public', 'internal', 'confidential', 'secret', 'top-secret')),
  match_criteria JSONB NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  patterns TEXT[] DEFAULT '{}',
  auto_classify BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 合規檢查表
CREATE TABLE IF NOT EXISTS compliance_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  check_name TEXT NOT NULL,
  check_type TEXT NOT NULL CHECK (check_type IN ('gdpr', 'hipaa', 'pdpa', 'sox', 'iso27001', 'custom')),
  description TEXT,
  data_asset_id UUID REFERENCES data_assets(id) ON DELETE CASCADE,
  scope TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'passed', 'failed', 'warning')),
  compliance_score INTEGER CHECK (compliance_score BETWEEN 0 AND 100),
  issues_found JSONB DEFAULT '[]'::jsonb,
  recommendations TEXT[] DEFAULT '{}',
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  ai_analysis TEXT,
  ai_confidence_score DECIMAL(5, 2),
  checked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_at TIMESTAMPTZ,
  next_check_date TIMESTAMPTZ,
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
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_role TEXT,
  user_department TEXT,
  data_asset_id UUID REFERENCES data_assets(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('read', 'write', 'delete', 'export', 'share')),
  access_result TEXT CHECK (access_result IN ('granted', 'denied', 'pending')),
  denial_reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  access_location TEXT,
  access_purpose TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  session_duration_seconds INTEGER,
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
  completeness_score INTEGER CHECK (completeness_score BETWEEN 0 AND 100),
  accuracy_score INTEGER CHECK (accuracy_score BETWEEN 0 AND 100),
  consistency_score INTEGER CHECK (consistency_score BETWEEN 0 AND 100),
  timeliness_score INTEGER CHECK (timeliness_score BETWEEN 0 AND 100),
  validity_score INTEGER CHECK (validity_score BETWEEN 0 AND 100),
  overall_quality_score INTEGER CHECK (overall_quality_score BETWEEN 0 AND 100),
  quality_grade TEXT CHECK (quality_grade IN ('A', 'B', 'C', 'D', 'F')),
  issues_detected JSONB DEFAULT '[]'::jsonb,
  improvement_suggestions TEXT[] DEFAULT '{}',
  ai_insights TEXT,
  assessed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 隱私影響評估表
CREATE TABLE IF NOT EXISTS privacy_impact_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  assessment_name TEXT NOT NULL,
  data_asset_id UUID REFERENCES data_assets(id) ON DELETE CASCADE,
  assessment_type TEXT CHECK (assessment_type IN ('new-system', 'system-change', 'data-breach', 'periodic-review')),
  personal_data_types TEXT[] DEFAULT '{}',
  data_subjects TEXT[] DEFAULT '{}',
  processing_purposes TEXT[] DEFAULT '{}',
  data_retention_period TEXT,
  privacy_risks JSONB DEFAULT '[]'::jsonb,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  mitigation_measures TEXT[] DEFAULT '{}',
  legal_basis TEXT,
  consent_obtained BOOLEAN DEFAULT false,
  data_minimization_applied BOOLEAN DEFAULT false,
  purpose_limitation_applied BOOLEAN DEFAULT false,
  ai_risk_analysis TEXT,
  ai_recommendations TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in-review', 'approved', 'rejected')),
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
  event_type TEXT NOT NULL CHECK (event_type IN ('access', 'modification', 'deletion', 'export', 'classification', 'compliance-check', 'policy-change')),
  event_category TEXT CHECK (event_category IN ('security', 'compliance', 'privacy', 'quality', 'access-control')),
  severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  target_name TEXT,
  action TEXT NOT NULL,
  description TEXT,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  location TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_data_assets_company_id ON data_assets(company_id);
CREATE INDEX IF NOT EXISTS idx_data_assets_classification ON data_assets(classification_level);
CREATE INDEX IF NOT EXISTS idx_data_assets_status ON data_assets(status);
CREATE INDEX IF NOT EXISTS idx_classification_rules_company_id ON classification_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_company_id ON compliance_checks(company_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_status ON compliance_checks(status);
CREATE INDEX IF NOT EXISTS idx_access_records_company_id ON access_control_records(company_id);
CREATE INDEX IF NOT EXISTS idx_access_records_time ON access_control_records(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_quality_assessments_company_id ON data_quality_assessments(company_id);
CREATE INDEX IF NOT EXISTS idx_privacy_assessments_company_id ON privacy_impact_assessments(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON governance_audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON governance_audit_logs(occurred_at DESC);

-- 啟用 RLS
ALTER TABLE data_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE classification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_control_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_impact_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS 策略
-- data_assets 表 RLS 策略
DROP POLICY IF EXISTS "Users can view their company's data assets" ON data_assets;
CREATE POLICY "Users can view their company's data assets" ON data_assets FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert data assets" ON data_assets;
CREATE POLICY "Users can insert data assets" ON data_assets FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update data assets" ON data_assets;
CREATE POLICY "Users can update data assets" ON data_assets FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete data assets" ON data_assets;
CREATE POLICY "Users can delete data assets" ON data_assets FOR DELETE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- compliance_checks 表 RLS 策略
DROP POLICY IF EXISTS "Users can view compliance checks" ON compliance_checks;
CREATE POLICY "Users can view compliance checks" ON compliance_checks FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert compliance checks" ON compliance_checks;
CREATE POLICY "Users can insert compliance checks" ON compliance_checks FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update compliance checks" ON compliance_checks;
CREATE POLICY "Users can update compliance checks" ON compliance_checks FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- access_control_records 表 RLS 策略
DROP POLICY IF EXISTS "Users can view access records" ON access_control_records;
CREATE POLICY "Users can view access records" ON access_control_records FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert access records" ON access_control_records;
CREATE POLICY "Users can insert access records" ON access_control_records FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- classification_rules 表 RLS 策略
DROP POLICY IF EXISTS "Users can view classification rules" ON classification_rules;
CREATE POLICY "Users can view classification rules" ON classification_rules FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert classification rules" ON classification_rules;
CREATE POLICY "Users can insert classification rules" ON classification_rules FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- 創建統計函數
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

-- ==========================================
-- 導入測試數據
-- ==========================================

DO $$
DECLARE
  v_company_id UUID;
  v_asset1_id UUID;
  v_asset2_id UUID;
  v_asset3_id UUID;
  v_asset4_id UUID;
  v_asset5_id UUID;
BEGIN
  -- 查找政府機構公司（fenggov 或任何政府機構）
  SELECT id INTO v_company_id FROM companies WHERE name ILIKE '%gov%' OR industry = 'government' LIMIT 1;
  
  -- 如果沒有政府機構，使用第一個公司
  IF v_company_id IS NULL THEN
    SELECT id INTO v_company_id FROM companies LIMIT 1;
  END IF;
  
  IF v_company_id IS NOT NULL THEN
    -- 插入數據資產
    INSERT INTO data_assets (
      company_id, asset_name, asset_type, description, location,
      owner_department, classification_level, data_format,
      encryption_status, access_control_type, backup_status,
      is_personal_data, is_sensitive, requires_audit
    ) VALUES
    (v_company_id, '公民身份證資料庫', 'database', '存儲所有公民的身份證信息', 'Server-DB01:/data/citizen_db',
     '內政部', 'secret', 'PostgreSQL', 'both', 'role-based', 'daily',
     true, true, true),
    (v_company_id, '政府支出記錄', 'database', '各部門的年度預算和支出明細', 'Server-DB02:/data/budget',
     '財政部', 'confidential', 'PostgreSQL', 'at-rest', 'role-based', 'weekly',
     false, true, true),
    (v_company_id, '公共設施維護紀錄', 'file', '道路、橋樑等公共設施的維護日誌', 'Server-FILE01:/maintenance',
     '工務局', 'internal', 'PDF', 'none', 'user-based', 'monthly',
     false, false, false),
    (v_company_id, '員工人事資料', 'database', '所有公務員的人事資料', 'Server-HR01:/hr_data',
     '人事處', 'confidential', 'MySQL', 'both', 'role-based', 'daily',
     true, true, true),
    (v_company_id, '公開統計資料', 'dataset', '可對外公開的統計數據集', 'Server-WEB01:/open_data',
     '統計處', 'public', 'CSV', 'none', 'public', 'none',
     false, false, false)
    ON CONFLICT DO NOTHING;
    
    -- 獲取資產ID（用於後續的合規檢查和訪問記錄）
    SELECT id INTO v_asset1_id FROM data_assets 
    WHERE company_id = v_company_id AND asset_name = '公民身份證資料庫' LIMIT 1;
    
    SELECT id INTO v_asset2_id FROM data_assets 
    WHERE company_id = v_company_id AND asset_name = '政府支出記錄' LIMIT 1;
    
    -- 插入分類規則
    INSERT INTO classification_rules (
      company_id, rule_name, rule_description, classification_level,
      match_criteria, keywords, auto_classify, priority, is_active
    ) VALUES
    (v_company_id, '個人資料識別', '自動識別包含個人資料的數據集', 'confidential',
     '{"contains_pii": true}'::jsonb,
     ARRAY['身份證', '護照', '電話', '地址', '姓名'], true, 10, true),
    (v_company_id, '機密文件標記', '標記為機密的政府文件', 'secret',
     '{"document_type": "classified"}'::jsonb,
     ARRAY['機密', '絕密', '限閱'], true, 20, true),
    (v_company_id, '公開資料', '可對外公開的數據', 'public',
     '{"is_public": true}'::jsonb,
     ARRAY['公開', '開放資料', '統計'], true, 5, true)
    ON CONFLICT DO NOTHING;
    
    -- 插入合規檢查記錄
    IF v_asset1_id IS NOT NULL THEN
      INSERT INTO compliance_checks (
        company_id, check_name, check_type, data_asset_id, status,
        compliance_score, risk_level, checked_at,
        issues_found, recommendations
      ) VALUES
      (v_company_id, 'GDPR 個人資料合規檢查', 'gdpr', v_asset1_id, 'warning',
       75, 'medium', NOW() - INTERVAL '2 days',
       '[{"severity": "medium", "issue": "未設定保留期限", "requirement": "GDPR Article 5(1)(e)"}]'::jsonb,
       ARRAY['設定明確的資料保留期限', '實施資料最小化原則']),
      (v_company_id, 'ISO 27001 安全檢查', 'iso27001', v_asset1_id, 'passed',
       92, 'low', NOW() - INTERVAL '1 week',
       '[]'::jsonb,
       ARRAY['維持現有安全措施', '定期更新加密金鑰'])
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- 插入訪問記錄
    INSERT INTO access_control_records (
      company_id, user_name, user_role, user_department,
      data_asset_id, asset_name, access_type, access_result,
      ip_address, accessed_at, is_anomaly
    ) VALUES
    (v_company_id, '張承辦', 'data_analyst', '統計處',
     v_asset1_id, '公民身份證資料庫', 'read', 'granted',
     '192.168.1.100', NOW() - INTERVAL '3 hours', false),
    (v_company_id, '李主任', 'department_head', '財政部',
     v_asset2_id, '政府支出記錄', 'export', 'granted',
     '192.168.1.50', NOW() - INTERVAL '1 day', false),
    (v_company_id, '未知使用者', 'unknown', 'unknown',
     v_asset1_id, '公民身份證資料庫', 'export', 'denied',
     '203.145.67.89', NOW() - INTERVAL '5 hours', true)
    ON CONFLICT DO NOTHING;
    
  END IF;
END $$;

-- ==========================================
-- 完成！
-- ==========================================

SELECT 
  '✅ 數據治理系統安裝完成！' as status,
  (SELECT COUNT(*) FROM data_assets) as data_assets_count,
  (SELECT COUNT(*) FROM classification_rules) as classification_rules_count,
  (SELECT COUNT(*) FROM compliance_checks) as compliance_checks_count,
  (SELECT COUNT(*) FROM access_control_records) as access_records_count;

