from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
from io import BytesIO
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime
from app.services.connection_manager import connection_manager
from app.models.connection import (
    ConnectionType, ConnectionStatus, ConnectionCreateRequest,
    ExcelUploadResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/excel", response_model=ExcelUploadResponse)
async def upload_excel(
    file: UploadFile = File(...),
    connection_name: Optional[str] = None,
    company_id: Optional[str] = None
):
    """Upload Excel/CSV for data import and create connection"""
    try:
        logger.info(f"Received file upload: {file.filename}")
        
        contents = await file.read()
        
        # Parse file based on extension
        if file.filename.endswith('.csv'):
            df = pd.read_csv(BytesIO(contents))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(BytesIO(contents))
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format. Please upload CSV or Excel file."
            )
        
        # Convert to records
        records = df.to_dict('records')
        
        # Get basic statistics
        stats = {
            "rows": len(records),
            "columns": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "null_counts": df.isnull().sum().to_dict()
        }
        
        logger.info(f"Parsed file {file.filename}: {stats['rows']} rows, {len(stats['columns'])} columns")
        
        # Create or update connection
        conn_name = connection_name or f"Excel - {file.filename}"
        connection = await connection_manager.create_connection(
            ConnectionCreateRequest(
                name=conn_name,
                type=ConnectionType.EXCEL,
                config={
                    "filename": file.filename,
                    "uploaded": True,
                    "rows": len(records),
                    "columns": len(df.columns),
                    "upload_time": datetime.now().isoformat()
                }
            ),
            company_id=company_id
        )
        
        # Update connection with actual data
        await connection_manager.update_connection(
            connection.id,
            {
                "record_count": len(records),
                "status": ConnectionStatus.CONNECTED,
                "error_message": None
            }
        )
        
        return ExcelUploadResponse(
            connection_id=connection.id,
            filename=file.filename,
            stats=stats,
            preview=records[:5],
            total_rows=len(records),
            status=ConnectionStatus.CONNECTED,
            message=f"成功上传 {len(records)} 筆記錄"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process file upload: {e}")
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")


@router.post("/csv")
async def upload_csv(file: UploadFile = File(...)):
    """Upload CSV specifically"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be CSV format")
    
    return await upload_excel(file)


@router.get("/health")
async def upload_health():
    """Health check for upload connector"""
    return {"status": "ok", "connector": "upload"}

