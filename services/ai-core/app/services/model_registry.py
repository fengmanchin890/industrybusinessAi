"""
Model Registry and Selector
Manages pre-trained models and intelligently selects the best model
based on task type, company budget, and priority
"""

from typing import Dict, List, Optional, Literal
from pydantic import BaseModel
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ModelInfo(BaseModel):
    name: str
    provider: Literal['openai', 'anthropic', 'local']
    category: str  # 'text_generation', 'chat', 'vision', 'embeddings'
    cost_per_1k_input_tokens: float
    cost_per_1k_output_tokens: float
    avg_latency_ms: int
    accuracy_score: float  # 0-1 score
    max_tokens: int
    context_window: int
    supports_streaming: bool = True
    supports_function_calling: bool = False
    description: str = ""


class ModelMetrics(BaseModel):
    model_name: str
    total_requests: int
    total_tokens: int
    total_cost: float
    avg_latency_ms: float
    error_rate: float
    last_used: datetime


class ModelRegistry:
    """Central registry for all AI models"""
    
    def __init__(self):
        self.models: Dict[str, ModelInfo] = self._initialize_models()
        self.metrics: Dict[str, ModelMetrics] = {}
    
    def _initialize_models(self) -> Dict[str, ModelInfo]:
        """Initialize model registry with known models"""
        models = {
            # OpenAI Models
            "gpt-4-turbo": ModelInfo(
                name="gpt-4-turbo",
                provider="openai",
                category="chat",
                cost_per_1k_input_tokens=0.01,
                cost_per_1k_output_tokens=0.03,
                avg_latency_ms=2000,
                accuracy_score=0.95,
                max_tokens=4096,
                context_window=128000,
                supports_function_calling=True,
                description="Most capable GPT-4 model, best for complex tasks"
            ),
            "gpt-4": ModelInfo(
                name="gpt-4",
                provider="openai",
                category="chat",
                cost_per_1k_input_tokens=0.03,
                cost_per_1k_output_tokens=0.06,
                avg_latency_ms=2500,
                accuracy_score=0.95,
                max_tokens=8192,
                context_window=8192,
                supports_function_calling=True,
                description="Original GPT-4, highest quality"
            ),
            "gpt-3.5-turbo": ModelInfo(
                name="gpt-3.5-turbo",
                provider="openai",
                category="chat",
                cost_per_1k_input_tokens=0.0005,
                cost_per_1k_output_tokens=0.0015,
                avg_latency_ms=800,
                accuracy_score=0.85,
                max_tokens=4096,
                context_window=16385,
                supports_function_calling=True,
                description="Fast and economical, good for most tasks"
            ),
            "gpt-3.5-turbo-16k": ModelInfo(
                name="gpt-3.5-turbo-16k",
                provider="openai",
                category="chat",
                cost_per_1k_input_tokens=0.001,
                cost_per_1k_output_tokens=0.002,
                avg_latency_ms=1000,
                accuracy_score=0.85,
                max_tokens=16384,
                context_window=16385,
                description="Extended context window for longer documents"
            ),
            "gpt-4-vision-preview": ModelInfo(
                name="gpt-4-vision-preview",
                provider="openai",
                category="vision",
                cost_per_1k_input_tokens=0.01,
                cost_per_1k_output_tokens=0.03,
                avg_latency_ms=3000,
                accuracy_score=0.92,
                max_tokens=4096,
                context_window=128000,
                description="Vision model for image analysis"
            ),
            "text-embedding-ada-002": ModelInfo(
                name="text-embedding-ada-002",
                provider="openai",
                category="embeddings",
                cost_per_1k_input_tokens=0.0001,
                cost_per_1k_output_tokens=0.0,
                avg_latency_ms=200,
                accuracy_score=0.90,
                max_tokens=8191,
                context_window=8191,
                description="Embeddings for semantic search"
            ),
            
            # Anthropic Models
            "claude-3-opus-20240229": ModelInfo(
                name="claude-3-opus-20240229",
                provider="anthropic",
                category="chat",
                cost_per_1k_input_tokens=0.015,
                cost_per_1k_output_tokens=0.075,
                avg_latency_ms=1800,
                accuracy_score=0.93,
                max_tokens=4096,
                context_window=200000,
                description="Most capable Claude model"
            ),
            "claude-3-sonnet-20240229": ModelInfo(
                name="claude-3-sonnet-20240229",
                provider="anthropic",
                category="chat",
                cost_per_1k_input_tokens=0.003,
                cost_per_1k_output_tokens=0.015,
                avg_latency_ms=1200,
                accuracy_score=0.90,
                max_tokens=4096,
                context_window=200000,
                description="Balanced performance and cost"
            ),
            "claude-3-haiku-20240307": ModelInfo(
                name="claude-3-haiku-20240307",
                provider="anthropic",
                category="chat",
                cost_per_1k_input_tokens=0.00025,
                cost_per_1k_output_tokens=0.00125,
                avg_latency_ms=600,
                accuracy_score=0.83,
                max_tokens=4096,
                context_window=200000,
                description="Fastest and most economical Claude"
            ),
            "claude-instant-1.2": ModelInfo(
                name="claude-instant-1.2",
                provider="anthropic",
                category="chat",
                cost_per_1k_input_tokens=0.0008,
                cost_per_1k_output_tokens=0.0024,
                avg_latency_ms=800,
                accuracy_score=0.83,
                max_tokens=4096,
                context_window=100000,
                description="Fast responses at low cost"
            )
        }
        
        return models
    
    def get_model(self, model_name: str) -> Optional[ModelInfo]:
        """Get model info by name"""
        return self.models.get(model_name)
    
    def list_models(
        self,
        category: Optional[str] = None,
        provider: Optional[str] = None
    ) -> List[ModelInfo]:
        """List all models with optional filtering"""
        models = list(self.models.values())
        
        if category:
            models = [m for m in models if m.category == category]
        
        if provider:
            models = [m for m in models if m.provider == provider]
        
        return models
    
    def select_best_model(
        self,
        task_type: str,
        priority: Literal['speed', 'accuracy', 'cost', 'balanced'] = 'balanced',
        max_budget_per_1k: Optional[float] = None,
        subscription_tier: str = 'free'
    ) -> ModelInfo:
        """Select the best model based on criteria"""
        
        # Map task type to category
        category_map = {
            'text_generation': 'chat',
            'chat': 'chat',
            'vision': 'vision',
            'embeddings': 'embeddings',
            'analysis': 'chat',
            'summarize': 'chat',
            'translate': 'chat'
        }
        
        category = category_map.get(task_type, 'chat')
        
        # Get models in category
        available_models = self.list_models(category=category)
        
        # Filter by budget if specified
        if max_budget_per_1k:
            available_models = [
                m for m in available_models
                if (m.cost_per_1k_input_tokens + m.cost_per_1k_output_tokens) <= max_budget_per_1k
            ]
        
        # Filter by subscription tier
        available_models = self._filter_by_subscription(available_models, subscription_tier)
        
        if not available_models:
            # Fallback to cheapest model
            logger.warning(f"No models available for criteria, using fallback")
            return self.models["gpt-3.5-turbo"]
        
        # Select based on priority
        if priority == 'speed':
            return min(available_models, key=lambda m: m.avg_latency_ms)
        
        elif priority == 'accuracy':
            return max(available_models, key=lambda m: m.accuracy_score)
        
        elif priority == 'cost':
            return min(
                available_models,
                key=lambda m: m.cost_per_1k_input_tokens + m.cost_per_1k_output_tokens
            )
        
        else:  # balanced
            # Calculate balanced score
            def score(model: ModelInfo):
                # Normalize values (0-1)
                cost = (model.cost_per_1k_input_tokens + model.cost_per_1k_output_tokens)
                norm_cost = 1 - min(cost / 0.1, 1)  # Normalize to 0-0.1 range
                norm_latency = 1 - min(model.avg_latency_ms / 3000, 1)
                norm_accuracy = model.accuracy_score
                
                # Weighted score: 40% accuracy, 30% cost, 30% speed
                return (norm_accuracy * 0.4) + (norm_cost * 0.3) + (norm_latency * 0.3)
            
            return max(available_models, key=score)
    
    def _filter_by_subscription(
        self,
        models: List[ModelInfo],
        tier: str
    ) -> List[ModelInfo]:
        """Filter models based on subscription tier"""
        if tier == 'free':
            # Free tier: only fastest/cheapest models
            return [
                m for m in models
                if m.name in [
                    'gpt-3.5-turbo',
                    'claude-3-haiku-20240307',
                    'claude-instant-1.2',
                    'text-embedding-ada-002'
                ]
            ]
        elif tier == 'pro':
            # Pro tier: all models except most expensive
            return [
                m for m in models
                if m.name not in ['gpt-4', 'claude-3-opus-20240229']
            ]
        else:  # enterprise
            # Enterprise: all models
            return models
    
    def update_metrics(
        self,
        model_name: str,
        tokens: int,
        cost: float,
        latency_ms: int,
        success: bool
    ):
        """Update model usage metrics"""
        if model_name not in self.metrics:
            self.metrics[model_name] = ModelMetrics(
                model_name=model_name,
                total_requests=0,
                total_tokens=0,
                total_cost=0,
                avg_latency_ms=0,
                error_rate=0,
                last_used=datetime.utcnow()
            )
        
        metrics = self.metrics[model_name]
        metrics.total_requests += 1
        metrics.total_tokens += tokens
        metrics.total_cost += cost
        
        # Update average latency
        metrics.avg_latency_ms = (
            (metrics.avg_latency_ms * (metrics.total_requests - 1) + latency_ms) /
            metrics.total_requests
        )
        
        # Update error rate
        if not success:
            metrics.error_rate = (
                (metrics.error_rate * (metrics.total_requests - 1) + 1) /
                metrics.total_requests
            )
        
        metrics.last_used = datetime.utcnow()
    
    def get_metrics(self, model_name: Optional[str] = None) -> Dict[str, ModelMetrics]:
        """Get usage metrics for models"""
        if model_name:
            return {model_name: self.metrics.get(model_name)}
        return self.metrics
    
    def recommend_model_for_company(
        self,
        company_settings: Dict,
        task_type: str
    ) -> ModelInfo:
        """Recommend model based on company settings and history"""
        
        # Get company preferences
        preferred_model = company_settings.get('preferred_ai_model')
        if preferred_model and preferred_model in self.models:
            return self.models[preferred_model]
        
        # Get subscription tier
        tier = company_settings.get('subscription_tier', 'free')
        
        # Get priority from settings
        priority = company_settings.get('model_priority', 'balanced')
        
        # Get budget
        max_budget = company_settings.get('max_cost_per_1k_tokens')
        
        return self.select_best_model(
            task_type=task_type,
            priority=priority,
            max_budget_per_1k=max_budget,
            subscription_tier=tier
        )


# Global registry instance
model_registry = ModelRegistry()



