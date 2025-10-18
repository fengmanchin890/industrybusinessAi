# AI 學生表現分析系統 - 設置指南

## 📋 系統概述

**AI 學生表現分析系統**是一個智能教育管理工具，為教育機構提供：
- 學生學習成效全面分析
- AI 驅動的個人化學習建議
- 智能預警系統識別高風險學生
- 家長溝通報告自動生成
- 學習軌跡預測

---

## 🚀 快速設置（5 分鐘）

### 第一步：資料庫設置

在 **Supabase SQL Editor** 中執行以下腳本：

```sql
\i C:/Users/User/Desktop/ai business platform/QUICK_STUDENT_PERFORMANCE_SETUP.sql
```

或直接複製 `QUICK_STUDENT_PERFORMANCE_SETUP.sql` 的內容到 SQL Editor 執行。

**預期結果：**
```
✅ 學生創建完成: 3 位（王小明、李美華、陳志強）
✅ 成績記錄創建完成：21 筆
✅ 出席記錄創建完成：60 筆
✅ 作業記錄創建完成：15 筆
✅ 表現警示創建完成：3 筆
✅ 表現報告創建完成：3 筆
```

---

### 第二步：部署 Edge Function

在專案根目錄執行：

```bash
supabase functions deploy student-performance-analyzer
```

**驗證部署成功：**
1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇專案
3. 進入 **Edge Functions** 頁面
4. 確認 `student-performance-analyzer` 狀態為 **Active**

---

### 第三步：設置 OpenAI API Key（可選，強烈建議）

```bash
supabase secrets set OPENAI_API_KEY=sk-your-openai-api-key-here
```

**為什麼需要 OpenAI Key？**
- 提供更智能的學生表現分析
- 生成個人化學習建議
- 預測學習軌跡
- 自動生成家長溝通報告

**不設置會怎樣？**
系統會使用基於規則的降級分析，功能仍可使用但智能程度較低。

---

### 第四步：測試系統

1. **登入系統**
   - 使用 **fengadult company** 帳號登入
   
2. **進入模組**
   - 點擊 **已安裝模組**
   - 選擇 **AI 評估系統** 或 **AI 學生表現分析系統**

3. **查看測試數據**
   - 應該看到 3 位學生：
     - **王小明**（85分，進步中）
     - **李美華**（92分，優秀）
     - **陳志強**（72分，需要關注）

4. **測試 AI 分析**
   - 點擊任一學生卡片
   - 查看詳細分析和建議
   - 測試 AI 生成報告功能

---

## 📊 資料庫架構

### 主要資料表

#### 1. `students` - 學生基本資料
```sql
id, company_id, student_code, name, grade, class_name, 
subjects[], learning_level, learning_style, 
strengths[], weaknesses[], goals[], interests[]
```

#### 2. `student_grades` - 成績記錄
```sql
id, student_id, assessment_type, subject, title, 
score, max_score, percentage, grade_level,
assessment_date, ai_performance_analysis
```

#### 3. `student_attendance` - 出席記錄
```sql
id, student_id, attendance_date, class_period, 
subject, status (present/absent/late/excused/sick)
```

#### 4. `homework_completion` - 作業完成記錄
```sql
id, student_id, homework_title, subject, 
due_date, submission_status, quality_score, 
completeness_score, effort_score
```

#### 5. `performance_alerts` - 表現警示
```sql
id, student_id, alert_type, severity, 
title, message, ai_recommendations[], 
status (active/resolved/dismissed)
```

#### 6. `performance_reports` - 表現報告
```sql
id, student_id, report_type, report_period,
overall_score, attendance_rate, subject_scores,
ai_summary, ai_recommendations[], performance_trend
```

---

## 🤖 Edge Function API

### 基本用法

```typescript
const { data, error } = await supabase.functions.invoke('student-performance-analyzer', {
  body: {
    action: 'analyze_performance',
    data: {
      studentId: 'student-uuid-here',
      startDate: '2024-10-01',
      endDate: '2024-10-31'
    }
  }
});
```

### 支援的 Actions

#### 1. `analyze_performance` - 分析學生表現
```typescript
{
  action: 'analyze_performance',
  data: {
    studentId: string,
    startDate?: string,  // 預設：30天前
    endDate?: string     // 預設：今天
  }
}
```

**回應：**
```json
{
  "student": { "id", "name", "grade", "class" },
  "statistics": {
    "overallScore": 85.5,
    "attendanceRate": 95.0,
    "homeworkCompletionRate": 90.0,
    "gradesBySubject": { "數學": [88, 92], "國語": [78, 80] }
  },
  "analysis": {
    "summary": "整體表現良好",
    "strengths": ["數學優秀", "出席率高"],
    "weaknesses": ["作文需加強"],
    "recommendations": ["增加閱讀量", "練習寫作"],
    "trend": "improving",
    "risk_level": "low",
    "next_steps": ["保持學習態度"]
  }
}
```

#### 2. `generate_recommendations` - 生成個人化建議
```typescript
{
  action: 'generate_recommendations',
  data: {
    studentId: string,
    subject?: string  // 可選，針對特定科目
  }
}
```

#### 3. `predict_trajectory` - 預測學習軌跡
```typescript
{
  action: 'predict_trajectory',
  data: {
    studentId: string
  }
}
```

#### 4. `generate_report` - 生成表現報告
```typescript
{
  action: 'generate_report',
  data: {
    studentId: string,
    reportType: 'individual' | 'term' | 'annual',
    startDate: string,
    endDate: string
  }
}
```

#### 5. `detect_at_risk` - 檢測高風險學生
```typescript
{
  action: 'detect_at_risk',
  data: {
    classId?: string  // 可選，特定班級
  }
}
```

---

## 🎯 使用場景

### 場景 1：日常監控
定期查看班級整體表現，識別需要關注的學生。

### 場景 2：學期評估
生成學期報告，與家長溝通學生學習狀況。

### 場景 3：個別輔導
深入分析個別學生表現，制定個人化學習計劃。

### 場景 4：預警介入
AI 自動檢測高風險學生，及時介入輔導。

---

## ⚙️ 進階設置

### 自定義評分標準

在 `student_grades` 表中調整 `grade_level` 對應的分數範圍：

```sql
UPDATE student_grades 
SET grade_level = CASE 
  WHEN percentage >= 95 THEN 'A+'
  WHEN percentage >= 90 THEN 'A'
  WHEN percentage >= 85 THEN 'A-'
  -- 自訂其他等級...
END;
```

### 設置警示觸發條件

修改 `detect_at_risk` 函數中的風險判定邏輯：

```typescript
const isAtRisk = (
  performance.statistics.overallScore < 60 ||  // 調整分數門檻
  performance.statistics.attendanceRate < 80 ||  // 調整出席率門檻
  performance.statistics.homeworkCompletionRate < 70  // 調整作業完成率門檻
);
```

### 新增評估類型

在 `assessment_type` ENUM 中新增類型：

```sql
ALTER TABLE student_grades 
DROP CONSTRAINT student_grades_assessment_type_check;

ALTER TABLE student_grades 
ADD CONSTRAINT student_grades_assessment_type_check
CHECK (assessment_type IN ('exam', 'quiz', 'homework', 'project', 'participation', 'attendance', '你的新類型'));
```

---

## 🐛 常見問題

### 問題 1：看不到學生數據
**原因：**
- RLS 策略阻擋訪問
- 公司 ID 不匹配

**解決：**
```sql
-- 檢查 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'students';

-- 檢查公司 ID
SELECT company_id FROM users WHERE id = auth.uid();
```

### 問題 2：Edge Function 調用失敗（401 Unauthorized）
**原因：**
- Edge Function 未部署
- Authorization Header 缺失

**解決：**
```bash
# 重新部署
supabase functions deploy student-performance-analyzer

# 檢查部署狀態
supabase functions list
```

### 問題 3：AI 分析結果不理想
**原因：**
- OpenAI API Key 未設置或無效
- 學生數據太少

**解決：**
```bash
# 驗證 API Key
supabase secrets list

# 新增更多測試數據
-- 執行 QUICK_STUDENT_PERFORMANCE_SETUP.sql 多次（修改學生代碼避免重複）
```

### 問題 4：統計函數返回 NULL
**原因：**
- 學生沒有足夠的歷史數據

**解決：**
新增更多成績、出席、作業記錄。

---

## 📈 效能優化建議

### 1. 定期清理舊數據
```sql
-- 刪除 1 年前的學習行為記錄
DELETE FROM learning_behaviors 
WHERE behavior_date < CURRENT_DATE - INTERVAL '1 year';
```

### 2. 定期更新統計
```sql
-- 定期重新計算表現報告
SELECT get_student_performance_stats(student_id) 
FROM students WHERE is_active = true;
```

### 3. 索引優化
系統已建立必要索引，但可根據查詢模式新增：

```sql
-- 如果經常按科目查詢
CREATE INDEX idx_grades_subject_date ON student_grades(subject, assessment_date DESC);
```

---

## 🔒 安全性

### RLS 策略
所有資料表都啟用 RLS，確保多租戶資料隔離。

### 資料訪問控制
僅同公司用戶可訪問學生數據。

### API 認證
所有 Edge Function 調用需要有效的 JWT Token。

---

## 📞 技術支援

如有問題，請檢查：
1. Supabase 專案日誌
2. Edge Function 執行日誌
3. 瀏覽器控制台錯誤訊息

---

## 🎉 恭喜！設置完成！

您的 **AI 學生表現分析系統** 已經準備就緒！

現在可以：
✅ 查看學生表現數據
✅ 使用 AI 分析功能
✅ 生成學習建議
✅ 檢測高風險學生
✅ 自動生成報告

開始使用吧！ 🚀


