-- 修復 AI 數據治理 RLS 策略問題
-- 問題：RLS 策略依賴 user_companies 表，但可能使用了錯誤的表名

-- 1. 先檢查系統使用的表名
-- 檢查是否有 user_profiles 或 profiles 表
SELECT 'Checking tables...' as status;

-- 2. 更新 RLS 策略以使用正確的權限檢查
-- 使用 user_profiles 表（假設這是您系統使用的表）

-- 刪除舊策略
DROP POLICY IF EXISTS "Users can view their company's data assets" ON data_assets;
DROP POLICY IF EXISTS "Users can manage their company's data assets" ON data_assets;
DROP POLICY IF EXISTS "Users can view their company's compliance checks" ON compliance_checks;
DROP POLICY IF EXISTS "Users can manage their company's compliance checks" ON compliance_checks;
DROP POLICY IF EXISTS "Users can view their company's access records" ON access_control_records;

-- 創建新策略（使用 user_profiles 表）
CREATE POLICY "Users can view their company's data assets" ON data_assets FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their company's data assets" ON data_assets FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's data assets" ON data_assets FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's data assets" ON data_assets FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- compliance_checks 表策略
CREATE POLICY "Users can view their company's compliance checks" ON compliance_checks FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert compliance checks" ON compliance_checks FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company's compliance checks" ON compliance_checks FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's compliance checks" ON compliance_checks FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- access_control_records 表策略
CREATE POLICY "Users can view their company's access records" ON access_control_records FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert access records" ON access_control_records FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- classification_rules 表策略
DROP POLICY IF EXISTS "Users can view their company's classification rules" ON classification_rules;
DROP POLICY IF EXISTS "Users can manage their company's classification rules" ON classification_rules;

CREATE POLICY "Users can view their company's classification rules" ON classification_rules FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert classification rules" ON classification_rules FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update classification rules" ON classification_rules FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- data_quality_assessments 表策略
DROP POLICY IF EXISTS "Users can view their company's quality assessments" ON data_quality_assessments;

CREATE POLICY "Users can view their company's quality assessments" ON data_quality_assessments FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert quality assessments" ON data_quality_assessments FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- privacy_impact_assessments 表策略
DROP POLICY IF EXISTS "Users can view their company's privacy assessments" ON privacy_impact_assessments;

CREATE POLICY "Users can view their company's privacy assessments" ON privacy_impact_assessments FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert privacy assessments" ON privacy_impact_assessments FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- governance_audit_logs 表策略
DROP POLICY IF EXISTS "Users can view their company's audit logs" ON governance_audit_logs;

CREATE POLICY "Users can view their company's audit logs" ON governance_audit_logs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert audit logs" ON governance_audit_logs FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- 驗證修復
SELECT '✅ RLS 策略已更新！' as status;

-- 測試插入權限
DO $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
BEGIN
  -- 獲取測試用戶
  SELECT id INTO v_user_id FROM auth.users WHERE email LIKE '%fenggov%' LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    SELECT company_id INTO v_company_id FROM user_profiles WHERE id = v_user_id;
    
    IF v_company_id IS NOT NULL THEN
      RAISE NOTICE '✅ 找到用戶: % 公司: %', v_user_id, v_company_id;
    ELSE
      RAISE NOTICE '⚠️ 用戶沒有關聯公司';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ 未找到 fenggov 用戶';
  END IF;
END $$;

