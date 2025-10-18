  # AI 財務文件審核系統 - 完整使用指南

## 📋 系統概述

AI 財務文件審核系統是一個為金融公司設計的完整文件審核解決方案，使用 AI 技術自動分析文件、評估風險、檢查合規性，大幅提升審核效率並降低人為錯誤。

### 主要功能

✅ **AI 自動分析** - 智能識別文件內容、提取關鍵信息  
✅ **風險評估** - 自動計算風險分數，識別高風險因素  
✅ **合規檢查** - 自動驗證是否符合監管要求  
✅ **完整性驗證** - 檢查必要信息是否完整  
✅ **智能建議** - AI 提供核准/拒絕/審核建議  
✅ **審核追蹤** - 完整的審核歷史記錄  
✅ **統計報表** - 實時統計和趨勢分析  

## 🏗️ 系統架構

```
┌─────────────────────────────────────────────┐
│           Frontend (React + TypeScript)     │
│  ┌─────────────────────────────────────┐   │
│  │  FinancialDocumentReview.tsx        │   │
│  │  - 文件列表                          │   │
│  │  - AI 分析觸發                       │   │
│  │  - 審核決策                          │   │
│  │  - 統計儀表板                        │   │
│  └─────────────────────────────────────┘   │
└─────────────────┬───────────────────────────┘
                  │ Supabase Client
                  ↓
┌─────────────────────────────────────────────┐
│         Supabase Backend                     │
│  ┌─────────────────────────────────────┐   │
│  │  Edge Function:                      │   │
│  │  document-review-analyzer            │   │
│  │  - analyze_document                  │   │
│  │  - check_compliance                  │   │
│  │  - validate_document                 │   │
│  │  - extract_data                      │   │
│  │  - get_statistics                    │   │
│  └─────────────────────────────────────┘   │
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │  Database Tables:                    │   │
│  │  - document_types                    │   │
│  │  - financial_documents               │   │
│  │  - document_review_history           │   │
│  │  - compliance_rules                  │   │
│  │  - document_review_metrics           │   │
│  │  - document_templates                │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## 🚀 快速開始

### 前置要求

- ✅ Supabase 專案已建立
- ✅ 已安裝 Supabase CLI (`npm install -g supabase`)
- ✅ 已登入 Supabase (`npx supabase login`)
- ✅ 已有金融公司帳號

### 步驟 1：資料庫設置

1. 開啟 Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/ergqqdirsvmamowpklia/sql
   ```

2. 點擊 **"New query"**

3. 複製 `QUICK_FINANCIAL_DOCUMENT_REVIEW_SETUP.sql` 的完整內容

4. 貼上並點擊 **"Run"**

5. 確認看到成功訊息：
   ```
   ✅ AI 財務文件審核系統設置完成！
   ```

### 步驟 2：部署 Edge Function

#### 方法 1：使用部署腳本（推薦）

雙擊執行：
```batch
DEPLOY_FINANCIAL_DOCUMENT_REVIEW.bat
```

#### 方法 2：手動部署

```bash
# 1. 連接專案
npx supabase link --project-ref ergqqdirsvmamowpklia

# 2. 部署 Edge Function
npx supabase functions deploy document-review-analyzer --no-verify-jwt
```

### 步驟 3：驗證部署

測試 Edge Function 健康狀態：

```bash
curl https://ergqqdirsvmamowpklia.supabase.co/functions/v1/document-review-analyzer
```

應該返回：
```json
{
  "status": "healthy",
  "service": "document-review-analyzer",
  "version": "1.0.0"
}
```

### 步驟 4：在前端使用

1. **刷新瀏覽器** (Ctrl + Shift + R)

2. **使用金融公司帳號登入**
   - Email: fengfinancial@example.com (或其他金融公司帳號)
   
3. **安裝模組**
   - 進入模組商店
   - 搜尋 "AI 文件審核系統"
   - 點擊安裝

4. **開始使用**
   - 在側邊欄選擇 "AI 文件審核系統"
   - 查看文件列表
   - 點擊 "AI 分析" 開始自動審核

## 📊 資料庫結構

### 核心表格

#### 1. document_types (文件類型)
定義各種文件類型的屬性和要求。

```sql
- type_code: 類型代碼 (loan_application, business_loan, etc.)
- type_name: 類型名稱
- required_fields: 必填欄位 (JSONB)
- compliance_rules: 合規規則 (JSONB)
- ai_check_points: AI 檢查點
- auto_approval_threshold: 自動核准門檻
```

**預設類型：**
- 個人信貸申請 (loan_application)
- 企業貸款申請 (business_loan)
- 投資申請 (investment_application)
- 財務報表 (financial_statement)
- 合約審核 (contract_review)
- KYC 文件 (kyc_document)

#### 2. financial_documents (財務文件)
存儲所有待審核和已審核的文件。

```sql
主要欄位：
- document_number: 文件編號
- document_title: 文件標題
- customer_name: 客戶名稱
- loan_amount / investment_amount: 金額
- review_status: 審核狀態
  * pending - 待審核
  * processing - 處理中
  * approved - 已核准
  * rejected - 已拒絕
  * requires_info - 需補充資料
  
AI 分析結果：
- ai_confidence_score: AI 信心分數 (0-100)
- ai_risk_score: 風險分數 (0-100)
- ai_compliance_score: 合規分數 (0-100)
- ai_completeness_score: 完整性分數 (0-100)
- ai_recommendation: AI 建議 (approve/review/reject)
- ai_summary: AI 摘要說明
- risk_factors_detected: 檢測到的風險因素
- missing_information: 缺失的信息
- compliance_issues: 合規問題
```

#### 3. document_review_history (審核歷史)
記錄所有審核動作和狀態變更。

```sql
- document_id: 文件 ID
- action: 動作類型 (submitted, ai_analyzed, reviewed, etc.)
- action_by: 執行人
- previous_status: 舊狀態
- new_status: 新狀態
- notes: 備註
```

#### 4. compliance_rules (合規規則)
定義各種合規檢查規則。

```sql
- rule_code: 規則代碼
- rule_name: 規則名稱
- severity: 嚴重程度 (low/medium/high/critical)
- check_fields: 需檢查的欄位
- violation_action: 違規動作 (flag/warn/block)
```

**預設規則：**
- KYC_001: 客戶身份驗證
- AML_001: 大額交易申報
- CREDIT_001: 信用評估
- DOC_001: 文件完整性

#### 5. document_review_metrics (審核指標)
存儲審核統計數據。

```sql
- total_documents: 總文件數
- pending_documents: 待審核數
- approved_documents: 已核准數
- rejected_documents: 已拒絕數
- avg_ai_confidence: 平均 AI 信心
- avg_processing_time_hours: 平均處理時間
- high_risk_count: 高風險文件數
```

## 🤖 Edge Function API

### 端點
```
POST https://ergqqdirsvmamowpklia.supabase.co/functions/v1/document-review-analyzer
```

### 認證
需要在 Header 中包含 Supabase Auth Token：
```
Authorization: Bearer <your-auth-token>
```

### 動作

#### 1. analyze_document - 分析文件

**請求：**
```json
{
  "action": "analyze_document",
  "data": {
    "documentId": "uuid-here"
  }
}
```

**回應：**
```json
{
  "document_id": "uuid",
  "confidence_score": 85,
  "risk_score": 25,
  "compliance_score": 95,
  "completeness_score": 90,
  "recommendation": "approve",
  "reasoning": "文件完整，風險低，建議核准",
  "summary": "...",
  "findings": [...],
  "missing_information": [],
  "compliance_issues": [],
  "risk_factors": []
}
```

#### 2. check_compliance - 檢查合規性

**請求：**
```json
{
  "action": "check_compliance",
  "data": {
    "documentId": "uuid-here"
  }
}
```

#### 3. validate_document - 驗證文件

**請求：**
```json
{
  "action": "validate_document",
  "data": {
    "documentContent": { ... }
  }
}
```

#### 4. get_statistics - 獲取統計

**請求：**
```json
{
  "action": "get_statistics",
  "data": {
    "days": 30
  }
}
```

## 🎯 使用場景

### 場景 1：個人信貸申請審核

1. **客戶提交申請**
   - 文件類型：個人信貸申請
   - 客戶：王小明
   - 貸款金額：NT$ 500,000

2. **AI 自動分析**
   - 檢查身份證號
   - 驗證收入證明
   - 評估信用風險
   - 計算負債比例

3. **AI 建議**
   - 信心分數：85/100
   - 風險分數：25/100
   - 建議：自動核准 ✅

### 場景 2：企業貸款審核

1. **企業提交申請**
   - 文件類型：企業貸款申請
   - 公司：科技股份有限公司
   - 貸款金額：NT$ 15,000,000

2. **AI 檢測問題**
   - ❌ 缺少 3 年財務報表
   - ❌ 缺少擔保品證明
   - ⚠️ 財務狀況不明

3. **AI 建議**
   - 信心分數：45/100
   - 風險分數：75/100
   - 建議：人工審核 🔍

### 場景 3：投資申請審核

1. **客戶提交申請**
   - 文件類型：基金投資申請
   - 客戶：李美華
   - 投資金額：NT$ 2,000,000

2. **AI 合規檢查**
   - ✅ KYC 文件完整
   - ⚠️ 觸發大額交易申報 (AML_001)
   - ⚠️ 需要風險評估

3. **AI 建議**
   - 信心分數：65/100
   - 風險分數：55/100
   - 建議：補充資料後審核 📋

## 📈 統計和報表

### 即時統計

系統自動追蹤以下指標：

- **總文件數** - 所有提交的文件
- **待審核數** - 等待處理的文件
- **已核准數** - 已通過的文件
- **已拒絕數** - 未通過的文件
- **平均 AI 信心** - AI 分析的平均信心分數
- **平均處理時間** - 從提交到完成的平均時間
- **高風險文件數** - 風險分數 > 70 的文件
- **合規問題數** - 檢測到的合規問題總數

### 生成報表

點擊 "生成報告" 按鈕會自動生成包含以下內容的完整報告：

1. **審核總覽** - 整體統計數據
2. **待審核文件** - 詳細列表
3. **高風險文件** - 需要關注的文件
4. **建議措施** - AI 建議的改進措施

## 🔐 安全性

### Row Level Security (RLS)

所有表格都啟用了 RLS，確保：
- ✅ 用戶只能訪問自己公司的數據
- ✅ 系統級數據（文件類型、合規規則）對所有用戶開放
- ✅ 敏感操作需要認證

### 資料隱私

- 📁 文件內容存儲在 Supabase Storage
- 🔒 所有通信使用 HTTPS 加密
- 🔑 使用 JWT 進行身份驗證
- 📝 完整的審核日誌追蹤

## 🛠️ 故障排除

### 問題 1：Edge Function 返回 500 錯誤

**可能原因：**
- Edge Function 未正確部署
- 資料庫表格不存在
- RLS 政策阻止訪問

**解決方案：**
1. 重新部署 Edge Function
2. 確認資料庫設置已完成
3. 檢查 Supabase 日誌

### 問題 2：無法看到文件列表

**可能原因：**
- 公司 ID 不正確
- RLS 政策問題
- 未載入數據

**解決方案：**
1. 確認使用正確的金融公司帳號登入
2. 檢查 Browser Console 錯誤訊息
3. 驗證 Supabase 連接

### 問題 3：AI 分析失敗

**可能原因：**
- Edge Function 未響應
- 文件數據不完整
- 網路問題

**解決方案：**
1. 檢查 Edge Function 健康狀態
2. 確認文件包含必要欄位
3. 查看 Browser Console 和 Supabase 日誌

### 查看日誌

**Browser Console：**
```
F12 → Console → 查看前端錯誤和 API 回應
```

**Supabase Logs：**
```
Dashboard → Logs → Edge Functions → document-review-analyzer
```

## 📚 進階功能

### 自訂文件類型

在 `document_types` 表格中新增自訂類型：

```sql
INSERT INTO document_types (
  type_code, type_name, category, required_fields, ai_check_points
) VALUES (
  'custom_type',
  '自訂文件類型',
  '自訂類別',
  '["field1", "field2"]'::jsonb,
  ARRAY['檢查點1', '檢查點2']
);
```

### 自訂合規規則

新增公司特定的合規規則：

```sql
INSERT INTO compliance_rules (
  rule_code, rule_name, rule_description, category, severity, check_fields
) VALUES (
  'CUSTOM_001',
  '自訂規則',
  '規則說明',
  'custom',
  'high',
  ARRAY['customer_name', 'loan_amount']
);
```

### 調整 AI 門檻

修改自動核准和人工審核的門檻：

```sql
UPDATE document_types
SET 
  auto_approval_threshold = 85.00,  -- AI 信心分數 >= 85 自動核准
  manual_review_threshold = 60.00   -- AI 信心分數 < 60 需人工審核
WHERE type_code = 'loan_application';
```

## 🔄 系統維護

### 定期檢查

建議定期執行以下檢查：

1. **審核積壓** - 檢查待審核文件數量
2. **AI 準確率** - 比較 AI 建議與最終決定
3. **處理時間** - 監控平均處理時間
4. **合規問題** - 追蹤常見合規問題

### 性能優化

- 定期清理舊文件（超過保留期限）
- 更新統計資料
- 優化資料庫索引

## 📞 支援

如需協助，請參考：

- **文件** - 本指南
- **程式碼** - 查看 `FinancialDocumentReview.tsx` 和 Edge Function
- **日誌** - Browser Console 和 Supabase Logs

## 🎉 總結

AI 財務文件審核系統提供了完整的自動化審核解決方案，包括：

✅ **完整的資料庫結構** - 6 個核心表格，支援所有審核需求  
✅ **強大的 Edge Function** - 5 個 AI 動作，智能分析文件  
✅ **現代化前端介面** - React + TypeScript，連接真實 API  
✅ **一鍵快速設置** - QUICK_SETUP.sql 快速部署  
✅ **企業級安全** - RLS、認證、加密完整保護  
✅ **靈活擴展** - 易於自訂類型、規則和門檻  

**參考 DrugManagement 的完整架構，為金融行業打造的專業解決方案！** 🚀


