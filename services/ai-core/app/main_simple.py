"""
Simplified AI Core Service - Compatible with FastAPI 0.104.1 and Python 3.13
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
import os

# Create logs directory
os.makedirs("logs", exist_ok=True)

# Create FastAPI app
app = FastAPI(
    title="AI Core Service",
    version="0.1.0",
    description="AI Orchestration Hub for Business Platform"
)

# Add CORS middleware - using simpler syntax
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "ai-core",
        "version": "0.1.0"
    }

# Simple test endpoint
@app.get("/test")
async def test():
    """Test endpoint"""
    return {"message": "AI Core is working!", "python": "3.13", "fastapi": "0.104.1"}

# Startup message
@app.on_event("startup")
async def startup():
    print("=" * 60)
    print("AI Core Service Started Successfully!")
    print(f"Health Check: http://localhost:8000/health")
    print(f"Test Endpoint: http://localhost:8000/test")
    print(f"API Docs: http://localhost:8000/docs")
    print("=" * 60)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main_simple:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

