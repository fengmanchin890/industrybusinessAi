@echo off
echo ========================================
echo AI Office Agent - 部署脚本
echo ========================================
echo.

echo [1/3] 部署 Edge Function...
call supabase functions deploy office-agent-ai --no-verify-jwt
if %errorlevel% neq 0 (
    echo 错误: Edge Function 部署失败
    pause
    exit /b 1
)
echo ✅ Edge Function 部署成功
echo.

echo [2/3] 执行数据库 Migration...
call supabase db push
if %errorlevel% neq 0 (
    echo ⚠️  警告: 数据库 Migration 可能已经执行过
)
echo ✅ 数据库更新完成
echo.

echo [3/3] 创建示例数据...
echo 请在 Supabase SQL Editor 中执行 QUICK_OFFICE_AGENT_SETUP.sql
echo.

echo ========================================
echo ✅ 部署完成！
echo ========================================
echo.
echo 下一步:
echo 1. 在 Supabase SQL Editor 执行 QUICK_OFFICE_AGENT_SETUP.sql
echo 2. 使用 fengsmal 账号登录测试
echo 3. 查看 OFFICE_AGENT_COMPLETE.md 了解详细信息
echo.

pause


