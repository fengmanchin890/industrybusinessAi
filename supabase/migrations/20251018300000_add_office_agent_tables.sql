-- ========================================
-- AI Office Agent 系統 - 數據庫表結構
-- ========================================

-- 1. 辦公任務表
CREATE TABLE IF NOT EXISTS office_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('report', 'meeting_summary', 'document_review', 'email_draft', 'schedule_optimization')),
  title TEXT NOT NULL,
  description TEXT,
  input_data JSONB,
  output_data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  ai_model_used TEXT,
  processing_time_ms INTEGER,
  created_by UUID,
  assigned_to UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 文檔管理表
CREATE TABLE IF NOT EXISTS office_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL, -- report, contract, proposal, memo, etc.
  file_path TEXT,
  file_size INTEGER,
  mime_type TEXT,
  content_text TEXT,
  summary TEXT,
  keywords TEXT[],
  category TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived', 'deleted')),
  version INTEGER DEFAULT 1,
  ai_analyzed BOOLEAN DEFAULT false,
  ai_insights JSONB,
  created_by UUID,
  last_modified_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 會議記錄表
CREATE TABLE IF NOT EXISTS meeting_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  meeting_title TEXT NOT NULL,
  meeting_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  participants TEXT[],
  location TEXT,
  meeting_type TEXT CHECK (meeting_type IN ('internal', 'client', 'board', 'standup', 'review')),
  transcript TEXT,
  summary TEXT,
  key_points TEXT[],
  action_items JSONB,
  decisions_made TEXT[],
  ai_generated_summary TEXT,
  ai_confidence_score DECIMAL(3, 2),
  recording_url TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 報表模板表
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL, -- weekly_report, monthly_report, quarterly_report, custom
  description TEXT,
  template_structure JSONB NOT NULL,
  data_sources TEXT[],
  sections JSONB,
  formatting_rules JSONB,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 生成的報表表
CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  template_id UUID REFERENCES report_templates(id),
  report_title TEXT NOT NULL,
  report_period_start DATE,
  report_period_end DATE,
  report_content JSONB NOT NULL,
  report_summary TEXT,
  file_path TEXT,
  format TEXT DEFAULT 'pdf' CHECK (format IN ('pdf', 'docx', 'html', 'markdown')),
  ai_insights TEXT[],
  metrics JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'shared')),
  generated_by UUID,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 郵件草稿表
CREATE TABLE IF NOT EXISTS email_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- reply, follow_up, announcement, marketing
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  recipients TEXT[],
  cc TEXT[],
  bcc TEXT[],
  context_data JSONB,
  tone TEXT CHECK (tone IN ('formal', 'professional', 'friendly', 'casual')),
  language TEXT DEFAULT 'zh-TW',
  ai_generated BOOLEAN DEFAULT false,
  ai_suggestions JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'sent', 'scheduled')),
  scheduled_send_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 日程優化記錄表
CREATE TABLE IF NOT EXISTS schedule_optimizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  optimization_date DATE NOT NULL,
  user_id UUID,
  original_schedule JSONB,
  optimized_schedule JSONB,
  optimization_type TEXT CHECK (optimization_type IN ('time_blocking', 'meeting_consolidation', 'focus_time', 'workload_balance')),
  improvements JSONB,
  time_saved_minutes INTEGER,
  efficiency_score DECIMAL(5, 2),
  ai_recommendations TEXT[],
  applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AI 助手對話記錄表
CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID,
  conversation_type TEXT CHECK (conversation_type IN ('query', 'task_creation', 'document_help', 'general')),
  messages JSONB NOT NULL,
  context JSONB,
  resolved BOOLEAN DEFAULT false,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 索引
-- ========================================

CREATE INDEX IF NOT EXISTS idx_office_tasks_company_status ON office_tasks(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_office_tasks_type ON office_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_office_tasks_assigned ON office_tasks(assigned_to, status);

CREATE INDEX IF NOT EXISTS idx_office_documents_company ON office_documents(company_id, status);
CREATE INDEX IF NOT EXISTS idx_office_documents_type ON office_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_office_documents_keywords ON office_documents USING GIN (keywords);

CREATE INDEX IF NOT EXISTS idx_meeting_records_company_date ON meeting_records(company_id, meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_records_status ON meeting_records(status);

CREATE INDEX IF NOT EXISTS idx_report_templates_company ON report_templates(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_generated_reports_company_date ON generated_reports(company_id, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_drafts_company_status ON email_drafts(company_id, status);
CREATE INDEX IF NOT EXISTS idx_schedule_optimizations_company_date ON schedule_optimizations(company_id, optimization_date DESC);

-- ========================================
-- 輔助函數
-- ========================================

-- 獲取任務統計
CREATE OR REPLACE FUNCTION get_task_statistics(
  p_company_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_tasks INTEGER,
  completed_tasks INTEGER,
  pending_tasks INTEGER,
  average_completion_time_minutes INTEGER,
  most_common_task_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_tasks,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_tasks,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_tasks,
    AVG(processing_time_ms / 60000)::INTEGER as average_completion_time_minutes,
    MODE() WITHIN GROUP (ORDER BY task_type) as most_common_task_type
  FROM office_tasks
  WHERE company_id = p_company_id
    AND created_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- 生成會議摘要
CREATE OR REPLACE FUNCTION summarize_meetings(
  p_company_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_meetings INTEGER,
  total_duration_hours DECIMAL,
  participants_count INTEGER,
  action_items_count INTEGER,
  completion_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_meetings,
    (SUM(duration_minutes) / 60.0)::DECIMAL as total_duration_hours,
    COUNT(DISTINCT UNNEST(participants))::INTEGER as participants_count,
    SUM(JSONB_ARRAY_LENGTH(COALESCE(action_items, '[]'::JSONB)))::INTEGER as action_items_count,
    (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0) * 100)::DECIMAL as completion_rate
  FROM meeting_records
  WHERE company_id = p_company_id
    AND meeting_date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- 搜索文檔
CREATE OR REPLACE FUNCTION search_documents(
  p_company_id UUID,
  p_search_query TEXT
)
RETURNS TABLE (
  document_id UUID,
  document_name TEXT,
  document_type TEXT,
  relevance_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id as document_id,
    office_documents.document_name,
    office_documents.document_type,
    (
      CASE
        WHEN office_documents.document_name ILIKE '%' || p_search_query || '%' THEN 10
        ELSE 0
      END +
      CASE
        WHEN content_text ILIKE '%' || p_search_query || '%' THEN 5
        ELSE 0
      END +
      CASE
        WHEN p_search_query = ANY(keywords) THEN 15
        ELSE 0
      END
    ) as relevance_score
  FROM office_documents
  WHERE company_id = p_company_id
    AND status = 'active'
    AND (
      office_documents.document_name ILIKE '%' || p_search_query || '%'
      OR content_text ILIKE '%' || p_search_query || '%'
      OR p_search_query = ANY(keywords)
    )
  ORDER BY relevance_score DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 行級安全性 (RLS)
-- ========================================

ALTER TABLE office_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;

-- 辦公任務政策
CREATE POLICY office_tasks_company_policy ON office_tasks
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- 文檔管理政策
CREATE POLICY office_documents_company_policy ON office_documents
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- 會議記錄政策
CREATE POLICY meeting_records_company_policy ON meeting_records
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- 報表模板政策
CREATE POLICY report_templates_company_policy ON report_templates
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- 生成的報表政策
CREATE POLICY generated_reports_company_policy ON generated_reports
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- 郵件草稿政策
CREATE POLICY email_drafts_company_policy ON email_drafts
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- 日程優化政策
CREATE POLICY schedule_optimizations_company_policy ON schedule_optimizations
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- AI 對話記錄政策
CREATE POLICY agent_conversations_company_policy ON agent_conversations
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- ========================================
-- 觸發器
-- ========================================

-- 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_office_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_office_tasks_updated_at
  BEFORE UPDATE ON office_tasks
  FOR EACH ROW EXECUTE FUNCTION update_office_updated_at();

CREATE TRIGGER update_office_documents_updated_at
  BEFORE UPDATE ON office_documents
  FOR EACH ROW EXECUTE FUNCTION update_office_updated_at();

CREATE TRIGGER update_meeting_records_updated_at
  BEFORE UPDATE ON meeting_records
  FOR EACH ROW EXECUTE FUNCTION update_office_updated_at();

CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW EXECUTE FUNCTION update_office_updated_at();

CREATE TRIGGER update_email_drafts_updated_at
  BEFORE UPDATE ON email_drafts
  FOR EACH ROW EXECUTE FUNCTION update_office_updated_at();

CREATE TRIGGER update_agent_conversations_updated_at
  BEFORE UPDATE ON agent_conversations
  FOR EACH ROW EXECUTE FUNCTION update_office_updated_at();

DO $$ BEGIN RAISE NOTICE 'AI Office Agent 系統 - 資料庫完成'; END $$;

