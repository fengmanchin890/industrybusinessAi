"""
AutoML Service
Automated model evaluation and hyperparameter optimization
"""

from typing import Dict, List, Any, Optional
from pydantic import BaseModel
import logging
from datetime import datetime
import asyncio
import json

logger = logging.getLogger(__name__)


class ModelEvaluation(BaseModel):
    model_name: str
    task_type: str
    accuracy: float
    latency_ms: int
    cost_per_request: float
    sample_size: int
    evaluated_at: datetime


class HyperparameterConfig(BaseModel):
    temperature: float = 0.7
    top_p: float = 1.0
    frequency_penalty: float = 0.0
    presence_penalty: float = 0.0
    max_tokens: int = 1000


class AutoMLService:
    """Automated ML model evaluation and optimization"""
    
    def __init__(self):
        self.evaluations: Dict[str, List[ModelEvaluation]] = {}
    
    async def evaluate_models(
        self,
        task_type: str,
        sample_data: List[Dict[str, Any]],
        model_list: Optional[List[str]] = None,
        metric: str = 'accuracy'
    ) -> List[ModelEvaluation]:
        """
        Evaluate multiple models on sample data
        
        Args:
            task_type: Type of task (text_generation, chat, etc.)
            sample_data: List of sample inputs/outputs for evaluation
            model_list: Optional list of models to evaluate
            metric: Evaluation metric (accuracy, latency, cost)
        
        Returns:
            List of model evaluations sorted by metric
        """
        logger.info(f"Starting model evaluation for task: {task_type}")
        
        # Default models to test
        if not model_list:
            if task_type == 'chat':
                model_list = [
                    'gpt-3.5-turbo',
                    'gpt-4-turbo',
                    'claude-3-haiku-20240307',
                    'claude-3-sonnet-20240229'
                ]
            elif task_type == 'vision':
                model_list = ['gpt-4-vision-preview']
            else:
                model_list = ['gpt-3.5-turbo']
        
        evaluations = []
        
        # Evaluate each model
        for model_name in model_list:
            try:
                eval_result = await self._evaluate_single_model(
                    model_name,
                    task_type,
                    sample_data
                )
                evaluations.append(eval_result)
            except Exception as e:
                logger.error(f"Failed to evaluate {model_name}: {e}")
                continue
        
        # Sort by metric
        if metric == 'accuracy':
            evaluations.sort(key=lambda x: x.accuracy, reverse=True)
        elif metric == 'latency':
            evaluations.sort(key=lambda x: x.latency_ms)
        elif metric == 'cost':
            evaluations.sort(key=lambda x: x.cost_per_request)
        
        # Store evaluations
        key = f"{task_type}_{datetime.utcnow().date()}"
        self.evaluations[key] = evaluations
        
        return evaluations
    
    async def _evaluate_single_model(
        self,
        model_name: str,
        task_type: str,
        sample_data: List[Dict]
    ) -> ModelEvaluation:
        """Evaluate a single model"""
        logger.info(f"Evaluating model: {model_name}")
        
        total_latency = 0
        total_cost = 0
        correct = 0
        
        # Simulate evaluation (in production, call actual AI service)
        # For now, use mock data
        
        for sample in sample_data:
            # Mock API call
            await asyncio.sleep(0.01)  # Simulate API latency
            
            # Mock results based on model characteristics
            if 'gpt-4' in model_name:
                latency = 2000
                cost = 0.03
                accuracy = 0.95
            elif 'gpt-3.5' in model_name:
                latency = 800
                cost = 0.002
                accuracy = 0.85
            elif 'claude-3-opus' in model_name:
                latency = 1800
                cost = 0.075
                accuracy = 0.93
            elif 'claude-3-sonnet' in model_name:
                latency = 1200
                cost = 0.015
                accuracy = 0.90
            elif 'claude-3-haiku' in model_name or 'claude-instant' in model_name:
                latency = 600
                cost = 0.001
                accuracy = 0.83
            else:
                latency = 1000
                cost = 0.01
                accuracy = 0.80
            
            total_latency += latency
            total_cost += cost
            
            # Simulate correctness check
            import random
            if random.random() < accuracy:
                correct += 1
        
        avg_latency = total_latency // len(sample_data)
        avg_cost = total_cost / len(sample_data)
        accuracy_score = correct / len(sample_data)
        
        return ModelEvaluation(
            model_name=model_name,
            task_type=task_type,
            accuracy=accuracy_score,
            latency_ms=avg_latency,
            cost_per_request=avg_cost,
            sample_size=len(sample_data),
            evaluated_at=datetime.utcnow()
        )
    
    async def optimize_hyperparameters(
        self,
        model_name: str,
        task_type: str,
        sample_data: List[Dict],
        n_trials: int = 20
    ) -> Dict[str, Any]:
        """
        Optimize hyperparameters using Bayesian optimization
        
        Args:
            model_name: Model to optimize
            task_type: Task type
            sample_data: Sample data for evaluation
            n_trials: Number of optimization trials
        
        Returns:
            Best hyperparameters and performance metrics
        """
        logger.info(f"Optimizing hyperparameters for {model_name}")
        
        best_score = 0
        best_params = {
            'temperature': 0.7,
            'top_p': 1.0,
            'max_tokens': 1000
        }
        
        # Simple grid search (in production, use Optuna or similar)
        temperatures = [0.3, 0.5, 0.7, 0.9]
        top_ps = [0.8, 0.9, 1.0]
        max_tokens_list = [500, 1000, 2000]
        
        trials = []
        
        for temp in temperatures:
            for top_p in top_ps:
                for max_tokens in max_tokens_list:
                    if len(trials) >= n_trials:
                        break
                    
                    params = {
                        'temperature': temp,
                        'top_p': top_p,
                        'max_tokens': max_tokens
                    }
                    
                    # Evaluate with these parameters
                    score = await self._evaluate_with_params(
                        model_name,
                        params,
                        sample_data
                    )
                    
                    trials.append({
                        'params': params,
                        'score': score
                    })
                    
                    if score > best_score:
                        best_score = score
                        best_params = params
        
        return {
            'best_params': best_params,
            'best_score': best_score,
            'trials': trials,
            'model_name': model_name
        }
    
    async def _evaluate_with_params(
        self,
        model_name: str,
        params: Dict,
        sample_data: List[Dict]
    ) -> float:
        """Evaluate model with specific hyperparameters"""
        # Simulate evaluation
        await asyncio.sleep(0.01)
        
        # Mock score based on parameters
        # In production, this would call the actual AI service
        base_score = 0.85
        
        # Temperature closer to 0.7 is usually better
        temp_penalty = abs(params['temperature'] - 0.7) * 0.1
        
        return base_score - temp_penalty
    
    async def run_ab_test(
        self,
        model_a: str,
        model_b: str,
        task_type: str,
        sample_data: List[Dict],
        metric: str = 'accuracy'
    ) -> Dict[str, Any]:
        """
        Run A/B test between two models
        
        Args:
            model_a: First model
            model_b: Second model
            task_type: Task type
            sample_data: Test data
            metric: Comparison metric
        
        Returns:
            Test results and winner
        """
        logger.info(f"Running A/B test: {model_a} vs {model_b}")
        
        # Evaluate both models
        eval_a = await self._evaluate_single_model(model_a, task_type, sample_data)
        eval_b = await self._evaluate_single_model(model_b, task_type, sample_data)
        
        # Determine winner based on metric
        if metric == 'accuracy':
            winner = model_a if eval_a.accuracy > eval_b.accuracy else model_b
            improvement = abs(eval_a.accuracy - eval_b.accuracy)
        elif metric == 'latency':
            winner = model_a if eval_a.latency_ms < eval_b.latency_ms else model_b
            improvement = abs(eval_a.latency_ms - eval_b.latency_ms) / max(eval_a.latency_ms, eval_b.latency_ms)
        elif metric == 'cost':
            winner = model_a if eval_a.cost_per_request < eval_b.cost_per_request else model_b
            improvement = abs(eval_a.cost_per_request - eval_b.cost_per_request) / max(eval_a.cost_per_request, eval_b.cost_per_request)
        else:
            winner = model_a
            improvement = 0
        
        return {
            'model_a': model_a,
            'model_b': model_b,
            'eval_a': eval_a.dict(),
            'eval_b': eval_b.dict(),
            'winner': winner,
            'improvement': improvement,
            'metric': metric,
            'recommendation': f"Use {winner} for {improvement:.1%} better {metric}"
        }
    
    async def suggest_model_upgrade(
        self,
        current_model: str,
        task_type: str,
        company_budget: float,
        sample_data: List[Dict]
    ) -> Dict[str, Any]:
        """
        Suggest model upgrade based on budget and performance
        
        Args:
            current_model: Currently used model
            task_type: Task type
            company_budget: Monthly budget for AI
            sample_data: Sample data for evaluation
        
        Returns:
            Upgrade recommendation
        """
        logger.info(f"Suggesting upgrade from {current_model}")
        
        # Get all models in category
        from app.services.model_registry import model_registry
        
        available_models = model_registry.list_models(category='chat')
        
        # Filter by budget
        affordable_models = [
            m for m in available_models
            if (m.cost_per_1k_input_tokens + m.cost_per_1k_output_tokens) * 100 <= company_budget
        ]
        
        # Evaluate current model
        current_eval = await self._evaluate_single_model(
            current_model,
            task_type,
            sample_data
        )
        
        # Find best upgrade
        best_upgrade = None
        best_improvement = 0
        
        for model in affordable_models:
            if model.name == current_model:
                continue
            
            eval_result = await self._evaluate_single_model(
                model.name,
                task_type,
                sample_data
            )
            
            improvement = eval_result.accuracy - current_eval.accuracy
            if improvement > best_improvement:
                best_improvement = improvement
                best_upgrade = {
                    'model': model.name,
                    'evaluation': eval_result,
                    'improvement': improvement,
                    'cost_increase': eval_result.cost_per_request - current_eval.cost_per_request
                }
        
        if best_upgrade and best_improvement > 0.05:  # 5% improvement threshold
            return {
                'recommendation': 'upgrade',
                'current_model': current_model,
                'suggested_model': best_upgrade['model'],
                'accuracy_improvement': best_improvement,
                'cost_increase': best_upgrade['cost_increase'],
                'rationale': f"Upgrade to {best_upgrade['model']} for {best_improvement:.1%} better accuracy"
            }
        else:
            return {
                'recommendation': 'keep_current',
                'current_model': current_model,
                'rationale': "Current model is optimal for your budget and requirements"
            }
    
    def get_evaluation_history(
        self,
        task_type: Optional[str] = None
    ) -> Dict[str, List[ModelEvaluation]]:
        """Get historical evaluation data"""
        if task_type:
            return {
                k: v for k, v in self.evaluations.items()
                if task_type in k
            }
        return self.evaluations


# Global AutoML service instance
automl_service = AutoMLService()



