-- ========================================
-- AI 護理排班系統 - 快速設置
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
DECLARE
    v_company_id UUID;
  v_staff1_id UUID;
  v_staff2_id UUID;
  v_staff3_id UUID;
  v_staff4_id UUID;
  v_staff5_id UUID;
  v_staff6_id UUID;
  v_shift1_id UUID;
  v_shift2_id UUID;
  v_shift3_id UUID;
  v_shift4_id UUID;
BEGIN
  SELECT id INTO v_company_id FROM companies WHERE industry = 'healthcare' LIMIT 1;
    
    IF v_company_id IS NULL THEN
    RAISE NOTICE '⚠️ 未找到醫療公司，請先創建醫療公司';
    RETURN;
    END IF;

  RAISE NOTICE '✅ 找到醫療公司: %', v_company_id;

  -- ========================================
  -- 1. 創建護理人員
  -- ========================================
  INSERT INTO nursing_staff (
    company_id, staff_code, name, position, employment_type,
    skills, certifications, max_hours_per_week, preferences, status,
    years_experience, hire_date
    ) VALUES
    (v_company_id, 'NURSE-001', '陳美玲', '資深護理師', 'full_time',
     ARRAY['急診', '內科', 'ICU'], ARRAY['RN', 'ACLS', 'PALS'],
     40, ARRAY['日班'], 'available', 12, '2012-03-15'),
    
    (v_company_id, 'NURSE-002', '林志明', '護理師', 'full_time',
     ARRAY['外科', '骨科'], ARRAY['RN', 'BLS'],
     40, ARRAY['夜班'], 'available', 5, '2019-08-20'),
    
    (v_company_id, 'NURSE-003', '王淑芬', '護理師', 'full_time',
     ARRAY['兒科', '婦產科'], ARRAY['RN', 'PALS'],
     36, ARRAY['日班', '小夜班'], 'available', 8, '2016-05-10'),
    
    (v_company_id, 'NURSE-004', '張國華', '資深護理師', 'full_time',
     ARRAY['ICU', '急診', '心臟內科'], ARRAY['RN', 'ACLS', 'CCRN'],
     40, ARRAY['小夜班', '夜班'], 'busy', 15, '2009-01-05'),
    
    (v_company_id, 'NURSE-005', '李雅婷', '護理師', 'full_time',
     ARRAY['內科', '神經內科'], ARRAY['RN', 'BLS'],
     40, ARRAY['日班'], 'available', 4, '2020-09-01'),
    
    (v_company_id, 'NURSE-006', '黃建國', '護理長', 'full_time',
     ARRAY['急診', '外科', 'ICU', '管理'], ARRAY['RN', 'ACLS', 'NP'],
     40, ARRAY['日班'], 'available', 20, '2004-06-01'),
    
    (v_company_id, 'NURSE-007', '劉小芳', '護理師', 'part_time',
     ARRAY['內科', '一般護理'], ARRAY['RN'],
     20, ARRAY['小夜班'], 'available', 3, '2021-03-15'),
    
    (v_company_id, 'NURSE-008', '吳文雄', '護理師', 'full_time',
     ARRAY['急診', '外科'], ARRAY['RN', 'ACLS'],
     40, ARRAY['夜班'], 'available', 6, '2018-11-20')
  ON CONFLICT (staff_code) DO NOTHING;

  -- 獲取護理人員 ID
  SELECT id INTO v_staff1_id FROM nursing_staff WHERE company_id = v_company_id AND staff_code = 'NURSE-001';
  SELECT id INTO v_staff2_id FROM nursing_staff WHERE company_id = v_company_id AND staff_code = 'NURSE-002';
  SELECT id INTO v_staff3_id FROM nursing_staff WHERE company_id = v_company_id AND staff_code = 'NURSE-003';
  SELECT id INTO v_staff4_id FROM nursing_staff WHERE company_id = v_company_id AND staff_code = 'NURSE-004';
  SELECT id INTO v_staff5_id FROM nursing_staff WHERE company_id = v_company_id AND staff_code = 'NURSE-005';
  SELECT id INTO v_staff6_id FROM nursing_staff WHERE company_id = v_company_id AND staff_code = 'NURSE-006';

  RAISE NOTICE '✅ 已創建 8 位護理人員';

  -- ========================================
  -- 2. 創建班次
  -- ========================================
  INSERT INTO nursing_shifts (
    company_id, shift_code, shift_date, shift_time, start_time, end_time,
    duration_hours, department, ward_location, required_skills,
    min_staff_required, max_staff_allowed, priority_level, status
  ) VALUES
    -- 今日班次
    (v_company_id, 'SHIFT-TODAY-001', CURRENT_DATE, '08:00-16:00', '08:00', '16:00',
     8, '內科', '3A病房', ARRAY['內科'], 2, 4, 'normal', 'scheduled'),
    
    (v_company_id, 'SHIFT-TODAY-002', CURRENT_DATE, '16:00-24:00', '16:00', '24:00',
     8, '外科', '2B病房', ARRAY['外科'], 2, 3, 'normal', 'scheduled'),
    
    (v_company_id, 'SHIFT-TODAY-003', CURRENT_DATE, '00:00-08:00', '00:00', '08:00',
     8, 'ICU', 'ICU病房', ARRAY['ICU'], 1, 2, 'high', 'pending'),
    
    -- 明日班次
    (v_company_id, 'SHIFT-TOMORROW-001', CURRENT_DATE + 1, '08:00-16:00', '08:00', '16:00',
     8, '急診', '急診室', ARRAY['急診'], 2, 4, 'critical', 'pending'),
    
    (v_company_id, 'SHIFT-TOMORROW-002', CURRENT_DATE + 1, '16:00-24:00', '16:00', '24:00',
     8, '兒科', '兒科病房', ARRAY['兒科'], 1, 3, 'normal', 'pending'),
    
    (v_company_id, 'SHIFT-TOMORROW-003', CURRENT_DATE + 1, '00:00-08:00', '00:00', '08:00',
     8, '急診', '急診室', ARRAY['急診'], 2, 3, 'critical', 'pending'),
    
    -- 後天班次
    (v_company_id, 'SHIFT-DAY3-001', CURRENT_DATE + 2, '08:00-16:00', '08:00', '16:00',
     8, '外科', '2B病房', ARRAY['外科'], 2, 4, 'normal', 'pending'),
    
    (v_company_id, 'SHIFT-DAY3-002', CURRENT_DATE + 2, '16:00-24:00', '16:00', '24:00',
     8, 'ICU', 'ICU病房', ARRAY['ICU'], 2, 3, 'high', 'pending')
  ON CONFLICT (company_id, shift_code, shift_date) DO NOTHING;

  -- 獲取班次 ID
  SELECT id INTO v_shift1_id FROM nursing_shifts WHERE company_id = v_company_id AND shift_code = 'SHIFT-TODAY-001';
  SELECT id INTO v_shift2_id FROM nursing_shifts WHERE company_id = v_company_id AND shift_code = 'SHIFT-TODAY-002';

  RAISE NOTICE '✅ 已創建 8 個班次';

  -- ========================================
  -- 3. 創建排班分配（今日已排班）
  -- ========================================
  IF v_shift1_id IS NOT NULL AND v_staff1_id IS NOT NULL THEN
    INSERT INTO shift_assignments (
      company_id, shift_id, staff_id, assignment_status, assigned_at
    ) VALUES
      (v_company_id, v_shift1_id, v_staff1_id, 'confirmed', NOW()),
      (v_company_id, v_shift1_id, v_staff3_id, 'confirmed', NOW()),
      (v_company_id, v_shift1_id, v_staff5_id, 'confirmed', NOW())
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ 已分配第一班次的護理人員';
  END IF;

  IF v_shift2_id IS NOT NULL AND v_staff2_id IS NOT NULL THEN
    INSERT INTO shift_assignments (
      company_id, shift_id, staff_id, assignment_status, assigned_at
    ) VALUES
      (v_company_id, v_shift2_id, v_staff2_id, 'confirmed', NOW()),
      (v_company_id, v_shift2_id, v_staff4_id, 'confirmed', NOW())
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ 已分配第二班次的護理人員';
  END IF;

  -- ========================================
  -- 4. 創建工時記錄
  -- ========================================
  INSERT INTO staff_work_hours (
    company_id, staff_id, week_start_date, week_end_date,
    total_hours, regular_hours, overtime_hours, total_shifts
  )
  SELECT 
    v_company_id,
    id,
    date_trunc('week', CURRENT_DATE)::DATE,
    date_trunc('week', CURRENT_DATE)::DATE + 6,
    16, 16, 0, 2
  FROM nursing_staff
  WHERE company_id = v_company_id AND staff_code IN ('NURSE-001', 'NURSE-002', 'NURSE-003', 'NURSE-004', 'NURSE-005')
  ON CONFLICT (staff_id, week_start_date) DO NOTHING;

  RAISE NOTICE '✅ 已創建工時記錄';

  -- ========================================
  -- 5. 創建統計數據
  -- ========================================
  INSERT INTO nursing_schedule_metrics (
    company_id, metric_date, total_staff, available_staff,
    total_shifts, scheduled_shifts, pending_shifts,
    coverage_rate, average_workload_hours, satisfaction_rate,
    ai_optimizations_run, conflicts_detected, conflicts_resolved
    ) VALUES
    (v_company_id, CURRENT_DATE - 1, 8, 7, 8, 8, 0, 100.00, 32.5, 95.0, 2, 1, 1),
    (v_company_id, CURRENT_DATE, 8, 7, 8, 2, 6, 25.00, 16.0, 92.0, 0, 0, 0)
    ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ 已創建統計數據';

  -- ========================================
  -- 6. 創建排班衝突範例（已解決）
  -- ========================================
  INSERT INTO schedule_conflicts (
    company_id, conflict_type, severity, description,
    resolution_status, resolved_at, resolution_notes
    ) VALUES
    (v_company_id, 'understaffed', 'high', 'ICU 夜班缺乏護理人員',
     'resolved', NOW() - interval '1 day', '調整班表，增加人員配置'),
    
    (v_company_id, 'skill_mismatch', 'moderate', '急診班次缺乏急診專業護理師',
     'resolved', NOW() - interval '2 days', '重新分配具備急診技能的護理師')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ 已創建衝突記錄';

END $$;

-- ========================================
-- 顯示摘要
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
  RAISE NOTICE '✅ AI 護理排班系統設置完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
  RAISE NOTICE '📊 數據摘要:';
  RAISE NOTICE '  • 護理人員: %', (SELECT COUNT(*) FROM nursing_staff);
  RAISE NOTICE '  • 班次: %', (SELECT COUNT(*) FROM nursing_shifts);
  RAISE NOTICE '  • 排班分配: %', (SELECT COUNT(*) FROM shift_assignments);
  RAISE NOTICE '  • 待排班次: %', (SELECT COUNT(*) FROM nursing_shifts WHERE status = 'pending');
  RAISE NOTICE '';
  RAISE NOTICE '🚀 系統已就緒！可以開始使用 AI 護理排班功能';
    RAISE NOTICE '';
  RAISE NOTICE '💡 提示：';
  RAISE NOTICE '  1. 使用 fenghospital 帳戶登入';
  RAISE NOTICE '  2. 進入「AI 護理排班」模組';
  RAISE NOTICE '  3. 點擊「AI 優化排班」自動分配待排班次';
    RAISE NOTICE '';
END $$;

-- 顯示護理人員列表
SELECT 
  '👥 護理人員' as info,
  staff_code as 編號,
  name as 姓名,
  position as 職位,
  array_to_string(skills, ', ') as 專業技能,
  max_hours_per_week as 最大工時,
  array_to_string(preferences, ', ') as 班別偏好,
  status as 狀態,
  years_experience as 年資
FROM nursing_staff
ORDER BY position DESC, years_experience DESC;

-- 顯示待排班次
SELECT 
  '📅 待排班次' as info,
  shift_code as 班次編號,
  shift_date as 日期,
  shift_time as 時段,
  department as 科別,
  array_to_string(required_skills, ', ') as 所需技能,
  min_staff_required as 最少人數,
  priority_level as 優先級,
  status as 狀態
FROM nursing_shifts
WHERE status = 'pending'
ORDER BY shift_date, start_time;

-- 顯示已排班次
SELECT 
  '✅ 已排班次' as info,
  ns.shift_date as 日期,
  ns.shift_time as 時段,
  ns.department as 科別,
  string_agg(nst.name, ', ') as 值班人員,
  ns.status as 狀態
FROM nursing_shifts ns
LEFT JOIN shift_assignments sa ON ns.id = sa.shift_id
LEFT JOIN nursing_staff nst ON sa.staff_id = nst.id
WHERE ns.status = 'scheduled'
GROUP BY ns.id, ns.shift_date, ns.shift_time, ns.department, ns.status
ORDER BY ns.shift_date, ns.start_time;
