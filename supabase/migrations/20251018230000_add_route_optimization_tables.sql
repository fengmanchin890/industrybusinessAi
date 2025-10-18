-- ========================================
-- AI 路線優化系統 - 數據庫表結構
-- ========================================

-- 1. 車輛表
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_code TEXT UNIQUE NOT NULL,
  vehicle_type TEXT NOT NULL, -- truck, van, motorcycle
  license_plate TEXT NOT NULL,
  capacity_kg DECIMAL(10, 2),
  capacity_m3 DECIMAL(10, 3),
  fuel_type TEXT DEFAULT 'diesel', -- diesel, electric, hybrid
  avg_fuel_consumption DECIMAL(5, 2), -- L/100km or kWh/100km
  max_range_km INTEGER,
  status TEXT DEFAULT 'available', -- available, in_use, maintenance, offline
  current_location_lat DECIMAL(10, 7),
  current_location_lng DECIMAL(10, 7),
  driver_name TEXT,
  driver_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 配送站點表
CREATE TABLE IF NOT EXISTS delivery_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  location_code TEXT NOT NULL,
  location_name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  location_type TEXT DEFAULT 'customer', -- warehouse, customer, pickup_point
  service_time_minutes INTEGER DEFAULT 10,
  time_window_start TIME,
  time_window_end TIME,
  priority INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 配送任務表
CREATE TABLE IF NOT EXISTS delivery_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  task_code TEXT UNIQUE NOT NULL,
  location_id UUID NOT NULL REFERENCES delivery_locations(id),
  shipment_id UUID REFERENCES shipments(id),
  task_type TEXT DEFAULT 'delivery', -- delivery, pickup
  task_date DATE NOT NULL,
  priority TEXT DEFAULT 'normal', -- urgent, high, normal, low
  cargo_weight_kg DECIMAL(10, 2),
  cargo_volume_m3 DECIMAL(10, 3),
  estimated_time_minutes INTEGER,
  status TEXT DEFAULT 'pending', -- pending, assigned, in_progress, completed, failed
  assigned_vehicle_id UUID REFERENCES vehicles(id),
  assigned_route_id UUID,
  scheduled_time TIME,
  actual_arrival_time TIMESTAMPTZ,
  completion_time TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 優化路線表
CREATE TABLE IF NOT EXISTS optimized_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  route_code TEXT UNIQUE NOT NULL,
  route_name TEXT NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id),
  route_date DATE NOT NULL,
  start_location_id UUID REFERENCES delivery_locations(id),
  end_location_id UUID REFERENCES delivery_locations(id),
  total_distance_km DECIMAL(10, 2),
  estimated_duration_minutes INTEGER,
  total_stops INTEGER,
  optimization_score DECIMAL(5, 2),
  ai_optimized BOOLEAN DEFAULT true,
  route_sequence JSONB, -- [{location_id, order, eta, service_time}]
  status TEXT DEFAULT 'planned', -- planned, active, completed, cancelled
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  fuel_cost DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 路線歷史記錄表
CREATE TABLE IF NOT EXISTS route_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES optimized_routes(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES delivery_locations(id),
  sequence_order INTEGER NOT NULL,
  arrival_time TIMESTAMPTZ,
  departure_time TIMESTAMPTZ,
  distance_from_previous_km DECIMAL(10, 2),
  service_time_minutes INTEGER,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 路線優化指標表
CREATE TABLE IF NOT EXISTS route_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  metric_date DATE DEFAULT CURRENT_DATE,
  total_routes INTEGER DEFAULT 0,
  total_distance_km DECIMAL(15, 2) DEFAULT 0,
  total_fuel_cost DECIMAL(15, 2) DEFAULT 0,
  avg_stops_per_route DECIMAL(5, 2),
  on_time_delivery_rate DECIMAL(5, 2),
  route_efficiency_score DECIMAL(5, 2),
  ai_optimization_savings DECIMAL(15, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_vehicles_company ON vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_locations_company ON delivery_locations(company_id);
CREATE INDEX IF NOT EXISTS idx_locations_coords ON delivery_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_tasks_company ON delivery_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON delivery_tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_vehicle ON delivery_tasks(assigned_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_routes_company ON optimized_routes(company_id);
CREATE INDEX IF NOT EXISTS idx_routes_date ON optimized_routes(route_date);
CREATE INDEX IF NOT EXISTS idx_routes_vehicle ON optimized_routes(vehicle_id);

-- 啟用 RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimized_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_metrics ENABLE ROW LEVEL SECURITY;

-- RLS 政策
DROP POLICY IF EXISTS "vehicles_select" ON vehicles;
CREATE POLICY "vehicles_select" ON vehicles FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "locations_select" ON delivery_locations;
CREATE POLICY "locations_select" ON delivery_locations FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "tasks_select" ON delivery_tasks;
CREATE POLICY "tasks_select" ON delivery_tasks FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "routes_select" ON optimized_routes;
CREATE POLICY "routes_select" ON optimized_routes FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "history_select" ON route_history;
CREATE POLICY "history_select" ON route_history FOR SELECT TO authenticated
  USING (route_id IN (SELECT id FROM optimized_routes WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));

DROP POLICY IF EXISTS "metrics_select" ON route_metrics;
CREATE POLICY "metrics_select" ON route_metrics FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- 輔助函數：計算兩點距離（簡化版，使用球面距離公式）
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lng1 DECIMAL,
  lat2 DECIMAL, lng2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  R CONSTANT DECIMAL := 6371; -- 地球半徑 (km)
  dLat DECIMAL;
  dLng DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dLat := radians(lat2 - lat1);
  dLng := radians(lng2 - lng1);
  
  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dLng/2) * sin(dLng/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 輔助函數：獲取路線統計
CREATE OR REPLACE FUNCTION get_route_stats(p_company_id UUID, p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  total_routes BIGINT,
  active_routes BIGINT,
  completed_routes BIGINT,
  total_distance NUMERIC,
  avg_efficiency NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT,
    SUM(total_distance_km),
    AVG(optimization_score)
  FROM optimized_routes
  WHERE company_id = p_company_id 
    AND route_date >= CURRENT_DATE - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN RAISE NOTICE '✅ AI 路線優化系統 - 資料庫完成'; END $$;

