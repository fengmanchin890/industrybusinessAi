# AI 虚拟助理 500 错误修复指南

## 问题说明

您遇到的 500 错误是因为 edge function 试图调用数据库函数（`get_today_assistant_stats` 等），但这些函数还没有在数据库中创建。

## 快速修复步骤

### 步骤 1: 部署更新的 Edge Function

更新后的 edge function 现在可以优雅地处理缺失的数据库函数，不会再抛出 500 错误。

```bash
# 运行部署脚本
DEPLOY_VIRTUAL_ASSISTANT.bat
```

或手动部署：

```bash
cd supabase/functions/virtual-assistant-ai
supabase functions deploy virtual-assistant-ai --no-verify-jwt
```

### 步骤 2: 验证数据库设置

在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 运行验证脚本
VERIFY_VIRTUAL_ASSISTANT_SETUP.sql
```

这将检查所有必需的表和函数是否存在。

### 步骤 3: 创建数据库表和函数（如果缺失）

如果验证脚本显示缺失项目，在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 运行迁移脚本
supabase/migrations/20251018310000_add_virtual_assistant_tables.sql
```

这将创建：
- ✅ 7 个数据库表
- ✅ 4 个数据库函数
- ✅ RLS 策略
- ✅ 索引

### 步骤 4: 添加示例数据（可选）

```sql
-- 运行示例数据脚本
QUICK_VIRTUAL_ASSISTANT_SETUP.sql
```

## 修复内容

### Edge Function 改进

1. **错误处理**：所有 RPC 调用现在都包装在 try-catch 中
2. **优雅降级**：如果数据库函数不存在，返回默认值而不是抛出错误
3. **详细日志**：记录错误以便调试

### 修复的函数

- ✅ `getTodayStats` - 返回默认统计数据
- ✅ `getCategoryStats` - 返回默认分类数据
- ✅ `searchFAQ` - 返回空数组
- ✅ `generateAIResponse` - 跳过 FAQ 搜索继续执行

## 测试

部署后，刷新页面并检查：

1. **Chat 选项卡**：应该正常加载，显示默认统计数据
2. **FAQ 选项卡**：可以添加和查看 FAQ
3. **Analytics 选项卡**：显示默认图表和数据
4. **Settings 选项卡**：可以保存配置

## 检查日志

如果仍有问题，检查：

1. **浏览器控制台**：查看客户端错误
2. **Supabase Dashboard** → Functions → virtual-assistant-ai → Logs

## 常见问题

### Q: 为什么统计数据都是 0？

A: 这是正常的。在数据库函数创建之前，系统使用默认值。执行步骤 3 和 4 后，将显示真实数据。

### Q: 发送消息是否正常工作？

A: 是的！消息发送功能使用独立的逻辑，不依赖于统计函数。

### Q: 需要重新部署前端吗？

A: 不需要。前端代码已经包含错误处理，只需部署 edge function 即可。

## 数据库表结构

迁移脚本将创建以下表：

1. **assistant_messages** - 消息记录
2. **assistant_conversations** - 对话会话
3. **assistant_faqs** - 常见问题库
4. **assistant_configs** - 助理配置
5. **assistant_metrics** - 性能指标
6. **assistant_recommendations** - 智能推荐
7. **assistant_feedback** - 用户反馈

## 数据库函数

1. **get_today_assistant_stats** - 获取今日统计
2. **get_category_stats** - 获取分类统计
3. **search_faqs** - 搜索 FAQ
4. **increment_faq_hits** - 增加 FAQ 点击量

## 支持

如果问题持续存在：

1. 确认 Supabase 项目已启用 Edge Functions
2. 检查 API 密钥是否正确配置
3. 查看 Supabase 项目的 Health 状态
4. 检查是否有 RLS 策略阻止访问

---

**更新时间**: 2024-10-18  
**状态**: 已修复 ✅

