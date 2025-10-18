-- ============================================================================
-- 快速修复：添加 alerts 表的 INSERT 策略
-- 
-- 执行步骤：
-- 1. 打开 Supabase Dashboard
-- 2. 进入 SQL Editor
-- 3. 复制并执行此脚本
-- ============================================================================

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "alerts_insert_own_company" ON alerts;

-- 创建 INSERT 策略 - 允许用户为自己的公司创建 alerts
CREATE POLICY "alerts_insert_own_company"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- 验证当前的 alerts 策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'alerts'
ORDER BY policyname;

-- 完成提示
SELECT '✅ Alerts INSERT policy has been created successfully!' as status;

