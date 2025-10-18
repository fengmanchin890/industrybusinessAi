-- ========================================
-- AI 虚拟助理快速设置脚本
-- 为 fengsmal 公司创建示例数据
-- ========================================

DO $$
DECLARE
  v_company_id UUID;
  v_user_id UUID;
  v_conversation_id UUID;
BEGIN
  -- 获取 fengsmal 公司 ID
  SELECT id INTO v_company_id FROM companies WHERE name = 'fengsmal' LIMIT 1;
  
  IF v_company_id IS NULL THEN
    SELECT id INTO v_company_id FROM companies WHERE industry = 'sme' LIMIT 1;
  END IF;
  
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION '找不到 fengsmal 公司';
  END IF;

  -- 获取用户 ID
  SELECT id INTO v_user_id FROM users WHERE company_id = v_company_id LIMIT 1;

  RAISE NOTICE '正在为公司 % 创建示例数据...', v_company_id;

  -- ========================================
  -- 1. 创建助理配置
  -- ========================================
  
  INSERT INTO assistant_configs (
    company_id, assistant_name, welcome_message, response_speed,
    enable_multichannel, enable_auto_report
  )
  VALUES (
    v_company_id,
    'AI 虚拟助理',
    '您好！我是您的 AI 虚拟助理，可以协助您处理客服、行销和 FAQ 相关问题。请问有什么可以帮您的？',
    'standard',
    true,
    true
  )
  ON CONFLICT (company_id) DO UPDATE
  SET assistant_name = EXCLUDED.assistant_name,
      welcome_message = EXCLUDED.welcome_message;

  -- ========================================
  -- 2. 创建 FAQ 数据
  -- ========================================
  
  INSERT INTO assistant_faqs (
    company_id, question, answer, category, keywords, priority, hits, created_by
  )
  VALUES
    (
      v_company_id,
      '如何退换货？',
      '我们提供7天无理由退换货服务。请登录您的账户，在订单详情页面点击「申请退换货」，填写退换货原因并提交。我们的客服团队会在24小时内处理您的申请。退货商品需保持原包装完整，附带所有配件和发票。',
      '客户服务',
      ARRAY['退货', '换货', '退换', '七天', '无理由'],
      9,
      156,
      v_user_id
    ),
    (
      v_company_id,
      '支付方式有哪些？',
      '我们支持多种支付方式：\n1. 信用卡（Visa、Master、JCB）\n2. 银行转账\n3. 第三方支付（支付宝、微信支付）\n4. 货到付款（部分地区）\n所有支付都经过加密处理，保障您的资金安全。',
      '支付问题',
      ARRAY['支付', '付款', '信用卡', '转账'],
      8,
      134,
      v_user_id
    ),
    (
      v_company_id,
      '配送需要多长时间？',
      '配送时间根据您的地址而定：\n• 市区：1-2个工作日\n• 郊区：2-3个工作日\n• 外地：3-5个工作日\n我们与多家物流公司合作，确保快速配送。您可以在订单详情页面实时追踪物流状态。',
      '物流配送',
      ARRAY['配送', '物流', '快递', '送货', '时间'],
      9,
      198,
      v_user_id
    ),
    (
      v_company_id,
      '如何申请发票？',
      '您可以在下单时勾选「需要发票」选项，填写发票抬头和税号。我们会随货一起寄送纸质发票。如果需要电子发票，可以在订单完成后，在「我的订单」中下载。企业客户可申请增值税专用发票。',
      '发票问题',
      ARRAY['发票', '税号', '开票', '增值税'],
      7,
      89,
      v_user_id
    ),
    (
      v_company_id,
      '如何成为会员？',
      '注册即可成为我们的会员！会员享有：\n✨ 专属折扣优惠\n✨ 积分奖励计划\n✨ 生日礼品\n✨ 优先客服支持\n✨ 新品抢先购买权\n累计消费达到一定金额可升级为VIP会员，享受更多特权。',
      '会员服务',
      ARRAY['会员', '注册', '积分', 'VIP', '优惠'],
      8,
      167,
      v_user_id
    ),
    (
      v_company_id,
      '忘记密码怎么办？',
      '请按以下步骤重置密码：\n1. 点击登录页面的「忘记密码」\n2. 输入您的注册邮箱或手机号\n3. 系统会发送验证码\n4. 输入验证码后设置新密码\n如果无法接收验证码，请联系客服：400-888-8888',
      '账户问题',
      ARRAY['密码', '忘记', '重置', '验证码'],
      6,
      112,
      v_user_id
    ),
    (
      v_company_id,
      '可以修改订单吗？',
      '订单提交后30分钟内可以修改，请立即联系在线客服。如果订单已经打包发货，则无法修改。您可以选择拒收后重新下单，或收货后申请退换货。我们建议下单前仔细核对商品信息和收货地址。',
      '订单问题',
      ARRAY['订单', '修改', '更改', '取消'],
      7,
      145,
      v_user_id
    ),
    (
      v_company_id,
      '售后服务包括什么？',
      '我们提供完善的售后服务：\n• 7天无理由退换货\n• 15天质量问题免费换货\n• 1年免费维修服务\n• 终身技术支持\n• 配件优惠供应\n售后问题可通过客服热线、在线客服或邮件联系我们。',
      '售后服务',
      ARRAY['售后', '维修', '质保', '保修'],
      9,
      176,
      v_user_id
    ),
    (
      v_company_id,
      '有什么优惠活动？',
      '我们定期推出各种优惠活动：\n🎉 新用户首单立减\n🎉 会员日专属折扣\n🎉 满额赠礼\n🎉 限时秒杀\n🎉 节日促销\n关注我们的公众号或订阅邮件，第一时间获取优惠信息！',
      '客户服务',
      ARRAY['优惠', '活动', '折扣', '促销', '打折'],
      10,
      203,
      v_user_id
    ),
    (
      v_company_id,
      '如何联系客服？',
      '您可以通过以下方式联系我们：\n📞 客服热线：400-888-8888（工作日 9:00-18:00）\n💬 在线客服：网站右下角聊天窗口（24小时）\n📧 邮件：service@company.com\n📱 微信公众号：搜索「公司名称」\n我们承诺在1小时内回复您的咨询。',
      '客户服务',
      ARRAY['客服', '联系', '电话', '咨询'],
      10,
      234,
      v_user_id
    );

  -- ========================================
  -- 3. 创建对话会话
  -- ========================================
  
  INSERT INTO assistant_conversations (
    company_id, user_id, session_id, channel, status,
    category, satisfaction_rating, message_count, started_at, ended_at
  )
  VALUES
    (
      v_company_id,
      v_user_id,
      'session-001',
      'web',
      'resolved',
      'customer-service',
      5,
      6,
      NOW() - INTERVAL '2 days',
      NOW() - INTERVAL '2 days' + INTERVAL '15 minutes'
    )
    RETURNING id INTO v_conversation_id;

  -- ========================================
  -- 4. 创建助理消息
  -- ========================================
  
  INSERT INTO assistant_messages (
    company_id, user_id, conversation_id, message_type,
    content, category, intent, confidence_score, response_time_ms, ai_model_used
  )
  VALUES
    -- 对话 1
    (
      v_company_id,
      v_user_id,
      v_conversation_id,
      'user',
      '你好，我想问一下退货流程',
      'customer-service',
      'support_request',
      0.85,
      NULL,
      NULL
    ),
    (
      v_company_id,
      v_user_id,
      v_conversation_id,
      'assistant',
      '您好！很高兴为您服务。关于退货流程，我们提供7天无理由退换货服务。您需要：1. 登录账户 2. 在订单详情点击「申请退货」3. 填写退货原因并提交。请问您的订单号是多少？我可以帮您查看具体情况。',
      'customer-service',
      'support_response',
      0.92,
      2340,
      'gpt-3.5-turbo'
    ),
    (
      v_company_id,
      v_user_id,
      v_conversation_id,
      'user',
      '订单号是 ORD20241018001',
      'customer-service',
      'provide_info',
      0.95,
      NULL,
      NULL
    ),
    (
      v_company_id,
      v_user_id,
      v_conversation_id,
      'assistant',
      '感谢您提供订单号。我查到您的订单已签收2天，完全符合7天退货政策。商品需要保持原包装完整，附带所有配件。请问您是否需要我协助您提交退货申请？',
      'customer-service',
      'offer_help',
      0.88,
      1890,
      'gpt-3.5-turbo'
    ),
    (
      v_company_id,
      v_user_id,
      v_conversation_id,
      'user',
      '是的，麻烦帮我处理',
      'customer-service',
      'accept_help',
      0.92,
      NULL,
      NULL
    ),
    (
      v_company_id,
      v_user_id,
      v_conversation_id,
      'assistant',
      '好的！我已经为您提交退货申请。退货单号：RTN20241018001。请在3天内将商品寄回，物流单号请在订单页面填写。收到商品后2个工作日内退款。如有其他问题随时联系我！',
      'customer-service',
      'confirm_action',
      0.95,
      2120,
      'gpt-3.5-turbo'
    );

  -- 创建更多会话
  INSERT INTO assistant_conversations (
    company_id, user_id, session_id, channel, status,
    category, satisfaction_rating, message_count, started_at
  )
  VALUES
    (
      v_company_id,
      v_user_id,
      'session-002',
      'web',
      'active',
      'marketing',
      NULL,
      2,
      NOW() - INTERVAL '1 hour'
    ),
    (
      v_company_id,
      v_user_id,
      'session-003',
      'mobile',
      'resolved',
      'faq',
      4,
      4,
      NOW() - INTERVAL '1 day'
    );

  -- ========================================
  -- 5. 创建性能指标
  -- ========================================
  
  INSERT INTO assistant_metrics (
    company_id, date, total_messages, user_messages, assistant_messages,
    avg_response_time_seconds, satisfaction_score, resolution_rate
  )
  VALUES
    (
      v_company_id,
      CURRENT_DATE,
      48,
      24,
      24,
      2.3,
      94.5,
      87.2
    ),
    (
      v_company_id,
      CURRENT_DATE - 1,
      56,
      28,
      28,
      2.1,
      95.2,
      89.5
    ),
    (
      v_company_id,
      CURRENT_DATE - 2,
      42,
      21,
      21,
      2.5,
      93.8,
      85.7
    ),
    (
      v_company_id,
      CURRENT_DATE - 3,
      51,
      26,
      25,
      2.2,
      94.1,
      88.3
    ),
    (
      v_company_id,
      CURRENT_DATE - 4,
      45,
      23,
      22,
      2.4,
      93.5,
      86.4
    ),
    (
      v_company_id,
      CURRENT_DATE - 5,
      39,
      20,
      19,
      2.6,
      92.8,
      84.9
    ),
    (
      v_company_id,
      CURRENT_DATE - 6,
      53,
      27,
      26,
      2.0,
      96.1,
      90.2
    );

  -- ========================================
  -- 6. 创建智能推荐
  -- ========================================
  
  INSERT INTO assistant_recommendations (
    company_id, recommendation_type, title, description,
    target_audience, relevance_score, click_count, is_active
  )
  VALUES
    (
      v_company_id,
      'product',
      '新品上市 - 智能手表系列',
      '搭载最新AI技术，健康监测更精准',
      ARRAY['tech', 'health'],
      0.92,
      45,
      true
    ),
    (
      v_company_id,
      'service',
      'VIP会员专享服务升级',
      '享受更快配送和专属客服',
      ARRAY['vip', 'member'],
      0.88,
      67,
      true
    ),
    (
      v_company_id,
      'content',
      '使用技巧 - 如何延长产品寿命',
      '专业保养指南，让您的产品更耐用',
      ARRAY['all'],
      0.85,
      123,
      true
    );

  -- ========================================
  -- 7. 创建反馈记录
  -- ========================================
  
  INSERT INTO assistant_feedback (
    company_id, conversation_id, user_id, rating,
    feedback_type, comment, tags
  )
  VALUES
    (
      v_company_id,
      v_conversation_id,
      v_user_id,
      5,
      'positive',
      '回复很及时，解决了我的问题，非常满意！',
      ARRAY['快速', '专业', '满意']
    );

  RAISE NOTICE '✅ 成功创建 AI 虚拟助理示例数据！';
  RAISE NOTICE '   - 助理配置: 1 个';
  RAISE NOTICE '   - FAQ: 10 个';
  RAISE NOTICE '   - 对话会话: 3 个';
  RAISE NOTICE '   - 消息记录: 6+ 条';
  RAISE NOTICE '   - 性能指标: 7 天';
  RAISE NOTICE '   - 智能推荐: 3 个';
  RAISE NOTICE '   - 反馈记录: 1 个';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 现在可以使用 fengsmal 帐号登录测试 AI 虚拟助理！';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ 错误: %', SQLERRM;
    RAISE;
END $$;

