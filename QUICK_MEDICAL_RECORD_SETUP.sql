-- ========================================
-- AI 病歷助理系統 - 快速設置腳本
-- ========================================
-- 執行前請確保已執行 migration:
-- supabase/migrations/20251018270000_add_medical_record_tables.sql
-- ========================================

DO $$
DECLARE
  v_company_id UUID;
  v_patient1_id UUID;
  v_patient2_id UUID;
  v_patient3_id UUID;
  v_record1_id UUID;
  v_record2_id UUID;
  v_record3_id UUID;
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
  -- 2. 獲取患者 ID（如果 patients 表存在）
  -- ========================================
  BEGIN
    SELECT id INTO v_patient1_id FROM patients WHERE company_id = v_company_id AND patient_code = 'P2024001' LIMIT 1;
    SELECT id INTO v_patient2_id FROM patients WHERE company_id = v_company_id AND patient_code = 'P2024002' LIMIT 1;
    SELECT id INTO v_patient3_id FROM patients WHERE company_id = v_company_id AND patient_code = 'P2024003' LIMIT 1;
    
    IF v_patient1_id IS NOT NULL THEN
      RAISE NOTICE '✅ 找到現有患者資料';
    END IF;
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE '⚠️  患者表不存在，將使用病歷中的患者資料';
  END;

  -- ========================================
  -- 3. 創建症狀字典
  -- ========================================
  INSERT INTO symptom_dictionary (
    symptom_code, symptom_name_zh, symptom_name_en, category, severity_levels, related_conditions
  ) VALUES
    ('SYM001', '咳嗽', 'Cough', 'respiratory', ARRAY['mild', 'moderate', 'severe'], ARRAY['感冒', '肺炎', '支氣管炎']),
    ('SYM002', '發燒', 'Fever', 'general', ARRAY['mild', 'moderate', 'severe'], ARRAY['感染', '流感']),
    ('SYM003', '頭痛', 'Headache', 'neurological', ARRAY['mild', 'moderate', 'severe'], ARRAY['偏頭痛', '高血壓']),
    ('SYM004', '腹痛', 'Abdominal Pain', 'digestive', ARRAY['mild', 'moderate', 'severe'], ARRAY['胃炎', '闌尾炎']),
    ('SYM005', '胸痛', 'Chest Pain', 'cardiovascular', ARRAY['mild', 'moderate', 'severe'], ARRAY['心絞痛', '肺栓塞']),
    ('SYM006', '呼吸困難', 'Dyspnea', 'respiratory', ARRAY['mild', 'moderate', 'severe'], ARRAY['氣喘', '心臟衰竭']),
    ('SYM007', '噁心', 'Nausea', 'digestive', ARRAY['mild', 'moderate'], ARRAY['胃炎', '懷孕']),
    ('SYM008', '頭暈', 'Dizziness', 'neurological', ARRAY['mild', 'moderate', 'severe'], ARRAY['貧血', '低血壓']),
    ('SYM009', '疲勞', 'Fatigue', 'general', ARRAY['mild', 'moderate', 'severe'], ARRAY['貧血', '甲狀腺疾病']),
    ('SYM010', '喉嚨痛', 'Sore Throat', 'respiratory', ARRAY['mild', 'moderate'], ARRAY['咽炎', '扁桃腺炎'])
  ON CONFLICT (symptom_code) DO NOTHING;

  RAISE NOTICE '✅ 已創建症狀字典';

  -- ========================================
  -- 4. 創建病歷模板
  -- ========================================
  INSERT INTO medical_record_templates (
    company_id, template_name, department, visit_type, template_content, fields, is_default
  ) VALUES
    (v_company_id, '一般門診模板', '內科', 'outpatient', 
     jsonb_build_object(
       'sections', jsonb_build_array('主訴', '現病史', '既往史', '體格檢查', '診斷', '治療計劃')
     ),
     ARRAY['chief_complaint', 'symptoms', 'vital_signs', 'diagnosis'], true),
    
    (v_company_id, '急診模板', '急診科', 'emergency',
     jsonb_build_object(
       'sections', jsonb_build_array('緊急情況', '生命體征', '初步處置', '診斷')
     ),
     ARRAY['chief_complaint', 'vital_signs', 'diagnosis', 'treatment_plan'], false),
    
    (v_company_id, '兒科門診模板', '兒科', 'outpatient',
     jsonb_build_object(
       'sections', jsonb_build_array('主訴', '生長發育', '疫苗接種史', '診斷')
     ),
     ARRAY['chief_complaint', 'patient_age', 'symptoms', 'diagnosis'], false)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ 已創建病歷模板';

  -- ========================================
  -- 5. 創建病歷記錄
  -- ========================================
  -- 病歷 1: 上呼吸道感染
  INSERT INTO medical_records (
    company_id, patient_id, record_number, patient_name, patient_id_number,
    patient_age, patient_gender, patient_blood_type, visit_date, visit_type,
    department, doctor_name, doctor_license, chief_complaint, present_illness,
    past_history, allergy_history, symptoms, vital_signs, physical_examination,
    diagnosis, icd_codes, treatment_plan, medications, follow_up, status
  ) VALUES
    (v_company_id, v_patient1_id, 'MR-2025-001', '張大明', 'A123456789',
     45, 'male', 'A+', NOW() - INTERVAL '2 hours', 'outpatient',
     '內科', '陳醫師', 'DOC-001', '咳嗽、發燒兩天', 
     '患者自述兩天前開始出現咳嗽、發燒症狀，體溫最高達38.5°C，伴有輕微喉嚨痛，無呼吸困難',
     ARRAY['高血壓5年'], ARRAY['青黴素'], 
     ARRAY['咳嗽', '發燒', '喉嚨痛', '輕微頭痛'],
     jsonb_build_object(
       'bloodPressure', '145/90',
       'heartRate', '82',
       'temperature', '38.2',
       'respiratoryRate', '18',
       'oxygenSaturation', '98'
     ),
     '咽部充血，扁桃腺輕度腫大，雙肺呼吸音清晰',
     '急性上呼吸道感染', ARRAY['J06.9'],
     '1. 多休息，多飲水 2. 對症治療 3. 3天後複診',
     jsonb_build_array(
       jsonb_build_object('name', '普拿疼', 'dosage', '500mg', 'frequency', 'Q6H PRN', 'duration', '3天'),
       jsonb_build_object('name', '止咳糖漿', 'dosage', '10ml', 'frequency', 'TID', 'duration', '5天')
     ),
     '如症狀未改善或加重，請及時回診', 'completed'
    )
  RETURNING id INTO v_record1_id;

  -- 病歷 2: 急性胃腸炎
  INSERT INTO medical_records (
    company_id, patient_id, record_number, patient_name, patient_id_number,
    patient_age, patient_gender, visit_date, visit_type, department,
    doctor_name, chief_complaint, present_illness, symptoms, vital_signs,
    physical_examination, diagnosis, icd_codes, treatment_plan, medications,
    follow_up, status
  ) VALUES
    (v_company_id, v_patient2_id, 'MR-2025-002', '李小華', 'B987654321',
     38, 'female', NOW() - INTERVAL '3 hours', 'outpatient', '內科',
     '林醫師', '腹痛、腹瀉一天', 
     '患者昨天晚餐後開始出現腹痛、腹瀉，今日已腹瀉4次，伴有輕微噁心',
     ARRAY['腹痛', '腹瀉', '噁心', '食慾不振'],
     jsonb_build_object(
       'bloodPressure', '118/75',
       'heartRate', '88',
       'temperature', '37.2'
     ),
     '腹部輕壓痛，腸鳴音活躍，無反跳痛',
     '急性胃腸炎', ARRAY['K52.9'],
     '1. 清淡飲食 2. 補充電解質 3. 對症治療',
     jsonb_build_array(
       jsonb_build_object('name', '思密達', 'dosage', '1包', 'frequency', 'TID', 'duration', '3天'),
       jsonb_build_object('name', '益生菌', 'dosage', '2粒', 'frequency', 'BID', 'duration', '7天')
     ),
     '如持續腹瀉或出現脫水症狀請回診', 'completed'
    )
  RETURNING id INTO v_record2_id;

  -- 病歷 3: 高血壓追蹤
  INSERT INTO medical_records (
    company_id, patient_id, record_number, patient_name, patient_age,
    patient_gender, visit_date, visit_type, department, doctor_name,
    chief_complaint, present_illness, past_history, symptoms, vital_signs,
    physical_examination, diagnosis, treatment_plan, medications, follow_up, status
  ) VALUES
    (v_company_id, v_patient3_id, 'MR-2025-003', '王美玲', 62,
     'female', NOW() - INTERVAL '1 day', 'outpatient', '心臟科',
     '陳醫師', '高血壓追蹤', 
     '患者高血壓病史10年，規律服藥，今日返診追蹤',
     ARRAY['高血壓10年', '糖尿病5年'], 
     ARRAY['偶爾頭暈'],
     jsonb_build_object(
       'bloodPressure', '138/85',
       'heartRate', '72',
       'weight', '65'
     ),
     '心律整齊，雙肺呼吸音清晰',
     '原發性高血壓',
     '1. 繼續目前藥物治療 2. 低鹽飲食 3. 適度運動 4. 3個月後追蹤',
     jsonb_build_array(
       jsonb_build_object('name', '脈優', 'dosage', '5mg', 'frequency', 'QD', 'duration', '3個月'),
       jsonb_build_object('name', '利壓', 'dosage', '25mg', 'frequency', 'QD', 'duration', '3個月')
     ),
     '3個月後追蹤血壓、腎功能', 'completed'
    )
  RETURNING id INTO v_record3_id;

  RAISE NOTICE '✅ 已創建 3 筆病歷記錄';

  -- ========================================
  -- 6. 創建 AI 分析記錄
  -- ========================================
  IF v_record1_id IS NOT NULL THEN
    INSERT INTO medical_record_analysis (
      company_id, medical_record_id, analysis_type, ai_summary, key_points,
      symptom_analysis, diagnosis_suggestions, risk_factors, risk_level,
      treatment_recommendations, follow_up_suggestions, confidence_score,
      processing_time_ms, model_version
    ) VALUES
      (v_company_id, v_record1_id, 'comprehensive',
       '患者張大明（45歲，男性）因「咳嗽、發燒兩天」就診。主要症狀包括：咳嗽、發燒、喉嚨痛。生命體征：血壓 145/90、心率 82 bpm、體溫 38.2°C。',
       ARRAY['主訴：咳嗽、發燒兩天', '症狀：咳嗽、發燒、喉嚨痛、輕微頭痛', '病史：高血壓5年', '生命體征：血壓 145/90、心率 82 bpm、體溫 38.2°C'],
       jsonb_build_object(
         'total_symptoms', 4,
         'severity', 'moderate',
         'categories', jsonb_build_array(
           jsonb_build_object('category', '呼吸系統', 'symptoms', jsonb_build_array('咳嗽', '喉嚨痛'))
         )
       ),
       ARRAY['急性上呼吸道感染', '病毒性感冒', '需排除肺炎'],
       ARRAY['發燒', '高血壓病史', '血壓偏高'],
       'moderate',
       ARRAY['對症治療', '多休息，多飲水', '注意血壓監測'],
       ARRAY['3天後複診', '如症狀加重立即回診'],
       85, 1250, 'v1.0'
      ),
      
      (v_company_id, v_record2_id, 'comprehensive',
       '患者李小華（38歲，女性）因「腹痛、腹瀉一天」就診。主要症狀包括：腹痛、腹瀉、噁心。',
       ARRAY['主訴：腹痛、腹瀉一天', '症狀：腹痛、腹瀉、噁心、食慾不振', '生命體征：血壓 118/75、心率 88 bpm'],
       jsonb_build_object(
         'total_symptoms', 4,
         'severity', 'moderate',
         'categories', jsonb_build_array(
           jsonb_build_object('category', '消化系統', 'symptoms', jsonb_build_array('腹痛', '腹瀉', '噁心'))
         )
       ),
       ARRAY['急性胃腸炎', '食物中毒可能', '病毒性腸炎'],
       ARRAY['腹瀉次數多', '伴有腹痛'],
       'moderate',
       ARRAY['清淡飲食，避免油膩', '補充電解質', '對症治療'],
       ARRAY['注意觀察', '如持續腹瀉或出現脫水症狀請回診'],
       88, 980, 'v1.0'
      );

    RAISE NOTICE '✅ 已創建 AI 分析記錄';
  END IF;

  -- ========================================
  -- 7. 創建診斷建議
  -- ========================================
  IF v_record1_id IS NOT NULL THEN
    INSERT INTO diagnosis_suggestions (
      company_id, medical_record_id, suggestion_text, confidence_score,
      reasoning, supporting_symptoms, status
    ) VALUES
      (v_company_id, v_record1_id, '急性上呼吸道感染', 90,
       '基於發燒、咳嗽、喉嚨痛等典型呼吸道感染症狀',
       ARRAY['咳嗽', '發燒', '喉嚨痛'], 'accepted'),
      
      (v_company_id, v_record2_id, '急性胃腸炎', 85,
       '基於腹痛、腹瀉、噁心等消化道症狀',
       ARRAY['腹痛', '腹瀉', '噁心'], 'accepted');

    RAISE NOTICE '✅ 已創建診斷建議';
  END IF;

  -- ========================================
  -- 8. 創建審核記錄
  -- ========================================
  IF v_record1_id IS NOT NULL THEN
    INSERT INTO medical_record_reviews (
      company_id, medical_record_id, reviewer_name, review_type,
      review_status, review_comments
    ) VALUES
      (v_company_id, v_record1_id, '王主任', 'quality_check',
       'approved', '病歷記錄完整，診斷合理'),
      
      (v_company_id, v_record2_id, '王主任', 'quality_check',
       'approved', '病歷記錄規範，治療計劃恰當');

    RAISE NOTICE '✅ 已創建審核記錄';
  END IF;

  -- ========================================
  -- 完成
  -- ========================================
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ AI 病歷助理系統設置完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '數據摘要:';
  RAISE NOTICE '  病歷記錄: %', (SELECT COUNT(*) FROM medical_records WHERE company_id = v_company_id);
  RAISE NOTICE '  AI 分析: %', (SELECT COUNT(*) FROM medical_record_analysis WHERE company_id = v_company_id);
  RAISE NOTICE '  診斷建議: %', (SELECT COUNT(*) FROM diagnosis_suggestions WHERE company_id = v_company_id);
  RAISE NOTICE '  症狀字典: %', (SELECT COUNT(*) FROM symptom_dictionary);
  RAISE NOTICE '  病歷模板: %', (SELECT COUNT(*) FROM medical_record_templates WHERE company_id = v_company_id);
  RAISE NOTICE '';
  RAISE NOTICE '系統已就緒!可以開始使用 AI 病歷助理功能';
  RAISE NOTICE '';

END $$;

-- 顯示病歷摘要
SELECT 
  '病歷摘要' AS info,
  record_number AS 病歷號,
  patient_name AS 患者姓名,
  TO_CHAR(visit_date, 'YYYY-MM-DD HH24:MI') AS 就診時間,
  doctor_name AS 醫師,
  chief_complaint AS 主訴,
  diagnosis AS 診斷,
  status AS 狀態
FROM medical_records
WHERE company_id IN (SELECT id FROM companies WHERE name = 'fenghopital company')
ORDER BY visit_date DESC;

