/**
 * AI Service Layer - 統一 AI 服務接口
 * 整合多種 AI 服務提供商
 */

export interface AIConfig {
  openai?: {
    apiKey: string;
    baseUrl?: string;
    model?: string;
  };
  anthropic?: {
    apiKey: string;
    model?: string;
  };
  local?: {
    baseUrl: string;
    model?: string;
  };
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  finishReason?: string;
}

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  /**
   * 生成文本內容
   */
  async generateText(
    prompt: string, 
    options: {
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
      model?: string;
    } = {}
  ): Promise<AIResponse> {
    const { maxTokens = 1000, temperature = 0.7, systemPrompt, model } = options;

    // 優先使用 OpenAI
    if (this.config.openai?.apiKey) {
      return this.callOpenAI(prompt, { maxTokens, temperature, systemPrompt, model });
    }

    // 備用 Anthropic
    if (this.config.anthropic?.apiKey) {
      return this.callAnthropic(prompt, { maxTokens, temperature, systemPrompt, model });
    }

    // 本地模型
    if (this.config.local?.baseUrl) {
      return this.callLocalModel(prompt, { maxTokens, temperature, systemPrompt, model });
    }

    throw new Error('No AI service configured');
  }

  /**
   * 聊天對話
   */
  async chat(
    messages: AIChatMessage[],
    options: {
      maxTokens?: number;
      temperature?: number;
      model?: string;
    } = {}
  ): Promise<AIResponse> {
    const { maxTokens = 1000, temperature = 0.7, model } = options;

    if (this.config.openai?.apiKey) {
      return this.callOpenAIChat(messages, { maxTokens, temperature, model });
    }

    if (this.config.anthropic?.apiKey) {
      return this.callAnthropicChat(messages, { maxTokens, temperature, model });
    }

    if (this.config.local?.baseUrl) {
      return this.callLocalChat(messages, { maxTokens, temperature, model });
    }

    throw new Error('No AI service configured');
  }

  /**
   * 文本摘要
   */
  async summarizeText(text: string, maxLength: number = 200): Promise<string> {
    const prompt = `請將以下文本摘要為不超過 ${maxLength} 字的中文摘要：

${text}

摘要：`;

    const response = await this.generateText(prompt, {
      maxTokens: maxLength * 2,
      temperature: 0.3
    });

    return response.content;
  }

  /**
   * 文本翻譯
   */
  async translateText(text: string, targetLang: string = 'zh-TW'): Promise<string> {
    const langMap: Record<string, string> = {
      'zh-TW': '繁體中文',
      'zh-CN': '簡體中文',
      'en': '英文',
      'ja': '日文',
      'ko': '韓文'
    };

    const prompt = `請將以下文本翻譯成 ${langMap[targetLang] || targetLang}：

${text}

翻譯：`;

    const response = await this.generateText(prompt, {
      maxTokens: text.length * 2,
      temperature: 0.3
    });

    return response.content;
  }

  /**
   * 情感分析
   */
  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    explanation: string;
  }> {
    const prompt = `請分析以下文本的情感傾向，並提供信心度（0-1）和簡短解釋：

文本：${text}

請以 JSON 格式回應：
{
  "sentiment": "positive/neutral/negative",
  "confidence": 0.0-1.0,
  "explanation": "簡短解釋"
}`;

    const response = await this.generateText(prompt, {
      maxTokens: 200,
      temperature: 0.1
    });

    try {
      const result = JSON.parse(response.content);
      return {
        sentiment: result.sentiment || 'neutral',
        confidence: result.confidence || 0.5,
        explanation: result.explanation || '無法分析'
      };
    } catch {
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        explanation: '分析失敗'
      };
    }
  }

  /**
   * 意圖識別
   */
  async identifyIntent(text: string, intents: string[]): Promise<{
    intent: string;
    confidence: number;
  }> {
    const prompt = `請識別以下文本的意圖，從給定的選項中選擇最符合的一個：

文本：${text}

可選意圖：${intents.join(', ')}

請以 JSON 格式回應：
{
  "intent": "選中的意圖",
  "confidence": 0.0-1.0
}`;

    const response = await this.generateText(prompt, {
      maxTokens: 100,
      temperature: 0.1
    });

    try {
      const result = JSON.parse(response.content);
      return {
        intent: result.intent || intents[0],
        confidence: result.confidence || 0.5
      };
    } catch {
      return {
        intent: intents[0],
        confidence: 0.5
      };
    }
  }

  /**
   * 數據分析
   */
  async analyzeData(data: any[], analysisType: string): Promise<string> {
    const prompt = `請分析以下數據，提供 ${analysisType} 分析：

數據：${JSON.stringify(data, null, 2)}

請提供詳細的分析結果和建議。`;

    const response = await this.generateText(prompt, {
      maxTokens: 1500,
      temperature: 0.3
    });

    return response.content;
  }

  // OpenAI API 調用
  private async callOpenAI(
    prompt: string, 
    options: { maxTokens: number; temperature: number; systemPrompt?: string; model?: string }
  ): Promise<AIResponse> {
    const { maxTokens, temperature, systemPrompt, model } = options;
    
    const messages: AIChatMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(`${this.config.openai?.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.openai?.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || this.config.openai?.model || 'gpt-3.5-turbo',
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
      finishReason: data.choices[0].finish_reason
    };
  }

  private async callOpenAIChat(
    messages: AIChatMessage[],
    options: { maxTokens: number; temperature: number; model?: string }
  ): Promise<AIResponse> {
    const { maxTokens, temperature, model } = options;

    const response = await fetch(`${this.config.openai?.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.openai?.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || this.config.openai?.model || 'gpt-3.5-turbo',
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
      finishReason: data.choices[0].finish_reason
    };
  }

  // Anthropic API 調用
  private async callAnthropic(
    prompt: string,
    options: { maxTokens: number; temperature: number; systemPrompt?: string; model?: string }
  ): Promise<AIResponse> {
    const { maxTokens, temperature, systemPrompt, model } = options;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.anthropic?.apiKey || '',
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || this.config.anthropic?.model || 'claude-3-haiku-20240307',
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.content[0].text,
      usage: data.usage,
      model: data.model,
      finishReason: data.stop_reason
    };
  }

  private async callAnthropicChat(
    messages: AIChatMessage[],
    options: { maxTokens: number; temperature: number; model?: string }
  ): Promise<AIResponse> {
    const { maxTokens, temperature, model } = options;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.anthropic?.apiKey || '',
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || this.config.anthropic?.model || 'claude-3-haiku-20240307',
        max_tokens: maxTokens,
        temperature,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.content[0].text,
      usage: data.usage,
      model: data.model,
      finishReason: data.stop_reason
    };
  }

  // 本地模型調用
  private async callLocalModel(
    prompt: string,
    options: { maxTokens: number; temperature: number; systemPrompt?: string; model?: string }
  ): Promise<AIResponse> {
    const { maxTokens, temperature, systemPrompt, model } = options;

    const messages: AIChatMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(`${this.config.local?.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || this.config.local?.model || 'local-model',
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Local model API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
      finishReason: data.choices[0].finish_reason
    };
  }

  private async callLocalChat(
    messages: AIChatMessage[],
    options: { maxTokens: number; temperature: number; model?: string }
  ): Promise<AIResponse> {
    const { maxTokens, temperature, model } = options;

    const response = await fetch(`${this.config.local?.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || this.config.local?.model || 'local-model',
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Local model API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
      finishReason: data.choices[0].finish_reason
    };
  }
}

// 創建全局 AI 服務實例
let globalAIService: AIService | null = null;

export const createAIService = (config: AIConfig): AIService => {
  globalAIService = new AIService(config);
  return globalAIService;
};

export const getAIService = (): AIService => {
  if (!globalAIService) {
    // 從環境變量創建默認配置
    const config: AIConfig = {};
    
    if (typeof window !== 'undefined') {
      // 瀏覽器環境
      const env = (window as any).__ENV__ || {};
      if (env.VITE_OPENAI_API_KEY) {
        config.openai = {
          apiKey: env.VITE_OPENAI_API_KEY,
          baseUrl: env.VITE_OPENAI_BASE_URL,
          model: env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo'
        };
      }
      if (env.VITE_ANTHROPIC_API_KEY) {
        config.anthropic = {
          apiKey: env.VITE_ANTHROPIC_API_KEY,
          model: env.VITE_ANTHROPIC_MODEL || 'claude-3-haiku-20240307'
        };
      }
      if (env.VITE_LOCAL_AI_URL) {
        config.local = {
          baseUrl: env.VITE_LOCAL_AI_URL,
          model: env.VITE_LOCAL_AI_MODEL || 'local-model'
        };
      }
    }
    
    globalAIService = new AIService(config);
  }
  
  return globalAIService;
};

// 便捷函數
export const generateText = (prompt: string, options?: any) => {
  return getAIService().generateText(prompt, options);
};

export const chat = (messages: AIChatMessage[], options?: any) => {
  return getAIService().chat(messages, options);
};

export const summarizeText = (text: string, maxLength?: number) => {
  return getAIService().summarizeText(text, maxLength);
};

export const translateText = (text: string, targetLang?: string) => {
  return getAIService().translateText(text, targetLang);
};

export const analyzeSentiment = (text: string) => {
  return getAIService().analyzeSentiment(text);
};

export const identifyIntent = (text: string, intents: string[]) => {
  return getAIService().identifyIntent(text, intents);
};

export const analyzeData = (data: any[], analysisType: string) => {
  return getAIService().analyzeData(data, analysisType);
};
