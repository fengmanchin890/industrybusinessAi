# 部署 AI 數據治理 Edge Function

## 🎯 問題分析

您遇到的錯誤：
```
POST .../functions/v1/data-governance-analyzer net::ERR_FAILED
CORS policy error
```

**原因：Edge Function 尚未部署到 Supabase！**

---

## ✅ 資料庫狀態

從您的截圖確認：
- ✅ 10 個數據資產已創建
- ✅ 6 個分類規則已創建
- ✅ 4 個合規檢查記錄已創建
- ✅ 6 個訪問記錄已創建

**資料庫部分完全正常！** 👍

---

## 🚀 修復步驟

### 步驟 1：修復 RLS 策略（必須）

在 **Supabase SQL Editor** 執行 `FIX_RLS_CORRECT.sql` 的完整內容。

這會修復權限問題，確保：
- ✅ 可以查看數據資產
- ✅ 可以插入合規檢查
- ✅ 可以更新記錄

### 步驟 2：部署 Edge Function

#### 方法 A：使用 Supabase CLI（推薦）

```powershell
# 1. 切換到項目目錄
cd "C:\Users\User\Desktop\ai business platform"

# 2. 登入 Supabase（如果還沒登入）
supabase login

# 3. 連接到您的項目
supabase link --project-ref ergqqdirsvmamowpklia

# 4. 部署 Edge Function
supabase functions deploy data-governance-analyzer
```

#### 方法 B：使用 Supabase Dashboard（更簡單）

1. 打開 [Supabase Dashboard](https://supabase.com/dashboard/project/ergqqdirsvmamowpklia/functions)
2. 點擊 **Edge Functions** → **Deploy new function**
3. 選擇或上傳：`supabase/functions/data-governance-analyzer/index.ts`
4. 點擊 **Deploy**

---

## 📂 Edge Function 檔案確認

確保這個檔案存在：
```
supabase/functions/data-governance-analyzer/index.ts
```

---

## 🔧 部署後的驗證

### 1. 測試 Edge Function

在終端執行：
```powershell
curl -i --location --request POST 'https://ergqqdirsvmamowpklia.supabase.co/functions/v1/data-governance-analyzer' `
  --header 'Authorization: Bearer YOUR_ANON_KEY' `
  --header 'Content-Type: application/json' `
  --data '{
    "action": "analyzeCompliance",
    "assetId": "test-id",
    "companyId": "08748524-a2a1-4bcf-bff3-7417c269d9e3"
  }'
```

預期結果：
- ✅ HTTP 200 OK
- ✅ 返回 JSON 數據

### 2. 測試前端

1. 重新整理瀏覽器（`Ctrl+Shift+R`）
2. 進入 AI 數據治理模組
3. 點擊「執行合規檢查」
4. 應該看到合規檢查結果，不再有 CORS 錯誤

---

## ❓ 常見問題

### Q1: 沒有 Supabase CLI？

**安裝方法：**
```powershell
# 使用 npm
npm install -g supabase

# 或使用 Scoop
scoop install supabase
```

### Q2: 部署後還是有 CORS 錯誤？

**解決方案：**
1. 檢查 Edge Function 是否真的部署成功
2. 在 Supabase Dashboard → Settings → API → CORS 允許的來源中添加 `http://localhost:5174`
3. 重新部署 Edge Function

### Q3: 為什麼需要部署 Edge Function？

Edge Function 提供：
- 🤖 AI 分析（使用 OpenAI GPT-4）
- 🔍 合規檢查邏輯
- 📊 數據品質評估
- 🛡️ 隱私風險分析

沒有它，前端無法執行這些高級功能。

### Q4: 可以不使用 Edge Function 嗎？

**部分可以！** 如果不部署 Edge Function：
- ✅ 可以查看數據資產
- ✅ 可以查看統計
- ✅ 可以查看歷史記錄
- ❌ 無法執行新的合規檢查
- ❌ 無法使用 AI 分析

---

## 🎯 推薦操作順序

1. **立即執行**：`FIX_RLS_CORRECT.sql`（2 分鐘）
2. **立即部署**：Edge Function（5 分鐘）
3. **測試**：前端功能（1 分鐘）

**總時間：8 分鐘即可完全就緒！** ⏱️

---

## 💡 關於外部 Data Connect

您提到的「外部 data connect」：

- ❌ **不是**導致當前錯誤的原因
- ✅ 當前錯誤 100% 是 Edge Function 未部署
- 📌 外部數據連接是**可選**功能，用於：
  - 連接 ERP 系統
  - 連接 POS 系統
  - 導入 Excel 數據
  - 連接 PLC 設備

**不影響核心數據治理功能！**

---

## 🎉 部署成功後

您將能夠：

✅ 執行 GDPR 合規檢查  
✅ 執行 ISO 27001 安全檢查  
✅ 執行 PDPA 隱私檢查  
✅ 查看 AI 生成的建議  
✅ 生成數據治理報告  
✅ 查看風險評分  

---

## 📞 需要協助？

如果部署遇到問題：
1. 提供錯誤訊息
2. 告訴我使用哪種部署方法
3. 我會立即協助解決

**現在就執行修復吧！** 🚀

