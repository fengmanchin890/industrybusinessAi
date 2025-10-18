# 🏥 AI 健康監測系統 - 完整指南

## 📋 系統概述

AI 健康監測系統是一個智能健康數據追蹤與分析平台，提供：

- 📊 生命體征監測（血壓、心率、體溫、血氧、血糖等）
- 🤖 AI 健康分析與風險評估
- ⚠️ 智能異常預警
- 📈 健康趨勢分析
- 📋 自動化健康報告生成

---

## 🚀 快速部署指南

### 步驟 1：部署資料庫

在 **Supabase Dashboard** 的 SQL Editor 中執行：

```sql
-- 1. 執行 Migration
-- 複製並執行: supabase/migrations/20251018260000_add_health_monitoring_tables.sql
```

### 步驟 2：執行快速設置

```sql
-- 2. 執行快速設置腳本
-- 複製並執行: QUICK_HEALTH_MONITORING_SETUP.sql
```

### 步驟 3：部署 Edge Function

```bash
# 方法 1: 使用批處理文件
.\DEPLOY_HEALTH_MONITORING.bat

# 方法 2: 使用命令行
npx supabase functions deploy health-monitoring-ai --no-verify-jwt
```

### 步驟 4：測試系統

1. 使用 `fenghopital@gmail.com` 登入
2. 進入「AI 健康監測」模組
3. 選擇患者並記錄生命體征
4. 查看 AI 分析結果

---

## 📊 資料庫架構

### 核心表格

#### 1. **patients** - 患者資料表
```sql
- id: UUID (主鍵)
- company_id: UUID (公司ID)
- patient_code: TEXT (患者編號)
- patient_name: TEXT (患者姓名)
- date_of_birth: DATE (出生日期)
- gender: TEXT (性別)
- blood_type: TEXT (血型)
- height_cm, weight_kg: DECIMAL (身高體重)
- chronic_conditions: TEXT[] (慢性病)
- allergies: TEXT[] (過敏史)
- status: TEXT (狀態)
```

#### 2. **vital_signs** - 生命體征記錄表
```sql
- id: UUID (主鍵)
- patient_id: UUID (患者ID)
- measurement_time: TIMESTAMPTZ (測量時間)
- systolic_bp: INTEGER (收縮壓)
- diastolic_bp: INTEGER (舒張壓)
- heart_rate: INTEGER (心率)
- temperature: DECIMAL (體溫)
- respiratory_rate: INTEGER (呼吸率)
- oxygen_saturation: INTEGER (血氧)
- blood_glucose: DECIMAL (血糖)
```

#### 3. **health_metrics** - 健康指標分析表
```sql
- id: UUID (主鍵)
- patient_id: UUID (患者ID)
- metric_date: DATE (日期)
- bmi: DECIMAL (BMI值)
- health_score: INTEGER (健康評分 0-100)
- risk_level: TEXT (風險等級)
- ai_analysis: JSONB (AI分析結果)
```

#### 4. **health_alerts** - 健康警報表
```sql
- id: UUID (主鍵)
- patient_id: UUID (患者ID)
- alert_type: TEXT (警報類型)
- severity: TEXT (嚴重程度: info/warning/critical)
- title: TEXT (警報標題)
- description: TEXT (描述)
- recommendation: TEXT (建議)
- status: TEXT (狀態)
```

#### 5. **monitoring_plans** - 監測計劃表
```sql
- id: UUID (主鍵)
- patient_id: UUID (患者ID)
- plan_name: TEXT (計劃名稱)
- monitoring_frequency: TEXT (監測頻率)
- target_metrics: TEXT[] (目標指標)
- target_values: JSONB (目標值)
- doctor_name: TEXT (醫師)
```

#### 6. **health_reports** - 健康報告表
```sql
- id: UUID (主鍵)
- patient_id: UUID (患者ID)
- report_type: TEXT (報告類型)
- report_period_start/end: DATE (報告期間)
- avg_health_score: DECIMAL (平均健康評分)
- trends: JSONB (趨勢數據)
- ai_insights: TEXT (AI洞察)
```

---

## 🔧 Edge Function API

### Base URL
```
https://ergqqdirsvmamowpklia.supabase.co/functions/v1/health-monitoring-ai
```

### 1. 分析生命體征
```javascript
const { data, error } = await supabase.functions.invoke('health-monitoring-ai', {
  body: {
    action: 'analyze_vital_signs',
    data: {
      companyId: 'company-uuid',
      patientId: 'patient-uuid',
      vitalSigns: {
        systolic_bp: 145,
        diastolic_bp: 95,
        heart_rate: 82,
        temperature: 36.6,
        oxygen_saturation: 97,
        blood_glucose: 145.0
      }
    }
  }
})

// 返回:
{
  success: true,
  analysis: {
    health_score: 72,
    risk_level: 'moderate',
    alerts: [...],
    recommendations: ['減少鹽分攝取', '定期監測血糖'],
    ai_insights: '血壓和血糖略高，建議控制飲食...'
  },
  alerts_created: 2
}
```

### 2. 預測健康風險
```javascript
const { data } = await supabase.functions.invoke('health-monitoring-ai', {
  body: {
    action: 'predict_health_risk',
    data: {
      patientId: 'patient-uuid'
    }
  }
})

// 返回:
{
  success: true,
  patient_id: 'patient-uuid',
  risk_prediction: {
    trend: 'stable',
    risk_score: 25,
    avg_systolic_bp: 145,
    avg_heart_rate: 82,
    prediction: '健康狀況穩定',
    recommendations: ['保持良好生活習慣']
  },
  data_points: 30
}
```

### 3. 生成健康報告
```javascript
const { data } = await supabase.functions.invoke('health-monitoring-ai', {
  body: {
    action: 'generate_health_report',
    data: {
      companyId: 'company-uuid',
      patientId: 'patient-uuid',
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      reportType: 'monthly'
    }
  }
})

// 返回:
{
  success: true,
  report: {
    id: 'report-uuid',
    total_measurements: 60,
    avg_health_score: 75,
    alerts_count: 5,
    trends: {...},
    ai_insights: '期間內共記錄 60 次測量...',
    recommendations: [...]
  }
}
```

### 4. 獲取統計數據
```javascript
const { data } = await supabase.functions.invoke('health-monitoring-ai', {
  body: {
    action: 'get_statistics',
    data: {
      companyId: 'company-uuid'
    }
  }
})

// 返回:
{
  success: true,
  stats: {
    total_patients: 50,
    active_patients: 45,
    total_measurements_today: 120,
    active_alerts: 15,
    critical_alerts: 3
  },
  recent_alerts: [...]
}
```

### 5. 檢查警報條件
```javascript
const { data } = await supabase.functions.invoke('health-monitoring-ai', {
  body: {
    action: 'check_alert_conditions',
    data: {
      vitalSigns: {
        systolic_bp: 180,
        diastolic_bp: 120,
        heart_rate: 125
      }
    }
  }
})

// 返回:
{
  success: true,
  alerts: [
    {
      type: 'bp_critical',
      severity: 'critical',
      title: '血壓危險過高',
      description: '收縮壓 180/120 mmHg 超過安全範圍',
      value: '180/120',
      normal_range: '90-120 / 60-80 mmHg',
      recommendation: '立即就醫！血壓已達到危險水平'
    }
  ],
  total_alerts: 1
}
```

---

## 💻 前端使用

### 基本組件

```tsx
import { HealthMonitoring } from './Modules/Industry/Healthcare/HealthMonitoring';

// 在 ModuleRunner 中使用
<>{new HealthMonitoring().render(context)}</>
```

### 主要功能

1. **患者管理**
   - 查看患者列表
   - 選擇患者進行監測
   - 顯示患者基本資料和病史

2. **生命體征記錄**
   - 輸入多項生命體征數據
   - 一鍵記錄並分析
   - 實時 AI 健康評估

3. **AI 分析結果**
   - 健康評分（0-100）
   - 風險等級（低/中/高/緊急）
   - AI 洞察與建議
   - 異常警報

4. **歷史記錄**
   - 查看患者歷史測量數據
   - 趨勢圖表
   - 數據對比

5. **健康警報**
   - 實時警報顯示
   - 按嚴重程度分類
   - 警報詳情與建議

---

## 🎯 AI 分析邏輯

### 健康評分計算

```
基礎分數: 100
- 血壓危險 (-30分)
- 血壓偏高 (-15分)
- 心率異常 (-20分)
- 血糖異常 (-25分)
- 血氧偏低 (-20分)

最終分數: 0-100
```

### 風險等級判定

- **低風險 (low)**: 健康評分 ≥ 85
- **中等風險 (moderate)**: 75 ≤ 健康評分 < 85
- **高風險 (high)**: 60 ≤ 健康評分 < 75
- **緊急 (critical)**: 健康評分 < 60

### 警報觸發條件

#### 血壓警報
- **緊急**: 收縮壓 ≥ 180 或舒張壓 ≥ 120
- **警告**: 收縮壓 ≥ 140 或舒張壓 ≥ 90

#### 心率警報
- **緊急**: 心率 > 140 或 < 40
- **警告**: 心率 > 120 或 < 50

#### 血糖警報
- **緊急**: 血糖 > 200
- **警告**: 血糖 < 70

#### 血氧警報
- **緊急**: 血氧 < 90%
- **警告**: 血氧 < 95%

---

## 📝 測試案例

### 測試案例 1：正常健康檢查

```javascript
const normalVitals = {
  systolic_bp: 118,
  diastolic_bp: 76,
  heart_rate: 72,
  temperature: 36.5,
  oxygen_saturation: 98,
  blood_glucose: 95
}

// 預期結果:
// - 健康評分: 95-100
// - 風險等級: low
// - 無警報
```

### 測試案例 2：高血壓警告

```javascript
const highBPVitals = {
  systolic_bp: 145,
  diastolic_bp: 95,
  heart_rate: 80
}

// 預期結果:
// - 健康評分: 85
// - 風險等級: moderate
// - 警報: 血壓偏高 (warning)
```

### 測試案例 3：緊急情況

```javascript
const criticalVitals = {
  systolic_bp: 185,
  diastolic_bp: 125,
  heart_rate: 145,
  oxygen_saturation: 88
}

// 預期結果:
// - 健康評分: 40
// - 風險等級: critical
// - 多個緊急警報
```

---

## 🔐 安全性

### Row Level Security (RLS)

所有表格都啟用了 RLS，確保：
- 用戶只能訪問其公司的數據
- 基於 `auth.uid()` 和 `company_id` 的雙重驗證

### 資料驗證

- 生命體征數值範圍檢查
- 必填欄位驗證
- SQL 注入防護

---

## 📈 性能優化

- 索引優化（患者ID、測量時間、警報狀態）
- 查詢限制（最近10-20筆記錄）
- 使用 JSONB 存儲複雜數據結構
- 資料庫函數優化查詢性能

---

## 🎓 最佳實踐

1. **定期監測**
   - 建議高風險患者每日監測
   - 穩定患者每週監測

2. **數據品質**
   - 確保測量準確性
   - 記錄測量環境（家中/診所）
   - 標註測量人員

3. **警報處理**
   - 及時查看並處理警報
   - 緊急警報立即就醫
   - 記錄處理結果

4. **報告生成**
   - 定期生成健康報告
   - 用於醫師診斷參考
   - 追蹤健康趨勢

---

## 🐛 常見問題

### Q: 為什麼看不到數據？
A: 確認：
1. 已執行 migration 和 quick setup
2. 使用正確的公司帳號登入
3. RLS 政策正確配置

### Q: AI 分析失敗？
A: 檢查：
1. Edge Function 是否正確部署
2. 輸入數據格式是否正確
3. 查看瀏覽器控制台錯誤訊息

### Q: 警報不顯示？
A: 確認：
1. 生命體征數值確實異常
2. 警報狀態為 'active'
3. 重新載入警報列表

---

## 📚 相關文件

- 資料庫 Schema: `supabase/migrations/20251018260000_add_health_monitoring_tables.sql`
- Edge Function: `supabase/functions/health-monitoring-ai/index.ts`
- 前端組件: `frontend/Modules/Industry/Healthcare/HealthMonitoring.tsx`
- 快速設置: `QUICK_HEALTH_MONITORING_SETUP.sql`

---

## ✅ 檢查清單

部署前確認：

- [ ] 資料庫 migration 已執行
- [ ] 快速設置腳本已執行
- [ ] Edge Function 已部署
- [ ] 前端模組可正常載入
- [ ] 測試數據已創建
- [ ] 可以記錄生命體征
- [ ] AI 分析功能正常
- [ ] 警報系統運作正常

---

## 🎉 完成！

AI 健康監測系統現已完全部署並可使用！

**下一步：**
1. 登入系統測試
2. 添加實際患者數據
3. 配置監測計劃
4. 培訓醫護人員使用

如有問題，請參考文檔或聯繫技術支援。


