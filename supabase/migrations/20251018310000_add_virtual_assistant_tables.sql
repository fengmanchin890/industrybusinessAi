-- ========================================
-- AI 虚拟助理系统 - 数据库表结构
-- ========================================
-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;
-- 1. 助理消息表
CREATE TABLE IF NOT EXISTS assistant_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID,
  conversation_id UUID,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('customer-service', 'marketing', 'faq', 'general')),
  intent TEXT,
  confidence_score DECIMAL(5, 4),
  response_time_ms INTEGER,
  ai_model_used TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FAQ 表
CREATE TABLE IF NOT EXISTS assistant_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  keywords TEXT[],
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  hits INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 助理配置表
CREATE TABLE IF NOT EXISTS assistant_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  assistant_name TEXT DEFAULT 'AI 虚拟助理',
  welcome_message TEXT DEFAULT '您好！我是您的 AI 虚拟助理，可以协助您处理客服、行销和 FAQ 相关问题。',
  response_speed TEXT DEFAULT 'standard' CHECK (response_speed IN ('fast', 'standard', 'detailed')),
  enable_multichannel BOOLEAN DEFAULT true,
  enable_auto_report BOOLEAN DEFAULT true,
  custom_prompts JSONB,
  api_settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 对话会话表
CREATE TABLE IF NOT EXISTS assistant_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  channel TEXT DEFAULT 'web' CHECK (channel IN ('web', 'mobile', 'api', 'widget')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  category TEXT,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  resolution_time_seconds INTEGER,
  message_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  metadata JSONB
);

-- 5. 性能指标表
CREATE TABLE IF NOT EXISTS assistant_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_messages INTEGER DEFAULT 0,
  user_messages INTEGER DEFAULT 0,
  assistant_messages INTEGER DEFAULT 0,
  avg_response_time_seconds DECIMAL(8, 2),
  satisfaction_score DECIMAL(5, 2),
  resolution_rate DECIMAL(5, 2),
  category_breakdown JSONB,
  peak_hour INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, date)
);

-- 6. 智能推荐表
CREATE TABLE IF NOT EXISTS assistant_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('faq', 'product', 'service', 'content')),
  title TEXT NOT NULL,
  description TEXT,
  target_audience TEXT[],
  relevance_score DECIMAL(5, 4),
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 知识库文档表
CREATE TABLE IF NOT EXISTS assistant_knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[],
  embedding VECTOR(1536),
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 反馈记录表
CREATE TABLE IF NOT EXISTS assistant_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES assistant_conversations(id),
  message_id UUID REFERENCES assistant_messages(id),
  user_id UUID,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback_type TEXT CHECK (feedback_type IN ('positive', 'negative', 'neutral')),
  comment TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 索引
-- ========================================

CREATE INDEX IF NOT EXISTS idx_assistant_messages_company ON assistant_messages(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_conversation ON assistant_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_category ON assistant_messages(category);

CREATE INDEX IF NOT EXISTS idx_assistant_faqs_company ON assistant_faqs(company_id, is_active, hits DESC);
CREATE INDEX IF NOT EXISTS idx_assistant_faqs_keywords ON assistant_faqs USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_assistant_faqs_category ON assistant_faqs(category);

CREATE INDEX IF NOT EXISTS idx_assistant_conversations_company ON assistant_conversations(company_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_status ON assistant_conversations(status);
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_session ON assistant_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_session ON assistant_conversations(session_id);

-- Vector similarity index for knowledge base (HNSW works on empty tables)
CREATE INDEX IF NOT EXISTS idx_assistant_knowledge_base_embedding 
  ON assistant_knowledge_base 
  USING hnsw (embedding vector_cosine_ops);
  
CREATE INDEX IF NOT EXISTS idx_assistant_metrics_company_date ON assistant_metrics(company_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_assistant_knowledge_base_company ON assistant_knowledge_base(company_id, is_published);
CREATE INDEX IF NOT EXISTS idx_assistant_knowledge_base_tags ON assistant_knowledge_base USING GIN (tags);

-- Drop existing functions if they exist (CASCADE to handle cross-migration dependencies)
DROP FUNCTION IF EXISTS get_today_assistant_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_category_stats(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS search_faqs(UUID, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS increment_faq_hits(UUID) CASCADE;
DROP FUNCTION IF EXISTS calculate_satisfaction(UUID, DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS update_assistant_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_message_count() CASCADE;

-- ========================================
-- 辅助函数
-- ========================================
-- 获取今日统计
CREATE OR REPLACE FUNCTION get_today_assistant_stats(
  p_company_id UUID
)
RETURNS TABLE (
  total_messages INTEGER,
  satisfaction DECIMAL,
  avg_response_time DECIMAL,
  resolution_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(total_messages), 0)::INTEGER as total_messages,
    COALESCE(AVG(satisfaction_score), 0)::DECIMAL as satisfaction,
    COALESCE(AVG(avg_response_time_seconds), 0)::DECIMAL as avg_response_time,
    COALESCE(AVG(resolution_rate), 0)::DECIMAL as resolution_rate
  FROM assistant_metrics
  WHERE company_id = p_company_id
    AND date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 获取分类统计
CREATE OR REPLACE FUNCTION get_category_stats(
  p_company_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  category TEXT,
  message_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(assistant_messages.category, 'general') as category,
    COUNT(*)::BIGINT as message_count
  FROM assistant_messages
  WHERE company_id = p_company_id
    AND created_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL
  GROUP BY assistant_messages.category;
END;
$$ LANGUAGE plpgsql;

-- 搜索 FAQ
CREATE OR REPLACE FUNCTION search_faqs(
  p_company_id UUID,
  p_search_query TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  faq_id UUID,
  question TEXT,
  answer TEXT,
  category TEXT,
  relevance_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id as faq_id,
    assistant_faqs.question,
    assistant_faqs.answer,
    assistant_faqs.category,
    (
      CASE
        WHEN assistant_faqs.question ILIKE '%' || p_search_query || '%' THEN 10
        ELSE 0
      END +
      CASE
        WHEN assistant_faqs.answer ILIKE '%' || p_search_query || '%' THEN 5
        ELSE 0
      END +
      CASE
        WHEN p_search_query = ANY(keywords) THEN 15
        ELSE 0
      END
    ) as relevance_score
  FROM assistant_faqs
  WHERE company_id = p_company_id
    AND is_active = true
    AND (
      assistant_faqs.question ILIKE '%' || p_search_query || '%'
      OR assistant_faqs.answer ILIKE '%' || p_search_query || '%'
      OR p_search_query = ANY(keywords)
    )
  ORDER BY relevance_score DESC, hits DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 更新 FAQ 点击量
CREATE OR REPLACE FUNCTION increment_faq_hits(
  p_faq_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE assistant_faqs
  SET hits = hits + 1
  WHERE id = p_faq_id;
END;
$$ LANGUAGE plpgsql;

-- 计算满意度
CREATE OR REPLACE FUNCTION calculate_satisfaction(
  p_company_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS DECIMAL AS $$
DECLARE
  v_satisfaction DECIMAL;
BEGIN
  SELECT AVG(rating)::DECIMAL INTO v_satisfaction
  FROM assistant_feedback
  WHERE company_id = p_company_id
    AND created_at BETWEEN p_start_date AND p_end_date;
    
  RETURN COALESCE(v_satisfaction * 20, 0); -- Convert 1-5 to 0-100
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 行级安全性 (RLS)
-- ========================================

ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_feedback ENABLE ROW LEVEL SECURITY;

-- 消息策略
CREATE POLICY assistant_messages_company_policy ON assistant_messages
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- FAQ 策略
CREATE POLICY assistant_faqs_company_policy ON assistant_faqs
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- 配置策略
CREATE POLICY assistant_configs_company_policy ON assistant_configs
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- 对话策略
CREATE POLICY assistant_conversations_company_policy ON assistant_conversations
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- 指标策略
CREATE POLICY assistant_metrics_company_policy ON assistant_metrics
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- 推荐策略
CREATE POLICY assistant_recommendations_company_policy ON assistant_recommendations
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- 知识库策略
CREATE POLICY assistant_knowledge_base_company_policy ON assistant_knowledge_base
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- 反馈策略
CREATE POLICY assistant_feedback_company_policy ON assistant_feedback
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- ========================================
-- 触发器
-- ========================================

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_assistant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assistant_faqs_updated_at
  BEFORE UPDATE ON assistant_faqs
  FOR EACH ROW EXECUTE FUNCTION update_assistant_updated_at();

CREATE TRIGGER update_assistant_configs_updated_at
  BEFORE UPDATE ON assistant_configs
  FOR EACH ROW EXECUTE FUNCTION update_assistant_updated_at();

CREATE TRIGGER update_assistant_knowledge_base_updated_at
  BEFORE UPDATE ON assistant_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_assistant_updated_at();

-- 自动更新对话消息计数
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE assistant_conversations
  SET message_count = message_count + 1
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_count_on_message
  AFTER INSERT ON assistant_messages
  FOR EACH ROW 
  WHEN (NEW.conversation_id IS NOT NULL)
  EXECUTE FUNCTION update_conversation_message_count();

DO $$ BEGIN RAISE NOTICE 'AI 虚拟助理系统 - 数据库完成'; END $$;

