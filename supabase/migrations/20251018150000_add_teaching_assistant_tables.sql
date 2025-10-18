-- ==========================================
-- AI 教學助手 - 資料庫架構
-- ==========================================

-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 學生檔案表
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 基本資訊
  student_code TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  
  -- 學習資訊
  grade TEXT,
  class_name TEXT,
  subjects TEXT[] DEFAULT '{}',
  learning_level TEXT DEFAULT 'intermediate' CHECK (learning_level IN ('beginner', 'intermediate', 'advanced')),
  learning_style TEXT CHECK (learning_style IN ('visual', 'auditory', 'kinesthetic', 'reading')),
  
  -- 學習特徵
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  goals TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  
  -- AI 分析
  ai_learning_profile JSONB DEFAULT '{}'::jsonb,
  recommended_pace TEXT CHECK (recommended_pace IN ('slow', 'normal', 'fast')),
  motivation_level INTEGER CHECK (motivation_level BETWEEN 1 AND 10),
  
  -- 狀態
  is_active BOOLEAN DEFAULT true,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  last_active_at TIMESTAMPTZ,
  
  -- 家長資訊
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
  
  -- 會話資訊
  session_code TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopics TEXT[] DEFAULT '{}',
  
  -- 時間
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  -- 學習內容
  learning_objectives TEXT[] DEFAULT '{}',
  materials_used TEXT[] DEFAULT '{}',
  activities TEXT[] DEFAULT '{}',
  
  -- 成果
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  accuracy_rate NUMERIC(5,2),
  
  -- AI 分析
  ai_difficulty_level TEXT CHECK (ai_difficulty_level IN ('easy', 'medium', 'hard')),
  ai_engagement_score INTEGER CHECK (ai_engagement_score BETWEEN 1 AND 100),
  ai_comprehension_score INTEGER CHECK (ai_comprehension_score BETWEEN 1 AND 100),
  ai_feedback TEXT,
  ai_suggestions TEXT[] DEFAULT '{}',
  knowledge_gaps TEXT[] DEFAULT '{}',
  
  -- 評分
  student_satisfaction INTEGER CHECK (student_satisfaction BETWEEN 1 AND 5),
  student_feedback TEXT,
  
  -- 狀態
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
  
  -- 問題資訊
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'problem_solving', 'fill_blank')),
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  
  -- 內容
  question_text TEXT NOT NULL,
  question_data JSONB DEFAULT '{}'::jsonb, -- 用於存儲選項等
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  hints TEXT[] DEFAULT '{}',
  
  -- 學生回答
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  student_answer TEXT,
  is_correct BOOLEAN,
  response_time_seconds INTEGER,
  attempts INTEGER DEFAULT 1,
  
  -- AI 分析
  ai_analysis TEXT,
  ai_error_type TEXT,
  ai_recommended_review BOOLEAN DEFAULT false,
  
  -- 元數據
  source TEXT, -- 題目來源
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
  
  -- 路徑資訊
  path_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  
  -- 等級
  current_level INTEGER DEFAULT 1,
  target_level INTEGER NOT NULL,
  total_levels INTEGER NOT NULL,
  
  -- 進度
  progress_percentage NUMERIC(5,2) DEFAULT 0,
  completed_milestones INTEGER DEFAULT 0,
  total_milestones INTEGER NOT NULL,
  
  -- 時間規劃
  start_date DATE DEFAULT CURRENT_DATE,
  target_completion_date DATE,
  estimated_completion_date DATE,
  actual_completion_date DATE,
  
  -- AI 規劃
  ai_recommended_pace TEXT,
  ai_next_topics TEXT[] DEFAULT '{}',
  ai_prerequisite_topics TEXT[] DEFAULT '{}',
  
  -- 狀態
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
  
  -- 里程碑資訊
  milestone_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- 內容
  topics TEXT[] NOT NULL,
  skills TEXT[] DEFAULT '{}',
  learning_objectives TEXT[] DEFAULT '{}',
  
  -- 要求
  required_accuracy NUMERIC(5,2) DEFAULT 80,
  required_sessions INTEGER DEFAULT 3,
  estimated_hours INTEGER,
  
  -- 狀態
  is_completed BOOLEAN DEFAULT false,
  completion_date TIMESTAMPTZ,
  actual_accuracy NUMERIC(5,2),
  actual_sessions INTEGER DEFAULT 0,
  
  -- 資源
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
  
  -- 知識點
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT,
  knowledge_point TEXT NOT NULL,
  
  -- 掌握度
  mastery_level INTEGER CHECK (mastery_level BETWEEN 0 AND 100),
  mastery_status TEXT CHECK (mastery_status IN ('not_started', 'learning', 'practicing', 'mastered', 'needs_review')),
  
  -- 學習統計
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  accuracy_rate NUMERIC(5,2),
  last_practice_date DATE,
  
  -- AI 評估
  ai_confidence_score INTEGER CHECK (ai_confidence_score BETWEEN 0 AND 100),
  ai_recommended_practice BOOLEAN DEFAULT false,
  ai_prerequisite_gaps TEXT[] DEFAULT '{}',
  
  -- 時間追蹤
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
  
  -- 互動類型
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('question', 'explanation', 'hint', 'feedback', 'encouragement', 'assessment')),
  
  -- 內容
  student_input TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  
  -- AI 分析
  intent_detected TEXT,
  confidence_score NUMERIC(5,2),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'confused', 'frustrated')),
  
  -- 有用性
  was_helpful BOOLEAN,
  student_feedback TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 教學資源表
CREATE TABLE IF NOT EXISTS teaching_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 資源資訊
  resource_type TEXT NOT NULL CHECK (resource_type IN ('lesson', 'exercise', 'video', 'reading', 'quiz', 'project')),
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  grade_level TEXT,
  
  -- 內容
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  content_url TEXT,
  
  -- 難度與標籤
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  duration_minutes INTEGER,
  tags TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  
  -- AI 增強
  ai_generated BOOLEAN DEFAULT false,
  ai_summary TEXT,
  ai_learning_objectives TEXT[] DEFAULT '{}',
  
  -- 使用統計
  view_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2),
  
  -- 狀態
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_students_company_id ON students(company_id);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);

CREATE INDEX IF NOT EXISTS idx_sessions_company_id ON learning_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON learning_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_subject ON learning_sessions(subject);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON learning_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON learning_sessions(start_time DESC);

CREATE INDEX IF NOT EXISTS idx_questions_session_id ON learning_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_questions_student_id ON learning_questions(student_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON learning_questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON learning_questions(difficulty);

CREATE INDEX IF NOT EXISTS idx_paths_company_id ON learning_paths(company_id);
CREATE INDEX IF NOT EXISTS idx_paths_student_id ON learning_paths(student_id);
CREATE INDEX IF NOT EXISTS idx_paths_status ON learning_paths(status);

CREATE INDEX IF NOT EXISTS idx_milestones_path_id ON learning_milestones(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_milestones_completed ON learning_milestones(is_completed);

CREATE INDEX IF NOT EXISTS idx_mastery_student_id ON knowledge_mastery(student_id);
CREATE INDEX IF NOT EXISTS idx_mastery_subject ON knowledge_mastery(subject);
CREATE INDEX IF NOT EXISTS idx_mastery_status ON knowledge_mastery(mastery_status);

CREATE INDEX IF NOT EXISTS idx_interactions_student_id ON ai_interactions(student_id);
CREATE INDEX IF NOT EXISTS idx_interactions_session_id ON ai_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON ai_interactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_resources_subject ON teaching_resources(subject);
CREATE INDEX IF NOT EXISTS idx_resources_active ON teaching_resources(is_active) WHERE is_active = true;

-- 啟用 RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_resources ENABLE ROW LEVEL SECURITY;

-- RLS 策略
-- students
DROP POLICY IF EXISTS "Users can view students" ON students;
CREATE POLICY "Users can view students" ON students FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert students" ON students;
CREATE POLICY "Users can insert students" ON students FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update students" ON students;
CREATE POLICY "Users can update students" ON students FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- learning_sessions
DROP POLICY IF EXISTS "Users can view sessions" ON learning_sessions;
CREATE POLICY "Users can view sessions" ON learning_sessions FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert sessions" ON learning_sessions;
CREATE POLICY "Users can insert sessions" ON learning_sessions FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update sessions" ON learning_sessions;
CREATE POLICY "Users can update sessions" ON learning_sessions FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- learning_questions
DROP POLICY IF EXISTS "Users can view questions" ON learning_questions;
CREATE POLICY "Users can view questions" ON learning_questions FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert questions" ON learning_questions;
CREATE POLICY "Users can insert questions" ON learning_questions FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- learning_paths
DROP POLICY IF EXISTS "Users can view paths" ON learning_paths;
CREATE POLICY "Users can view paths" ON learning_paths FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert paths" ON learning_paths;
CREATE POLICY "Users can insert paths" ON learning_paths FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update paths" ON learning_paths;
CREATE POLICY "Users can update paths" ON learning_paths FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- learning_milestones
DROP POLICY IF EXISTS "Users can view milestones" ON learning_milestones;
CREATE POLICY "Users can view milestones" ON learning_milestones FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert milestones" ON learning_milestones;
CREATE POLICY "Users can insert milestones" ON learning_milestones FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- knowledge_mastery
DROP POLICY IF EXISTS "Users can view mastery" ON knowledge_mastery;
CREATE POLICY "Users can view mastery" ON knowledge_mastery FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert mastery" ON knowledge_mastery;
CREATE POLICY "Users can insert mastery" ON knowledge_mastery FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update mastery" ON knowledge_mastery;
CREATE POLICY "Users can update mastery" ON knowledge_mastery FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- ai_interactions
DROP POLICY IF EXISTS "Users can view interactions" ON ai_interactions;
CREATE POLICY "Users can view interactions" ON ai_interactions FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert interactions" ON ai_interactions;
CREATE POLICY "Users can insert interactions" ON ai_interactions FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- teaching_resources
DROP POLICY IF EXISTS "Users can view resources" ON teaching_resources;
CREATE POLICY "Users can view resources" ON teaching_resources FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert resources" ON teaching_resources;
CREATE POLICY "Users can insert resources" ON teaching_resources FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- 觸發器
CREATE OR REPLACE FUNCTION update_learning_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_learning_updated_at();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON learning_sessions
  FOR EACH ROW EXECUTE FUNCTION update_learning_updated_at();

CREATE TRIGGER update_paths_updated_at BEFORE UPDATE ON learning_paths
  FOR EACH ROW EXECUTE FUNCTION update_learning_updated_at();

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON learning_milestones
  FOR EACH ROW EXECUTE FUNCTION update_learning_updated_at();

CREATE TRIGGER update_mastery_updated_at BEFORE UPDATE ON knowledge_mastery
  FOR EACH ROW EXECUTE FUNCTION update_learning_updated_at();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON teaching_resources
  FOR EACH ROW EXECUTE FUNCTION update_learning_updated_at();

-- 統計函數
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

