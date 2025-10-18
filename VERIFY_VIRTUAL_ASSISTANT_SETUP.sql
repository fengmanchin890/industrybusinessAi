-- ========================================
-- AI 虚拟助理 - 安装验证脚本
-- 检查所有必需的表和函数是否存在
-- ========================================

DO $$
DECLARE
  v_missing_items TEXT[] := ARRAY[]::TEXT[];
  v_item TEXT;
  v_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'AI 虚拟助理 - 安装验证';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- 检查表
  RAISE NOTICE '检查数据库表...';
  
  -- assistant_messages
  SELECT COUNT(*) INTO v_count 
  FROM information_schema.tables 
  WHERE table_name = 'assistant_messages';
  
  IF v_count = 0 THEN
    v_missing_items := array_append(v_missing_items, '❌ 表: assistant_messages');
  ELSE
    RAISE NOTICE '✅ 表: assistant_messages';
  END IF;

  -- assistant_conversations
  SELECT COUNT(*) INTO v_count 
  FROM information_schema.tables 
  WHERE table_name = 'assistant_conversations';
  
  IF v_count = 0 THEN
    v_missing_items := array_append(v_missing_items, '❌ 表: assistant_conversations');
  ELSE
    RAISE NOTICE '✅ 表: assistant_conversations';
  END IF;

  -- assistant_faqs
  SELECT COUNT(*) INTO v_count 
  FROM information_schema.tables 
  WHERE table_name = 'assistant_faqs';
  
  IF v_count = 0 THEN
    v_missing_items := array_append(v_missing_items, '❌ 表: assistant_faqs');
  ELSE
    RAISE NOTICE '✅ 表: assistant_faqs';
  END IF;

  -- assistant_configs
  SELECT COUNT(*) INTO v_count 
  FROM information_schema.tables 
  WHERE table_name = 'assistant_configs';
  
  IF v_count = 0 THEN
    v_missing_items := array_append(v_missing_items, '❌ 表: assistant_configs');
  ELSE
    RAISE NOTICE '✅ 表: assistant_configs';
  END IF;

  -- assistant_metrics
  SELECT COUNT(*) INTO v_count 
  FROM information_schema.tables 
  WHERE table_name = 'assistant_metrics';
  
  IF v_count = 0 THEN
    v_missing_items := array_append(v_missing_items, '❌ 表: assistant_metrics');
  ELSE
    RAISE NOTICE '✅ 表: assistant_metrics';
  END IF;

  -- assistant_recommendations
  SELECT COUNT(*) INTO v_count 
  FROM information_schema.tables 
  WHERE table_name = 'assistant_recommendations';
  
  IF v_count = 0 THEN
    v_missing_items := array_append(v_missing_items, '❌ 表: assistant_recommendations');
  ELSE
    RAISE NOTICE '✅ 表: assistant_recommendations';
  END IF;

  -- assistant_feedback
  SELECT COUNT(*) INTO v_count 
  FROM information_schema.tables 
  WHERE table_name = 'assistant_feedback';
  
  IF v_count = 0 THEN
    v_missing_items := array_append(v_missing_items, '❌ 表: assistant_feedback');
  ELSE
    RAISE NOTICE '✅ 表: assistant_feedback';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '检查数据库函数...';

  -- 检查函数
  SELECT COUNT(*) INTO v_count 
  FROM pg_proc 
  WHERE proname = 'get_today_assistant_stats';
  
  IF v_count = 0 THEN
    v_missing_items := array_append(v_missing_items, '❌ 函数: get_today_assistant_stats');
  ELSE
    RAISE NOTICE '✅ 函数: get_today_assistant_stats';
  END IF;

  SELECT COUNT(*) INTO v_count 
  FROM pg_proc 
  WHERE proname = 'get_category_stats';
  
  IF v_count = 0 THEN
    v_missing_items := array_append(v_missing_items, '❌ 函数: get_category_stats');
  ELSE
    RAISE NOTICE '✅ 函数: get_category_stats';
  END IF;

  SELECT COUNT(*) INTO v_count 
  FROM pg_proc 
  WHERE proname = 'search_faqs';
  
  IF v_count = 0 THEN
    v_missing_items := array_append(v_missing_items, '❌ 函数: search_faqs');
  ELSE
    RAISE NOTICE '✅ 函数: search_faqs';
  END IF;

  SELECT COUNT(*) INTO v_count 
  FROM pg_proc 
  WHERE proname = 'increment_faq_hits';
  
  IF v_count = 0 THEN
    v_missing_items := array_append(v_missing_items, '❌ 函数: increment_faq_hits');
  ELSE
    RAISE NOTICE '✅ 函数: increment_faq_hits';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  
  -- 显示结果
  IF array_length(v_missing_items, 1) IS NULL THEN
    RAISE NOTICE '✅ 所有检查通过！';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 现在可以运行 QUICK_VIRTUAL_ASSISTANT_SETUP.sql 添加示例数据';
  ELSE
    RAISE NOTICE '❌ 发现缺失项目:';
    RAISE NOTICE '';
    FOREACH v_item IN ARRAY v_missing_items LOOP
      RAISE NOTICE '%', v_item;
    END LOOP;
    RAISE NOTICE '';
    RAISE NOTICE '📋 修复步骤:';
    RAISE NOTICE '   1. 在 Supabase Dashboard 的 SQL Editor 中';
    RAISE NOTICE '   2. 执行以下文件:';
    RAISE NOTICE '      supabase/migrations/20251018310000_add_virtual_assistant_tables.sql';
    RAISE NOTICE '   3. 然后重新运行此验证脚本';
  END IF;
  
  RAISE NOTICE '========================================';
  
END $$;

