# AI 市民服務系統 - 設置指南

## 📋 概述

**AI 市民服務系統** 是一個智能化的政府市民服務平台，提供24小時線上服務、智能客服、服務追蹤和滿意度管理。

## 🎯 主要功能

### 1. 智能服務請求處理
- 自動分類和優先級判定
- AI 情緒分析
- 智能回覆建議
- SLA 追蹤

### 2. 服務知識庫
- 常見問題解答
- 辦事指南
- 文件清單
- 流程說明

### 3. 預約服務
- 線上預約
- 預約提醒
- 現場報到管理

### 4. 服務評價
- 多維度評分
- 意見回饋
- AI 情緒分析

### 5. 智能搜索
- 全文搜索
- 語義搜索
- 相似案例推薦

---

## 🚀 快速設置（3 步驟）

### 步驟 1: 資料庫設置 ⚡

1. 打開 **Supabase SQL Editor**
2. 複製 `QUICK_CITIZEN_SERVICE_SETUP.sql` 的全部內容
3. 貼上並執行
4. 等待完成（約 10-15 秒）

**預期輸出:**
```
✅ 測試數據插入完成！
   - 服務請求: 5 筆
   - 知識庫: 3 筆
   - 預約: 1 筆
   - 互動記錄: 2 筆
   - 評價: 1 筆
   - FAQ: 3 筆

=====================================
AI 市民服務系統 - 統計資訊
=====================================
總請求數: 5
今日已解決: 1
平均回應時間: 45 分鐘
滿意度: 100%
待處理: 3
=====================================
```

### 步驟 2: 部署 Edge Function 🚀

#### 方法 A: 使用 CLI（推薦）

```bash
# 1. 登入 Supabase
supabase login

# 2. 連結專案
supabase link --project-ref ergqqdirsvmamowpklia

# 3. 部署函數
supabase functions deploy citizen-service-ai

# 4. 設置環境變數（可選，用於 AI 功能）
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

#### 方法 B: 使用 Dashboard

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard/project/ergqqdirsvmamowpklia/functions)
2. 點擊 **"Deploy a new function"**
3. 選擇 `citizen-service-ai`
4. 上傳 `supabase/functions/citizen-service-ai/index.ts`
5. 點擊 **"Deploy"**

#### 方法 C: 一鍵部署腳本

```bash
# Windows
.\DEPLOY_NOW.bat citizen-service-ai

# 如果沒有這個腳本，手動運行
cd "C:\Users\User\Desktop\ai business platform"
supabase functions deploy citizen-service-ai
```

### 步驟 3: 測試前端 🎨

1. **重新整理瀏覽器** (`Ctrl+Shift+R`)
2. **使用 fenggov 帳號登入**
3. **進入「已安裝模組」**
4. **打開「AI 市民服務系統」**

---

## 📊 功能驗證

### 1. 統計儀表板
應該看到：
- ✅ 總請求數: **5**
- ✅ 今日已解決: **1**
- ✅ 平均回應時間: **45 分鐘**
- ✅ 滿意度: **100%**
- ✅ 待處理: **3**

### 2. 服務請求列表
應該看到 5 個測試請求：
1. **SR2024-001** - 低收入戶補助申請諮詢（處理中）
2. **SR2024-002** - 社區噪音問題投訴（已指派）
3. **SR2024-003** - 地價稅繳納查詢（已解決）
4. **SR2024-004** - 國小新生入學申請（新請求）
5. **SR2024-005** - 公司設立登記預約（處理中）

### 3. 知識庫
應該看到 3 個知識條目：
- 如何申請低收入戶補助？
- 如何申請公司設立登記？
- 地價稅如何繳納？

### 4. 測試 AI 功能

#### A. AI 請求分析
1. 點擊任一請求
2. 點擊「**AI 分析**」
3. 查看：
   - 自動分類建議
   - 優先級判定
   - 情緒分析
   - 關鍵詞提取
   - 建議處理部門

#### B. AI 回覆建議
1. 選擇一個新請求
2. 點擊「**AI 建議回覆**」
3. 查看智能生成的回覆內容

#### C. 智能搜索
1. 使用搜索框
2. 輸入關鍵詞（如「補助」）
3. 查看跨請求、知識庫、FAQ 的搜索結果

---

## 🔧 進階配置

### 1. AI 功能啟用

**設置 OpenAI API Key** 以啟用完整 AI 功能：

```bash
supabase secrets set OPENAI_API_KEY=sk-...your-key...
```

**AI 功能包括：**
- ✅ 智能請求分析（類別、優先級、情緒）
- ✅ 自動回覆建議
- ✅ FAQ 自動生成
- ✅ 相似案例推薦
- ✅ 情緒分析

**備註：** 沒有 OpenAI Key 時，系統會使用規則引擎（準確度約 70%）

### 2. 自定義知識庫

在 Supabase SQL Editor 中：

```sql
INSERT INTO service_knowledge_base (
  company_id,
  category,
  question,
  answer,
  keywords,
  required_documents,
  process_steps,
  responsible_department,
  is_active
) VALUES (
  (SELECT id FROM companies WHERE name = 'fenggov' LIMIT 1),
  'social_welfare',
  '如何申請育兒津貼？',
  '育兒津貼申請條件：1. 子女未滿2歲...',
  ARRAY['育兒', '津貼', '補助'],
  ARRAY['戶口名簿', '出生證明', '郵局存摺'],
  ARRAY['準備文件', '至區公所申請', '等候審核'],
  '社會局',
  true
);
```

### 3. SLA 設定

修改各優先級的 SLA 時間（在 Edge Function 中）：

```typescript
const timeMap: Record<string, number> = {
  'urgent': 4,    // 緊急：4小時
  'high': 12,     // 高：12小時
  'medium': 24,   // 中：24小時
  'low': 48,      // 低：48小時
}
```

---

## 📱 使用場景

### 場景 1: 市民提交請求
```
市民填寫表單 → AI 自動分類 → 分配部門 → 設定 SLA → 通知承辦人
```

### 場景 2: 承辦人處理
```
查看請求 → AI 建議回覆 → 編輯回覆 → 送出 → 自動通知市民
```

### 場景 3: 知識庫查詢
```
市民搜索 → 找到相關 FAQ/知識 → 自助解決 → 減少請求量
```

### 場景 4: 服務預約
```
市民選擇服務 → 選擇時間 → 確認預約 → 收到提醒 → 現場報到
```

---

## 🔍 疑難排解

### 問題 1: 前端顯示「No data」
**原因：** 資料庫未設置或 RLS 策略問題

**解決：**
```bash
# 重新運行 QUICK_CITIZEN_SERVICE_SETUP.sql
# 確認 fenggov 公司存在
SELECT * FROM companies WHERE name = 'fenggov';
```

### 問題 2: Edge Function 呼叫失敗（CORS 錯誤）
**原因：** Edge Function 未部署

**解決：**
```bash
supabase functions deploy citizen-service-ai
```

### 問題 3: AI 功能無效果
**原因：** 未設置 OpenAI API Key

**解決：**
```bash
# 設置 API Key
supabase secrets set OPENAI_API_KEY=sk-...

# 或使用規則引擎（不需要 API Key）
# 系統會自動降級使用
```

### 問題 4: 403 Forbidden 錯誤
**原因：** RLS 策略阻擋

**解決：**
```sql
-- 檢查用戶的 company_id
SELECT id, email, company_id FROM users WHERE id = auth.uid();

-- 確認公司存在
SELECT * FROM companies WHERE id = 'your-company-id';
```

---

## 📊 資料庫架構

### 核心表格

1. **service_requests** - 服務請求
   - 市民資訊
   - 請求內容
   - 處理狀態
   - AI 分析結果
   - SLA 追蹤

2. **service_knowledge_base** - 知識庫
   - 問題與答案
   - 辦事流程
   - 所需文件
   - 部門資訊

3. **service_appointments** - 預約
   - 預約資訊
   - 時間管理
   - 狀態追蹤

4. **service_interactions** - 互動記錄
   - 溝通歷程
   - 狀態變更
   - AI 摘要

5. **service_feedback** - 評價
   - 滿意度評分
   - 意見回饋
   - AI 情緒分析

6. **service_faqs** - 常見問題
   - FAQ 列表
   - 使用統計

---

## 🎯 API 端點

### Edge Function: `citizen-service-ai`

**URL:**
```
https://ergqqdirsvmamowpklia.supabase.co/functions/v1/citizen-service-ai
```

**可用操作：**

1. **analyze_request** - 分析服務請求
```json
{
  "action": "analyze_request",
  "data": {
    "title": "問題標題",
    "description": "問題描述"
  }
}
```

2. **suggest_response** - 建議回覆
```json
{
  "action": "suggest_response",
  "data": {
    "requestTitle": "標題",
    "requestDescription": "描述",
    "category": "social_welfare"
  }
}
```

3. **categorize** - 快速分類
```json
{
  "action": "categorize",
  "data": {
    "text": "文字內容"
  }
}
```

4. **sentiment_analysis** - 情緒分析
```json
{
  "action": "sentiment_analysis",
  "data": {
    "text": "文字內容"
  }
}
```

5. **smart_search** - 智能搜索
```json
{
  "action": "smart_search",
  "data": {
    "query": "搜索關鍵詞",
    "searchType": "all"
  }
}
```

---

## 📈 效能優化

### 1. 索引優化
已創建以下索引：
- 公司 ID 索引
- 狀態索引
- 分類索引
- 優先級索引
- 全文搜索索引

### 2. RLS 優化
使用 `company_id` 進行資料隔離，確保多租戶安全

### 3. 快取建議
- 知識庫內容（TTL: 1 小時）
- FAQ 列表（TTL: 30 分鐘）
- 統計數據（TTL: 5 分鐘）

---

## 🔐 安全性

1. **Row Level Security (RLS)**
   - 所有表格啟用 RLS
   - 基於 `company_id` 隔離資料

2. **API 驗證**
   - 需要有效的 Supabase Auth Token
   - 自動驗證用戶身份

3. **資料加密**
   - 敏感資料（如身份證號）建議加密存儲
   - 使用 HTTPS 傳輸

---

## 📞 支援

遇到問題？
1. 查看本文檔的「疑難排解」章節
2. 檢查 Supabase Dashboard 的 Logs
3. 查看瀏覽器 Console 錯誤訊息

---

## ✅ 檢查清單

設置完成後，確認以下項目：

- [ ] 資料庫表格已創建（6 個表）
- [ ] 測試數據已插入（5 個請求、3 個知識、1 個預約）
- [ ] Edge Function 已部署
- [ ] 前端顯示正常
- [ ] 統計數據正確
- [ ] 可以查看請求列表
- [ ] 可以查看知識庫
- [ ] AI 分析功能可用
- [ ] 搜索功能正常

---

## 🎉 完成！

**AI 市民服務系統** 已經完全設置完成，開始使用吧！

**下一步建議：**
1. 自定義知識庫內容
2. 設置 OpenAI API Key（啟用完整 AI）
3. 調整 SLA 時間
4. 添加更多 FAQ
5. 訓練服務人員使用系統

**祝您使用愉快！** 🚀

