-- ========================================
-- AI 路線優化系統 - 快速設置
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
DECLARE
  v_company_id UUID;
  v_vehicle1_id UUID;
  v_vehicle2_id UUID;
  v_warehouse_id UUID;
  v_loc1_id UUID;
  v_loc2_id UUID;
  v_loc3_id UUID;
  v_loc4_id UUID;
  v_loc5_id UUID;
BEGIN
  SELECT id INTO v_company_id FROM companies WHERE industry = 'logistics' LIMIT 1;
  
  IF v_company_id IS NULL THEN
    RAISE NOTICE '⚠️ 未找到物流公司，請先創建物流公司';
    RETURN;
  END IF;

  RAISE NOTICE '✅ 找到物流公司: %', v_company_id;

  -- ========================================
  -- 1. 創建車輛
  -- ========================================
  INSERT INTO vehicles (
    company_id, vehicle_code, vehicle_type, license_plate, 
    capacity_kg, capacity_m3, fuel_type, avg_fuel_consumption, 
    max_range_km, driver_name, driver_phone
  ) VALUES
    (v_company_id, 'TRK-001', 'truck', 'ABC-1234', 5000, 20.0, 
     'diesel', 12.5, 500, '張大明', '0912-111-222'),
    (v_company_id, 'VAN-001', 'van', 'DEF-5678', 1500, 8.0, 
     'diesel', 8.5, 400, '李小華', '0923-333-444'),
    (v_company_id, 'VAN-002', 'van', 'GHI-9012', 1500, 8.0, 
     'electric', 18.0, 300, '王美玲', '0934-555-666'),
    (v_company_id, 'MTR-001', 'motorcycle', 'JKL-3456', 50, 0.5, 
     'gasoline', 3.5, 200, '陳志強', '0945-777-888')
  ON CONFLICT (vehicle_code) DO NOTHING;

  SELECT id INTO v_vehicle1_id FROM vehicles WHERE company_id = v_company_id AND vehicle_code = 'TRK-001';
  SELECT id INTO v_vehicle2_id FROM vehicles WHERE company_id = v_company_id AND vehicle_code = 'VAN-001';

  RAISE NOTICE '✅ 已創建 4 輛車輛';

  -- ========================================
  -- 2. 創建配送站點
  -- ========================================
  INSERT INTO delivery_locations (
    company_id, location_code, location_name, address, 
    latitude, longitude, location_type, service_time_minutes
  ) VALUES
    -- 倉庫（起點）
    (v_company_id, 'WH-001', '中央倉庫', '台北市南港區南港路一段1號', 
     25.0522, 121.6089, 'warehouse', 0),
    
    -- 客戶地址
    (v_company_id, 'LOC-001', '客戶A - 信義商圈', '台北市信義區信義路五段7號', 
     25.0330, 121.5654, 'customer', 10),
    (v_company_id, 'LOC-002', '客戶B - 中山區', '台北市中山區南京東路三段219號', 
     25.0520, 121.5442, 'customer', 15),
    (v_company_id, 'LOC-003', '客戶C - 大安區', '台北市大安區敦化南路二段63號', 
     25.0260, 121.5498, 'customer', 10),
    (v_company_id, 'LOC-004', '客戶D - 松山區', '台北市松山區八德路四段123號', 
     25.0480, 121.5620, 'customer', 12),
    (v_company_id, 'LOC-005', '客戶E - 內湖區', '台北市內湖區內湖路一段512號', 
     25.0820, 121.5680, 'customer', 10),
    (v_company_id, 'LOC-006', '客戶F - 士林區', '台北市士林區中正路200號', 
     25.0938, 121.5260, 'customer', 15),
    (v_company_id, 'LOC-007', '客戶G - 板橋區', '新北市板橋區文化路一段188號', 
     25.0080, 121.4630, 'customer', 10)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_warehouse_id FROM delivery_locations WHERE company_id = v_company_id AND location_code = 'WH-001';
  SELECT id INTO v_loc1_id FROM delivery_locations WHERE company_id = v_company_id AND location_code = 'LOC-001';
  SELECT id INTO v_loc2_id FROM delivery_locations WHERE company_id = v_company_id AND location_code = 'LOC-002';
  SELECT id INTO v_loc3_id FROM delivery_locations WHERE company_id = v_company_id AND location_code = 'LOC-003';
  SELECT id INTO v_loc4_id FROM delivery_locations WHERE company_id = v_company_id AND location_code = 'LOC-004';
  SELECT id INTO v_loc5_id FROM delivery_locations WHERE company_id = v_company_id AND location_code = 'LOC-005';

  RAISE NOTICE '✅ 已創建 8 個配送站點';

  -- ========================================
  -- 3. 創建配送任務
  -- ========================================
  IF v_loc1_id IS NOT NULL THEN
    INSERT INTO delivery_tasks (
      company_id, task_code, location_id, task_type, task_date,
      priority, cargo_weight_kg, cargo_volume_m3, estimated_time_minutes
    ) VALUES
      (v_company_id, 'TASK-001', v_loc1_id, 'delivery', CURRENT_DATE, 
       'urgent', 150, 1.2, 10),
      (v_company_id, 'TASK-002', v_loc2_id, 'delivery', CURRENT_DATE, 
       'high', 200, 1.5, 15),
      (v_company_id, 'TASK-003', v_loc3_id, 'delivery', CURRENT_DATE, 
       'normal', 100, 0.8, 10),
      (v_company_id, 'TASK-004', v_loc4_id, 'delivery', CURRENT_DATE, 
       'normal', 80, 0.6, 12),
      (v_company_id, 'TASK-005', v_loc5_id, 'delivery', CURRENT_DATE, 
       'normal', 120, 1.0, 10),
      
      -- 明天的任務
      (v_company_id, 'TASK-006', v_loc1_id, 'delivery', CURRENT_DATE + 1, 
       'normal', 180, 1.4, 10),
      (v_company_id, 'TASK-007', v_loc2_id, 'pickup', CURRENT_DATE + 1, 
       'high', 50, 0.4, 15)
    ON CONFLICT (task_code) DO NOTHING;

    RAISE NOTICE '✅ 已創建 7 個配送任務';
  END IF;

  -- ========================================
  -- 4. 創建示範優化路線
  -- ========================================
  IF v_vehicle1_id IS NOT NULL AND v_warehouse_id IS NOT NULL THEN
    INSERT INTO optimized_routes (
      company_id, route_code, route_name, vehicle_id, route_date,
      start_location_id, end_location_id, total_distance_km,
      estimated_duration_minutes, total_stops, optimization_score,
      route_sequence, status, fuel_cost
    ) VALUES
      (v_company_id, 'ROUTE-001', '今日配送路線 A', v_vehicle1_id, CURRENT_DATE,
       v_warehouse_id, v_warehouse_id, 28.5, 120, 3, 88.5,
       jsonb_build_array(
         jsonb_build_object('order', 1, 'location_id', v_loc1_id::text, 'distance', 5.2),
         jsonb_build_object('order', 2, 'location_id', v_loc2_id::text, 'distance', 8.3),
         jsonb_build_object('order', 3, 'location_id', v_loc3_id::text, 'distance', 6.5)
       ),
       'active', 256.50),
      
      (v_company_id, 'ROUTE-002', '今日配送路線 B', v_vehicle2_id, CURRENT_DATE,
       v_warehouse_id, v_warehouse_id, 22.0, 95, 2, 90.0,
       jsonb_build_array(
         jsonb_build_object('order', 1, 'location_id', v_loc4_id::text, 'distance', 7.5),
         jsonb_build_object('order', 2, 'location_id', v_loc5_id::text, 'distance', 9.2)
       ),
       'planned', 198.00)
    ON CONFLICT (route_code) DO NOTHING;

    RAISE NOTICE '✅ 已創建 2 條示範路線';
  END IF;

  -- ========================================
  -- 5. 創建路線指標
  -- ========================================
  INSERT INTO route_metrics (
    company_id, metric_date, total_routes, total_distance_km,
    total_fuel_cost, avg_stops_per_route, on_time_delivery_rate,
    route_efficiency_score, ai_optimization_savings
  ) VALUES
    (v_company_id, CURRENT_DATE - 1, 8, 215.5, 1934.50, 3.5, 92.5, 87.5, 450.00),
    (v_company_id, CURRENT_DATE, 2, 50.5, 454.50, 2.5, 95.0, 89.0, 120.00)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ 已創建路線指標';

END $$;

-- ========================================
-- 顯示摘要
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ AI 路線優化系統設置完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 數據摘要:';
  RAISE NOTICE '  • 車輛: %', (SELECT COUNT(*) FROM vehicles);
  RAISE NOTICE '  • 配送站點: %', (SELECT COUNT(*) FROM delivery_locations);
  RAISE NOTICE '  • 配送任務: %', (SELECT COUNT(*) FROM delivery_tasks);
  RAISE NOTICE '  • 優化路線: %', (SELECT COUNT(*) FROM optimized_routes);
  RAISE NOTICE '';
  RAISE NOTICE '🚀 系統已就緒！可以開始使用 AI 路線優化功能';
  RAISE NOTICE '';
END $$;

-- 顯示今日任務
SELECT 
  '📦 今日待配送任務' as info,
  task_code as 任務代碼,
  priority as 優先級,
  cargo_weight_kg as 重量kg,
  status as 狀態
FROM delivery_tasks
WHERE task_date = CURRENT_DATE
ORDER BY 
  CASE priority 
    WHEN 'urgent' THEN 1 
    WHEN 'high' THEN 2 
    WHEN 'normal' THEN 3 
    ELSE 4 
  END;

