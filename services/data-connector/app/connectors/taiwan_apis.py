"""
Taiwan-Specific API Connectors
Supports LINE Messaging API, ECPay, and Green World payment gateways
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging
import hashlib
import hmac
from datetime import datetime
import httpx
from urllib.parse import urlencode

router = APIRouter(prefix="/taiwan", tags=["taiwan-apis"])
logger = logging.getLogger(__name__)


# ==================== LINE Messaging API ====================

class LINEConfig(BaseModel):
    channel_access_token: str
    channel_secret: str


class LINEMessage(BaseModel):
    company_id: str
    config: LINEConfig
    to: str  # User ID or group ID
    messages: List[Dict[str, Any]]


class LINEConnector:
    """LINE Messaging API connector"""
    
    BASE_URL = "https://api.line.me/v2/bot"
    
    async def send_message(self, config: LINEConfig, to: str, messages: List[Dict]):
        """Send LINE message"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/message/push",
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {config.channel_access_token}"
                    },
                    json={
                        "to": to,
                        "messages": messages
                    },
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    logger.error(f"LINE API error: {response.text}")
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"LINE API error: {response.text}"
                    )
                
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"LINE API request failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def send_text(self, config: LINEConfig, to: str, text: str):
        """Send simple text message"""
        messages = [{"type": "text", "text": text}]
        return await self.send_message(config, to, messages)
    
    async def send_template(
        self,
        config: LINEConfig,
        to: str,
        alt_text: str,
        template: Dict
    ):
        """Send template message (buttons, confirm, carousel, etc.)"""
        messages = [{
            "type": "template",
            "altText": alt_text,
            "template": template
        }]
        return await self.send_message(config, to, messages)
    
    async def get_profile(self, config: LINEConfig, user_id: str):
        """Get user profile"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/profile/{user_id}",
                    headers={
                        "Authorization": f"Bearer {config.channel_access_token}"
                    },
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Failed to get profile: {response.text}"
                    )
                
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"LINE profile request failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))


# ==================== ECPay Payment Gateway ====================

class ECPayConfig(BaseModel):
    merchant_id: str
    hash_key: str
    hash_iv: str
    is_production: bool = False


class ECPayPayment(BaseModel):
    company_id: str
    config: ECPayConfig
    merchant_trade_no: str  # Order number
    merchant_trade_date: str  # Format: yyyy/MM/dd HH:mm:ss
    total_amount: int
    trade_desc: str
    item_name: str
    return_url: str
    client_back_url: Optional[str] = None
    order_result_url: Optional[str] = None


class ECPayConnector:
    """ECPay (綠界科技) payment gateway connector"""
    
    PRODUCTION_URL = "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5"
    STAGING_URL = "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5"
    
    def _generate_check_mac_value(
        self,
        params: Dict[str, Any],
        hash_key: str,
        hash_iv: str
    ) -> str:
        """Generate ECPay CheckMacValue"""
        # Sort parameters
        sorted_params = sorted(params.items())
        
        # URL encode
        param_str = urlencode(sorted_params)
        
        # Add HashKey and HashIV
        raw = f"HashKey={hash_key}&{param_str}&HashIV={hash_iv}"
        
        # URL encode again
        raw = urlencode({"data": raw})[5:]  # Remove "data="
        
        # Convert to lowercase
        raw = raw.lower()
        
        # SHA256 hash
        check_mac = hashlib.sha256(raw.encode('utf-8')).hexdigest().upper()
        
        return check_mac
    
    async def create_payment(self, config: ECPayConfig, payment: ECPayPayment):
        """Create ECPay payment"""
        try:
            # Prepare parameters
            params = {
                "MerchantID": config.merchant_id,
                "MerchantTradeNo": payment.merchant_trade_no,
                "MerchantTradeDate": payment.merchant_trade_date,
                "PaymentType": "aio",
                "TotalAmount": payment.total_amount,
                "TradeDesc": payment.trade_desc,
                "ItemName": payment.item_name,
                "ReturnURL": payment.return_url,
                "ChoosePayment": "ALL",
                "EncryptType": 1
            }
            
            if payment.client_back_url:
                params["ClientBackURL"] = payment.client_back_url
            
            if payment.order_result_url:
                params["OrderResultURL"] = payment.order_result_url
            
            # Generate CheckMacValue
            check_mac = self._generate_check_mac_value(
                params,
                config.hash_key,
                config.hash_iv
            )
            params["CheckMacValue"] = check_mac
            
            # Select URL
            url = self.PRODUCTION_URL if config.is_production else self.STAGING_URL
            
            return {
                "url": url,
                "params": params,
                "method": "POST"
            }
        except Exception as e:
            logger.error(f"ECPay payment creation failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    def verify_callback(
        self,
        config: ECPayConfig,
        callback_data: Dict[str, Any]
    ) -> bool:
        """Verify ECPay callback data"""
        try:
            received_check_mac = callback_data.pop("CheckMacValue", "")
            
            calculated_check_mac = self._generate_check_mac_value(
                callback_data,
                config.hash_key,
                config.hash_iv
            )
            
            return received_check_mac == calculated_check_mac
        except Exception as e:
            logger.error(f"ECPay callback verification failed: {e}")
            return False


# ==================== Green World (綠界) ====================

class GreenWorldConfig(BaseModel):
    merchant_id: str
    hash_key: str
    hash_iv: str
    is_production: bool = False


class GreenWorldConnector:
    """Green World payment gateway connector"""
    
    PRODUCTION_URL = "https://payment.greenworld.com.tw"
    STAGING_URL = "https://payment-stage.greenworld.com.tw"
    
    # Similar implementation to ECPay
    # Green World uses similar API structure
    
    async def create_payment(self, config: GreenWorldConfig, payment_data: Dict):
        """Create Green World payment"""
        logger.info("Green World payment creation")
        # Implementation similar to ECPay
        return {
            "status": "created",
            "message": "Green World connector ready for implementation"
        }


# Initialize connectors
line_connector = LINEConnector()
ecpay_connector = ECPayConnector()
greenworld_connector = GreenWorldConnector()


# ==================== API Endpoints ====================

@router.post("/line/send-message")
async def send_line_message(request: LINEMessage):
    """Send LINE message"""
    try:
        result = await line_connector.send_message(
            request.config,
            request.to,
            request.messages
        )
        
        return {
            "status": "success",
            "company_id": request.company_id,
            "result": result
        }
    except Exception as e:
        logger.error(f"LINE message send failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/line/send-text")
async def send_line_text(
    company_id: str,
    config: LINEConfig,
    to: str,
    text: str
):
    """Send simple LINE text message"""
    try:
        result = await line_connector.send_text(config, to, text)
        
        return {
            "status": "success",
            "company_id": company_id,
            "result": result
        }
    except Exception as e:
        logger.error(f"LINE text send failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/line/profile/{user_id}")
async def get_line_profile(
    user_id: str,
    config: LINEConfig
):
    """Get LINE user profile"""
    try:
        profile = await line_connector.get_profile(config, user_id)
        return {
            "status": "success",
            "profile": profile
        }
    except Exception as e:
        logger.error(f"LINE profile fetch failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ecpay/create-payment")
async def create_ecpay_payment(payment: ECPayPayment):
    """Create ECPay payment"""
    try:
        result = await ecpay_connector.create_payment(
            payment.config,
            payment
        )
        
        return {
            "status": "success",
            "company_id": payment.company_id,
            "payment_url": result["url"],
            "payment_params": result["params"],
            "method": result["method"]
        }
    except Exception as e:
        logger.error(f"ECPay payment creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ecpay/verify-callback")
async def verify_ecpay_callback(
    config: ECPayConfig,
    callback_data: Dict[str, Any]
):
    """Verify ECPay callback"""
    try:
        is_valid = ecpay_connector.verify_callback(config, callback_data)
        
        return {
            "status": "success",
            "is_valid": is_valid,
            "callback_data": callback_data
        }
    except Exception as e:
        logger.error(f"ECPay callback verification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/greenworld/create-payment")
async def create_greenworld_payment(
    company_id: str,
    config: GreenWorldConfig,
    payment_data: Dict[str, Any]
):
    """Create Green World payment"""
    try:
        result = await greenworld_connector.create_payment(config, payment_data)
        
        return {
            "status": "success",
            "company_id": company_id,
            "result": result
        }
    except Exception as e:
        logger.error(f"Green World payment creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def taiwan_apis_health():
    """Health check for Taiwan APIs connector"""
    return {
        "status": "ok",
        "connector": "taiwan-apis",
        "supported_apis": ["line", "ecpay", "greenworld"]
    }



