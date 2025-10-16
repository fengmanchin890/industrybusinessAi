from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from app.core.config import settings
from app.core.logging import app_logger


class LLMService:
    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        self.anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None
    
    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        model: str = "gpt-3.5-turbo"
    ) -> Dict[str, Any]:
        """Generate text using LLM"""
        if not self.openai_client and not self.anthropic_client:
            app_logger.warning("No LLM client configured, returning mock response")
            return {
                "content": "Mock AI response - please configure API keys",
                "model": model,
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            }
        
        try:
            if self.openai_client and (model.startswith("gpt") or not self.anthropic_client):
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})
                
                response = await self.openai_client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature
                )
                
                return {
                    "content": response.choices[0].message.content,
                    "model": response.model,
                    "usage": {
                        "prompt_tokens": response.usage.prompt_tokens,
                        "completion_tokens": response.usage.completion_tokens,
                        "total_tokens": response.usage.total_tokens
                    }
                }
            
            elif self.anthropic_client:
                response = await self.anthropic_client.messages.create(
                    model=model if model.startswith("claude") else "claude-3-haiku-20240307",
                    max_tokens=max_tokens,
                    temperature=temperature,
                    system=system_prompt or "",
                    messages=[{"role": "user", "content": prompt}]
                )
                
                return {
                    "content": response.content[0].text,
                    "model": response.model,
                    "usage": {
                        "prompt_tokens": response.usage.input_tokens,
                        "completion_tokens": response.usage.output_tokens,
                        "total_tokens": response.usage.input_tokens + response.usage.output_tokens
                    }
                }
        except Exception as e:
            app_logger.error(f"Text generation failed: {e}")
            raise
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 1000,
        temperature: float = 0.7,
        model: str = "gpt-3.5-turbo"
    ) -> Dict[str, Any]:
        """Chat with LLM"""
        if not self.openai_client:
            app_logger.warning("No LLM client configured, returning mock response")
            return {
                "content": "Mock AI chat response - please configure API keys",
                "model": model,
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            }
        
        try:
            response = await self.openai_client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            return {
                "content": response.choices[0].message.content,
                "model": response.model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
        except Exception as e:
            app_logger.error(f"Chat failed: {e}")
            raise

