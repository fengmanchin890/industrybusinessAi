-- ==========================================
-- AI 風險評估系統 - 快速設置 SQL
-- ==========================================
-- 在 Supabase Dashboard SQL Editor 中執行此檔案
-- ==========================================

-- 確保 UUID 擴展已啟用
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. 風險模型種子數據
-- ==========================================
INSERT INTO risk_models (model_code, model_name, model_description, risk_category, is_active, is_default)
VALUES
  ('credit_std', '標準信用風險模型', '基於財務指標的標準信用風險評估模型', 'credit', true, true),
  ('market_var', '市場風險 VaR 模型', '使用 VaR 方法評估市場風險', 'market', true, true),
  ('operational_std', '操作風險標準模型', '評估操作流程和內控風險', 'operational', true, false),
  ('fraud_ml', 'ML 詐欺檢測模型', '使用機器學習檢測詐欺行為', 'fraud', true, true),
  ('compliance_kyc', 'KYC 合規檢查模型', 'Know Your Customer 合規性檢查', 'compliance', true, true)
ON CONFLICT (model_code) DO NOTHING;

-- ==========================================
-- 2. 風險限額設置（為金融公司）
-- ==========================================
DO $$
DECLARE
  v_company_id UUID;
BEGIN
  -- 獲取金融公司 ID
  SELECT id INTO v_company_id 
  FROM companies 
  WHERE industry = 'finance' 
  LIMIT 1;
  
  IF v_company_id IS NOT NULL THEN
    -- 插入風險限額
    INSERT INTO risk_limits (company_id, limit_code, limit_name, limit_description, limit_type, limit_value, limit_currency, warning_threshold)
    VALUES
      (v_company_id, 'credit_individual', '個人信貸限額', '單一個人客戶最高貸款額度', 'credit', 10000000, 'TWD', 80.00),
      (v_company_id, 'credit_business', '企業貸款限額', '單一企業客戶最高貸款額度', 'credit', 50000000, 'TWD', 80.00),
      (v_company_id, 'daily_transaction', '日交易限額', '單日總交易金額限制', 'transaction', 100000000, 'TWD', 85.00),
      (v_company_id, 'var_daily', '每日 VaR 限額', '單日市場風險價值限額', 'var', 5000000, 'TWD', 75.00),
      (v_company_id, 'concentration', '集中度限額', '單一客戶敞口占比限制', 'concentration', 20, '%', 90.00)
    ON CONFLICT (limit_code) DO NOTHING;
    
    RAISE NOTICE '✅ 已為公司 % 設置風險限額', v_company_id;
  ELSE
    RAISE NOTICE '⚠️ 未找到金融公司，跳過限額設置';
  END IF;
END $$;

-- ==========================================
-- 3. 測試客戶風險評估數據
-- ==========================================
DO $$
DECLARE
  v_company_id UUID;
  v_model_id UUID;
BEGIN
  SELECT id INTO v_company_id FROM companies WHERE industry = 'finance' LIMIT 1;
  SELECT id INTO v_model_id FROM risk_models WHERE model_code = 'credit_std' LIMIT 1;
  
  IF v_company_id IS NOT NULL AND v_model_id IS NOT NULL THEN
    -- 插入測試評估數據
    INSERT INTO customer_risk_assessments (
      company_id, customer_id, customer_name, customer_type,
      risk_model_id, overall_risk_score, risk_level, risk_rating,
      credit_risk_score, operational_risk_score, compliance_risk_score, fraud_risk_score,
      ai_confidence_score, ai_summary, assessment_status, monitoring_level
    ) VALUES
      (
        v_company_id, 'CUST-001', '低風險客戶A', 'individual',
        v_model_id, 25, 'low', 'A',
        20, 15, 10, 10,
        90, '客戶信用良好，風險可控', 'approved', 'standard'
      ),
      (
        v_company_id, 'CUST-002', '中風險客戶B', 'individual',
        v_model_id, 55, 'medium', 'B',
        50, 45, 35, 25,
        85, '客戶需要人工審核，建議補充財務證明', 'review_required', 'enhanced'
      ),
      (
        v_company_id, 'CUST-003', '高風險客戶C', 'business',
        v_model_id, 75, 'high', 'C',
        70, 65, 60, 55,
        80, '客戶風險較高，建議拒絕或要求額外擔保', 'rejected', 'intensive'
      )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ 已創建測試客戶風險評估數據';
  END IF;
END $$;

-- ==========================================
-- 4. 測試風險警報
-- ==========================================
DO $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT id INTO v_company_id FROM companies WHERE industry = 'finance' LIMIT 1;
  
  IF v_company_id IS NOT NULL THEN
    INSERT INTO risk_alerts (
      company_id, alert_type, severity, customer_id,
      alert_title, alert_message, risk_score, risk_factors,
      status, priority
    ) VALUES
      (
        v_company_id, 'credit_risk', 'high', 'CUST-003',
        '高風險客戶警報', '客戶 CUST-003 風險評分達 75，建議審慎評估',
        75, ARRAY['高信用風險', '財務狀況不佳', '合規問題'],
        'new', 'high'
      ),
      (
        v_company_id, 'limit_breach', 'medium', 'CUST-002',
        '限額接近警告', '客戶 CUST-002 已使用 85% 的信貸額度',
        85, ARRAY['額度使用率高'],
        'new', 'normal'
      )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ 已創建測試風險警報';
  END IF;
END $$;

-- ==========================================
-- 5. 初始化風險統計指標
-- ==========================================
DO $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT id INTO v_company_id FROM companies WHERE industry = 'finance' LIMIT 1;
  
  IF v_company_id IS NOT NULL THEN
    INSERT INTO risk_metrics (
      company_id, metric_date, metric_period,
      total_customers, high_risk_customers, avg_customer_risk_score,
      total_transactions, flagged_transactions,
      total_alerts, critical_alerts,
      ai_accuracy_rate, ai_avg_confidence
    ) VALUES
      (
        v_company_id, CURRENT_DATE, 'daily',
        3, 1, 51.67,
        0, 0,
        2, 0,
        85.00, 85.00
      )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ 已初始化風險統計指標';
  END IF;
END $$;

-- ==========================================
-- 6. 驗證設置
-- ==========================================
DO $$
DECLARE
  model_count INTEGER;
  limit_count INTEGER;
  assessment_count INTEGER;
  alert_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO model_count FROM risk_models;
  SELECT COUNT(*) INTO limit_count FROM risk_limits;
  SELECT COUNT(*) INTO assessment_count FROM customer_risk_assessments;
  SELECT COUNT(*) INTO alert_count FROM risk_alerts;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ AI 風險評估系統設置完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 數據統計：';
  RAISE NOTICE '   • 風險模型：% 個', model_count;
  RAISE NOTICE '   • 風險限額：% 個', limit_count;
  RAISE NOTICE '   • 客戶評估：% 筆', assessment_count;
  RAISE NOTICE '   • 風險警報：% 個', alert_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 系統已就緒！';
  RAISE NOTICE '';
  RAISE NOTICE '📝 下一步：';
  RAISE NOTICE '   1. Edge Function 已部署 ✅';
  RAISE NOTICE '   2. 測試 API 調用';
  RAISE NOTICE '   3. 整合到前端模組';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 開始使用 AI 風險評估系統！';
  RAISE NOTICE '========================================';
END $$;


