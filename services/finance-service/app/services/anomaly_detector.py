"""
异常检测服务
Anomaly Detection Service
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, date, timedelta
import uuid
import numpy as np
from app.models.anomaly import (
    FinancialAnomaly, AnomalyType, AnomalySeverity, AnomalyStatus,
    AnomalyDetectionRequest, AnomalyDetectionResult,
    AnomalyRule, AnomalyRuleCreateRequest
)
from app.core.logging import app_logger


class AnomalyDetector:
    """异常检测器"""
    
    def __init__(self):
        self.logger = app_logger
        self.anomalies: Dict[str, FinancialAnomaly] = {}
        self.rules: Dict[str, AnomalyRule] = {}
        self._initialize_default_rules()
    
    def _initialize_default_rules(self):
        """初始化默认检测规则"""
        default_rules = [
            {
                "name": "Revenue Drop Alert",
                "metric_name": "revenue",
                "condition": "value < threshold * 0.8",
                "threshold": 100000,
                "severity": AnomalySeverity.HIGH
            },
            {
                "name": "Cost Spike Alert",
                "metric_name": "cost",
                "condition": "value > threshold * 1.5",
                "threshold": 50000,
                "severity": AnomalySeverity.MEDIUM
            },
            {
                "name": "Budget Overrun",
                "metric_name": "budget",
                "condition": "value > threshold",
                "threshold": 1000000,
                "severity": AnomalySeverity.CRITICAL
            }
        ]
        
        for rule_data in default_rules:
            rule_id = str(uuid.uuid4())
            rule = AnomalyRule(
                id=rule_id,
                company_id="default",
                name=rule_data["name"],
                metric_name=rule_data["metric_name"],
                condition=rule_data["condition"],
                threshold=rule_data["threshold"],
                severity=rule_data["severity"],
                is_active=True,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            self.rules[rule_id] = rule
    
    async def detect_anomalies(
        self,
        request: AnomalyDetectionRequest
    ) -> AnomalyDetectionResult:
        """检测财务异常"""
        try:
            # 模拟生成一些异常数据
            detected_anomalies = await self._run_detection(
                request.start_date,
                request.end_date,
                request.metrics,
                request.sensitivity
            )
            
            # 按严重程度和类型分组
            by_severity = {}
            by_type = {}
            
            for anomaly in detected_anomalies:
                by_severity[anomaly.severity.value] = by_severity.get(anomaly.severity.value, 0) + 1
                by_type[anomaly.type.value] = by_type.get(anomaly.type.value, 0) + 1
            
            # 生成洞察
            insights = self._generate_insights(detected_anomalies)
            
            # 生成建议
            recommendations = self._generate_recommendations(detected_anomalies)
            
            result = AnomalyDetectionResult(
                period_start=request.start_date,
                period_end=request.end_date,
                total_anomalies=len(detected_anomalies),
                anomalies_by_severity=by_severity,
                anomalies_by_type=by_type,
                anomalies=detected_anomalies,
                insights=insights,
                recommendations=recommendations
            )
            
            self.logger.info(f"Detected {len(detected_anomalies)} anomalies")
            return result
            
        except Exception as e:
            self.logger.error(f"Error detecting anomalies: {str(e)}")
            raise
    
    async def _run_detection(
        self,
        start_date: date,
        end_date: date,
        metrics: Optional[List[str]],
        sensitivity: float
    ) -> List[FinancialAnomaly]:
        """运行异常检测算法"""
        anomalies = []
        
        # 模拟检测到的异常
        anomaly_templates = [
            {
                "type": AnomalyType.REVENUE_DROP,
                "severity": AnomalySeverity.HIGH,
                "metric_name": "daily_revenue",
                "expected_value": 50000,
                "actual_value": 35000,
                "description": "Significant revenue drop detected",
                "potential_causes": [
                    "Decreased customer demand",
                    "Market competition",
                    "Seasonal factors"
                ],
                "recommended_actions": [
                    "Review sales pipeline",
                    "Analyze market trends",
                    "Contact key customers"
                ]
            },
            {
                "type": AnomalyType.COST_SPIKE,
                "severity": AnomalySeverity.MEDIUM,
                "metric_name": "operating_costs",
                "expected_value": 30000,
                "actual_value": 48000,
                "description": "Unusual spike in operating costs",
                "potential_causes": [
                    "Unexpected maintenance expenses",
                    "Supply chain disruptions",
                    "Overtime labor costs"
                ],
                "recommended_actions": [
                    "Review expense reports",
                    "Investigate supplier invoices",
                    "Analyze resource utilization"
                ]
            },
            {
                "type": AnomalyType.UNUSUAL_TRANSACTION,
                "severity": AnomalySeverity.CRITICAL,
                "metric_name": "transaction_amount",
                "expected_value": 10000,
                "actual_value": 95000,
                "description": "Unusually large transaction detected",
                "potential_causes": [
                    "Data entry error",
                    "Unauthorized transaction",
                    "Special one-time purchase"
                ],
                "recommended_actions": [
                    "Verify transaction details",
                    "Contact finance team",
                    "Review approval workflow"
                ]
            }
        ]
        
        # 根据日期范围生成异常
        days_diff = (end_date - start_date).days
        num_anomalies = min(3, max(1, days_diff // 30))  # 平均每月1个异常
        
        for i in range(num_anomalies):
            template = anomaly_templates[i % len(anomaly_templates)]
            anomaly_date = start_date + timedelta(days=i * (days_diff // num_anomalies))
            
            deviation = ((template["actual_value"] - template["expected_value"]) / 
                        template["expected_value"] * 100)
            
            anomaly = FinancialAnomaly(
                id=str(uuid.uuid4()),
                company_id="default",
                detected_at=datetime.now(),
                date=anomaly_date,
                type=template["type"],
                severity=template["severity"],
                status=AnomalyStatus.DETECTED,
                metric_name=template["metric_name"],
                expected_value=template["expected_value"],
                actual_value=template["actual_value"],
                deviation_percentage=abs(deviation),
                confidence_score=sensitivity,
                description=template["description"],
                potential_causes=template["potential_causes"],
                recommended_actions=template["recommended_actions"],
                metadata={}
            )
            
            anomalies.append(anomaly)
            self.anomalies[anomaly.id] = anomaly
        
        return anomalies
    
    def _generate_insights(self, anomalies: List[FinancialAnomaly]) -> List[str]:
        """生成异常洞察"""
        insights = []
        
        if not anomalies:
            return ["No anomalies detected in the specified period"]
        
        # 严重性分析
        critical_count = sum(1 for a in anomalies if a.severity == AnomalySeverity.CRITICAL)
        if critical_count > 0:
            insights.append(f"{critical_count} critical anomalies require immediate attention")
        
        # 类型分析
        type_counts = {}
        for anomaly in anomalies:
            type_counts[anomaly.type] = type_counts.get(anomaly.type, 0) + 1
        
        if type_counts:
            most_common = max(type_counts, key=type_counts.get)
            insights.append(f"Most common anomaly type: {most_common.value}")
        
        # 趋势
        if len(anomalies) > 2:
            recent_anomalies = sorted(anomalies, key=lambda x: x.date, reverse=True)[:2]
            if all(a.severity in [AnomalySeverity.HIGH, AnomalySeverity.CRITICAL] 
                  for a in recent_anomalies):
                insights.append("Recent trend shows increasing severity of anomalies")
        
        return insights
    
    def _generate_recommendations(self, anomalies: List[FinancialAnomaly]) -> List[str]:
        """生成建议"""
        recommendations = [
            "Implement automated monitoring for early anomaly detection",
            "Review and update anomaly detection thresholds regularly",
            "Establish clear escalation procedures for critical anomalies"
        ]
        
        # 基于异常类型添加特定建议
        types_present = set(a.type for a in anomalies)
        
        if AnomalyType.REVENUE_DROP in types_present:
            recommendations.append("Focus on revenue recovery strategies and customer retention")
        
        if AnomalyType.COST_SPIKE in types_present:
            recommendations.append("Conduct thorough cost analysis and implement cost control measures")
        
        if AnomalyType.UNUSUAL_TRANSACTION in types_present:
            recommendations.append("Strengthen transaction approval and verification processes")
        
        return recommendations
    
    async def create_rule(
        self,
        request: AnomalyRuleCreateRequest,
        company_id: str
    ) -> AnomalyRule:
        """创建检测规则"""
        rule_id = str(uuid.uuid4())
        
        rule = AnomalyRule(
            id=rule_id,
            company_id=company_id,
            name=request.name,
            description=request.description,
            metric_name=request.metric_name,
            condition=request.condition,
            threshold=request.threshold,
            severity=request.severity,
            is_active=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        self.rules[rule_id] = rule
        self.logger.info(f"Created anomaly detection rule: {request.name}")
        
        return rule
    
    async def list_rules(
        self,
        company_id: Optional[str] = None
    ) -> List[AnomalyRule]:
        """列出检测规则"""
        rules = list(self.rules.values())
        
        if company_id:
            rules = [r for r in rules if r.company_id == company_id]
        
        return rules
    
    async def get_anomaly(self, anomaly_id: str) -> Optional[FinancialAnomaly]:
        """获取异常详情"""
        return self.anomalies.get(anomaly_id)
    
    async def update_anomaly_status(
        self,
        anomaly_id: str,
        status: AnomalyStatus
    ) -> Optional[FinancialAnomaly]:
        """更新异常状态"""
        anomaly = self.anomalies.get(anomaly_id)
        if anomaly:
            anomaly.status = status
            self.logger.info(f"Updated anomaly {anomaly_id} status to {status.value}")
        return anomaly


# 全局实例
anomaly_detector = AnomalyDetector()

