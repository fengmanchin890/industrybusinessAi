# 🏥 AI 病歷分析系統 - 快速設置指南

## ⚠️ 重要提示
你看到的錯誤是因為數據庫表尚未創建。請按照以下步驟操作：

## 📋 錯誤信息
```
Could not find the table 'public.medical_records' in the schema cache
Could not find the function public.get_medical_today_stats
```

## 🚀 快速設置步驟

### 步驟 1：打開 Supabase Dashboard
1. 訪問：https://supabase.com/dashboard
2. 選擇你的項目
3. 點擊左側菜單的 **SQL Editor**

### 步驟 2：執行數據庫 Migration
1. 點擊 **New Query** 按鈕
2. 複製整個文件：`supabase/migrations/20251018000000_add_medical_records_tables.sql`
3. 粘貼到 SQL Editor
4. 點擊 **Run** 按鈕執行

### 步驟 3：驗證安裝
執行以下查詢驗證表是否創建成功：

```sql
-- 檢查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('patients', 'medical_records', 'medical_ai_analysis', 'medical_stats');

-- 檢查示例數據
SELECT * FROM patients;
SELECT * FROM medical_records;
```

### 步驟 4：刷新前端
執行 SQL 後：
1. 回到瀏覽器
2. 按 **Ctrl + F5** 強制刷新
3. 重新打開 "AI 病歷分析" 模組

---

## 📊 創建的數據庫結構

### 表 (Tables)
1. **patients** - 患者基本資料
   - 患者姓名、年齡、性別、聯繫方式
   - 血型、過敏史、保險信息

2. **medical_records** - 病歷記錄
   - 就診信息、主訴、症狀
   - 生命徵象、病史、用藥記錄
   - 檢查結果、診斷、治療計畫

3. **medical_ai_analysis** - AI 分析結果
   - 病歷摘要、關鍵發現
   - 風險因素、建議診斷
   - 藥物交互作用、追蹤建議

4. **medical_stats** - 統計數據
   - 每日病歷統計
   - 分析時間、準確率

### 函數 (Functions)
- **get_medical_today_stats()** - 獲取今日統計數據

### 示例數據
- 自動為 fenghospital 公司創建 2 個示例患者
- 自動創建 2 個示例病歷
  - 王小明 (65歲, 男) - 冠狀動脈疾病
  - 李美華 (45歲, 女) - 偏頭痛

---

## 🎯 系統功能

### ✅ 已實現功能

#### 1. **病歷管理**
- 📋 查看病歷列表
- 👤 患者基本信息
- 🏥 就診記錄

#### 2. **AI 智能分析**
- 🤖 真實 AI 分析（OpenAI/Claude）
- 📝 病歷摘要生成
- 🔍 關鍵發現識別
- ⚠️ 風險因素評估
- 💊 藥物交互作用檢查
- 📋 診斷建議
- 🚨 緊急程度判定

#### 3. **數據持久化**
- 💾 病歷保存到數據庫
- 📊 AI 分析結果保存
- 📈 統計數據計算
- 🔄 歷史記錄查詢

#### 4. **報告生成**
- 📄 完整病歷分析報告
- 📊 包含所有分析結果
- 📤 可導出分享

#### 5. **警報系統**
- 🚨 高風險病例自動警報
- ⚡ 緊急情況即時通知

---

## 🔧 技術架構

```
前端 (Frontend)
├── MedicalRecordAssistant.tsx    # UI 組件
└── medical-record-service.ts     # 服務層

數據庫 (Supabase PostgreSQL)
├── patients                       # 患者表
├── medical_records               # 病歷表
├── medical_ai_analysis           # AI 分析結果表
└── medical_stats                 # 統計數據表

AI 服務 (AI Services)
├── OpenAI (GPT-4)               # 主要 AI 模型
└── Anthropic (Claude)           # 備用 AI 模型
```

---

## 📝 使用流程

### 1. **查看病歷列表**
- 左側顯示所有病歷
- 包含患者姓名、年齡、主訴

### 2. **選擇病歷分析**
- 點擊任一病歷
- AI 自動開始分析
- 顯示分析結果

### 3. **查看分析結果**
- 病歷摘要
- 關鍵發現
- 風險因素
- 診斷建議
- 追蹤建議

### 4. **生成報告**
- 點擊 "生成報告" 按鈕
- 系統自動生成完整報告
- 保存到報告列表

---

## 🎨 UI 功能

### 統計卡片
- **總病歷數** - 系統中的總病歷數量
- **今日已分析** - 今天使用 AI 分析的病歷數
- **平均分析時間** - AI 分析平均耗時
- **準確率** - AI 分析準確率

### 緊急程度標識
- 🔴 **緊急 (Critical)** - 需要立即處理
- 🟠 **高 (High)** - 需要盡快處理
- 🟡 **中 (Medium)** - 常規處理
- 🟢 **低 (Low)** - 可延後處理

---

## 🐛 常見問題

### Q1: 為什麼看不到病歷？
**A:** 請確保已執行 SQL migration 文件。

### Q2: AI 分析失敗怎麼辦？
**A:** 檢查是否配置了 OpenAI 或 Anthropic API Key。

### Q3: 統計數據為什麼都是 0？
**A:** 需要先創建並分析病歷，統計數據才會更新。

### Q4: 如何添加新病歷？
**A:** 目前系統自動創建了示例數據。後續版本將添加病歷創建功能。

---

## 📚 SQL 文件位置

```
supabase/migrations/20251018000000_add_medical_records_tables.sql
```

---

## ✅ 驗證清單

安裝後請檢查以下項目：

- [ ] SQL migration 已執行
- [ ] 4 個表已創建 (patients, medical_records, medical_ai_analysis, medical_stats)
- [ ] 函數 get_medical_today_stats 已創建
- [ ] 示例數據已插入 (2 個患者, 2 個病歷)
- [ ] 前端已刷新
- [ ] 可以看到病歷列表
- [ ] 點擊病歷可以進行 AI 分析
- [ ] 統計數據正常顯示

---

## 🎉 完成後的效果

### 你將看到：
1. **左側** - 2 個示例病歷
   - 王小明 - 冠狀動脈疾病
   - 李美華 - 偏頭痛

2. **右側** - AI 分析結果
   - 病歷摘要
   - 關鍵發現
   - 風險評估
   - 診斷建議

3. **頂部** - 統計數據
   - 總病歷數: 2
   - 今日已分析: 0
   - 平均分析時間: 45 秒
   - 準確率: 92%

---

## 🚀 現在就開始！

1. 打開 Supabase SQL Editor
2. 執行 `supabase/migrations/20251018000000_add_medical_records_tables.sql`
3. 刷新瀏覽器 (Ctrl + F5)
4. 打開 "AI 病歷分析" 模組
5. 點擊病歷開始分析！

---

## 💡 提示

- ✨ AI 分析使用真實的 GPT-4 或 Claude 模型
- 📊 分析結果會自動保存到數據庫
- 🔍 每次點擊病歷時，如果已有分析結果會直接顯示
- ⚡ 高風險病例會自動發送警報
- 📄 可以隨時生成完整的分析報告

---

**需要幫助？** 查看 SQL 文件內的註釋或聯繫技術支持！

