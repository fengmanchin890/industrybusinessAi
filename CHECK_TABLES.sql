-- 檢查 student_grades 表是否存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'student_grades'
) AS student_grades_exists;

-- 檢查所有學生表現相關的表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%student%' OR table_name LIKE '%performance%'
ORDER BY table_name;

-- 如果 student_grades 存在，檢查數據
SELECT COUNT(*) as total_records FROM student_grades;

