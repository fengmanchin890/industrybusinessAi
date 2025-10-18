# AI 數據治理 - 測試指南

## ✅ 您的登入狀態

根據控制台日誌，您已成功登入：
- **用戶 ID**: `3981fb47-79d8-4da6-a8e1-f0ef0cd3c69e`
- **公司**: `fenggov company`
- **行業**: `government` ✅
- **認證狀態**: ✅ 已認證

**太完美了！** 您使用的正是政府機構帳號，所有測試數據都是為這個帳號準備的。

---

## 🎯 立即測試步驟

### 步驟 1️⃣：找到模組
1. 在左側導航欄找到「**已安裝模組**」
2. 在模組列表中找到「**AI 數據治理**」
3. 點擊「**打開**」按鈕

### 步驟 2️⃣：檢查首頁統計
您應該看到 5 個統計卡片：

```
📊 總資產數：5
📋 已分類：5
✅ 合規資產：1
⚠️ 高風險：0
⏳ 待評估：0
```

### 步驟 3️⃣：查看數據資產列表
在「**數據資產管理**」分頁，您應該看到 5 個資產：

| 資產名稱 | 類型 | 分類等級 | 部門 | 標記 |
|---------|------|---------|------|------|
| 🔴 公民身份證資料庫 | database | secret | 內政部 | 個人資料 |
| 🟡 政府支出記錄 | database | confidential | 財政部 | 敏感 |
| 🔵 公共設施維護紀錄 | file | internal | 工務局 | - |
| 🟡 員工人事資料 | database | confidential | 人事處 | 個人資料 |
| 🟢 公開統計資料 | dataset | public | 統計處 | - |

### 步驟 4️⃣：測試合規檢查
1. 點擊「**合規檢查**」分頁
2. 點擊「**執行新檢查**」按鈕
3. 選擇檢查類型：
   - 🇪🇺 **GDPR 合規檢查**
   - 🇸🇬 **PDPA 隱私檢查**
   - 🔒 **ISO 27001 安全檢查**
   - 🌐 **一般數據治理檢查**
4. 點擊「**執行檢查**」

**預期結果：**
- 顯示載入中動畫
- 幾秒後顯示檢查結果
- 包含：合規分數、風險等級、發現的問題、改善建議

### 步驟 5️⃣：查看審計日誌
點擊「**審計日誌**」分頁，您應該看到 3 筆訪問記錄：

| 用戶 | 部門 | 資產 | 操作 | 狀態 |
|------|------|------|------|------|
| 張承辦 | 統計處 | 政府支出記錄 | export | ✅ 正常 |
| 李組長 | 內政部 | 公民身份證資料庫 | query | ✅ 正常 |
| unknown_user | unknown | 公民身份證資料庫 | access | ⚠️ 異常 |

---

## 🔍 驗證資料庫數據

如果前端沒有顯示數據，在 Supabase SQL Editor 執行這個查詢：

```sql
-- 快速驗證
SELECT 
  '✅ fenggov company' as company_name,
  (SELECT COUNT(*) FROM data_assets WHERE company_id IN 
    (SELECT id FROM companies WHERE name = 'fenggov company')) as assets_count,
  (SELECT COUNT(*) FROM classification_rules WHERE company_id IN 
    (SELECT id FROM companies WHERE name = 'fenggov company')) as rules_count,
  (SELECT COUNT(*) FROM compliance_checks WHERE company_id IN 
    (SELECT id FROM companies WHERE name = 'fenggov company')) as checks_count;
```

**預期結果：**
```
company_name: ✅ fenggov company
assets_count: 5
rules_count: 3
checks_count: 2
```

或者執行完整驗證腳本：`VERIFY_DATA_GOVERNANCE.sql`

---

## 🎨 UI 功能測試清單

### 基本功能
- [ ] 統計卡片顯示正確數字
- [ ] 數據資產列表顯示 5 個項目
- [ ] 分頁切換正常（資產/合規/隱私/審計）
- [ ] 載入動畫顯示

### 搜尋/篩選
- [ ] 搜尋資產名稱
- [ ] 按分類等級篩選
- [ ] 按資產類型篩選

### 合規檢查
- [ ] 執行 GDPR 檢查
- [ ] 執行 ISO 27001 檢查
- [ ] 查看檢查歷史記錄
- [ ] 查看詳細問題和建議

### 報告生成
- [ ] 點擊「生成報告」按鈕
- [ ] 選擇報告類型
- [ ] 下載或預覽報告

### AI 功能（需要 OpenAI API Key）
- [ ] AI 分析提供更詳細的建議
- [ ] 智能分類建議
- [ ] 風險評分計算

---

## ❓ 常見問題

### Q1: 看不到數據資產
**原因：**
- 可能沒有使用正確的公司帳號
- 資料庫數據未正確載入

**解決：**
```sql
-- 檢查數據是否存在
SELECT * FROM data_assets WHERE company_id IN 
  (SELECT id FROM companies WHERE name = 'fenggov company');
```

### Q2: 統計數字都是 0
**原因：**
- `get_governance_stats` 函數未正確執行

**解決：**
```sql
-- 測試統計函數
SELECT get_governance_stats(
  (SELECT id FROM companies WHERE name = 'fenggov company')
).*;
```

### Q3: 合規檢查失敗
**原因：**
- Edge Function 未部署
- OpenAI API Key 未配置（不影響基本功能）

**解決：**
- 檢查 `supabase/functions/data-governance-analyzer/index.ts` 是否已部署
- 基本檢查不需要 AI，會使用資料庫邏輯

### Q4: 控制台有錯誤
**常見錯誤：**

1. **Table not found**
   ```
   解決：重新執行 QUICK_DATA_GOVERNANCE_SETUP.sql
   ```

2. **Function does not exist**
   ```
   解決：確認統計函數已創建
   ```

3. **RLS policy violation**
   ```
   解決：檢查 RLS 策略是否正確設置
   ```

---

## 🚀 進階測試

### 測試 1：添加新資產
1. 點擊「**新增資產**」按鈕
2. 填寫資產信息：
   - 資產名稱：測試資料庫
   - 類型：database
   - 分類：confidential
   - 部門：資訊部
3. 保存並查看列表

### 測試 2：執行隱私評估
1. 選擇一個包含個人資料的資產
2. 點擊「**隱私影響評估**」分頁
3. 點擊「**執行評估**」
4. 查看 AI 生成的隱私風險分析

### 測試 3：查看風險趨勢
1. 點擊統計卡片中的「**高風險**」
2. 查看風險資產詳情
3. 點擊「**查看建議**」

---

## 📊 性能基準

**載入速度：**
- 首次載入：< 2 秒
- 切換分頁：< 500ms
- 搜尋/篩選：即時

**AI 分析：**
- 基本檢查（無 AI）：< 1 秒
- AI 增強檢查：3-5 秒

---

## ✅ 測試完成檢查表

完成以下所有項目即表示模組運行正常：

- [ ] ✅ 使用 fenggov 帳號登入
- [ ] 📊 統計儀表板顯示正確
- [ ] 📋 看到 5 個測試數據資產
- [ ] 🔍 搜尋和篩選功能正常
- [ ] ✅ 執行合規檢查成功
- [ ] 📄 報告生成功能可用
- [ ] 🔐 審計日誌顯示訪問記錄
- [ ] 🎨 所有 UI 元素正常顯示
- [ ] 🚀 沒有控制台錯誤

---

## 🎉 成功標誌

如果您看到以下內容，表示系統運行完美：

✅ **統計儀表板**
```
總資產數: 5
已分類: 5
合規資產: 1+
```

✅ **數據資產列表**
```
顯示 5 個政府機構的測試資產
包含不同分類等級和類型
```

✅ **合規檢查**
```
可以執行 GDPR/ISO27001 檢查
顯示詳細的問題和建議
```

✅ **無錯誤**
```
控制台沒有紅色錯誤訊息
只有藍色的日誌訊息
```

---

## 💡 下一步

測試完成後，您可以：

1. **添加真實數據**
   - 替換測試數據
   - 連接實際數據源

2. **自訂規則**
   - 添加分類規則
   - 設定合規策略

3. **啟用 AI**
   - 配置 OpenAI API Key
   - 獲得更智能的分析

4. **完善其他模組**
   - AI 財務分析
   - AI 客服助理
   - AI 進貨預測

---

**祝測試順利！** 🎉

有任何問題隨時告訴我。

