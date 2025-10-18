-- ==========================================
-- AI 投資分析系統 - 快速設置 SQL
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 測試投資組合數據
DO $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT id INTO v_company_id FROM companies WHERE industry = 'finance' LIMIT 1;
  
  IF v_company_id IS NOT NULL THEN
    -- 插入測試投資組合
    INSERT INTO investment_portfolios (
      company_id, customer_id, customer_name, portfolio_code, portfolio_name,
      portfolio_type, risk_tolerance, total_value, total_return_rate,
      annualized_return, volatility, sharpe_ratio, ai_portfolio_score,
      ai_recommendation, status
    ) VALUES
      (
        v_company_id, 'INV001', '穩健投資者', 'PORT-CONSERVATIVE-001', '保守型投資組合',
        'conservative', 'low', 5000000, 6.5,
        6.5, 8.5, 1.8, 85,
        'hold', 'active'
      ),
      (
        v_company_id, 'INV002', '成長投資者', 'PORT-GROWTH-002', '成長型投資組合',
        'growth', 'high', 10000000, 15.8,
        15.8, 22.3, 2.2, 78,
        'hold', 'active'
      ),
      (
        v_company_id, 'INV003', '平衡投資者', 'PORT-BALANCED-003', '平衡型投資組合',
        'balanced', 'medium', 8000000, 10.2,
        10.2, 14.5, 1.9, 72,
        'rebalance', 'active'
      )
    ON CONFLICT (portfolio_code) DO NOTHING;
    
    -- 插入資產配置
    INSERT INTO portfolio_allocations (
      portfolio_id, asset_class, asset_code, asset_name,
      quantity, purchase_price, current_price, market_value,
      weight_percent, return_rate
    )
    SELECT 
      p.id, 'stock', '2330.TW', '台積電',
      1000, 550, 600, 600000,
      12, 9.1
    FROM investment_portfolios p 
    WHERE p.portfolio_code = 'PORT-GROWTH-002'
    ON CONFLICT DO NOTHING;
    
    -- 插入市場分析
    INSERT INTO market_analysis (
      company_id, market_index, index_value, daily_change,
      market_sentiment, ai_market_outlook, ai_recommendations
    ) VALUES
      (
        v_company_id, 'TAIEX', 17850, 0.85,
        'bullish', '市場氣氛樂觀，經濟數據強勁',
        ARRAY['可考慮增加股票配置', '關注科技和消費板塊']
      )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ 已為公司創建測試投資數據';
  ELSE
    RAISE NOTICE '⚠️ 未找到金融公司';
  END IF;
END $$;

-- 驗證
DO $$
DECLARE
  portfolio_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO portfolio_count FROM investment_portfolios;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ AI 投資分析系統設置完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 投資組合：% 個', portfolio_count;
  RAISE NOTICE '🚀 系統已就緒！';
  RAISE NOTICE '========================================';
END $$;

