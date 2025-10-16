from fastapi import APIRouter
from .pos_connector import router as pos_router
from .excel_uploader import router as upload_router

router = APIRouter()

router.include_router(pos_router)
router.include_router(upload_router)

