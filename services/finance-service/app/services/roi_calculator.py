"""
ROI 计算服务
ROI Calculator Service
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, date
import uuid
import numpy as np
from app.models.roi import (
    ROIProject, ProjectStatus, ROICalculationRequest, ROICalculationResult,
    ProjectComparisonRequest, ProjectComparisonResult,
    SensitivityAnalysisRequest, SensitivityAnalysisResult
)
from app.core.logging import app_logger


class ROICalculator:
    """ROI 计算器"""
    
    def __init__(self):
        self.logger = app_logger
        self.projects: Dict[str, ROIProject] = {}
        self._initialize_mock_projects()
    
    def _initialize_mock_projects(self):
        """初始化模拟项目"""
        projects_data = [
            {
                "name": "Factory Automation Project",
                "initial_investment": 500000,
                "expected_returns": 750000,
                "status": ProjectStatus.IN_PROGRESS
            },
            {
                "name": "AI Quality Control System",
                "initial_investment": 300000,
                "expected_returns": 500000,
                "status": ProjectStatus.PLANNING
            },
            {
                "name": "Supply Chain Optimization",
                "initial_investment": 400000,
                "expected_returns": 600000,
                "status": ProjectStatus.COMPLETED
            }
        ]
        
        for data in projects_data:
            project_id = str(uuid.uuid4())
            project = ROIProject(
                id=project_id,
                company_id="default",
                name=data["name"],
                status=data["status"],
                start_date=date.today(),
                initial_investment=data["initial_investment"],
                expected_returns=data["expected_returns"],
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            self.projects[project_id] = project
    
    async def calculate_roi(
        self,
        request: ROICalculationRequest
    ) -> ROICalculationResult:
        """计算 ROI"""
        try:
            initial_investment = request.initial_investment
            cash_flows = request.cash_flows
            discount_rate = request.discount_rate
            
            # 计算总回报
            total_returns = sum(cf["amount"] for cf in cash_flows if cf.get("amount", 0) > 0)
            
            # ROI 计算
            roi = ((total_returns - initial_investment) / initial_investment) * 100
            roi_ratio = total_returns / initial_investment if initial_investment > 0 else 0
            
            # NPV 计算
            npv = self._calculate_npv(cash_flows, discount_rate, initial_investment)
            
            # IRR 计算
            irr = self._calculate_irr(cash_flows, initial_investment)
            
            # 回收期计算
            payback_period = self._calculate_payback_period(cash_flows, initial_investment)
            
            # 盈利指数
            profitability_index = npv / initial_investment if initial_investment > 0 else 0
            
            # 风险评估
            risk_assessment = self._assess_risk(roi, npv, payback_period)
            
            result = ROICalculationResult(
                project_id=request.project_id,
                roi=round(roi, 2),
                roi_ratio=round(roi_ratio, 2),
                npv=round(npv, 2),
                irr=irr,
                payback_period=payback_period,
                profitability_index=round(profitability_index, 2),
                risk_assessment=risk_assessment
            )
            
            self.logger.info(f"ROI calculated: {roi:.2f}%, NPV: ${npv:,.2f}")
            return result
            
        except Exception as e:
            self.logger.error(f"Error calculating ROI: {str(e)}")
            raise
    
    async def compare_projects(
        self,
        request: ProjectComparisonRequest
    ) -> ProjectComparisonResult:
        """比较多个项目"""
        try:
            projects_data = []
            
            for project_id in request.project_ids:
                project = self.projects.get(project_id)
                if not project:
                    continue
                
                # 简化的ROI计算
                roi = ((project.expected_returns - project.initial_investment) / 
                      project.initial_investment * 100)
                
                projects_data.append({
                    "id": project_id,
                    "name": project.name,
                    "roi": round(roi, 2),
                    "npv": round(project.expected_returns - project.initial_investment, 2),
                    "initial_investment": project.initial_investment,
                    "expected_returns": project.expected_returns,
                    "status": project.status
                })
            
            # 排名
            rankings = {
                "roi": sorted([p["id"] for p in projects_data], 
                            key=lambda x: next(p["roi"] for p in projects_data if p["id"] == x),
                            reverse=True),
                "npv": sorted([p["id"] for p in projects_data],
                            key=lambda x: next(p["npv"] for p in projects_data if p["id"] == x),
                            reverse=True)
            }
            
            # 推荐最佳项目
            best_project = rankings["roi"][0] if rankings["roi"] else None
            best_project_name = next((p["name"] for p in projects_data if p["id"] == best_project), "Unknown")
            
            result = ProjectComparisonResult(
                projects=projects_data,
                rankings=rankings,
                best_project=best_project or "",
                recommendation=f"Based on ROI analysis, '{best_project_name}' shows the highest return potential",
                comparison_chart_data={
                    "projects": [p["name"] for p in projects_data],
                    "roi": [p["roi"] for p in projects_data],
                    "npv": [p["npv"] for p in projects_data]
                }
            )
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error comparing projects: {str(e)}")
            raise
    
    async def sensitivity_analysis(
        self,
        request: SensitivityAnalysisRequest
    ) -> SensitivityAnalysisResult:
        """敏感性分析"""
        try:
            project = self.projects.get(request.project_id)
            if not project:
                raise ValueError(f"Project {request.project_id} not found")
            
            # 基准ROI
            base_case_roi = ((project.expected_returns - project.initial_investment) / 
                           project.initial_investment * 100)
            
            # 对每个变量进行敏感性分析
            sensitivity_data = {}
            sensitivities = []
            
            for variable in request.variables:
                variable_data = []
                
                # 测试不同的变化率
                for change in np.linspace(-request.variation_range, request.variation_range, 11):
                    if variable == "initial_investment":
                        adjusted_investment = project.initial_investment * (1 + change)
                        adjusted_roi = ((project.expected_returns - adjusted_investment) / 
                                      adjusted_investment * 100)
                    elif variable == "revenue":
                        adjusted_returns = project.expected_returns * (1 + change)
                        adjusted_roi = ((adjusted_returns - project.initial_investment) / 
                                      project.initial_investment * 100)
                    else:
                        adjusted_roi = base_case_roi * (1 + change * 0.5)  # 简化
                    
                    variable_data.append({
                        "change": round(change * 100, 1),
                        "roi": round(adjusted_roi, 2)
                    })
                
                sensitivity_data[variable] = variable_data
                
                # 计算敏感度系数
                roi_range = max(d["roi"] for d in variable_data) - min(d["roi"] for d in variable_data)
                sensitivity_coefficient = roi_range / (2 * request.variation_range * 100)
                
                sensitivities.append({
                    "variable": variable,
                    "sensitivity_coefficient": round(sensitivity_coefficient, 3),
                    "impact": "high" if sensitivity_coefficient > 1.5 else "medium" if sensitivity_coefficient > 0.8 else "low"
                })
            
            # 排序敏感变量
            most_sensitive = sorted(sensitivities, key=lambda x: x["sensitivity_coefficient"], reverse=True)
            
            # 评估风险等级
            risk_level = "high" if most_sensitive[0]["sensitivity_coefficient"] > 2.0 else \
                        "medium" if most_sensitive[0]["sensitivity_coefficient"] > 1.0 else "low"
            
            result = SensitivityAnalysisResult(
                project_id=request.project_id,
                base_case_roi=round(base_case_roi, 2),
                sensitivity_data=sensitivity_data,
                most_sensitive_variables=most_sensitive,
                risk_level=risk_level,
                recommendations=[
                    f"Focus on managing {most_sensitive[0]['variable']} as it has the highest impact on ROI",
                    "Consider risk mitigation strategies for high-sensitivity variables",
                    "Monitor key variables closely during project execution"
                ]
            )
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error in sensitivity analysis: {str(e)}")
            raise
    
    def _calculate_npv(
        self,
        cash_flows: List[Dict[str, Any]],
        discount_rate: float,
        initial_investment: float
    ) -> float:
        """计算净现值"""
        npv = -initial_investment
        
        for i, cf in enumerate(cash_flows, start=1):
            amount = cf.get("amount", 0)
            discounted_value = amount / ((1 + discount_rate) ** i)
            npv += discounted_value
        
        return npv
    
    def _calculate_irr(
        self,
        cash_flows: List[Dict[str, Any]],
        initial_investment: float
    ) -> Optional[float]:
        """计算内部收益率（简化版）"""
        # 简化的IRR计算
        total_returns = sum(cf.get("amount", 0) for cf in cash_flows)
        years = len(cash_flows)
        
        if years > 0 and initial_investment > 0:
            irr = ((total_returns / initial_investment) ** (1/years) - 1) * 100
            return round(irr, 2)
        
        return None
    
    def _calculate_payback_period(
        self,
        cash_flows: List[Dict[str, Any]],
        initial_investment: float
    ) -> Optional[float]:
        """计算回收期"""
        cumulative = 0
        
        for i, cf in enumerate(cash_flows, start=1):
            cumulative += cf.get("amount", 0)
            if cumulative >= initial_investment:
                # 线性插值
                previous = cumulative - cf.get("amount", 0)
                fraction = (initial_investment - previous) / cf.get("amount", 1)
                return round(i - 1 + fraction, 2)
        
        return None
    
    def _assess_risk(
        self,
        roi: float,
        npv: float,
        payback_period: Optional[float]
    ) -> Dict[str, Any]:
        """评估投资风险"""
        risk_score = 0
        risk_factors = []
        
        # ROI 因素
        if roi < 10:
            risk_score += 3
            risk_factors.append("Low ROI (<10%)")
        elif roi < 20:
            risk_score += 1
            risk_factors.append("Moderate ROI (10-20%)")
        
        # NPV 因素
        if npv < 0:
            risk_score += 3
            risk_factors.append("Negative NPV")
        
        # 回收期因素
        if payback_period and payback_period > 5:
            risk_score += 2
            risk_factors.append("Long payback period (>5 years)")
        
        # 风险等级
        if risk_score >= 5:
            risk_level = "high"
        elif risk_score >= 3:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        return {
            "risk_level": risk_level,
            "risk_score": risk_score,
            "risk_factors": risk_factors,
            "recommendation": self._get_risk_recommendation(risk_level)
        }
    
    def _get_risk_recommendation(self, risk_level: str) -> str:
        """获取风险建议"""
        recommendations = {
            "high": "High risk investment - consider alternative projects or additional risk mitigation",
            "medium": "Moderate risk - proceed with careful monitoring and contingency plans",
            "low": "Low risk investment - good candidate for approval"
        }
        return recommendations.get(risk_level, "Unable to assess risk")


# 全局实例
roi_calculator = ROICalculator()

