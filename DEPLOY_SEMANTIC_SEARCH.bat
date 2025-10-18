@echo off
echo ========================================
echo AI 智能搜索 (Semantic Search) - 部署脚本
echo ========================================
echo.

echo [1/3] 部署数据库...
echo 请在 Supabase Dashboard 执行 QUICK_SEMANTIC_SEARCH_SETUP.sql
echo.
pause

echo.
echo [2/3] 部署 Edge Function...
cd supabase\functions
call supabase functions deploy semantic-search-ai
cd ..\..

echo.
echo [3/3] 部署完成！
echo.
echo ========================================
echo 部署摘要
echo ========================================
echo ✅ 数据库表：products, search_queries, search_results, search_analytics, search_synonyms
echo ✅ Edge Function：semantic-search-ai
echo ✅ 前端组件：SemanticSearch.tsx (已连接真实API)
echo ✅ 示例数据：8个产品 (fengretail)
echo.
echo 📝 可选配置：
echo 在 Supabase Dashboard 设置环境变量：
echo   OPENAI_API_KEY = sk-...your-key...
echo   (用于生成向量 embeddings，未配置时使用文本搜索)
echo.
echo 🚀 测试：
echo 1. 使用 fengretail 账号登录
echo 2. 打开「零售行业」-「AI 智能搜索」
echo 3. 输入搜索关键词测试
echo.
echo ========================================
pause

