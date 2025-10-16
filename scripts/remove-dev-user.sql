-- 移除開發者用戶腳本
-- 此腳本將刪除 dev@example.com 用戶及其相關資料

-- 首先，我們需要找到該用戶的 ID 和 company_id
WITH dev_user AS (
  SELECT id, company_id, email 
  FROM auth.users 
  WHERE email = 'dev@example.com'
),
dev_company AS (
  SELECT company_id 
  FROM users 
  WHERE email = 'dev@example.com'
)

-- 刪除用戶相關資料（按順序刪除以避免外鍵約束錯誤）
DELETE FROM company_modules WHERE company_id IN (SELECT company_id FROM dev_company);
DELETE FROM alerts WHERE company_id IN (SELECT company_id FROM dev_company);
DELETE FROM reports WHERE company_id IN (SELECT company_id FROM dev_company);
DELETE FROM data_connections WHERE company_id IN (SELECT company_id FROM dev_company);

-- 刪除用戶記錄
DELETE FROM users WHERE email = 'dev@example.com';

-- 刪除公司記錄
DELETE FROM companies WHERE id IN (SELECT company_id FROM dev_company);

-- 最後刪除 auth.users 記錄（這會自動刪除相關的 auth 資料）
DELETE FROM auth.users WHERE email = 'dev@example.com';

-- 驗證刪除結果
SELECT 'Users remaining:' as info, count(*) as count FROM users
UNION ALL
SELECT 'Companies remaining:' as info, count(*) as count FROM companies
UNION ALL
SELECT 'Auth users remaining:' as info, count(*) as count FROM auth.users;
