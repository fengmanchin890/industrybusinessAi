-- ========================================
-- AI 倉儲排班系統 - 快速設置
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
DECLARE
  v_company_id UUID;
  v_emp1_id UUID;
  v_emp2_id UUID;
  v_emp3_id UUID;
  v_emp4_id UUID;
  v_emp5_id UUID;
  v_zone1_id UUID;
  v_zone2_id UUID;
  v_shift1_id UUID;
  v_shift2_id UUID;
BEGIN
  -- 尋找或創建物流公司
  SELECT id INTO v_company_id FROM companies WHERE industry = 'logistics' LIMIT 1;
  
  IF v_company_id IS NULL THEN
    RAISE NOTICE '⚠️ 未找到物流公司，請先創建物流公司';
    RETURN;
  END IF;

  RAISE NOTICE '✅ 找到物流公司: %', v_company_id;

  -- ========================================
  -- 1. 創建倉儲區域
  -- ========================================
  INSERT INTO warehouse_zones (company_id, zone_code, zone_name, zone_type, required_staff_count, area_sqm)
  VALUES
    (v_company_id, 'ZONE-A', '收貨區', 'receiving', 3, 500.00),
    (v_company_id, 'ZONE-B', '儲存區', 'storage', 4, 2000.00),
    (v_company_id, 'ZONE-C', '揀貨區', 'picking', 5, 1000.00),
    (v_company_id, 'ZONE-D', '包裝區', 'packing', 3, 300.00),
    (v_company_id, 'ZONE-E', '出貨區', 'shipping', 2, 400.00)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_zone1_id FROM warehouse_zones WHERE company_id = v_company_id AND zone_code = 'ZONE-A';
  SELECT id INTO v_zone2_id FROM warehouse_zones WHERE company_id = v_company_id AND zone_code = 'ZONE-C';

  RAISE NOTICE '✅ 已創建 5 個倉儲區域';

  -- ========================================
  -- 2. 創建班次模板
  -- ========================================
  INSERT INTO shift_templates (company_id, shift_name, shift_type, start_time, end_time, break_minutes, hourly_multiplier)
  VALUES
    (v_company_id, '早班', 'morning', '08:00', '16:00', 60, 1.0),
    (v_company_id, '午班', 'afternoon', '16:00', '00:00', 60, 1.2),
    (v_company_id, '夜班', 'night', '00:00', '08:00', 60, 1.5)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_shift1_id FROM shift_templates WHERE company_id = v_company_id AND shift_type = 'morning';
  SELECT id INTO v_shift2_id FROM shift_templates WHERE company_id = v_company_id AND shift_type = 'afternoon';

  RAISE NOTICE '✅ 已創建 3 個班次模板';

  -- ========================================
  -- 3. 創建員工
  -- ========================================
  INSERT INTO warehouse_employees (
    company_id, employee_code, name, phone, position, skill_level, 
    hourly_rate, max_hours_per_week, preferred_shifts, availability_days, hire_date
  ) VALUES
    (v_company_id, 'EMP-001', '張明華', '0912-345-678', 'forklift_driver', 4, 250.00, 
     40, ARRAY['morning', 'afternoon'], ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], '2023-01-15'),
    (v_company_id, 'EMP-002', '李美玲', '0923-456-789', 'picker', 5, 220.00, 
     40, ARRAY['morning'], ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'], '2022-06-20'),
    (v_company_id, 'EMP-003', '王志強', '0934-567-890', 'packer', 3, 200.00, 
     40, ARRAY['afternoon', 'night'], ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], '2023-03-10'),
    (v_company_id, 'EMP-004', '陳雅婷', '0945-678-901', 'picker', 4, 230.00, 
     35, ARRAY['morning', 'afternoon'], ARRAY['tuesday', 'wednesday', 'thursday', 'friday', 'saturday'], '2022-11-05'),
    (v_company_id, 'EMP-005', '林建國', '0956-789-012', 'supervisor', 5, 300.00, 
     40, ARRAY['morning'], ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], '2021-08-01'),
    (v_company_id, 'EMP-006', '黃淑芬', '0967-890-123', 'packer', 3, 210.00, 
     40, ARRAY['afternoon'], ARRAY['monday', 'wednesday', 'friday', 'saturday', 'sunday'], '2023-05-12'),
    (v_company_id, 'EMP-007', '劉俊傑', '0978-901-234', 'forklift_driver', 3, 240.00, 
     40, ARRAY['night'], ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], '2023-02-20'),
    (v_company_id, 'EMP-008', '吳佩珊', '0989-012-345', 'picker', 4, 225.00, 
     38, ARRAY['morning'], ARRAY['monday', 'tuesday', 'thursday', 'friday', 'saturday'], '2022-09-15')
  ON CONFLICT (employee_code) DO NOTHING;

  -- 獲取員工 ID
  SELECT id INTO v_emp1_id FROM warehouse_employees WHERE company_id = v_company_id AND employee_code = 'EMP-001';
  SELECT id INTO v_emp2_id FROM warehouse_employees WHERE company_id = v_company_id AND employee_code = 'EMP-002';
  SELECT id INTO v_emp3_id FROM warehouse_employees WHERE company_id = v_company_id AND employee_code = 'EMP-003';
  SELECT id INTO v_emp4_id FROM warehouse_employees WHERE company_id = v_company_id AND employee_code = 'EMP-004';
  SELECT id INTO v_emp5_id FROM warehouse_employees WHERE company_id = v_company_id AND employee_code = 'EMP-005';

  RAISE NOTICE '✅ 已創建 8 名員工';

  -- ========================================
  -- 4. 創建排班記錄（本週）
  -- ========================================
  IF v_emp1_id IS NOT NULL AND v_zone1_id IS NOT NULL THEN
    INSERT INTO work_schedules (
      company_id, employee_id, shift_template_id, zone_id, schedule_date,
      start_time, end_time, status, ai_optimized, ai_confidence_score
    ) VALUES
      -- 今天
      (v_company_id, v_emp1_id, v_shift1_id, v_zone1_id, CURRENT_DATE, 
       '08:00', '16:00', 'confirmed', true, 92.5),
      (v_company_id, v_emp2_id, v_shift1_id, v_zone2_id, CURRENT_DATE, 
       '08:00', '16:00', 'confirmed', true, 88.0),
      (v_company_id, v_emp3_id, v_shift2_id, v_zone1_id, CURRENT_DATE, 
       '16:00', '00:00', 'scheduled', true, 85.0),
      
      -- 明天
      (v_company_id, v_emp1_id, v_shift1_id, v_zone1_id, CURRENT_DATE + 1, 
       '08:00', '16:00', 'scheduled', true, 90.0),
      (v_company_id, v_emp4_id, v_shift1_id, v_zone2_id, CURRENT_DATE + 1, 
       '08:00', '16:00', 'scheduled', true, 87.5),
      (v_company_id, v_emp5_id, v_shift1_id, v_zone2_id, CURRENT_DATE + 1, 
       '08:00', '16:00', 'scheduled', true, 95.0),
      
      -- 後天
      (v_company_id, v_emp2_id, v_shift1_id, v_zone2_id, CURRENT_DATE + 2, 
       '08:00', '16:00', 'scheduled', false, NULL),
      (v_company_id, v_emp3_id, v_shift2_id, v_zone1_id, CURRENT_DATE + 2, 
       '16:00', '00:00', 'scheduled', false, NULL)
    ON CONFLICT (employee_id, schedule_date, start_time) DO NOTHING;

    RAISE NOTICE '✅ 已創建 8 筆排班記錄';
  END IF;

  -- ========================================
  -- 5. 創建工作負載預測
  -- ========================================
  INSERT INTO workload_forecasts (
    company_id, forecast_date, shift_type, zone_id, 
    predicted_volume, predicted_staff_needed, confidence_level
  ) VALUES
    (v_company_id, CURRENT_DATE, 'morning', v_zone1_id, 1200, 5, 85.0),
    (v_company_id, CURRENT_DATE, 'afternoon', v_zone1_id, 800, 3, 82.0),
    (v_company_id, CURRENT_DATE + 1, 'morning', v_zone2_id, 1500, 6, 88.0),
    (v_company_id, CURRENT_DATE + 2, 'morning', v_zone2_id, 1000, 4, 80.0)
  ON CONFLICT (company_id, forecast_date, shift_type, zone_id) DO NOTHING;

  RAISE NOTICE '✅ 已創建工作負載預測';

  -- ========================================
  -- 6. 創建排班指標
  -- ========================================
  INSERT INTO scheduling_metrics (
    company_id, metric_date, total_shifts, filled_shifts, unfilled_shifts,
    overtime_hours, labor_cost, efficiency_score, employee_satisfaction_score
  ) VALUES
    (v_company_id, CURRENT_DATE - 1, 12, 11, 1, 2.5, 22000.00, 92.5, 88.0),
    (v_company_id, CURRENT_DATE, 10, 8, 2, 1.0, 19000.00, 85.0, 90.0)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ 已創建排班指標';

END $$;

-- ========================================
-- 顯示摘要
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ AI 倉儲排班系統設置完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 數據摘要:';
  RAISE NOTICE '  • 員工: %', (SELECT COUNT(*) FROM warehouse_employees);
  RAISE NOTICE '  • 倉儲區域: %', (SELECT COUNT(*) FROM warehouse_zones);
  RAISE NOTICE '  • 班次模板: %', (SELECT COUNT(*) FROM shift_templates);
  RAISE NOTICE '  • 排班記錄: %', (SELECT COUNT(*) FROM work_schedules);
  RAISE NOTICE '';
  RAISE NOTICE '🚀 系統已就緒！可以開始使用 AI 排班功能';
  RAISE NOTICE '';
END $$;

-- 顯示本週排班
SELECT 
  '📅 本週排班' as info,
  schedule_date as 日期,
  COUNT(*) as 班次數,
  COUNT(*) FILTER (WHERE status = 'confirmed') as 已確認,
  COUNT(*) FILTER (WHERE ai_optimized = true) as AI優化
FROM work_schedules
WHERE schedule_date >= CURRENT_DATE
  AND schedule_date < CURRENT_DATE + 7
GROUP BY schedule_date
ORDER BY schedule_date;

