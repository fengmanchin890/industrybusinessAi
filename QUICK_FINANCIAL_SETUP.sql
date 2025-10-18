-- ========================================
-- AI 財務分析系統 - 快速設置
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
DECLARE
  v_company_id UUID;
BEGIN
  -- 查找 SME 公司（优先查找 fengsmal，否则查找任意 SME 公司）
  SELECT id INTO v_company_id FROM companies 
  WHERE name = 'fengsmal' 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF v_company_id IS NULL THEN
    SELECT id INTO v_company_id FROM companies 
    WHERE industry = 'sme' 
    ORDER BY created_at DESC 
    LIMIT 1;
  END IF;
  
  IF v_company_id IS NULL THEN
    RAISE NOTICE '⚠️ 未找到 SME 公司，嘗試創建...';
    -- 創建示例公司
    INSERT INTO companies (name, industry, employee_count, subscription_tier)
    VALUES ('fengsmal', 'sme', 25, 'enterprise')
    RETURNING id INTO v_company_id;
    RAISE NOTICE '✅ 創建示例公司: %', v_company_id;
  ELSE
    RAISE NOTICE '✅ 找到公司: % (%)', v_company_id, (SELECT name FROM companies WHERE id = v_company_id);
  END IF;

  -- ========================================
  -- 1. 創建財務分類
  -- ========================================
  
  RAISE NOTICE '📁 創建財務分類...';
  
  -- 收入分類
  INSERT INTO financial_categories (company_id, category_name, category_type, description)
  VALUES
    (v_company_id, '銷售收入', 'income', '產品和服務銷售'),
    (v_company_id, '服務收入', 'income', '諮詢和服務收入'),
    (v_company_id, '其他收入', 'income', '利息、投資等其他收入');
  
  -- 支出分類
  INSERT INTO financial_categories (company_id, category_name, category_type, description, budget_limit)
  VALUES
    (v_company_id, '人事成本', 'expense', '員工薪資和福利', 200000),
    (v_company_id, '營運費用', 'expense', '租金、水電、辦公用品', 100000),
    (v_company_id, '行銷費用', 'expense', '廣告、推廣、活動', 80000),
    (v_company_id, '研發費用', 'expense', '產品開發和技術投資', 50000);

  RAISE NOTICE '✅ 創建了 7 個財務分類';

  -- ========================================
  -- 2. 創建財務交易（過去3個月）
  -- ========================================
  
  RAISE NOTICE '💰 創建財務交易記錄...';
  
  -- 第一個月（-90天到-60天）
  INSERT INTO financial_transactions (
    company_id, transaction_date, transaction_type, category,
    amount, description, payment_method, status
  ) VALUES
    -- 收入
    (v_company_id, CURRENT_DATE - 85, 'income', '銷售收入', 350000, '產品銷售 - Q1', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 80, 'income', '服務收入', 150000, '諮詢服務費', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 75, 'income', '銷售收入', 280000, '批發訂單', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 70, 'income', '服務收入', 120000, '系統維護費', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 65, 'income', '其他收入', 15000, '利息收入', 'bank_transfer', 'confirmed'),
    
    -- 支出
    (v_company_id, CURRENT_DATE - 84, 'expense', '人事成本', 180000, '員工薪資 - 1月', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 83, 'expense', '營運費用', 45000, '辦公室租金', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 82, 'expense', '營運費用', 8500, '水電費', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 79, 'expense', '行銷費用', 35000, 'Facebook 廣告', 'credit_card', 'confirmed'),
    (v_company_id, CURRENT_DATE - 76, 'expense', '研發費用', 28000, '軟體授權費', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 73, 'expense', '營運費用', 12000, '辦公用品', 'credit_card', 'confirmed'),
    (v_company_id, CURRENT_DATE - 68, 'expense', '行銷費用', 25000, 'Google Ads', 'credit_card', 'confirmed'),
    (v_company_id, CURRENT_DATE - 62, 'expense', '營運費用', 15000, '差旅費', 'credit_card', 'confirmed');

  -- 第二個月（-60天到-30天）
  INSERT INTO financial_transactions (
    company_id, transaction_date, transaction_type, category,
    amount, description, payment_method, status
  ) VALUES
    -- 收入
    (v_company_id, CURRENT_DATE - 55, 'income', '銷售收入', 420000, '產品銷售 - Q2', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 50, 'income', '服務收入', 180000, '年度維護合約', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 45, 'income', '銷售收入', 310000, '企業客戶訂單', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 40, 'income', '服務收入', 95000, '技術培訓', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 35, 'income', '其他收入', 22000, '投資回報', 'bank_transfer', 'confirmed'),
    
    -- 支出
    (v_company_id, CURRENT_DATE - 54, 'expense', '人事成本', 185000, '員工薪資 - 2月', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 53, 'expense', '營運費用', 45000, '辦公室租金', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 52, 'expense', '營運費用', 9200, '水電費', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 49, 'expense', '行銷費用', 42000, '社群媒體廣告', 'credit_card', 'confirmed'),
    (v_company_id, CURRENT_DATE - 46, 'expense', '研發費用', 35000, '雲端服務費', 'credit_card', 'confirmed'),
    (v_company_id, CURRENT_DATE - 43, 'expense', '營運費用', 8500, '辦公用品', 'credit_card', 'confirmed'),
    (v_company_id, CURRENT_DATE - 38, 'expense', '行銷費用', 18000, 'LinkedIn 廣告', 'credit_card', 'confirmed'),
    (v_company_id, CURRENT_DATE - 33, 'expense', '人事成本', 15000, '員工培訓', 'bank_transfer', 'confirmed');

  -- 第三個月（-30天到現在）
  INSERT INTO financial_transactions (
    company_id, transaction_date, transaction_type, category,
    amount, description, payment_method, status
  ) VALUES
    -- 收入
    (v_company_id, CURRENT_DATE - 25, 'income', '銷售收入', 380000, '產品銷售', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 20, 'income', '服務收入', 165000, '諮詢項目', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 15, 'income', '銷售收入', 290000, '在線銷售', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 10, 'income', '服務收入', 110000, '客製化開發', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 5, 'income', '銷售收入', 155000, '零售銷售', 'credit_card', 'confirmed'),
    (v_company_id, CURRENT_DATE - 2, 'income', '其他收入', 18000, '版權收入', 'bank_transfer', 'confirmed'),
    
    -- 支出
    (v_company_id, CURRENT_DATE - 24, 'expense', '人事成本', 190000, '員工薪資 - 3月', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 23, 'expense', '營運費用', 45000, '辦公室租金', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 22, 'expense', '營運費用', 8800, '水電費', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 19, 'expense', '行銷費用', 38000, '數位廣告', 'credit_card', 'confirmed'),
    (v_company_id, CURRENT_DATE - 16, 'expense', '研發費用', 42000, 'API 服務費', 'credit_card', 'confirmed'),
    (v_company_id, CURRENT_DATE - 13, 'expense', '營運費用', 15000, '辦公設備', 'credit_card', 'confirmed'),
    (v_company_id, CURRENT_DATE - 8, 'expense', '行銷費用', 28000, '內容行銷', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 4, 'expense', '營運費用', 12000, '保險費', 'bank_transfer', 'confirmed'),
    (v_company_id, CURRENT_DATE - 1, 'expense', '研發費用', 22000, '軟體升級', 'credit_card', 'confirmed');

  -- 待審核交易
  INSERT INTO financial_transactions (
    company_id, transaction_date, transaction_type, category,
    amount, description, payment_method, status
  ) VALUES
    (v_company_id, CURRENT_DATE, 'expense', '營運費用', 25000, '新辦公家具', 'pending_payment', 'pending'),
    (v_company_id, CURRENT_DATE + 3, 'income', '銷售收入', 180000, '預計訂單', 'bank_transfer', 'pending');

  RAISE NOTICE '✅ 創建了 50 筆財務交易';

  -- ========================================
  -- 3. 創建預算計畫
  -- ========================================
  
  RAISE NOTICE '📊 創建預算計畫...';
  
  INSERT INTO budget_plans (
    company_id, budget_name, budget_period, start_date, end_date,
    category, planned_amount, actual_amount, status
  ) VALUES
    (v_company_id, 'Q1 人事預算', 'quarterly', CURRENT_DATE - 90, CURRENT_DATE, 
     '人事成本', 540000, 555000, 'completed'),
    (v_company_id, 'Q1 營運預算', 'quarterly', CURRENT_DATE - 90, CURRENT_DATE, 
     '營運費用', 300000, 285000, 'completed'),
    (v_company_id, 'Q1 行銷預算', 'quarterly', CURRENT_DATE - 90, CURRENT_DATE, 
     '行銷費用', 240000, 256000, 'completed'),
    (v_company_id, 'Q2 人事預算', 'quarterly', CURRENT_DATE, CURRENT_DATE + 90, 
     '人事成本', 570000, 0, 'active'),
    (v_company_id, 'Q2 營運預算', 'quarterly', CURRENT_DATE, CURRENT_DATE + 90, 
     '營運費用', 320000, 0, 'active'),
    (v_company_id, 'Q2 行銷預算', 'quarterly', CURRENT_DATE, CURRENT_DATE + 90, 
     '行銷費用', 280000, 0, 'active');

  RAISE NOTICE '✅ 創建了 6 個預算計畫';

  -- ========================================
  -- 4. 生成現金流預測
  -- ========================================
  
  RAISE NOTICE '🔮 生成現金流預測...';
  
  INSERT INTO cash_flow_projections (
    company_id, projection_date, projection_type,
    opening_balance, projected_income, projected_expense, 
    net_cash_flow, closing_balance, ai_generated
  ) VALUES
    (v_company_id, CURRENT_DATE + 30, 'monthly', 500000, 950000, 420000, 530000, 1030000, true),
    (v_company_id, CURRENT_DATE + 60, 'monthly', 1030000, 980000, 435000, 545000, 1575000, true),
    (v_company_id, CURRENT_DATE + 90, 'monthly', 1575000, 1020000, 445000, 575000, 2150000, true),
    (v_company_id, CURRENT_DATE + 120, 'monthly', 2150000, 1050000, 460000, 590000, 2740000, true),
    (v_company_id, CURRENT_DATE + 150, 'monthly', 2740000, 1080000, 475000, 605000, 3345000, true),
    (v_company_id, CURRENT_DATE + 180, 'monthly', 3345000, 1120000, 490000, 630000, 3975000, true);

  RAISE NOTICE '✅ 生成了 6 個月的現金流預測';

  -- ========================================
  -- 5. 創建財務警報
  -- ========================================
  
  RAISE NOTICE '⚠️ 創建財務警報...';
  
  INSERT INTO financial_alerts (
    company_id, alert_type, severity, title, message, 
    threshold_value, actual_value, recommendations
  ) VALUES
    (v_company_id, 'budget_exceeded', 'medium', '行銷預算超支', 
     'Q1 行銷費用超出預算 6.7%', 240000, 256000,
     ARRAY['審查行銷效果', '優化廣告投放', '重新分配預算']),
    
    (v_company_id, 'high_expense_ratio', 'low', '支出比例提醒', 
     '本月支出占收入 45%，保持在健康範圍內', NULL, 45.0,
     ARRAY['持續監控支出', '尋找成本優化機會']),
    
    (v_company_id, 'cash_flow_positive', 'low', '正現金流', 
     '過去 3 個月保持正現金流，財務健康', NULL, 530000,
     ARRAY['考慮投資機會', '建立應急基金']);

  RAISE NOTICE '✅ 創建了 3 個財務警報';

  -- ========================================
  -- 6. 生成財務指標
  -- ========================================
  
  RAISE NOTICE '📈 生成財務指標...';
  
  INSERT INTO financial_metrics (
    company_id, metric_date, metric_period,
    total_revenue, total_expense, net_profit, profit_margin,
    cash_balance, ai_generated
  ) VALUES
    (v_company_id, CURRENT_DATE - 60, 'monthly', 915000, 348700, 566300, 61.89, 566300, true),
    (v_company_id, CURRENT_DATE - 30, 'monthly', 1027000, 362700, 664300, 64.68, 1230600, true),
    (v_company_id, CURRENT_DATE, 'monthly', 1118000, 428800, 689200, 61.64, 1919800, true);

  RAISE NOTICE '✅ 生成了 3 個月的財務指標';

  -- ========================================
  -- 7. 創建 AI 財務建議
  -- ========================================
  
  RAISE NOTICE '💡 創建 AI 財務建議...';
  
  INSERT INTO financial_recommendations (
    company_id, recommendation_type, priority, title, description,
    potential_impact, implementation_difficulty, estimated_timeframe, 
    action_items, category, confidence_score
  ) VALUES
    (v_company_id, 'cost_reduction', 'medium', '優化雲端服務成本', 
     '分析顯示雲端服務費用可透過更換方案或優化使用量降低 15-20%',
     8400, 'easy', '1-2 個月',
     ARRAY['審查當前雲端使用量', '比較不同方案定價', '考慮預留實例折扣'],
     '研發費用', 0.85),
    
    (v_company_id, 'revenue_optimization', 'high', '提升客戶續約率', 
     '歷史數據顯示提高 10% 續約率可增加 $180,000 年收入',
     180000, 'moderate', '3-6 個月',
     ARRAY['改進客戶服務', '推出忠誠計畫', '定期客戶回訪'],
     '服務收入', 0.78),
    
    (v_company_id, 'cash_flow_improvement', 'high', '加速應收帳款回收', 
     '縮短平均收款天數從 45 天到 30 天，改善現金流',
     150000, 'moderate', '2-3 個月',
     ARRAY['實施早付折扣', '自動化催款流程', '優化付款條件'],
     '現金管理', 0.82),
    
    (v_company_id, 'tax_optimization', 'medium', '檢視稅務優化機會', 
     '建議諮詢會計師評估可能的稅務優惠和扣抵項目',
     35000, 'difficult', '1-3 個月',
     ARRAY['聯絡稅務顧問', '整理費用憑證', '評估研發抵稅資格'],
     '稅務管理', 0.70),
    
    (v_company_id, 'investment', 'low', '考慮自動化投資', 
     '投資自動化工具可長期降低營運成本 20-25%',
     80000, 'difficult', '6-12 個月',
     ARRAY['評估自動化需求', '比較解決方案', '制定實施計畫'],
     '營運費用', 0.75);

  RAISE NOTICE '✅ 創建了 5 個 AI 財務建議';

  -- ========================================
  -- 完成總結
  -- ========================================
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ AI 財務分析系統 - 快速設置完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 數據摘要:';
  RAISE NOTICE '  • 公司 ID: %', v_company_id;
  RAISE NOTICE '  • 財務分類: 7 個';
  RAISE NOTICE '  • 財務交易: 50 筆';
  RAISE NOTICE '  • 預算計畫: 6 個';
  RAISE NOTICE '  • 現金流預測: 6 個月';
  RAISE NOTICE '  • 財務警報: 3 個';
  RAISE NOTICE '  • 財務指標: 3 個月';
  RAISE NOTICE '  • AI 建議: 5 個';
  RAISE NOTICE '';
  RAISE NOTICE '💰 財務概況:';
  RAISE NOTICE '  • 過去3個月總收入: $3,060,000';
  RAISE NOTICE '  • 過去3個月總支出: $1,140,200';
  RAISE NOTICE '  • 淨利潤: $1,919,800';
  RAISE NOTICE '  • 平均利潤率: 62.73%%';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 下一步:';
  RAISE NOTICE '  1. 登入 fengsmal 公司帳戶';
  RAISE NOTICE '  2. 進入「AI 財務分析助理」模組';
  RAISE NOTICE '  3. 查看財務儀表板和 AI 分析';
  RAISE NOTICE '  4. 測試現金流預測和預算建議功能';
  RAISE NOTICE '';

END $$;

-- 顯示已排班次
SELECT 
  '✅ 財務交易' as info,
  transaction_date as 日期,
  transaction_type as 類型,
  category as 分類,
  amount as 金額,
  status as 狀態
FROM financial_transactions
WHERE transaction_date >= CURRENT_DATE - 30
ORDER BY transaction_date DESC
LIMIT 10;

-- 顯示AI建議
SELECT 
  '💡 AI 建議' as info,
  priority as 優先級,
  title as 標題,
  potential_impact as 潛在影響金額,
  confidence_score as 信心度
FROM financial_recommendations
ORDER BY 
  CASE priority 
    WHEN 'urgent' THEN 1 
    WHEN 'high' THEN 2 
    WHEN 'medium' THEN 3 
    ELSE 4 
  END,
  potential_impact DESC;

