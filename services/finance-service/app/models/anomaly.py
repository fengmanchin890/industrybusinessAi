from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime, date
from enum import Enum


class AnomalySeverity(str, Enum):
    """异常严重程度"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AnomalyType(str, Enum):
    """异常类型"""
    REVENUE_DROP = "revenue_drop"  # 收入下降
    COST_SPIKE = "cost_spike"  # 成本激增
    UNUSUAL_TRANSACTION = "unusual_transaction"  # 异常交易
    BUDGET_OVERRUN = "budget_overrun"  # 预算超支
    PATTERN_DEVIATION = "pattern_deviation"  # 模式偏离
    OTHER = "other"


class AnomalyStatus(str, Enum):
    """异常状态"""
    DETECTED = "detected"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"


class AnomalyDetectionRequest(BaseModel):
    """异常检测请求"""
    company_id: Optional[str] = None
    start_date: date
    end_date: date
    metrics: Optional[List[str]] = None  # revenue, cost, profit, etc.
    sensitivity: float = 0.95  # 95% confidence interval
    algorithms: Optional[List[str]] = None  # ["isolation_forest", "lstm", "statistical"]


class FinancialAnomaly(BaseModel):
    """财务异常"""
    id: str
    company_id: str
    detected_at: datetime
    date: date
    type: AnomalyType
    severity: AnomalySeverity
    status: AnomalyStatus
    metric_name: str
    expected_value: float
    actual_value: float
    deviation_percentage: float
    confidence_score: float
    description: str
    potential_causes: List[str]
    recommended_actions: List[str]
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AnomalyDetectionResult(BaseModel):
    """异常检测结果"""
    period_start: date
    period_end: date
    total_anomalies: int
    anomalies_by_severity: Dict[str, int]
    anomalies_by_type: Dict[str, int]
    anomalies: List[FinancialAnomaly]
    insights: List[str]
    recommendations: List[str]


class AnomalyRule(BaseModel):
    """异常检测规则"""
    id: str
    company_id: str
    name: str
    description: Optional[str] = None
    metric_name: str
    condition: str  # 例如: "value > threshold * 1.2"
    threshold: float
    severity: AnomalySeverity
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class AnomalyRuleCreateRequest(BaseModel):
    """创建异常规则请求"""
    name: str
    description: Optional[str] = None
    metric_name: str
    condition: str
    threshold: float
    severity: AnomalySeverity = AnomalySeverity.MEDIUM


class AnomalyAlert(BaseModel):
    """异常告警"""
    id: str
    anomaly_id: str
    company_id: str
    sent_at: datetime
    recipients: List[str]
    channel: str  # email, sms, webhook
    message: str
    is_acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None

