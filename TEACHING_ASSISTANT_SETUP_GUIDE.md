# AI 教學助手 - 設置指南

## 📋 概述

**AI 教學助手**是一個智能化的個人化教學系統，整合 ChatGPT 與台灣教材，提供智能學習輔導、個人化學習路徑、AI 問答和學習進度追蹤。

## 🎯 主要功能

### 1. 個人化學習路徑
- AI 分析學生程度
- 自動規劃學習計畫
- 里程碑追蹤
- 進度視覺化

### 2. 智能問答與解釋
- AI 概念解釋（適應學習風格）
- 智能出題
- 答案分析
- 錯誤診斷

### 3. 學習進度追蹤
- 知識點掌握度
- 學習統計
- 表現分析
- 建議推薦

### 4. AI 互動記錄
- 對話歷程
- 情緒分析
- 學習困難點識別

---

## 🚀 快速設置（3 步驟）

### 步驟 1: 資料庫設置 ⚡ (1 分鐘)

1. **打開 Supabase SQL Editor**
2. **打開 `QUICK_TEACHING_ASSISTANT_SETUP.sql`**
3. **修改第 476 行**：

```sql
-- 找到這一行（約第 476 行）
WHERE name IN ('fengadult', 'fenggov company', 'YOUR_COMPANY_NAME')

-- 替換為您的公司名稱，例如:
WHERE name = 'fengadult'
-- 或
WHERE name = 'fenggov company'
```

4. **複製整個檔案內容，貼上到 SQL Editor 並執行**

**預期輸出：**
```
=====================================
✅ 測試數據插入完成！
   - 學生: 3 位
   - 學習會話: 2 場
   - 問題: 2 題
   - 學習路徑: 1 條
   - 里程碑: 2 個
   - 知識點: 3 個
   - AI 互動: 1 筆
   - 教學資源: 2 個
=====================================

✅ AI 教學助手系統設置完成！
```

### 步驟 2: 部署 Edge Function 🚀 (2 分鐘)

```bash
cd "C:\Users\User\Desktop\ai business platform"

# 登入並連結
supabase login
supabase link --project-ref ergqqdirsvmamowpklia

# 部署
supabase functions deploy teaching-assistant-ai

# (可選) 設置 OpenAI API Key
supabase secrets set OPENAI_API_KEY=sk-your-key-here
```

### 步驟 3: 測試前端 🎨

1. 重新整理瀏覽器 (`Ctrl+Shift+R`)
2. 使用 fengadult（或您的公司）帳號登入
3. 進入「已安裝模組」
4. 打開「AI 學習助教」或「AI 教學助手」

---

## 📊 測試數據

執行後可立即看到：

```
📚 學生 (3 位)
├─ STU001: 陳小明 (國中九年級) - 程度: 中等 - 風格: 視覺型
├─ STU002: 林美華 (高中一年級) - 程度: 進階 - 風格: 閱讀型
└─ STU003: 張大同 (國小六年級) - 程度: 初學 - 風格: 動覺型

📖 學習會話 (2 場)
├─ SES001: 陳小明 - 數學：一元二次方程式 (80%正確率)
└─ SES002: 林美華 - 英文：過去完成式 (87.5%正確率)

🎯 學習路徑
└─ 數學會考總複習 (進度 30%)

📝 知識點掌握
├─ 一元一次方程式：基本解法 (已掌握 90%)
├─ 一元二次方程式：因式分解 (練習中 70%)
└─ 過去完成式：基本用法 (已掌握 85%)
```

---

## 🤖 AI 功能測試

### 1. AI 概念解釋
```
科目: 數學
主題: 一元二次方程式
→ AI 會根據學生程度和學習風格提供個人化解釋
```

### 2. AI 出題
```
難度: 中等
題型: 選擇題
→ AI 生成符合台灣教育課綱的題目
```

### 3. AI 答案分析
```
學生答案 vs 正確答案
→ AI 分析錯誤類型、提供建議、給予鼓勵
```

### 4. AI 學習路徑規劃
```
目前程度 → 目標程度
→ AI 生成個人化學習計畫和里程碑
```

---

## 🔧 進階配置

### 啟用完整 AI 功能

設置 OpenAI API Key：
```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

**AI 功能包括：**
- ✅ 個人化概念解釋（適應學習風格）
- ✅ 智能出題（符合台灣課綱）
- ✅ 詳細答案分析
- ✅ 學習路徑規劃
- ✅ 鼓勵性回饋
- ✅ 下一主題推薦

**備註：** 沒有 OpenAI Key 時，系統會使用基本邏輯（功能受限）

### 自定義教學資源

```sql
INSERT INTO teaching_resources (
  company_id,
  resource_type,
  subject,
  topic,
  grade_level,
  title,
  description,
  difficulty
) VALUES (
  (SELECT id FROM companies WHERE name = 'fengadult' LIMIT 1),
  'lesson',
  '數學',
  '三角函數',
  '高中',
  '三角函數完全攻略',
  '從基礎到進階的完整教學',
  'medium'
);
```

---

## 📈 資料庫架構

### 核心表格（8 個）

1. **students** - 學生檔案
   - 基本資訊、學習風格、優弱勢、目標

2. **learning_sessions** - 學習會話
   - 時間、主題、表現、AI 回饋

3. **learning_questions** - 問題與答案
   - 題目、答案、AI 分析、錯誤類型

4. **learning_paths** - 學習路徑
   - 計畫、進度、里程碑、AI 推薦

5. **learning_milestones** - 里程碑
   - 主題、技能、要求、完成狀態

6. **knowledge_mastery** - 知識點掌握
   - 掌握度、狀態、練習統計、AI 評估

7. **ai_interactions** - AI 互動
   - 對話、情緒、意圖、有用性

8. **teaching_resources** - 教學資源
   - 課程、練習、影片、測驗

---

## 🎯 API 端點

### Edge Function: `teaching-assistant-ai`

**URL:**
```
https://ergqqdirsvmamowpklia.supabase.co/functions/v1/teaching-assistant-ai
```

**操作類型：**

1. **explain_concept** - 解釋概念
2. **generate_question** - 生成問題
3. **analyze_answer** - 分析答案
4. **create_learning_path** - 創建學習路徑
5. **provide_feedback** - 提供回饋
6. **recommend_next_topic** - 推薦下一主題

---

## 🔍 疑難排解

### 問題 1: 公司名稱錯誤
**錯誤：** `找不到公司`

**解決：**
```sql
-- 查詢公司名稱
SELECT name FROM companies;

-- 修改 QUICK_TEACHING_ASSISTANT_SETUP.sql 第 476 行
```

### 問題 2: Edge Function CORS 錯誤
**原因：** 未部署 Edge Function

**解決：**
```bash
supabase functions deploy teaching-assistant-ai
```

### 問題 3: AI 功能無回應
**原因：** 未設置 OpenAI API Key

**解決：**
```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

---

## ✅ 檢查清單

- [ ] 資料庫表格已創建（8 個表）
- [ ] 測試數據已插入（3 學生、2 會話）
- [ ] Edge Function 已部署
- [ ] 前端顯示正常
- [ ] 可以查看學生列表
- [ ] 可以查看學習會話
- [ ] AI 功能可用（需 API Key）

---

## 🎉 完成！

**AI 教學助手** 已經完全設置完成！

**下一步：**
1. 添加更多學生資料
2. 設置 OpenAI API Key（啟用完整 AI）
3. 自定義教學資源
4. 開始使用！

**祝教學愉快！** 📚✨

