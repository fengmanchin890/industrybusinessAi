/**
 * AI Service V2 - New backend integration
 * Routes requests to FastAPI AI Core instead of direct third-party APIs
 */

import { supabase } from './supabase';

export interface AIResponse {
  content: string;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface SearchResult {
  id: string;
  score: number;
  content: string;
  metadata: Record<string, any>;
}

export interface DefectResult {
  defects: Array<{
    type: string;
    bbox?: number[];
    score: number;
    severity?: string;
    description?: string;
  }>;
  quality_score: float;
  processed_at: string;
  metadata?: Record<string, any>;
}

export class AIServiceV2 {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = import.meta.env.VITE_AI_CORE_URL || 'http://localhost:8000';
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    
    return {
      'Content-Type': 'application/json',
      'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
    };
  }

  /**
   * Generate text using LLM
   */
  async generateText(
    prompt: string,
    options: {
      systemPrompt?: string;
      maxTokens?: number;
      temperature?: number;
      model?: string;
    } = {}
  ): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/nlp/generate`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        prompt,
        system_prompt: options.systemPrompt,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        model: options.model || 'gpt-3.5-turbo'
      })
    });

    if (!response.ok) {
      throw new Error(`AI Core error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Chat with LLM
   */
  async chat(
    messages: Array<{ role: string; content: string }>,
    options: {
      maxTokens?: number;
      temperature?: number;
      model?: string;
    } = {}
  ): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/nlp/chat`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        messages,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        model: options.model || 'gpt-3.5-turbo'
      })
    });

    if (!response.ok) {
      throw new Error(`AI Core error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Summarize text
   */
  async summarizeText(text: string, maxLength: number = 200): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/v1/nlp/summarize`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        text,
        max_length: maxLength
      })
    });

    if (!response.ok) {
      throw new Error(`AI Core error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.summary;
  }

  /**
   * Translate text
   */
  async translateText(text: string, targetLanguage: string = 'zh-TW'): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/v1/nlp/translate`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        text,
        target_language: targetLanguage
      })
    });

    if (!response.ok) {
      throw new Error(`AI Core error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.translation;
  }

  /**
   * Semantic search using embeddings
   */
  async searchEmbeddings(
    collection: string,
    query: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/embeddings/search`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        collection,
        query,
        limit
      })
    });

    if (!response.ok) {
      throw new Error(`AI Core error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.results;
  }

  /**
   * Store document embeddings
   */
  async upsertEmbeddings(
    collection: string,
    documents: Array<{ id?: string; content: string; metadata?: Record<string, any> }>
  ): Promise<{ status: string; count: number }> {
    const response = await fetch(`${this.baseUrl}/api/v1/embeddings/upsert`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        collection,
        documents
      })
    });

    if (!response.ok) {
      throw new Error(`AI Core error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Quality inspection for manufacturing
   */
  async qualityInspection(
    imageBase64: string,
    metadata: {
      camera_id: string;
      line?: string;
      shift?: string;
      [key: string]: any;
    }
  ): Promise<DefectResult> {
    const response = await fetch(`${this.baseUrl}/api/v1/vision/inspect`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        image_base64: imageBase64,
        camera_id: metadata.camera_id,
        metadata
      })
    });

    if (!response.ok) {
      throw new Error(`AI Core error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * General image analysis
   */
  async analyzeImage(imageBase64: string, prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/v1/vision/analyze`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        image_base64: imageBase64,
        prompt
      })
    });

    if (!response.ok) {
      throw new Error(`AI Core error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.analysis;
  }
}

// Export singleton instance
export const aiServiceV2 = new AIServiceV2();

// Also export as default for backward compatibility
export default aiServiceV2;

