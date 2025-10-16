from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.services.llm_service import LLMService
from app.core.multi_tenant import get_company_context
from app.core.logging import app_logger

router = APIRouter(prefix="/nlp", tags=["nlp"])


class GenerateRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = None
    max_tokens: int = 1000
    temperature: float = 0.7
    model: str = "gpt-3.5-turbo"


class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    max_tokens: int = 1000
    temperature: float = 0.7
    model: str = "gpt-3.5-turbo"


class SummarizeRequest(BaseModel):
    text: str
    max_length: int = 200


class TranslateRequest(BaseModel):
    text: str
    target_language: str = "zh-TW"


@router.post("/generate")
async def generate_text(
    request: GenerateRequest,
    context: Dict = Depends(get_company_context)
):
    """Generate text using LLM"""
    try:
        llm_svc = LLMService()
        
        result = await llm_svc.generate_text(
            prompt=request.prompt,
            system_prompt=request.system_prompt,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            model=request.model
        )
        
        app_logger.info(f"Text generated for company {context['company_id']}")
        return result
        
    except Exception as e:
        app_logger.error(f"Text generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat")
async def chat(
    request: ChatRequest,
    context: Dict = Depends(get_company_context)
):
    """Chat with LLM"""
    try:
        llm_svc = LLMService()
        
        result = await llm_svc.chat(
            messages=request.messages,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            model=request.model
        )
        
        app_logger.info(f"Chat completed for company {context['company_id']}")
        return result
        
    except Exception as e:
        app_logger.error(f"Chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize")
async def summarize_text(
    request: SummarizeRequest,
    context: Dict = Depends(get_company_context)
):
    """Summarize text"""
    try:
        llm_svc = LLMService()
        
        prompt = f"Please summarize the following text in no more than {request.max_length} characters:\n\n{request.text}\n\nSummary:"
        
        result = await llm_svc.generate_text(
            prompt=prompt,
            max_tokens=request.max_length * 2,
            temperature=0.3
        )
        
        app_logger.info(f"Text summarized for company {context['company_id']}")
        return {"summary": result["content"]}
        
    except Exception as e:
        app_logger.error(f"Summarization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/translate")
async def translate_text(
    request: TranslateRequest,
    context: Dict = Depends(get_company_context)
):
    """Translate text"""
    try:
        llm_svc = LLMService()
        
        lang_map = {
            'zh-TW': '繁體中文',
            'zh-CN': '簡體中文',
            'en': 'English',
            'ja': '日本語',
            'ko': '한국어'
        }
        
        target_lang = lang_map.get(request.target_language, request.target_language)
        prompt = f"Translate the following text to {target_lang}:\n\n{request.text}\n\nTranslation:"
        
        result = await llm_svc.generate_text(
            prompt=prompt,
            max_tokens=len(request.text) * 2,
            temperature=0.3
        )
        
        app_logger.info(f"Text translated for company {context['company_id']}")
        return {"translation": result["content"]}
        
    except Exception as e:
        app_logger.error(f"Translation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

