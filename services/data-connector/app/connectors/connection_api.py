"""
连接管理 API
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional, List
from app.services.connection_manager import connection_manager
from app.models.connection import (
    DataConnection, ConnectionCreateRequest,
    ConnectionTestRequest, ConnectionTestResponse
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/connections", tags=["connections"])


@router.get("/", response_model=List[DataConnection])
async def list_connections(
    company_id: Optional[str] = Header(None, alias="X-Company-ID")
):
    """获取所有数据连接"""
    try:
        connections = await connection_manager.list_connections(company_id)
        return connections
    except Exception as e:
        logger.error(f"Failed to list connections: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{connection_id}", response_model=DataConnection)
async def get_connection(connection_id: str):
    """获取单个连接详情"""
    connection = await connection_manager.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    return connection


@router.post("/", response_model=DataConnection)
async def create_connection(
    request: ConnectionCreateRequest,
    company_id: Optional[str] = Header(None, alias="X-Company-ID")
):
    """创建新连接"""
    try:
        connection = await connection_manager.create_connection(request, company_id)
        return connection
    except Exception as e:
        logger.error(f"Failed to create connection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test", response_model=ConnectionTestResponse)
async def test_connection(request: ConnectionTestRequest):
    """测试连接"""
    try:
        result = await connection_manager.test_connection(request)
        return result
    except Exception as e:
        logger.error(f"Failed to test connection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{connection_id}/sync", response_model=DataConnection)
async def sync_connection(connection_id: str):
    """同步连接数据"""
    connection = await connection_manager.sync_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    return connection


@router.put("/{connection_id}", response_model=DataConnection)
async def update_connection(connection_id: str, updates: dict):
    """更新连接配置"""
    connection = await connection_manager.update_connection(connection_id, updates)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    return connection


@router.delete("/{connection_id}")
async def delete_connection(connection_id: str):
    """删除连接"""
    success = await connection_manager.delete_connection(connection_id)
    if not success:
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"status": "ok", "message": "Connection deleted"}


@router.get("/health/check")
async def connection_health():
    """连接健康检查"""
    connections = await connection_manager.list_connections()
    connected = sum(1 for c in connections if c.status == "connected")
    
    return {
        "status": "ok",
        "total_connections": len(connections),
        "connected": connected,
        "disconnected": len(connections) - connected
    }

