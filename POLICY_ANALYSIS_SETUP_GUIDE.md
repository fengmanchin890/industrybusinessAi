# AI 政策分析系統 - 設置指南

## 🎯 系統概述

**AI 政策分析系統**為台灣政府機關提供智能化的政策評估與分析服務，協助政策制定者做出數據驅動的決策。

### 核心功能
- ✅ 政策綜合評估（有效性、效率、公平性、永續性）
- ✅ AI 驅動的影響分析
- ✅ 風險評估與緩解建議
- ✅ 績效指標追蹤
- ✅ 利害關係人意見管理
- ✅ 政策比較與模擬預測

---

## 📦 系統架構

### 資料庫層
- **6 個核心表格**：policies, policy_analyses, policy_indicators, policy_stakeholder_feedback, policy_comparisons, policy_simulations
- **完整 RLS 策略**：公司級數據隔離
- **統計函數**：get_policy_stats()

### API 層
- **Edge Function**：policy-analyzer
- **6 種分析類型**：綜合分析、影響評估、風險分析、效能評估、政策比較、模擬預測
- **AI 整合**：OpenAI GPT-4（可選）+ Rule-based fallback

### 前端層
- **React 組件**：PolicyAnalysis.tsx
- **實時數據連接**：Supabase Client
- **完整 UI**：政策列表、分析儀表板、指標追蹤、利害關係人管理

---

## 🚀 快速開始

### 步驟 1：資料庫設置（必須）

**在 Supabase SQL Editor 執行：**

1. 打開 [Supabase Dashboard](https://supabase.com/dashboard/project/ergqqdirsvmamowpklia/editor)
2. 點擊 **SQL Editor** → **New Query**
3. 複製 `QUICK_POLICY_SETUP.sql` 的完整內容
4. 點擊 **Run** 執行

**預期結果：**
```
✅ AI 政策分析系統安裝完成！
policies_count: 5
analyses_count: 3
indicators_count: 8
feedback_count: 3
```

### 步驟 2：部署 Edge Function

**使用 Supabase CLI：**

```powershell
# 切換到項目目錄
cd "C:\Users\User\Desktop\ai business platform"

# 部署 Edge Function
supabase functions deploy policy-analyzer
```

**或使用 Supabase Dashboard：**

1. 打開 [Edge Functions](https://supabase.com/dashboard/project/ergqqdirsvmamowpklia/functions)
2. 點擊 **Deploy new function**
3. 上傳 `supabase/functions/policy-analyzer/index.ts`
4. 點擊 **Deploy**

### 步驟 3：前端測試

1. 使用 **fenggov company** 帳號登入
2. 進入「**已安裝模組**」
3. 找到「**AI 政策分析系統**」
4. 點擊「**打開**」

**應該看到：**
- ✅ 5 個測試政策
- ✅ 統計儀表板（總政策、已分析、平均有效性等）
- ✅ 政策列表（長照2.0、綠能產業、數位學習等）
- ✅ 可以執行 AI 分析

---

## 📊 測試數據說明

系統已預載 **5 個政府政策**供測試：

### 1. 長照2.0擴大服務計畫 (POL-2024-001)
- **類別**：社會政策
- **狀態**：已實施
- **預算**：NT$ 5,000 億
- **目標**：65歲以上長者及失能者
- **已分析**：✅ 整體評分 78/100

### 2. 綠能產業發展政策 (POL-2024-002)
- **類別**：經濟政策
- **狀態**：已實施
- **預算**：NT$ 3,000 億
- **目標**：再生能源業者、一般企業
- **已分析**：✅ 整體評分 85/100

### 3. 數位學習推廣計畫 (POL-2024-003)
- **類別**：教育政策
- **狀態**：已實施
- **預算**：NT$ 800 億
- **目標**：中小學師生
- **已分析**：✅ 整體評分 76/100

### 4. 智慧城市基礎建設 (POL-2024-004)
- **類別**：基礎建設
- **狀態**：審查中
- **預算**：NT$ 4,500 億
- **目標**：全體市民

### 5. 青年創業扶植方案 (POL-2024-005)
- **類別**：經濟政策
- **狀態**：提案中
- **預算**：NT$ 500 億
- **目標**：18-45歲青年創業者

---

## 🤖 AI 功能設置

### OpenAI API Key（推薦但非必須）

**啟用 AI 增強分析：**

1. 獲取 [OpenAI API Key](https://platform.openai.com/api-keys)
2. 在 Supabase Dashboard → Settings → Edge Functions → Environment Variables
3. 添加：`OPENAI_API_KEY = sk-...`
4. 重新部署 Edge Function

**啟用後的 AI 功能：**
- 🧠 GPT-4 深度政策分析
- 📊 智能影響評估
- 💡 個性化建議生成
- 🎯 精準風險識別
- 📈 預測性分析

**未啟用時：**
- ✅ 仍可使用基於規則的分析
- ✅ 所有核心功能正常運作
- ✅ 評分系統完全可用

---

## 🎯 功能使用指南

### 1. 查看政策列表

在主頁面可以看到：
- **政策卡片**：顯示標題、類別、狀態、預算
- **篩選功能**：按類別、狀態篩選
- **搜尋功能**：搜尋政策名稱

### 2. 執行政策分析

**步驟：**
1. 選擇一個政策
2. 點擊「**AI 分析**」按鈕
3. 選擇分析類型：
   - 綜合分析（推薦）
   - 影響評估
   - 風險分析
   - 效能評估
4. 等待 AI 分析（3-10 秒）
5. 查看分析結果

**分析結果包含：**
- 📊 6 個評分維度（0-100）
- ✅ 正面影響列表
- ⚠️ 負面影響列表
- 👥 受影響群體
- ⚠️ 風險清單 + 緩解措施
- 💡 AI 建議（5-10 條）

### 3. 追蹤績效指標

在「**績效指標**」分頁：
- 查看所有指標狀態
- 目標值 vs. 當前值對比
- 趨勢分析（增長/下降/穩定）
- 狀態標記（達標/風險/落後）

### 4. 管理利害關係人意見

在「**利害關係人**」分頁：
- 查看所有意見回饋
- 按類型篩選（支持/反對/建議/關切）
- AI 情緒分析
- 回應管理

### 5. 政策比較

**比較多個政策：**
1. 選擇 2-5 個政策
2. 點擊「**比較**」
3. 查看並排比較結果
4. AI 推薦最佳實踐

### 6. 模擬預測

**進行情境模擬：**
1. 選擇政策
2. 點擊「**模擬**」
3. 設定參數（預算、時程等）
4. 查看預測結果（最佳/最可能/最差情況）

---

## 📈 統計儀表板

主頁面顯示關鍵統計：

```
📊 總政策數：5
✅ 已分析：3
📈 平均有效性：79.3
⚠️ 高風險：0
🚀 已實施：3
```

---

## 🔧 進階配置

### 自訂分析權重

修改 `policy-analyzer/index.ts` 中的評分權重：

```typescript
const overallScore = Math.round(
  (effectivenessScore * 0.3 +  // 有效性 30%
   efficiencyScore * 0.2 +      // 效率 20%
   equityScore * 0.2 +          // 公平性 20%
   sustainabilityScore * 0.15 + // 永續性 15%
   feasibilityScore * 0.15)     // 可行性 15%
);
```

### 添加自訂指標類型

在 migration 中添加新的 indicator_type：

```sql
indicator_type TEXT CHECK (indicator_type IN 
  ('input', 'output', 'outcome', 'impact', 'process', 'your_custom_type')
)
```

### 整合外部數據源

在 Edge Function 中添加外部 API 調用：

```typescript
// 從政府開放數據平台獲取數據
const externalData = await fetch('https://data.gov.tw/api/...');
```

---

## ❓ 常見問題

### Q1: 看不到測試政策？

**檢查：**
1. 確認使用 **fenggov** 或其他政府機構帳號
2. 在 SQL Editor 執行查詢確認數據：
```sql
SELECT * FROM policies WHERE company_id IN 
  (SELECT id FROM companies WHERE name ILIKE '%gov%');
```
3. 如果沒有數據，重新執行 `QUICK_POLICY_SETUP.sql`

### Q2: AI 分析失敗？

**可能原因：**
1. ❌ Edge Function 未部署
2. ❌ OpenAI API Key 未設置（但應該會 fallback）
3. ❌ RLS 策略阻止插入

**解決：**
```sql
-- 檢查 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'policy_analyses';

-- 測試插入權限
INSERT INTO policy_analyses (company_id, policy_id, analysis_type) 
VALUES ('your-company-id', 'your-policy-id', 'comprehensive');
```

### Q3: 統計數字不正確？

**測試統計函數：**
```sql
SELECT * FROM get_policy_stats(
  (SELECT id FROM companies WHERE name ILIKE '%gov%' LIMIT 1)
);
```

### Q4: 前端顯示空白？

**檢查控制台錯誤：**
- 按 F12 打開開發者工具
- 查看 Console 標籤
- 常見錯誤：
  - CORS 錯誤 → Edge Function 未部署
  - 403 Forbidden → RLS 策略問題
  - 404 Not Found → 表格不存在

---

## 🎓 評分標準說明

### 有效性評分 (Effectiveness Score)
- **定義**：政策達成既定目標的程度
- **計算**：基於績效指標達標率
- **80-100**：優異，目標達成度高
- **60-79**：良好，大部分目標達成
- **40-59**：尚可，需要改善
- **< 40**：不佳，需要重新評估

### 效率評分 (Efficiency Score)
- **定義**：資源使用效率
- **計算**：基於預算執行率、資源配置
- **指標**：投入產出比、成本效益

### 公平性評分 (Equity Score)
- **定義**：利益分配的公平性
- **評估**：服務普及性、弱勢照顧、機會均等

### 永續性評分 (Sustainability Score)
- **定義**：長期可持續發展能力
- **評估**：財源穩定性、環境影響、社會影響

### 可行性評分 (Feasibility Score)
- **定義**：政策實施的難易度
- **評估**：技術可行性、法規完備性、執行能力

---

## 📝 最佳實踐

### 1. 定期執行分析
- 建議每季執行一次綜合分析
- 重大政策調整後重新分析
- 追蹤評分趨勢變化

### 2. 完整記錄指標
- 設定明確的目標值
- 定期更新當前值
- 記錄數據來源與方法

### 3. 積極管理利害關係人意見
- 及時回應關切事項
- 採納合理建議
- 保持透明溝通

### 4. 使用比較功能
- 比較類似政策的執行成效
- 學習最佳實踐經驗
- 避免重複錯誤

---

## 🔄 資料庫維護

### 定期清理
```sql
-- 刪除超過 2 年的草稿政策
DELETE FROM policies 
WHERE status = 'draft' 
  AND created_at < NOW() - INTERVAL '2 years';

-- 歸檔舊政策
UPDATE policies 
SET status = 'archived' 
WHERE status = 'implemented' 
  AND actual_completion_date < NOW() - INTERVAL '5 years';
```

### 資料備份
```sql
-- 匯出政策數據
COPY (SELECT * FROM policies) TO '/path/to/backup/policies.csv' CSV HEADER;
COPY (SELECT * FROM policy_analyses) TO '/path/to/backup/analyses.csv' CSV HEADER;
```

---

## 🚀 下一步

### 完善其他政府模組
使用相同架構標準：
1. **AI 數據治理** ✅（已完成）
2. **AI 安全監控** ✅（已完成）
3. **AI 政策分析** ✅（已完成）
4. **AI 公文助理**（待開發）
5. **AI 民意分析**（待開發）

### 整合建議
- 連接政府開放數據平台
- 整合法規資料庫
- 建立跨部門協作機制
- 實施自動化報告系統

---

## 📞 技術支援

如遇問題：
1. 查看本指南的常見問題
2. 檢查控制台錯誤訊息
3. 測試資料庫連接
4. 確認 Edge Function 狀態

**系統已就緒！開始使用 AI 政策分析系統吧！** 🎉

---

**文檔版本**: 1.0.0  
**創建日期**: 2024-10-18  
**適用系統**: AI Business Platform - Government Edition

