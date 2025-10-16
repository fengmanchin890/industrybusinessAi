from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.connectors import router as connectors_router
import logging
import os

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s:%(funcName)s:%(lineno)d | %(message)s'
)

logger = logging.getLogger(__name__)

# Create logs directory
os.makedirs("logs", exist_ok=True)

app = FastAPI(
    title="Data Connector Hub",
    version="0.1.0",
    description="Data integration hub for IoT/POS/ERP systems",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "data-connector",
        "version": "0.1.0"
    }


# Include connector routes
app.include_router(connectors_router, prefix="/api/v1/connectors")


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting Data Connector Hub v0.1.0")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Data Connector Hub")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )

