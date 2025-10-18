/*
  # Fix Infinite Recursion in Users Table RLS Policies
  
  ## Problem
  The users table policies are querying the users table itself, causing infinite recursion.
  Error: "infinite recursion detected in policy for relation users"
  
  ## Solution
  1. Ensure helper functions exist with SECURITY DEFINER to bypass RLS
  2. Drop all conflicting policies
  3. Create new policies using helper functions only
*/

-- ============================================
-- Step 1: Create or replace helper functions
-- ============================================

-- Function to safely get current user's company_id (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- Function to safely get current user's role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- Function to check if current user is admin (bypasses RLS)
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
-- Step 2: Drop ALL existing users table policies
-- ============================================

-- Drop old problematic policies
DROP POLICY IF EXISTS "Users can view users in their company" ON users;
DROP POLICY IF EXISTS "Admins can manage users in their company" ON users;
DROP POLICY IF EXISTS "Users can view their own record" ON users;
DROP POLICY IF EXISTS "Users can view same company users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Allow user creation during signup" ON users;

-- Drop fixed policy names if they exist
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

-- Policy 1: Users can view their own record
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy 2: Users can view users in their company (using helper function)
CREATE POLICY "users_select_same_company"
  ON users FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL 
    AND company_id = public.get_user_company_id()
  );

-- Policy 3: Users can insert their own record (for signup)
CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Policy 4: Admins can insert users in their company
CREATE POLICY "users_insert_same_company_admin"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() = true 
    AND company_id = public.get_user_company_id()
  );

-- Policy 5: Users can update their own record
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy 6: Admins can update users in their company
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

-- Policy 7: Admins can delete users in their company (except themselves)
CREATE POLICY "users_delete_same_company_admin"
  ON users FOR DELETE
  TO authenticated
  USING (
    public.is_admin() = true 
    AND company_id = public.get_user_company_id()
    AND id != auth.uid()
  );

-- ============================================
-- Step 4: Grant execute permissions on helper functions
-- ============================================

GRANT EXECUTE ON FUNCTION public.get_user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.get_user_company_id() IS 'Safely retrieves the current authenticated user''s company_id, bypassing RLS to prevent infinite recursion';
COMMENT ON FUNCTION public.get_user_role() IS 'Safely retrieves the current authenticated user''s role, bypassing RLS to prevent infinite recursion';
COMMENT ON FUNCTION public.is_admin() IS 'Checks if the current authenticated user is an admin, bypassing RLS to prevent infinite recursion';

COMMENT ON POLICY "users_select_own" ON users IS 'Users can always view their own record';
COMMENT ON POLICY "users_select_same_company" ON users IS 'Users can view other users in their company';
COMMENT ON POLICY "users_insert_own" ON users IS 'Users can insert their own record during signup';
COMMENT ON POLICY "users_insert_same_company_admin" ON users IS 'Admins can add users to their company';
COMMENT ON POLICY "users_update_own" ON users IS 'Users can update their own record';
COMMENT ON POLICY "users_update_same_company_admin" ON users IS 'Admins can update users in their company';
COMMENT ON POLICY "users_delete_same_company_admin" ON users IS 'Admins can delete users in their company (except themselves)';

