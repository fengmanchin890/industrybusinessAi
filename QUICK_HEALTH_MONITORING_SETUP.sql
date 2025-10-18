-- ========================================
-- AI 健康監測系統 - 快速設置腳本
-- ========================================
-- 執行前請確保已執行 migration:
-- supabase/migrations/20251018260000_add_health_monitoring_tables.sql
-- ========================================

DO $$
DECLARE
  v_company_id UUID;
  v_patient1_id UUID;
  v_patient2_id UUID;
  v_patient3_id UUID;
  v_vital1_id UUID;
BEGIN
  -- ========================================
  -- 1. 獲取或創建公司
  -- ========================================
  SELECT id INTO v_company_id FROM companies WHERE name = 'fenghopital company' LIMIT 1;
  
  IF v_company_id IS NULL THEN
    INSERT INTO companies (name, industry, subscription_tier, max_users)
    VALUES ('fenghopital company', 'healthcare', 'enterprise', 100)
    RETURNING id INTO v_company_id;
    RAISE NOTICE '✅ 已創建公司: fenghopital company';
  ELSE
    RAISE NOTICE '✅ 使用現有公司: fenghopital company';
  END IF;

  -- ========================================
  -- 2. 創建患者
  -- ========================================
  INSERT INTO patients (
    company_id, patient_code, patient_name, id_number, date_of_birth,
    gender, blood_type, height_cm, weight_kg, phone, email,
    emergency_contact, emergency_phone, medical_history, chronic_conditions,
    allergies, status
  ) VALUES
    (v_company_id, 'P2024001', '張大明', 'A123456789', '1965-03-15',
     'male', 'A+', 170.0, 75.5, '0912-345-678', 'zhang@example.com',
     '張太太', '0912-111-222', ARRAY['高血壓病史5年'], ARRAY['高血壓', '糖尿病'],
     ARRAY['青黴素'], 'active'),
    
    (v_company_id, 'P2024002', '李小華', 'B987654321', '1978-07-22',
     'female', 'B+', 160.0, 58.0, '0923-456-789', 'li@example.com',
     '李先生', '0923-222-333', ARRAY['心臟病史3年'], ARRAY['心臟病'],
     NULL, 'active'),
    
    (v_company_id, 'P2024003', '王美玲', 'C246813579', '1990-11-08',
     'female', 'O+', 165.0, 62.0, '0934-567-890', 'wang@example.com',
     '王爸爸', '0934-333-444', NULL, NULL,
     ARRAY['阿司匹林', '海鮮'], 'active')
  ON CONFLICT (patient_code) DO NOTHING;

  -- 獲取患者 ID
  SELECT id INTO v_patient1_id FROM patients WHERE company_id = v_company_id AND patient_code = 'P2024001';
  SELECT id INTO v_patient2_id FROM patients WHERE company_id = v_company_id AND patient_code = 'P2024002';
  SELECT id INTO v_patient3_id FROM patients WHERE company_id = v_company_id AND patient_code = 'P2024003';

  RAISE NOTICE '✅ 已創建 3 位患者';

  -- ========================================
  -- 3. 創建生命體征記錄
  -- ========================================
  IF v_patient1_id IS NOT NULL THEN
    -- 張大明的記錄（高血壓患者）
    INSERT INTO vital_signs (
      company_id, patient_id, measurement_time, systolic_bp, diastolic_bp,
      heart_rate, temperature, oxygen_saturation, blood_glucose, measured_by, location
    ) VALUES
      (v_company_id, v_patient1_id, NOW() - INTERVAL '1 hour', 145, 95,
       82, 36.6, 97, 145.0, '護理師-王小美', 'clinic'),
      (v_company_id, v_patient1_id, NOW() - INTERVAL '1 day', 150, 98,
       85, 36.8, 96, 152.0, '護理師-王小美', 'clinic'),
      (v_company_id, v_patient1_id, NOW() - INTERVAL '2 day', 142, 92,
       78, 36.5, 98, 138.0, '自行測量', 'home');
    
    -- 李小華的記錄（心臟病患者）
    IF v_patient2_id IS NOT NULL THEN
      INSERT INTO vital_signs (
        company_id, patient_id, measurement_time, systolic_bp, diastolic_bp,
        heart_rate, temperature, oxygen_saturation, weight_kg, measured_by, location
      ) VALUES
        (v_company_id, v_patient2_id, NOW() - INTERVAL '30 minutes', 125, 80,
         95, 36.7, 94, 58.2, '護理師-李大華', 'clinic'),
        (v_company_id, v_patient2_id, NOW() - INTERVAL '1 day', 128, 82,
         98, 36.6, 93, 58.0, '自行測量', 'home');
    END IF;
    
    -- 王美玲的記錄（健康患者）
    IF v_patient3_id IS NOT NULL THEN
      INSERT INTO vital_signs (
        company_id, patient_id, measurement_time, systolic_bp, diastolic_bp,
        heart_rate, temperature, oxygen_saturation, weight_kg, measured_by, location
      ) VALUES
        (v_company_id, v_patient3_id, NOW() - INTERVAL '2 hours', 115, 75,
         72, 36.5, 99, 62.5, '護理師-王小美', 'clinic'),
        (v_company_id, v_patient3_id, NOW() - INTERVAL '1 week', 118, 76,
         70, 36.4, 98, 62.0, '自行測量', 'home');
    END IF;

    RAISE NOTICE '✅ 已創建生命體征記錄';
  END IF;

  -- ========================================
  -- 4. 創建健康警報
  -- ========================================
  IF v_patient1_id IS NOT NULL THEN
    INSERT INTO health_alerts (
      company_id, patient_id, alert_type, severity, title, description,
      measurement_value, normal_range, recommendation, status
    ) VALUES
      (v_company_id, v_patient1_id, 'bp_high', 'warning', '血壓偏高',
       '收縮壓 145/95 mmHg 高於正常範圍', '145/95', '90-120 / 60-80 mmHg',
       '建議休息後再次測量，如持續偏高請諮詢醫師', 'active'),
      
      (v_company_id, v_patient1_id, 'glucose_high', 'warning', '血糖偏高',
       '血糖 145 mg/dL 略高於正常範圍', '145', '70-140 mg/dL',
       '注意飲食控制，定期監測血糖', 'active');
    
    IF v_patient2_id IS NOT NULL THEN
      INSERT INTO health_alerts (
        company_id, patient_id, alert_type, severity, title, description,
        measurement_value, normal_range, recommendation, status
      ) VALUES
        (v_company_id, v_patient2_id, 'hr_high', 'warning', '心率偏快',
         '心率 95 bpm 略高於正常範圍', '95', '60-100 bpm',
         '建議休息並監測，如持續偏快請就醫', 'active'),
        
        (v_company_id, v_patient2_id, 'spo2_low', 'warning', '血氧偏低',
         '血氧 94% 略低於正常範圍', '94%', '95-100%',
         '注意呼吸狀況，如持續偏低請就醫', 'active');
    END IF;

    RAISE NOTICE '✅ 已創建健康警報';
  END IF;

  -- ========================================
  -- 5. 創建健康指標
  -- ========================================
  IF v_patient1_id IS NOT NULL THEN
    INSERT INTO health_metrics (
      company_id, patient_id, metric_date, bmi, bmi_category,
      avg_systolic_bp, avg_diastolic_bp, avg_heart_rate, avg_blood_glucose,
      health_score, risk_level, ai_analysis
    ) VALUES
      (v_company_id, v_patient1_id, CURRENT_DATE, 26.1, 'overweight',
       146, 95, 82, 145.0, 72, 'moderate',
       jsonb_build_object(
         'insights', '血壓和血糖略高，建議控制飲食和適度運動',
         'recommendations', jsonb_build_array('減少鹽分攝取', '定期監測血糖', '保持適度運動')
       ));
    
    IF v_patient2_id IS NOT NULL THEN
      INSERT INTO health_metrics (
        company_id, patient_id, metric_date, bmi, bmi_category,
        avg_systolic_bp, avg_diastolic_bp, avg_heart_rate, health_score, risk_level, ai_analysis
      ) VALUES
        (v_company_id, v_patient2_id, CURRENT_DATE, 22.7, 'normal',
         127, 81, 97, 75, 'moderate',
         jsonb_build_object(
           'insights', '心率略快，注意心臟狀況',
           'recommendations', jsonb_build_array('定期回診', '避免劇烈運動', '保持充足睡眠')
         ));
    END IF;
    
    IF v_patient3_id IS NOT NULL THEN
      INSERT INTO health_metrics (
        company_id, patient_id, metric_date, bmi, bmi_category,
        avg_systolic_bp, avg_diastolic_bp, avg_heart_rate, health_score, risk_level, ai_analysis
      ) VALUES
        (v_company_id, v_patient3_id, CURRENT_DATE, 22.8, 'normal',
         117, 76, 71, 95, 'low',
         jsonb_build_object(
           'insights', '各項指標正常，健康狀況良好',
           'recommendations', jsonb_build_array('保持良好生活習慣', '定期健康檢查')
         ));
    END IF;

    RAISE NOTICE '✅ 已創建健康指標';
  END IF;

  -- ========================================
  -- 6. 創建監測計劃
  -- ========================================
  IF v_patient1_id IS NOT NULL THEN
    INSERT INTO monitoring_plans (
      company_id, patient_id, plan_name, monitoring_frequency, start_date, end_date,
      target_metrics, target_values, doctor_name, notes, status
    ) VALUES
      (v_company_id, v_patient1_id, '高血壓糖尿病監測計劃', 'daily', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months',
       ARRAY['bp', 'glucose', 'weight'], 
       jsonb_build_object('target_bp', '120/80', 'target_glucose', '<140', 'target_weight', '72kg'),
       '李醫師', '每日早晚各測量一次血壓和血糖', 'active'),
      
      (v_company_id, v_patient2_id, '心臟病監測計劃', 'twice_daily', CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months',
       ARRAY['bp', 'hr', 'spo2'],
       jsonb_build_object('target_bp', '<130/85', 'target_hr', '60-90', 'target_spo2', '>95%'),
       '陳醫師', '早晚測量血壓和心率，注意胸悶症狀', 'active');

    RAISE NOTICE '✅ 已創建監測計劃';
  END IF;

  -- ========================================
  -- 完成
  -- ========================================
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ AI 健康監測系統設置完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '數據摘要:';
  RAISE NOTICE '  患者: %', (SELECT COUNT(*) FROM patients WHERE company_id = v_company_id);
  RAISE NOTICE '  生命體征記錄: %', (SELECT COUNT(*) FROM vital_signs WHERE company_id = v_company_id);
  RAISE NOTICE '  健康警報: %', (SELECT COUNT(*) FROM health_alerts WHERE company_id = v_company_id);
  RAISE NOTICE '  監測計劃: %', (SELECT COUNT(*) FROM monitoring_plans WHERE company_id = v_company_id);
  RAISE NOTICE '';
  RAISE NOTICE '系統已就緒!可以開始使用 AI 健康監測功能';
  RAISE NOTICE '';

END $$;

-- 顯示患者摘要
SELECT 
  '患者摘要' AS info,
  patient_code AS 患者編號,
  patient_name AS 患者姓名,
  gender AS 性別,
  chronic_conditions AS 慢性病,
  status AS 狀態
FROM patients
WHERE company_id IN (SELECT id FROM companies WHERE name = 'fenghopital company')
ORDER BY patient_code;

-- 顯示活躍警報
SELECT 
  '活躍警報' AS info,
  p.patient_name AS 患者,
  ha.title AS 警報標題,
  ha.severity AS 嚴重程度,
  ha.description AS 描述,
  ha.created_at::date AS 建立日期
FROM health_alerts ha
JOIN patients p ON ha.patient_id = p.id
WHERE ha.company_id IN (SELECT id FROM companies WHERE name = 'fenghopital company')
  AND ha.status = 'active'
ORDER BY ha.severity DESC, ha.created_at DESC;

