from fastapi import APIRouter
from .reports import router as reports_router
from .cost_analysis import router as cost_router
from .roi import router as roi_router
from .anomaly import router as anomaly_router

# 创建 v1 API 路由
router = APIRouter()

# 包含所有子路由
router.include_router(reports_router, prefix="/reports", tags=["reports"])
router.include_router(cost_router, prefix="/cost-analysis", tags=["cost-analysis"])
router.include_router(roi_router, prefix="/roi", tags=["roi"])
router.include_router(anomaly_router, prefix="/anomaly", tags=["anomaly"])

__all__ = ["router"]

