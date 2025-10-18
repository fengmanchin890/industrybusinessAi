from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime, date
from enum import Enum


class ReportType(str, Enum):
    """财务报表类型"""
    INCOME_STATEMENT = "income_statement"  # 损益表
    BALANCE_SHEET = "balance_sheet"  # 资产负债表
    CASH_FLOW = "cash_flow"  # 现金流量表
    CUSTOM = "custom"  # 自定义报表


class ReportPeriod(str, Enum):
    """报表周期"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    CUSTOM = "custom"


class ReportStatus(str, Enum):
    """报表状态"""
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class ExportFormat(str, Enum):
    """导出格式"""
    EXCEL = "excel"
    PDF = "pdf"
    JSON = "json"
    CSV = "csv"


class ReportGenerateRequest(BaseModel):
    """生成报表请求"""
    report_type: ReportType
    period: ReportPeriod = ReportPeriod.MONTHLY
    period_start: date
    period_end: date
    company_id: Optional[str] = None
    template_id: Optional[str] = None
    custom_metrics: Optional[List[str]] = None


class FinancialReport(BaseModel):
    """财务报表模型"""
    id: str
    company_id: str
    report_type: ReportType
    period: ReportPeriod
    period_start: date
    period_end: date
    status: ReportStatus
    data: Dict[str, Any] = Field(default_factory=dict)
    summary: Optional[Dict[str, Any]] = None
    generated_at: datetime
    generated_by: str
    template_id: Optional[str] = None
    
    # 报表特定数据
    revenue: Optional[float] = None
    expenses: Optional[float] = None
    profit: Optional[float] = None
    assets: Optional[float] = None
    liabilities: Optional[float] = None
    equity: Optional[float] = None


class ReportTemplate(BaseModel):
    """报表模板"""
    id: str
    name: str
    report_type: ReportType
    description: Optional[str] = None
    structure: Dict[str, Any]
    is_default: bool = False
    created_at: datetime
    updated_at: datetime


class ExportRequest(BaseModel):
    """导出请求"""
    report_id: str
    format: ExportFormat
    include_charts: bool = True
    include_summary: bool = True


class ExportResponse(BaseModel):
    """导出响应"""
    report_id: str
    format: ExportFormat
    file_url: Optional[str] = None
    file_data: Optional[str] = None  # Base64 encoded
    exported_at: datetime
    message: str

