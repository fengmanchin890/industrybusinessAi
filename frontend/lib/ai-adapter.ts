/**
 * Unified AI Adapter
 * Provides a single interface for all AI operations with caching, model selection,
 * error handling, and usage tracking
 */

import { supabase } from './supabase';
import { aiServiceV2 } from './ai-service-v2';

export type AIProvider = 'openai' | 'anthropic' | 'local' | 'auto';
export type ModelPriority = 'speed' | 'accuracy' | 'cost' | 'balanced';

export interface AIAdapterConfig {
  provider?: AIProvider;
  model?: string;
  caching?: boolean;
  fallback?: boolean;
  priority?: ModelPriority;
  maxRetries?: number;
  timeout?: number;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost_usd?: number;
  };
  cached?: boolean;
  latency_ms?: number;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CacheEntry {
  response: AIResponse;
  timestamp: number;
  hits: number;
}

interface ModelInfo {
  name: string;
  provider: AIProvider;
  cost_per_1k_tokens: number;
  avg_latency_ms: number;
  accuracy_score: number;
  max_tokens: number;
}

export class AIAdapter {
  private cache: Map<string, CacheEntry>;
  private defaultConfig: AIAdapterConfig;
  private models: Map<string, ModelInfo>;
  private cacheMaxAge: number = 3600000; // 1 hour in milliseconds
  private cacheMaxSize: number = 1000;

  constructor() {
    this.cache = new Map();
    this.defaultConfig = {
      provider: 'auto',
      caching: true,
      fallback: true,
      priority: 'balanced',
      maxRetries: 3,
      timeout: 30000
    };
    
    // Initialize model registry
    this.models = new Map([
      ['gpt-4', {
        name: 'gpt-4',
        provider: 'openai',
        cost_per_1k_tokens: 0.03,
        avg_latency_ms: 2000,
        accuracy_score: 0.95,
        max_tokens: 8192
      }],
      ['gpt-3.5-turbo', {
        name: 'gpt-3.5-turbo',
        provider: 'openai',
        cost_per_1k_tokens: 0.002,
        avg_latency_ms: 800,
        accuracy_score: 0.85,
        max_tokens: 4096
      }],
      ['claude-3-opus', {
        name: 'claude-3-opus-20240229',
        provider: 'anthropic',
        cost_per_1k_tokens: 0.015,
        avg_latency_ms: 1500,
        accuracy_score: 0.93,
        max_tokens: 4096
      }],
      ['claude-instant', {
        name: 'claude-instant-1.2',
        provider: 'anthropic',
        cost_per_1k_tokens: 0.0016,
        avg_latency_ms: 600,
        accuracy_score: 0.83,
        max_tokens: 4096
      }]
    ]);
  }

  /**
   * Generate text using optimal model
   */
  async generate(
    prompt: string,
    config: AIAdapterConfig = {}
  ): Promise<AIResponse> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    
    // Check cache if enabled
    if (finalConfig.caching) {
      const cached = this.getCached(prompt);
      if (cached) {
        console.log('✓ Cache hit for prompt');
        cached.hits++;
        return cached.response;
      }
    }

    // Select best model
    const model = await this.selectModel('text_generation', finalConfig);
    
    try {
      // Call AI service with retry logic
      const response = await this.callWithRetry(async () => {
        return await aiServiceV2.generateText(prompt, {
          model: model.name,
          maxTokens: 1000,
          temperature: 0.7
        });
      }, finalConfig.maxRetries!);

      const latency = Date.now() - startTime;
      
      // Calculate cost
      const cost = this.calculateCost(
        response.usage?.total_tokens || 0,
        model.cost_per_1k_tokens
      );

      const aiResponse: AIResponse = {
        content: response.content,
        model: model.name,
        provider: model.provider,
        usage: {
          ...response.usage,
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
          cost_usd: cost
        },
        cached: false,
        latency_ms: latency
      };

      // Cache response
      if (finalConfig.caching) {
        this.setCached(prompt, aiResponse);
      }

      // Log usage to Supabase
      await this.logUsage(aiResponse, 'generate', prompt.length);

      return aiResponse;
      
    } catch (error) {
      console.error('AI generation error:', error);
      
      // Try fallback model if enabled
      if (finalConfig.fallback && model.name !== 'gpt-3.5-turbo') {
        console.log('Trying fallback model: gpt-3.5-turbo');
        return this.generate(prompt, {
          ...finalConfig,
          model: 'gpt-3.5-turbo',
          fallback: false // Prevent infinite fallback
        });
      }
      
      throw error;
    }
  }

  /**
   * Chat with messages array
   */
  async chat(
    messages: Message[],
    config: AIAdapterConfig = {}
  ): Promise<AIResponse> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    
    // Create cache key from messages
    const cacheKey = JSON.stringify(messages);
    
    // Check cache
    if (finalConfig.caching) {
      const cached = this.getCached(cacheKey);
      if (cached) {
        console.log('✓ Cache hit for chat');
        cached.hits++;
        return cached.response;
      }
    }

    // Select best model
    const model = await this.selectModel('chat', finalConfig);
    
    try {
      const response = await this.callWithRetry(async () => {
        return await aiServiceV2.chat(messages, {
          model: model.name,
          maxTokens: 1000,
          temperature: 0.7
        });
      }, finalConfig.maxRetries!);

      const latency = Date.now() - startTime;
      const cost = this.calculateCost(
        response.usage?.total_tokens || 0,
        model.cost_per_1k_tokens
      );

      const aiResponse: AIResponse = {
        content: response.content,
        model: model.name,
        provider: model.provider,
        usage: {
          ...response.usage,
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
          cost_usd: cost
        },
        cached: false,
        latency_ms: latency
      };

      // Cache response
      if (finalConfig.caching) {
        this.setCached(cacheKey, aiResponse);
      }

      // Log usage
      await this.logUsage(aiResponse, 'chat', cacheKey.length);

      return aiResponse;
      
    } catch (error) {
      console.error('AI chat error:', error);
      
      if (finalConfig.fallback && model.name !== 'gpt-3.5-turbo') {
        console.log('Trying fallback model');
        return this.chat(messages, {
          ...finalConfig,
          model: 'gpt-3.5-turbo',
          fallback: false
        });
      }
      
      throw error;
    }
  }

  /**
   * Analyze data with AI
   */
  async analyze(
    data: any,
    task: string,
    config: AIAdapterConfig = {}
  ): Promise<AIResponse> {
    const prompt = `Task: ${task}\n\nData: ${JSON.stringify(data, null, 2)}\n\nProvide analysis:`;
    return this.generate(prompt, config);
  }

  /**
   * Vision analysis
   */
  async vision(
    imageBase64: string,
    prompt: string,
    config: AIAdapterConfig = {}
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      const response = await aiServiceV2.analyzeImage(imageBase64, prompt);
      const latency = Date.now() - startTime;

      const aiResponse: AIResponse = {
        content: response,
        model: 'gpt-4-vision-preview',
        provider: 'openai',
        latency_ms: latency
      };

      await this.logUsage(aiResponse, 'vision', imageBase64.length);
      
      return aiResponse;
      
    } catch (error) {
      console.error('Vision analysis error:', error);
      throw error;
    }
  }

  /**
   * Select best model based on priority and task
   */
  private async selectModel(
    taskType: string,
    config: AIAdapterConfig
  ): Promise<ModelInfo> {
    // If specific model requested, use it
    if (config.model && this.models.has(config.model)) {
      return this.models.get(config.model)!;
    }

    // Get company settings from Supabase
    const companyPreference = await this.getCompanyModelPreference();
    
    // Auto-select based on priority
    const priority = config.priority || 'balanced';
    const availableModels = Array.from(this.models.values());

    switch (priority) {
      case 'speed':
        return availableModels.reduce((fastest, model) =>
          model.avg_latency_ms < fastest.avg_latency_ms ? model : fastest
        );
      
      case 'accuracy':
        return availableModels.reduce((best, model) =>
          model.accuracy_score > best.accuracy_score ? model : best
        );
      
      case 'cost':
        return availableModels.reduce((cheapest, model) =>
          model.cost_per_1k_tokens < cheapest.cost_per_1k_tokens ? model : cheapest
        );
      
      case 'balanced':
      default:
        // Use company preference or balanced scoring
        if (companyPreference && this.models.has(companyPreference)) {
          return this.models.get(companyPreference)!;
        }
        
        // Score = (accuracy * 0.4) + (1/cost * 0.3) + (1/latency * 0.3)
        return availableModels.reduce((best, model) => {
          const score = (
            (model.accuracy_score * 0.4) +
            ((1 / model.cost_per_1k_tokens) * 0.0001 * 0.3) +
            ((1 / model.avg_latency_ms) * 1000 * 0.3)
          );
          
          const bestScore = (
            (best.accuracy_score * 0.4) +
            ((1 / best.cost_per_1k_tokens) * 0.0001 * 0.3) +
            ((1 / best.avg_latency_ms) * 1000 * 0.3)
          );
          
          return score > bestScore ? model : best;
        });
    }
  }

  /**
   * Get company's preferred model from settings
   */
  private async getCompanyModelPreference(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('companies')
        .select('settings')
        .eq('id', user.user_metadata?.company_id)
        .single();

      if (error || !data) return null;
      
      return data.settings?.preferred_ai_model || null;
    } catch (error) {
      console.error('Error fetching company preference:', error);
      return null;
    }
  }

  /**
   * Call function with retry logic
   */
  private async callWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${i + 1} failed, retrying...`);
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Calculate cost in USD
   */
  private calculateCost(tokens: number, costPer1k: number): number {
    return (tokens / 1000) * costPer1k;
  }

  /**
   * Get cached response
   */
  private getCached(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.cacheMaxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return entry;
  }

  /**
   * Set cached response
   */
  private setCached(key: string, response: AIResponse): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.cacheMaxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      response: { ...response, cached: true },
      timestamp: Date.now(),
      hits: 0
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('AI adapter cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const totalRequests = entries.length + totalHits;
    
    return {
      size: this.cache.size,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0
    };
  }

  /**
   * Log usage to Supabase
   */
  private async logUsage(
    response: AIResponse,
    operation: string,
    inputSize: number
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('ai_usage_logs').insert({
        company_id: user.user_metadata?.company_id,
        user_id: user.id,
        operation,
        model: response.model,
        provider: response.provider,
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
        cost_usd: response.usage?.cost_usd || 0,
        latency_ms: response.latency_ms || 0,
        cached: response.cached || false,
        input_size: inputSize
      });
    } catch (error) {
      // Don't fail the request if logging fails
      console.error('Failed to log usage:', error);
    }
  }

  /**
   * Get usage statistics for current company
   */
  async getUsageStats(startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      let query = supabase
        .from('ai_usage_logs')
        .select('*')
        .eq('company_id', user.user_metadata?.company_id);

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Aggregate stats
      const stats = {
        totalRequests: data?.length || 0,
        totalTokens: data?.reduce((sum, log) => sum + log.total_tokens, 0) || 0,
        totalCost: data?.reduce((sum, log) => sum + log.cost_usd, 0) || 0,
        avgLatency: data?.length ? data.reduce((sum, log) => sum + log.latency_ms, 0) / data.length : 0,
        cacheHitRate: data?.length ? data.filter(log => log.cached).length / data.length : 0,
        byModel: this.aggregateByField(data || [], 'model'),
        byOperation: this.aggregateByField(data || [], 'operation')
      };

      return stats;
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      return null;
    }
  }

  /**
   * Aggregate data by field
   */
  private aggregateByField(data: any[], field: string): Record<string, any> {
    return data.reduce((acc, item) => {
      const key = item[field];
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          tokens: 0,
          cost: 0
        };
      }
      acc[key].count++;
      acc[key].tokens += item.total_tokens || 0;
      acc[key].cost += item.cost_usd || 0;
      return acc;
    }, {});
  }
}

// Export singleton instance
export const aiAdapter = new AIAdapter();

// Also export class for testing
export default AIAdapter;



