-- ============================================================================
-- FIX ALERTS TABLE RLS POLICIES
-- 添加 INSERT 策略，允许用户为自己的公司创建 alerts
-- ============================================================================

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "alerts_insert_own_company" ON alerts;

-- 创建 INSERT 策略
CREATE POLICY "alerts_insert_own_company"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- 验证策略
DO $$
BEGIN
  RAISE NOTICE 'Alerts INSERT policy created successfully';
END $$;

