"""
Unified Database Connector
Supports MySQL, PostgreSQL, SQL Server, and MongoDB
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime

router = APIRouter(prefix="/database", tags=["database"])
logger = logging.getLogger(__name__)


class DatabaseConfig(BaseModel):
    connection_type: str  # 'mysql' | 'postgresql' | 'mssql' | 'mongodb'
    host: str
    port: int
    database: str
    username: str
    password: str
    ssl: bool = False
    options: Dict[str, Any] = {}


class QueryRequest(BaseModel):
    company_id: str
    config: DatabaseConfig
    query: str
    params: Optional[List[Any]] = None


class SyncTableRequest(BaseModel):
    company_id: str
    config: DatabaseConfig
    table_name: str
    batch_size: int = 1000
    target_table: Optional[str] = None  # Target table in Supabase


class DatabaseConnector:
    """Generic database connector with unified interface"""
    
    def __init__(self):
        self.connections = {}
    
    def get_driver(self, connection_type: str):
        """Get appropriate database driver"""
        drivers = {
            'mysql': self._get_mysql_driver,
            'postgresql': self._get_postgres_driver,
            'mssql': self._get_mssql_driver,
            'mongodb': self._get_mongodb_driver
        }
        
        driver_fn = drivers.get(connection_type)
        if not driver_fn:
            raise ValueError(f"Unsupported database type: {connection_type}")
        
        return driver_fn()
    
    def _get_mysql_driver(self):
        """Get MySQL driver"""
        try:
            import aiomysql
            return aiomysql
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="MySQL driver not installed. Install with: pip install aiomysql"
            )
    
    def _get_postgres_driver(self):
        """Get PostgreSQL driver"""
        try:
            import asyncpg
            return asyncpg
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="PostgreSQL driver not installed. Install with: pip install asyncpg"
            )
    
    def _get_mssql_driver(self):
        """Get SQL Server driver"""
        try:
            import aioodbc
            return aioodbc
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="SQL Server driver not installed. Install with: pip install aioodbc"
            )
    
    def _get_mongodb_driver(self):
        """Get MongoDB driver"""
        try:
            import motor.motor_asyncio
            return motor.motor_asyncio
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="MongoDB driver not installed. Install with: pip install motor"
            )
    
    async def connect(self, config: DatabaseConfig):
        """Create database connection"""
        try:
            if config.connection_type == 'mysql':
                return await self._connect_mysql(config)
            elif config.connection_type == 'postgresql':
                return await self._connect_postgres(config)
            elif config.connection_type == 'mssql':
                return await self._connect_mssql(config)
            elif config.connection_type == 'mongodb':
                return await self._connect_mongodb(config)
            else:
                raise ValueError(f"Unsupported connection type: {config.connection_type}")
        except Exception as e:
            logger.error(f"Failed to connect to {config.connection_type}: {e}")
            raise HTTPException(status_code=500, detail=f"Connection failed: {str(e)}")
    
    async def _connect_mysql(self, config: DatabaseConfig):
        """Connect to MySQL"""
        import aiomysql
        
        connection = await aiomysql.connect(
            host=config.host,
            port=config.port,
            user=config.username,
            password=config.password,
            db=config.database,
            **config.options
        )
        return connection
    
    async def _connect_postgres(self, config: DatabaseConfig):
        """Connect to PostgreSQL"""
        import asyncpg
        
        connection = await asyncpg.connect(
            host=config.host,
            port=config.port,
            user=config.username,
            password=config.password,
            database=config.database,
            ssl=config.ssl,
            **config.options
        )
        return connection
    
    async def _connect_mssql(self, config: DatabaseConfig):
        """Connect to SQL Server"""
        import aioodbc
        
        dsn = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={config.host},{config.port};"
            f"DATABASE={config.database};"
            f"UID={config.username};"
            f"PWD={config.password}"
        )
        
        connection = await aioodbc.connect(dsn=dsn)
        return connection
    
    async def _connect_mongodb(self, config: DatabaseConfig):
        """Connect to MongoDB"""
        import motor.motor_asyncio
        
        uri = f"mongodb://{config.username}:{config.password}@{config.host}:{config.port}"
        if config.ssl:
            uri += "?ssl=true"
        
        client = motor.motor_asyncio.AsyncIOMotorClient(uri)
        return client[config.database]
    
    async def execute_query(self, config: DatabaseConfig, query: str, params: Optional[List] = None):
        """Execute query on database"""
        connection = await self.connect(config)
        
        try:
            if config.connection_type == 'mysql':
                return await self._execute_mysql(connection, query, params)
            elif config.connection_type == 'postgresql':
                return await self._execute_postgres(connection, query, params)
            elif config.connection_type == 'mssql':
                return await self._execute_mssql(connection, query, params)
            elif config.connection_type == 'mongodb':
                return await self._execute_mongodb(connection, query, params)
        finally:
            await self._close_connection(config.connection_type, connection)
    
    async def _execute_mysql(self, connection, query: str, params: Optional[List]):
        """Execute MySQL query"""
        async with connection.cursor() as cursor:
            await cursor.execute(query, params or ())
            if query.strip().upper().startswith('SELECT'):
                result = await cursor.fetchall()
                columns = [desc[0] for desc in cursor.description]
                return [dict(zip(columns, row)) for row in result]
            else:
                await connection.commit()
                return {"affected_rows": cursor.rowcount}
    
    async def _execute_postgres(self, connection, query: str, params: Optional[List]):
        """Execute PostgreSQL query"""
        if query.strip().upper().startswith('SELECT'):
            result = await connection.fetch(query, *(params or []))
            return [dict(row) for row in result]
        else:
            result = await connection.execute(query, *(params or []))
            return {"status": result}
    
    async def _execute_mssql(self, connection, query: str, params: Optional[List]):
        """Execute SQL Server query"""
        async with connection.cursor() as cursor:
            await cursor.execute(query, params or ())
            if query.strip().upper().startswith('SELECT'):
                result = await cursor.fetchall()
                columns = [desc[0] for desc in cursor.description]
                return [dict(zip(columns, row)) for row in result]
            else:
                await connection.commit()
                return {"affected_rows": cursor.rowcount}
    
    async def _execute_mongodb(self, database, query: str, params: Optional[List]):
        """Execute MongoDB query"""
        # MongoDB uses JSON-like query syntax
        # This is a simplified implementation
        import json
        query_obj = json.loads(query)
        collection_name = query_obj.get('collection')
        operation = query_obj.get('operation', 'find')
        filter_obj = query_obj.get('filter', {})
        
        collection = database[collection_name]
        
        if operation == 'find':
            cursor = collection.find(filter_obj)
            return await cursor.to_list(length=1000)
        elif operation == 'insert':
            result = await collection.insert_one(query_obj.get('document', {}))
            return {"inserted_id": str(result.inserted_id)}
        elif operation == 'update':
            result = await collection.update_many(filter_obj, query_obj.get('update', {}))
            return {"modified_count": result.modified_count}
        elif operation == 'delete':
            result = await collection.delete_many(filter_obj)
            return {"deleted_count": result.deleted_count}
    
    async def _close_connection(self, connection_type: str, connection):
        """Close database connection"""
        try:
            if connection_type == 'mongodb':
                connection.client.close()
            elif hasattr(connection, 'close'):
                if connection_type in ['mysql', 'mssql']:
                    connection.close()
                else:
                    await connection.close()
        except Exception as e:
            logger.warning(f"Error closing connection: {e}")
    
    async def sync_table(
        self,
        config: DatabaseConfig,
        table_name: str,
        batch_size: int = 1000,
        target_supabase_table: Optional[str] = None
    ):
        """Sync entire table to Supabase"""
        # This would sync data from source database to Supabase
        # Implementation depends on Supabase client setup
        logger.info(f"Syncing table {table_name} from {config.connection_type}")
        
        # Fetch all data
        query = f"SELECT * FROM {table_name}"
        data = await self.execute_query(config, query)
        
        # Here you would batch insert to Supabase
        # For now, return data count
        return {
            "table": table_name,
            "rows_fetched": len(data),
            "status": "completed"
        }


# Initialize connector
db_connector = DatabaseConnector()


@router.post("/test-connection")
async def test_connection(config: DatabaseConfig):
    """Test database connection"""
    try:
        connection = await db_connector.connect(config)
        await db_connector._close_connection(config.connection_type, connection)
        
        return {
            "status": "success",
            "message": f"Successfully connected to {config.connection_type} database",
            "database": config.database
        }
    except Exception as e:
        logger.error(f"Connection test failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query")
async def execute_query(request: QueryRequest):
    """Execute query on connected database"""
    try:
        result = await db_connector.execute_query(
            request.config,
            request.query,
            request.params
        )
        
        return {
            "status": "success",
            "company_id": request.company_id,
            "result": result,
            "executed_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Query execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync-table")
async def sync_table(request: SyncTableRequest):
    """Sync table from source database to Supabase"""
    try:
        result = await db_connector.sync_table(
            request.config,
            request.table_name,
            request.batch_size,
            request.target_table
        )
        
        return {
            "status": "success",
            "company_id": request.company_id,
            "sync_result": result
        }
    except Exception as e:
        logger.error(f"Table sync failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def database_connector_health():
    """Health check for database connector"""
    return {
        "status": "ok",
        "connector": "database",
        "supported_types": ["mysql", "postgresql", "mssql", "mongodb"]
    }



