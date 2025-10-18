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

    // Fallback: 返回模拟响应（用于演示或开发环境）
    console.warn('No AI service configured, using mock response');
    return {
      text: this.generateMockResponse(prompt),
      model: 'mock',
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }

  /**
   * 生成模拟响应（当没有配置 AI 服务时）
   */
  private generateMockResponse(prompt: string): string {
    // 根据 prompt 内容返回合适的模拟响应
    if (prompt.includes('sentiment') || prompt.includes('情感')) {
      return 'neutral';
    }
    if (prompt.includes('intent') || prompt.includes('意图')) {
      return 'general_inquiry';
    }
    
    // 检测是否需要 JSON 格式响应
    if (prompt.includes('JSON') || prompt.includes('json')) {
      // 学生分析
      if (prompt.includes('學生') || prompt.includes('学生') || prompt.includes('表現') || prompt.includes('表现')) {
        return JSON.stringify({
          overallAssessment: '該學生整體表現良好，建議持續關注學習狀況',
          subjectAnalysis: [
            {
              subject: '數學',
              assessment: '表現優秀',
              strengths: ['邏輯思維強', '計算準確'],
              weaknesses: ['應用題需加強'],
              recommendations: ['多練習應用題', '培養解題技巧']
            }
          ],
          learningRecommendations: ['保持學習習慣', '適當增加挑戰'],
          parentCommunication: ['學習態度認真', '可適度提升難度'],
          warningIndicators: [],
          nextSteps: ['持續監控進度', '鼓勵自主學習']
        });
      }
      
      // 学习会话分析（包含学习内容和练习题目）
      if (prompt.includes('學習會話') || prompt.includes('学习会话') || 
          prompt.includes('學習內容') || prompt.includes('学习内容') ||
          prompt.includes('練習題目') || prompt.includes('练习题目') ||
          prompt.includes('學習主題') || prompt.includes('学习主题') ||
          (prompt.includes('題目') && (prompt.includes('學習') || prompt.includes('学习'))) ||
          (prompt.includes('题目') && (prompt.includes('學習') || prompt.includes('学习'))) ||
          (prompt.includes('請設計') && prompt.includes('questions'))) {
        return JSON.stringify({
          content: '這是針對主題的學習內容說明。包含基礎概念、重點知識和實踐應用。',
          questions: [
            {
              content: '請說明這個主題的基本概念？',
              type: 'short_answer',
              difficulty: 'easy',
              correctAnswer: '這是示例答案，說明基本概念的定義和重要性',
              explanation: '這個概念是學習的基礎，需要先理解才能進入更深入的內容'
            },
            {
              content: '下列哪個選項正確描述了主題特點？',
              type: 'multiple_choice',
              difficulty: 'medium',
              options: ['選項 A', '選項 B', '選項 C', '選項 D'],
              correctAnswer: '選項 B',
              explanation: '選項 B 正確地描述了主題的核心特點'
            },
            {
              content: '請舉例說明如何在實際情況中應用這個概念？',
              type: 'essay',
              difficulty: 'hard',
              correctAnswer: '可以通過具體案例說明應用場景和效果',
              explanation: '實際應用能幫助深化理解，建議多思考生活中的例子'
            },
            {
              content: '解決以下相關的練習問題',
              type: 'problem_solving',
              difficulty: 'medium',
              correctAnswer: '按照步驟一、二、三進行解答',
              explanation: '解題時要注意運用所學概念，按步驟推導'
            }
          ],
          feedback: '學習表現良好，能夠理解主要概念',
          suggestions: ['多練習相關題目', '加深概念理解', '嘗試實際應用', '複習基礎知識'],
          nextSteps: ['複習重點概念', '挑戰進階題目', '進行實作練習']
        });
      }
      
      // 课程分析
      if (prompt.includes('課程') || prompt.includes('课程') || prompt.includes('Curriculum')) {
        return JSON.stringify({
          overallScore: 85,
          strengths: ['課程結構清晰', '內容豐富'],
          weaknesses: ['部分內容較難'],
          recommendations: ['調整難度梯度', '增加實例'],
          alignmentScore: 90,
          engagementScore: 80,
          difficultyScore: 75
        });
      }
      
      // 政策分析
      if (prompt.includes('政策') || prompt.includes('Policy')) {
        return JSON.stringify({
          overallScore: 80,
          effectivenessScore: 82,
          efficiencyScore: 78,
          equityScore: 75,
          sustainabilityScore: 80,
          impactAssessment: {
            positiveImpacts: [
              '提升公共服務效率',
              '改善民眾生活品質',
              '促進經濟發展',
              '增加就業機會'
            ],
            negativeImpacts: [
              '初期成本較高',
              '需要適應期',
              '可能引起部分反對'
            ],
            affectedGroups: [
              '一般民眾',
              '企業',
              '政府機關',
              '特定弱勢群體'
            ],
            quantitativeMetrics: [
              {
                name: '預期受益人數',
                value: 500000,
                unit: '人',
                trend: 'increasing'
              },
              {
                name: '年度預算',
                value: 50000000,
                unit: '元',
                trend: 'stable'
              },
              {
                name: '效率提升',
                value: 30,
                unit: '%',
                trend: 'increasing'
              }
            ],
            qualitativeInsights: [
              '政策整體方向正確，符合社會需求',
              '執行細節需要進一步完善',
              '建議加強與利害關係人溝通',
              '長期效益值得期待'
            ]
          },
          riskAnalysis: {
            risks: [
              {
                description: '執行過程中可能遇到技術困難',
                probability: 'medium',
                impact: 'medium',
                mitigation: '提前進行技術評估，準備備案'
              },
              {
                description: '預算可能不足',
                probability: 'low',
                impact: 'high',
                mitigation: '建立彈性預算機制，爭取額外資源'
              },
              {
                description: '民眾接受度不高',
                probability: 'medium',
                impact: 'medium',
                mitigation: '加強宣導，建立溝通管道'
              }
            ],
            mitigationStrategies: [
              '建立風險預警機制',
              '定期檢討執行進度',
              '強化跨部門協調',
              '增加民眾參與管道'
            ],
            probabilityAssessment: '整體風險機率為中等，可透過適當管理降低',
            impactAssessment: '若發生風險，影響程度可控，建議持續監控'
          },
          recommendations: [
            '建議分階段實施，先進行試點計畫',
            '加強與利害關係人溝通協調',
            '建立完善的監督評估機制',
            '確保充足的預算和資源',
            '培訓相關執行人員',
            '建立應變計畫'
          ]
        });
      }
      
      // 公民服务分析
      if (prompt.includes('服務') || prompt.includes('服务') || prompt.includes('Service') || prompt.includes('請求') || prompt.includes('请求')) {
        return JSON.stringify({
          category: 'general',
          priority: 'medium',
          sentiment: 'neutral',
          suggestedResponse: '我們已收到您的請求，將盡快處理',
          actionRequired: '轉交相關部門處理'
        });
      }
      
      // 医疗记录分析
      if (prompt.includes('病歷') || prompt.includes('病历') || prompt.includes('Medical')) {
        return JSON.stringify({
          diagnosis: '需要進一步檢查',
          severity: 'moderate',
          recommendations: ['建議定期追蹤', '注意生活作息'],
          riskFactors: ['需要關注的風險因素'],
          followUp: '建議 2 週後回診'
        });
      }
      
      // 文档审核
      if (prompt.includes('文件審核') || prompt.includes('文件审核') || prompt.includes('Document') || prompt.includes('審核')) {
        return JSON.stringify({
          overallScore: 85,
          riskLevel: 'medium',
          complianceScore: 90,
          issues: [
            {
              type: 'risk',
              severity: 'medium',
              description: '部分條款描述不夠明確，可能產生歧義',
              location: '第三條款',
              suggestion: '建議使用更精確的文字描述，避免雙方理解不同'
            },
            {
              type: 'compliance',
              severity: 'low',
              description: '缺少標準化的資料保護聲明',
              location: '附件部分',
              suggestion: '建議加入符合個資法的資料保護說明'
            },
            {
              type: 'legal',
              severity: 'medium',
              description: '違約責任條款不夠完整',
              location: '第五條款',
              suggestion: '建議明確違約的判定標準、通知程序及處理方式'
            }
          ],
          recommendations: [
            '建議補充資料保護相關條款',
            '違約條款需要更明確的定義',
            '建議增加爭議解決機制說明',
            '部分專業術語建議加註解釋',
            '建議法務部門進行最終審查'
          ],
          summary: '文件整體結構完整，符合基本要求。發現 3 項需要改進的問題，主要涉及條款明確性和合規性。建議修改後重新審核。風險等級：中等。'
        });
      }
      
      // 欺诈检测/交易风险分析
      if (prompt.includes('詐欺') || prompt.includes('诈欺') || prompt.includes('欺詐') || 
          prompt.includes('欺诈') || prompt.includes('fraud') || prompt.includes('Fraud') ||
          prompt.includes('風險評分') || prompt.includes('风险评分') || prompt.includes('交易')) {
        // 模拟风险评估
        const randomRisk = Math.floor(Math.random() * 100);
        const isHighRisk = randomRisk > 70;
        
        return JSON.stringify({
          riskScore: randomRisk,
          fraudIndicators: isHighRisk ? [
            randomRisk > 90 ? 'unusual_amount' : 'pattern_anomaly',
            randomRisk > 85 ? 'location_mismatch' : 'velocity_check',
            randomRisk > 80 ? 'device_fingerprint' : null
          ].filter(Boolean) : [],
          recommendation: randomRisk > 85 ? 'block' : randomRisk > 60 ? 'investigate' : 'approve',
          reasoning: randomRisk > 85 ? '檢測到多項高風險指標，建議立即阻擋交易' :
                    randomRisk > 60 ? '發現部分異常模式，建議人工審查' :
                    '交易模式正常，符合客戶歷史行為'
        });
      }
      
      // 通用 JSON 响应
      return JSON.stringify({
        result: '模擬分析結果',
        status: 'success',
        data: { message: '這是演示模式的模擬響應' },
        recommendations: ['建議配置真實的 AI 服務以獲得更準確的結果']
      });
    }
    
    if (prompt.includes('訂單') || prompt.includes('订单')) {
      return '您的訂單已在處理中，預計 3-5 個工作日內送達。如需查詢詳細資訊，請提供訂單號碼。';
    }
    if (prompt.includes('退貨') || prompt.includes('退货')) {
      return '我們提供 30 天退貨保證。請確保商品未經使用並保留完整包裝。請聯繫客服辦理退貨手續。';
    }
    return '感謝您的詢問。我們的客服團隊會盡快為您處理。如有緊急問題，請撥打客服熱線。';
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
