# 数据库架构说明

## 核心数据表

### 1. companies（公司表）

存储公司基本信息和配置。

\`\`\`sql
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text NOT NULL,
  employee_count int,
  subscription_tier text DEFAULT 'basic',
  industry_config jsonb DEFAULT '{}'::jsonb,
  dashboard_layout jsonb DEFAULT '[]'::jsonb,
  onboarding_completed boolean DEFAULT false,
  preferred_language text DEFAULT 'zh-TW',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
\`\`\`

**字段说明：**
- `industry`：所属行业（manufacturing, f&b, retail 等）
- `subscription_tier`：订阅等级（basic, pro, enterprise）
- `industry_config`：行业特定配置（JSON）
- `dashboard_layout`：仪表板布局配置（JSON）

### 2. users（用户表）

存储用户账号和权限信息。

\`\`\`sql
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  company_id uuid NOT NULL REFERENCES companies(id),
  email text NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'viewer',
  created_at timestamptz DEFAULT now()
);
\`\`\`

**角色类型：**
- `admin`：管理员（可管理公司和用户）
- `operator`：操作员（可使用所有模块）
- `viewer`：查看者（仅可查看报表）

### 3. ai_modules（AI 模块表）

存储所有可用的 AI 模块信息。

\`\`\`sql
CREATE TABLE ai_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  icon text,
  features text[],
  pricing_tier text NOT NULL,
  industry_specific text[] DEFAULT '{}',
  module_sdk_version text DEFAULT '1.0.0',
  config_schema jsonb DEFAULT '{}'::jsonb,
  capabilities jsonb DEFAULT '{}'::jsonb,
  dependencies text[] DEFAULT '{}',
  author text,
  documentation_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
\`\`\`

**重要字段：**
- `industry_specific`：适用的行业列表
- `pricing_tier`：需要的订阅等级
- `config_schema`：配置项的 JSON Schema
- `capabilities`：模块能力（生成报表、发送警示等）
- `dependencies`：依赖的其他模块

### 4. company_modules（公司已安装模块表）

记录公司安装的模块及其配置。

\`\`\`sql
CREATE TABLE company_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  module_id uuid NOT NULL REFERENCES ai_modules(id),
  installed_at timestamptz DEFAULT now(),
  config jsonb DEFAULT '{}'::jsonb,
  is_enabled boolean DEFAULT true,
  UNIQUE(company_id, module_id)
);
\`\`\`

### 5. reports（报表表）

存储 AI 生成的各类报表。

\`\`\`sql
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  module_id uuid REFERENCES ai_modules(id),
  title text NOT NULL,
  content text NOT NULL,
  report_type text NOT NULL,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);
\`\`\`

**报表类型：**
- `daily`：日报
- `weekly`：周报
- `monthly`：月报
- `alert`：警示报告
- `custom`：自定义报告

### 6. alerts（警示表）

存储系统警示和通知。

\`\`\`sql
CREATE TABLE alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  module_id uuid REFERENCES ai_modules(id),
  severity text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
\`\`\`

**严重程度：**
- `low`：低
- `medium`：中
- `high`：高
- `critical`：紧急

### 7. data_connections（数据连接表）

存储外部数据源连接信息。

\`\`\`sql
CREATE TABLE data_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  connection_type text NOT NULL,
  connection_name text NOT NULL,
  connection_config jsonb NOT NULL,
  status text DEFAULT 'active',
  last_sync timestamptz,
  created_at timestamptz DEFAULT now()
);
\`\`\`

**连接类型：**
- `plc`：PLC 工业控制器
- `mes`：制造执行系统
- `erp`：企业资源计划
- `pos`：销售点系统
- `excel`：Excel 文件
- `api`：API 接口

### 8. industry_configs（行业配置表）

存储各行业的标准配置。

\`\`\`sql
CREATE TABLE industry_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id text UNIQUE NOT NULL,
  name text NOT NULL,
  name_en text NOT NULL,
  icon text NOT NULL,
  description text,
  market_size text,
  ai_adoption_rate text,
  pain_points jsonb DEFAULT '[]'::jsonb,
  recommended_modules jsonb DEFAULT '[]'::jsonb,
  dashboard_layout jsonb DEFAULT '[]'::jsonb,
  default_settings jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
\`\`\`

### 9. dashboard_widgets（仪表板小部件表）

存储用户自定义的仪表板配置。

\`\`\`sql
CREATE TABLE dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  widget_type text NOT NULL,
  title text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  position jsonb DEFAULT '{"x": 0, "y": 0, "w": 2, "h": 2}'::jsonb,
  is_visible boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
\`\`\`

**小部件类型：**
- `metrics`：指标卡片
- `chart`：图表
- `alerts`：警示列表
- `quick-actions`：快速操作
- `custom`：自定义

## 数据关系图

\`\`\`
companies ─┬─── users
           ├─── company_modules ─── ai_modules
           ├─── reports
           ├─── alerts
           ├─── data_connections
           └─── dashboard_widgets

industry_configs (独立表，不关联特定公司)
\`\`\`

## Row Level Security (RLS) 策略

### 核心安全函数

\`\`\`sql
-- 获取当前用户的 company_id
CREATE FUNCTION auth.get_user_company_id()
RETURNS uuid AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 检查是否为管理员
CREATE FUNCTION auth.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;
\`\`\`

### 典型 RLS 策略

**users 表：**
\`\`\`sql
-- 用户可以查看同公司的其他用户
CREATE POLICY "users_select_same_company"
  ON users FOR SELECT
  TO authenticated
  USING (company_id = auth.get_user_company_id());

-- 管理员可以管理同公司的用户
CREATE POLICY "users_manage_admin"
  ON users FOR ALL
  TO authenticated
  USING (
    auth.is_admin() = true 
    AND company_id = auth.get_user_company_id()
  );
\`\`\`

**reports 表：**
\`\`\`sql
-- 用户只能查看自己公司的报表
CREATE POLICY "reports_select"
  ON reports FOR SELECT
  TO authenticated
  USING (company_id = auth.get_user_company_id());
\`\`\`

## 索引策略

关键索引以提升查询性能：

\`\`\`sql
-- 公司相关查询
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_company_modules_company_id ON company_modules(company_id);
CREATE INDEX idx_reports_company_id ON reports(company_id);
CREATE INDEX idx_alerts_company_id ON alerts(company_id);

-- 模块查询
CREATE INDEX idx_ai_modules_category ON ai_modules(category);
CREATE INDEX idx_ai_modules_industry ON ai_modules USING GIN(industry_specific);

-- 时间范围查询
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);

-- 未读警示查询
CREATE INDEX idx_alerts_unread ON alerts(company_id, is_read) WHERE is_read = false;
\`\`\`

## 数据迁移

所有数据库变更通过 migration 文件管理：

\`\`\`
supabase/migrations/
├── 20251013100606_create_ai_platform_schema.sql
├── 20251013110000_fix_rls_policies.sql
├── 20251013120000_fix_infinite_recursion.sql
└── 20251013130000_add_industry_features.sql
\`\`\`

运行迁移：
\`\`\`bash
supabase db push
\`\`\`

## 备份策略

Supabase 提供自动备份：
- 每日自动备份
- 可手动创建快照
- 支持时间点恢复（PITR）

## 性能优化建议

1. **使用索引**：为频繁查询的字段创建索引
2. **避免 N+1 查询**：使用 Supabase 的 `select()` 一次性获取关联数据
3. **分页查询**：使用 `limit()` 和 `range()` 限制返回数据量
4. **实时订阅**：仅订阅必要的表和字段
5. **JSONB 查询**：为 JSONB 字段创建 GIN 索引

## 相关文档

- [API 文档](../api/rest-api.md)
- [数据集成指南](../guides/data-integration.md)

