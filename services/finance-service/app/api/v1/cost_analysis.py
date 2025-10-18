"""
成本分析 API
Cost Analysis API
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.models.cost import (
    CostAnalysisRequest, CostAnalysisResult,
    CostPredictionRequest, CostPredictionResult,
    CostOptimization
)
from app.services import cost_analyzer

router = APIRouter()


@router.post("/analyze", response_model=CostAnalysisResult)
async def analyze_costs(request: CostAnalysisRequest):
    """分析成本"""
    try:
        result = await cost_analyzer.analyze_costs(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict", response_model=CostPredictionResult)
async def predict_costs(request: CostPredictionRequest):
    """预测未来成本"""
    try:
        result = await cost_analyzer.predict_costs(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/optimize", response_model=List[CostOptimization])
async def get_optimization_suggestions(company_id: Optional[str] = None):
    """获取成本优化建议"""
    try:
        optimizations = await cost_analyzer.optimize_costs(company_id)
        return optimizations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health/check")
async def cost_analysis_health():
    """健康检查"""
    return {
        "status": "ok",
        "service": "cost-analysis",
        "total_cost_entries": len(cost_analyzer.cost_entries)
    }

