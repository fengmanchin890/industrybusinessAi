# AI 藥物管理系統 - 設置指南

## ❌ 當前錯誤
```
Could not find the table 'public.medications' in the schema cache
```

這表示數據庫表尚未創建。請按照以下步驟設置。

---

## 📋 快速設置步驟

### 方法 1：使用 Supabase Dashboard（推薦，最簡單）

1. **打開 Supabase Dashboard**
   - 前往：https://supabase.com/dashboard
   - 選擇您的專案：`ergqqdirsvmamowpklia`

2. **運行 Migration SQL**
   - 點擊左側菜單 **SQL Editor**
   - 點擊 **New Query**
   - 複製並貼上整個檔案內容：
     ```
     supabase/migrations/20251018100000_add_drug_management_tables.sql
     ```
   - 點擊 **Run** 執行

3. **驗證表格已創建**
   - 點擊左側菜單 **Table Editor**
   - 應該看到以下新表：
     - ✅ `medications` (藥物資料庫)
     - ✅ `drug_interactions` (藥物交互作用)
     - ✅ `prescriptions` (處方記錄)
     - ✅ `prescription_items` (處方明細)
     - ✅ `patient_allergies` (病患過敏記錄)
     - ✅ `drug_interaction_checks` (AI 檢查記錄)

4. **導入種子數據（可選但推薦）**
   在 SQL Editor 中再次新增查詢，運行：
   ```sql
   -- 將在下方提供完整的種子數據 SQL
   ```

5. **重新整理網頁應用**
   - 回到您的應用
   - 按 `Ctrl+Shift+R` (或 `Cmd+Shift+R`) 強制重新整理
   - 再次搜尋藥物，應該就能正常運作了！

---

### 方法 2：使用 Supabase CLI（進階）

如果您已安裝 Supabase CLI：

```bash
# 1. 確保已登入
supabase login

# 2. 連結到您的專案
supabase link --project-ref ergqqdirsvmamowpklia

# 3. 推送 migration
supabase db push

# 4. 導入種子數據
node scripts/seed-medications.js
```

**注意：** 需要設置環境變數：
```bash
# .env.local
VITE_SUPABASE_URL=https://ergqqdirsvmamowpklia.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
```

---

## 🗃️ 數據庫架構概覽

已創建的表格：

### 1. `medications` - 藥物資料庫
- 藥物基本信息（名稱、成分、劑型）
- 用藥指引（劑量、頻率、給藥途徑）
- 安全信息（禁忌症、警告、副作用）
- 健保信息

### 2. `drug_interactions` - 藥物交互作用
- 交互作用嚴重程度（minor/moderate/major/contraindicated）
- 臨床效果和處理建議
- 作用機轉

### 3. `prescriptions` - 處方記錄
- 處方基本信息
- 醫師信息
- 審核狀態

### 4. `prescription_items` - 處方明細
- 用藥詳情（劑量、頻率、療程）
- 領藥記錄

### 5. `patient_allergies` - 病患過敏記錄
- 過敏源類型
- 反應嚴重程度
- 症狀描述

### 6. `drug_interaction_checks` - AI 檢查記錄
- AI 分析結果
- 風險評分
- 臨床警示和建議

---

## 🤖 AI 功能（可選增強）

### 啟用 OpenAI 集成

如果您想使用真正的 AI 分析（GPT-4），需要：

1. **取得 OpenAI API Key**
   - 前往：https://platform.openai.com/api-keys
   - 創建新的 API Key

2. **在 Supabase 設置 Secrets**
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-your-key-here
   ```

3. **部署 Edge Function**
   ```bash
   supabase functions deploy drug-interaction-checker
   ```

**不設置也可以！** 系統會自動使用資料庫的交互作用數據，仍然非常實用。

---

## ✅ 驗證設置

運行後，您應該能夠：

1. ✅ 搜尋藥物（輸入 2 個字元後開始搜尋）
2. ✅ 添加藥物到病患用藥清單
3. ✅ 執行 AI 交互作用檢查
4. ✅ 查看風險評估和建議
5. ✅ 生成用藥安全報告

---

## 🆘 常見問題

### Q: 還是看到 404 錯誤？
A: 
1. 確認已在 Supabase Dashboard 執行 migration
2. 檢查 Table Editor 中是否有 `medications` 表
3. 嘗試重新整理 Supabase API schema cache：
   - Dashboard → Settings → API → Reload schema cache

### Q: 表格是空的，沒有藥物可搜尋？
A: 需要導入種子數據（見下方 SQL）

### Q: 想要更多藥物？
A: 可以在 SQL Editor 中手動插入，或修改 `scripts/seed-medications.js` 添加更多藥物

---

## 📝 接下來的步驟

設置完成後，您可以：

1. **測試功能**
   - 搜尋 "阿斯匹靈" 或 "Aspirin"
   - 添加多種藥物
   - 執行交互作用檢查

2. **查看其他模組**
   - AI 病歷分析
   - 護理排班
   - 健康監測

3. **自訂藥物資料庫**
   - 添加您醫院常用的藥物
   - 更新交互作用資料

---

## 🎯 當前系統架構

```
✅ 前端組件
├── DrugManagement.tsx (新版，連接真實 API)
└── DrugInteractionChecker.tsx (舊版，使用模擬數據)

⏳ 數據庫 (需要設置)
├── medications (藥物資料庫)
├── drug_interactions (交互作用)
├── prescriptions (處方)
├── prescription_items (處方明細)
├── patient_allergies (過敏記錄)
└── drug_interaction_checks (檢查記錄)

⏳ Edge Functions (可選)
├── drug-interaction-checker (AI 分析)
└── drug-search (智能搜尋)

✅ Migration Files
├── 20251018100000_add_drug_management_tables.sql
└── seed-medications.js
```

---

需要幫助？請告訴我！

