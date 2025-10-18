-- ========================================
-- AI 藥物管理系統 - 快速設置
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
DECLARE
  v_company_id UUID;
  v_drug1_id UUID;
  v_drug2_id UUID;
  v_drug3_id UUID;
  v_drug4_id UUID;
  v_drug5_id UUID;
  v_prescription1_id UUID;
BEGIN
  SELECT id INTO v_company_id FROM companies WHERE industry = 'healthcare' LIMIT 1;
  
  IF v_company_id IS NULL THEN
    RAISE NOTICE '⚠️ 未找到醫療公司，請先創建醫療公司';
    RETURN;
  END IF;

  RAISE NOTICE '✅ 找到醫療公司: %', v_company_id;

  -- ========================================
  -- 1. 創建藥物
  -- ========================================
  INSERT INTO drugs (
    company_id, drug_code, drug_name, generic_name, drug_category,
    dosage_form, strength, manufacturer, requires_prescription,
    controlled_substance, side_effects, unit_price
  ) VALUES
    (v_company_id, 'DRUG-001', '阿莫西林膠囊', 'Amoxicillin', 'antibiotic',
     'capsule', '500mg', '輝瑞製藥', true, false,
     ARRAY['噁心', '腹瀉', '皮疹'], 15.00),
    
    (v_company_id, 'DRUG-002', '布洛芬錠', 'Ibuprofen', 'painkiller',
     'tablet', '400mg', '拜耳', false, false,
     ARRAY['胃痛', '頭暈', '噁心'], 8.00),
    
    (v_company_id, 'DRUG-003', '普拿疼', 'Acetaminophen', 'painkiller',
     'tablet', '500mg', '嬌生', false, false,
     ARRAY['肝功能異常(過量時)'], 5.00),
    
    (v_company_id, 'DRUG-004', '頭孢菌素', 'Cephalosporin', 'antibiotic',
     'injection', '1g/vial', '默沙東', true, false,
     ARRAY['過敏反應', '腹瀉'], 120.00),
    
    (v_company_id, 'DRUG-005', '可待因止咳糖漿', 'Codeine', 'cough_suppressant',
     'syrup', '15mg/5ml', '諾華', true, true,
     ARRAY['嗜睡', '便秘', '依賴性'], 85.00),
    
    (v_company_id, 'DRUG-006', '胃藥', 'Omeprazole', 'antacid',
     'capsule', '20mg', '阿斯利康', false, false,
     ARRAY['頭痛', '腹痛'], 12.00),
    
    (v_company_id, 'DRUG-007', '降血壓藥', 'Amlodipine', 'antihypertensive',
     'tablet', '5mg', '輝瑞', true, false,
     ARRAY['頭暈', '水腫', '疲勞'], 25.00),
    
    (v_company_id, 'DRUG-008', '降血糖藥', 'Metformin', 'antidiabetic',
     'tablet', '500mg', '默克', true, false,
     ARRAY['腹瀉', '噁心', '維生素B12缺乏'], 18.00)
  ON CONFLICT (drug_code) DO NOTHING;

  SELECT id INTO v_drug1_id FROM drugs WHERE company_id = v_company_id AND drug_code = 'DRUG-001';
  SELECT id INTO v_drug2_id FROM drugs WHERE company_id = v_company_id AND drug_code = 'DRUG-002';
  SELECT id INTO v_drug3_id FROM drugs WHERE company_id = v_company_id AND drug_code = 'DRUG-003';
  SELECT id INTO v_drug4_id FROM drugs WHERE company_id = v_company_id AND drug_code = 'DRUG-004';
  SELECT id INTO v_drug5_id FROM drugs WHERE company_id = v_company_id AND drug_code = 'DRUG-005';

  RAISE NOTICE '✅ 已創建 8 種藥物';

  -- ========================================
  -- 2. 創建藥物庫存
  -- ========================================
  IF v_drug1_id IS NOT NULL THEN
    INSERT INTO drug_inventory (
      company_id, drug_id, batch_number, quantity, expiry_date,
      manufacturing_date, location, min_stock_level
    ) VALUES
      (v_company_id, v_drug1_id, 'BATCH-2024-001', 500, CURRENT_DATE + 180, CURRENT_DATE - 30, '藥房A區', 100),
      (v_company_id, v_drug2_id, 'BATCH-2024-002', 300, CURRENT_DATE + 365, CURRENT_DATE - 20, '藥房B區', 50),
      (v_company_id, v_drug3_id, 'BATCH-2024-003', 800, CURRENT_DATE + 270, CURRENT_DATE - 15, '藥房B區', 150),
      (v_company_id, v_drug4_id, 'BATCH-2024-004', 50, CURRENT_DATE + 90, CURRENT_DATE - 10, '冷藏區', 20),
      (v_company_id, v_drug5_id, 'BATCH-2024-005', 15, CURRENT_DATE + 180, CURRENT_DATE - 25, '管制藥品區', 20)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ 已創建藥物庫存';
  END IF;

  -- ========================================
  -- 3. 創建處方
  -- ========================================
  IF v_drug1_id IS NOT NULL THEN
    INSERT INTO prescriptions (
      company_id, prescription_number, patient_name, patient_id_number,
      patient_age, patient_weight, patient_allergies, doctor_name,
      doctor_license, diagnosis, status
    ) VALUES
      (v_company_id, 'RX-2024-001', '王小明', 'A123456789', 
       35, 70.5, ARRAY['青黴素'], '李醫師', 'DOC-12345',
       '上呼吸道感染', 'pending'),
      
      (v_company_id, 'RX-2024-002', '張美華', 'B987654321',
       68, 55.0, NULL, '陳醫師', 'DOC-67890',
       '高血壓', 'pending'),
      
      (v_company_id, 'RX-2024-003', '李小華', 'C246813579',
       8, 25.0, ARRAY['阿司匹林'], '林醫師', 'DOC-11111',
       '感冒', 'dispensed')
    ON CONFLICT (prescription_number) DO NOTHING;

    -- 獲取第一個處方的 ID
    SELECT id INTO v_prescription1_id FROM prescriptions WHERE company_id = v_company_id AND prescription_number = 'RX-2024-001';

    RAISE NOTICE '✅ 已創建處方';
  END IF;

  -- ========================================
  -- 4. 創建處方明細
  -- ========================================
  IF v_prescription1_id IS NOT NULL AND v_drug1_id IS NOT NULL THEN
    INSERT INTO prescription_items (
      prescription_id, drug_id, quantity, dosage, frequency, duration_days, instructions
    ) VALUES
      (v_prescription1_id, v_drug1_id, 21, '1粒', '每日3次', 7, '飯後服用'),
      (v_prescription1_id, v_drug2_id, 14, '1粒', '每日2次', 7, '飯後服用，需要時服用')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ 已創建處方明細';
  END IF;

  -- ========================================
  -- 5. 創建使用統計
  -- ========================================
  INSERT INTO drug_usage_metrics (
    company_id, metric_date, total_prescriptions, total_dispensed,
    ai_warnings_generated, critical_alerts, average_processing_time
  ) VALUES
    (v_company_id, CURRENT_DATE - 1, 45, 42, 8, 2, 15),
    (v_company_id, CURRENT_DATE, 3, 1, 0, 0, 12)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ 已創建使用統計';

END $$;

-- ========================================
-- 顯示摘要
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ AI 藥物管理系統設置完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 數據摘要:';
  RAISE NOTICE '  • 藥物: %', (SELECT COUNT(*) FROM drugs);
  RAISE NOTICE '  • 庫存記錄: %', (SELECT COUNT(*) FROM drug_inventory);
  RAISE NOTICE '  • 處方: %', (SELECT COUNT(*) FROM prescriptions);
  RAISE NOTICE '';
  RAISE NOTICE '🚀 系統已就緒！可以開始使用 AI 藥物管理功能';
  RAISE NOTICE '';
END $$;

-- 顯示待配藥處方
SELECT 
  '💊 待配藥處方' as info,
  prescription_number as 處方號,
  patient_name as 患者姓名,
  doctor_name as 醫師,
  prescription_date::date as 開立日期,
  status as 狀態,
  ai_checked as AI已檢查
FROM prescriptions
WHERE status = 'pending'
ORDER BY prescription_date DESC;

