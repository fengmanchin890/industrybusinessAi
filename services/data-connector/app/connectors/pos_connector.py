from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import httpx
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/pos", tags=["pos"])


class POSWebhook(BaseModel):
    company_id: str
    transaction_data: Dict[str, Any]
    timestamp: Optional[str] = None


class POSTransaction(BaseModel):
    order_id: str
    items: list
    total: float
    payment_method: str
    timestamp: str


@router.post("/webhook")
async def handle_pos_webhook(webhook: POSWebhook):
    """Receive POS transaction data via webhook"""
    try:
        logger.info(f"Received POS webhook for company {webhook.company_id}")
        
        # Add timestamp if not provided
        if not webhook.timestamp:
            webhook.timestamp = datetime.utcnow().isoformat()
        
        # Validate and transform data
        transformed = transform_pos_data(webhook.transaction_data)
        
        # Send to AI Core for processing (optional - can be enabled later)
        # async with httpx.AsyncClient() as client:
        #     await client.post(
        #         "http://ai-core:8000/api/v1/analytics/process",
        #         json={
        #             "company_id": webhook.company_id,
        #             "data_type": "pos_transaction",
        #             "data": transformed,
        #             "timestamp": webhook.timestamp
        #         },
        #         timeout=10.0
        #     )
        
        logger.info(f"POS transaction processed: {transformed.get('order_id')}")
        
        return {
            "status": "received",
            "company_id": webhook.company_id,
            "transaction_id": transformed.get("order_id"),
            "timestamp": webhook.timestamp
        }
        
    except Exception as e:
        logger.error(f"Failed to process POS webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def transform_pos_data(raw_data: Dict) -> Dict:
    """Transform POS data to standard format"""
    return {
        "order_id": raw_data.get("id", raw_data.get("order_id", "unknown")),
        "items": raw_data.get("items", []),
        "total": float(raw_data.get("total", raw_data.get("amount", 0))),
        "payment_method": raw_data.get("payment_method", raw_data.get("payment", "cash")),
        "customer_id": raw_data.get("customer_id"),
        "timestamp": raw_data.get("timestamp", datetime.utcnow().isoformat()),
        "metadata": {
            "location": raw_data.get("location"),
            "cashier": raw_data.get("cashier"),
            "notes": raw_data.get("notes")
        }
    }


@router.get("/health")
async def pos_health():
    """Health check for POS connector"""
    return {"status": "ok", "connector": "pos"}

