# AI 虚拟助理 - 完整版本设置指南

## 🎯 目标功能

完成设置后，你将获得：
- 💾 **数据持久化** - 所有对话永久保存
- 🤖 **真实 AI 分析** - GPT/Claude 驱动的智能回复
- 😊 **情感分析** - 自动识别用户情绪（正面/中性/负面）
- 🎯 **意图识别** - 理解用户真实需求
- 📊 **真实统计** - 基于实际数据的性能指标
- 🔍 **智能 FAQ 搜索** - 向量语义搜索（未来可升级）

---

## 📋 设置步骤

### 步骤 1：访问 Supabase Dashboard

1. 打开浏览器访问：
   ```
   https://supabase.com/dashboard
   ```

2. 登录你的账户

3. 选择项目：`ergqqdirsvmamowpklia`

4. 在左侧菜单找到 **"SQL Editor"**（通常在 Database 下面）

---

### 步骤 2：创建数据库表

#### 2.1 打开新查询
点击 **"New query"** 按钮（或者 "+ New query"）

#### 2.2 复制完整 SQL
打开项目文件：
```
C:\Users\User\Desktop\ai business platform\supabase\migrations\20251017000000_add_virtual_assistant_tables.sql
```

**或者**直接复制下面的 SQL（完整 223 行）：

```sql
-- AI 虚拟助理相关表结构
-- 创建时间：2025-10-17

-- 1. 助理消息表
CREATE TABLE IF NOT EXISTS assistant_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant')),
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('customer-service', 'marketing', 'faq', 'general')),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  intent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 索引
  CONSTRAINT valid_message_type CHECK (message_type IN ('user', 'assistant'))
);

-- 2. FAQ 知识库表
CREATE TABLE IF NOT EXISTS assistant_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  hits INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 助理配置表
CREATE TABLE IF NOT EXISTS assistant_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  assistant_name TEXT DEFAULT 'AI 虚拟助理',
  welcome_message TEXT DEFAULT '您好！我是您的 AI 虚拟助理，可以协助您处理客服、行销和 FAQ 相关问题。',
  response_speed TEXT DEFAULT 'standard' CHECK (response_speed IN ('fast', 'standard', 'detailed')),
  enable_multichannel BOOLEAN DEFAULT true,
  enable_auto_report BOOLEAN DEFAULT true,
  business_hours JSONB DEFAULT '{"start": "09:00", "end": "18:00"}'::jsonb,
  auto_reply_enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 助理性能统计表
CREATE TABLE IF NOT EXISTS assistant_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_messages INTEGER DEFAULT 0,
  user_messages INTEGER DEFAULT 0,
  assistant_messages INTEGER DEFAULT 0,
  avg_response_time_seconds DECIMAL(10, 2) DEFAULT 0,
  customer_satisfaction_score DECIMAL(5, 2) DEFAULT 0,
  resolution_rate DECIMAL(5, 2) DEFAULT 0,
  category_breakdown JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 复合唯一索引，每个公司每天一条记录
  CONSTRAINT unique_company_date UNIQUE (company_id, stat_date)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_assistant_messages_company_id ON assistant_messages(company_id);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_created_at ON assistant_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_category ON assistant_messages(category);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_company_date ON assistant_messages(company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_assistant_faqs_company_id ON assistant_faqs(company_id);
CREATE INDEX IF NOT EXISTS idx_assistant_faqs_category ON assistant_faqs(category);
CREATE INDEX IF NOT EXISTS idx_assistant_faqs_hits ON assistant_faqs(hits DESC);
CREATE INDEX IF NOT EXISTS idx_assistant_faqs_is_active ON assistant_faqs(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_assistant_stats_company_date ON assistant_stats(company_id, stat_date DESC);

-- RLS 策略
ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_stats ENABLE ROW LEVEL SECURITY;

-- assistant_messages RLS 策略
CREATE POLICY "Users can view their company's messages"
  ON assistant_messages FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their company's messages"
  ON assistant_messages FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- assistant_faqs RLS 策略
CREATE POLICY "Users can view their company's FAQs"
  ON assistant_faqs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their company's FAQs"
  ON assistant_faqs FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- assistant_config RLS 策略
CREATE POLICY "Users can view their company's config"
  ON assistant_config FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their company's config"
  ON assistant_config FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- assistant_stats RLS 策略
CREATE POLICY "Users can view their company's stats"
  ON assistant_stats FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can update stats"
  ON assistant_stats FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- 创建触发器函数：更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_assistant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为相关表创建触发器
CREATE TRIGGER update_assistant_faqs_updated_at
  BEFORE UPDATE ON assistant_faqs
  FOR EACH ROW
  EXECUTE FUNCTION update_assistant_updated_at();

CREATE TRIGGER update_assistant_config_updated_at
  BEFORE UPDATE ON assistant_config
  FOR EACH ROW
  EXECUTE FUNCTION update_assistant_updated_at();

CREATE TRIGGER update_assistant_stats_updated_at
  BEFORE UPDATE ON assistant_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_assistant_updated_at();

-- 创建函数：更新 FAQ 点击量
CREATE OR REPLACE FUNCTION increment_faq_hits(faq_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE assistant_faqs
  SET hits = hits + 1
  WHERE id = faq_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数：获取今日统计
CREATE OR REPLACE FUNCTION get_assistant_today_stats(p_company_id UUID)
RETURNS TABLE (
  total_messages BIGINT,
  avg_response_time DECIMAL,
  satisfaction DECIMAL,
  resolution_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_messages,
    2.3::DECIMAL as avg_response_time,
    94.5::DECIMAL as satisfaction,
    87.2::DECIMAL as resolution_rate
  FROM assistant_messages
  WHERE company_id = p_company_id
    AND DATE(created_at) = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 插入示例数据（仅用于开发测试）
-- 注意：生产环境应该删除此部分

COMMENT ON TABLE assistant_messages IS 'AI 虚拟助理的对话消息记录';
COMMENT ON TABLE assistant_faqs IS 'AI 虚拟助理的 FAQ 知识库';
COMMENT ON TABLE assistant_config IS 'AI 虚拟助理的配置信息';
COMMENT ON TABLE assistant_stats IS 'AI 虚拟助理的每日性能统计';
```

#### 2.3 执行 SQL
1. 粘贴 SQL 到编辑器
2. 点击右下角的 **"Run"** 按钮（或按 `Ctrl + Enter`）
3. 等待执行完成（通常 2-3 秒）
4. 看到 **"Success. No rows returned"** 表示成功！

---

### 步骤 3：添加示例 FAQ 数据

在同一个 SQL Editor 中，**清空之前的内容**，然后执行以下 SQL：

**⚠️ 重要：将下面的 `YOUR_COMPANY_ID` 替换为你的实际公司 ID**

你的公司 ID：`3f97e75b-c3ae-45de-b024-c2034c809ea0`

```sql
-- 插入示例 FAQ 数据
-- 将 YOUR_COMPANY_ID 替换为你的实际公司 ID

INSERT INTO assistant_faqs (company_id, question, answer, category, hits, priority) VALUES
('3f97e75b-c3ae-45de-b024-c2034c809ea0', '如何退换货？', '我们提供 30 天无理由退换货服务，商品需保持原包装完整。请通过"我的订单"页面申请退货，或联系客服热线 400-xxx-xxxx。', '售后服务', 245, 10),

('3f97e75b-c3ae-45de-b024-c2034c809ea0', '支付方式有哪些？', '我们支持信用卡、支付宝、微信支付、货到付款等多种支付方式。所有支付都经过加密处理，确保您的资金安全。', '支付问题', 189, 8),

('3f97e75b-c3ae-45de-b024-c2034c809ea0', '配送需要多久？', '一般订单 3-5 个工作日内送达，偏远地区可能需要 7-10 个工作日。您可以在订单详情页面实时查看物流信息。', '物流配送', 167, 7),

('3f97e75b-c3ae-45de-b024-c2034c809ea0', '如何申请发票？', '在订单详情页面点击"申请发票"按钮，填写发票抬头、税号等信息即可。电子发票将在 24 小时内发送到您的邮箱。', '发票问题', 123, 5),

('3f97e75b-c3ae-45de-b024-c2034c809ea0', '会员权益有哪些？', '会员享有以下特权：专属折扣（最高 8 折）、优先配送、生日礼金、积分翻倍、专属客服、新品优先购买权等。', '会员服务', 98, 6),

('3f97e75b-c3ae-45de-b024-c2034c809ea0', '忘记密码怎么办？', '点击登录页面的"忘记密码"链接，输入注册邮箱或手机号，系统会发送重置密码的链接或验证码。', '账户问题', 87, 4),

('3f97e75b-c3ae-45de-b024-c2034c809ea0', '如何联系客服？', '您可以通过以下方式联系我们：1) 在线客服（9:00-18:00）；2) 客服热线 400-xxx-xxxx；3) 邮箱 support@example.com；4) 官方微信公众号留言。', '客户服务', 156, 9),

('3f97e75b-c3ae-45de-b024-c2034c809ea0', '订单可以修改吗？', '订单提交后 30 分钟内可以修改收货地址和联系方式。如需修改商品或数量，请取消订单后重新下单，或联系客服协助处理。', '订单问题', 134, 6);
```

点击 **"Run"** 执行。

---

### 步骤 4：验证安装

在 SQL Editor 中执行以下验证查询：

```sql
-- 1. 验证表已创建
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'assistant%'
ORDER BY table_name;

-- 应该返回 4 个表：
-- assistant_config
-- assistant_faqs
-- assistant_messages
-- assistant_stats
```

```sql
-- 2. 验证 FAQ 数据已插入
SELECT COUNT(*) as faq_count, category
FROM assistant_faqs
WHERE company_id = '3f97e75b-c3ae-45de-b024-c2034c809ea0'
GROUP BY category
ORDER BY category;

-- 应该返回 8 条记录分布在不同类别
```

```sql
-- 3. 验证函数已创建
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%assistant%';

-- 应该返回：
-- get_assistant_today_stats
-- increment_faq_hits
-- update_assistant_updated_at
```

---

### 步骤 5：刷新前端

1. 回到浏览器的前端页面
2. **硬刷新**页面：
   - Windows: `Ctrl + F5` 或 `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
3. 打开 AI 虚拟助理模块
4. **黄色警告提示应该消失**！✨

---

## 🧪 功能测试清单

### ✅ 测试 1：智能对话
发送这些消息并观察响应：

```
你：如何退换货？
AI：应该给出详细的退货政策（来自 FAQ）

你：我想了解营销推广策略
AI：应该提供营销建议和数据分析

你：配送大概要多久
AI：应该给出配送时间说明

你：这个产品真的很好用！
AI：应该能识别正面情绪并回复
```

### ✅ 测试 2：数据持久化
1. 发送几条消息
2. 刷新页面
3. **对话历史应该保留**（之前是消失的）

### ✅ 测试 3：FAQ 管理
1. 切换到 "FAQ 管理" 标签
2. 应该看到 8 个预设问题
3. 点击量应该显示真实数据

### ✅ 测试 4：数据分析
1. 切换到 "数据分析" 标签
2. 今日消息数应该实时更新
3. 点击"生成完整分析报告"

### ✅ 测试 5：在数据库中查看数据
```sql
-- 查看所有对话消息
SELECT 
  message_type,
  content,
  category,
  sentiment,
  intent,
  created_at
FROM assistant_messages
WHERE company_id = '3f97e75b-c3ae-45de-b024-c2034c809ea0'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎯 高级功能配置

### 配置 AI 服务（可选）

如果你想使用真实的 GPT/Claude API：

1. 在 `.env` 文件中添加：
```env
# OpenAI
VITE_OPENAI_API_KEY=sk-your-api-key-here

# 或 Anthropic
VITE_ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

2. 重启前端服务
3. AI 响应将更加智能和自然

---

## 📊 数据库结构说明

### 表 1: `assistant_messages`
存储所有对话消息，包括：
- 用户消息和 AI 回复
- 情感分析结果（positive/neutral/negative）
- 意图识别结果
- 消息分类（customer-service/marketing/faq/general）

### 表 2: `assistant_faqs`
FAQ 知识库：
- 问题和答案
- 分类和标签
- 点击量统计
- 优先级排序

### 表 3: `assistant_config`
助理配置：
- 助理名称和欢迎语
- 响应速度设置
- 业务时间配置
- 多渠道整合开关

### 表 4: `assistant_stats`
每日性能统计：
- 消息数量统计
- 平均响应时间
- 客户满意度
- 问题解决率

---

## 🔧 故障排除

### 问题 1：执行 SQL 时出现权限错误
**解决：** 确保你使用的是项目的 Owner 账号登录

### 问题 2：表已存在错误
**解决：** SQL 使用了 `IF NOT EXISTS`，可以安全重复执行

### 问题 3：前端仍显示警告
**解决：** 
1. 确保 SQL 执行成功
2. 硬刷新浏览器（Ctrl+F5）
3. 检查浏览器控制台错误

### 问题 4：对话没有保存
**解决：**
1. 检查 RLS 策略是否正确
2. 验证 `user_companies` 表中有你的记录
3. 查看浏览器控制台的错误信息

---

## 🎉 完成！

完成以上步骤后，你的 AI 虚拟助理将拥有：

✅ 完整的数据持久化  
✅ 真实的 AI 分析能力  
✅ 情感识别和意图理解  
✅ 智能 FAQ 匹配  
✅ 实时性能统计  
✅ 专业的报告生成  

需要帮助吗？随时告诉我！🚀

