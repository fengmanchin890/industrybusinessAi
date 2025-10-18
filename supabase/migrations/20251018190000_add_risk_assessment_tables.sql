-- ========================================
-- AI 風險評估系統 - 數據庫表結構
-- ========================================
-- 創建時間：2025-10-18
-- 用途：為金融公司提供全面的風險評估功能
-- ========================================

-- 1. 風險評估模型表
CREATE TABLE IF NOT EXISTS risk_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 模型資訊
  model_code TEXT UNIQUE NOT NULL,
  model_name TEXT NOT NULL,
  model_description TEXT,
  model_version TEXT DEFAULT '1.0.0',
  
  -- 風險類型
  risk_category TEXT NOT NULL CHECK (
    risk_category IN ('credit', 'market', 'operational', 'liquidity', 'compliance', 'fraud', 'reputation')
  ),
  
  -- 模型參數
  model_parameters JSONB DEFAULT '{}'::jsonb,
  scoring_formula TEXT,
  weight_factors JSONB DEFAULT '{}'::jsonb,
  
  -- 評分範圍
  min_score DECIMAL(10, 2) DEFAULT 0,
  max_score DECIMAL(10, 2) DEFAULT 100,
  
  -- 風險等級定義
  risk_levels JSONB DEFAULT '[
    {"level": "low", "min": 0, "max": 30, "color": "green"},
    {"level": "medium", "min": 30, "max": 60, "color": "yellow"},
    {"level": "high", "min": 60, "max": 80, "color": "orange"},
    {"level": "critical", "min": 80, "max": 100, "color": "red"}
  ]'::jsonb,
  
  -- 模型狀態
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- 性能指標
  accuracy_rate DECIMAL(5, 2),
  false_positive_rate DECIMAL(5, 2),
  last_calibration_date TIMESTAMPTZ,
  
  -- 元數據
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 客戶風險評估表
CREATE TABLE IF NOT EXISTS customer_risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 所屬公司
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 客戶資訊
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_type TEXT DEFAULT 'individual' CHECK (customer_type IN ('individual', 'business', 'institutional')),
  customer_id_number TEXT,
  
  -- 評估資訊
  assessment_date TIMESTAMPTZ DEFAULT NOW(),
  assessment_type TEXT DEFAULT 'comprehensive' CHECK (
    assessment_type IN ('comprehensive', 'credit', 'kyc', 'transaction', 'periodic')
  ),
  
  -- 風險模型
  risk_model_id UUID REFERENCES risk_models(id),
  
  -- 總體風險評分
  overall_risk_score DECIMAL(10, 2),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_rating TEXT, -- AAA, AA, A, BBB, BB, B, CCC, CC, C, D
  
  -- 細分風險評分
  credit_risk_score DECIMAL(10, 2),
  operational_risk_score DECIMAL(10, 2),
  compliance_risk_score DECIMAL(10, 2),
  fraud_risk_score DECIMAL(10, 2),
  
  -- AI 分析結果
  ai_confidence_score DECIMAL(5, 2),
  ai_risk_factors JSONB DEFAULT '[]'::jsonb,
  ai_recommendations TEXT[],
  ai_summary TEXT,
  
  -- 財務指標
  financial_indicators JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "annual_income": 1000000,
  --   "debt_to_income_ratio": 0.3,
  --   "credit_utilization": 0.5,
  --   "payment_history_score": 85,
  --   "account_age_months": 36
  -- }
  
  -- 行為指標
  behavioral_indicators JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "transaction_frequency": 50,
  --   "avg_transaction_amount": 5000,
  --   "unusual_patterns": [],
  --   "account_changes": 2
  -- }
  
  -- 外部數據
  credit_bureau_score INTEGER,
  credit_bureau_data JSONB DEFAULT '{}'::jsonb,
  blacklist_check_status TEXT,
  pep_check_status TEXT, -- Politically Exposed Person
  sanctions_check_status TEXT,
  
  -- 風險因素
  risk_factors TEXT[],
  red_flags TEXT[],
  mitigating_factors TEXT[],
  
  -- 決策
  assessment_status TEXT DEFAULT 'pending' CHECK (
    assessment_status IN ('pending', 'approved', 'rejected', 'review_required', 'monitoring')
  ),
  decision TEXT, -- approve, reject, monitor, escalate
  decision_by UUID REFERENCES users(id),
  decision_date TIMESTAMPTZ,
  decision_notes TEXT,
  
  -- 監控
  monitoring_level TEXT DEFAULT 'standard' CHECK (
    monitoring_level IN ('none', 'standard', 'enhanced', 'intensive')
  ),
  next_review_date DATE,
  
  -- 歷史比較
  previous_risk_score DECIMAL(10, 2),
  risk_score_change DECIMAL(10, 2),
  score_trend TEXT, -- improving, stable, deteriorating
  
  -- 元數據
  assessed_by UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 交易風險評估表
CREATE TABLE IF NOT EXISTS transaction_risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 交易資訊
  transaction_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  transaction_amount DECIMAL(15, 2) NOT NULL,
  transaction_currency TEXT DEFAULT 'TWD',
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- 交易方
  customer_id TEXT,
  customer_name TEXT,
  counterparty_id TEXT,
  counterparty_name TEXT,
  
  -- 風險評估
  risk_model_id UUID REFERENCES risk_models(id),
  risk_score DECIMAL(10, 2),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  -- AI 分析
  ai_confidence DECIMAL(5, 2),
  ai_risk_factors TEXT[],
  ai_anomaly_detected BOOLEAN DEFAULT false,
  ai_reasoning TEXT,
  
  -- 風險類型檢測
  fraud_risk_detected BOOLEAN DEFAULT false,
  aml_risk_detected BOOLEAN DEFAULT false,
  sanction_risk_detected BOOLEAN DEFAULT false,
  unusual_pattern_detected BOOLEAN DEFAULT false,
  
  -- 風險指標
  amount_anomaly_score DECIMAL(5, 2),
  frequency_anomaly_score DECIMAL(5, 2),
  location_anomaly_score DECIMAL(5, 2),
  time_anomaly_score DECIMAL(5, 2),
  counterparty_risk_score DECIMAL(5, 2),
  
  -- 決策
  assessment_result TEXT DEFAULT 'pending' CHECK (
    assessment_result IN ('approved', 'rejected', 'flagged', 'pending', 'escalated')
  ),
  action_taken TEXT, -- approve, block, hold, investigate
  action_by UUID REFERENCES users(id),
  action_date TIMESTAMPTZ,
  action_notes TEXT,
  
  -- 元數據
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 市場風險評估表
CREATE TABLE IF NOT EXISTS market_risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 評估資訊
  assessment_date TIMESTAMPTZ DEFAULT NOW(),
  portfolio_id TEXT,
  portfolio_name TEXT,
  
  -- 風險指標
  var_1day DECIMAL(15, 2), -- Value at Risk (1 day)
  var_10day DECIMAL(15, 2), -- Value at Risk (10 days)
  cvar DECIMAL(15, 2), -- Conditional Value at Risk
  
  -- 市場數據
  market_volatility DECIMAL(10, 4),
  correlation_breakdown JSONB DEFAULT '{}'::jsonb,
  
  -- 情境分析
  stress_test_results JSONB DEFAULT '[]'::jsonb,
  scenario_analysis JSONB DEFAULT '[]'::jsonb,
  
  -- AI 預測
  ai_market_outlook TEXT,
  ai_risk_forecast JSONB DEFAULT '{}'::jsonb,
  ai_recommendations TEXT[],
  
  -- 元數據
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 風險警報表
CREATE TABLE IF NOT EXISTS risk_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 警報資訊
  alert_type TEXT NOT NULL CHECK (
    alert_type IN ('credit_risk', 'fraud_detection', 'compliance_violation', 
                   'market_risk', 'operational_risk', 'limit_breach', 'unusual_activity')
  ),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- 關聯對象
  customer_id TEXT,
  transaction_id TEXT,
  assessment_id UUID,
  
  -- 警報內容
  alert_title TEXT NOT NULL,
  alert_message TEXT NOT NULL,
  risk_score DECIMAL(10, 2),
  risk_factors TEXT[],
  
  -- 詳細信息
  details JSONB DEFAULT '{}'::jsonb,
  evidence JSONB DEFAULT '[]'::jsonb,
  
  -- 處理狀態
  status TEXT DEFAULT 'new' CHECK (
    status IN ('new', 'investigating', 'resolved', 'false_positive', 'escalated')
  ),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- 處理資訊
  assigned_to UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- 自動化
  auto_generated BOOLEAN DEFAULT true,
  notification_sent BOOLEAN DEFAULT false,
  
  -- 元數據
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 風險限額表
CREATE TABLE IF NOT EXISTS risk_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 限額資訊
  limit_code TEXT UNIQUE NOT NULL,
  limit_name TEXT NOT NULL,
  limit_description TEXT,
  
  -- 限額類型
  limit_type TEXT NOT NULL CHECK (
    limit_type IN ('credit', 'transaction', 'exposure', 'concentration', 'var', 'loss')
  ),
  
  -- 適用範圍
  applies_to TEXT, -- customer, product, geography, etc.
  scope_filters JSONB DEFAULT '{}'::jsonb,
  
  -- 限額值
  limit_value DECIMAL(15, 2) NOT NULL,
  limit_currency TEXT DEFAULT 'TWD',
  warning_threshold DECIMAL(5, 2) DEFAULT 80.00, -- % of limit
  
  -- 當前使用
  current_usage DECIMAL(15, 2) DEFAULT 0,
  utilization_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- 時間範圍
  time_period TEXT, -- daily, weekly, monthly, annual
  valid_from DATE,
  valid_until DATE,
  
  -- 違規處理
  breach_action TEXT DEFAULT 'alert' CHECK (breach_action IN ('alert', 'block', 'approve')),
  breach_count INTEGER DEFAULT 0,
  last_breach_date TIMESTAMPTZ,
  
  -- 狀態
  is_active BOOLEAN DEFAULT true,
  is_enforced BOOLEAN DEFAULT true,
  
  -- 元數據
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 風險監控儀表板指標表
CREATE TABLE IF NOT EXISTS risk_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 時間範圍
  metric_date DATE DEFAULT CURRENT_DATE,
  metric_period TEXT DEFAULT 'daily' CHECK (metric_period IN ('daily', 'weekly', 'monthly')),
  
  -- 客戶風險指標
  total_customers INTEGER DEFAULT 0,
  high_risk_customers INTEGER DEFAULT 0,
  avg_customer_risk_score DECIMAL(10, 2),
  
  -- 交易風險指標
  total_transactions INTEGER DEFAULT 0,
  flagged_transactions INTEGER DEFAULT 0,
  blocked_transactions INTEGER DEFAULT 0,
  avg_transaction_risk_score DECIMAL(10, 2),
  
  -- 風險敞口
  total_exposure DECIMAL(15, 2),
  high_risk_exposure DECIMAL(15, 2),
  concentration_risk DECIMAL(10, 2),
  
  -- 警報統計
  total_alerts INTEGER DEFAULT 0,
  critical_alerts INTEGER DEFAULT 0,
  resolved_alerts INTEGER DEFAULT 0,
  false_positive_rate DECIMAL(5, 2),
  
  -- 合規指標
  compliance_violations INTEGER DEFAULT 0,
  limit_breaches INTEGER DEFAULT 0,
  
  -- AI 性能
  ai_accuracy_rate DECIMAL(5, 2),
  ai_avg_confidence DECIMAL(5, 2),
  
  -- 元數據
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 索引
-- ========================================

-- customer_risk_assessments 索引
CREATE INDEX IF NOT EXISTS idx_customer_risk_company ON customer_risk_assessments(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_risk_customer ON customer_risk_assessments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_risk_level ON customer_risk_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_customer_risk_date ON customer_risk_assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_customer_risk_score ON customer_risk_assessments(overall_risk_score);

-- transaction_risk_assessments 索引
CREATE INDEX IF NOT EXISTS idx_transaction_risk_company ON transaction_risk_assessments(company_id);
CREATE INDEX IF NOT EXISTS idx_transaction_risk_transaction ON transaction_risk_assessments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_risk_customer ON transaction_risk_assessments(customer_id);
CREATE INDEX IF NOT EXISTS idx_transaction_risk_date ON transaction_risk_assessments(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transaction_risk_level ON transaction_risk_assessments(risk_level);

-- risk_alerts 索引
CREATE INDEX IF NOT EXISTS idx_risk_alerts_company ON risk_alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_type ON risk_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_status ON risk_alerts(status);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_severity ON risk_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_customer ON risk_alerts(customer_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_created ON risk_alerts(created_at);

-- risk_metrics 索引
CREATE INDEX IF NOT EXISTS idx_risk_metrics_company ON risk_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_risk_metrics_date ON risk_metrics(metric_date);

-- ========================================
-- Row Level Security (RLS)
-- ========================================

ALTER TABLE risk_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_metrics ENABLE ROW LEVEL SECURITY;

-- risk_models: 所有認證用戶可讀
CREATE POLICY "risk_models_select" ON risk_models
  FOR SELECT TO authenticated
  USING (true);

-- customer_risk_assessments: 只能看自己公司的評估
CREATE POLICY "customer_risk_select" ON customer_risk_assessments
  FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "customer_risk_insert" ON customer_risk_assessments
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "customer_risk_update" ON customer_risk_assessments
  FOR UPDATE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- transaction_risk_assessments: 只能看自己公司的交易評估
CREATE POLICY "transaction_risk_select" ON transaction_risk_assessments
  FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "transaction_risk_insert" ON transaction_risk_assessments
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- market_risk_assessments: 只能看自己公司的市場風險
CREATE POLICY "market_risk_select" ON market_risk_assessments
  FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- risk_alerts: 只能看自己公司的警報
CREATE POLICY "risk_alerts_select" ON risk_alerts
  FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "risk_alerts_insert" ON risk_alerts
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "risk_alerts_update" ON risk_alerts
  FOR UPDATE TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- risk_limits: 只能看自己公司的限額
CREATE POLICY "risk_limits_select" ON risk_limits
  FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- risk_metrics: 只能看自己公司的指標
CREATE POLICY "risk_metrics_select" ON risk_metrics
  FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- ========================================
-- 函數
-- ========================================

-- 函數：獲取風險評估統計
CREATE OR REPLACE FUNCTION get_risk_assessment_stats(
  p_company_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_assessments BIGINT,
  high_risk_count BIGINT,
  avg_risk_score NUMERIC,
  total_alerts BIGINT,
  critical_alerts BIGINT,
  avg_ai_confidence NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_assessments,
    COUNT(*) FILTER (WHERE risk_level IN ('high', 'critical'))::BIGINT as high_risk_count,
    AVG(overall_risk_score) as avg_risk_score,
    (SELECT COUNT(*)::BIGINT FROM risk_alerts WHERE company_id = p_company_id AND created_at >= NOW() - (p_days || ' days')::INTERVAL) as total_alerts,
    (SELECT COUNT(*)::BIGINT FROM risk_alerts WHERE company_id = p_company_id AND severity = 'critical' AND created_at >= NOW() - (p_days || ' days')::INTERVAL) as critical_alerts,
    AVG(ai_confidence_score) as avg_ai_confidence
  FROM customer_risk_assessments
  WHERE company_id = p_company_id
    AND assessment_date >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 函數：更新風險警報狀態
CREATE OR REPLACE FUNCTION update_risk_alert_status(
  p_alert_id UUID,
  p_new_status TEXT,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE risk_alerts
  SET 
    status = p_new_status,
    assigned_to = CASE WHEN p_new_status = 'investigating' THEN p_user_id ELSE assigned_to END,
    acknowledged_at = CASE WHEN p_new_status != 'new' AND acknowledged_at IS NULL THEN NOW() ELSE acknowledged_at END,
    resolved_at = CASE WHEN p_new_status IN ('resolved', 'false_positive') THEN NOW() ELSE resolved_at END,
    resolution_notes = COALESCE(p_notes, resolution_notes),
    updated_at = NOW()
  WHERE id = p_alert_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 完成訊息
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ AI 風險評估系統 - 資料庫表結構創建完成';
  RAISE NOTICE '📋 已創建表格：';
  RAISE NOTICE '   - risk_models (風險模型)';
  RAISE NOTICE '   - customer_risk_assessments (客戶風險評估)';
  RAISE NOTICE '   - transaction_risk_assessments (交易風險評估)';
  RAISE NOTICE '   - market_risk_assessments (市場風險評估)';
  RAISE NOTICE '   - risk_alerts (風險警報)';
  RAISE NOTICE '   - risk_limits (風險限額)';
  RAISE NOTICE '   - risk_metrics (風險指標)';
  RAISE NOTICE '🔐 RLS 政策已啟用';
  RAISE NOTICE '📊 已創建函數和索引';
END $$;

