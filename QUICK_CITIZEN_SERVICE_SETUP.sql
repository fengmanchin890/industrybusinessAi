-- ==========================================
-- AI 市民服務系統 - 快速設置腳本
-- 一鍵完成所有資料庫設置和測試數據
-- ==========================================

-- 步驟 1: 創建所有表格
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
  id_number TEXT,
  
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
  ai_sentiment_score NUMERIC(3,2),
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative', 'urgent')),
  ai_suggested_response TEXT,
  ai_keywords TEXT[] DEFAULT '{}',
  
  -- 滿意度
  satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
  satisfaction_comment TEXT,
  satisfaction_submitted_at TIMESTAMPTZ,
  
  -- SLA
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
  
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  related_questions TEXT[] DEFAULT '{}',
  
  applicable_conditions JSONB DEFAULT '{}'::jsonb,
  eligibility_criteria TEXT[] DEFAULT '{}',
  required_documents TEXT[] DEFAULT '{}',
  
  process_steps TEXT[] DEFAULT '{}',
  estimated_processing_time TEXT,
  responsible_department TEXT,
  contact_info TEXT,
  
  ai_generated BOOLEAN DEFAULT false,
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
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
  
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('consultation', 'document_submission', 'interview', 'inspection', 'hearing', 'general')),
  department TEXT NOT NULL,
  service_counter TEXT,
  
  citizen_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  citizen_count INTEGER DEFAULT 1,
  
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  end_time TIME,
  
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'checked_in', 'in_service', 'completed', 'cancelled', 'no_show')),
  confirmation_sent BOOLEAN DEFAULT false,
  reminder_sent BOOLEAN DEFAULT false,
  
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  purpose TEXT,
  special_requirements TEXT,
  notes TEXT,
  
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMPTZ,
  
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
  
  subject TEXT,
  content TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient TEXT,
  
  ai_summary TEXT,
  ai_action_items TEXT[] DEFAULT '{}',
  
  is_public BOOLEAN DEFAULT false,
  is_automated BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 服務評價表
CREATE TABLE IF NOT EXISTS service_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
  
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  response_speed_rating INTEGER CHECK (response_speed_rating BETWEEN 1 AND 5),
  service_quality_rating INTEGER CHECK (service_quality_rating BETWEEN 1 AND 5),
  staff_attitude_rating INTEGER CHECK (staff_attitude_rating BETWEEN 1 AND 5),
  
  positive_aspects TEXT[] DEFAULT '{}',
  negative_aspects TEXT[] DEFAULT '{}',
  suggestions TEXT,
  would_recommend BOOLEAN,
  
  ai_sentiment_score NUMERIC(3,2),
  ai_themes TEXT[] DEFAULT '{}',
  ai_priority_issues TEXT[] DEFAULT '{}',
  
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
  
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 步驟 2: 創建索引
-- ==========================================

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

CREATE INDEX IF NOT EXISTS idx_service_requests_search ON service_requests USING GIN(to_tsvector('simple', title || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_knowledge_base_search ON service_knowledge_base USING GIN(to_tsvector('simple', question || ' ' || answer));


-- 步驟 3: 啟用 RLS
-- ==========================================

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_faqs ENABLE ROW LEVEL SECURITY;


-- 步驟 4: 創建 RLS 策略
-- ==========================================

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

DROP POLICY IF EXISTS "Users can update knowledge base" ON service_knowledge_base;
CREATE POLICY "Users can update knowledge base" ON service_knowledge_base FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

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


-- 步驟 5: 創建觸發器
-- ==========================================

CREATE OR REPLACE FUNCTION update_service_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_service_requests_updated_at ON service_requests;
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION update_service_updated_at();

DROP TRIGGER IF EXISTS update_knowledge_base_updated_at ON service_knowledge_base;
CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON service_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_service_updated_at();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON service_appointments;
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON service_appointments
  FOR EACH ROW EXECUTE FUNCTION update_service_updated_at();

DROP TRIGGER IF EXISTS update_faqs_updated_at ON service_faqs;
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON service_faqs
  FOR EACH ROW EXECUTE FUNCTION update_service_updated_at();

-- SLA 狀態自動更新
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

DROP TRIGGER IF EXISTS update_service_request_sla ON service_requests;
CREATE TRIGGER update_service_request_sla BEFORE INSERT OR UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION update_sla_status();


-- 步驟 6: 創建統計函數
-- ==========================================

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


-- 步驟 7: 插入測試數據
-- ==========================================

DO $$
DECLARE
  v_company_id UUID;
  v_user_id UUID;
  v_request1_id UUID;
  v_request2_id UUID;
  v_request3_id UUID;
  v_request4_id UUID;
  v_request5_id UUID;
  v_kb1_id UUID;
  v_kb2_id UUID;
  v_kb3_id UUID;
  v_appointment1_id UUID;
BEGIN
  -- 獲取 fenggov 公司 ID
SELECT id INTO v_company_id FROM companies WHERE name = 'fenggov company' LIMIT 1;
  
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'fenggov company not found';
  END IF;

  -- 獲取用戶 ID
  SELECT id INTO v_user_id FROM users WHERE company_id = v_company_id LIMIT 1;

  -- 插入服務請求
  INSERT INTO service_requests (
    company_id, request_code, citizen_name, contact_phone, contact_email,
    service_type, category, priority, title, description,
    status, department, source, sla_deadline, ai_sentiment, ai_sentiment_score,
    ai_keywords, tags, created_at
  ) VALUES
  (
    v_company_id, 'SR2024-001', '王小明', '0912-345-678', 'wang@example.com',
    'consultation', 'social_welfare', 'medium', '低收入戶補助申請諮詢',
    '您好，我想詢問如何申請低收入戶補助？我需要準備哪些文件？家庭成員都需要提供什麼證明文件嗎？謝謝。',
    'processing', '社會局', 'web', NOW() + INTERVAL '20 hours', 'neutral', 0.1,
    ARRAY['補助', '低收入戶', '申請', '文件'], ARRAY['urgent'], NOW() - INTERVAL '3 hours'
  ) RETURNING id INTO v_request1_id;

  INSERT INTO service_requests (
    company_id, request_code, citizen_name, contact_phone,
    service_type, category, priority, title, description,
    status, department, source, sla_deadline, ai_sentiment, ai_sentiment_score,
    ai_keywords, created_at
  ) VALUES
  (
    v_company_id, 'SR2024-002', '李美華', '0923-456-789',
    'complaint', 'environment', 'high', '社區噪音問題投訴',
    '我們社區旁邊的工地從早上6點就開始施工，噪音非常大，嚴重影響生活品質。已經持續一週了，希望相關單位能處理。',
    'assigned', '環境保護局', 'mobile', NOW() + INTERVAL '10 hours', 'negative', -0.7,
    ARRAY['噪音', '工地', '投訴', '環保'], NOW() - INTERVAL '5 hours'
  ) RETURNING id INTO v_request2_id;

  INSERT INTO service_requests (
    company_id, request_code, citizen_name, contact_phone, contact_email,
    service_type, category, priority, title, description,
    status, response, response_time_minutes, resolved_at, satisfaction_score,
    department, source, ai_sentiment, ai_sentiment_score,
    ai_keywords, created_at
  ) VALUES
  (
    v_company_id, 'SR2024-003', '陳大同', '0934-567-890', 'chen@example.com',
    'inquiry', 'tax', 'low', '地價稅繳納查詢',
    '請問今年的地價稅什麼時候開始繳納？可以使用哪些繳納方式？',
    'resolved', '親愛的市民您好，今年地價稅繳納期間為11月1日至11月30日。您可以透過便利商店、ATM轉帳、網路銀行或臨櫃繳納。如有疑問請撥打1999。',
    45, NOW() - INTERVAL '1 day', 5,
    '稅務局', 'web', 'neutral', 0.0,
    ARRAY['地價稅', '繳納', '查詢'], NOW() - INTERVAL '2 days'
  ) RETURNING id INTO v_request3_id;

  INSERT INTO service_requests (
    company_id, request_code, citizen_name, contact_phone,
    service_type, category, priority, title, description,
    status, department, source, sla_deadline, ai_sentiment, ai_sentiment_score,
    ai_keywords, tags, created_at
  ) VALUES
  (
    v_company_id, 'SR2024-004', '張雅婷', '0945-678-901',
    'application', 'education', 'high', '國小新生入學申請',
    '我的小孩明年要讀小一，想詢問學區劃分和入學申請的流程。我們是新搬來的，需要準備什麼文件？',
    'new', '教育局', 'phone', NOW() + INTERVAL '22 hours', 'neutral', 0.2,
    ARRAY['入學', '國小', '學區', '申請'], ARRAY['education'], NOW() - INTERVAL '1 hour'
  ) RETURNING id INTO v_request4_id;

  INSERT INTO service_requests (
    company_id, request_code, citizen_name, contact_phone, contact_email,
    service_type, category, priority, title, description,
    status, assigned_to, assigned_at, department, source, ai_sentiment, ai_sentiment_score,
    ai_keywords, created_at
  ) VALUES
  (
    v_company_id, 'SR2024-005', '林建宏', '0956-789-012', 'lin@example.com',
    'appointment', 'business', 'medium', '公司設立登記預約',
    '我想申請設立一間有限公司，想預約時間到現場諮詢並送件。請問需要準備哪些文件？',
    'processing', v_user_id, NOW() - INTERVAL '30 minutes', '經濟發展局', 'web', 'positive', 0.5,
    ARRAY['公司登記', '設立', '預約'], NOW() - INTERVAL '2 hours'
  ) RETURNING id INTO v_request5_id;

  -- 插入知識庫
  INSERT INTO service_knowledge_base (
    company_id, category, sub_category, question, answer,
    keywords, required_documents, process_steps,
    estimated_processing_time, responsible_department, contact_info,
    is_active, is_public, helpful_count, view_count
  ) VALUES
  (
    v_company_id, 'social_welfare', '低收入戶', '如何申請低收入戶補助？',
    '申請低收入戶補助需符合以下條件：1. 設籍並實際居住本市滿一年。2. 家庭總收入平均每人每月低於最低生活費。3. 家庭財產未超過規定標準。請備齊相關文件至各區公所社會課辦理。',
    ARRAY['低收入戶', '補助', '申請', '社會福利'],
    ARRAY['全戶戶籍謄本', '財產證明', '收入證明', '身份證', '印章'],
    ARRAY['備齊文件', '至區公所申請', '填寫申請表', '等候審核', '領取核定函'],
    '14-30個工作天', '社會局', '市民服務專線：1999',
    true, true, 45, 230
  ) RETURNING id INTO v_kb1_id;

  INSERT INTO service_knowledge_base (
    company_id, category, sub_category, question, answer,
    keywords, required_documents, process_steps,
    estimated_processing_time, responsible_department, contact_info,
    is_active, is_public, helpful_count, view_count
  ) VALUES
  (
    v_company_id, 'business', '公司登記', '如何申請公司設立登記？',
    '設立公司需先完成公司名稱預查，再準備設立文件送件。股份有限公司需經會計師簽證，有限公司則可由股東自行申請。',
    ARRAY['公司登記', '設立', '營業登記'],
    ARRAY['公司名稱預查核定書', '公司章程', '股東同意書', '董事願任同意書', '登記申請書'],
    ARRAY['線上公司名稱預查', '準備設立文件', '會計師簽證(股份有限公司)', '送件申請', '領取登記證明'],
    '7-14個工作天', '經濟發展局', '商業登記科：(02)1234-5678',
    true, true, 38, 156
  ) RETURNING id INTO v_kb2_id;

  INSERT INTO service_knowledge_base (
    company_id, category, sub_category, question, answer,
    keywords, required_documents, process_steps,
    estimated_processing_time, responsible_department, contact_info,
    is_active, is_public, helpful_count, view_count
  ) VALUES
  (
    v_company_id, 'tax', '地價稅', '地價稅如何繳納？',
    '地價稅每年11月1日至11月30日為繳納期間。可透過以下方式繳納：1. 便利商店繳納 2. 金融機構臨櫃繳納 3. ATM轉帳 4. 網路銀行 5. 信用卡繳納。逾期未繳將加徵滯納金。',
    ARRAY['地價稅', '繳納', '稅務'],
    ARRAY['繳款書'],
    ARRAY['收到繳款書', '選擇繳納方式', '完成繳納', '保留收據'],
    '即時', '稅務局', '稅務服務專線：0800-000-321',
    true, true, 67, 421
  ) RETURNING id INTO v_kb3_id;

  -- 插入預約
  INSERT INTO service_appointments (
    company_id, request_id, appointment_type, department,
    citizen_name, contact_phone, contact_email,
    appointment_date, appointment_time, duration_minutes,
    status, purpose, assigned_to
  ) VALUES
  (
    v_company_id, v_request5_id, 'consultation', '經濟發展局',
    '林建宏', '0956-789-012', 'lin@example.com',
    CURRENT_DATE + INTERVAL '3 days', '14:00:00', 60,
    'confirmed', '公司設立登記諮詢及文件審核', v_user_id
  ) RETURNING id INTO v_appointment1_id;

  -- 插入互動記錄
  INSERT INTO service_interactions (
    company_id, request_id, interaction_type, direction,
    content, created_by
  ) VALUES
  (
    v_company_id, v_request1_id, 'note', 'internal',
    '已聯絡市民，告知需準備的文件清單。市民表示下週會備齊文件前來辦理。',
    v_user_id
  ),
  (
    v_company_id, v_request2_id, 'assignment', 'internal',
    '案件已指派給環保稽查員進行現場勘查。',
    v_user_id
  );

  -- 插入評價
  INSERT INTO service_feedback (
    company_id, request_id,
    overall_rating, response_speed_rating, service_quality_rating, staff_attitude_rating,
    positive_aspects, suggestions, would_recommend,
    ai_sentiment_score
  ) VALUES
  (
    v_company_id, v_request3_id,
    5, 5, 5, 5,
    ARRAY['回應迅速', '說明清楚', '態度親切'],
    '服務很好，沒有建議。', true,
    0.9
  );

  -- 插入 FAQ
  INSERT INTO service_faqs (
    company_id, category, question, answer,
    keywords, is_active, display_order, helpful_count, view_count
  ) VALUES
  (
    v_company_id, 'general', '市民服務專線是幾號？',
    '市民服務專線是1999，服務時間為每日08:00-22:00，提供市政諮詢、陳情、通報等服務。',
    ARRAY['1999', '專線', '客服'], true, 1, 156, 892
  ),
  (
    v_company_id, 'general', '如何查詢案件處理進度？',
    '您可以透過以下方式查詢：1. 撥打1999並提供案件編號 2. 登入市民服務網站查詢 3. 使用市政APP查詢。',
    ARRAY['查詢', '進度', '案件'], true, 2, 89, 445
  ),
  (
    v_company_id, 'social_welfare', '老人福利有哪些？',
    '本市提供多項老人福利：1. 中低收入老人生活津貼 2. 老人健保費補助 3. 老人居家服務 4. 長照2.0服務 5. 敬老愛心卡等。詳情請洽社會局。',
    ARRAY['老人', '福利', '津貼', '長照'], true, 3, 123, 678
  );

  RAISE NOTICE '✅ 測試數據插入完成！';
  RAISE NOTICE '   - 服務請求: 5 筆';
  RAISE NOTICE '   - 知識庫: 3 筆';
  RAISE NOTICE '   - 預約: 1 筆';
  RAISE NOTICE '   - 互動記錄: 2 筆';
  RAISE NOTICE '   - 評價: 1 筆';
  RAISE NOTICE '   - FAQ: 3 筆';
END $$;


-- 步驟 8: 驗證設置
-- ==========================================

-- 查看統計資訊
DO $$
DECLARE
  v_company_id UUID;
  v_stats RECORD;
BEGIN
  SELECT id INTO v_company_id FROM companies WHERE name = 'fenggov company' LIMIT 1;
  
  SELECT * INTO v_stats FROM get_service_stats(v_company_id);
  
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'AI 市民服務系統 - 統計資訊';
  RAISE NOTICE '=====================================';
  RAISE NOTICE '總請求數: %', v_stats.total_requests;
  RAISE NOTICE '今日已解決: %', v_stats.resolved_today;
  RAISE NOTICE '平均回應時間: % 分鐘', ROUND(v_stats.avg_response_time);
  RAISE NOTICE '滿意度: % %%', ROUND(v_stats.satisfaction_rate);
  RAISE NOTICE '待處理: %', v_stats.pending_requests;
  RAISE NOTICE '=====================================';
END $$;

-- 完成
SELECT '✅ AI 市民服務系統設置完成！' as status;
SELECT '📊 請前往前端查看模組' as next_step;
SELECT '🚀 建議部署 Edge Function: supabase functions deploy citizen-service-ai' as deployment_tip;

