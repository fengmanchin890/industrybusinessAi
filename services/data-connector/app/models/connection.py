"""
数据连接模型
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class ConnectionType(str, Enum):
    """连接类型"""
    PLC = "PLC"
    MES = "MES"
    ERP = "ERP"
    EXCEL = "Excel"
    DATABASE = "Database"
    API = "API"


class ConnectionStatus(str, Enum):
    """连接状态"""
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    TESTING = "testing"


class DataConnection(BaseModel):
    """数据连接"""
    id: str
    name: str
    type: ConnectionType
    status: ConnectionStatus
    last_sync: datetime
    record_count: int = 0
    config: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    company_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "conn_123",
                "name": "PLC 生產線 A",
                "type": "PLC",
                "status": "connected",
                "last_sync": "2025-01-16T14:30:25",
                "record_count": 15420
            }
        }


class ExcelUploadResponse(BaseModel):
    """Excel 上传响应"""
    connection_id: str
    filename: str
    stats: Dict[str, Any]
    preview: List[Dict[str, Any]]
    total_rows: int
    status: ConnectionStatus = ConnectionStatus.CONNECTED
    message: str = "上传成功"


class ConnectionCreateRequest(BaseModel):
    """创建连接请求"""
    name: str
    type: ConnectionType
    config: Dict[str, Any] = Field(default_factory=dict)


class ConnectionTestRequest(BaseModel):
    """测试连接请求"""
    type: ConnectionType
    config: Dict[str, Any]


class ConnectionTestResponse(BaseModel):
    """测试连接响应"""
    success: bool
    message: str
    details: Optional[Dict[str, Any]] = None

