# 📋 AI 病歷助理系統 - 完整指南

## 📋 系統概述

AI 病歷助理系統提供智能病歷分析與診斷建議，包括：

- 📝 智能病歷記錄與管理
- 🤖 AI 病歷分析與摘要
- 🔍 症狀分析與診斷建議
- ⚠️ 風險評估與預警
- 💊 藥物交互作用檢查
- 📊 病歷審核與品質管理

---

## 🚀 快速部署指南

### 步驟 1：部署資料庫
在 **Supabase Dashboard** 的 SQL Editor 中執行：
```sql
-- 執行 Migration
-- 複製並執行: supabase/migrations/20251018270000_add_medical_record_tables.sql
```

### 步驟 2：執行快速設置
```sql
-- 執行快速設置腳本
-- 複製並執行: QUICK_MEDICAL_RECORD_SETUP.sql
```

### 步驟 3：部署 Edge Function
```bash
.\DEPLOY_MEDICAL_RECORD.bat
# 或
npx supabase functions deploy medical-record-ai --no-verify-jwt
```

### 步驟 4：測試系統
1. 使用 `fenghopital@gmail.com` 登入
2. 進入「AI 病歷助理」模組
3. 查看測試病歷並進行 AI 分析

---

## 📊 資料庫架構

### 核心表格

#### 1. **medical_records** - 病歷記錄表
- 患者基本資料、就診資訊
- 主訴、症狀、生命體征
- 診斷、治療計劃、用藥記錄

#### 2. **medical_record_analysis** - AI 分析表
- AI 摘要與關鍵點
- 症狀分析
- 診斷建議
- 風險評估
- 治療建議

#### 3. **symptom_dictionary** - 症狀字典
- 症狀代碼與名稱
- 症狀分類
- 相關疾病

#### 4. **diagnosis_suggestions** - 診斷建議
- AI 診斷建議
- 信心度評分
- 推理依據

#### 5. **medical_record_templates** - 病歷模板
- 部門專用模板
- 必填欄位定義

#### 6. **medical_record_reviews** - 審核記錄
- 品質審核
- 同儕審查

---

## 🔧 Edge Function API

### 1. 分析病歷
```javascript
const { data } = await supabase.functions.invoke('medical-record-ai', {
  body: {
    action: 'analyze_record',
    data: {
      recordId: 'record-uuid',
      companyId: 'company-uuid'
    }
  }
})
```

### 2. 生成摘要
```javascript
const { data } = await supabase.functions.invoke('medical-record-ai', {
  body: {
    action: 'generate_summary',
    data: { recordId: 'record-uuid' }
  }
})
```

### 3. 診斷建議
```javascript
const { data } = await supabase.functions.invoke('medical-record-ai', {
  body: {
    action: 'suggest_diagnosis',
    data: {
      symptoms: ['咳嗽', '發燒'],
      vitalSigns: { temperature: 38.5 },
      patientAge: 45,
      patientGender: 'male'
    }
  }
})
```

### 4. 藥物交互檢查
```javascript
const { data } = await supabase.functions.invoke('medical-record-ai', {
  body: {
    action: 'check_medication_interactions',
    data: {
      medications: [
        { name: '藥物A', dosage: '500mg' },
        { name: '藥物B', dosage: '10mg' }
      ]
    }
  }
})
```

### 5. 風險評估
```javascript
const { data } = await supabase.functions.invoke('medical-record-ai', {
  body: {
    action: 'assess_risk',
    data: {
      symptoms: ['胸痛', '呼吸困難'],
      vitalSigns: { bloodPressure: '180/110' },
      pastHistory: ['高血壓', '心臟病'],
      age: 65
    }
  }
})
```

---

## 🎯 AI 分析邏輯

### 風險等級判定
- **低風險 (low)**: 風險分數 < 20
- **中等風險 (moderate)**: 20 ≤ 風險分數 < 40
- **高風險 (high)**: 40 ≤ 風險分數 < 60
- **緊急 (critical)**: 風險分數 ≥ 60

### 信心度計算
基礎分數 50 分，根據以下因素加分：
- 完整症狀描述 (+15)
- 生命體征資料 (+15)
- 病史資料 (+10)
- 體格檢查 (+10)

---

## 📝 測試數據

快速設置腳本創建了 3 筆測試病歷：

1. **MR-2025-001**: 張大明 - 急性上呼吸道感染
2. **MR-2025-002**: 李小華 - 急性胃腸炎
3. **MR-2025-003**: 王美玲 - 高血壓追蹤

---

## ✅ 檢查清單

- [ ] 資料庫 Migration 已執行
- [ ] 快速設置已執行
- [ ] Edge Function 已部署
- [ ] 前端模組可正常載入
- [ ] 可以查看病歷列表
- [ ] AI 分析功能正常
- [ ] 診斷建議功能正常

---

## 🎉 完成！

AI 病歷助理系統現已完全部署並可使用！
