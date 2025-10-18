-- ========================================
-- AI Office Agent 快速設置腳本
-- 為 fengsmal 公司創建示例數據
-- ========================================

DO $$
DECLARE
  v_company_id UUID;
  v_user_id UUID;
  v_template_id UUID;
  v_meeting_id UUID;
  v_doc_id UUID;
BEGIN
  -- 獲取 fengsmal 公司 ID
  SELECT id INTO v_company_id FROM companies WHERE name = 'fengsmal' LIMIT 1;
  
  IF v_company_id IS NULL THEN
    SELECT id INTO v_company_id FROM companies WHERE industry = 'sme' LIMIT 1;
  END IF;
  
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION '找不到 fengsmal 公司';
  END IF;

  -- 獲取用戶 ID
  SELECT id INTO v_user_id FROM users WHERE company_id = v_company_id LIMIT 1;

  RAISE NOTICE '正在為公司 % 創建示例數據...', v_company_id;

  -- ========================================
  -- 1. 創建辦公任務
  -- ========================================
  
  INSERT INTO office_tasks (company_id, task_type, title, description, status, priority, ai_model_used, processing_time_ms, completed_at, created_by)
  VALUES
    (v_company_id, 'report', '生成月度銷售報表', '統計本月銷售數據並生成分析報告', 'completed', 'high', 'gpt-4', 5230, NOW() - INTERVAL '2 days', v_user_id),
    (v_company_id, 'meeting_summary', '團隊週會總結', '總結本週團隊會議的主要內容和決策', 'completed', 'normal', 'gpt-4', 3120, NOW() - INTERVAL '1 day', v_user_id),
    (v_company_id, 'document_review', '審核客戶合約', '審核新客戶簽約文件的完整性和合規性', 'completed', 'high', 'gpt-4', 8450, NOW() - INTERVAL '3 hours', v_user_id),
    (v_company_id, 'email_draft', '回覆客戶詢價', '為客戶詢價郵件起草專業回覆', 'completed', 'normal', 'gpt-3.5-turbo', 2180, NOW() - INTERVAL '1 hour', v_user_id),
    (v_company_id, 'schedule_optimization', '優化本週日程', '分析並優化本週工作日程安排', 'processing', 'low', 'gpt-4', NULL, NULL, v_user_id),
    (v_company_id, 'report', '生成季度財務報表', '生成Q3財務分析報告', 'pending', 'high', NULL, NULL, NULL, v_user_id),
    (v_company_id, 'meeting_summary', '客戶會議紀要', '整理與新客戶的會議內容', 'pending', 'normal', NULL, NULL, NULL, v_user_id),
    (v_company_id, 'document_review', '審核產品提案', '審核新產品的市場提案文件', 'pending', 'normal', NULL, NULL, NULL, v_user_id);

  -- ========================================
  -- 2. 創建文檔
  -- ========================================
  
  INSERT INTO office_documents (
    company_id, document_name, document_type, content_text, summary, 
    keywords, category, status, ai_analyzed, ai_insights, created_by
  )
  VALUES
    (
      v_company_id,
      '2024年10月銷售報表',
      'report',
      '本月銷售總額達到150萬元，較上月增長15%。主要增長來自電商渠道，線下門店保持穩定。新客戶獲取成本降低10%。',
      '10月銷售表現優秀，總額150萬，增長15%',
      ARRAY['銷售', '增長', '電商', '新客戶'],
      'financial',
      'active',
      true,
      '{"readabilityScore": 85, "sentimentScore": 0.7, "completeness": 90, "suggestions": ["建議補充具體渠道分析"]}'::jsonb,
      v_user_id
    ),
    (
      v_company_id,
      '客戶服務合約_ABC公司',
      'contract',
      '甲方：ABC公司 乙方：本公司 服務期限：一年 服務內容：提供軟件技術支持 費用：每月2萬元',
      'ABC公司年度服務合約，月費2萬',
      ARRAY['合約', '服務', 'ABC公司', '技術支持'],
      'legal',
      'active',
      true,
      '{"readabilityScore": 90, "sentimentScore": 0.5, "completeness": 95, "suggestions": ["合約條款完整，建議添加違約條款"]}'::jsonb,
      v_user_id
    ),
    (
      v_company_id,
      '新產品推廣方案',
      'proposal',
      '背景：市場需求增長 方案：線上線下結合推廣 預算：50萬元 預期：半年內達到100萬銷售額',
      '新產品推廣方案，預算50萬，目標100萬銷售',
      ARRAY['產品', '推廣', '預算', '銷售目標'],
      'marketing',
      'active',
      true,
      '{"readabilityScore": 88, "sentimentScore": 0.8, "completeness": 85, "suggestions": ["建議補充競品分析"]}'::jsonb,
      v_user_id
    ),
    (
      v_company_id,
      '團隊週報模板',
      'memo',
      '本週完成任務：... 下週計劃：... 遇到的問題：... 需要支持：...',
      '標準週報模板',
      ARRAY['週報', '模板', '任務', '計劃'],
      'internal',
      'active',
      false,
      NULL,
      v_user_id
    ),
    (
      v_company_id,
      '員工手冊2024版',
      'memo',
      '公司規章制度、福利待遇、考勤管理、薪酬結構等內容...',
      '2024年度員工手冊',
      ARRAY['員工手冊', '規章制度', '福利', '考勤'],
      'hr',
      'active',
      false,
      NULL,
      v_user_id
    );

  -- ========================================
  -- 3. 創建會議記錄
  -- ========================================
  
  INSERT INTO meeting_records (
    company_id, meeting_title, meeting_date, duration_minutes, participants,
    location, meeting_type, transcript, summary, key_points, action_items,
    decisions_made, ai_generated_summary, ai_confidence_score, status, created_by
  )
  VALUES
    (
      v_company_id,
      '產品規劃週會',
      NOW() - INTERVAL '2 days',
      90,
      ARRAY['張經理', '李工程師', '王設計師', '趙產品經理'],
      '會議室A',
      'internal',
      '會議討論了新產品的功能規劃。張經理提出要加快開發進度。李工程師說需要兩週時間完成核心功能。王設計師展示了UI設計稿，獲得大家好評。趙產品經理彙報了市場調研結果。最後決定按計劃在下月15日發布測試版。',
      '討論新產品規劃，決定下月15日發布測試版',
      ARRAY['加快開發進度', '核心功能需兩週', 'UI設計獲好評', '市場調研完成'],
      '[{"item": "李工程師完成核心功能開發", "assignee": "李工程師", "dueDate": "2024-11-01", "status": "pending"}, {"item": "王設計師完成UI細節調整", "assignee": "王設計師", "dueDate": "2024-10-28", "status": "pending"}]'::jsonb,
      ARRAY['下月15日發布測試版', '優先開發核心功能'],
      '會議討論了新產品開發進度和設計方案，明確了時間節點和責任分工，做出了發布時間的重要決策。',
      0.85,
      'completed',
      v_user_id
    ) RETURNING id INTO v_meeting_id;

  INSERT INTO meeting_records (
    company_id, meeting_title, meeting_date, duration_minutes, participants,
    location, meeting_type, summary, key_points, status, created_by
  )
  VALUES
    (
      v_company_id,
      '客戶需求討論會',
      NOW() - INTERVAL '5 days',
      60,
      ARRAY['張經理', '客戶代表_陳總'],
      '會議室B',
      'client',
      '討論客戶定製需求，初步確定合作方案',
      ARRAY['客戶需求：定製報表功能', '預算：30萬', '時間：3個月'],
      'completed',
      v_user_id
    ),
    (
      v_company_id,
      '部門月度總結會',
      NOW() + INTERVAL '3 days',
      120,
      ARRAY['全體員工'],
      '大會議室',
      'internal',
      NULL,
      NULL,
      'scheduled',
      v_user_id
    );

  -- ========================================
  -- 4. 創建報表模板
  -- ========================================
  
  INSERT INTO report_templates (
    company_id, template_name, template_type, description,
    template_structure, data_sources, sections, is_active, is_default, created_by
  )
  VALUES
    (
      v_company_id,
      '週報模板',
      'weekly_report',
      '標準週報模板，包含任務完成情況、計劃和問題',
      '{"title": "週報", "sections": ["任務完成", "下週計劃", "問題反饋"]}'::jsonb,
      ARRAY['office_tasks', 'meeting_records'],
      '[{"name": "任務統計", "type": "statistics"}, {"name": "會議記錄", "type": "list"}]'::jsonb,
      true,
      true,
      v_user_id
    ) RETURNING id INTO v_template_id;

  INSERT INTO report_templates (
    company_id, template_name, template_type, description,
    template_structure, data_sources, is_active, created_by
  )
  VALUES
    (
      v_company_id,
      '月度銷售報表',
      'monthly_report',
      '月度銷售數據分析報表',
      '{"title": "月度銷售報表", "sections": ["銷售總覽", "渠道分析", "趨勢預測"]}'::jsonb,
      ARRAY['sales_data', 'customer_data'],
      true,
      v_user_id
    ),
    (
      v_company_id,
      '季度財務報表',
      'quarterly_report',
      '季度財務狀況分析',
      '{"title": "季度財務報表", "sections": ["收入分析", "支出統計", "利潤率"]}'::jsonb,
      ARRAY['financial_transactions'],
      true,
      v_user_id
    );

  -- ========================================
  -- 5. 創建生成的報表
  -- ========================================
  
  INSERT INTO generated_reports (
    company_id, template_id, report_title, report_period_start, report_period_end,
    report_content, report_summary, format, ai_insights, metrics, status, generated_by
  )
  VALUES
    (
      v_company_id,
      v_template_id,
      '2024年10月第2週週報',
      '2024-10-07',
      '2024-10-13',
      '{"sections": [{"title": "任務完成", "data": {"completed": 8, "pending": 2}}, {"title": "會議記錄", "data": {"count": 3}}]}'::jsonb,
      '本週完成8項任務，參加3次會議，整體進度良好',
      'pdf',
      ARRAY['任務完成率80%，高於平均水平', '會議效率有待提升'],
      '{"completionRate": 80, "meetingHours": 4.5}'::jsonb,
      'finalized',
      v_user_id
    ),
    (
      v_company_id,
      v_template_id,
      '2024年10月第3週週報',
      '2024-10-14',
      '2024-10-20',
      '{"sections": [{"title": "任務完成", "data": {"completed": 10, "pending": 1}}, {"title": "會議記錄", "data": {"count": 2}}]}'::jsonb,
      '本週完成10項任務，參加2次會議，效率提升明顯',
      'html',
      ARRAY['任務完成率91%，表現優秀', '會議時間控制良好'],
      '{"completionRate": 91, "meetingHours": 3}'::jsonb,
      'finalized',
      v_user_id
    ),
    (
      v_company_id,
      NULL,
      '客戶滿意度調查報告',
      '2024-10-01',
      '2024-10-31',
      '{"sections": [{"title": "調查結果", "data": {"satisfaction": 4.5, "responses": 150}}]}'::jsonb,
      '客戶滿意度4.5分（5分制），共收到150份反饋',
      'pdf',
      ARRAY['客戶滿意度較高', '主要不滿集中在響應速度'],
      '{"avgScore": 4.5, "responseRate": 0.75}'::jsonb,
      'finalized',
      v_user_id
    ),
    (
      v_company_id,
      NULL,
      '產品使用情況分析',
      '2024-09-01',
      '2024-09-30',
      '{"sections": [{"title": "使用統計", "data": {"activeUsers": 1250, "avgDailyUsage": 2.5}}]}'::jsonb,
      '9月活躍用戶1250人，日均使用2.5小時',
      'html',
      ARRAY['用戶活躍度穩定', '移動端使用增長快速'],
      '{"activeUsers": 1250, "growth": 0.15}'::jsonb,
      'finalized',
      v_user_id
    ),
    (
      v_company_id,
      NULL,
      '競品分析報告',
      '2024-10-01',
      '2024-10-15',
      '{"sections": [{"title": "市場分析", "data": {"competitors": 5, "marketShare": 0.12}}]}'::jsonb,
      '主要競品5個，我們市場份額12%',
      'docx',
      ARRAY['市場競爭激烈', '需加強差異化優勢'],
      '{"competitors": 5, "marketShare": 0.12}'::jsonb,
      'draft',
      v_user_id
    );

  -- ========================================
  -- 6. 創建郵件草稿
  -- ========================================
  
  INSERT INTO email_drafts (
    company_id, email_type, subject, body_text, recipients,
    tone, ai_generated, ai_suggestions, status, created_by
  )
  VALUES
    (
      v_company_id,
      'reply',
      'Re: 產品諮詢',
      E'您好，\n\n感謝您對我們產品的關注。關於您詢問的功能，我們的產品完全支持。\n\n具體來說：\n1. 支持多用戶協作\n2. 提供完整的數據分析功能\n3. 可定製化報表\n\n如需詳細演示，歡迎預約時間。\n\n祝好',
      ARRAY['customer@example.com'],
      'professional',
      true,
      '{"alternativeSubjects": ["Re: 關於產品功能的諮詢", "產品功能說明"], "sendingTime": "儘快發送（24小時內）"}'::jsonb,
      'reviewed',
      v_user_id
    ),
    (
      v_company_id,
      'follow_up',
      '跟進：上週會議討論事項',
      E'您好，\n\n關於上週我們討論的合作事宜，我們已經完成了初步方案。\n\n方案包含：\n- 技術架構設計\n- 時間進度安排\n- 預算報價\n\n附件為詳細方案文檔，請查收並提供反饋。\n\n期待您的回覆。\n\n祝好',
      ARRAY['partner@company.com'],
      'professional',
      true,
      '{"alternativeSubjects": ["關於上週會議的跟進", "合作方案已準備好"], "sendingTime": "3-5個工作日後"}'::jsonb,
      'draft',
      v_user_id
    ),
    (
      v_company_id,
      'announcement',
      '通知：系統維護公告',
      E'尊敬的用戶，\n\n我們將於本週六（10月28日）凌晨2:00-6:00進行系統維護升級。\n\n維護期間：\n- 系統將暫時無法訪問\n- 數據將自動備份\n- 不影響現有數據\n\n如有緊急需求，請提前處理。給您帶來不便，敬請諒解。\n\n此致\n敬禮',
      ARRAY['all-users@company.com'],
      'formal',
      true,
      '{"alternativeSubjects": ["【重要】系統維護通知", "系統升級公告"], "sendingTime": "工作日上午10點"}'::jsonb,
      'scheduled',
      v_user_id
    );

  -- ========================================
  -- 7. 創建日程優化記錄
  -- ========================================
  
  INSERT INTO schedule_optimizations (
    company_id, user_id, optimization_date, original_schedule, optimized_schedule,
    optimization_type, improvements, time_saved_minutes, efficiency_score, ai_recommendations
  )
  VALUES
    (
      v_company_id,
      v_user_id,
      CURRENT_DATE,
      '{"events": [{"time": "09:00", "duration": 30, "title": "會議1"}, {"time": "10:00", "duration": 30, "title": "會議2"}, {"time": "14:00", "duration": 60, "title": "會議3"}]}'::jsonb,
      '{"events": [{"time": "09:00", "duration": 90, "title": "集中會議時間"}, {"time": "14:00", "duration": 180, "title": "專注工作時段"}]}'::jsonb,
      'meeting_consolidation',
      '{"timeSavedMinutes": 60, "meetingsConsolidated": 2, "focusTimeAdded": 120}'::jsonb,
      60,
      85.5,
      ARRAY['建議將零散會議合併', '下午安排連續工作時間', '減少會議切換成本']
    ),
    (
      v_company_id,
      v_user_id,
      CURRENT_DATE - 7,
      '{"events": [{"time": "09:00", "duration": 60}, {"time": "11:00", "duration": 30}, {"time": "14:00", "duration": 90}]}'::jsonb,
      '{"events": [{"time": "09:00", "duration": 120, "type": "focus"}, {"time": "14:00", "duration": 90, "type": "meeting"}]}'::jsonb,
      'time_blocking',
      '{"timeSavedMinutes": 90, "efficiencyScore": 88, "focusTimeAdded": 180}'::jsonb,
      90,
      88.0,
      ARRAY['上午安排深度工作', '下午處理溝通事務', '保持精力管理節奏']
    );

  -- ========================================
  -- 8. 創建 AI 對話記錄
  -- ========================================
  
  INSERT INTO agent_conversations (
    company_id, user_id, conversation_type, messages, context, resolved, satisfaction_rating
  )
  VALUES
    (
      v_company_id,
      v_user_id,
      'task_creation',
      '[{"role": "user", "content": "幫我生成本週的銷售報表"}, {"role": "assistant", "content": "好的，我將為您生成本週的銷售報表。請問需要包含哪些數據維度？"}]'::jsonb,
      '{"taskType": "report", "priority": "high"}'::jsonb,
      true,
      5
    ),
    (
      v_company_id,
      v_user_id,
      'document_help',
      '[{"role": "user", "content": "這份合約有什麼問題嗎？"}, {"role": "assistant", "content": "我已經審核了合約，發現以下需要注意的地方..."}]'::jsonb,
      '{"documentId": "sample_doc_id"}'::jsonb,
      true,
      4
    ),
    (
      v_company_id,
      v_user_id,
      'query',
      '[{"role": "user", "content": "如何提高郵件回覆效率？"}, {"role": "assistant", "content": "建議使用郵件模板和AI起草功能..."}]'::jsonb,
      '{"topic": "email_efficiency"}'::jsonb,
      true,
      5
    );

  RAISE NOTICE '✅ 成功創建 Office Agent 示例數據！';
  RAISE NOTICE '   - 辦公任務: 8 個';
  RAISE NOTICE '   - 文檔: 5 個';
  RAISE NOTICE '   - 會議記錄: 3 個';
  RAISE NOTICE '   - 報表模板: 3 個';
  RAISE NOTICE '   - 生成報表: 5 個';
  RAISE NOTICE '   - 郵件草稿: 3 個';
  RAISE NOTICE '   - 日程優化: 2 個';
  RAISE NOTICE '   - AI 對話: 3 個';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 現在可以使用 fengsmal 帳號登錄測試 AI Office Agent！';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ 錯誤: %', SQLERRM;
    RAISE;
END $$;

