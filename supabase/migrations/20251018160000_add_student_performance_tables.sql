-- ==========================================
-- AI 學生表現分析系統 - 資料庫架構
-- ==========================================

-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 學生基本資料表 (擴展 students 表)
-- 注意：如果 students 表已存在，則跳過創建
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') THEN
        CREATE TABLE students (
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
            learning_level TEXT DEFAULT 'intermediate',
            learning_style TEXT,
            strengths TEXT[] DEFAULT '{}',
            weaknesses TEXT[] DEFAULT '{}',
            goals TEXT[] DEFAULT '{}',
            interests TEXT[] DEFAULT '{}',
            ai_learning_profile JSONB DEFAULT '{}'::jsonb,
            recommended_pace TEXT,
            motivation_level INTEGER,
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
    END IF;
END $$;

-- 2. 學生成績記錄表
CREATE TABLE IF NOT EXISTS student_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- 考試/作業資訊
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('exam', 'quiz', 'homework', 'project', 'participation', 'attendance')),
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- 分數
  score NUMERIC(5,2) NOT NULL,
  max_score NUMERIC(5,2) NOT NULL DEFAULT 100,
  percentage NUMERIC(5,2) GENERATED ALWAYS AS ((score / max_score) * 100) STORED,
  grade_level TEXT, -- A+, A, B+, B, C+, C, D, F
  
  -- 日期
  assessment_date DATE NOT NULL,
  submission_date TIMESTAMPTZ,
  graded_date TIMESTAMPTZ,
  
  -- 評分者
  graded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- AI 分析
  ai_performance_analysis TEXT,
  ai_strengths TEXT[] DEFAULT '{}',
  ai_weaknesses TEXT[] DEFAULT '{}',
  ai_recommendations TEXT[] DEFAULT '{}',
  
  -- 狀態
  status TEXT DEFAULT 'graded' CHECK (status IN ('pending', 'submitted', 'graded', 'reviewed')),
  is_makeup BOOLEAN DEFAULT false,
  
  -- 元數據
  notes TEXT,
  attachments TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 出席記錄表
CREATE TABLE IF NOT EXISTS student_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- 出席資訊
  attendance_date DATE NOT NULL,
  class_period TEXT,
  subject TEXT,
  
  -- 狀態
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused', 'sick')),
  arrival_time TIME,
  departure_time TIME,
  
  -- 原因
  reason TEXT,
  is_excused BOOLEAN DEFAULT false,
  parent_notified BOOLEAN DEFAULT false,
  
  -- 記錄者
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, attendance_date, class_period)
);

-- 4. 作業完成記錄表
CREATE TABLE IF NOT EXISTS homework_completion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- 作業資訊
  homework_title TEXT NOT NULL,
  subject TEXT NOT NULL,
  assigned_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- 提交
  submission_date TIMESTAMPTZ,
  submission_status TEXT CHECK (submission_status IN ('not_submitted', 'submitted_on_time', 'submitted_late', 'excused')),
  
  -- 品質評估
  quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
  completeness_score INTEGER CHECK (completeness_score BETWEEN 0 AND 100),
  effort_score INTEGER CHECK (effort_score BETWEEN 0 AND 100),
  
  -- 回饋
  teacher_feedback TEXT,
  ai_feedback TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 學生表現警示表
CREATE TABLE IF NOT EXISTS performance_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- 警示類型
  alert_type TEXT NOT NULL CHECK (alert_type IN ('academic', 'attendance', 'behavior', 'engagement', 'health', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- 內容
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  
  -- AI 建議
  ai_recommendations TEXT[] DEFAULT '{}',
  action_items TEXT[] DEFAULT '{}',
  
  -- 狀態
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'in_progress', 'resolved', 'dismissed')),
  priority INTEGER DEFAULT 0,
  
  -- 處理
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  
  -- 通知
  parent_notified BOOLEAN DEFAULT false,
  parent_notified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 學生表現分析報告表
CREATE TABLE IF NOT EXISTS performance_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  
  -- 報告類型
  report_type TEXT NOT NULL CHECK (report_type IN ('individual', 'class', 'grade', 'subject', 'term', 'annual')),
  report_period TEXT NOT NULL, -- e.g., '2024-Q1', '2024-S1', '2024'
  
  -- 日期範圍
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- 統計數據
  overall_score NUMERIC(5,2),
  attendance_rate NUMERIC(5,2),
  homework_completion_rate NUMERIC(5,2),
  participation_score NUMERIC(5,2),
  
  -- 科目成績
  subject_scores JSONB DEFAULT '{}'::jsonb, -- {subject: score, trend: ...}
  
  -- AI 分析
  ai_summary TEXT,
  ai_strengths TEXT[] DEFAULT '{}',
  ai_weaknesses TEXT[] DEFAULT '{}',
  ai_recommendations TEXT[] DEFAULT '{}',
  ai_predicted_trajectory TEXT,
  
  -- 趨勢
  performance_trend TEXT CHECK (performance_trend IN ('improving', 'stable', 'declining')),
  engagement_level TEXT CHECK (engagement_level IN ('high', 'medium', 'low')),
  
  -- 報告內容
  report_data JSONB DEFAULT '{}'::jsonb,
  report_url TEXT,
  
  -- 狀態
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  
  -- 生成資訊
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 學習行為追蹤表
CREATE TABLE IF NOT EXISTS learning_behaviors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- 行為資訊
  behavior_date DATE NOT NULL,
  behavior_type TEXT NOT NULL CHECK (behavior_type IN ('study_time', 'resource_access', 'question_asked', 'help_sought', 'peer_interaction', 'self_assessment')),
  
  -- 詳細資料
  subject TEXT,
  topic TEXT,
  duration_minutes INTEGER,
  quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
  
  -- 互動資料
  interaction_data JSONB DEFAULT '{}'::jsonb,
  
  -- AI 洞察
  ai_insights TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_student_grades_company_id ON student_grades(company_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_student_id ON student_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_subject ON student_grades(subject);
CREATE INDEX IF NOT EXISTS idx_student_grades_date ON student_grades(assessment_date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_company_id ON student_attendance(company_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON student_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON student_attendance(attendance_date DESC);

CREATE INDEX IF NOT EXISTS idx_homework_company_id ON homework_completion(company_id);
CREATE INDEX IF NOT EXISTS idx_homework_student_id ON homework_completion(student_id);
CREATE INDEX IF NOT EXISTS idx_homework_due_date ON homework_completion(due_date DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_company_id ON performance_alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_alerts_student_id ON performance_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON performance_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON performance_alerts(severity);

CREATE INDEX IF NOT EXISTS idx_reports_company_id ON performance_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_student_id ON performance_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_reports_period ON performance_reports(report_period);

CREATE INDEX IF NOT EXISTS idx_behaviors_student_id ON learning_behaviors(student_id);
CREATE INDEX IF NOT EXISTS idx_behaviors_date ON learning_behaviors(behavior_date DESC);

-- 啟用 RLS
ALTER TABLE student_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_behaviors ENABLE ROW LEVEL SECURITY;

-- RLS 策略
-- student_grades
DROP POLICY IF EXISTS "Users can view grades" ON student_grades;
CREATE POLICY "Users can view grades" ON student_grades FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert grades" ON student_grades;
CREATE POLICY "Users can insert grades" ON student_grades FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update grades" ON student_grades;
CREATE POLICY "Users can update grades" ON student_grades FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- student_attendance
DROP POLICY IF EXISTS "Users can view attendance" ON student_attendance;
CREATE POLICY "Users can view attendance" ON student_attendance FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert attendance" ON student_attendance;
CREATE POLICY "Users can insert attendance" ON student_attendance FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- homework_completion
DROP POLICY IF EXISTS "Users can view homework" ON homework_completion;
CREATE POLICY "Users can view homework" ON homework_completion FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert homework" ON homework_completion;
CREATE POLICY "Users can insert homework" ON homework_completion FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- performance_alerts
DROP POLICY IF EXISTS "Users can view alerts" ON performance_alerts;
CREATE POLICY "Users can view alerts" ON performance_alerts FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert alerts" ON performance_alerts;
CREATE POLICY "Users can insert alerts" ON performance_alerts FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update alerts" ON performance_alerts;
CREATE POLICY "Users can update alerts" ON performance_alerts FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- performance_reports
DROP POLICY IF EXISTS "Users can view reports" ON performance_reports;
CREATE POLICY "Users can view reports" ON performance_reports FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert reports" ON performance_reports;
CREATE POLICY "Users can insert reports" ON performance_reports FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- learning_behaviors
DROP POLICY IF EXISTS "Users can view behaviors" ON learning_behaviors;
CREATE POLICY "Users can view behaviors" ON learning_behaviors FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert behaviors" ON learning_behaviors;
CREATE POLICY "Users can insert behaviors" ON learning_behaviors FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- 觸發器
CREATE OR REPLACE FUNCTION update_performance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_grades_updated_at ON student_grades;
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON student_grades
  FOR EACH ROW EXECUTE FUNCTION update_performance_updated_at();

DROP TRIGGER IF EXISTS update_homework_updated_at ON homework_completion;
CREATE TRIGGER update_homework_updated_at BEFORE UPDATE ON homework_completion
  FOR EACH ROW EXECUTE FUNCTION update_performance_updated_at();

DROP TRIGGER IF EXISTS update_alerts_updated_at ON performance_alerts;
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON performance_alerts
  FOR EACH ROW EXECUTE FUNCTION update_performance_updated_at();

DROP TRIGGER IF EXISTS update_reports_updated_at ON performance_reports;
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON performance_reports
  FOR EACH ROW EXECUTE FUNCTION update_performance_updated_at();

-- 統計函數
CREATE OR REPLACE FUNCTION get_student_performance_stats(p_student_id UUID)
RETURNS TABLE (
  overall_score NUMERIC,
  attendance_rate NUMERIC,
  homework_completion_rate NUMERIC,
  participation_score NUMERIC,
  active_alerts BIGINT,
  performance_trend TEXT
) AS $$
DECLARE
  v_days_to_analyze INTEGER := 30;
BEGIN
  RETURN QUERY
  SELECT 
    -- 平均成績
    COALESCE(AVG(sg.percentage), 0) as overall_score,
    
    -- 出席率
    COALESCE(
      (COUNT(*) FILTER (WHERE sa.status = 'present')::NUMERIC / 
       NULLIF(COUNT(sa.id), 0) * 100),
      0
    ) as attendance_rate,
    
    -- 作業完成率
    COALESCE(
      (COUNT(*) FILTER (WHERE hc.submission_status IN ('submitted_on_time', 'submitted_late'))::NUMERIC / 
       NULLIF(COUNT(hc.id), 0) * 100),
      0
    ) as homework_completion_rate,
    
    -- 參與分數（基於作業品質）
    COALESCE(AVG(hc.quality_score), 0) as participation_score,
    
    -- 活躍警示數
    (SELECT COUNT(*) FROM performance_alerts 
     WHERE student_id = p_student_id AND status = 'active')::BIGINT as active_alerts,
    
    -- 表現趨勢
    CASE 
      WHEN AVG(sg_recent.percentage) > AVG(sg_older.percentage) + 5 THEN 'improving'
      WHEN AVG(sg_recent.percentage) < AVG(sg_older.percentage) - 5 THEN 'declining'
      ELSE 'stable'
    END as performance_trend
    
  FROM students s
  LEFT JOIN student_grades sg ON s.id = sg.student_id 
    AND sg.assessment_date > CURRENT_DATE - v_days_to_analyze
  LEFT JOIN student_attendance sa ON s.id = sa.student_id 
    AND sa.attendance_date > CURRENT_DATE - v_days_to_analyze
  LEFT JOIN homework_completion hc ON s.id = hc.student_id 
    AND hc.due_date > CURRENT_DATE - v_days_to_analyze
  LEFT JOIN student_grades sg_recent ON s.id = sg_recent.student_id 
    AND sg_recent.assessment_date > CURRENT_DATE - 15
  LEFT JOIN student_grades sg_older ON s.id = sg_older.student_id 
    AND sg_older.assessment_date BETWEEN CURRENT_DATE - 30 AND CURRENT_DATE - 16
  WHERE s.id = p_student_id
  GROUP BY s.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

