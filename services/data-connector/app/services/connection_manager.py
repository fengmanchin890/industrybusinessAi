"""
连接管理服务
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime
import asyncio
from app.models.connection import (
    DataConnection, ConnectionType, ConnectionStatus,
    ConnectionCreateRequest, ConnectionTestRequest, ConnectionTestResponse
)

logger = logging.getLogger(__name__)


class ConnectionManager:
    """连接管理器"""
    
    def __init__(self):
        self.connections: Dict[str, DataConnection] = {}
        self._load_default_connections()
    
    def _load_default_connections(self):
        """加载默认连接"""
        default_connections = [
            DataConnection(
                id="conn_plc_1",
                name="PLC 生產線 A",
                type=ConnectionType.PLC,
                status=ConnectionStatus.CONNECTED,
                last_sync=datetime.now(),
                record_count=15420
            ),
            DataConnection(
                id="conn_mes_1",
                name="MES 系統",
                type=ConnectionType.MES,
                status=ConnectionStatus.CONNECTED,
                last_sync=datetime.now(),
                record_count=8930
            ),
            DataConnection(
                id="conn_excel_1",
                name="Excel 報表",
                type=ConnectionType.EXCEL,
                status=ConnectionStatus.ERROR,
                last_sync=datetime.now(),
                record_count=0,
                error_message="找不到指定的 Excel 文件"
            )
        ]
        
        for conn in default_connections:
            self.connections[conn.id] = conn
    
    async def list_connections(self, company_id: Optional[str] = None) -> List[DataConnection]:
        """列出所有连接"""
        if company_id:
            return [conn for conn in self.connections.values() if conn.company_id == company_id]
        return list(self.connections.values())
    
    async def get_connection(self, connection_id: str) -> Optional[DataConnection]:
        """获取单个连接"""
        return self.connections.get(connection_id)
    
    async def create_connection(
        self,
        request: ConnectionCreateRequest,
        company_id: Optional[str] = None
    ) -> DataConnection:
        """创建新连接"""
        connection_id = f"conn_{request.type.value.lower()}_{len(self.connections) + 1}"
        
        connection = DataConnection(
            id=connection_id,
            name=request.name,
            type=request.type,
            status=ConnectionStatus.TESTING,
            last_sync=datetime.now(),
            record_count=0,
            config=request.config,
            company_id=company_id
        )
        
        # 测试连接
        test_result = await self.test_connection(
            ConnectionTestRequest(type=request.type, config=request.config)
        )
        
        if test_result.success:
            connection.status = ConnectionStatus.CONNECTED
        else:
            connection.status = ConnectionStatus.ERROR
            connection.error_message = test_result.message
        
        self.connections[connection_id] = connection
        logger.info(f"Created connection: {connection_id} - {connection.name}")
        
        return connection
    
    async def update_connection(
        self,
        connection_id: str,
        updates: Dict
    ) -> Optional[DataConnection]:
        """更新连接"""
        connection = self.connections.get(connection_id)
        if not connection:
            return None
        
        for key, value in updates.items():
            if hasattr(connection, key):
                setattr(connection, key, value)
        
        connection.last_sync = datetime.now()
        logger.info(f"Updated connection: {connection_id}")
        
        return connection
    
    async def delete_connection(self, connection_id: str) -> bool:
        """删除连接"""
        if connection_id in self.connections:
            del self.connections[connection_id]
            logger.info(f"Deleted connection: {connection_id}")
            return True
        return False
    
    async def test_connection(self, request: ConnectionTestRequest) -> ConnectionTestResponse:
        """测试连接"""
        try:
            # 模拟测试延迟
            await asyncio.sleep(0.5)
            
            # 根据类型执行不同的测试逻辑
            if request.type == ConnectionType.EXCEL:
                if request.config.get("file_path") or request.config.get("uploaded"):
                    return ConnectionTestResponse(
                        success=True,
                        message="Excel 文件可访问",
                        details={"rows_detected": request.config.get("rows", 0)}
                    )
                else:
                    return ConnectionTestResponse(
                        success=False,
                        message="未提供 Excel 文件",
                        details=None
                    )
            
            elif request.type == ConnectionType.DATABASE:
                # 数据库连接测试逻辑
                host = request.config.get("host")
                port = request.config.get("port")
                if host and port:
                    return ConnectionTestResponse(
                        success=True,
                        message=f"成功连接到数据库 {host}:{port}"
                    )
            
            elif request.type == ConnectionType.PLC:
                # PLC 连接测试逻辑
                ip = request.config.get("ip")
                if ip:
                    return ConnectionTestResponse(
                        success=True,
                        message=f"成功连接到 PLC {ip}"
                    )
            
            # 默认成功
            return ConnectionTestResponse(
                success=True,
                message="连接测试成功"
            )
            
        except Exception as e:
            logger.error(f"Connection test failed: {e}")
            return ConnectionTestResponse(
                success=False,
                message=f"连接测试失败: {str(e)}"
            )
    
    async def sync_connection(self, connection_id: str) -> Optional[DataConnection]:
        """同步连接数据"""
        connection = self.connections.get(connection_id)
        if not connection:
            return None
        
        try:
            # 模拟数据同步
            await asyncio.sleep(1)
            
            # 更新同步时间和记录数
            connection.last_sync = datetime.now()
            connection.status = ConnectionStatus.CONNECTED
            connection.error_message = None
            
            # 模拟增加记录数
            if connection.type == ConnectionType.EXCEL and connection.status == ConnectionStatus.ERROR:
                # Excel 修复后的数据
                connection.record_count = 1000
            else:
                connection.record_count += 100
            
            logger.info(f"Synced connection: {connection_id}, records: {connection.record_count}")
            
            return connection
            
        except Exception as e:
            logger.error(f"Connection sync failed: {e}")
            connection.status = ConnectionStatus.ERROR
            connection.error_message = str(e)
            return connection


# 全局单例
connection_manager = ConnectionManager()

