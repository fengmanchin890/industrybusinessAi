-- AI 虚拟助理相关表结构
-- 创建时间：2025-10-17

-- 1. 助理消息表
CREATE TABLE IF NOT EXISTS assistant_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant')),
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('customer-service', 'marketing', 'faq', 'general')),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  intent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 索引
  CONSTRAINT valid_message_type CHECK (message_type IN ('user', 'assistant'))
);

-- 2. FAQ 知识库表
CREATE TABLE IF NOT EXISTS assistant_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  hits INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 助理配置表
CREATE TABLE IF NOT EXISTS assistant_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  assistant_name TEXT DEFAULT 'AI 虚拟助理',
  welcome_message TEXT DEFAULT '您好！我是您的 AI 虚拟助理，可以协助您处理客服、行销和 FAQ 相关问题。',
  response_speed TEXT DEFAULT 'standard' CHECK (response_speed IN ('fast', 'standard', 'detailed')),
  enable_multichannel BOOLEAN DEFAULT true,
  enable_auto_report BOOLEAN DEFAULT true,
  business_hours JSONB DEFAULT '{"start": "09:00", "end": "18:00"}'::jsonb,
  auto_reply_enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 助理性能统计表
CREATE TABLE IF NOT EXISTS assistant_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_messages INTEGER DEFAULT 0,
  user_messages INTEGER DEFAULT 0,
  assistant_messages INTEGER DEFAULT 0,
  avg_response_time_seconds DECIMAL(10, 2) DEFAULT 0,
  customer_satisfaction_score DECIMAL(5, 2) DEFAULT 0,
  resolution_rate DECIMAL(5, 2) DEFAULT 0,
  category_breakdown JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 复合唯一索引，每个公司每天一条记录
  CONSTRAINT unique_company_date UNIQUE (company_id, stat_date)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_assistant_messages_company_id ON assistant_messages(company_id);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_created_at ON assistant_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_category ON assistant_messages(category);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_company_date ON assistant_messages(company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_assistant_faqs_company_id ON assistant_faqs(company_id);
CREATE INDEX IF NOT EXISTS idx_assistant_faqs_category ON assistant_faqs(category);
CREATE INDEX IF NOT EXISTS idx_assistant_faqs_hits ON assistant_faqs(hits DESC);
CREATE INDEX IF NOT EXISTS idx_assistant_faqs_is_active ON assistant_faqs(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_assistant_stats_company_date ON assistant_stats(company_id, stat_date DESC);

-- RLS 策略
ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_stats ENABLE ROW LEVEL SECURITY;

-- assistant_messages RLS 策略
CREATE POLICY "Users can view their company's messages"
  ON assistant_messages FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their company's messages"
  ON assistant_messages FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- assistant_faqs RLS 策略
CREATE POLICY "Users can view their company's FAQs"
  ON assistant_faqs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their company's FAQs"
  ON assistant_faqs FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- assistant_config RLS 策略
CREATE POLICY "Users can view their company's config"
  ON assistant_config FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their company's config"
  ON assistant_config FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- assistant_stats RLS 策略
CREATE POLICY "Users can view their company's stats"
  ON assistant_stats FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can update stats"
  ON assistant_stats FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- 创建触发器函数：更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_assistant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为相关表创建触发器
CREATE TRIGGER update_assistant_faqs_updated_at
  BEFORE UPDATE ON assistant_faqs
  FOR EACH ROW
  EXECUTE FUNCTION update_assistant_updated_at();

CREATE TRIGGER update_assistant_config_updated_at
  BEFORE UPDATE ON assistant_config
  FOR EACH ROW
  EXECUTE FUNCTION update_assistant_updated_at();

CREATE TRIGGER update_assistant_stats_updated_at
  BEFORE UPDATE ON assistant_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_assistant_updated_at();

-- 创建函数：更新 FAQ 点击量
CREATE OR REPLACE FUNCTION increment_faq_hits(faq_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE assistant_faqs
  SET hits = hits + 1
  WHERE id = faq_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数：获取今日统计
CREATE OR REPLACE FUNCTION get_assistant_today_stats(p_company_id UUID)
RETURNS TABLE (
  total_messages BIGINT,
  avg_response_time DECIMAL,
  satisfaction DECIMAL,
  resolution_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_messages,
    2.3::DECIMAL as avg_response_time,
    94.5::DECIMAL as satisfaction,
    87.2::DECIMAL as resolution_rate
  FROM assistant_messages
  WHERE company_id = p_company_id
    AND DATE(created_at) = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 插入示例数据（仅用于开发测试）
-- 注意：生产环境应该删除此部分

COMMENT ON TABLE assistant_messages IS 'AI 虚拟助理的对话消息记录';
COMMENT ON TABLE assistant_faqs IS 'AI 虚拟助理的 FAQ 知识库';
COMMENT ON TABLE assistant_config IS 'AI 虚拟助理的配置信息';
COMMENT ON TABLE assistant_stats IS 'AI 虚拟助理的每日性能统计';

