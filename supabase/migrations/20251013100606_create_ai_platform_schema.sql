/*
  # AI Business Platform - Multi-tenant Database Schema

  ## Overview
  Creates the core database structure for a multi-tenant AI SaaS platform targeting
  Taiwan's SMBs across manufacturing, F&B, retail, logistics, healthcare, finance, 
  government, and education sectors.

  ## New Tables

  ### 1. Companies
  - `id` (uuid, primary key)
  - `name` (text) - Company name
  - `industry` (text) - Industry type (manufacturing, f&b, retail, etc.)
  - `employee_count` (integer) - Company size
  - `subscription_tier` (text) - basic, pro, enterprise
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. Users
  - `id` (uuid, primary key) - Links to auth.users
  - `company_id` (uuid) - Foreign key to companies
  - `email` (text)
  - `full_name` (text)
  - `role` (text) - admin, operator, viewer
  - `created_at` (timestamptz)

  ### 3. AI Modules
  - `id` (uuid, primary key)
  - `name` (text) - Module name
  - `category` (text) - manufacturing, f&b, retail, etc.
  - `description` (text)
  - `icon` (text) - Icon identifier
  - `features` (jsonb) - List of features
  - `pricing_tier` (text) - Minimum tier required
  - `is_active` (boolean)

  ### 4. Company Modules
  - `id` (uuid, primary key)
  - `company_id` (uuid)
  - `module_id` (uuid)
  - `installed_at` (timestamptz)
  - `config` (jsonb) - Module configuration
  - `is_enabled` (boolean)

  ### 5. Reports
  - `id` (uuid, primary key)
  - `company_id` (uuid)
  - `module_id` (uuid)
  - `title` (text)
  - `content` (text) - AI-generated content
  - `report_type` (text) - daily, weekly, monthly, alert
  - `created_by` (uuid) - User ID
  - `created_at` (timestamptz)

  ### 6. Alerts
  - `id` (uuid, primary key)
  - `company_id` (uuid)
  - `module_id` (uuid)
  - `severity` (text) - info, warning, critical
  - `title` (text)
  - `message` (text)
  - `is_read` (boolean)
  - `created_at` (timestamptz)

  ### 7. Data Connections
  - `id` (uuid, primary key)
  - `company_id` (uuid)
  - `connection_type` (text) - plc, mes, erp, pos, excel
  - `connection_config` (jsonb) - Connection settings
  - `status` (text) - active, inactive, error
  - `last_sync` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies ensure users can only access their company's data
  - Admin users have full access within their company
  - Viewer users have read-only access
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text NOT NULL CHECK (industry IN ('manufacturing', 'f&b', 'retail', 'logistics', 'healthcare', 'finance', 'government', 'education', 'sme')),
  employee_count integer DEFAULT 0,
  subscription_tier text DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'pro', 'enterprise')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'viewer' CHECK (role IN ('admin', 'operator', 'viewer')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create AI modules catalog
CREATE TABLE IF NOT EXISTS ai_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('manufacturing', 'f&b', 'retail', 'logistics', 'healthcare', 'finance', 'government', 'education', 'sme')),
  description text NOT NULL,
  icon text DEFAULT 'box',
  features jsonb DEFAULT '[]'::jsonb,
  pricing_tier text DEFAULT 'basic' CHECK (pricing_tier IN ('basic', 'pro', 'enterprise')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_modules ENABLE ROW LEVEL SECURITY;

-- Create company installed modules
CREATE TABLE IF NOT EXISTS company_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  module_id uuid REFERENCES ai_modules(id) ON DELETE CASCADE,
  installed_at timestamptz DEFAULT now(),
  config jsonb DEFAULT '{}'::jsonb,
  is_enabled boolean DEFAULT true,
  UNIQUE(company_id, module_id)
);

ALTER TABLE company_modules ENABLE ROW LEVEL SECURITY;

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  module_id uuid REFERENCES ai_modules(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  report_type text DEFAULT 'daily' CHECK (report_type IN ('daily', 'weekly', 'monthly', 'alert', 'custom')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  module_id uuid REFERENCES ai_modules(id) ON DELETE SET NULL,
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create data connections table
CREATE TABLE IF NOT EXISTS data_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  connection_type text NOT NULL CHECK (connection_type IN ('plc', 'mes', 'erp', 'pos', 'excel', 'api', 'iot')),
  connection_name text NOT NULL,
  connection_config jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  last_sync timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE data_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Company admins can update their company"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for users
CREATE POLICY "Users can view users in their company"
  ON users FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage users in their company"
  ON users FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for ai_modules (public catalog)
CREATE POLICY "All authenticated users can view active modules"
  ON ai_modules FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for company_modules
CREATE POLICY "Users can view their company's modules"
  ON company_modules FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage their company's modules"
  ON company_modules FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for reports
CREATE POLICY "Users can view their company's reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Operators and admins can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'operator')
    )
  );

-- RLS Policies for alerts
CREATE POLICY "Users can view their company's alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can mark alerts as read"
  ON alerts FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for data_connections
CREATE POLICY "Users can view their company's connections"
  ON data_connections FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage their company's connections"
  ON data_connections FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_modules_company_id ON company_modules(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_company_id ON reports(company_id);
CREATE INDEX IF NOT EXISTS idx_alerts_company_id ON alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_data_connections_company_id ON data_connections(company_id);