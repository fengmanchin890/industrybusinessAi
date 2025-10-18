-- ==========================================
-- AI 政策分析系統 - 快速設置腳本
-- 一鍵創建所有表格、索引、RLS 策略和測試數據
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
  
  description TEXT NOT NULL,
  objectives TEXT[] DEFAULT '{}',
  target_population TEXT,
  scope TEXT,
  legal_basis TEXT,
  
  budget_total BIGINT,
  budget_allocated BIGINT,
  budget_spent BIGINT,
  budget_currency TEXT DEFAULT 'TWD',
  resource_requirements JSONB DEFAULT '{}'::jsonb,
  
  proposed_date DATE,
  approval_date DATE,
  implementation_date DATE,
  evaluation_date DATE,
  revision_date DATE,
  expected_completion_date DATE,
  actual_completion_date DATE,
  
  proposing_department TEXT,
  implementing_agency TEXT,
  stakeholders TEXT[] DEFAULT '{}',
  contact_person TEXT,
  contact_email TEXT,
  
  policy_documents JSONB DEFAULT '[]'::jsonb,
  attachments TEXT[] DEFAULT '{}',
  
  tags TEXT[] DEFAULT '{}',
  priority INTEGER CHECK (priority BETWEEN 1 AND 10),
  is_public BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  parent_policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
  
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
  
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  effectiveness_score INTEGER CHECK (effectiveness_score BETWEEN 0 AND 100),
  efficiency_score INTEGER CHECK (efficiency_score BETWEEN 0 AND 100),
  equity_score INTEGER CHECK (equity_score BETWEEN 0 AND 100),
  sustainability_score INTEGER CHECK (sustainability_score BETWEEN 0 AND 100),
  feasibility_score INTEGER CHECK (feasibility_score BETWEEN 0 AND 100),
  
  positive_impacts TEXT[] DEFAULT '{}',
  negative_impacts TEXT[] DEFAULT '{}',
  affected_groups TEXT[] DEFAULT '{}',
  economic_impact JSONB DEFAULT '{}'::jsonb,
  social_impact JSONB DEFAULT '{}'::jsonb,
  environmental_impact JSONB DEFAULT '{}'::jsonb,
  
  quantitative_metrics JSONB DEFAULT '[]'::jsonb,
  qualitative_insights TEXT[] DEFAULT '{}',
  
  risks JSONB DEFAULT '[]'::jsonb,
  mitigation_strategies TEXT[] DEFAULT '{}',
  overall_risk_level TEXT CHECK (overall_risk_level IN ('low', 'medium', 'high', 'critical')),
  
  ai_analysis TEXT,
  ai_recommendations TEXT[] DEFAULT '{}',
  ai_confidence_score INTEGER CHECK (ai_confidence_score BETWEEN 0 AND 100),
  ai_model_used TEXT,
  
  recommendations TEXT[] DEFAULT '{}',
  action_items TEXT[] DEFAULT '{}',
  
  analysis_method TEXT,
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
  
  target_value NUMERIC,
  current_value NUMERIC,
  baseline_value NUMERIC,
  unit TEXT,
  measurement_frequency TEXT CHECK (measurement_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually', 'ad-hoc')),
  
  trend TEXT CHECK (trend IN ('increasing', 'decreasing', 'stable', 'fluctuating')),
  trend_percentage NUMERIC(5,2),
  
  data_source TEXT,
  collection_method TEXT,
  last_measured_at TIMESTAMPTZ,
  next_measurement_date DATE,
  
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
  
  feedback_type TEXT CHECK (feedback_type IN ('support', 'oppose', 'neutral', 'suggestion', 'concern', 'question')),
  title TEXT,
  content TEXT NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  
  ai_sentiment_score NUMERIC(3,2),
  ai_themes TEXT[] DEFAULT '{}',
  ai_summary TEXT,
  
  is_addressed BOOLEAN DEFAULT false,
  response TEXT,
  responded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,
  
  source TEXT,
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
  
  policy_ids UUID[] NOT NULL,
  comparison_criteria JSONB DEFAULT '[]'::jsonb,
  comparison_results JSONB DEFAULT '{}'::jsonb,
  
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
  
  parameters JSONB NOT NULL,
  assumptions TEXT[] DEFAULT '{}',
  time_horizon_years INTEGER,
  
  predicted_outcomes JSONB DEFAULT '{}'::jsonb,
  best_case_scenario JSONB DEFAULT '{}'::jsonb,
  worst_case_scenario JSONB DEFAULT '{}'::jsonb,
  most_likely_scenario JSONB DEFAULT '{}'::jsonb,
  
  confidence_level INTEGER CHECK (confidence_level BETWEEN 0 AND 100),
  uncertainty_factors TEXT[] DEFAULT '{}',
  
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

-- RLS 策略（使用 users 表）
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

DROP POLICY IF EXISTS "Users can view policy analyses" ON policy_analyses;
CREATE POLICY "Users can view policy analyses" ON policy_analyses FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert policy analyses" ON policy_analyses;
CREATE POLICY "Users can insert policy analyses" ON policy_analyses FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update policy analyses" ON policy_analyses;
CREATE POLICY "Users can update policy analyses" ON policy_analyses FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view policy indicators" ON policy_indicators;
CREATE POLICY "Users can view policy indicators" ON policy_indicators FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert policy indicators" ON policy_indicators;
CREATE POLICY "Users can insert policy indicators" ON policy_indicators FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view stakeholder feedback" ON policy_stakeholder_feedback;
CREATE POLICY "Users can view stakeholder feedback" ON policy_stakeholder_feedback FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert stakeholder feedback" ON policy_stakeholder_feedback;
CREATE POLICY "Users can insert stakeholder feedback" ON policy_stakeholder_feedback FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view policy comparisons" ON policy_comparisons;
CREATE POLICY "Users can view policy comparisons" ON policy_comparisons FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert policy comparisons" ON policy_comparisons;
CREATE POLICY "Users can insert policy comparisons" ON policy_comparisons FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

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

-- ==========================================
-- 插入測試數據（政府機構專用）
-- ==========================================

DO $$
DECLARE
  v_company_id UUID;
  v_policy1_id UUID;
  v_policy2_id UUID;
  v_policy3_id UUID;
  v_policy4_id UUID;
  v_policy5_id UUID;
BEGIN
  -- 查找政府機構公司
  SELECT id INTO v_company_id FROM companies WHERE name ILIKE '%gov%' OR industry = 'government' LIMIT 1;
  
  -- 如果沒有政府機構，使用第一個公司
  IF v_company_id IS NULL THEN
    SELECT id INTO v_company_id FROM companies LIMIT 1;
  END IF;
  
  IF v_company_id IS NOT NULL THEN
    -- 插入政策
    INSERT INTO policies (
      company_id, policy_code, title, category, status,
      description, objectives, target_population, scope,
      budget_total, budget_allocated, budget_spent,
      proposed_date, implementation_date, evaluation_date,
      proposing_department, implementing_agency,
      stakeholders, priority
    ) VALUES
    (v_company_id, 'POL-2024-001', '長照2.0擴大服務計畫', 'social', 'implemented',
     '擴大長照服務範圍，提升服務品質，建立完善長照體系',
     ARRAY['擴大服務對象', '提升服務品質', '建立服務網絡', '培訓專業人員'],
     '65歲以上長者及失能者', '全國',
     500000000000, 450000000000, 380000000000,
     '2023-01-15', '2023-06-01', '2024-12-31',
     '衛生福利部', '長期照顧司',
     ARRAY['長者', '家庭照顧者', '長照服務提供者', '地方政府'], 9),
    
    (v_company_id, 'POL-2024-002', '綠能產業發展政策', 'economic', 'implemented',
     '推動再生能源發展，促進綠能產業成長，達成2050淨零排放目標',
     ARRAY['提升再生能源占比', '扶植綠能產業', '創造綠色就業', '減少碳排放'],
     '再生能源業者、一般企業', '全國',
     300000000000, 280000000000, 220000000000,
     '2023-03-01', '2023-09-01', '2025-12-31',
     '經濟部', '能源局',
     ARRAY['綠能業者', '傳統能源業', '一般企業', '環保團體'], 10),
    
    (v_company_id, 'POL-2024-003', '數位學習推廣計畫', 'education', 'implemented',
     '推動數位學習環境建置，提升學生數位素養與教師數位教學能力',
     ARRAY['建置數位學習環境', '培訓數位教學能力', '提升數位素養', '縮短數位落差'],
     '中小學師生', '全國各級學校',
     80000000000, 75000000000, 62000000000,
     '2023-02-01', '2023-08-01', '2024-07-31',
     '教育部', '資訊及科技教育司',
     ARRAY['學生', '教師', '家長', '教育科技業者'], 8),
    
    (v_company_id, 'POL-2024-004', '智慧城市基礎建設', 'infrastructure', 'under_review',
     '建設智慧城市基礎設施，提升城市管理效率與市民生活品質',
     ARRAY['建置智慧設施', '整合城市數據', '提升管理效率', '改善生活品質'],
     '全體市民', '六都及重點城市',
     450000000000, 400000000000, 280000000000,
     '2023-04-01', '2024-01-01', '2026-12-31',
     '內政部', '營建署',
     ARRAY['地方政府', '市民', '科技業者', '公用事業'], 7),
    
    (v_company_id, 'POL-2024-005', '青年創業扶植方案', 'economic', 'proposed',
     '提供青年創業資源與輔導，降低創業門檻，促進創新創業',
     ARRAY['提供創業資金', '建立輔導機制', '媒合資源網絡', '培育創業人才'],
     '18-45歲青年創業者', '全國',
     50000000000, 45000000000, 15000000000,
     '2024-01-15', '2024-07-01', '2026-06-30',
     '國家發展委員會', '產業發展處',
      ARRAY['青年創業者', '育成中心', '創投業者', '大專院校'], 6)
    ON CONFLICT DO NOTHING;  ← ✅ 改成這樣
    
    -- 獲取政策 IDs
    SELECT id INTO v_policy1_id FROM policies WHERE company_id = v_company_id AND policy_code = 'POL-2024-001' LIMIT 1;
    SELECT id INTO v_policy2_id FROM policies WHERE company_id = v_company_id AND policy_code = 'POL-2024-002' LIMIT 1;
    SELECT id INTO v_policy3_id FROM policies WHERE company_id = v_company_id AND policy_code = 'POL-2024-003' LIMIT 1;
    SELECT id INTO v_policy4_id FROM policies WHERE company_id = v_company_id AND policy_code = 'POL-2024-004' LIMIT 1;
    SELECT id INTO v_policy5_id FROM policies WHERE company_id = v_company_id AND policy_code = 'POL-2024-005' LIMIT 1;
    
    -- 插入政策分析
    IF v_policy1_id IS NOT NULL THEN
      INSERT INTO policy_analyses (
        company_id, policy_id, analysis_type,
        overall_score, effectiveness_score, efficiency_score,
        equity_score, sustainability_score, feasibility_score,
        positive_impacts, negative_impacts, affected_groups,
        overall_risk_level, ai_analysis, ai_recommendations,
        ai_confidence_score, ai_model_used
      ) VALUES
      (v_company_id, v_policy1_id, 'comprehensive',
       78, 82, 75, 85, 70, 80,
       ARRAY['提升長者生活品質', '減輕家庭照顧負擔', '創造就業機會', '促進產業發展'],
       ARRAY['財政負擔增加', '人力資源不足', '服務品質參差不齊'],
       ARRAY['長者', '家庭照顧者', '長照服務提供者', '政府財政'],
       'medium',
       '長照2.0政策整體表現良好，有效提升長者照顧品質。有效性評分82分顯示政策在達成目標方面表現穩健。效率評分75分反映資源使用效率佳。公平性評分85分顯示服務普及性高。永續性評分70分提醒需關注長期財源。建議持續優化服務品質，加強人力培訓，建立多元財源機制。',
       ARRAY['建立完整的績效監測機制', '強化專業人員培訓', '優化服務品質管理', '建立多元財源機制', '加強跨部門協調'],
       82, 'gpt-4')
      ON CONFLICT DO NOTHING;
    END IF;
    
    IF v_policy2_id IS NOT NULL THEN
      INSERT INTO policy_analyses (
        company_id, policy_id, analysis_type,
        overall_score, effectiveness_score, efficiency_score,
        equity_score, sustainability_score, feasibility_score,
        positive_impacts, negative_impacts, affected_groups,
        overall_risk_level, ai_analysis, ai_recommendations,
        ai_confidence_score, ai_model_used
      ) VALUES
      (v_company_id, v_policy2_id, 'comprehensive',
       85, 88, 82, 75, 95, 78,
       ARRAY['促進再生能源發展', '減少碳排放', '創造綠色就業', '提升能源自主'],
       ARRAY['初期成本高', '技術門檻', '傳統產業衝擊'],
       ARRAY['綠能業者', '傳統能源業', '一般企業', '環保團體', '全體國民'],
       'low',
       '綠能產業發展政策整體表現優異，永續性評分達95分。有效性評分88分顯示政策推動成效顯著。效率評分82分反映資源配置合理。建議持續投入研發，加強產業扶植，完善配套措施，確保能源轉型順利進行。',
       ARRAY['加強技術研發投資', '完善產業扶植機制', '建立公正轉型機制', '強化國際合作', '優化獎勵措施'],
       88, 'gpt-4')
      ON CONFLICT DO NOTHING;
    END IF;
    
    IF v_policy3_id IS NOT NULL THEN
      INSERT INTO policy_analyses (
        company_id, policy_id, analysis_type,
        overall_score, effectiveness_score, efficiency_score,
        equity_score, sustainability_score, feasibility_score,
        positive_impacts, negative_impacts, affected_groups,
        overall_risk_level, ai_analysis, ai_recommendations,
        ai_confidence_score, ai_model_used
      ) VALUES
      (v_company_id, v_policy3_id, 'comprehensive',
       76, 80, 73, 82, 75, 85,
       ARRAY['提升數位素養', '縮短數位落差', '提升教學品質', '培養未來人才'],
       ARRAY['城鄉數位落差', '教師適應挑戰', '設備維護成本'],
       ARRAY['學生', '教師', '家長', '教育科技業者', '偏鄉學校'],
       'medium',
       '數位學習推廣計畫成效良好，公平性評分82分顯示政策重視教育均等。有效性評分80分反映推動成效佳。建議加強偏鄉數位環境建置，持續教師培訓，確保數位學習品質，真正縮短數位落差。',
       ARRAY['加強偏鄉數位環境建置', '持續教師專業發展', '建立學習成效評估機制', '優化數位教材', '強化家長數位素養'],
       78, 'gpt-4')
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- 插入政策指標
    IF v_policy1_id IS NOT NULL THEN
      INSERT INTO policy_indicators (
        company_id, policy_id, indicator_name, indicator_type, category,
        target_value, current_value, baseline_value, unit,
        measurement_frequency, trend, status
      ) VALUES
      (v_company_id, v_policy1_id, '服務覆蓋率', 'outcome', 'social',
       90, 85, 60, '%', 'quarterly', 'increasing', 'on-track'),
      (v_company_id, v_policy1_id, '服務滿意度', 'outcome', 'quality',
       4.5, 4.2, 3.8, '分(1-5)', 'quarterly', 'increasing', 'on-track'),
      (v_company_id, v_policy1_id, '服務人數', 'output', 'social',
       500000, 450000, 300000, '人', 'monthly', 'increasing', 'on-track'),
      (v_company_id, v_policy1_id, '專業人員數', 'input', 'social',
       50000, 42000, 35000, '人', 'quarterly', 'increasing', 'at-risk')
      ON CONFLICT DO NOTHING;
    END IF;
    
    IF v_policy2_id IS NOT NULL THEN
      INSERT INTO policy_indicators (
        company_id, policy_id, indicator_name, indicator_type, category,
        target_value, current_value, baseline_value, unit,
        measurement_frequency, trend, status
      ) VALUES
      (v_company_id, v_policy2_id, '再生能源占比', 'outcome', 'environmental',
       20, 18.5, 12, '%', 'quarterly', 'increasing', 'on-track'),
      (v_company_id, v_policy2_id, '碳排放減少量', 'impact', 'environmental',
       15, 13.2, 0, '百萬噸', 'annually', 'increasing', 'on-track'),
      (v_company_id, v_policy2_id, '綠能產業產值', 'outcome', 'economic',
       2000, 1750, 1200, '億元', 'annually', 'increasing', 'ahead'),
      (v_company_id, v_policy2_id, '綠色就業人數', 'outcome', 'social',
       100000, 92000, 65000, '人', 'annually', 'increasing', 'on-track')
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- 插入利害關係人意見
    IF v_policy1_id IS NOT NULL THEN
      INSERT INTO policy_stakeholder_feedback (
        company_id, policy_id, stakeholder_type, stakeholder_name, organization,
        feedback_type, title, content, sentiment, priority
      ) VALUES
      (v_company_id, v_policy1_id, 'citizen', '王大明', '台北市長照協會',
       'suggestion', '建議增加夜間照顧服務',
       '許多家屬白天需要工作，建議增加夜間照顧服務時段，讓家屬可以安心工作。',
       'positive', 'high'),
      (v_company_id, v_policy1_id, 'expert', '李教授', '某大學社工系',
       'support', '政策方向正確，建議加強人才培育',
       '長照2.0政策方向正確，但建議加強專業人員培訓，提升服務品質。',
       'positive', 'medium'),
      (v_company_id, v_policy1_id, 'ngo', '社福聯盟', '全國社福團體聯盟',
       'concern', '偏鄉服務資源不足',
       '偏鄉地區長照服務資源明顯不足，建議政府加強偏鄉服務網絡建置。',
       'neutral', 'high')
      ON CONFLICT DO NOTHING;
    END IF;
    
  END IF;
END $$;

-- 完成！
SELECT '✅ AI 政策分析系統安裝完成！' as status,
       (SELECT COUNT(*) FROM policies) as policies_count,
       (SELECT COUNT(*) FROM policy_analyses) as analyses_count,
       (SELECT COUNT(*) FROM policy_indicators) as indicators_count,
       (SELECT COUNT(*) FROM policy_stakeholder_feedback) as feedback_count;

