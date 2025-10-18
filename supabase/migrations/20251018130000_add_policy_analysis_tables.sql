-- ==========================================
-- AI 政策分析系統 - 資料庫架構
-- ==========================================

-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 政策表
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  policy_code TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('social', 'economic', 'environmental', 'education', 'healthcare', 'infrastructure', 'technology', 'culture')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'proposed', 'under_review', 'approved', 'implemented', 'evaluated', 'revised', 'archived')),
  
  -- 政策內容
  description TEXT NOT NULL,
  objectives TEXT[] DEFAULT '{}',
  target_population TEXT,
  scope TEXT,  -- 實施範圍
  legal_basis TEXT,  -- 法律依據
  
  -- 預算與資源
  budget_total BIGINT,
  budget_allocated BIGINT,
  budget_spent BIGINT,
  budget_currency TEXT DEFAULT 'TWD',
  resource_requirements JSONB DEFAULT '{}'::jsonb,
  
  -- 時程
  proposed_date DATE,
  approval_date DATE,
  implementation_date DATE,
  evaluation_date DATE,
  revision_date DATE,
  expected_completion_date DATE,
  actual_completion_date DATE,
  
  -- 關係人
  proposing_department TEXT,
  implementing_agency TEXT,
  stakeholders TEXT[] DEFAULT '{}',
  contact_person TEXT,
  contact_email TEXT,
  
  -- 文件
  policy_documents JSONB DEFAULT '[]'::jsonb,  -- 相關文件連結
  attachments TEXT[] DEFAULT '{}',
  
  -- 元數據
  tags TEXT[] DEFAULT '{}',
  priority INTEGER CHECK (priority BETWEEN 1 AND 10),
  is_public BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  parent_policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,  -- 修訂政策的原政策
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, policy_code)
);

-- 2. 政策分析表
CREATE TABLE IF NOT EXISTS policy_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  analysis_type TEXT CHECK (analysis_type IN ('impact', 'cost-benefit', 'risk', 'effectiveness', 'equity', 'sustainability', 'comprehensive')),
  
  -- 評分
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  effectiveness_score INTEGER CHECK (effectiveness_score BETWEEN 0 AND 100),
  efficiency_score INTEGER CHECK (efficiency_score BETWEEN 0 AND 100),
  equity_score INTEGER CHECK (equity_score BETWEEN 0 AND 100),
  sustainability_score INTEGER CHECK (sustainability_score BETWEEN 0 AND 100),
  feasibility_score INTEGER CHECK (feasibility_score BETWEEN 0 AND 100),
  
  -- 影響評估
  positive_impacts TEXT[] DEFAULT '{}',
  negative_impacts TEXT[] DEFAULT '{}',
  affected_groups TEXT[] DEFAULT '{}',
  economic_impact JSONB DEFAULT '{}'::jsonb,
  social_impact JSONB DEFAULT '{}'::jsonb,
  environmental_impact JSONB DEFAULT '{}'::jsonb,
  
  -- 量化指標
  quantitative_metrics JSONB DEFAULT '[]'::jsonb,
  qualitative_insights TEXT[] DEFAULT '{}',
  
  -- 風險分析
  risks JSONB DEFAULT '[]'::jsonb,
  mitigation_strategies TEXT[] DEFAULT '{}',
  overall_risk_level TEXT CHECK (overall_risk_level IN ('low', 'medium', 'high', 'critical')),
  
  -- AI 分析
  ai_analysis TEXT,
  ai_recommendations TEXT[] DEFAULT '{}',
  ai_confidence_score INTEGER CHECK (ai_confidence_score BETWEEN 0 AND 100),
  ai_model_used TEXT,
  
  -- 建議
  recommendations TEXT[] DEFAULT '{}',
  action_items TEXT[] DEFAULT '{}',
  
  -- 分析資訊
  analysis_method TEXT,  -- 分析方法
  data_sources TEXT[] DEFAULT '{}',
  assumptions TEXT[] DEFAULT '{}',
  limitations TEXT[] DEFAULT '{}',
  
  analyzed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 政策指標表
CREATE TABLE IF NOT EXISTS policy_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  
  indicator_name TEXT NOT NULL,
  indicator_type TEXT CHECK (indicator_type IN ('input', 'output', 'outcome', 'impact', 'process')),
  category TEXT CHECK (category IN ('economic', 'social', 'environmental', 'governance', 'quality')),
  
  -- 目標與實際
  target_value NUMERIC,
  current_value NUMERIC,
  baseline_value NUMERIC,
  unit TEXT,
  measurement_frequency TEXT CHECK (measurement_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually', 'ad-hoc')),
  
  -- 趨勢
  trend TEXT CHECK (trend IN ('increasing', 'decreasing', 'stable', 'fluctuating')),
  trend_percentage NUMERIC(5,2),
  
  -- 數據來源
  data_source TEXT,
  collection_method TEXT,
  last_measured_at TIMESTAMPTZ,
  next_measurement_date DATE,
  
  -- 狀態
  status TEXT CHECK (status IN ('on-track', 'at-risk', 'behind', 'ahead', 'completed')),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 利害關係人意見表
CREATE TABLE IF NOT EXISTS policy_stakeholder_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  
  stakeholder_type TEXT CHECK (stakeholder_type IN ('citizen', 'business', 'ngo', 'expert', 'government', 'academia', 'media')),
  stakeholder_name TEXT,
  organization TEXT,
  
  -- 意見內容
  feedback_type TEXT CHECK (feedback_type IN ('support', 'oppose', 'neutral', 'suggestion', 'concern', 'question')),
  title TEXT,
  content TEXT NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  
  -- AI 分析
  ai_sentiment_score NUMERIC(3,2),  -- -1 to 1
  ai_themes TEXT[] DEFAULT '{}',
  ai_summary TEXT,
  
  -- 回應
  is_addressed BOOLEAN DEFAULT false,
  response TEXT,
  responded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,
  
  -- 元數據
  source TEXT,  -- 意見來源
  received_at TIMESTAMPTZ DEFAULT NOW(),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 政策比較表
CREATE TABLE IF NOT EXISTS policy_comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  comparison_name TEXT NOT NULL,
  description TEXT,
  
  policy_ids UUID[] NOT NULL,  -- 要比較的政策 IDs
  comparison_criteria JSONB DEFAULT '[]'::jsonb,
  comparison_results JSONB DEFAULT '{}'::jsonb,
  
  -- AI 分析
  ai_comparative_analysis TEXT,
  ai_recommendations TEXT[] DEFAULT '{}',
  best_practice_policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 政策模擬預測表
CREATE TABLE IF NOT EXISTS policy_simulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  
  simulation_name TEXT NOT NULL,
  simulation_type TEXT CHECK (simulation_type IN ('what-if', 'scenario', 'monte-carlo', 'agent-based', 'system-dynamics')),
  
  -- 模擬參數
  parameters JSONB NOT NULL,
  assumptions TEXT[] DEFAULT '{}',
  time_horizon_years INTEGER,
  
  -- 模擬結果
  predicted_outcomes JSONB DEFAULT '{}'::jsonb,
  best_case_scenario JSONB DEFAULT '{}'::jsonb,
  worst_case_scenario JSONB DEFAULT '{}'::jsonb,
  most_likely_scenario JSONB DEFAULT '{}'::jsonb,
  
  -- 信心區間
  confidence_level INTEGER CHECK (confidence_level BETWEEN 0 AND 100),
  uncertainty_factors TEXT[] DEFAULT '{}',
  
  -- AI 模型
  ai_model_used TEXT,
  ai_insights TEXT,
  
  simulated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  simulated_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_policies_company_id ON policies(company_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_category ON policies(category);
CREATE INDEX IF NOT EXISTS idx_policies_implementation_date ON policies(implementation_date);

CREATE INDEX IF NOT EXISTS idx_policy_analyses_policy_id ON policy_analyses(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_analyses_company_id ON policy_analyses(company_id);
CREATE INDEX IF NOT EXISTS idx_policy_analyses_type ON policy_analyses(analysis_type);

CREATE INDEX IF NOT EXISTS idx_policy_indicators_policy_id ON policy_indicators(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_indicators_status ON policy_indicators(status);

CREATE INDEX IF NOT EXISTS idx_stakeholder_feedback_policy_id ON policy_stakeholder_feedback(policy_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_feedback_type ON policy_stakeholder_feedback(feedback_type);

CREATE INDEX IF NOT EXISTS idx_policy_simulations_policy_id ON policy_simulations(policy_id);

-- 啟用 RLS
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_stakeholder_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_simulations ENABLE ROW LEVEL SECURITY;

-- RLS 策略
-- policies
DROP POLICY IF EXISTS "Users can view policies" ON policies;
CREATE POLICY "Users can view policies" ON policies FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert policies" ON policies;
CREATE POLICY "Users can insert policies" ON policies FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update policies" ON policies;
CREATE POLICY "Users can update policies" ON policies FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete policies" ON policies;
CREATE POLICY "Users can delete policies" ON policies FOR DELETE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- policy_analyses
DROP POLICY IF EXISTS "Users can view policy analyses" ON policy_analyses;
CREATE POLICY "Users can view policy analyses" ON policy_analyses FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert policy analyses" ON policy_analyses;
CREATE POLICY "Users can insert policy analyses" ON policy_analyses FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update policy analyses" ON policy_analyses;
CREATE POLICY "Users can update policy analyses" ON policy_analyses FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- policy_indicators
DROP POLICY IF EXISTS "Users can view policy indicators" ON policy_indicators;
CREATE POLICY "Users can view policy indicators" ON policy_indicators FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert policy indicators" ON policy_indicators;
CREATE POLICY "Users can insert policy indicators" ON policy_indicators FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- policy_stakeholder_feedback
DROP POLICY IF EXISTS "Users can view stakeholder feedback" ON policy_stakeholder_feedback;
CREATE POLICY "Users can view stakeholder feedback" ON policy_stakeholder_feedback FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert stakeholder feedback" ON policy_stakeholder_feedback;
CREATE POLICY "Users can insert stakeholder feedback" ON policy_stakeholder_feedback FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- policy_comparisons
DROP POLICY IF EXISTS "Users can view policy comparisons" ON policy_comparisons;
CREATE POLICY "Users can view policy comparisons" ON policy_comparisons FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert policy comparisons" ON policy_comparisons;
CREATE POLICY "Users can insert policy comparisons" ON policy_comparisons FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- policy_simulations
DROP POLICY IF EXISTS "Users can view policy simulations" ON policy_simulations;
CREATE POLICY "Users can view policy simulations" ON policy_simulations FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert policy simulations" ON policy_simulations;
CREATE POLICY "Users can insert policy simulations" ON policy_simulations FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- 自動更新 updated_at 觸發器
CREATE OR REPLACE FUNCTION update_policy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies
  FOR EACH ROW EXECUTE FUNCTION update_policy_updated_at();

CREATE TRIGGER update_policy_analyses_updated_at BEFORE UPDATE ON policy_analyses
  FOR EACH ROW EXECUTE FUNCTION update_policy_updated_at();

CREATE TRIGGER update_policy_indicators_updated_at BEFORE UPDATE ON policy_indicators
  FOR EACH ROW EXECUTE FUNCTION update_policy_updated_at();

CREATE TRIGGER update_stakeholder_feedback_updated_at BEFORE UPDATE ON policy_stakeholder_feedback
  FOR EACH ROW EXECUTE FUNCTION update_policy_updated_at();

-- 統計函數
CREATE OR REPLACE FUNCTION get_policy_stats(p_company_id UUID)
RETURNS TABLE (
  total_policies BIGINT,
  analyzed_policies BIGINT,
  avg_effectiveness NUMERIC,
  high_risk_policies BIGINT,
  implemented_policies BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_policies,
    COUNT(DISTINCT pa.policy_id)::BIGINT as analyzed_policies,
    COALESCE(AVG(pa.effectiveness_score), 0) as avg_effectiveness,
    COUNT(*) FILTER (WHERE pa.overall_risk_level IN ('high', 'critical'))::BIGINT as high_risk_policies,
    COUNT(*) FILTER (WHERE p.status = 'implemented')::BIGINT as implemented_policies
  FROM policies p
  LEFT JOIN policy_analyses pa ON p.id = pa.policy_id
  WHERE p.company_id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;