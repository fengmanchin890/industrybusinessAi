-- ==========================================
-- AI 市民服務系統 - 資料庫架構
-- ==========================================

-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 服務請求表
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  request_code TEXT NOT NULL,
  
  -- 市民資訊
  citizen_id TEXT,
  citizen_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  id_number TEXT,  -- 身份證號（加密）
  
  -- 請求資訊
  service_type TEXT NOT NULL CHECK (service_type IN ('consultation', 'complaint', 'application', 'inquiry', 'appointment', 'feedback')),
  category TEXT NOT NULL CHECK (category IN ('social_welfare', 'tax', 'housing', 'education', 'healthcare', 'business', 'transportation', 'environment', 'general')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  location TEXT,
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('phone', 'email', 'sms', 'in-person')),
  
  -- 處理狀態
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'processing', 'pending_info', 'resolved', 'closed', 'cancelled')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  department TEXT,
  
  -- 回應資訊
  response TEXT,
  resolution_notes TEXT,
  response_time_minutes INTEGER,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  -- AI 分析
  ai_category_suggestion TEXT,
  ai_priority_suggestion TEXT,
  ai_sentiment_score NUMERIC(3,2),  -- -1 to 1
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative', 'urgent')),
  ai_suggested_response TEXT,
  ai_keywords TEXT[] DEFAULT '{}',
  
  -- 滿意度
  satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
  satisfaction_comment TEXT,
  satisfaction_submitted_at TIMESTAMPTZ,
  
  -- SLA (Service Level Agreement)
  sla_deadline TIMESTAMPTZ,
  sla_status TEXT CHECK (sla_status IN ('on-time', 'at-risk', 'overdue')),
  
  -- 元數據
  source TEXT CHECK (source IN ('web', 'mobile', 'phone', 'email', 'in-person', 'chatbot')),
  ip_address TEXT,
  user_agent TEXT,
  tags TEXT[] DEFAULT '{}',
  is_anonymous BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, request_code)
);

-- 2. 服務知識庫表
CREATE TABLE IF NOT EXISTS service_knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  category TEXT NOT NULL CHECK (category IN ('social_welfare', 'tax', 'housing', 'education', 'healthcare', 'business', 'transportation', 'environment', 'general')),
  sub_category TEXT,
  
  -- 問題與答案
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  related_questions TEXT[] DEFAULT '{}',
  
  -- 適用條件
  applicable_conditions JSONB DEFAULT '{}'::jsonb,
  eligibility_criteria TEXT[] DEFAULT '{}',
  required_documents TEXT[] DEFAULT '{}',
  
  -- 流程指引
  process_steps TEXT[] DEFAULT '{}',
  estimated_processing_time TEXT,
  responsible_department TEXT,
  contact_info TEXT,
  
  -- AI 增強
  ai_generated BOOLEAN DEFAULT false,
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  
  -- 使用統計
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- 狀態
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 預約服務表
CREATE TABLE IF NOT EXISTS service_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
  
  -- 預約資訊
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('consultation', 'document_submission', 'interview', 'inspection', 'hearing', 'general')),
  department TEXT NOT NULL,
  service_counter TEXT,
  
  -- 市民資訊
  citizen_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  citizen_count INTEGER DEFAULT 1,
  
  -- 時間
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  end_time TIME,
  
  -- 狀態
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'checked_in', 'in_service', 'completed', 'cancelled', 'no_show')),
  confirmation_sent BOOLEAN DEFAULT false,
  reminder_sent BOOLEAN DEFAULT false,
  
  -- 服務員
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- 備註
  purpose TEXT,
  special_requirements TEXT,
  notes TEXT,
  
  -- 取消資訊
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMPTZ,
  
  -- 完成資訊
  check_in_time TIMESTAMPTZ,
  service_start_time TIMESTAMPTZ,
  service_end_time TIMESTAMPTZ,
  actual_duration_minutes INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 服務互動記錄表
CREATE TABLE IF NOT EXISTS service_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('message', 'call', 'email', 'note', 'status_change', 'assignment')),
  direction TEXT CHECK (direction IN ('inbound', 'outbound', 'internal')),
  
  -- 內容
  subject TEXT,
  content TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  
  -- 參與者
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient TEXT,
  
  -- AI 分析
  ai_summary TEXT,
  ai_action_items TEXT[] DEFAULT '{}',
  
  -- 元數據
  is_public BOOLEAN DEFAULT false,
  is_automated BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 服務評價表
CREATE TABLE IF NOT EXISTS service_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
  
  -- 評分
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  response_speed_rating INTEGER CHECK (response_speed_rating BETWEEN 1 AND 5),
  service_quality_rating INTEGER CHECK (service_quality_rating BETWEEN 1 AND 5),
  staff_attitude_rating INTEGER CHECK (staff_attitude_rating BETWEEN 1 AND 5),
  
  -- 意見
  positive_aspects TEXT[] DEFAULT '{}',
  negative_aspects TEXT[] DEFAULT '{}',
  suggestions TEXT,
  would_recommend BOOLEAN,
  
  -- AI 分析
  ai_sentiment_score NUMERIC(3,2),
  ai_themes TEXT[] DEFAULT '{}',
  ai_priority_issues TEXT[] DEFAULT '{}',
  
  -- 回應
  is_responded BOOLEAN DEFAULT false,
  response TEXT,
  responded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 常見問題表
CREATE TABLE IF NOT EXISTS service_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  
  keywords TEXT[] DEFAULT '{}',
  related_faq_ids UUID[] DEFAULT '{}',
  
  -- 統計
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_service_requests_company_id ON service_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_category ON service_requests(category);
CREATE INDEX IF NOT EXISTS idx_service_requests_priority ON service_requests(priority);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_to ON service_requests(assigned_to);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_company_id ON service_knowledge_base(company_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON service_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_active ON service_knowledge_base(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_appointments_company_id ON service_appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON service_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON service_appointments(status);

CREATE INDEX IF NOT EXISTS idx_interactions_request_id ON service_interactions(request_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON service_interactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_company_id ON service_feedback(company_id);
CREATE INDEX IF NOT EXISTS idx_feedback_request_id ON service_feedback(request_id);

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_service_requests_search ON service_requests USING GIN(to_tsvector('simple', title || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_knowledge_base_search ON service_knowledge_base USING GIN(to_tsvector('simple', question || ' ' || answer));

-- 啟用 RLS
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_faqs ENABLE ROW LEVEL SECURITY;

-- RLS 策略（使用 users 表）
-- service_requests
DROP POLICY IF EXISTS "Users can view service requests" ON service_requests;
CREATE POLICY "Users can view service requests" ON service_requests FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert service requests" ON service_requests;
CREATE POLICY "Users can insert service requests" ON service_requests FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update service requests" ON service_requests;
CREATE POLICY "Users can update service requests" ON service_requests FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- service_knowledge_base
DROP POLICY IF EXISTS "Users can view knowledge base" ON service_knowledge_base;
CREATE POLICY "Users can view knowledge base" ON service_knowledge_base FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert knowledge base" ON service_knowledge_base;
CREATE POLICY "Users can insert knowledge base" ON service_knowledge_base FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- service_appointments
DROP POLICY IF EXISTS "Users can view appointments" ON service_appointments;
CREATE POLICY "Users can view appointments" ON service_appointments FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert appointments" ON service_appointments;
CREATE POLICY "Users can insert appointments" ON service_appointments FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update appointments" ON service_appointments;
CREATE POLICY "Users can update appointments" ON service_appointments FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- service_interactions
DROP POLICY IF EXISTS "Users can view interactions" ON service_interactions;
CREATE POLICY "Users can view interactions" ON service_interactions FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert interactions" ON service_interactions;
CREATE POLICY "Users can insert interactions" ON service_interactions FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- service_feedback
DROP POLICY IF EXISTS "Users can view feedback" ON service_feedback;
CREATE POLICY "Users can view feedback" ON service_feedback FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert feedback" ON service_feedback;
CREATE POLICY "Users can insert feedback" ON service_feedback FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- service_faqs
DROP POLICY IF EXISTS "Users can view faqs" ON service_faqs;
CREATE POLICY "Users can view faqs" ON service_faqs FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert faqs" ON service_faqs;
CREATE POLICY "Users can insert faqs" ON service_faqs FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- 自動更新 updated_at 觸發器
CREATE OR REPLACE FUNCTION update_service_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION update_service_updated_at();

CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON service_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_service_updated_at();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON service_appointments
  FOR EACH ROW EXECUTE FUNCTION update_service_updated_at();

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON service_faqs
  FOR EACH ROW EXECUTE FUNCTION update_service_updated_at();

-- 自動計算 SLA 狀態
CREATE OR REPLACE FUNCTION update_sla_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sla_deadline IS NOT NULL AND NEW.status NOT IN ('resolved', 'closed', 'cancelled') THEN
    IF NOW() > NEW.sla_deadline THEN
      NEW.sla_status = 'overdue';
    ELSIF NOW() > (NEW.sla_deadline - INTERVAL '4 hours') THEN
      NEW.sla_status = 'at-risk';
    ELSE
      NEW.sla_status = 'on-time';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_request_sla BEFORE INSERT OR UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION update_sla_status();

-- 統計函數
CREATE OR REPLACE FUNCTION get_service_stats(p_company_id UUID)
RETURNS TABLE (
  total_requests BIGINT,
  resolved_today BIGINT,
  avg_response_time NUMERIC,
  satisfaction_rate NUMERIC,
  pending_requests BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_requests,
    COUNT(*) FILTER (WHERE status = 'resolved' AND DATE(resolved_at) = CURRENT_DATE)::BIGINT as resolved_today,
    COALESCE(AVG(response_time_minutes) FILTER (WHERE response_time_minutes IS NOT NULL), 0) as avg_response_time,
    COALESCE(AVG(sf.overall_rating) * 20, 0) as satisfaction_rate,
    COUNT(*) FILTER (WHERE status IN ('new', 'assigned', 'processing'))::BIGINT as pending_requests
  FROM service_requests sr
  LEFT JOIN service_feedback sf ON sr.id = sf.request_id
  WHERE sr.company_id = p_company_id
    AND sr.created_at > NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

