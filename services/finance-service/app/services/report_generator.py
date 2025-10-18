"""
财务报表生成服务
Financial Report Generator Service
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, date
import uuid
import pandas as pd
from app.models.report import (
    FinancialReport, ReportType, ReportStatus, ReportPeriod,
    ReportGenerateRequest, ExportFormat
)
from app.core.logging import app_logger


class ReportGenerator:
    """财务报表生成器"""
    
    def __init__(self):
        self.logger = app_logger
        # 模拟数据存储
        self.reports: Dict[str, FinancialReport] = {}
    
    async def generate_report(
        self,
        request: ReportGenerateRequest,
        user_id: str
    ) -> FinancialReport:
        """生成财务报表"""
        try:
            report_id = str(uuid.uuid4())
            
            # 根据报表类型生成数据
            report_data = await self._generate_report_data(
                request.report_type,
                request.period_start,
                request.period_end
            )
            
            # 创建报表对象
            report = FinancialReport(
                id=report_id,
                company_id=request.company_id or "default",
                report_type=request.report_type,
                period=request.period,
                period_start=request.period_start,
                period_end=request.period_end,
                status=ReportStatus.COMPLETED,
                data=report_data,
                summary=self._generate_summary(report_data, request.report_type),
                generated_at=datetime.now(),
                generated_by=user_id,
                template_id=request.template_id,
                revenue=report_data.get("total_revenue"),
                expenses=report_data.get("total_expenses"),
                profit=report_data.get("net_profit"),
                assets=report_data.get("total_assets"),
                liabilities=report_data.get("total_liabilities"),
                equity=report_data.get("total_equity")
            )
            
            # 保存报表
            self.reports[report_id] = report
            
            self.logger.info(f"Generated {request.report_type} report: {report_id}")
            return report
            
        except Exception as e:
            self.logger.error(f"Error generating report: {str(e)}")
            raise
    
    async def _generate_report_data(
        self,
        report_type: ReportType,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """根据类型生成报表数据（模拟）"""
        
        if report_type == ReportType.INCOME_STATEMENT:
            return await self._generate_income_statement(start_date, end_date)
        elif report_type == ReportType.BALANCE_SHEET:
            return await self._generate_balance_sheet(end_date)
        elif report_type == ReportType.CASH_FLOW:
            return await self._generate_cash_flow(start_date, end_date)
        else:
            return await self._generate_custom_report(start_date, end_date)
    
    async def _generate_income_statement(
        self,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """生成损益表数据"""
        # 模拟数据
        revenue_items = {
            "product_sales": 1500000,
            "service_revenue": 450000,
            "other_income": 50000
        }
        
        expense_items = {
            "cost_of_goods_sold": 800000,
            "operating_expenses": 400000,
            "administrative_expenses": 150000,
            "financial_expenses": 30000
        }
        
        total_revenue = sum(revenue_items.values())
        total_expenses = sum(expense_items.values())
        gross_profit = total_revenue - expense_items["cost_of_goods_sold"]
        operating_profit = gross_profit - expense_items["operating_expenses"] - expense_items["administrative_expenses"]
        net_profit = operating_profit - expense_items["financial_expenses"]
        
        return {
            "revenue_items": revenue_items,
            "expense_items": expense_items,
            "total_revenue": total_revenue,
            "total_expenses": total_expenses,
            "gross_profit": gross_profit,
            "operating_profit": operating_profit,
            "net_profit": net_profit,
            "profit_margin": (net_profit / total_revenue * 100) if total_revenue > 0 else 0
        }
    
    async def _generate_balance_sheet(self, report_date: date) -> Dict[str, Any]:
        """生成资产负债表数据"""
        assets = {
            "current_assets": {
                "cash": 500000,
                "accounts_receivable": 300000,
                "inventory": 400000
            },
            "fixed_assets": {
                "property": 1000000,
                "equipment": 500000,
                "accumulated_depreciation": -200000
            }
        }
        
        liabilities = {
            "current_liabilities": {
                "accounts_payable": 200000,
                "short_term_loans": 150000
            },
            "long_term_liabilities": {
                "long_term_loans": 500000
            }
        }
        
        total_current_assets = sum(assets["current_assets"].values())
        total_fixed_assets = sum(assets["fixed_assets"].values())
        total_assets = total_current_assets + total_fixed_assets
        
        total_current_liabilities = sum(liabilities["current_liabilities"].values())
        total_long_term_liabilities = sum(liabilities["long_term_liabilities"].values())
        total_liabilities = total_current_liabilities + total_long_term_liabilities
        
        total_equity = total_assets - total_liabilities
        
        return {
            "assets": assets,
            "liabilities": liabilities,
            "total_assets": total_assets,
            "total_liabilities": total_liabilities,
            "total_equity": total_equity,
            "current_ratio": total_current_assets / total_current_liabilities if total_current_liabilities > 0 else 0,
            "debt_to_equity": total_liabilities / total_equity if total_equity > 0 else 0
        }
    
    async def _generate_cash_flow(
        self,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """生成现金流量表数据"""
        operating_activities = {
            "cash_from_operations": 600000,
            "cash_paid_to_suppliers": -400000,
            "cash_paid_to_employees": -150000
        }
        
        investing_activities = {
            "purchase_of_equipment": -200000,
            "sale_of_assets": 50000
        }
        
        financing_activities = {
            "loan_proceeds": 300000,
            "loan_repayments": -100000,
            "dividends_paid": -50000
        }
        
        net_operating_cash = sum(operating_activities.values())
        net_investing_cash = sum(investing_activities.values())
        net_financing_cash = sum(financing_activities.values())
        net_cash_flow = net_operating_cash + net_investing_cash + net_financing_cash
        
        return {
            "operating_activities": operating_activities,
            "investing_activities": investing_activities,
            "financing_activities": financing_activities,
            "net_operating_cash": net_operating_cash,
            "net_investing_cash": net_investing_cash,
            "net_financing_cash": net_financing_cash,
            "net_cash_flow": net_cash_flow,
            "opening_cash_balance": 400000,
            "closing_cash_balance": 400000 + net_cash_flow
        }
    
    async def _generate_custom_report(
        self,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """生成自定义报表数据"""
        return {
            "custom_metrics": {
                "metric_1": 12345,
                "metric_2": 67890
            },
            "message": "Custom report data"
        }
    
    def _generate_summary(
        self,
        data: Dict[str, Any],
        report_type: ReportType
    ) -> Dict[str, Any]:
        """生成报表摘要"""
        if report_type == ReportType.INCOME_STATEMENT:
            return {
                "key_metrics": [
                    {"name": "Total Revenue", "value": data.get("total_revenue", 0)},
                    {"name": "Net Profit", "value": data.get("net_profit", 0)},
                    {"name": "Profit Margin", "value": f"{data.get('profit_margin', 0):.2f}%"}
                ],
                "insights": [
                    "Revenue shows healthy growth",
                    "Operating expenses are within budget",
                    "Profit margin is above industry average"
                ]
            }
        elif report_type == ReportType.BALANCE_SHEET:
            return {
                "key_metrics": [
                    {"name": "Total Assets", "value": data.get("total_assets", 0)},
                    {"name": "Total Liabilities", "value": data.get("total_liabilities", 0)},
                    {"name": "Total Equity", "value": data.get("total_equity", 0)}
                ],
                "ratios": [
                    {"name": "Current Ratio", "value": f"{data.get('current_ratio', 0):.2f}"},
                    {"name": "Debt-to-Equity", "value": f"{data.get('debt_to_equity', 0):.2f}"}
                ]
            }
        elif report_type == ReportType.CASH_FLOW:
            return {
                "key_metrics": [
                    {"name": "Net Operating Cash", "value": data.get("net_operating_cash", 0)},
                    {"name": "Net Cash Flow", "value": data.get("net_cash_flow", 0)},
                    {"name": "Closing Balance", "value": data.get("closing_cash_balance", 0)}
                ]
            }
        else:
            return {"message": "Custom report summary"}
    
    async def get_report(self, report_id: str) -> Optional[FinancialReport]:
        """获取报表"""
        return self.reports.get(report_id)
    
    async def list_reports(
        self,
        company_id: Optional[str] = None,
        report_type: Optional[ReportType] = None
    ) -> List[FinancialReport]:
        """列出报表"""
        reports = list(self.reports.values())
        
        if company_id:
            reports = [r for r in reports if r.company_id == company_id]
        if report_type:
            reports = [r for r in reports if r.report_type == report_type]
        
        return sorted(reports, key=lambda x: x.generated_at, reverse=True)
    
    async def export_report(
        self,
        report_id: str,
        format: ExportFormat
    ) -> Dict[str, Any]:
        """导出报表"""
        report = await self.get_report(report_id)
        if not report:
            raise ValueError(f"Report {report_id} not found")
        
        if format == ExportFormat.EXCEL:
            return await self._export_to_excel(report)
        elif format == ExportFormat.PDF:
            return await self._export_to_pdf(report)
        elif format == ExportFormat.JSON:
            return report.model_dump()
        elif format == ExportFormat.CSV:
            return await self._export_to_csv(report)
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    async def _export_to_excel(self, report: FinancialReport) -> Dict[str, Any]:
        """导出为 Excel（模拟）"""
        self.logger.info(f"Exporting report {report.id} to Excel")
        return {
            "format": "excel",
            "filename": f"report_{report.id}.xlsx",
            "message": "Excel export ready",
            "download_url": f"/downloads/report_{report.id}.xlsx"
        }
    
    async def _export_to_pdf(self, report: FinancialReport) -> Dict[str, Any]:
        """导出为 PDF（模拟）"""
        self.logger.info(f"Exporting report {report.id} to PDF")
        return {
            "format": "pdf",
            "filename": f"report_{report.id}.pdf",
            "message": "PDF export ready",
            "download_url": f"/downloads/report_{report.id}.pdf"
        }
    
    async def _export_to_csv(self, report: FinancialReport) -> Dict[str, Any]:
        """导出为 CSV（模拟）"""
        self.logger.info(f"Exporting report {report.id} to CSV")
        return {
            "format": "csv",
            "filename": f"report_{report.id}.csv",
            "message": "CSV export ready",
            "download_url": f"/downloads/report_{report.id}.csv"
        }


# 全局实例
report_generator = ReportGenerator()

