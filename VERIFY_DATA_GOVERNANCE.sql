-- 驗證 AI 數據治理系統安裝
-- 在 Supabase SQL Editor 中執行此查詢以驗證所有數據

-- 1. 檢查公司
SELECT '1️⃣ 公司檢查' as step, 
       id, name, industry 
FROM companies 
WHERE name ILIKE '%gov%' OR industry = 'government';

-- 2. 檢查數據資產
SELECT '2️⃣ 數據資產' as step,
       COUNT(*) as total,
       COUNT(DISTINCT classification_level) as classification_levels,
       COUNT(CASE WHEN is_personal_data THEN 1 END) as personal_data_assets
FROM data_assets
WHERE company_id IN (SELECT id FROM companies WHERE name ILIKE '%gov%');

-- 3. 列出所有數據資產
SELECT '3️⃣ 資產列表' as step,
       asset_name,
       asset_type,
       classification_level,
       owner_department,
       CASE WHEN is_personal_data THEN '✓ 個人資料' ELSE '' END as personal_data_flag
FROM data_assets
WHERE company_id IN (SELECT id FROM companies WHERE name ILIKE '%gov%')
ORDER BY 
  CASE classification_level
    WHEN 'top-secret' THEN 1
    WHEN 'secret' THEN 2
    WHEN 'confidential' THEN 3
    WHEN 'internal' THEN 4
    WHEN 'public' THEN 5
  END;

-- 4. 檢查分類規則
SELECT '4️⃣ 分類規則' as step,
       rule_name,
       classification_level,
       array_length(keywords, 1) as keyword_count,
       CASE WHEN auto_classify THEN '✓ 自動' ELSE '✗ 手動' END as auto_classify_status
FROM classification_rules
WHERE company_id IN (SELECT id FROM companies WHERE name ILIKE '%gov%')
ORDER BY priority DESC;

-- 5. 檢查合規檢查
SELECT '5️⃣ 合規檢查' as step,
       check_name,
       check_type,
       status,
       compliance_score,
       risk_level,
       checked_at
FROM compliance_checks
WHERE company_id IN (SELECT id FROM companies WHERE name ILIKE '%gov%')
ORDER BY checked_at DESC;

-- 6. 檢查訪問記錄
SELECT '6️⃣ 訪問記錄' as step,
       user_name,
       user_department,
       asset_name,
       access_type,
       access_result,
       CASE WHEN is_anomaly THEN '⚠️ 異常' ELSE '✓ 正常' END as anomaly_status,
       accessed_at
FROM access_control_records
WHERE company_id IN (SELECT id FROM companies WHERE name ILIKE '%gov%')
ORDER BY accessed_at DESC;

-- 7. 測試統計函數
SELECT '7️⃣ 統計函數' as step,
       get_governance_stats(
         (SELECT id FROM companies WHERE name ILIKE '%gov%' LIMIT 1)
       )；；

-- 8. 總結
SELECT '8️⃣ 總結' as step,
       '✅ 數據治理系統已就緒！' as status,
       (SELECT COUNT(*) FROM data_assets 
        WHERE company_id IN (SELECT id FROM companies WHERE name ILIKE '%gov%')) as total_assets,
       (SELECT COUNT(*) FROM classification_rules 
        WHERE company_id IN (SELECT id FROM companies WHERE name ILIKE '%gov%')) as total_rules,
       (SELECT COUNT(*) FROM compliance_checks 
        WHERE company_id IN (SELECT id FROM companies WHERE name ILIKE '%gov%')) as total_checks,
       (SELECT COUNT(*) FROM access_control_records 
        WHERE company_id IN (SELECT id FROM companies WHERE name ILIKE '%gov%')) as total_access_records;

