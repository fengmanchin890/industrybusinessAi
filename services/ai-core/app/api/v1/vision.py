from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.services.vision_service import VisionService
from app.core.multi_tenant import get_company_context
from app.core.logging import app_logger
import base64

router = APIRouter(prefix="/vision", tags=["vision"])


class InspectionRequest(BaseModel):
    image_base64: str
    camera_id: str
    metadata: Dict[str, Any] = {}


class InspectionResponse(BaseModel):
    defects: List[Dict[str, Any]]
    quality_score: float
    processed_at: str


class ImageAnalysisRequest(BaseModel):
    image_base64: str
    prompt: str


@router.post("/inspect", response_model=InspectionResponse)
async def quality_inspection(
    request: InspectionRequest,
    context: Dict = Depends(get_company_context)
):
    """AI Quality Inspection for Manufacturing"""
    try:
        vision_svc = VisionService()
        
        result = await vision_svc.detect_defects(
            image_data=request.image_base64,
            company_id=context["company_id"],
            metadata=request.metadata
        )
        
        app_logger.info(f"Quality inspection completed for company {context['company_id']}")
        return result
        
    except Exception as e:
        app_logger.error(f"Quality inspection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    context: Dict = Depends(get_company_context)
):
    """Upload image for processing"""
    try:
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode('utf-8')
        
        app_logger.info(f"Image uploaded: {file.filename} ({len(contents)} bytes)")
        return {
            "filename": file.filename,
            "size": len(contents),
            "base64": base64_image[:100] + "...",  # Preview
            "content_type": file.content_type
        }
    except Exception as e:
        app_logger.error(f"Image upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze")
async def analyze_image(
    request: ImageAnalysisRequest,
    context: Dict = Depends(get_company_context)
):
    """General image analysis with custom prompt"""
    try:
        vision_svc = VisionService()
        
        result = await vision_svc.analyze_image(
            image_data=request.image_base64,
            prompt=request.prompt,
            company_id=context["company_id"]
        )
        
        app_logger.info(f"Image analysis completed for company {context['company_id']}")
        return {"analysis": result}
        
    except Exception as e:
        app_logger.error(f"Image analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

