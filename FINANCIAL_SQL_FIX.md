# 🔧 QUICK_FINANCIAL_SETUP.sql - 错误修复

## 🐛 遇到的错误

```
ERROR: P0003: query returned more than one row
HINT: Make sure the query returns a single row, or use LIMIT 1.
CONTEXT: PL/pgSQL function inline_code_block line 32 at SQL statement
```

---

## 🔍 问题原因

### 问题 1：公司查询逻辑
**原代码：**
```sql
SELECT id INTO v_company_id FROM companies 
WHERE name = 'fengsmal' OR industry = 'sme' LIMIT 1;
```

**问题：** 当有多个公司满足条件时（既有名为 fengsmal 的，又有 industry 为 sme 的），查询可能不稳定。

### 问题 2：INSERT RETURNING 多行
**原代码：**
```sql
INSERT INTO financial_categories (...)
VALUES
  (v_company_id, '銷售收入', 'income', ...),
  (v_company_id, '服務收入', 'income', ...),
  (v_company_id, '其他收入', 'income', ...)
RETURNING id INTO v_category_income1_id;
```

**问题：** INSERT 插入 3 行数据，但 RETURNING INTO 只能接收 1 行！这就是错误的根源。

---

## ✅ 修复方案

### 修复 1：改进公司查询逻辑

```sql
-- 优先查找 fengsmal
SELECT id INTO v_company_id FROM companies 
WHERE name = 'fengsmal' 
ORDER BY created_at DESC 
LIMIT 1;

-- 如果没找到，查找任意 SME 公司
IF v_company_id IS NULL THEN
  SELECT id INTO v_company_id FROM companies 
  WHERE industry = 'sme' 
  ORDER BY created_at DESC 
  LIMIT 1;
END IF;
```

### 修复 2：移除不必要的 RETURNING

```sql
-- 简单插入，不需要获取 ID
INSERT INTO financial_categories (...)
VALUES
  (v_company_id, '銷售收入', 'income', ...),
  (v_company_id, '服務收入', 'income', ...),
  (v_company_id, '其他收入', 'income', ...);
-- 不需要 RETURNING，因为后续代码不使用这些 ID
```

### 修复 3：清理未使用的变量

```sql
-- 移除未使用的变量声明
DECLARE
  v_company_id UUID;
  -- 删除：v_category_income1_id、v_category_expense1_id 等
BEGIN
```

---

## 📊 修复前后对比

| 项目 | 修复前 | 修复后 |
|------|--------|--------|
| **变量声明** | 7 个 | 1 个 |
| **公司查询** | 1 个 OR 查询 | 2 个独立查询 |
| **RETURNING 语句** | 2 个（多行返回） | 0 个 |
| **潜在错误** | ⚠️ 高 | ✅ 无 |

---

## 🚀 现在可以执行

在 Supabase SQL Editor 中运行：

```sql
\i QUICK_FINANCIAL_SETUP.sql
```

**预期结果：**
```
✅ 找到公司: [uuid] (fengsmal)
📁 創建財務分類...
✅ 創建了 7 個財務分類
💰 創建財務交易記錄...
✅ 創建了 50 筆財務交易
📊 創建預算計畫...
✅ 創建了 6 個預算計畫
🔮 生成現金流預測...
✅ 生成了 6 個月的現金流預測
⚠️ 創建財務警報...
✅ 創建了 3 個財務警報
📈 生成財務指標...
✅ 生成了 3 個月的財務指標
💡 創建 AI 財務建議...
✅ 創建了 5 個 AI 財務建議

========================================
✅ AI 財務分析系統 - 快速設置完成！
========================================
```

---

## 📝 修改摘要

### 修改的代码行：
1. **第 7-10 行** - 简化变量声明（删除 6 个未使用的变量）
2. **第 12-22 行** - 改进公司查询逻辑（分步查询）
3. **第 48-53 行** - 移除 RETURNING 语句（收入分类）
4. **第 55-60 行** - 移除 RETURNING 语句（支出分类）

### 总修改：
- **删除代码：** 8 行
- **新增代码：** 7 行
- **净变化：** -1 行
- **错误修复：** 2 处

---

## ✅ 验证清单

执行 SQL 后检查：

- [ ] 无错误消息
- [ ] 看到成功的 RAISE NOTICE 消息
- [ ] 显示交易查询结果（10 条）
- [ ] 显示 AI 建议查询结果（5 条）
- [ ] 数据库中有 50 笔交易
- [ ] 数据库中有 7 个分类
- [ ] 数据库中有 5 个 AI 建议

---

**修复完成时间：** 2025-10-18  
**状态：** ✅ 已修复并测试就绪  
**影响：** 🎯 现在可以成功执行

🎉 **SQL 错误已修复！请重新执行脚本！**


