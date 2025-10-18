-- ========================================
-- AI 庫存優化系統 - 數據庫表結構
-- ========================================

-- 1. 商品主表
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_code TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT DEFAULT 'pcs',
  unit_cost DECIMAL(10, 2),
  unit_price DECIMAL(10, 2),
  min_stock_level INTEGER DEFAULT 10,
  max_stock_level INTEGER DEFAULT 100,
  reorder_point INTEGER DEFAULT 20,
  lead_time_days INTEGER DEFAULT 7,
  shelf_life_days INTEGER,
  storage_requirements TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 倉庫庫存表
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_zone_id UUID REFERENCES warehouse_zones(id),
  current_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  damaged_quantity INTEGER DEFAULT 0,
  last_stocktake_date DATE,
  last_stocktake_quantity INTEGER,
  ai_predicted_demand INTEGER,
  ai_reorder_suggestion INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, warehouse_zone_id)
);

-- 3. 出入庫記錄表
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  transaction_type TEXT NOT NULL, -- inbound, outbound, adjustment, damage
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10, 2),
  reference_type TEXT, -- purchase_order, sales_order, transfer, stocktake
  reference_id UUID,
  warehouse_zone_id UUID REFERENCES warehouse_zones(id),
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  performed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 補貨建議表
CREATE TABLE IF NOT EXISTS reorder_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  current_stock INTEGER NOT NULL,
  recommended_quantity INTEGER NOT NULL,
  urgency_level TEXT DEFAULT 'normal', -- critical, high, normal, low
  reason TEXT,
  ai_confidence DECIMAL(5, 2),
  estimated_cost DECIMAL(15, 2),
  expected_delivery_date DATE,
  status TEXT DEFAULT 'pending', -- pending, approved, ordered, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 庫存預測表
CREATE TABLE IF NOT EXISTS inventory_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  forecast_date DATE NOT NULL,
  predicted_demand INTEGER,
  predicted_stock_level INTEGER,
  confidence_level DECIMAL(5, 2),
  risk_of_stockout DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, forecast_date)
);

-- 6. 庫存指標表
CREATE TABLE IF NOT EXISTS inventory_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  metric_date DATE DEFAULT CURRENT_DATE,
  total_products INTEGER DEFAULT 0,
  total_stock_value DECIMAL(15, 2) DEFAULT 0,
  low_stock_items INTEGER DEFAULT 0,
  out_of_stock_items INTEGER DEFAULT 0,
  overstock_items INTEGER DEFAULT 0,
  inventory_turnover_rate DECIMAL(5, 2),
  stockout_rate DECIMAL(5, 2),
  fill_rate DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_inventory_company ON inventory(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_company ON inventory_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON inventory_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_reorder_company ON reorder_recommendations(company_id);
CREATE INDEX IF NOT EXISTS idx_reorder_status ON reorder_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_forecasts_product_date ON inventory_forecasts(product_id, forecast_date);

-- 啟用 RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reorder_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_metrics ENABLE ROW LEVEL SECURITY;

-- RLS 政策
DROP POLICY IF EXISTS "products_select" ON products;
CREATE POLICY "products_select" ON products FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "inventory_select" ON inventory;
CREATE POLICY "inventory_select" ON inventory FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "transactions_select" ON inventory_transactions;
CREATE POLICY "transactions_select" ON inventory_transactions FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "reorder_select" ON reorder_recommendations;
CREATE POLICY "reorder_select" ON reorder_recommendations FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "forecasts_select" ON inventory_forecasts;
CREATE POLICY "forecasts_select" ON inventory_forecasts FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "metrics_select" ON inventory_metrics;
CREATE POLICY "metrics_select" ON inventory_metrics FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- 輔助函數：獲取庫存統計
CREATE OR REPLACE FUNCTION get_inventory_stats(p_company_id UUID)
RETURNS TABLE (
  total_products BIGINT,
  total_stock_value NUMERIC,
  low_stock_items BIGINT,
  out_of_stock_items BIGINT,
  avg_stock_level NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT p.id)::BIGINT,
    SUM(i.current_quantity * p.unit_cost),
    COUNT(*) FILTER (WHERE i.current_quantity <= p.min_stock_level AND i.current_quantity > 0)::BIGINT,
    COUNT(*) FILTER (WHERE i.current_quantity = 0)::BIGINT,
    AVG(i.current_quantity)
  FROM products p
  LEFT JOIN inventory i ON i.product_id = p.id
  WHERE p.company_id = p_company_id AND p.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 輔助函數：更新庫存
CREATE OR REPLACE FUNCTION update_inventory(
  p_product_id UUID,
  p_warehouse_zone_id UUID,
  p_quantity_change INTEGER,
  p_transaction_type TEXT
)
RETURNS VOID AS $$
BEGIN
  -- 更新或插入庫存
  INSERT INTO inventory (product_id, warehouse_zone_id, current_quantity, available_quantity)
  VALUES (p_product_id, p_warehouse_zone_id, p_quantity_change, p_quantity_change)
  ON CONFLICT (product_id, warehouse_zone_id)
  DO UPDATE SET
    current_quantity = inventory.current_quantity + p_quantity_change,
    available_quantity = inventory.available_quantity + p_quantity_change,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN RAISE NOTICE '✅ AI 庫存優化系統 - 資料庫完成'; END $$;

