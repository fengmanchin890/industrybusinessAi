/*
  # 添加行业功能特性
  
  ## 新增数据表
  1. industry_configs - 行业配置表
  2. module_categories - 模块分类表（更细化）
  3. dashboard_widgets - 仪表板小部件配置
  4. module_templates - 模块模板库
  
  ## 更新现有表
  1. ai_modules - 添加行业特定字段
  2. companies - 添加行业配置字段
*/

-- ============================================
-- 1. 创建 industry_configs 表
-- ============================================
CREATE TABLE IF NOT EXISTS industry_configs (
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 2. 创建 module_categories 表（细化分类）
-- ============================================
CREATE TABLE IF NOT EXISTS module_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id text UNIQUE NOT NULL,
  name text NOT NULL,
  name_en text NOT NULL,
  parent_category text,
  icon text,
  description text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 3. 创建 dashboard_widgets 表
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  widget_type text NOT NULL CHECK (widget_type IN ('metrics', 'chart', 'alerts', 'quick-actions', 'custom')),
  title text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  position jsonb DEFAULT '{"x": 0, "y": 0, "w": 2, "h": 2}'::jsonb,
  is_visible boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 4. 创建 module_templates 表
-- ============================================
CREATE TABLE IF NOT EXISTS module_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  industry text[] DEFAULT '{}',
  description text,
  template_config jsonb DEFAULT '{}'::jsonb,
  required_capabilities text[] DEFAULT '{}',
  sample_code text,
  documentation_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 5. 更新 ai_modules 表 - 添加新字段
-- ============================================
ALTER TABLE ai_modules 
ADD COLUMN IF NOT EXISTS industry_specific text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS module_sdk_version text DEFAULT '1.0.0',
ADD COLUMN IF NOT EXISTS config_schema jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS capabilities jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dependencies text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS author text,
ADD COLUMN IF NOT EXISTS documentation_url text;

-- ============================================
-- 6. 更新 companies 表 - 添加新字段
-- ============================================
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS industry_config jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dashboard_layout jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'zh-TW';

-- ============================================
-- 7. 创建索引以提高查询性能
-- ============================================
CREATE INDEX IF NOT EXISTS idx_industry_configs_industry_id ON industry_configs(industry_id);
CREATE INDEX IF NOT EXISTS idx_module_categories_category_id ON module_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_module_categories_parent ON module_categories(parent_category);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_company_id ON dashboard_widgets(company_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_type ON dashboard_widgets(widget_type);
CREATE INDEX IF NOT EXISTS idx_module_templates_category ON module_templates(category);
CREATE INDEX IF NOT EXISTS idx_module_templates_industry ON module_templates USING GIN(industry);
CREATE INDEX IF NOT EXISTS idx_ai_modules_industry ON ai_modules USING GIN(industry_specific);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);

-- ============================================
-- 8. 添加 RLS 策略
-- ============================================

-- industry_configs: 所有认证用户可读
CREATE POLICY "industry_configs_select"
  ON industry_configs FOR SELECT
  TO authenticated
  USING (true);

-- module_categories: 所有认证用户可读
CREATE POLICY "module_categories_select"
  ON module_categories FOR SELECT
  TO authenticated
  USING (true);

-- dashboard_widgets: 用户只能看到自己公司的
CREATE POLICY "dashboard_widgets_select"
  ON dashboard_widgets FOR SELECT
  TO authenticated
  USING (company_id = auth.get_user_company_id());

CREATE POLICY "dashboard_widgets_manage"
  ON dashboard_widgets FOR ALL
  TO authenticated
  USING (company_id = auth.get_user_company_id())
  WITH CHECK (company_id = auth.get_user_company_id());

-- module_templates: 所有认证用户可读
CREATE POLICY "module_templates_select"
  ON module_templates FOR SELECT
  TO authenticated
  USING (true);

-- 启用 RLS
ALTER TABLE industry_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. 插入初始行业配置数据
-- ============================================
INSERT INTO industry_configs (industry_id, name, name_en, icon, description, market_size, ai_adoption_rate) VALUES
('manufacturing', '製造業', 'Manufacturing', 'Factory', '台灣最大產業，AI滲透率卻不到30%', '8萬家中小製造廠', '<30%'),
('f&b', '餐飲業', 'Food & Beverage', 'Utensils', '導入 AI 的比例不到 20%', '20萬家中小餐飲業', '<20%'),
('retail', '零售/電商', 'Retail & E-commerce', 'ShoppingBag', '中小賣家急需智能化工具', '數十萬電商賣家', '<25%'),
('sme', '中小企業', 'Small & Medium Enterprises', 'Building2', '最被忽略的藍海市場', '150萬家中小企業', '<15%'),
('healthcare', '醫療/健康', 'Healthcare', 'Heart', '法規限制高，長照市場可行', '醫療診所 + 長照機構', '<20%'),
('logistics', '物流/倉儲', 'Logistics & Warehousing', 'Truck', '效率優化需求高', '中大型物流業者', '<25%'),
('finance', '金融/保險', 'Finance & Insurance', 'Landmark', '法規限制高，適合 B2B 模型', '銀行、保險、金融科技', '<30%'),
('government', '政府/教育', 'Government & Education', 'GraduationCap', '公共服務智能化需求', '政府機關 + 學校', '<15%')
ON CONFLICT (industry_id) DO NOTHING;

-- ============================================
-- 10. 插入模块分类数据
-- ============================================
INSERT INTO module_categories (category_id, name, name_en, icon, description, sort_order) VALUES
('manufacturing', '製造業', 'Manufacturing', 'Factory', '製造業專用 AI 模組', 1),
('f&b', '餐飲業', 'Food & Beverage', 'Utensils', '餐飲業專用 AI 模組', 2),
('retail', '零售/電商', 'Retail', 'ShoppingBag', '零售與電商 AI 模組', 3),
('sme', '中小企業', 'SME', 'Building2', '中小企業通用 AI 模組', 4),
('healthcare', '醫療/健康', 'Healthcare', 'Heart', '醫療與健康 AI 模組', 5),
('logistics', '物流/倉儲', 'Logistics', 'Truck', '物流與倉儲 AI 模組', 6),
('finance', '金融/保險', 'Finance', 'Landmark', '金融與保險 AI 模組', 7),
('government', '政府/教育', 'Government', 'GraduationCap', '政府與教育 AI 模組', 8),
('general', '通用工具', 'General', 'Sparkles', '跨行業通用工具', 9)
ON CONFLICT (category_id) DO NOTHING;

-- ============================================
-- 11. 添加触发器：自动更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_industry_configs_updated_at
  BEFORE UPDATE ON industry_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_widgets_updated_at
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_templates_updated_at
  BEFORE UPDATE ON module_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 12. 添加注释
-- ============================================
COMMENT ON TABLE industry_configs IS '行业配置表，存储各行业的特定配置和推荐模块';
COMMENT ON TABLE module_categories IS '模块分类表，提供更细化的模块分类管理';
COMMENT ON TABLE dashboard_widgets IS '仪表板小部件配置表，存储用户自定义的仪表板布局';
COMMENT ON TABLE module_templates IS '模块模板库，提供预制的模块模板供快速开发';

COMMENT ON COLUMN companies.industry_config IS '公司的行业特定配置（JSON）';
COMMENT ON COLUMN companies.dashboard_layout IS '公司的仪表板布局配置（JSON）';
COMMENT ON COLUMN companies.onboarding_completed IS '是否完成新手引导';
COMMENT ON COLUMN companies.preferred_language IS '首选语言（zh-TW, zh-CN, en）';

COMMENT ON COLUMN ai_modules.industry_specific IS '适用的行业列表';
COMMENT ON COLUMN ai_modules.module_sdk_version IS '模块 SDK 版本';
COMMENT ON COLUMN ai_modules.config_schema IS '配置项的 JSON Schema';
COMMENT ON COLUMN ai_modules.capabilities IS '模块能力描述（JSON）';
COMMENT ON COLUMN ai_modules.dependencies IS '依赖的其他模块 ID';

