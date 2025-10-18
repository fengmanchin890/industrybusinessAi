-- ==========================================
-- AI 詐欺偵測引擎 - 快速設置腳本
-- ==========================================
-- 用途：一鍵部署完整的詐欺偵測系統
-- 公司：fengfinancial company
-- ==========================================

DO $$
DECLARE
  v_company_id UUID;
  v_user_id UUID;
  v_transaction1_id UUID;
  v_transaction2_id UUID;
  v_transaction3_id UUID;
  v_transaction4_id UUID;
  v_transaction5_id UUID;
BEGIN
  -- ==========================================
  -- 1. 確保公司存在
  -- ==========================================
  RAISE NOTICE '開始設置 AI 詐欺偵測系統...';
  
  -- 嘗試查找 'fengfinancial company' 或 'fengfinancial'
  SELECT id INTO v_company_id
  FROM companies
  WHERE name IN ('fengfinancial company', 'fengfinancial')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_company_id IS NULL THEN
    -- 如果不存在，創建公司
    INSERT INTO companies (name, industry_type, company_size, status)
    VALUES ('fengfinancial company', 'Finance', 'medium', 'active')
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO v_company_id;
    
    -- 如果仍然沒有 ID，再次查詢
    IF v_company_id IS NULL THEN
      SELECT id INTO v_company_id
      FROM companies
      WHERE name = 'fengfinancial company'
      LIMIT 1;
    END IF;
    
    RAISE NOTICE '創建公司: fengfinancial company (ID: %)', v_company_id;
  ELSE
    RAISE NOTICE '找到公司: fengfinancial company (ID: %)', v_company_id;
  END IF;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'fengfinancial company 不存在且無法創建';
  END IF;

  -- 獲取公司的一個用戶ID（用於測試）
  SELECT id INTO v_user_id
  FROM users
  WHERE company_id = v_company_id
  LIMIT 1;

  -- ==========================================
  -- 2. 插入測試交易數據
  -- ==========================================
  RAISE NOTICE '插入測試交易數據...';

  -- 交易 1: 正常小額交易
  INSERT INTO transactions (
    company_id, transaction_id, user_id, transaction_type,
    amount, currency, source_account, destination_account,
    ip_address, device_id, location, merchant_name, merchant_category,
    card_last4, transaction_status, risk_score, fraud_probability,
    is_fraudulent, transaction_time
  ) VALUES (
    v_company_id, 'TXN202501001', v_user_id, 'purchase',
    1500.00, 'TWD', 'ACC001', 'MERCHANT001',
    '192.168.1.100'::INET, 'DEVICE001',
    '{"country": "Taiwan", "city": "Taipei", "lat": 25.033, "lon": 121.565}'::JSONB,
    '7-Eleven', 'Convenience Store', '1234',
    'completed', 15, 10, false,
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
  ) RETURNING id INTO v_transaction1_id;

  -- 交易 2: 異常大額交易 (高風險)
  INSERT INTO transactions (
    company_id, transaction_id, user_id, transaction_type,
    amount, currency, source_account, destination_account,
    ip_address, device_id, location, merchant_name,
    transaction_status, risk_score, fraud_probability,
    is_fraudulent, flagged_reason, transaction_time
  ) VALUES (
    v_company_id, 'TXN202501002', v_user_id, 'transfer',
    50000.00, 'TWD', 'ACC001', 'ACC999',
    '103.45.67.89'::INET, 'DEVICE002',
    '{"country": "Philippines", "city": "Manila", "lat": 14.599, "lon": 120.984}'::JSONB,
    'Unknown',
    'flagged', 85, 80, false,
    '高額交易, 異常地理位置, 非營業時間交易',
    CURRENT_TIMESTAMP - INTERVAL '1 hour'
  ) RETURNING id INTO v_transaction2_id;

  -- 交易 3: 凌晨時段異常交易
  INSERT INTO transactions (
    company_id, transaction_id, user_id, transaction_type,
    amount, currency, source_account, destination_account,
    ip_address, device_id, location, merchant_name,
    transaction_status, risk_score, fraud_probability,
    is_fraudulent, flagged_reason, transaction_time
  ) VALUES (
    v_company_id, 'TXN202501003', v_user_id, 'withdrawal',
    25000.00, 'TWD', 'ACC001', 'ATM001',
    '192.168.1.100'::INET, 'ATM-DEVICE',
    '{"country": "Taiwan", "city": "Taichung"}'::JSONB,
    'ATM Withdrawal',
    'investigating', 65, 55, false,
    '非營業時間交易, 金額遠超常規',
    CURRENT_TIMESTAMP - INTERVAL '30 minutes'
  ) RETURNING id INTO v_transaction3_id;

  -- 交易 4: 快速連續交易
  INSERT INTO transactions (
    company_id, transaction_id, user_id, transaction_type,
    amount, currency, source_account, destination_account,
    ip_address, device_id, location, merchant_name,
    transaction_status, risk_score, fraud_probability,
    transaction_time
  ) VALUES (
    v_company_id, 'TXN202501004', v_user_id, 'purchase',
    3500.00, 'TWD', 'ACC001', 'MERCHANT002',
    '192.168.1.100'::INET, 'DEVICE001',
    '{"country": "Taiwan", "city": "Taipei"}'::JSONB,
    'Electronics Store',
    'completed', 30, 25, false,
    CURRENT_TIMESTAMP - INTERVAL '10 minutes'
  ) RETURNING id INTO v_transaction4_id;

  -- 交易 5: 另一筆快速交易 (疑似刷卡盜用)
  INSERT INTO transactions (
    company_id, transaction_id, user_id, transaction_type,
    amount, currency, source_account, destination_account,
    ip_address, device_id, location, merchant_name,
    transaction_status, risk_score, fraud_probability,
    flagged_reason, transaction_time
  ) VALUES (
    v_company_id, 'TXN202501005', v_user_id, 'purchase',
    8900.00, 'TWD', 'ACC001', 'MERCHANT003',
    '192.168.1.105'::INET, 'DEVICE003',
    '{"country": "Taiwan", "city": "Kaohsiung"}'::JSONB',
    'Luxury Goods',
    'pending', 70, 65, false,
    '短時間內頻繁交易, 異常地理位置',
    CURRENT_TIMESTAMP - INTERVAL '5 minutes'
  ) RETURNING id INTO v_transaction5_id;

  RAISE NOTICE '已插入 % 筆交易記錄', 5;

  -- ==========================================
  -- 3. 插入詐欺規則
  -- ==========================================
  RAISE NOTICE '插入詐欺規則...';

  INSERT INTO fraud_rules (
    company_id, rule_name, rule_type, description,
    conditions, action, severity, priority, is_active
  ) VALUES
  (
    v_company_id, '大額交易檢測', 'amount_threshold',
    '檢測超過設定金額的交易',
    '{"threshold": 30000, "currency": "TWD"}'::JSONB,
    'flag', 'high', 90, true
  ),
  (
    v_company_id, '異常地理位置', 'location',
    '檢測來自異常國家/地區的交易',
    '{"allowed_countries": ["Taiwan", "TW"], "block_vpn": true}'::JSONB,
    'block', 'critical', 95, true
  ),
  (
    v_company_id, '交易速度檢測', 'velocity',
    '檢測短時間內的多筆交易',
    '{"max_transactions": 5, "time_window_minutes": 10}'::JSONB,
    'review', 'medium', 70, true
  ),
  (
    v_company_id, '非營業時間交易', 'pattern',
    '檢測凌晨時段的大額交易',
    '{"blocked_hours": [0, 1, 2, 3, 4, 5], "min_amount": 10000}'::JSONB,
    'flag', 'high', 80, true
  ),
  (
    v_company_id, '設備異常檢測', 'device',
    '檢測新設備或異常設備的交易',
    '{"require_device_verification": true}'::JSONB,
    'notify', 'low', 50, true
  );

  RAISE NOTICE '已插入 % 條詐欺規則', 5;

  -- ==========================================
  -- 4. 插入詐欺案例
  -- ==========================================
  RAISE NOTICE '插入詐欺案例...';

  INSERT INTO fraud_cases (
    company_id, case_number, transaction_id, user_id,
    case_status, severity, fraud_type, total_amount,
    affected_transactions, detection_method,
    ai_analysis, evidence
  ) VALUES
  (
    v_company_id, 'CASE-2025-001', v_transaction2_id, v_user_id,
    'investigating', 'high', 'suspicious_transfer', 50000.00,
    1, 'ai_model',
    '{"risk_score": 85, "confidence": 0.82, "recommendations": ["立即聯繫客戶確認", "暫時凍結帳戶"]}'::JSONB,
    '{"transaction_amount": 50000, "unusual_location": true, "unusual_time": true}'::JSONB
  ),
  (
    v_company_id, 'CASE-2025-002', v_transaction5_id, v_user_id,
    'open', 'medium', 'rapid_transactions', 12400.00,
    2, 'rule_based',
    '{"risk_score": 70, "velocity_alert": true}'::JSONB,
    '{"time_span_minutes": 5, "location_change": true}'::JSONB
  );

  RAISE NOTICE '已插入 % 個詐欺案例', 2;

  -- ==========================================
  -- 5. 插入詐欺警報
  -- ==========================================
  RAISE NOTICE '插入詐欺警報...';

  INSERT INTO fraud_alerts (
    company_id, transaction_id, fraud_case_id, alert_type,
    severity, message, details, status
  ) VALUES
  (
    v_company_id, v_transaction2_id, 
    (SELECT id FROM fraud_cases WHERE case_number = 'CASE-2025-001' AND company_id = v_company_id),
    'high_risk_transaction', 'critical',
    '檢測到高風險交易: NT$50,000 轉帳至菲律賓',
    '{"risk_factors": ["高額交易", "異常地理位置", "非營業時間交易"], "fraud_probability": 80}'::JSONB,
    'new'
  ),
  (
    v_company_id, v_transaction3_id, NULL,
    'unusual_time_transaction', 'high',
    '凌晨時段異常提款: NT$25,000',
    '{"risk_factors": ["非營業時間交易", "金額遠超常規"]}'::JSONB,
    'new'
  ),
  (
    v_company_id, v_transaction5_id,
    (SELECT id FROM fraud_cases WHERE case_number = 'CASE-2025-002' AND company_id = v_company_id),
    'velocity_check', 'medium',
    '短時間內多筆交易，疑似盜刷',
    '{"transaction_count": 2, "time_span": "5 minutes", "total_amount": 12400}'::JSONB,
    'investigating'
  );

  RAISE NOTICE '已插入 % 條詐欺警報', 3;

  -- ==========================================
  -- 6. 插入用戶行為檔案
  -- ==========================================
  RAISE NOTICE '插入用戶行為檔案...';

  IF v_user_id IS NOT NULL THEN
    INSERT INTO user_behavior_profiles (
      company_id, user_id, profile_data,
      typical_transaction_amount, typical_transaction_frequency,
      common_merchants, common_locations, common_devices,
      risk_level
    ) VALUES (
      v_company_id, v_user_id,
      '{"avg_transaction_amount": 5000, "max_transaction_amount": 30000, "transaction_count": 150}'::JSONB,
      5000.00, 10,
      '["7-Eleven", "Family Mart", "Electronics Store"]'::JSONB,
      '["Taipei", "New Taipei City"]'::JSONB,
      '["DEVICE001", "DEVICE002"]'::JSONB,
      'low'
    );
    RAISE NOTICE '已插入用戶行為檔案';
  END IF;

  -- ==========================================
  -- 7. 插入統計數據
  -- ==========================================
  RAISE NOTICE '插入統計數據...';

  INSERT INTO fraud_statistics (
    company_id, stat_date, total_transactions, flagged_transactions,
    confirmed_fraud_cases, false_positives, total_fraud_amount,
    prevented_fraud_amount, accuracy_rate, response_time_avg
  ) VALUES (
    v_company_id, CURRENT_DATE, 5, 2,
    0, 0, 0.00,
    50000.00, 85.50, 15
  );

  RAISE NOTICE '已插入統計數據';

  -- ==========================================
  -- 完成
  -- ==========================================
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ AI 詐欺偵測系統設置完成！';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '公司 ID: %', v_company_id;
  RAISE NOTICE '交易記錄: 5 筆';
  RAISE NOTICE '詐欺規則: 5 條';
  RAISE NOTICE '詐欺案例: 2 個';
  RAISE NOTICE '詐欺警報: 3 條';
  RAISE NOTICE '用戶檔案: 1 個';
  RAISE NOTICE '統計數據: 1 筆';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '請登入 fengfinancial company 帳號查看系統';

END $$;

-- 驗證數據
SELECT 
  'transactions' as table_name,
  COUNT(*) as count
FROM transactions
WHERE company_id IN (SELECT id FROM companies WHERE name IN ('fengfinancial company', 'fengfinancial'))
UNION ALL
SELECT 
  'fraud_rules',
  COUNT(*)
FROM fraud_rules
WHERE company_id IN (SELECT id FROM companies WHERE name IN ('fengfinancial company', 'fengfinancial'))
UNION ALL
SELECT 
  'fraud_cases',
  COUNT(*)
FROM fraud_cases
WHERE company_id IN (SELECT id FROM companies WHERE name IN ('fengfinancial company', 'fengfinancial'))
UNION ALL
SELECT 
  'fraud_alerts',
  COUNT(*)
FROM fraud_alerts
WHERE company_id IN (SELECT id FROM companies WHERE name IN ('fengfinancial company', 'fengfinancial'))
UNION ALL
SELECT 
  'user_behavior_profiles',
  COUNT(*)
FROM user_behavior_profiles
WHERE company_id IN (SELECT id FROM companies WHERE name IN ('fengfinancial company', 'fengfinancial'));

