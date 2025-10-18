from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime, date
from enum import Enum


class CostCategory(str, Enum):
    """成本类别"""
    DIRECT_MATERIAL = "direct_material"  # 直接材料
    DIRECT_LABOR = "direct_labor"  # 直接人工
    MANUFACTURING_OVERHEAD = "manufacturing_overhead"  # 制造费用
    SELLING_EXPENSE = "selling_expense"  # 销售费用
    ADMIN_EXPENSE = "admin_expense"  # 管理费用
    FINANCIAL_EXPENSE = "financial_expense"  # 财务费用
    OTHER = "other"


class PredictionModel(str, Enum):
    """预测模型"""
    LINEAR_REGRESSION = "linear_regression"
    ARIMA = "arima"
    LSTM = "lstm"
    PROPHET = "prophet"
    AUTO = "auto"  # 自动选择最佳模型


class CostAnalysisRequest(BaseModel):
    """成本分析请求"""
    company_id: Optional[str] = None
    start_date: date
    end_date: date
    categories: Optional[List[CostCategory]] = None
    group_by: Optional[str] = "category"  # category, department, product, etc.


class CostPredictionRequest(BaseModel):
    """成本预测请求"""
    company_id: Optional[str] = None
    historical_start: date
    historical_end: date
    prediction_periods: int = 12  # 预测未来N个周期
    model: PredictionModel = PredictionModel.AUTO
    categories: Optional[List[CostCategory]] = None


class CostEntry(BaseModel):
    """成本记录"""
    id: str
    company_id: str
    date: date
    category: CostCategory
    amount: float
    description: Optional[str] = None
    department: Optional[str] = None
    product: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class CostAnalysisResult(BaseModel):
    """成本分析结果"""
    period_start: date
    period_end: date
    total_cost: float
    cost_by_category: Dict[str, float]
    cost_by_period: Dict[str, float]
    trends: Dict[str, Any]
    insights: List[str]
    top_cost_drivers: List[Dict[str, Any]]


class CostPredictionResult(BaseModel):
    """成本预测结果"""
    predictions: List[Dict[str, Any]]  # [{period, predicted_cost, confidence}]
    model_used: str
    accuracy_metrics: Dict[str, float]
    confidence_level: float
    insights: List[str]
    recommendations: List[str]


class CostOptimization(BaseModel):
    """成本优化建议"""
    category: CostCategory
    current_cost: float
    potential_savings: float
    savings_percentage: float
    recommendation: str
    priority: str  # high, medium, low
    implementation_difficulty: str  # easy, medium, hard
    estimated_timeline: str

