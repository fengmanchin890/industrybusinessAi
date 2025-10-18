"""
异常检测 API
Anomaly Detection API
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.models.anomaly import (
    AnomalyDetectionRequest, AnomalyDetectionResult,
    AnomalyRuleCreateRequest, AnomalyRule,
    FinancialAnomaly, AnomalyStatus
)
from app.services.anomaly_detector import anomaly_detector

router = APIRouter()


@router.post("/detect", response_model=AnomalyDetectionResult)
async def detect_anomalies(request: AnomalyDetectionRequest):
    """检测财务异常"""
    try:
        result = await anomaly_detector.detect_anomalies(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts", response_model=List[FinancialAnomaly])
async def get_alerts(
    company_id: Optional[str] = None,
    severity: Optional[str] = None
):
    """获取异常告警列表"""
    anomalies = list(anomaly_detector.anomalies.values())
    
    if company_id:
        anomalies = [a for a in anomalies if a.company_id == company_id]
    if severity:
        anomalies = [a for a in anomalies if a.severity.value == severity]
    
    return sorted(anomalies, key=lambda x: x.detected_at, reverse=True)


@router.post("/rules", response_model=AnomalyRule)
async def create_rule(request: AnomalyRuleCreateRequest):
    """创建检测规则"""
    try:
        rule = await anomaly_detector.create_rule(
            request=request,
            company_id="default"  # 实际应从认证中获取
        )
        return rule
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rules", response_model=List[AnomalyRule])
async def list_rules(company_id: Optional[str] = None):
    """列出检测规则"""
    rules = await anomaly_detector.list_rules(company_id)
    return rules


@router.get("/{anomaly_id}", response_model=FinancialAnomaly)
async def get_anomaly(anomaly_id: str):
    """获取异常详情"""
    anomaly = await anomaly_detector.get_anomaly(anomaly_id)
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    return anomaly


@router.put("/{anomaly_id}/status")
async def update_anomaly_status(anomaly_id: str, status: AnomalyStatus):
    """更新异常状态"""
    anomaly = await anomaly_detector.update_anomaly_status(anomaly_id, status)
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    return {"message": "Status updated", "anomaly": anomaly}


@router.get("/health/check")
async def anomaly_health():
    """健康检查"""
    return {
        "status": "ok",
        "service": "anomaly-detection",
        "total_anomalies": len(anomaly_detector.anomalies),
        "total_rules": len(anomaly_detector.rules)
    }

