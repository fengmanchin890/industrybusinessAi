from fastapi import APIRouter
from .embeddings import router as embeddings_router
from .vision import router as vision_router
from .nlp import router as nlp_router
from .modules import router as modules_router
from .tenant import router as tenant_router
from .model_selector import router as model_selector_router

router = APIRouter()

router.include_router(embeddings_router)
router.include_router(vision_router)
router.include_router(nlp_router)
router.include_router(modules_router)
router.include_router(tenant_router)
router.include_router(model_selector_router)

