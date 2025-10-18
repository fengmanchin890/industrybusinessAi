# AI 虚拟助理 - 数据库设置指南

## ⚠️ 当前状态

✅ **前端组件** - 已完成  
✅ **AI 服务集成** - 已完成  
✅ **Migration SQL** - 已创建  
❌ **数据库表** - 需要执行 Migration

## 🔧 快速修复步骤

### 方法 1：在 Supabase Dashboard 执行 SQL（推荐）

1. **打开 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard
   - 进入你的项目

2. **进入 SQL Editor**
   - 左侧菜单 → SQL Editor
   - 点击 "New Query"

3. **复制并执行 SQL**
   - 打开文件：`supabase/migrations/20251017000000_add_virtual_assistant_tables.sql`
   - 复制全部内容
   - 粘贴到 SQL Editor
   - 点击 "Run" 或按 Ctrl+Enter

4. **验证创建成功**
   ```sql
   -- 执行此查询验证表已创建
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'assistant%';
   ```
   应该看到：
   - assistant_messages
   - assistant_faqs
   - assistant_config
   - assistant_stats

5. **刷新页面**
   - 刷新前端应用页面
   - AI 虚拟助理应该可以正常工作了！

---

### 方法 2：使用 Supabase CLI（如果已安装）

```bash
# 进入项目目录
cd "C:\Users\User\Desktop\ai business platform"

# 链接到远程项目
npx supabase link --project-ref your-project-ref

# 推送 migration
npx supabase db push
```

---

### 方法 3：暂时使用模拟数据（快速测试）

如果你想先测试功能，暂时不想设置数据库，我可以修改前端代码使用完全模拟的数据。

---

## 📊 创建的数据库结构

### 1. `assistant_messages` - 消息记录表
- 存储用户和 AI 助理的对话消息
- 包含情感分析和意图识别结果
- 支持消息分类（客服/营销/FAQ/通用）

### 2. `assistant_faqs` - FAQ 知识库
- 常见问题及答案
- 支持分类和标签
- 跟踪点击量和优先级

### 3. `assistant_config` - 助理配置
- 自定义助理名称和欢迎语
- 配置响应速度和业务时间
- 多渠道整合开关

### 4. `assistant_stats` - 性能统计
- 每日消息统计
- 客户满意度评分
- 平均响应时间
- 问题解决率

---

## 🧪 测试 AI 虚拟助理

执行 SQL 后，你可以测试以下功能：

### 1. 智能对话
- 发送消息：`如何退换货？`
- 发送消息：`我想了解营销数据`
- 发送消息：`会员有什么权益？`

### 2. FAQ 管理
- 切换到 "FAQ 管理" 标签
- 查看热门问题
- 点击量会自动更新

### 3. 数据分析
- 切换到 "数据分析" 标签
- 查看实时统计
- 生成完整报告

### 4. 助理设置
- 切换到 "设置" 标签
- 自定义助理配置
- 保存设置

---

## 🔍 故障排除

### 错误：`Could not find the table 'public.assistant_messages'`
**原因：** Migration 还没有执行  
**解决：** 按照上面的方法 1 执行 SQL

### 错误：`Could not find the function public.get_assistant_today_stats`
**原因：** SQL 函数还没有创建  
**解决：** 确保完整执行了 migration SQL（包括函数部分）

### 错误：`permission denied for table assistant_messages`
**原因：** RLS 策略配置问题  
**解决：** 
1. 检查 `user_companies` 表是否有你的记录
2. 确保 migration 中的 RLS 策略已执行

---

## 📝 完整功能清单

执行 migration 后，以下功能将全部可用：

### ✅ 前端功能
- [x] 智能对话界面
- [x] 实时消息更新
- [x] FAQ 知识库管理
- [x] 数据分析面板
- [x] 助理配置界面
- [x] 错误处理和加载状态

### ✅ AI 功能
- [x] 情感分析（Sentiment Analysis）
- [x] 意图识别（Intent Detection）
- [x] 智能回复生成
- [x] FAQ 智能匹配
- [x] 对话上下文理解

### ✅ 数据库功能
- [x] 消息持久化存储
- [x] FAQ 知识库管理
- [x] 配置持久化
- [x] 性能统计追踪
- [x] RLS 安全策略

### ✅ 性能优化
- [x] 乐观 UI 更新
- [x] 错误回退机制
- [x] 数据缓存
- [x] 批量查询优化

---

## 🎯 下一步

1. **立即执行**：在 Supabase Dashboard 执行 migration SQL
2. **测试功能**：刷新页面并测试 AI 虚拟助理
3. **配置 AI**：确保 AI Core 服务正在运行（可选，已有 fallback）
4. **添加 FAQ**：在 FAQ 管理中添加你的业务相关问题

需要帮助吗？告诉我你在哪一步遇到问题！

