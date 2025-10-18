-- ==========================================
-- AI 學生表現分析系統 - 快速設置腳本
-- 插入測試數據
-- ==========================================
-- 
-- ⚠️ 注意：執行此腳本前，請先執行：
-- supabase/migrations/20251018160000_add_student_performance_tables.sql
-- 
-- ==========================================

-- ==========================================
-- 插入測試數據
-- ==========================================

DO $$
DECLARE
  v_company_id UUID;
  v_student1_id UUID;
  v_student2_id UUID;
  v_student3_id UUID;
BEGIN
  -- 查找 fengadult 的公司
  SELECT id INTO v_company_id FROM companies WHERE name = 'fengadult 的公司' LIMIT 1;
  
  IF v_company_id IS NULL THEN
    -- 如果找不到 "fengadult 的公司"，嘗試 "fengadult"
    SELECT id INTO v_company_id FROM companies WHERE name = 'fengadult' LIMIT 1;
  END IF;
  
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION '找不到 fengadult 相關公司，請先創建公司';
  END IF;

  RAISE NOTICE '🎯 找到公司: %', v_company_id;

  -- ==========================================
  -- 1. 創建學生
  -- ==========================================
  
  RAISE NOTICE '📚 創建學生資料...';
  
  -- 學生 1: 王小明 (中等表現，進步中)
  INSERT INTO students (
    company_id, student_code, name, email, grade, class_name,
    subjects, learning_level, learning_style,
    strengths, weaknesses, goals, interests,
    motivation_level, is_active,
    parent_name, parent_email
  ) VALUES (
    v_company_id, 'STU2024001', '王小明', 'xiaoming@example.com',
    '三年級', '3A',
    ARRAY['數學', '國語', '英文', '自然', '社會'],
    'intermediate', 'visual',
    ARRAY['數學計算', '邏輯思維'], 
    ARRAY['作文表達', '閱讀理解'],
    ARRAY['提升作文能力', '考上理想國中'],
    ARRAY['科學實驗', '數學遊戲'],
    7, true,
    '王爸爸', 'wangdad@example.com'
  ) RETURNING id INTO v_student1_id;

  -- 學生 2: 李美華 (優秀學生)
  INSERT INTO students (
    company_id, student_code, name, email, grade, class_name,
    subjects, learning_level, learning_style,
    strengths, weaknesses, goals, interests,
    motivation_level, is_active,
    parent_name, parent_email
  ) VALUES (
    v_company_id, 'STU2024002', '李美華', 'meihua@example.com',
    '三年級', '3A',
    ARRAY['數學', '國語', '英文', '自然', '社會'],
    'advanced', 'auditory',
    ARRAY['英文聽力', '口語表達', '團隊合作'],
    ARRAY['數學應用題'],
    ARRAY['英文檢定通過', '成為班長'],
    ARRAY['英文閱讀', '演講'],
    9, true,
    '李媽媽', 'limom@example.com'
  ) RETURNING id INTO v_student2_id;

  -- 學生 3: 陳志強 (需要關注)
  INSERT INTO students (
    company_id, student_code, name, email, grade, class_name,
    subjects, learning_level, learning_style,
    strengths, weaknesses, goals, interests,
    motivation_level, is_active,
    parent_name, parent_email
  ) VALUES (
    v_company_id, 'STU2024003', '陳志強', 'zhiqiang@example.com',
    '三年級', '3A',
    ARRAY['數學', '國語', '英文', '自然', '社會'],
    'beginner', 'kinesthetic',
    ARRAY['體育', '美術'],
    ARRAY['數學', '英文', '專注力'],
    ARRAY['提升數學成績', '培養學習興趣'],
    ARRAY['運動', '繪畫'],
    4, true,
    '陳爸爸', 'chendad@example.com'
  ) RETURNING id INTO v_student3_id;

  RAISE NOTICE '✅ 學生創建完成: %, %, %', v_student1_id, v_student2_id, v_student3_id;

  -- ==========================================
  -- 2. 創建成績記錄
  -- ==========================================
  
  RAISE NOTICE '📊 創建成績記錄...';
  
  -- 王小明的成績（中等，進步中）
  INSERT INTO student_grades (company_id, student_id, assessment_type, subject, title, score, max_score, grade_level, assessment_date, status)
  VALUES
    (v_company_id, v_student1_id, 'exam', '數學', '第一次月考', 92, 100, 'A', CURRENT_DATE - INTERVAL '30 days', 'graded'),
    (v_company_id, v_student1_id, 'exam', '國語', '第一次月考', 78, 100, 'B+', CURRENT_DATE - INTERVAL '30 days', 'graded'),
    (v_company_id, v_student1_id, 'exam', '英文', '第一次月考', 88, 100, 'A-', CURRENT_DATE - INTERVAL '30 days', 'graded'),
    (v_company_id, v_student1_id, 'quiz', '數學', '隨堂測驗1', 85, 100, 'A-', CURRENT_DATE - INTERVAL '20 days', 'graded'),
    (v_company_id, v_student1_id, 'quiz', '國語', '隨堂測驗1', 82, 100, 'B+', CURRENT_DATE - INTERVAL '18 days', 'graded'),
    (v_company_id, v_student1_id, 'homework', '數學', '作業評量', 90, 100, 'A', CURRENT_DATE - INTERVAL '10 days', 'graded'),
    (v_company_id, v_student1_id, 'quiz', '數學', '隨堂測驗2', 88, 100, 'A-', CURRENT_DATE - INTERVAL '5 days', 'graded');

  -- 李美華的成績（優秀）
  INSERT INTO student_grades (company_id, student_id, assessment_type, subject, title, score, max_score, grade_level, assessment_date, status)
  VALUES
    (v_company_id, v_student2_id, 'exam', '數學', '第一次月考', 95, 100, 'A+', CURRENT_DATE - INTERVAL '30 days', 'graded'),
    (v_company_id, v_student2_id, 'exam', '國語', '第一次月考', 93, 100, 'A', CURRENT_DATE - INTERVAL '30 days', 'graded'),
    (v_company_id, v_student2_id, 'exam', '英文', '第一次月考', 98, 100, 'A+', CURRENT_DATE - INTERVAL '30 days', 'graded'),
    (v_company_id, v_student2_id, 'quiz', '數學', '隨堂測驗1', 92, 100, 'A', CURRENT_DATE - INTERVAL '20 days', 'graded'),
    (v_company_id, v_student2_id, 'quiz', '英文', '隨堂測驗1', 96, 100, 'A+', CURRENT_DATE - INTERVAL '18 days', 'graded'),
    (v_company_id, v_student2_id, 'homework', '數學', '作業評量', 95, 100, 'A+', CURRENT_DATE - INTERVAL '10 days', 'graded'),
    (v_company_id, v_student2_id, 'project', '自然', '科展報告', 97, 100, 'A+', CURRENT_DATE - INTERVAL '7 days', 'graded');

  -- 陳志強的成績（需要關注，下降中）
  INSERT INTO student_grades (company_id, student_id, assessment_type, subject, title, score, max_score, grade_level, assessment_date, status)
  VALUES
    (v_company_id, v_student3_id, 'exam', '數學', '第一次月考', 75, 100, 'B', CURRENT_DATE - INTERVAL '30 days', 'graded'),
    (v_company_id, v_student3_id, 'exam', '國語', '第一次月考', 68, 100, 'C+', CURRENT_DATE - INTERVAL '30 days', 'graded'),
    (v_company_id, v_student3_id, 'exam', '英文', '第一次月考', 55, 100, 'D+', CURRENT_DATE - INTERVAL '30 days', 'graded'),
    (v_company_id, v_student3_id, 'quiz', '數學', '隨堂測驗1', 65, 100, 'C', CURRENT_DATE - INTERVAL '20 days', 'graded'),
    (v_company_id, v_student3_id, 'quiz', '國語', '隨堂測驗1', 72, 100, 'B-', CURRENT_DATE - INTERVAL '18 days', 'graded'),
    (v_company_id, v_student3_id, 'homework', '數學', '作業評量', 60, 100, 'C-', CURRENT_DATE - INTERVAL '10 days', 'graded'),
    (v_company_id, v_student3_id, 'quiz', '英文', '隨堂測驗2', 50, 100, 'D', CURRENT_DATE - INTERVAL '5 days', 'graded');

  RAISE NOTICE '✅ 成績記錄創建完成';

  -- ==========================================
  -- 3. 創建出席記錄
  -- ==========================================
  
  RAISE NOTICE '📅 創建出席記錄...';
  
  -- 為每個學生創建最近 20 天的出席記錄
  FOR i IN 1..20 LOOP
    -- 王小明：95% 出席率
    INSERT INTO student_attendance (company_id, student_id, attendance_date, class_period, subject, status)
    VALUES (
      v_company_id, v_student1_id, CURRENT_DATE - (i || ' days')::interval, '上午',
      CASE (i % 5) WHEN 0 THEN '數學' WHEN 1 THEN '國語' WHEN 2 THEN '英文' WHEN 3 THEN '自然' ELSE '社會' END,
      CASE WHEN i % 20 = 0 THEN 'absent' ELSE 'present' END
    );

    -- 李美華：98% 出席率
    INSERT INTO student_attendance (company_id, student_id, attendance_date, class_period, subject, status)
    VALUES (
      v_company_id, v_student2_id, CURRENT_DATE - (i || ' days')::interval, '上午',
      CASE (i % 5) WHEN 0 THEN '數學' WHEN 1 THEN '國語' WHEN 2 THEN '英文' WHEN 3 THEN '自然' ELSE '社會' END,
      CASE WHEN i % 50 = 0 THEN 'sick' ELSE 'present' END
    );

    -- 陳志強：88% 出席率
    INSERT INTO student_attendance (company_id, student_id, attendance_date, class_period, subject, status)
    VALUES (
      v_company_id, v_student3_id, CURRENT_DATE - (i || ' days')::interval, '上午',
      CASE (i % 5) WHEN 0 THEN '數學' WHEN 1 THEN '國語' WHEN 2 THEN '英文' WHEN 3 THEN '自然' ELSE '社會' END,
      CASE WHEN i % 8 = 0 THEN 'absent' WHEN i % 10 = 0 THEN 'late' ELSE 'present' END
    );
  END LOOP;

  RAISE NOTICE '✅ 出席記錄創建完成';

  -- ==========================================
  -- 4. 創建作業完成記錄
  -- ==========================================
  
  RAISE NOTICE '📝 創建作業記錄...';
  
  -- 王小明：90% 作業完成率
  INSERT INTO homework_completion (company_id, student_id, homework_title, subject, assigned_date, due_date, submission_date, submission_status, quality_score, completeness_score, effort_score)
  VALUES
    (v_company_id, v_student1_id, '數學作業本P.20-25', '數學', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '7 days', 'submitted_on_time', 90, 95, 85),
    (v_company_id, v_student1_id, '國語習作第三課', '國語', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '8 days', 'submitted_late', 75, 80, 70),
    (v_company_id, v_student1_id, '英文單字練習', '英文', CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '5 days', 'submitted_on_time', 88, 90, 85),
    (v_company_id, v_student1_id, '自然實驗報告', '自然', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '3 days', 'submitted_on_time', 92, 90, 95),
    (v_company_id, v_student1_id, '社會學習單', '社會', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '2 days', NULL, 'not_submitted', NULL, NULL, NULL);

  -- 李美華：95% 作業完成率
  INSERT INTO homework_completion (company_id, student_id, homework_title, subject, assigned_date, due_date, submission_date, submission_status, quality_score, completeness_score, effort_score)
  VALUES
    (v_company_id, v_student2_id, '數學作業本P.20-25', '數學', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '7 days', 'submitted_on_time', 98, 100, 95),
    (v_company_id, v_student2_id, '國語習作第三課', '國語', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '7 days', 'submitted_on_time', 95, 98, 92),
    (v_company_id, v_student2_id, '英文單字練習', '英文', CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '5 days', 'submitted_on_time', 97, 100, 95),
    (v_company_id, v_student2_id, '自然實驗報告', '自然', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '3 days', 'submitted_on_time', 96, 95, 98),
    (v_company_id, v_student2_id, '社會學習單', '社會', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '2 days', 'submitted_on_time', 93, 90, 95);

  -- 陳志強：70% 作業完成率
  INSERT INTO homework_completion (company_id, student_id, homework_title, subject, assigned_date, due_date, submission_date, submission_status, quality_score, completeness_score, effort_score)
  VALUES
    (v_company_id, v_student3_id, '數學作業本P.20-25', '數學', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '6 days', 'submitted_late', 65, 70, 60),
    (v_company_id, v_student3_id, '國語習作第三課', '國語', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '7 days', NULL, 'not_submitted', NULL, NULL, NULL),
    (v_company_id, v_student3_id, '英文單字練習', '英文', CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '4 days', 'submitted_late', 55, 60, 50),
    (v_company_id, v_student3_id, '自然實驗報告', '自然', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '3 days', 'submitted_on_time', 70, 65, 75),
    (v_company_id, v_student3_id, '社會學習單', '社會', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '2 days', NULL, 'not_submitted', NULL, NULL, NULL);

  RAISE NOTICE '✅ 作業記錄創建完成';

  -- ==========================================
  -- 5. 創建表現警示
  -- ==========================================
  
  RAISE NOTICE '⚠️  創建表現警示...';
  
  -- 王小明的警示（1個）
  INSERT INTO performance_alerts (company_id, student_id, alert_type, severity, title, message, ai_recommendations, status, priority)
  VALUES (
    v_company_id, v_student1_id, 'academic', 'low', '國語成績需要提升',
    '王小明的國語成績（78分）低於預期，建議加強閱讀理解和作文練習。',
    ARRAY['增加課外閱讀量', '參加作文班', '每週寫一篇短文'],
    'active', 1
  );

  -- 陳志強的警示（2個）
  INSERT INTO performance_alerts (company_id, student_id, alert_type, severity, title, message, ai_recommendations, status, priority)
  VALUES
    (v_company_id, v_student3_id, 'academic', 'high', '多科成績不及格',
     '陳志強的英文和數學成績均低於60分，需要立即介入輔導。',
     ARRAY['安排一對一輔導', '制定個別化學習計劃', '加強基礎知識復習'],
     'active', 5),
    (v_company_id, v_student3_id, 'attendance', 'medium', '出席率偏低',
     '陳志強最近的出席率只有88%，建議了解缺席原因。',
     ARRAY['與家長聯繫', '了解缺席原因', '提供補課支援'],
     'active', 3);

  RAISE NOTICE '✅ 表現警示創建完成';

  -- ==========================================
  -- 6. 創建表現報告
  -- ==========================================
  
  RAISE NOTICE '📄 創建表現報告...';
  
  INSERT INTO performance_reports (
    company_id, student_id, report_type, report_period, 
    start_date, end_date,
    overall_score, attendance_rate, homework_completion_rate, participation_score,
    subject_scores, ai_summary, ai_strengths, ai_weaknesses, ai_recommendations,
    performance_trend, engagement_level, status
  ) VALUES
    (v_company_id, v_student1_id, 'individual', '2024-10月',
     CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE,
     85, 95, 90, 85,
     '{"數學": 88.75, "國語": 80, "英文": 88}'::jsonb,
     '王小明整體表現良好，數學和英文成績優秀，國語有待加強。',
     ARRAY['數學計算能力強', '學習態度積極', '出席率高'],
     ARRAY['作文表達能力需提升', '閱讀理解有待加強'],
     ARRAY['增加閱讀量', '練習寫作', '參加作文班'],
     'improving', 'high', 'published'),
    
    (v_company_id, v_student2_id, 'individual', '2024-10月',
     CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE,
     92, 98, 95, 92,
     '{"數學": 94, "國語": 93, "英文": 97}'::jsonb,
     '李美華表現優異，各科成績均優秀，是班級的楷模。',
     ARRAY['全科優秀', '英文特別突出', '學習自主性強'],
     ARRAY['可挑戰更高難度題目'],
     ARRAY['參加校外競賽', '擔任小老師協助同學', '發展領導能力'],
     'stable', 'high', 'published'),
    
    (v_company_id, v_student3_id, 'individual', '2024-10月',
     CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE,
     72, 88, 75, 70,
     '{"數學": 65, "國語": 70, "英文": 52.5}'::jsonb,
     '陳志強的學習表現需要特別關注，英文和數學成績不理想，建議安排課後輔導。',
     ARRAY['體育表現優異', '實作能力強'],
     ARRAY['基礎學科成績不佳', '學習動機較低', '專注力需改善'],
     ARRAY['安排一對一輔導', '培養學習興趣', '加強基礎訓練', '家長密切配合'],
     'declining', 'low', 'published');

  RAISE NOTICE '✅ 表現報告創建完成';

  -- ==========================================
  -- 最終總結
  -- ==========================================
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║   ✨ AI 學生表現分析系統設置完成！ ✨   ║';
  RAISE NOTICE '╚════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 已創建的數據：';
  RAISE NOTICE '  ✓ 學生：3 位（王小明、李美華、陳志強）';
  RAISE NOTICE '  ✓ 成績記錄：21 筆';
  RAISE NOTICE '  ✓ 出席記錄：60 筆';
  RAISE NOTICE '  ✓ 作業記錄：15 筆';
  RAISE NOTICE '  ✓ 表現警示：3 筆';
  RAISE NOTICE '  ✓ 表現報告：3 筆';
  RAISE NOTICE '';
  RAISE NOTICE '📌 下一步：';
  RAISE NOTICE '  1. 部署 Edge Function:';
  RAISE NOTICE '     supabase functions deploy student-performance-analyzer';
  RAISE NOTICE '';
  RAISE NOTICE '  2. 設置 OpenAI API Key (可選):';
  RAISE NOTICE '     supabase secrets set OPENAI_API_KEY=sk-your-key-here';
  RAISE NOTICE '';
  RAISE NOTICE '  3. 登入系統測試（使用 fengadult company 帳號）';
  RAISE NOTICE '';

END $$;

