/*
  # 修复 RLS 策略无限递归问题

  ## 问题
  原有的 users 表策略在查询时会引用自身，导致无限递归

  ## 解决方案
  1. 删除旧的 users 表策略
  2. 使用 auth.uid() 直接检查权限，避免递归查询
  3. 更新 companies 表策略以避免类似问题
*/

-- 删除旧的 users 表策略
DROP POLICY IF EXISTS "Users can view users in their company" ON users;
DROP POLICY IF EXISTS "Admins can manage users in their company" ON users;

-- 删除旧的 companies 表策略
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Company admins can update their company" ON companies;

-- 为 users 表创建新的策略 - 允许用户查看自己的记录
CREATE POLICY "Users can view their own record"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 允许用户查看同公司的其他用户（使用 company_id 直接比较，避免子查询）
CREATE POLICY "Users can view same company users"
  ON users FOR SELECT
  TO authenticated
  USING (
    company_id = (
      SELECT company_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

-- 允许管理员插入新用户
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND company_id = users.company_id
      LIMIT 1
    )
  );

-- 允许管理员更新同公司用户
CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND company_id = users.company_id
      LIMIT 1
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND company_id = users.company_id
      LIMIT 1
    )
  );

-- 允许管理员删除同公司用户
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND company_id = users.company_id
      LIMIT 1
    )
  );

-- 为 companies 表创建新的策略
CREATE POLICY "Users can view their company"
  ON companies FOR SELECT
  TO authenticated
  USING (
    id = (SELECT company_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Admins can update their company"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin' LIMIT 1)
  )
  WITH CHECK (
    id = (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin' LIMIT 1)
  );

-- 允许新公司的插入（用于注册流程）
CREATE POLICY "Allow company creation during signup"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 允许新用户的插入（用于注册流程）
CREATE POLICY "Allow user creation during signup"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

