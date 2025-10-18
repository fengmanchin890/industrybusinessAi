"""
Model Selection and AutoML API
Endpoints for model registry, selection, and automated evaluation
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, List, Any, Optional, Literal
from app.services.model_registry import model_registry, ModelInfo
from app.services.automl_service import automl_service, ModelEvaluation
from app.core.multi_tenant import get_company_context

router = APIRouter(prefix="/models", tags=["models"])


class ModelSelectionRequest(BaseModel):
    task_type: str
    priority: Literal['speed', 'accuracy', 'cost', 'balanced'] = 'balanced'
    max_budget_per_1k: Optional[float] = None


class ModelEvaluationRequest(BaseModel):
    task_type: str
    sample_data: List[Dict[str, Any]]
    model_list: Optional[List[str]] = None
    metric: str = 'accuracy'


class HyperparameterOptimizationRequest(BaseModel):
    model_name: str
    task_type: str
    sample_data: List[Dict[str, Any]]
    n_trials: int = 20


class ABTestRequest(BaseModel):
    model_a: str
    model_b: str
    task_type: str
    sample_data: List[Dict[str, Any]]
    metric: str = 'accuracy'


class ModelUpgradeRequest(BaseModel):
    current_model: str
    task_type: str
    monthly_budget: float
    sample_data: List[Dict[str, Any]]


@router.get("/list")
async def list_models(
    category: Optional[str] = None,
    provider: Optional[str] = None
):
    """List all available AI models"""
    try:
        models = model_registry.list_models(category=category, provider=provider)
        return {
            "status": "success",
            "count": len(models),
            "models": [model.dict() for model in models]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/info/{model_name}")
async def get_model_info(model_name: str):
    """Get detailed information about a specific model"""
    try:
        model = model_registry.get_model(model_name)
        if not model:
            raise HTTPException(status_code=404, detail=f"Model {model_name} not found")
        
        return {
            "status": "success",
            "model": model.dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/select")
async def select_model(
    request: ModelSelectionRequest,
    context: Dict = Depends(get_company_context)
):
    """Select the best model based on criteria"""
    try:
        # Get company settings
        # In production, fetch from database
        company_settings = {
            'subscription_tier': 'pro',  # Would come from context
            'preferred_ai_model': None
        }
        
        model = model_registry.select_best_model(
            task_type=request.task_type,
            priority=request.priority,
            max_budget_per_1k=request.max_budget_per_1k,
            subscription_tier=company_settings.get('subscription_tier', 'free')
        )
        
        return {
            "status": "success",
            "selected_model": model.dict(),
            "company_id": context['company_id'],
            "criteria": {
                "task_type": request.task_type,
                "priority": request.priority
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommend")
async def recommend_model(
    task_type: str,
    context: Dict = Depends(get_company_context)
):
    """Recommend model based on company settings and usage history"""
    try:
        # Get company settings
        # In production, fetch from Supabase
        company_settings = {
            'subscription_tier': 'pro',
            'preferred_ai_model': None,
            'model_priority': 'balanced',
            'max_cost_per_1k_tokens': None
        }
        
        model = model_registry.recommend_model_for_company(
            company_settings,
            task_type
        )
        
        return {
            "status": "success",
            "recommended_model": model.dict(),
            "company_id": context['company_id'],
            "rationale": f"Based on your {company_settings['subscription_tier']} tier and {company_settings['model_priority']} priority"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics")
async def get_model_metrics(
    model_name: Optional[str] = None,
    context: Dict = Depends(get_company_context)
):
    """Get usage metrics for models"""
    try:
        metrics = model_registry.get_metrics(model_name)
        return {
            "status": "success",
            "company_id": context['company_id'],
            "metrics": {k: v.dict() if v else None for k, v in metrics.items()}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== AutoML Endpoints ====================

@router.post("/evaluate")
async def evaluate_models(
    request: ModelEvaluationRequest,
    context: Dict = Depends(get_company_context)
):
    """Evaluate multiple models on sample data"""
    try:
        evaluations = await automl_service.evaluate_models(
            task_type=request.task_type,
            sample_data=request.sample_data,
            model_list=request.model_list,
            metric=request.metric
        )
        
        return {
            "status": "success",
            "company_id": context['company_id'],
            "evaluations": [e.dict() for e in evaluations],
            "best_model": evaluations[0].model_name if evaluations else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize-hyperparameters")
async def optimize_hyperparameters(
    request: HyperparameterOptimizationRequest,
    context: Dict = Depends(get_company_context)
):
    """Optimize hyperparameters for a model"""
    try:
        result = await automl_service.optimize_hyperparameters(
            model_name=request.model_name,
            task_type=request.task_type,
            sample_data=request.sample_data,
            n_trials=request.n_trials
        )
        
        return {
            "status": "success",
            "company_id": context['company_id'],
            "optimization_result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ab-test")
async def run_ab_test(
    request: ABTestRequest,
    context: Dict = Depends(get_company_context)
):
    """Run A/B test between two models"""
    try:
        result = await automl_service.run_ab_test(
            model_a=request.model_a,
            model_b=request.model_b,
            task_type=request.task_type,
            sample_data=request.sample_data,
            metric=request.metric
        )
        
        return {
            "status": "success",
            "company_id": context['company_id'],
            "test_result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suggest-upgrade")
async def suggest_model_upgrade(
    request: ModelUpgradeRequest,
    context: Dict = Depends(get_company_context)
):
    """Suggest model upgrade based on budget and performance"""
    try:
        suggestion = await automl_service.suggest_model_upgrade(
            current_model=request.current_model,
            task_type=request.task_type,
            company_budget=request.monthly_budget,
            sample_data=request.sample_data
        )
        
        return {
            "status": "success",
            "company_id": context['company_id'],
            "suggestion": suggestion
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/evaluation-history")
async def get_evaluation_history(
    task_type: Optional[str] = None,
    context: Dict = Depends(get_company_context)
):
    """Get historical model evaluation data"""
    try:
        history = automl_service.get_evaluation_history(task_type)
        
        return {
            "status": "success",
            "company_id": context['company_id'],
            "history": {
                k: [e.dict() for e in v] for k, v in history.items()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def models_health():
    """Health check for model selection API"""
    return {
        "status": "ok",
        "service": "model-selector",
        "models_available": len(model_registry.list_models())
    }



