/*
  # 彻底修复 RLS 策略无限递归问题
  
  ## 问题分析
  之前的策略在 users 表的 USING 子句中查询 users 表本身，导致无限递归。
  
  ## 解决方案
  1. 创建辅助函数来安全地获取用户的 company_id 和 role
  2. 使用这些函数重写所有 RLS 策略，避免递归查询
  3. 使用 SECURITY DEFINER 函数绕过 RLS 检查
*/

-- 首先删除所有现有的策略
DROP POLICY IF EXISTS "Users can view their own record" ON users;
DROP POLICY IF EXISTS "Users can view same company users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Allow user creation during signup" ON users;
DROP POLICY IF EXISTS "Users can view users in their company" ON users;
DROP POLICY IF EXISTS "Admins can manage users in their company" ON users;

DROP POLICY IF EXISTS "Users can view their company" ON companies;
DROP POLICY IF EXISTS "Admins can update their company" ON companies;
DROP POLICY IF EXISTS "Allow company creation during signup" ON companies;
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Company admins can update their company" ON companies;

-- 创建安全的辅助函数来获取当前用户的 company_id（绕过 RLS）
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- 创建安全的辅助函数来获取当前用户的角色（绕过 RLS）
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- 创建安全的辅助函数来检查用户是否为管理员（绕过 RLS）
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
    LIMIT 1
  );
$$;

-- ============================================
-- Users 表的新策略（使用辅助函数，避免递归）
-- ============================================

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_same_company" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_insert_same_company_admin" ON users;
DROP POLICY IF EXISTS "users_update_same_company_admin" ON users;
DROP POLICY IF EXISTS "users_delete_same_company_admin" ON users;

-- 1. 用户可以查看自己的记录
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 2. 用户可以查看同公司的其他用户
CREATE POLICY "users_select_same_company"
  ON users FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id());

-- 3. 允许新用户注册时插入记录（仅限插入自己的记录）
CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- 4. 管理员可以插入同公司的用户
CREATE POLICY "users_insert_same_company_admin"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() = true 
    AND company_id = public.get_user_company_id()
  );

-- 5. 管理员可以更新同公司的用户
CREATE POLICY "users_update_same_company_admin"
  ON users FOR UPDATE
  TO authenticated
  USING (
    public.is_admin() = true 
    AND company_id = public.get_user_company_id()
  )
  WITH CHECK (
    public.is_admin() = true 
    AND company_id = public.get_user_company_id()
  );

-- 6. 管理员可以删除同公司的用户（但不能删除自己）
CREATE POLICY "users_delete_same_company_admin"
  ON users FOR DELETE
  TO authenticated
  USING (
    public.is_admin() = true 
    AND company_id = public.get_user_company_id()
    AND id != auth.uid()
  );

-- ============================================
-- Companies 表的新策略（使用辅助函数）
-- ============================================

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "companies_select_own" ON companies;
DROP POLICY IF EXISTS "companies_insert_signup" ON companies;
DROP POLICY IF EXISTS "companies_update_admin" ON companies;

-- 1. 用户可以查看自己的公司
CREATE POLICY "companies_select_own"
  ON companies FOR SELECT
  TO authenticated
  USING (id = public.get_user_company_id());

-- 2. 允许在注册时创建公司
CREATE POLICY "companies_insert_signup"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3. 管理员可以更新自己的公司
CREATE POLICY "companies_update_admin"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    public.is_admin() = true 
    AND id = public.get_user_company_id()
  )
  WITH CHECK (
    public.is_admin() = true 
    AND id = public.get_user_company_id()
  );

-- ============================================
-- 更新其他表的策略以使用辅助函数
-- ============================================

-- Company Modules 表
DROP POLICY IF EXISTS "Users can view their company's modules" ON company_modules;
DROP POLICY IF EXISTS "Admins can manage their company's modules" ON company_modules;
DROP POLICY IF EXISTS "company_modules_select" ON company_modules;
DROP POLICY IF EXISTS "company_modules_manage_admin" ON company_modules;

CREATE POLICY "company_modules_select"
  ON company_modules FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "company_modules_manage_admin"
  ON company_modules FOR ALL
  TO authenticated
  USING (
    public.is_admin() = true 
    AND company_id = public.get_user_company_id()
  )
  WITH CHECK (
    public.is_admin() = true 
    AND company_id = public.get_user_company_id()
  );

-- Reports 表
DROP POLICY IF EXISTS "Users can view their company's reports" ON reports;
DROP POLICY IF EXISTS "Operators and admins can create reports" ON reports;
DROP POLICY IF EXISTS "reports_select" ON reports;
DROP POLICY IF EXISTS "reports_insert" ON reports;

CREATE POLICY "reports_select"
  ON reports FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "reports_insert"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = public.get_user_company_id()
    AND public.get_user_role() IN ('admin', 'operator')
  );

-- Alerts 表
DROP POLICY IF EXISTS "Users can view their company's alerts" ON alerts;
DROP POLICY IF EXISTS "Users can mark alerts as read" ON alerts;
DROP POLICY IF EXISTS "alerts_select" ON alerts;
DROP POLICY IF EXISTS "alerts_update" ON alerts;

CREATE POLICY "alerts_select"
  ON alerts FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "alerts_update"
  ON alerts FOR UPDATE
  TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- Data Connections 表
DROP POLICY IF EXISTS "Users can view their company's connections" ON data_connections;
DROP POLICY IF EXISTS "Admins can manage their company's connections" ON data_connections;
DROP POLICY IF EXISTS "data_connections_select" ON data_connections;
DROP POLICY IF EXISTS "data_connections_manage_admin" ON data_connections;

CREATE POLICY "data_connections_select"
  ON data_connections FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "data_connections_manage_admin"
  ON data_connections FOR ALL
  TO authenticated
  USING (
    public.is_admin() = true 
    AND company_id = public.get_user_company_id()
  )
  WITH CHECK (
    public.is_admin() = true 
    AND company_id = public.get_user_company_id()
  );

-- 为辅助函数创建注释
COMMENT ON FUNCTION public.get_user_company_id() IS '安全地获取当前认证用户的 company_id，绕过 RLS 以避免无限递归';
COMMENT ON FUNCTION public.get_user_role() IS '安全地获取当前认证用户的角色，绕过 RLS 以避免无限递归';
COMMENT ON FUNCTION public.is_admin() IS '检查当前认证用户是否为管理员，绕过 RLS 以避免无限递归';

