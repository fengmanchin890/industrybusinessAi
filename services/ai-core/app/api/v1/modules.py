from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import json
import os
from pathlib import Path
from app.core.multi_tenant import get_optional_company_context
from app.core.logging import app_logger

router = APIRouter(prefix="/modules", tags=["modules"])


class ModuleMetadata(BaseModel):
    id: str
    name: str
    version: str
    category: str
    industry: List[str]
    backend: Dict[str, Any]
    frontend: Dict[str, Any]
    capabilities: Dict[str, bool]


def load_module_registry() -> Dict:
    """Load module registry from JSON file"""
    registry_path = Path(__file__).parent.parent.parent / "registry" / "modules.json"
    
    # Create default registry if it doesn't exist
    if not registry_path.exists():
        registry_path.parent.mkdir(parents=True, exist_ok=True)
        default_registry = {
            "version": "1.0.0",
            "modules": [
                {
                    "id": "quality-inspection",
                    "name": "AI Quality Inspection",
                    "version": "1.0.0",
                    "category": "manufacturing",
                    "industry": ["manufacturing"],
                    "backend": {
                        "endpoints": [
                            {
                                "method": "POST",
                                "path": "/api/v1/vision/inspect",
                                "description": "Detect defects in manufacturing images"
                            }
                        ]
                    },
                    "frontend": {
                        "component": "QualityInspection",
                        "props": {}
                    },
                    "capabilities": {
                        "canGenerateReports": True,
                        "canSendAlerts": True,
                        "requiresDataConnection": False
                    }
                },
                {
                    "id": "voice-ordering",
                    "name": "AI Voice Ordering",
                    "version": "1.0.0",
                    "category": "f&b",
                    "industry": ["f&b"],
                    "backend": {
                        "endpoints": [
                            {
                                "method": "POST",
                                "path": "/api/v1/speech/transcribe",
                                "description": "Transcribe voice orders"
                            }
                        ]
                    },
                    "frontend": {
                        "component": "VoiceOrdering",
                        "props": {}
                    },
                    "capabilities": {
                        "canGenerateReports": True,
                        "canSendAlerts": False,
                        "requiresDataConnection": True
                    }
                }
            ]
        }
        
        with open(registry_path, 'w', encoding='utf-8') as f:
            json.dump(default_registry, f, indent=2, ensure_ascii=False)
        
        return default_registry
    
    with open(registry_path, 'r', encoding='utf-8') as f:
        return json.load(f)


@router.get("/registry")
async def get_module_registry(context: Dict = Depends(get_optional_company_context)):
    """Get all available modules"""
    try:
        registry = load_module_registry()
        app_logger.info("Module registry loaded")
        return registry
    except Exception as e:
        app_logger.error(f"Failed to load module registry: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/by-industry/{industry_id}")
async def get_modules_by_industry(
    industry_id: str,
    context: Dict = Depends(get_optional_company_context)
):
    """Get modules for specific industry"""
    try:
        registry = load_module_registry()
        filtered = [
            module for module in registry["modules"]
            if industry_id in module.get("industry", [])
        ]
        app_logger.info(f"Found {len(filtered)} modules for industry {industry_id}")
        return {"modules": filtered}
    except Exception as e:
        app_logger.error(f"Failed to filter modules: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{module_id}")
async def get_module(
    module_id: str,
    context: Dict = Depends(get_optional_company_context)
):
    """Get specific module details"""
    try:
        registry = load_module_registry()
        module = next(
            (m for m in registry["modules"] if m["id"] == module_id),
            None
        )
        
        if not module:
            raise HTTPException(status_code=404, detail=f"Module {module_id} not found")
        
        return module
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Failed to get module: {e}")
        raise HTTPException(status_code=500, detail=str(e))

