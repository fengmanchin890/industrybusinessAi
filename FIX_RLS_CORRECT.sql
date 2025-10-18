-- 修復 AI 數據治理 RLS 策略
-- 使用正確的表名：users (不是 user_profiles)

-- 刪除舊策略
DROP POLICY IF EXISTS "Users can view their company's data assets" ON data_assets;
DROP POLICY IF EXISTS "Users can manage their company's data assets" ON data_assets;
DROP POLICY IF EXISTS "Users can insert their company's data assets" ON data_assets;
DROP POLICY IF EXISTS "Users can update their company's data assets" ON data_assets;
DROP POLICY IF EXISTS "Users can delete their company's data assets" ON data_assets;
DROP POLICY IF EXISTS "Users can view their company's compliance checks" ON compliance_checks;
DROP POLICY IF EXISTS "Users can manage their company's compliance checks" ON compliance_checks;
DROP POLICY IF EXISTS "Users can insert compliance checks" ON compliance_checks;
DROP POLICY IF EXISTS "Users can update their company's compliance checks" ON compliance_checks;
DROP POLICY IF EXISTS "Users can delete their company's compliance checks" ON compliance_checks;
DROP POLICY IF EXISTS "Users can view their company's access records" ON access_control_records;
DROP POLICY IF EXISTS "Users can insert access records" ON access_control_records;
DROP POLICY IF EXISTS "Users can view their company's classification rules" ON classification_rules;
DROP POLICY IF EXISTS "Users can manage their company's classification rules" ON classification_rules;
DROP POLICY IF EXISTS "Users can insert classification rules" ON classification_rules;
DROP POLICY IF EXISTS "Users can update classification rules" ON classification_rules;
DROP POLICY IF EXISTS "Users can view their company's quality assessments" ON data_quality_assessments;
DROP POLICY IF EXISTS "Users can insert quality assessments" ON data_quality_assessments;
DROP POLICY IF EXISTS "Users can view their company's privacy assessments" ON privacy_impact_assessments;
DROP POLICY IF EXISTS "Users can insert privacy assessments" ON privacy_impact_assessments;
DROP POLICY IF EXISTS "Users can view their company's audit logs" ON governance_audit_logs;
DROP POLICY IF EXISTS "Users can insert audit logs" ON governance_audit_logs;

-- ==========================================
-- 1. data_assets 表 RLS 策略
-- ==========================================
CREATE POLICY "Users can view their company's data assets" ON data_assets FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert data assets" ON data_assets FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update data assets" ON data_assets FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete data assets" ON data_assets FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- ==========================================
-- 2. compliance_checks 表 RLS 策略
-- ==========================================
CREATE POLICY "Users can view compliance checks" ON compliance_checks FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert compliance checks" ON compliance_checks FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update compliance checks" ON compliance_checks FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete compliance checks" ON compliance_checks FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- ==========================================
-- 3. classification_rules 表 RLS 策略
-- ==========================================
CREATE POLICY "Users can view classification rules" ON classification_rules FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert classification rules" ON classification_rules FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update classification rules" ON classification_rules FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete classification rules" ON classification_rules FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- ==========================================
-- 4. access_control_records 表 RLS 策略
-- ==========================================
CREATE POLICY "Users can view access records" ON access_control_records FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert access records" ON access_control_records FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- ==========================================
-- 5. data_quality_assessments 表 RLS 策略
-- ==========================================
CREATE POLICY "Users can view quality assessments" ON data_quality_assessments FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert quality assessments" ON data_quality_assessments FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update quality assessments" ON data_quality_assessments FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- ==========================================
-- 6. privacy_impact_assessments 表 RLS 策略
-- ==========================================
CREATE POLICY "Users can view privacy assessments" ON privacy_impact_assessments FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert privacy assessments" ON privacy_impact_assessments FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update privacy assessments" ON privacy_impact_assessments FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- ==========================================
-- 7. governance_audit_logs 表 RLS 策略
-- ==========================================
CREATE POLICY "Users can view audit logs" ON governance_audit_logs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert audit logs" ON governance_audit_logs FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- ==========================================
-- 驗證
-- ==========================================
SELECT '✅ RLS 策略已修復！使用正確的 users 表' as status;

-- 測試查詢
SELECT 
  'fenggov 用戶' as test,
  u.id as user_id,
  u.company_id,
  c.name as company_name,
  (SELECT COUNT(*) FROM data_assets WHERE company_id = u.company_id) as assets_count
FROM users u
JOIN companies c ON c.id = u.company_id
WHERE c.name ILIKE '%fenggov%'
LIMIT 1;

