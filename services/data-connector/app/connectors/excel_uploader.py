from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
from io import BytesIO
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/excel")
async def upload_excel(file: UploadFile = File(...)):
    """Upload Excel/CSV for data import"""
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
        
        return {
            "filename": file.filename,
            "stats": stats,
            "preview": records[:5],  # First 5 rows as preview
            "total_rows": len(records)
        }
        
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

