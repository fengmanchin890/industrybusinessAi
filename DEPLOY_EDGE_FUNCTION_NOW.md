# 🚀 部署 Edge Function - 最簡單方法

## ⚡ 方法 1：通過 Supabase Dashboard（推薦）

### 步驟：

1. **打開 Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/ergqqdirsvmamowpklia
   ```

2. **進入 Edge Functions**
   - 左側選單 → `Edge Functions`

3. **創建/更新函數**
   - 點擊 `Deploy Function` 或 `New Function`
   - 函數名稱：`student-performance-analyzer`

4. **複製程式碼**
   - 打開：`supabase/functions/student-performance-analyzer/index.ts`
   - 全選複製（Ctrl+A → Ctrl+C）

5. **貼上並部署**
   - 在 Dashboard 編輯器中貼上程式碼
   - 點擊 `Deploy`

6. **驗證**
   - 部署完成後，在瀏覽器訪問：
   ```
   https://ergqqdirsvmamowpklia.supabase.co/functions/v1/student-performance-analyzer
   ```
   - 應該看到 `{"error":"Missing authorization header"}` (這是正確的！)

---

## ⚡ 方法 2：修復 CLI 部署

### 問題：`.env` 文件編碼錯誤

### 解決方案：

```powershell
# 1. 刪除舊的 .env 文件（如果存在）
Remove-Item -Path .env -ErrorAction SilentlyContinue

# 2. 重新登入
supabase login

# 3. 確認已登入
supabase projects list

# 4. 部署
supabase functions deploy student-performance-analyzer --project-ref ergqqdirsvmamowpklia --no-verify-jwt
```

---

## ✅ 部署後測試

1. **刷新前端頁面**
2. **點擊任意學生的"詳細分析"按鈕**
3. **應該看到 AI 分析結果！**

---

## 📊 當前狀態

| 組件 | 狀態 | 完成度 |
|------|------|--------|
| 資料庫 | ✅ 完成 | 100% |
| 前端 UI | ✅ 完成 | 100% |
| 數據載入 | ✅ 完成 | 100% |
| 降級分析 | ✅ 完成 | 100% |
| Edge Function | ⏸️ 待部署 | 70% |

**部署 Edge Function 後即可達到 100%！** 🎊


