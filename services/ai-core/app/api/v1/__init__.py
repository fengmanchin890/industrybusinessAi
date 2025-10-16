from fastapi import APIRouter
from .embeddings import router as embeddings_router
from .vision import router as vision_router
from .nlp import router as nlp_router
from .modules import router as modules_router

router = APIRouter()

router.include_router(embeddings_router)
router.include_router(vision_router)
router.include_router(nlp_router)
router.include_router(modules_router)

