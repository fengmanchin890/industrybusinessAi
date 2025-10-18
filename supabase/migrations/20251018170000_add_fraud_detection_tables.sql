-- ==========================================
-- AI 詐欺偵測引擎 - 資料庫架構
-- ==========================================
-- Description: 完整的詐欺偵測系統資料庫架構
-- Company: fengfinancial company
-- Created: 2025-10-18
-- ==========================================

-- 交易記錄表
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  transaction_id VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id),
  transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'withdrawal', 'transfer', 'login', 'payment'
  amount DECIMAL(15, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  source_account VARCHAR(100),
  destination_account VARCHAR(100),
  ip_address INET,
  device_id VARCHAR(200),
  location JSONB, -- {country, city, lat, lon}
  merchant_name VARCHAR(200),
  merchant_category VARCHAR(100),
  card_last4 VARCHAR(4),
  transaction_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'flagged', 'blocked'
  risk_score DECIMAL(5, 2) DEFAULT 0, -- 0-100
  fraud_probability DECIMAL(5, 2) DEFAULT 0, -- 0-100
  is_fraudulent BOOLEAN DEFAULT false,
  flagged_reason TEXT,
  transaction_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_transaction_per_company UNIQUE(company_id, transaction_id)
);

-- 詐欺規則表
CREATE TABLE IF NOT EXISTS fraud_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rule_name VARCHAR(200) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'amount_threshold', 'velocity', 'location', 'device', 'pattern'
  description TEXT,
  conditions JSONB NOT NULL, -- 規則條件配置
  action VARCHAR(50) NOT NULL, -- 'flag', 'block', 'review', 'notify'
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  priority INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  trigger_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 詐欺案例表
CREATE TABLE IF NOT EXISTS fraud_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  case_number VARCHAR(100) NOT NULL,
  transaction_id UUID REFERENCES transactions(id),
  user_id UUID REFERENCES users(id),
  case_status VARCHAR(50) DEFAULT 'open', -- 'open', 'investigating', 'confirmed', 'false_positive', 'closed'
  severity VARCHAR(20) DEFAULT 'medium',
  fraud_type VARCHAR(100), -- 'card_fraud', 'account_takeover', 'identity_theft', 'phishing', 'money_laundering'
  total_amount DECIMAL(15, 2),
  affected_transactions INTEGER DEFAULT 1,
  detection_method VARCHAR(100), -- 'rule_based', 'ai_model', 'manual_review', 'customer_report'
  assigned_to UUID REFERENCES users(id),
  ai_analysis JSONB, -- AI 分析結果
  evidence JSONB, -- 證據資料
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_case_number UNIQUE(company_id, case_number)
);

-- 用戶行為檔案表
CREATE TABLE IF NOT EXISTS user_behavior_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  profile_data JSONB NOT NULL, -- 用戶行為特徵
  typical_transaction_amount DECIMAL(15, 2),
  typical_transaction_frequency INTEGER, -- per day
  common_merchants JSONB, -- 常用商家列表
  common_locations JSONB, -- 常用地點
  common_devices JSONB, -- 常用設備
  risk_level VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high'
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_user_profile UNIQUE(company_id, user_id)
);

-- 詐欺警報表
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id),
  fraud_case_id UUID REFERENCES fraud_cases(id),
  alert_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  message TEXT NOT NULL,
  details JSONB,
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'acknowledged', 'investigating', 'resolved', 'dismissed'
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 詐欺統計表
CREATE TABLE IF NOT EXISTS fraud_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,
  total_transactions INTEGER DEFAULT 0,
  flagged_transactions INTEGER DEFAULT 0,
  confirmed_fraud_cases INTEGER DEFAULT 0,
  false_positives INTEGER DEFAULT 0,
  total_fraud_amount DECIMAL(15, 2) DEFAULT 0,
  prevented_fraud_amount DECIMAL(15, 2) DEFAULT 0,
  accuracy_rate DECIMAL(5, 2), -- detection accuracy
  response_time_avg INTEGER, -- average response time in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_stat_per_day UNIQUE(company_id, stat_date)
);

-- 機器學習模型記錄表
CREATE TABLE IF NOT EXISTS ml_model_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  model_name VARCHAR(200) NOT NULL,
  model_version VARCHAR(50),
  prediction_type VARCHAR(100), -- 'fraud_detection', 'risk_scoring', 'anomaly_detection'
  input_data JSONB,
  output_data JSONB,
  confidence_score DECIMAL(5, 2),
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 索引 (Indexes)
-- ==========================================

-- Transactions
CREATE INDEX idx_transactions_company ON transactions(company_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_time ON transactions(transaction_time);
CREATE INDEX idx_transactions_status ON transactions(transaction_status);
CREATE INDEX idx_transactions_fraud ON transactions(is_fraudulent);
CREATE INDEX idx_transactions_risk ON transactions(risk_score DESC);
CREATE INDEX idx_transactions_ip ON transactions(ip_address);

-- Fraud Rules
CREATE INDEX idx_fraud_rules_company ON fraud_rules(company_id);
CREATE INDEX idx_fraud_rules_active ON fraud_rules(is_active);
CREATE INDEX idx_fraud_rules_type ON fraud_rules(rule_type);

-- Fraud Cases
CREATE INDEX idx_fraud_cases_company ON fraud_cases(company_id);
CREATE INDEX idx_fraud_cases_status ON fraud_cases(case_status);
CREATE INDEX idx_fraud_cases_severity ON fraud_cases(severity);
CREATE INDEX idx_fraud_cases_transaction ON fraud_cases(transaction_id);
CREATE INDEX idx_fraud_cases_user ON fraud_cases(user_id);
CREATE INDEX idx_fraud_cases_created ON fraud_cases(created_at DESC);

-- User Behavior Profiles
CREATE INDEX idx_user_profiles_company ON user_behavior_profiles(company_id);
CREATE INDEX idx_user_profiles_user ON user_behavior_profiles(user_id);
CREATE INDEX idx_user_profiles_risk ON user_behavior_profiles(risk_level);

-- Fraud Alerts
CREATE INDEX idx_fraud_alerts_company ON fraud_alerts(company_id);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_transaction ON fraud_alerts(transaction_id);
CREATE INDEX idx_fraud_alerts_case ON fraud_alerts(fraud_case_id);
CREATE INDEX idx_fraud_alerts_created ON fraud_alerts(created_at DESC);

-- Fraud Statistics
CREATE INDEX idx_fraud_stats_company ON fraud_statistics(company_id);
CREATE INDEX idx_fraud_stats_date ON fraud_statistics(stat_date DESC);

-- ML Model Logs
CREATE INDEX idx_ml_logs_company ON ml_model_logs(company_id);
CREATE INDEX idx_ml_logs_model ON ml_model_logs(model_name);
CREATE INDEX idx_ml_logs_created ON ml_model_logs(created_at DESC);

-- ==========================================
-- Row Level Security (RLS)
-- ==========================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_model_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view transactions from their company"
  ON transactions FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert transactions for their company"
  ON transactions FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update transactions from their company"
  ON transactions FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- RLS Policies for fraud_rules
CREATE POLICY "Users can view fraud rules from their company"
  ON fraud_rules FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert fraud rules for their company"
  ON fraud_rules FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update fraud rules from their company"
  ON fraud_rules FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- RLS Policies for fraud_cases
CREATE POLICY "Users can view fraud cases from their company"
  ON fraud_cases FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert fraud cases for their company"
  ON fraud_cases FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update fraud cases from their company"
  ON fraud_cases FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- RLS Policies for user_behavior_profiles
CREATE POLICY "Users can view behavior profiles from their company"
  ON user_behavior_profiles FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert behavior profiles for their company"
  ON user_behavior_profiles FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update behavior profiles from their company"
  ON user_behavior_profiles FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- RLS Policies for fraud_alerts
CREATE POLICY "Users can view fraud alerts from their company"
  ON fraud_alerts FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert fraud alerts for their company"
  ON fraud_alerts FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update fraud alerts from their company"
  ON fraud_alerts FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- RLS Policies for fraud_statistics
CREATE POLICY "Users can view fraud statistics from their company"
  ON fraud_statistics FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert fraud statistics for their company"
  ON fraud_statistics FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- RLS Policies for ml_model_logs
CREATE POLICY "Users can view ML logs from their company"
  ON ml_model_logs FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert ML logs for their company"
  ON ml_model_logs FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- ==========================================
-- Triggers for updated_at
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fraud_rules_updated_at BEFORE UPDATE ON fraud_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fraud_cases_updated_at BEFORE UPDATE ON fraud_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 統計函數 (Statistics Functions)
-- ==========================================

CREATE OR REPLACE FUNCTION get_fraud_statistics(p_company_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_transactions BIGINT,
  flagged_count BIGINT,
  confirmed_fraud BIGINT,
  fraud_amount NUMERIC,
  detection_rate NUMERIC,
  false_positive_rate NUMERIC,
  avg_risk_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_transactions,
    COUNT(*) FILTER (WHERE risk_score > 70)::BIGINT as flagged_count,
    COUNT(*) FILTER (WHERE is_fraudulent = true)::BIGINT as confirmed_fraud,
    COALESCE(SUM(amount) FILTER (WHERE is_fraudulent = true), 0) as fraud_amount,
    CASE 
      WHEN COUNT(*) FILTER (WHERE is_fraudulent = true) > 0 
      THEN (COUNT(*) FILTER (WHERE is_fraudulent = true)::NUMERIC / COUNT(*)::NUMERIC * 100)
      ELSE 0 
    END as detection_rate,
    CASE 
      WHEN COUNT(*) FILTER (WHERE risk_score > 70) > 0
      THEN (COUNT(*) FILTER (WHERE risk_score > 70 AND is_fraudulent = false)::NUMERIC / COUNT(*) FILTER (WHERE risk_score > 70)::NUMERIC * 100)
      ELSE 0
    END as false_positive_rate,
    COALESCE(AVG(risk_score), 0) as avg_risk_score
  FROM transactions
  WHERE company_id = p_company_id
    AND transaction_time >= CURRENT_TIMESTAMP - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 完成提示
-- ==========================================

COMMENT ON TABLE transactions IS 'AI 詐欺偵測 - 交易記錄表';
COMMENT ON TABLE fraud_rules IS 'AI 詐欺偵測 - 詐欺規則表';
COMMENT ON TABLE fraud_cases IS 'AI 詐欺偵測 - 詐欺案例表';
COMMENT ON TABLE user_behavior_profiles IS 'AI 詐欺偵測 - 用戶行為檔案表';
COMMENT ON TABLE fraud_alerts IS 'AI 詐欺偵測 - 詐欺警報表';
COMMENT ON TABLE fraud_statistics IS 'AI 詐欺偵測 - 詐欺統計表';
COMMENT ON TABLE ml_model_logs IS 'AI 詐欺偵測 - 機器學習模型記錄表';

