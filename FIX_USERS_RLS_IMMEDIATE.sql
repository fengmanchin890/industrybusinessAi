/*
  # IMMEDIATE FIX FOR USERS TABLE INFINITE RECURSION
  
  Run this in Supabase SQL Editor to fix the "infinite recursion detected in policy" error.
  
  This will:
  1. Create helper functions that bypass RLS
  2. Drop all problematic policies
  3. Create new safe policies
*/

-- ============================================
-- Step 1: Create helper functions
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
    LIMIT 1
  );
$$;

-- ============================================
-- Step 2: Drop ALL existing users policies
-- ============================================

DROP POLICY IF EXISTS "Users can view users in their company" ON users;
DROP POLICY IF EXISTS "Admins can manage users in their company" ON users;
DROP POLICY IF EXISTS "Users can view their own record" ON users;
DROP POLICY IF EXISTS "Users can view same company users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Allow user creation during signup" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_same_company" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_insert_same_company_admin" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_update_same_company_admin" ON users;
DROP POLICY IF EXISTS "users_delete_same_company_admin" ON users;

-- ============================================
-- Step 3: Create new safe policies
-- ============================================

-- Users can view their own record
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can view users in their company
CREATE POLICY "users_select_same_company"
  ON users FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL 
    AND company_id = public.get_user_company_id()
  );

-- Users can insert their own record (for signup)
CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Admins can insert users in their company
CREATE POLICY "users_insert_same_company_admin"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() = true 
    AND company_id = public.get_user_company_id()
  );

-- Users can update their own record
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can update users in their company
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

-- Admins can delete users in their company (except themselves)
CREATE POLICY "users_delete_same_company_admin"
  ON users FOR DELETE
  TO authenticated
  USING (
    public.is_admin() = true 
    AND company_id = public.get_user_company_id()
    AND id != auth.uid()
  );

-- ============================================
-- Step 4: Grant permissions
-- ============================================

GRANT EXECUTE ON FUNCTION public.get_user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Verify the fix worked
SELECT 'Fix applied successfully! Testing query...' AS status;
SELECT id, email, role, company_id FROM users LIMIT 3;

