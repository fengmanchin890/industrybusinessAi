-- ==========================================
-- AI 教學助手 - 快速設置腳本
-- 一鍵完成所有資料庫設置和測試數據
-- ==========================================

-- 注意：請將 'YOUR_COMPANY_NAME' 替換為您的公司名稱
-- 例如: 'fengadult' 或 'fenggov company' 

-- 步驟 1: 創建所有表格
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 學生檔案表
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_code TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  grade TEXT,
  class_name TEXT,
  subjects TEXT[] DEFAULT '{}',
  learning_level TEXT DEFAULT 'intermediate' CHECK (learning_level IN ('beginner', 'intermediate', 'advanced')),
  learning_style TEXT CHECK (learning_style IN ('visual', 'auditory', 'kinesthetic', 'reading')),
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  goals TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  ai_learning_profile JSONB DEFAULT '{}'::jsonb,
  recommended_pace TEXT CHECK (recommended_pace IN ('slow', 'normal', 'fast')),
  motivation_level INTEGER CHECK (motivation_level BETWEEN 1 AND 10),
  is_active BOOLEAN DEFAULT true,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  last_active_at TIMESTAMPTZ,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, student_code)
);

-- 2. 學習會話表
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_code TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopics TEXT[] DEFAULT '{}',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  learning_objectives TEXT[] DEFAULT '{}',
  materials_used TEXT[] DEFAULT '{}',
  activities TEXT[] DEFAULT '{}',
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  accuracy_rate NUMERIC(5,2),
  ai_difficulty_level TEXT CHECK (ai_difficulty_level IN ('easy', 'medium', 'hard')),
  ai_engagement_score INTEGER CHECK (ai_engagement_score BETWEEN 1 AND 100),
  ai_comprehension_score INTEGER CHECK (ai_comprehension_score BETWEEN 1 AND 100),
  ai_feedback TEXT,
  ai_suggestions TEXT[] DEFAULT '{}',
  knowledge_gaps TEXT[] DEFAULT '{}',
  student_satisfaction INTEGER CHECK (student_satisfaction BETWEEN 1 AND 5),
  student_feedback TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, session_code)
);

-- 3. 問題與答案表
CREATE TABLE IF NOT EXISTS learning_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'problem_solving', 'fill_blank')),
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_text TEXT NOT NULL,
  question_data JSONB DEFAULT '{}'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  hints TEXT[] DEFAULT '{}',
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  student_answer TEXT,
  is_correct BOOLEAN,
  response_time_seconds INTEGER,
  attempts INTEGER DEFAULT 1,
  ai_analysis TEXT,
  ai_error_type TEXT,
  ai_recommended_review BOOLEAN DEFAULT false,
  source TEXT,
  tags TEXT[] DEFAULT '{}',
  points INTEGER DEFAULT 1,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 學習路徑表
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  path_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  current_level INTEGER DEFAULT 1,
  target_level INTEGER NOT NULL,
  total_levels INTEGER NOT NULL,
  progress_percentage NUMERIC(5,2) DEFAULT 0,
  completed_milestones INTEGER DEFAULT 0,
  total_milestones INTEGER NOT NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  target_completion_date DATE,
  estimated_completion_date DATE,
  actual_completion_date DATE,
  ai_recommended_pace TEXT,
  ai_next_topics TEXT[] DEFAULT '{}',
  ai_prerequisite_topics TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  is_customized BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 學習里程碑表
CREATE TABLE IF NOT EXISTS learning_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  milestone_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  topics TEXT[] NOT NULL,
  skills TEXT[] DEFAULT '{}',
  learning_objectives TEXT[] DEFAULT '{}',
  required_accuracy NUMERIC(5,2) DEFAULT 80,
  required_sessions INTEGER DEFAULT 3,
  estimated_hours INTEGER,
  is_completed BOOLEAN DEFAULT false,
  completion_date TIMESTAMPTZ,
  actual_accuracy NUMERIC(5,2),
  actual_sessions INTEGER DEFAULT 0,
  resources TEXT[] DEFAULT '{}',
  practice_materials TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 知識點掌握表
CREATE TABLE IF NOT EXISTS knowledge_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT,
  knowledge_point TEXT NOT NULL,
  mastery_level INTEGER CHECK (mastery_level BETWEEN 0 AND 100),
  mastery_status TEXT CHECK (mastery_status IN ('not_started', 'learning', 'practicing', 'mastered', 'needs_review')),
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  accuracy_rate NUMERIC(5,2),
  last_practice_date DATE,
  ai_confidence_score INTEGER CHECK (ai_confidence_score BETWEEN 0 AND 100),
  ai_recommended_practice BOOLEAN DEFAULT false,
  ai_prerequisite_gaps TEXT[] DEFAULT '{}',
  first_learned_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  next_review_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject, topic, knowledge_point)
);

-- 7. AI 互動記錄表
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('question', 'explanation', 'hint', 'feedback', 'encouragement', 'assessment')),
  student_input TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  intent_detected TEXT,
  confidence_score NUMERIC(5,2),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'confused', 'frustrated')),
  was_helpful BOOLEAN,
  student_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 教學資源表
CREATE TABLE IF NOT EXISTS teaching_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('lesson', 'exercise', 'video', 'reading', 'quiz', 'project')),
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  grade_level TEXT,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  content_url TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  duration_minutes INTEGER,
  tags TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  ai_generated BOOLEAN DEFAULT false,
  ai_summary TEXT,
  ai_learning_objectives TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2),
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 步驟 2: 創建索引
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_students_company_id ON students(company_id);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_company_id ON learning_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON learning_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_questions_session_id ON learning_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_paths_student_id ON learning_paths(student_id);
CREATE INDEX IF NOT EXISTS idx_milestones_path_id ON learning_milestones(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_mastery_student_id ON knowledge_mastery(student_id);
CREATE INDEX IF NOT EXISTS idx_interactions_student_id ON ai_interactions(student_id);

-- 步驟 3: 啟用 RLS
-- ==========================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_resources ENABLE ROW LEVEL SECURITY;

-- 步驟 4: 創建 RLS 策略
-- ==========================================

DROP POLICY IF EXISTS "Users can view students" ON students;
CREATE POLICY "Users can view students" ON students FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert students" ON students;
CREATE POLICY "Users can insert students" ON students FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update students" ON students;
CREATE POLICY "Users can update students" ON students FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view sessions" ON learning_sessions;
CREATE POLICY "Users can view sessions" ON learning_sessions FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert sessions" ON learning_sessions;
CREATE POLICY "Users can insert sessions" ON learning_sessions FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view questions" ON learning_questions;
CREATE POLICY "Users can view questions" ON learning_questions FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert questions" ON learning_questions;
CREATE POLICY "Users can insert questions" ON learning_questions FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view paths" ON learning_paths;
CREATE POLICY "Users can view paths" ON learning_paths FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert paths" ON learning_paths;
CREATE POLICY "Users can insert paths" ON learning_paths FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view milestones" ON learning_milestones;
CREATE POLICY "Users can view milestones" ON learning_milestones FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert milestones" ON learning_milestones;
CREATE POLICY "Users can insert milestones" ON learning_milestones FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view mastery" ON knowledge_mastery;
CREATE POLICY "Users can view mastery" ON knowledge_mastery FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert mastery" ON knowledge_mastery;
CREATE POLICY "Users can insert mastery" ON knowledge_mastery FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view interactions" ON ai_interactions;
CREATE POLICY "Users can view interactions" ON ai_interactions FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert interactions" ON ai_interactions;
CREATE POLICY "Users can insert interactions" ON ai_interactions FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view resources" ON teaching_resources;
CREATE POLICY "Users can view resources" ON teaching_resources FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert resources" ON teaching_resources;
CREATE POLICY "Users can insert resources" ON teaching_resources FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- 步驟 5: 創建觸發器
-- ==========================================

CREATE OR REPLACE FUNCTION update_learning_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_learning_updated_at();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON learning_sessions;
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON learning_sessions
  FOR EACH ROW EXECUTE FUNCTION update_learning_updated_at();

DROP TRIGGER IF EXISTS update_paths_updated_at ON learning_paths;
CREATE TRIGGER update_paths_updated_at BEFORE UPDATE ON learning_paths
  FOR EACH ROW EXECUTE FUNCTION update_learning_updated_at();

DROP TRIGGER IF EXISTS update_milestones_updated_at ON learning_milestones;
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON learning_milestones
  FOR EACH ROW EXECUTE FUNCTION update_learning_updated_at();

DROP TRIGGER IF EXISTS update_mastery_updated_at ON knowledge_mastery;
CREATE TRIGGER update_mastery_updated_at BEFORE UPDATE ON knowledge_mastery
  FOR EACH ROW EXECUTE FUNCTION update_learning_updated_at();

DROP TRIGGER IF EXISTS update_resources_updated_at ON teaching_resources;
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON teaching_resources
  FOR EACH ROW EXECUTE FUNCTION update_learning_updated_at();

-- 步驟 6: 創建統計函數
-- ==========================================

CREATE OR REPLACE FUNCTION get_student_stats(p_student_id UUID)
RETURNS TABLE (
  total_sessions BIGINT,
  total_hours NUMERIC,
  average_accuracy NUMERIC,
  total_questions BIGINT,
  mastered_topics BIGINT,
  learning_topics BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT ls.id)::BIGINT as total_sessions,
    COALESCE(SUM(ls.duration_minutes) / 60.0, 0) as total_hours,
    COALESCE(AVG(ls.accuracy_rate), 0) as average_accuracy,
    COUNT(DISTINCT lq.id)::BIGINT as total_questions,
    COUNT(DISTINCT km.id) FILTER (WHERE km.mastery_status = 'mastered')::BIGINT as mastered_topics,
    COUNT(DISTINCT km.id) FILTER (WHERE km.mastery_status = 'learning')::BIGINT as learning_topics
  FROM students s
  LEFT JOIN learning_sessions ls ON s.id = ls.student_id
  LEFT JOIN learning_questions lq ON s.id = lq.student_id
  LEFT JOIN knowledge_mastery km ON s.id = km.student_id
  WHERE s.id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 步驟 7: 插入測試數據
-- ==========================================

DO $$
DECLARE
  v_company_id UUID;
  v_student1_id UUID;
  v_student2_id UUID;
  v_student3_id UUID;
  v_session1_id UUID;
  v_session2_id UUID;
  v_path1_id UUID;
BEGIN
  -- ⚠️ 請替換為您的公司名稱
  SELECT id INTO v_company_id FROM companies 
  WHERE name IN ('fengadult', 'fenggov company', 'YOUR_COMPANY_NAME') 
  LIMIT 1;
  
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION '找不到公司。請先確認公司名稱，或執行: SELECT name FROM companies;';
  END IF;

  -- 插入學生
  INSERT INTO students (
    company_id, student_code, name, grade, class_name,
    learning_level, learning_style, 
    strengths, weaknesses, goals,
    motivation_level, is_active
  ) VALUES
  (
    v_company_id, 'STU001', '陳小明', '國中九年級', '九年一班',
    'intermediate', 'visual',
    ARRAY['數學', '邏輯思考'], ARRAY['英文閱讀'], ARRAY['考上第一志願', '數學滿分'],
    8, true
  ) RETURNING id INTO v_student1_id;

  INSERT INTO students (
    company_id, student_code, name, grade, class_name,
    learning_level, learning_style,
    strengths, weaknesses, goals,
    motivation_level, is_active
  ) VALUES
  (
    v_company_id, 'STU002', '林美華', '高中一年級', '高一二班',
    'advanced', 'reading',
    ARRAY['英文', '文科'], ARRAY['數理化'], ARRAY['英文多益900分', '考上台大'],
    9, true
  ) RETURNING id INTO v_student2_id;

  INSERT INTO students (
    company_id, student_code, name, grade, class_name,
    learning_level, learning_style,
    strengths, weaknesses, goals,
    motivation_level, is_active
  ) VALUES
  (
    v_company_id, 'STU003', '張大同', '國小六年級', '六年三班',
    'beginner', 'kinesthetic',
    ARRAY['體育', '美術'], ARRAY['專注力'], ARRAY['提升數學成績'],
    6, true
  ) RETURNING id INTO v_student3_id;

  -- 插入學習會話
  INSERT INTO learning_sessions (
    company_id, student_id, session_code, subject, topic,
    start_time, end_time, duration_minutes,
    questions_attempted, questions_correct, accuracy_rate,
    ai_engagement_score, ai_comprehension_score,
    ai_feedback, status
  ) VALUES
  (
    v_company_id, v_student1_id, 'SES001', '數學', '一元二次方程式',
    NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 60,
    10, 8, 80.00,
    85, 78,
    '學習態度很好！對一元二次方程式的基本概念已經掌握，建議多練習因式分解。', 'completed'
  ) RETURNING id INTO v_session1_id;

  INSERT INTO learning_sessions (
    company_id, student_id, session_code, subject, topic,
    start_time, end_time, duration_minutes,
    questions_attempted, questions_correct, accuracy_rate,
    ai_engagement_score, ai_comprehension_score,
    ai_feedback, status
  ) VALUES
  (
    v_company_id, v_student2_id, 'SES002', '英文', '文法：過去完成式',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '45 minutes', 45,
    8, 7, 87.50,
    92, 88,
    '表現優異！對過去完成式的運用很熟練，可以嘗試更複雜的句型。', 'completed'
  ) RETURNING id INTO v_session2_id;

  -- 插入問題
  INSERT INTO learning_questions (
    company_id, session_id, student_id, question_type,
    subject, topic, difficulty,
    question_text, correct_answer, explanation,
    student_answer, is_correct, response_time_seconds
  ) VALUES
  (
    v_company_id, v_session1_id, v_student1_id, 'multiple_choice',
    '數學', '一元二次方程式', 'medium',
    '求解方程式 x² - 5x + 6 = 0',
    'x = 2 或 x = 3',
    '使用因式分解：(x-2)(x-3) = 0',
    'x = 2 或 x = 3',
    true, 45
  ),
  (
    v_company_id, v_session1_id, v_student1_id, 'multiple_choice',
    '數學', '一元二次方程式', 'hard',
    '求解方程式 2x² - 7x + 3 = 0',
    'x = 3 或 x = 0.5',
    '使用公式解或因式分解',
    'x = 3 或 x = 1',
    false, 120
  );

  -- 插入學習路徑
  INSERT INTO learning_paths (
    company_id, student_id, path_name, subject,
    description, current_level, target_level, total_levels,
    total_milestones, progress_percentage,
    target_completion_date, status
  ) VALUES
  (
    v_company_id, v_student1_id, '數學會考總複習', '數學',
    '針對國中會考的數學科目全面複習計畫',
    3, 10, 10,
    5, 30.00,
    CURRENT_DATE + INTERVAL '90 days', 'active'
  ) RETURNING id INTO v_path1_id;

  -- 插入里程碑
  INSERT INTO learning_milestones (
    company_id, learning_path_id, milestone_order,
    title, description, topics, skills,
    required_accuracy, estimated_hours,
    is_completed
  ) VALUES
  (
    v_company_id, v_path1_id, 1,
    '基礎代數', '掌握一元一次方程式與不等式',
    ARRAY['一元一次方程式', '不等式', '絕對值'],
    ARRAY['代數運算', '解方程式'],
    85.00, 15,
    true
  ),
  (
    v_company_id, v_path1_id, 2,
    '進階代數', '掌握一元二次方程式',
    ARRAY['一元二次方程式', '因式分解', '配方法'],
    ARRAY['二次方程式求解', '判別式應用'],
    80.00, 20,
    false
  );

  -- 插入知識點掌握
  INSERT INTO knowledge_mastery (
    company_id, student_id, subject, topic, knowledge_point,
    mastery_level, mastery_status,
    total_attempts, correct_attempts, accuracy_rate,
    ai_confidence_score
  ) VALUES
  (
    v_company_id, v_student1_id, '數學', '一元一次方程式', '基本解法',
    90, 'mastered',
    20, 18, 90.00,
    92
  ),
  (
    v_company_id, v_student1_id, '數學', '一元二次方程式', '因式分解',
    70, 'practicing',
    15, 11, 73.33,
    75
  ),
  (
    v_company_id, v_student2_id, '英文', '過去完成式', '基本用法',
    85, 'mastered',
    12, 10, 83.33,
    87
  );

  -- 插入 AI 互動
  INSERT INTO ai_interactions (
    company_id, student_id, session_id, interaction_type,
    student_input, ai_response, sentiment
  ) VALUES
  (
    v_company_id, v_student1_id, v_session1_id, 'question',
    '為什麼這題要用因式分解？',
    '因式分解是解一元二次方程式最直接的方法之一。當方程式可以分解成 (x-a)(x-b) = 0 的形式時，根據「零乘積性質」，我們知道 x-a = 0 或 x-b = 0，就能輕鬆求出 x 的值。',
    'confused'
  );

  -- 插入教學資源
  INSERT INTO teaching_resources (
    company_id, resource_type, subject, topic, grade_level,
    title, description, difficulty,
    duration_minutes, is_active
  ) VALUES
  (
    v_company_id, 'lesson', '數學', '一元二次方程式', '國中九年級',
    '一元二次方程式完全攻略', '包含因式分解、配方法、公式解等完整教學',
    'medium', 90, true
  ),
  (
    v_company_id, 'exercise', '英文', '過去完成式', '高中',
    '過去完成式練習題庫', '50題精選練習，含詳解',
    'medium', 60, true
  );

  RAISE NOTICE '=====================================';
  RAISE NOTICE '✅ 測試數據插入完成！';
  RAISE NOTICE '   - 學生: 3 位';
  RAISE NOTICE '   - 學習會話: 2 場';
  RAISE NOTICE '   - 問題: 2 題';
  RAISE NOTICE '   - 學習路徑: 1 條';
  RAISE NOTICE '   - 里程碑: 2 個';
  RAISE NOTICE '   - 知識點: 3 個';
  RAISE NOTICE '   - AI 互動: 1 筆';
  RAISE NOTICE '   - 教學資源: 2 個';
  RAISE NOTICE '=====================================';
END $$;

-- 步驟 8: 驗證設置
-- ==========================================

SELECT '✅ AI 教學助手系統設置完成！' as status;
SELECT '📊 請前往前端查看模組' as next_step;
SELECT '🚀 建議部署 Edge Function: supabase functions deploy teaching-assistant-ai' as deployment_tip;

