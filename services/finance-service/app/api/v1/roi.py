"""
ROI 计算 API
ROI Calculator API
"""
from fastapi import APIRouter, HTTPException
from app.models.roi import (
    ROICalculationRequest, ROICalculationResult,
    ProjectComparisonRequest, ProjectComparisonResult,
    SensitivityAnalysisRequest, SensitivityAnalysisResult
)
from app.services.roi_calculator import roi_calculator

router = APIRouter()


@router.post("/calculate", response_model=ROICalculationResult)
async def calculate_roi(request: ROICalculationRequest):
    """计算 ROI"""
    try:
        result = await roi_calculator.calculate_roi(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare", response_model=ProjectComparisonResult)
async def compare_projects(request: ProjectComparisonRequest):
    """比较多个项目"""
    try:
        result = await roi_calculator.compare_projects(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sensitivity", response_model=SensitivityAnalysisResult)
async def sensitivity_analysis(request: SensitivityAnalysisRequest):
    """敏感性分析"""
    try:
        result = await roi_calculator.sensitivity_analysis(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health/check")
async def roi_health():
    """健康检查"""
    return {
        "status": "ok",
        "service": "roi-calculator",
        "total_projects": len(roi_calculator.projects)
    }

