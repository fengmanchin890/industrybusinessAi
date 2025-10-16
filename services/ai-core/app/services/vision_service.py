from typing import Dict, Any, List, Optional
import base64
from datetime import datetime
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.logging import app_logger


class VisionService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
    
    async def detect_defects(
        self,
        image_data: str,
        company_id: str,
        metadata: Dict[str, Any] = {}
    ) -> Dict[str, Any]:
        """Detect defects in manufacturing images"""
        
        if not self.client:
            app_logger.warning("OpenAI client not configured, returning mock response")
            return {
                "defects": [
                    {"type": "scratch", "bbox": [100, 150, 200, 250], "score": 0.92, "severity": "medium"},
                    {"type": "dent", "bbox": [300, 400, 350, 450], "score": 0.87, "severity": "low"}
                ],
                "quality_score": 0.88,
                "processed_at": datetime.utcnow().isoformat()
            }
        
        try:
            # Use GPT-4 Vision for defect detection
            response = await self.client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Analyze this manufacturing product image for defects. Identify any scratches, dents, discoloration, or other quality issues. Provide a JSON response with defect type, approximate location, and severity."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500
            )
            
            # Parse response (in real implementation, would parse structured JSON)
            content = response.choices[0].message.content
            
            # For MVP, return structured mock data
            # In production, parse the LLM response or use a specialized vision model
            return {
                "defects": [
                    {"type": "analysis_complete", "description": content, "score": 0.90}
                ],
                "quality_score": 0.90,
                "processed_at": datetime.utcnow().isoformat(),
                "metadata": metadata
            }
            
        except Exception as e:
            app_logger.error(f"Vision analysis failed: {e}")
            raise
    
    async def analyze_image(
        self,
        image_data: str,
        prompt: str,
        company_id: str
    ) -> str:
        """General image analysis"""
        if not self.client:
            return "Mock image analysis result - OpenAI client not configured"
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}
                            }
                        ]
                    }
                ],
                max_tokens=300
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            app_logger.error(f"Image analysis failed: {e}")
            raise

