-- 建立 Storage bucket 與政策（若尚未建立）
-- 在 Supabase 僅能以 SQL 創建政策，bucket 可由 API/儀表板建立；這裡提供檢查與建立指令

-- 建議於儀表板建立 bucket 名稱: marketing (public)
-- 以下為 RLS policies 對應的 storage.objects 表（使用者端透過 Storage API 存取）

create policy if not exists "marketing_read_public"
on storage.objects for select to anon, authenticated
using (bucket_id = 'marketing');

create policy if not exists "marketing_write_own_company"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'marketing'
);

create policy if not exists "marketing_update_own_company"
on storage.objects for update to authenticated
using (bucket_id = 'marketing')
with check (bucket_id = 'marketing');


