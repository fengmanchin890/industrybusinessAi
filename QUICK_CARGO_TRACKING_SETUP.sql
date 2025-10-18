-- AI 貨物追蹤系統 - 快速設置

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT id INTO v_company_id FROM companies WHERE industry = 'logistics' LIMIT 1;
  
  IF v_company_id IS NOT NULL THEN
    INSERT INTO shipments (
      company_id, tracking_number, customer_name, origin_address, destination_address,
      cargo_type, weight_kg, current_status, current_location, estimated_delivery,
      delay_risk_score, priority
    ) VALUES
      (v_company_id, 'SHIP-2025-001', '王小明', '台北市信義區', '高雄市前鎮區',
       '電子產品', 50, 'in_transit', '台中轉運中心', NOW() + INTERVAL '1 day', 25, 'normal'),
      (v_company_id, 'SHIP-2025-002', '李美華', '台北市松山區', '花蓮縣花蓮市',
       '家具', 850, 'in_transit', '宜蘭轉運站', NOW() + INTERVAL '2 day', 65, 'normal'),
      (v_company_id, 'SHIP-2025-003', '陳志強', '新竹市東區', '台南市永康區',
       '文件', 2, 'delivered', '台南配送站', NOW() - INTERVAL '1 hour', 10, 'urgent')
    ON CONFLICT (tracking_number) DO NOTHING;
    
    RAISE NOTICE '✅ 已創建測試貨物數據';
  ELSE
    RAISE NOTICE '⚠️ 未找到物流公司';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ AI 貨物追蹤系統設置完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🚀 系統已就緒！';
END $$;
