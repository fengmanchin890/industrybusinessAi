"""
财务报表 API
Financial Reports API
"""
from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from app.models.report import (
    ReportGenerateRequest, FinancialReport, ReportType,
    ExportRequest, ExportResponse, ExportFormat
)
from app.services import report_generator
from datetime import datetime

router = APIRouter()


@router.post("/generate", response_model=FinancialReport, status_code=status.HTTP_201_CREATED)
async def generate_report(request: ReportGenerateRequest):
    """生成财务报表"""
    try:
        report = await report_generator.generate_report(
            request=request,
            user_id="current_user"  # 实际应从认证中获取
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{report_id}", response_model=FinancialReport)
async def get_report(report_id: str):
    """获取报表详情"""
    report = await report_generator.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/", response_model=List[FinancialReport])
async def list_reports(
    company_id: Optional[str] = None,
    report_type: Optional[ReportType] = None
):
    """列出所有报表"""
    reports = await report_generator.list_reports(
        company_id=company_id,
        report_type=report_type
    )
    return reports


@router.post("/export", response_model=ExportResponse)
async def export_report(request: ExportRequest):
    """导出报表"""
    try:
        result = await report_generator.export_report(
            report_id=request.report_id,
            format=request.format
        )
        return ExportResponse(
            report_id=request.report_id,
            format=request.format,
            file_url=result.get("download_url"),
            exported_at=datetime.now(),
            message=result.get("message", "Export completed")
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health/check")
async def reports_health():
    """健康检查"""
    return {
        "status": "ok",
        "service": "financial-reports",
        "total_reports": len(report_generator.reports)
    }

