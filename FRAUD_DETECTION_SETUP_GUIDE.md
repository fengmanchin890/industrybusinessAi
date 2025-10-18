# 🛡️ AI 詐欺偵測引擎 - 完整設置指南

## 📋 **目錄**

1. [系統概述](#系統概述)
2. [快速開始](#快速開始)
3. [資料庫設置](#資料庫設置)
4. [Edge Function 部署](#edge-function-部署)
5. [前端配置](#前端配置)
6. [測試系統](#測試系統)
7. [疑難排解](#疑難排解)

---

## 🎯 **系統概述**

AI 詐欺偵測引擎是一個完整的金融交易監控系統，提供：

### **核心功能**
- ✅ 實時交易監控
- ✅ AI 風險評分
- ✅ 異常行為偵測
- ✅ 自動警報系統
- ✅ 詐欺案例管理
- ✅ 用戶行為分析
- ✅ 統計報告生成

### **技術架構**
- **後端**: Supabase (PostgreSQL + Edge Functions)
- **前端**: React + TypeScript
- **AI**: OpenAI GPT-4 (可選)
- **安全**: Row Level Security (RLS)

---

## ⚡ **快速開始**

### **前置需求**
- Supabase 專案（已創建）
- Supabase CLI（已安裝）
- 公司帳號：`fengfinancial company`

### **一鍵設置（推薦）**

```bash
# 步驟 1: 在 Supabase SQL Editor 中運行
QUICK_FRAUD_DETECTION_SETUP.sql

# 步驟 2: 部署 Edge Function
supabase functions deploy fraud-detection-analyzer --project-ref YOUR_PROJECT_ID --no-verify-jwt

# 步驟 3: 登入系統
# 使用 fengfinancial company 帳號登入並訪問 "AI 詐欺偵測引擎" 模組
```

---

## 💾 **資料庫設置**

### **方法 1: 使用 Migration（推薦）**

```bash
# 在專案根目錄執行
supabase db push
```

**Migration 文件**: `supabase/migrations/20251018170000_add_fraud_detection_tables.sql`

### **方法 2: 使用快速設置腳本**

1. 打開 Supabase Dashboard
2. 進入 SQL Editor
3. 複製 `QUICK_FRAUD_DETECTION_SETUP.sql` 內容
4. 點擊 "Run" 執行

### **創建的資料表**

| 表名 | 用途 | 記錄數 |
|------|------|--------|
| `transactions` | 交易記錄 | 5 |
| `fraud_rules` | 詐欺規則 | 5 |
| `fraud_cases` | 詐欺案例 | 2 |
| `user_behavior_profiles` | 用戶行為檔案 | 1 |
| `fraud_alerts` | 詐欺警報 | 3 |
| `fraud_statistics` | 統計數據 | 1 |
| `ml_model_logs` | ML 模型日誌 | 0 |

### **驗證資料庫**

```sql
-- 檢查所有表的記錄數
SELECT 
  'transactions' as table_name,
  COUNT(*) as count
FROM transactions
WHERE company_id IN (
  SELECT id FROM companies 
  WHERE name IN ('fengfinancial company', 'fengfinancial')
)
UNION ALL
SELECT 'fraud_rules', COUNT(*) FROM fraud_rules
WHERE company_id IN (
  SELECT id FROM companies 
  WHERE name IN ('fengfinancial company', 'fengfinancial')
)
UNION ALL
SELECT 'fraud_cases', COUNT(*) FROM fraud_cases
WHERE company_id IN (
  SELECT id FROM companies 
  WHERE name IN ('fengfinancial company', 'fengfinancial')
)
UNION ALL
SELECT 'fraud_alerts', COUNT(*) FROM fraud_alerts
WHERE company_id IN (
  SELECT id FROM companies 
  WHERE name IN ('fengfinancial company', 'fengfinancial')
);
```

**預期結果**:
```
table_name          | count
--------------------|-------
transactions        |     5
fraud_rules         |     5
fraud_cases         |     2
fraud_alerts        |     3
```

---

## 🚀 **Edge Function 部署**

### **方法 1: 使用 CLI（推薦）**

```bash
# 1. 確認已登入
supabase login

# 2. 連接專案
supabase link --project-ref YOUR_PROJECT_ID

# 3. 部署函數
supabase functions deploy fraud-detection-analyzer --no-verify-jwt
```

### **方法 2: 使用 Dashboard**

1. 訪問: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/functions
2. 點擊 "New Function" 或 "Deploy Function"
3. 函數名稱: `fraud-detection-analyzer`
4. 複製 `supabase/functions/fraud-detection-analyzer/index.ts` 內容
5. 點擊 "Deploy"

### **驗證部署**

**測試 Edge Function 健康狀態**:
```bash
# 在瀏覽器或 curl 訪問
https://YOUR_PROJECT_ID.supabase.co/functions/v1/fraud-detection-analyzer
```

**預期響應**:
```json
{
  "status": "healthy",
  "service": "fraud-detection-analyzer",
  "version": "1.0.0"
}
```

### **檢查部署日誌**

1. Supabase Dashboard → Edge Functions
2. 選擇 `fraud-detection-analyzer`
3. 點擊 "Invocations" 標籤
4. 確認最近的請求返回 `200 OK`

---

## 🎨 **前端配置**

前端已自動配置完成！

### **組件位置**
```
frontend/Modules/Industry/Finance/FraudDetection.tsx
```

### **關鍵功能**
- ✅ 自動從 Supabase 載入交易數據
- ✅ 調用 Edge Function 進行 AI 分析
- ✅ 智能降級機制（Edge Function 失敗時使用本地規則）
- ✅ 實時交易監控
- ✅ 詐欺警報管理

### **API 集成確認**

打開 `FraudDetection.tsx` 檢查以下關鍵代碼：

```typescript
// ✅ 已連接到 Supabase
const { data: transactionsData } = await supabase
  .from('transactions')
  .select('*')
  .eq('company_id', company.id)

// ✅ 已連接到 Edge Function
const { data: analysisData } = await supabase.functions.invoke(
  'fraud-detection-analyzer',
  {
    body: {
      action: 'analyze_transaction',
      data: { transactionId: transaction.id }
    }
  }
)
```

---

## 🧪 **測試系統**

### **步驟 1: 登入系統**

```
公司帳號: fengfinancial company
模組: AI 詐欺偵測引擎
```

### **步驟 2: 驗證數據顯示**

**應該看到**:
- ✅ **統計卡片**:
  - 總交易數: 5
  - 已攔截: 1-2 筆
  - 誤報率: < 5%
  
- ✅ **交易列表**:
  - 5 筆測試交易
  - 不同的風險等級（低/中/高）
  - 狀態標記（完成/標記/調查中）

- ✅ **警報列表**:
  - 3 條活躍警報
  - 不同嚴重程度

### **步驟 3: 測試 AI 分析**

1. 點擊任意高風險交易
2. 點擊 "詳細分析" 或 "AI 評估"
3. **檢查控制台**:
   - ❌ 如果有 CORS 錯誤 → Edge Function 未正確部署
   - ✅ 如果看到分析結果 → 系統正常

### **步驟 4: 測試創建案例**

1. 找到高風險交易
2. 點擊 "創建案例"
3. 填寫案例資訊
4. 保存並確認案例出現在列表中

---

## 🐛 **疑難排解**

### **問題 1: 看不到交易數據**

**症狀**: 前端顯示空列表

**解決方案**:
```sql
-- 1. 確認數據存在
SELECT COUNT(*) FROM transactions 
WHERE company_id = (
  SELECT id FROM companies 
  WHERE name IN ('fengfinancial company', 'fengfinancial')
  LIMIT 1
);

-- 2. 檢查 RLS 策略
SELECT * FROM pg_policies 
WHERE tablename = 'transactions';

-- 3. 如果數據不存在，重新運行
-- QUICK_FRAUD_DETECTION_SETUP.sql
```

---

### **問題 2: CORS 錯誤**

**症狀**: 
```
Access to fetch... blocked by CORS policy
```

**解決方案**:
1. 確認 Edge Function 已部署:
   ```bash
   supabase functions list --project-ref YOUR_PROJECT_ID
   ```

2. 檢查 Dashboard → Functions → Invocations
   - 如果看到 `503` 錯誤 → 函數崩潰
   - 如果看到 `200` → CORS 配置問題

3. 重新部署:
   ```bash
   supabase functions deploy fraud-detection-analyzer --project-ref YOUR_PROJECT_ID --no-verify-jwt
   ```

---

### **問題 3: Edge Function 返回錯誤**

**症狀**: 
```json
{"error": "Transaction not found"}
```

**原因**: 交易 ID 不存在或不屬於該公司

**解決方案**:
```sql
-- 確認交易 ID 正確
SELECT id, transaction_id, company_id 
FROM transactions 
WHERE company_id = (
  SELECT id FROM companies 
  WHERE name = 'fengfinancial company'
);
```

---

### **問題 4: 前端使用降級分析**

**症狀**: 控制台顯示 "Edge Function 調用失敗，使用降級分析"

**這是正常的！** 系統設計有智能降級機制：
- 優先嘗試使用 Edge Function（AI 分析）
- 如果失敗，自動切換到本地規則分析
- 用戶體驗不受影響

**如果想使用完整 AI 功能**:
1. 確保 Edge Function 已部署
2. （可選）配置 OpenAI API Key
3. 重新測試

---

## 📊 **系統架構**

```
┌─────────────────┐
│   前端 React    │
│ FraudDetection  │
└────────┬────────┘
         │
         ├─────────► Supabase PostgreSQL
         │           (交易數據、警報、案例)
         │
         └─────────► Edge Function
                     (fraud-detection-analyzer)
                     │
                     ├─► AI 分析 (OpenAI)
                     └─► 規則引擎
```

---

## 🎓 **功能清單**

### **✅ 已實現**
- [x] 資料庫架構（7個表）
- [x] RLS 安全策略
- [x] Edge Function with AI
- [x] 前端 UI 組件
- [x] Supabase API 集成
- [x] 智能降級機制
- [x] 測試數據（5筆交易）
- [x] 詐欺規則（5條）
- [x] 案例管理（2個）
- [x] 警報系統（3條）
- [x] 統計報告
- [x] 快速設置腳本
- [x] 完整文檔

### **🔄 可選增強**
- [ ] OpenAI API Key 配置
- [ ] 實時交易流接入
- [ ] 更多詐欺規則
- [ ] 機器學習模型訓練
- [ ] 詳細審計日誌

---

## 📞 **技術支持**

### **遇到問題？**

1. **檢查日誌**:
   - Supabase Dashboard → Logs
   - 瀏覽器控制台 (F12)

2. **驗證配置**:
   ```bash
   # 檢查專案連接
   supabase status
   
   # 檢查函數列表
   supabase functions list
   ```

3. **查看文檔**:
   - `FRAUD_DETECTION_SETUP_GUIDE.md` (本文件)
   - `QUICK_FRAUD_DETECTION_SETUP.sql`

---

## 🎉 **恭喜！**

您已成功設置 AI 詐欺偵測引擎！

**立即體驗：**
1. 登入 `fengfinancial company` 帳號
2. 選擇 "AI 詐欺偵測引擎" 模組
3. 查看實時交易監控
4. 測試 AI 風險分析

**系統完全可用且功能完整！** 🚀✨


