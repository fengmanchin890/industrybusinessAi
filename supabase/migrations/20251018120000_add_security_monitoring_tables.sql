-- ==========================================
-- AI 安全監控系統 - 資料庫架構
-- ==========================================

-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 安全事件表
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event_code TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('intrusion', 'malware', 'ddos', 'data_breach', 'unauthorized_access', 'anomaly', 'phishing', 'ransomware')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved', 'false_positive', 'ignored')),
  
  -- 事件詳情
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  source_ip TEXT,
  source_location TEXT,
  target_system TEXT NOT NULL,
  target_asset TEXT,
  
  -- 影響分析
  affected_systems TEXT[] DEFAULT '{}',
  affected_users TEXT[] DEFAULT '{}',
  data_accessed BOOLEAN DEFAULT false,
  data_modified BOOLEAN DEFAULT false,
  data_exported BOOLEAN DEFAULT false,
  
  -- 回應資訊
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  response_started_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  response_time_minutes INTEGER,
  response_actions TEXT[] DEFAULT '{}',
  
  -- AI 分析
  ai_threat_score INTEGER CHECK (ai_threat_score BETWEEN 0 AND 100),
  ai_analysis TEXT,
  ai_recommendations TEXT[] DEFAULT '{}',
  false_positive_probability NUMERIC(5,2),
  
  -- 元數據
  raw_log_data JSONB DEFAULT '{}'::jsonb,
  indicators_of_compromise TEXT[] DEFAULT '{}',
  mitre_attack_techniques TEXT[] DEFAULT '{}',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 威脅情報表
CREATE TABLE IF NOT EXISTS threat_intelligence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  threat_name TEXT NOT NULL,
  threat_type TEXT NOT NULL CHECK (threat_type IN ('malware', 'vulnerability', 'exploit', 'actor', 'campaign', 'technique')),
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  
  -- 威脅詳情
  description TEXT NOT NULL,
  indicators TEXT[] DEFAULT '{}',  -- IP, domain, hash, etc.
  affected_systems TEXT[] DEFAULT '{}',
  attack_vectors TEXT[] DEFAULT '{}',
  
  -- 建議措施
  mitigation_steps TEXT[] DEFAULT '{}',
  detection_rules TEXT[] DEFAULT '{}',
  remediation_priority INTEGER CHECK (remediation_priority BETWEEN 1 AND 10),
  
  -- 來源資訊
  source TEXT,  -- 情報來源
  confidence_level INTEGER CHECK (confidence_level BETWEEN 0 AND 100),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  
  -- AI 增強
  ai_enrichment TEXT,
  related_threats UUID[],
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 系統資產表
CREATE TABLE IF NOT EXISTS security_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('server', 'database', 'application', 'network', 'endpoint', 'cloud', 'iot')),
  
  -- 資產詳情
  description TEXT,
  ip_address TEXT,
  hostname TEXT,
  location TEXT,
  department TEXT,
  owner_contact TEXT,
  
  -- 風險評估
  criticality TEXT CHECK (criticality IN ('critical', 'high', 'medium', 'low')),
  exposure_level TEXT CHECK (exposure_level IN ('public', 'dmz', 'internal', 'isolated')),
  security_posture_score INTEGER CHECK (security_posture_score BETWEEN 0 AND 100),
  
  -- 配置資訊
  os_version TEXT,
  software_stack TEXT[] DEFAULT '{}',
  security_controls TEXT[] DEFAULT '{}',
  last_patched TIMESTAMPTZ,
  last_scanned TIMESTAMPTZ,
  
  -- 狀態
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'offline', 'decommissioned')),
  monitoring_enabled BOOLEAN DEFAULT true,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 安全警報規則表
CREATE TABLE IF NOT EXISTS security_alert_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT CHECK (rule_type IN ('threshold', 'anomaly', 'correlation', 'signature', 'behavior')),
  
  -- 規則配置
  description TEXT,
  conditions JSONB NOT NULL,
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  
  -- 動作
  actions TEXT[] DEFAULT '{}',  -- 'alert', 'block', 'isolate', 'notify'
  notification_channels TEXT[] DEFAULT '{}',  -- 'email', 'sms', 'slack', 'webhook'
  
  -- AI 強化
  use_ai_analysis BOOLEAN DEFAULT false,
  ai_confidence_threshold INTEGER CHECK (ai_confidence_threshold BETWEEN 0 AND 100),
  
  is_enabled BOOLEAN DEFAULT true,
  last_triggered TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 事件回應記錄表
CREATE TABLE IF NOT EXISTS incident_response_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES security_events(id) ON DELETE CASCADE,
  
  action_type TEXT CHECK (action_type IN ('investigation', 'containment', 'eradication', 'recovery', 'post-incident')),
  action_description TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 結果
  status TEXT CHECK (status IN ('in-progress', 'completed', 'failed', 'cancelled')),
  outcome TEXT,
  evidence_collected JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 安全掃描結果表
CREATE TABLE IF NOT EXISTS security_scan_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES security_assets(id) ON DELETE CASCADE,
  
  scan_type TEXT CHECK (scan_type IN ('vulnerability', 'compliance', 'configuration', 'penetration', 'malware')),
  scan_status TEXT CHECK (scan_status IN ('queued', 'running', 'completed', 'failed')),
  
  -- 掃描結果
  findings JSONB DEFAULT '[]'::jsonb,
  vulnerabilities_critical INTEGER DEFAULT 0,
  vulnerabilities_high INTEGER DEFAULT 0,
  vulnerabilities_medium INTEGER DEFAULT 0,
  vulnerabilities_low INTEGER DEFAULT 0,
  
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  compliance_status TEXT,
  
  -- AI 分析
  ai_priority_recommendations TEXT[] DEFAULT '{}',
  ai_risk_assessment TEXT,
  
  scan_started_at TIMESTAMPTZ,
  scan_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_security_events_company_id ON security_events(company_id);
CREATE INDEX IF NOT EXISTS idx_security_events_status ON security_events(status);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_detected_at ON security_events(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);

CREATE INDEX IF NOT EXISTS idx_threat_intelligence_company_id ON threat_intelligence(company_id);
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_type ON threat_intelligence(threat_type);
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_active ON threat_intelligence(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_security_assets_company_id ON security_assets(company_id);
CREATE INDEX IF NOT EXISTS idx_security_assets_type ON security_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_security_assets_criticality ON security_assets(criticality);

CREATE INDEX IF NOT EXISTS idx_alert_rules_company_id ON security_alert_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON security_alert_rules(is_enabled) WHERE is_enabled = true;

CREATE INDEX IF NOT EXISTS idx_incident_logs_event_id ON incident_response_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_scan_results_asset_id ON security_scan_results(asset_id);

-- 啟用 RLS
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_response_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_scan_results ENABLE ROW LEVEL SECURITY;

-- RLS 策略（使用 users 表）
-- security_events
DROP POLICY IF EXISTS "Users can view security events" ON security_events;
CREATE POLICY "Users can view security events" ON security_events FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert security events" ON security_events;
CREATE POLICY "Users can insert security events" ON security_events FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update security events" ON security_events;
CREATE POLICY "Users can update security events" ON security_events FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- threat_intelligence
DROP POLICY IF EXISTS "Users can view threat intel" ON threat_intelligence;
CREATE POLICY "Users can view threat intel" ON threat_intelligence FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert threat intel" ON threat_intelligence;
CREATE POLICY "Users can insert threat intel" ON threat_intelligence FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- security_assets
DROP POLICY IF EXISTS "Users can view security assets" ON security_assets;
CREATE POLICY "Users can view security assets" ON security_assets FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert security assets" ON security_assets;
CREATE POLICY "Users can insert security assets" ON security_assets FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- security_alert_rules
DROP POLICY IF EXISTS "Users can view alert rules" ON security_alert_rules;
CREATE POLICY "Users can view alert rules" ON security_alert_rules FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- incident_response_logs
DROP POLICY IF EXISTS "Users can view incident logs" ON incident_response_logs;
CREATE POLICY "Users can view incident logs" ON incident_response_logs FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert incident logs" ON incident_response_logs;
CREATE POLICY "Users can insert incident logs" ON incident_response_logs FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- security_scan_results
DROP POLICY IF EXISTS "Users can view scan results" ON security_scan_results;
CREATE POLICY "Users can view scan results" ON security_scan_results FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- 自動更新 updated_at 觸發器
CREATE OR REPLACE FUNCTION update_security_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_security_events_updated_at BEFORE UPDATE ON security_events
  FOR EACH ROW EXECUTE FUNCTION update_security_updated_at();

CREATE TRIGGER update_threat_intelligence_updated_at BEFORE UPDATE ON threat_intelligence
  FOR EACH ROW EXECUTE FUNCTION update_security_updated_at();

CREATE TRIGGER update_security_assets_updated_at BEFORE UPDATE ON security_assets
  FOR EACH ROW EXECUTE FUNCTION update_security_updated_at();

CREATE TRIGGER update_security_alert_rules_updated_at BEFORE UPDATE ON security_alert_rules
  FOR EACH ROW EXECUTE FUNCTION update_security_updated_at();

-- 統計函數
CREATE OR REPLACE FUNCTION get_security_stats(p_company_id UUID)
RETURNS TABLE (
  total_events BIGINT,
  critical_events BIGINT,
  active_threats BIGINT,
  resolved_today BIGINT,
  avg_response_time NUMERIC,
  system_health INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_events,
    COUNT(*) FILTER (WHERE severity = 'critical')::BIGINT as critical_events,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT as active_threats,
    COUNT(*) FILTER (WHERE status = 'resolved' AND DATE(resolved_at) = CURRENT_DATE)::BIGINT as resolved_today,
    COALESCE(AVG(response_time_minutes) FILTER (WHERE response_time_minutes IS NOT NULL), 0) as avg_response_time,
    GREATEST(100 - (COUNT(*) FILTER (WHERE status = 'active' AND severity IN ('critical', 'high')) * 5)::INTEGER, 0) as system_health
  FROM security_events
  WHERE company_id = p_company_id
    AND detected_at > NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;