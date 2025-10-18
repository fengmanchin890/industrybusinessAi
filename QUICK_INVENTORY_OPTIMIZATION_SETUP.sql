-- ========================================
-- AI 庫存優化系統 - 快速設置
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
DECLARE
  v_company_id UUID;
  v_zone_id UUID;
  v_prod1_id UUID;
  v_prod2_id UUID;
  v_prod3_id UUID;
  v_prod4_id UUID;
  v_prod5_id UUID;
BEGIN
  SELECT id INTO v_company_id FROM companies WHERE industry = 'logistics' LIMIT 1;
  
  IF v_company_id IS NULL THEN
    RAISE NOTICE '⚠️ 未找到物流公司，請先創建物流公司';
    RETURN;
  END IF;

  RAISE NOTICE '✅ 找到物流公司: %', v_company_id;

  -- 獲取倉儲區域
  SELECT id INTO v_zone_id FROM warehouse_zones WHERE company_id = v_company_id LIMIT 1;

  -- ========================================
  -- 1. 創建商品
  -- ========================================
  INSERT INTO products (
    company_id, product_code, product_name, category, unit,
    unit_cost, unit_price, min_stock_level, max_stock_level,
    reorder_point, lead_time_days, shelf_life_days
  ) VALUES
    (v_company_id, 'PROD-001', '標準紙箱 (大)', '包材', '個',
     15.00, 25.00, 50, 500, 100, 3, NULL),
    (v_company_id, 'PROD-002', '標準紙箱 (中)', '包材', '個',
     10.00, 18.00, 100, 1000, 200, 3, NULL),
    (v_company_id, 'PROD-003', '標準紙箱 (小)', '包材', '個',
     8.00, 14.00, 150, 1500, 300, 3, NULL),
    (v_company_id, 'PROD-004', '氣泡膜', '包材', '捲',
     35.00, 55.00, 20, 200, 40, 5, NULL),
    (v_company_id, 'PROD-005', '封箱膠帶', '包材', '捲',
     12.00, 20.00, 100, 800, 150, 3, NULL),
    (v_company_id, 'PROD-006', '棧板', '物流設備', '個',
     180.00, 280.00, 10, 100, 20, 7, NULL),
    (v_company_id, 'PROD-007', '標籤貼紙', '耗材', '盒',
     25.00, 40.00, 30, 300, 60, 5, NULL),
    (v_company_id, 'PROD-008', '打包帶', '包材', '捲',
     45.00, 70.00, 15, 150, 30, 5, NULL),
    (v_company_id, 'PROD-009', '保護角', '包材', '包',
     55.00, 85.00, 10, 100, 20, 7, NULL),
    (v_company_id, 'PROD-010', '托運單據', '耗材', '本',
     8.00, 15.00, 50, 500, 100, 3, 180)
  ON CONFLICT (product_code) DO NOTHING;

  SELECT id INTO v_prod1_id FROM products WHERE company_id = v_company_id AND product_code = 'PROD-001';
  SELECT id INTO v_prod2_id FROM products WHERE company_id = v_company_id AND product_code = 'PROD-002';
  SELECT id INTO v_prod3_id FROM products WHERE company_id = v_company_id AND product_code = 'PROD-003';
  SELECT id INTO v_prod4_id FROM products WHERE company_id = v_company_id AND product_code = 'PROD-004';
  SELECT id INTO v_prod5_id FROM products WHERE company_id = v_company_id AND product_code = 'PROD-005';

  RAISE NOTICE '✅ 已創建 10 個商品';

  -- ========================================
  -- 2. 創建庫存記錄
  -- ========================================
  IF v_prod1_id IS NOT NULL THEN
    INSERT INTO inventory (
      company_id, product_id, warehouse_zone_id,
      current_quantity, available_quantity, reserved_quantity
    ) VALUES
      (v_company_id, v_prod1_id, v_zone_id, 45, 40, 5),    -- 低於補貨點
      (v_company_id, v_prod2_id, v_zone_id, 180, 170, 10), -- 低於補貨點
      (v_company_id, v_prod3_id, v_zone_id, 350, 330, 20), -- 正常
      (v_company_id, v_prod4_id, v_zone_id, 15, 12, 3),    -- 低於補貨點
      (v_company_id, v_prod5_id, v_zone_id, 0, 0, 0)       -- 缺貨
    ON CONFLICT (product_id, warehouse_zone_id) DO UPDATE SET
      current_quantity = EXCLUDED.current_quantity,
      available_quantity = EXCLUDED.available_quantity,
      reserved_quantity = EXCLUDED.reserved_quantity;

    RAISE NOTICE '✅ 已創建庫存記錄';
  END IF;

  -- ========================================
  -- 3. 創建出入庫記錄（模擬歷史）
  -- ========================================
  IF v_prod1_id IS NOT NULL THEN
    INSERT INTO inventory_transactions (
      company_id, product_id, transaction_type, quantity,
      unit_cost, reference_type, transaction_date
    ) VALUES
      -- 30天前的入庫
      (v_company_id, v_prod1_id, 'inbound', 200, 15.00, 'purchase_order', NOW() - INTERVAL '30 days'),
      (v_company_id, v_prod2_id, 'inbound', 500, 10.00, 'purchase_order', NOW() - INTERVAL '30 days'),
      (v_company_id, v_prod3_id, 'inbound', 800, 8.00, 'purchase_order', NOW() - INTERVAL '30 days'),
      
      -- 最近的出庫
      (v_company_id, v_prod1_id, 'outbound', -25, 15.00, 'sales_order', NOW() - INTERVAL '5 days'),
      (v_company_id, v_prod1_id, 'outbound', -30, 15.00, 'sales_order', NOW() - INTERVAL '3 days'),
      (v_company_id, v_prod2_id, 'outbound', -80, 10.00, 'sales_order', NOW() - INTERVAL '7 days'),
      (v_company_id, v_prod2_id, 'outbound', -60, 10.00, 'sales_order', NOW() - INTERVAL '2 days'),
      (v_company_id, v_prod3_id, 'outbound', -100, 8.00, 'sales_order', NOW() - INTERVAL '10 days'),
      (v_company_id, v_prod5_id, 'outbound', -150, 12.00, 'sales_order', NOW() - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ 已創建出入庫記錄';
  END IF;

  -- ========================================
  -- 4. 創建庫存指標
  -- ========================================
  INSERT INTO inventory_metrics (
    company_id, metric_date, total_products, total_stock_value,
    low_stock_items, out_of_stock_items, overstock_items,
    inventory_turnover_rate, stockout_rate, fill_rate
  ) VALUES
    (v_company_id, CURRENT_DATE - 1, 10, 45680.00, 2, 0, 0, 3.5, 2.1, 96.5),
    (v_company_id, CURRENT_DATE, 10, 42350.00, 3, 1, 0, 3.8, 5.0, 94.2)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ 已創建庫存指標';

END $$;

-- ========================================
-- 顯示摘要
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ AI 庫存優化系統設置完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 數據摘要:';
  RAISE NOTICE '  • 商品: %', (SELECT COUNT(*) FROM products);
  RAISE NOTICE '  • 庫存記錄: %', (SELECT COUNT(*) FROM inventory);
  RAISE NOTICE '  • 出入庫記錄: %', (SELECT COUNT(*) FROM inventory_transactions);
  RAISE NOTICE '';
  RAISE NOTICE '🚀 系統已就緒！可以開始使用 AI 庫存優化功能';
  RAISE NOTICE '';
END $$;

-- 顯示當前庫存狀況
SELECT 
  '📦 當前庫存狀況' as info,
  p.product_code as 商品代碼,
  p.product_name as 商品名稱,
  i.current_quantity as 當前庫存,
  p.reorder_point as 補貨點,
  CASE 
    WHEN i.current_quantity = 0 THEN '缺貨'
    WHEN i.current_quantity <= p.reorder_point THEN '需補貨'
    WHEN i.current_quantity <= p.min_stock_level THEN '低庫存'
    WHEN i.current_quantity >= p.max_stock_level THEN '庫存過多'
    ELSE '正常'
  END as 狀態
FROM products p
LEFT JOIN inventory i ON i.product_id = p.id
ORDER BY 
  CASE 
    WHEN i.current_quantity = 0 THEN 1
    WHEN i.current_quantity <= p.reorder_point THEN 2
    WHEN i.current_quantity <= p.min_stock_level THEN 3
    ELSE 4
  END,
  i.current_quantity;

