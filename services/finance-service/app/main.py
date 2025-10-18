"""
Finance Service - Main Application
财务服务主应用
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import app_logger
from app.api.v1 import router as api_v1_router
import os

# 创建日志目录
os.makedirs("logs", exist_ok=True)

# 创建 FastAPI 应用
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Comprehensive Financial Management Service",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if isinstance(settings.ALLOWED_ORIGINS, str) else settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 健康检查
@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "finance-service",
        "version": settings.APP_VERSION,
        "modules": [
            "financial_reports",
            "cost_analysis",
            "roi_calculator",
            "anomaly_detection"
        ]
    }

# 包含 API 路由
app.include_router(api_v1_router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    """启动事件"""
    app_logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    app_logger.info("Available modules:")
    app_logger.info("  - Financial Reports (automated report generation)")
    app_logger.info("  - Cost Analysis (analysis and prediction)")
    app_logger.info("  - ROI Calculator (investment analysis)")
    app_logger.info("  - Anomaly Detection (AI-powered anomaly detection)")

@app.on_event("shutdown")
async def shutdown_event():
    """关闭事件"""
    app_logger.info("Shutting down Finance Service")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8002,
        reload=settings.DEBUG
    )

