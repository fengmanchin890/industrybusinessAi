from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime, date
from enum import Enum


class ProjectStatus(str, Enum):
    """项目状态"""
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CashFlowType(str, Enum):
    """现金流类型"""
    INITIAL_INVESTMENT = "initial_investment"
    OPERATING_INFLOW = "operating_inflow"
    OPERATING_OUTFLOW = "operating_outflow"
    SALVAGE_VALUE = "salvage_value"


class ROIProject(BaseModel):
    """ROI 项目"""
    id: str
    company_id: str
    name: str
    description: Optional[str] = None
    status: ProjectStatus
    start_date: date
    end_date: Optional[date] = None
    initial_investment: float
    expected_returns: float
    actual_returns: Optional[float] = None
    cash_flows: List[Dict[str, Any]] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class ROICalculationRequest(BaseModel):
    """ROI 计算请求"""
    project_id: Optional[str] = None
    initial_investment: float
    cash_flows: List[Dict[str, Any]]  # [{period, amount, type}]
    discount_rate: float = 0.10  # 折现率，默认 10%
    project_duration: int  # 项目持续期（年）


class ROICalculationResult(BaseModel):
    """ROI 计算结果"""
    project_id: Optional[str] = None
    roi: float  # 投资回报率 (%)
    roi_ratio: float  # ROI 比率
    npv: float  # 净现值
    irr: Optional[float] = None  # 内部收益率
    payback_period: Optional[float] = None  # 回收期（年）
    profitability_index: float  # 盈利指数
    breakeven_point: Optional[Dict[str, Any]] = None
    risk_assessment: Dict[str, Any] = Field(default_factory=dict)


class ProjectComparisonRequest(BaseModel):
    """项目比较请求"""
    project_ids: List[str]
    comparison_metrics: Optional[List[str]] = None  # roi, npv, irr, payback_period


class ProjectComparisonResult(BaseModel):
    """项目比较结果"""
    projects: List[Dict[str, Any]]
    rankings: Dict[str, List[str]]  # {metric: [project_ids in order]}
    best_project: str
    recommendation: str
    comparison_chart_data: Dict[str, Any]


class SensitivityAnalysisRequest(BaseModel):
    """敏感性分析请求"""
    project_id: str
    variables: List[str]  # ["initial_investment", "revenue", "costs", "discount_rate"]
    variation_range: float = 0.20  # ±20%


class SensitivityAnalysisResult(BaseModel):
    """敏感性分析结果"""
    project_id: str
    base_case_roi: float
    sensitivity_data: Dict[str, List[Dict[str, Any]]]  # {variable: [{change, roi}]}
    most_sensitive_variables: List[Dict[str, Any]]
    risk_level: str  # low, medium, high
    recommendations: List[str]

