-- ========================================
-- 修復 AI 病歷助理系統 - 清理並重建
-- ========================================

-- 1. 刪除現有對象（如果存在）
DROP TABLE IF EXISTS medical_record_reviews CASCADE;
DROP TABLE IF EXISTS diagnosis_suggestions CASCADE;
DROP TABLE IF EXISTS medical_record_analysis CASCADE;
DROP TABLE IF EXISTS medical_record_templates CASCADE;
DROP TABLE IF EXISTS symptom_dictionary CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;

DROP FUNCTION IF EXISTS get_medical_record_stats(UUID);
DROP FUNCTION IF EXISTS search_medical_records(UUID, TEXT, INTEGER);

-- 2. 現在重新執行完整的 migration
-- 請在執行完此腳本後，重新執行：
-- supabase/migrations/20251018270000_add_medical_record_tables.sql

DO $$ BEGIN
  RAISE NOTICE '✅ 舊表已清理，請重新執行 migration 文件';
END $$;


