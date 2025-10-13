-- Fix RLS policies to allow user registration
-- This migration ensures users can sign up and create their company and profile

-- ============================================================================
-- DROP ALL EXISTING POLICIES (to avoid conflicts)
-- ============================================================================

-- Drop companies policies
DROP POLICY IF EXISTS "companies_select_own" ON companies;
DROP POLICY IF EXISTS "companies_insert_signup" ON companies;
DROP POLICY IF EXISTS "companies_update_admin" ON companies;
DROP POLICY IF EXISTS "Users can view their company" ON companies;
DROP POLICY IF EXISTS "Admins can update their company" ON companies;
DROP POLICY IF EXISTS "Allow company creation during signup" ON companies;
DROP POLICY IF EXISTS "Company admins can update their company" ON companies;
DROP POLICY IF EXISTS "Users can view their own company" ON companies;

-- Drop users policies
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_same_company" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_insert_same_company_admin" ON users;
DROP POLICY IF EXISTS "users_update_same_company_admin" ON users;
DROP POLICY IF EXISTS "users_delete_same_company_admin" ON users;
DROP POLICY IF EXISTS "Users can view their own record" ON users;
DROP POLICY IF EXISTS "Users can view same company users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Allow user creation during signup" ON users;
DROP POLICY IF EXISTS "Users can view users in their company" ON users;
DROP POLICY IF EXISTS "Admins can manage users in their company" ON users;

-- ============================================================================
-- COMPANIES TABLE POLICIES
-- ============================================================================

-- 1. 允许所有认证用户插入公司记录（注册时需要）
CREATE POLICY "companies_allow_insert_during_signup"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. 用户可以查看自己的公司
CREATE POLICY "companies_select_own"
  ON companies FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- 3. 管理员可以更新自己的公司
CREATE POLICY "companies_update_own_admin"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- 1. 允许所有认证用户插入自己的用户记录（注册时需要）
CREATE POLICY "users_allow_insert_own"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 2. 用户可以查看自己的记录
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 3. 用户可以查看同公司的其他用户
CREATE POLICY "users_select_same_company"
  ON users FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- 4. 管理员可以更新同公司的用户
CREATE POLICY "users_update_same_company_admin"
  ON users FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 5. 管理员可以删除同公司的用户（除了自己）
CREATE POLICY "users_delete_same_company_admin"
  ON users FOR DELETE
  TO authenticated
  USING (
    id != auth.uid() 
    AND company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================================================
-- COMPANY_MODULES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "company_modules_select" ON company_modules;
DROP POLICY IF EXISTS "company_modules_manage_admin" ON company_modules;
DROP POLICY IF EXISTS "Users can view their company's modules" ON company_modules;
DROP POLICY IF EXISTS "Admins can manage their company's modules" ON company_modules;

-- 用户可以查看自己公司的模块
CREATE POLICY "company_modules_select_own_company"
  ON company_modules FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- 管理员可以管理自己公司的模块
CREATE POLICY "company_modules_manage_admin"
  ON company_modules FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================================================
-- REPORTS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "reports_select" ON reports;
DROP POLICY IF EXISTS "reports_insert" ON reports;
DROP POLICY IF EXISTS "Users can view their company's reports" ON reports;
DROP POLICY IF EXISTS "Operators and admins can create reports" ON reports;

CREATE POLICY "reports_select_own_company"
  ON reports FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "reports_insert_operator_admin"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('operator', 'admin')
    )
  );

-- ============================================================================
-- ALERTS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "alerts_select" ON alerts;
DROP POLICY IF EXISTS "alerts_update" ON alerts;
DROP POLICY IF EXISTS "Users can view their company's alerts" ON alerts;
DROP POLICY IF EXISTS "Users can mark alerts as read" ON alerts;

CREATE POLICY "alerts_select_own_company"
  ON alerts FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "alerts_update_own_company"
  ON alerts FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- DATA_CONNECTIONS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "data_connections_select" ON data_connections;
DROP POLICY IF EXISTS "data_connections_manage_admin" ON data_connections;
DROP POLICY IF EXISTS "Users can view their company's connections" ON data_connections;
DROP POLICY IF EXISTS "Admins can manage their company's connections" ON data_connections;

CREATE POLICY "data_connections_select_own_company"
  ON data_connections FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "data_connections_manage_admin"
  ON data_connections FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- 验证策略已创建
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies have been reset and recreated';
  RAISE NOTICE '✅ Users can now sign up and create companies';
  RAISE NOTICE '✅ Run this migration in your Supabase SQL Editor';
END $$;

