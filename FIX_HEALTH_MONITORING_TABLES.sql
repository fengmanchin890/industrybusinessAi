-- ========================================
-- 修復 AI 健康監測系統 - 清理並重建
-- ========================================

-- 1. 刪除現有對象（如果存在）
DROP TABLE IF EXISTS health_reports CASCADE;
DROP TABLE IF EXISTS monitoring_plans CASCADE;
DROP TABLE IF EXISTS health_alerts CASCADE;
DROP TABLE IF EXISTS health_metrics CASCADE;
DROP TABLE IF EXISTS vital_signs CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

DROP FUNCTION IF EXISTS get_health_monitoring_stats(UUID);
DROP FUNCTION IF EXISTS calculate_bmi(DECIMAL, DECIMAL);
DROP FUNCTION IF EXISTS get_bmi_category(DECIMAL);

-- 2. 現在重新執行完整的 migration
-- 請在執行完此腳本後，重新執行：
-- supabase/migrations/20251018260000_add_health_monitoring_tables.sql

DO $$ BEGIN
  RAISE NOTICE '✅ 舊表已清理，請重新執行 migration 文件';
END $$;


