from fastapi import APIRouter
from .pos_connector import router as pos_router
from .excel_uploader import router as upload_router
from .database_connector import router as database_router
from .cloud_storage_connector import router as storage_router
from .taiwan_apis import router as taiwan_router
from .connection_api import router as connection_router

router = APIRouter()

router.include_router(pos_router)
router.include_router(upload_router)
router.include_router(database_router)
router.include_router(storage_router)
router.include_router(taiwan_router)
router.include_router(connection_router)

