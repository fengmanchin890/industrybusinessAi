-- ========================================
-- AI 財務分析系統 - 數據庫表結構
-- ========================================

-- 1. 財務交易表
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer')),
  category TEXT NOT NULL,
  subcategory TEXT,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT DEFAULT 'TWD',
  description TEXT,
  reference_number TEXT,
  payment_method TEXT, -- cash, bank_transfer, credit_card, etc.
  vendor_customer TEXT,
  invoice_number TEXT,
  tax_amount DECIMAL(15, 2) DEFAULT 0,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT, -- monthly, quarterly, yearly
  tags TEXT[],
  attachments JSONB,
  status TEXT DEFAULT 'confirmed', -- pending, confirmed, cancelled
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 財務分類表
CREATE TABLE IF NOT EXISTS financial_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  category_type TEXT NOT NULL CHECK (category_type IN ('income', 'expense', 'asset', 'liability')),
  parent_category_id UUID REFERENCES financial_categories(id),
  description TEXT,
  budget_limit DECIMAL(15, 2),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 現金流預測表
CREATE TABLE IF NOT EXISTS cash_flow_projections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  projection_date DATE NOT NULL,
  projection_type TEXT NOT NULL CHECK (projection_type IN ('daily', 'weekly', 'monthly', 'quarterly')),
  opening_balance DECIMAL(15, 2) NOT NULL,
  projected_income DECIMAL(15, 2) NOT NULL,
  projected_expense DECIMAL(15, 2) NOT NULL,
  net_cash_flow DECIMAL(15, 2) NOT NULL,
  closing_balance DECIMAL(15, 2) NOT NULL,
  confidence_level DECIMAL(3, 2) DEFAULT 0.8, -- 0.0 to 1.0
  ai_generated BOOLEAN DEFAULT false,
  model_version TEXT,
  factors_considered JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 預算計畫表
CREATE TABLE IF NOT EXISTS budget_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  budget_name TEXT NOT NULL,
  budget_period TEXT NOT NULL, -- monthly, quarterly, yearly
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  category TEXT NOT NULL,
  planned_amount DECIMAL(15, 2) NOT NULL,
  actual_amount DECIMAL(15, 2) DEFAULT 0,
  variance DECIMAL(15, 2) DEFAULT 0,
  variance_percentage DECIMAL(5, 2) DEFAULT 0,
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 財務警報表
CREATE TABLE IF NOT EXISTS financial_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- cash_flow_warning, budget_exceeded, unusual_expense, etc.
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_transaction_id UUID REFERENCES financial_transactions(id),
  threshold_value DECIMAL(15, 2),
  actual_value DECIMAL(15, 2),
  recommendations TEXT[],
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 財務指標表
CREATE TABLE IF NOT EXISTS financial_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  metric_period TEXT NOT NULL, -- daily, weekly, monthly, quarterly, yearly
  total_revenue DECIMAL(15, 2) DEFAULT 0,
  total_expense DECIMAL(15, 2) DEFAULT 0,
  net_profit DECIMAL(15, 2) DEFAULT 0,
  profit_margin DECIMAL(5, 2) DEFAULT 0,
  cash_balance DECIMAL(15, 2) DEFAULT 0,
  accounts_receivable DECIMAL(15, 2) DEFAULT 0,
  accounts_payable DECIMAL(15, 2) DEFAULT 0,
  working_capital DECIMAL(15, 2) DEFAULT 0,
  burn_rate DECIMAL(15, 2) DEFAULT 0,
  runway_months DECIMAL(5, 1) DEFAULT 0,
  quick_ratio DECIMAL(5, 2) DEFAULT 0,
  debt_to_equity DECIMAL(5, 2) DEFAULT 0,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AI 財務建議表
CREATE TABLE IF NOT EXISTS financial_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL, -- cost_reduction, revenue_optimization, cash_flow_improvement, etc.
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  potential_impact DECIMAL(15, 2),
  implementation_difficulty TEXT CHECK (implementation_difficulty IN ('easy', 'moderate', 'difficult')),
  estimated_timeframe TEXT,
  action_items TEXT[],
  category TEXT,
  status TEXT DEFAULT 'new', -- new, in_progress, implemented, dismissed
  confidence_score DECIMAL(3, 2) DEFAULT 0.8,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 索引
-- ========================================

CREATE INDEX IF NOT EXISTS idx_financial_transactions_company_date ON financial_transactions(company_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON financial_transactions(category);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON financial_transactions(status);

CREATE INDEX IF NOT EXISTS idx_cash_flow_projections_company_date ON cash_flow_projections(company_id, projection_date DESC);
CREATE INDEX IF NOT EXISTS idx_budget_plans_company_period ON budget_plans(company_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_financial_alerts_company_unread ON financial_alerts(company_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_metrics_company_date ON financial_metrics(company_id, metric_date DESC);

-- ========================================
-- 輔助函數
-- ========================================

-- 計算財務指標
CREATE OR REPLACE FUNCTION calculate_financial_metrics(
  p_company_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_revenue DECIMAL,
  total_expense DECIMAL,
  net_profit DECIMAL,
  profit_margin DECIMAL,
  transaction_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END), 0) as total_revenue,
    COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
    COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END), 0) as net_profit,
    CASE 
      WHEN SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) > 0 
      THEN (SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END) / 
            SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END)) * 100
      ELSE 0 
    END as profit_margin,
    COUNT(*)::INTEGER as transaction_count
  FROM financial_transactions
  WHERE company_id = p_company_id
    AND transaction_date BETWEEN p_start_date AND p_end_date
    AND status = 'confirmed';
END;
$$ LANGUAGE plpgsql;

-- 獲取分類支出統計
CREATE OR REPLACE FUNCTION get_category_spending(
  p_company_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  category TEXT,
  total_amount DECIMAL,
  transaction_count INTEGER,
  average_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ft.category,
    SUM(ft.amount) as total_amount,
    COUNT(*)::INTEGER as transaction_count,
    AVG(ft.amount) as average_amount
  FROM financial_transactions ft
  WHERE ft.company_id = p_company_id
    AND ft.transaction_type = 'expense'
    AND ft.transaction_date BETWEEN p_start_date AND p_end_date
    AND ft.status = 'confirmed'
  GROUP BY ft.category
  ORDER BY SUM(ft.amount) DESC;
END;
$$ LANGUAGE plpgsql;

-- 預測未來現金流
CREATE OR REPLACE FUNCTION predict_cash_flow(
  p_company_id UUID,
  p_months_ahead INTEGER DEFAULT 3
)
RETURNS TABLE (
  projection_month TEXT,
  projected_income DECIMAL,
  projected_expense DECIMAL,
  net_cash_flow DECIMAL
) AS $$
DECLARE
  v_avg_monthly_income DECIMAL;
  v_avg_monthly_expense DECIMAL;
  v_month_date DATE;
  v_month_name TEXT;
BEGIN
  -- 計算過去6個月的平均收支
  SELECT 
    AVG(monthly_income),
    AVG(monthly_expense)
  INTO v_avg_monthly_income, v_avg_monthly_expense
  FROM (
    SELECT 
      DATE_TRUNC('month', transaction_date)::DATE as month,
      SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as monthly_income,
      SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as monthly_expense
    FROM financial_transactions
    WHERE company_id = p_company_id
      AND transaction_date >= CURRENT_DATE - INTERVAL '6 months'
      AND status = 'confirmed'
    GROUP BY DATE_TRUNC('month', transaction_date)
  ) monthly_data;

  -- 生成未來月份的預測
  FOR i IN 1..p_months_ahead LOOP
    v_month_date := CURRENT_DATE + (i || ' months')::INTERVAL;
    v_month_name := TO_CHAR(v_month_date, 'YYYY-MM');
    
    RETURN QUERY SELECT
      v_month_name,
      COALESCE(v_avg_monthly_income, 0),
      COALESCE(v_avg_monthly_expense, 0),
      COALESCE(v_avg_monthly_income, 0) - COALESCE(v_avg_monthly_expense, 0);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 行級安全性 (RLS)
-- ========================================

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_recommendations ENABLE ROW LEVEL SECURITY;

-- 財務交易政策
CREATE POLICY financial_transactions_company_policy ON financial_transactions
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- 財務分類政策
CREATE POLICY financial_categories_company_policy ON financial_categories
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- 現金流預測政策
CREATE POLICY cash_flow_projections_company_policy ON cash_flow_projections
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- 預算計畫政策
CREATE POLICY budget_plans_company_policy ON budget_plans
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- 財務警報政策
CREATE POLICY financial_alerts_company_policy ON financial_alerts
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- 財務指標政策
CREATE POLICY financial_metrics_company_policy ON financial_metrics
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- AI 財務建議政策
CREATE POLICY financial_recommendations_company_policy ON financial_recommendations
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- ========================================
-- 觸發器
-- ========================================

-- 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_financial_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON financial_transactions
  FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();

CREATE TRIGGER update_budget_plans_updated_at
  BEFORE UPDATE ON budget_plans
  FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();

CREATE TRIGGER update_financial_recommendations_updated_at
  BEFORE UPDATE ON financial_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();

DO $$ BEGIN RAISE NOTICE 'AI 財務分析系統 - 資料庫完成'; END $$;

