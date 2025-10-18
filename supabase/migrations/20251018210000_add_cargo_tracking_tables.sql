-- AI 貨物追蹤系統

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  tracking_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  origin_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  cargo_type TEXT NOT NULL,
  weight_kg DECIMAL(10, 2),
  current_status TEXT DEFAULT 'pending',
  current_location TEXT,
  estimated_delivery TIMESTAMPTZ,
  actual_delivery TIMESTAMPTZ,
  priority TEXT DEFAULT 'normal',
  delay_risk_score DECIMAL(5, 2),
  ai_eta_prediction TIMESTAMPTZ,
  ai_recommendations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracking_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  metric_date DATE DEFAULT CURRENT_DATE,
  total_shipments INTEGER DEFAULT 0,
  delivered_shipments INTEGER DEFAULT 0,
  delayed_shipments INTEGER DEFAULT 0,
  avg_delivery_time_hours DECIMAL(10, 2),
  on_time_rate DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_company ON shipments(company_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment ON tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_metrics_company ON delivery_metrics(company_id);

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shipments_select" ON shipments;
CREATE POLICY "shipments_select" ON shipments FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "tracking_events_select" ON tracking_events;
CREATE POLICY "tracking_events_select" ON tracking_events FOR SELECT TO authenticated
  USING (shipment_id IN (SELECT id FROM shipments WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));

DROP POLICY IF EXISTS "metrics_select" ON delivery_metrics;
CREATE POLICY "metrics_select" ON delivery_metrics FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE OR REPLACE FUNCTION get_cargo_stats(p_company_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_shipments BIGINT,
  in_transit BIGINT,
  delivered BIGINT,
  delayed BIGINT,
  on_time_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE current_status = 'in_transit')::BIGINT,
    COUNT(*) FILTER (WHERE current_status = 'delivered')::BIGINT,
    COUNT(*) FILTER (WHERE delay_risk_score > 70)::BIGINT,
    AVG(CASE WHEN current_status = 'delivered' AND actual_delivery <= estimated_delivery THEN 100 ELSE 0 END)
  FROM shipments
  WHERE company_id = p_company_id AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN RAISE NOTICE '✅ AI 貨物追蹤系統 - 資料庫完成'; END $$;
