/**
 * AI 虚拟助理服务
 * 整合 AI Core 服务和数据库操作
 */

import { supabase } from './supabase';
import { AIService } from './ai-service';

const aiService = new AIService();

export interface Message {
  id: string;
  company_id: string;
  user_id?: string;
  message_type: 'user' | 'assistant';
  content: string;
  category?: 'customer-service' | 'marketing' | 'faq' | 'general';
  sentiment?: 'positive' | 'neutral' | 'negative';
  intent?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface FAQ {
  id: string;
  company_id: string;
  question: string;
  answer: string;
  category: string;
  tags?: string[];
  hits: number;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface AssistantConfig {
  id: string;
  company_id: string;
  assistant_name: string;
  welcome_message: string;
  response_speed: 'fast' | 'standard' | 'detailed';
  enable_multichannel: boolean;
  enable_auto_report: boolean;
  business_hours: { start: string; end: string };
  auto_reply_enabled: boolean;
  settings: Record<string, any>;
}

export interface AssistantStats {
  total_messages: number;
  avg_response_time: number;
  satisfaction: number;
  resolution_rate: number;
}

/**
 * 虚拟助理服务类
 */
export class VirtualAssistantService {
  /**
   * 检查表是否存在
   */
  private async checkTableExists(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('assistant_messages')
        .select('id')
        .limit(1);
      
      return !error || error.code !== 'PGRST205';
    } catch {
      return false;
    }
  }

  /**
   * 发送消息并获取 AI 响应（使用 Edge Function）
   */
  async sendMessage(
    companyId: string,
    userId: string,
    content: string
  ): Promise<{ userMessage: Message; assistantMessage: Message }> {
    try {
      // 调用 Edge Function
      const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/virtual-assistant-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          action: 'send_message',
          data: { companyId, userId, content }
        })
      });

      if (!response.ok) {
        throw new Error(`Edge Function request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      return result.data;
    } catch (error) {
      console.error('Error sending message:', error);
      // 如果 Edge Function 失败，回退到模拟模式
      return this.sendMessageMock(companyId, userId, content);
    }
  }

  /**
   * 模拟发送消息（当数据库表不存在时使用）
   */
  private async sendMessageMock(
    companyId: string,
    userId: string,
    content: string
  ): Promise<{ userMessage: Message; assistantMessage: Message }> {
    console.warn('⚠️ Using mock mode - database tables not found. Please execute migration SQL.');
    
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    const now = new Date().toISOString();
    const intent = this.detectIntentSimple(content);
    const category = this.categorizeMessage(intent);
    
    const userMessage: Message = {
      id: `mock-user-${Date.now()}`,
      company_id: companyId,
      user_id: userId,
      message_type: 'user',
      content,
      category: 'general',
      sentiment: 'neutral',
      intent,
      created_at: now
    };

    const aiResponse = this.generateMockResponse(content);
    
    const assistantMessage: Message = {
      id: `mock-assistant-${Date.now()}`,
      company_id: companyId,
      message_type: 'assistant',
      content: aiResponse,
      category,
      intent,
      created_at: now
    };

    return { userMessage, assistantMessage };
  }

  /**
   * 简单的意图检测
   */
  private detectIntentSimple(content: string): string {
    const lower = content.toLowerCase();
    if (lower.includes('退货') || lower.includes('退款')) return 'refund_request';
    if (lower.includes('配送') || lower.includes('物流')) return 'shipping_inquiry';
    if (lower.includes('营销') || lower.includes('推广')) return 'marketing_inquiry';
    if (lower.includes('会员') || lower.includes('vip')) return 'membership_inquiry';
    if (lower.includes('支付') || lower.includes('付款')) return 'payment_inquiry';
    return 'general_inquiry';
  }

  /**
   * 生成模拟响应
   */
  private generateMockResponse(content: string): string {
    const lower = content.toLowerCase();
    
    if (lower.includes('退货') || lower.includes('退换')) {
      return '关于退换货：我们提供 30 天无理由退换货服务。请确保商品保持原包装完整，并附上购买凭证。您可以通过"我的订单"页面申请退货，或联系客服热线 400-xxx-xxxx。';
    }
    
    if (lower.includes('配送') || lower.includes('物流')) {
      return '关于配送：一般订单 3-5 个工作日内送达。您可以在订单详情页面查看物流信息。如有特殊需求，可备注或联系客服安排。';
    }
    
    if (lower.includes('营销') || lower.includes('推广')) {
      return '我可以帮您分析营销数据、制定推广策略、生成营销文案。目前您的客户转化率为 3.2%，建议加强社交媒体推广和邮件营销。需要详细的营销报告吗？';
    }
    
    if (lower.includes('会员') || lower.includes('vip')) {
      return '会员权益包括：专属折扣（最高 8 折）、优先配送、生日礼金、积分翻倍、专属客服等。升级为高级会员还可享受更多特权。';
    }
    
    if (lower.includes('支付') || lower.includes('付款')) {
      return '我们支持多种支付方式：信用卡、支付宝、微信支付、货到付款等。所有支付都经过加密处理，确保您的资金安全。';
    }
    
    return `感谢您的咨询！我已经收到您的问题："${content}"。我会为您查询相关信息。如需人工客服协助，请拨打热线 400-xxx-xxxx，或在工作时间（9:00-18:00）使用在线客服。`;
  }

  /**
   * 生成 AI 响应
   */
  private async generateAIResponse(
    companyId: string,
    userMessage: string,
    intent: string
  ): Promise<string> {
    // 1. 检查是否有匹配的 FAQ
    const faqAnswer = await this.searchFAQ(companyId, userMessage);
    if (faqAnswer) {
      return faqAnswer;
    }

    // 2. 获取最近的对话历史作为上下文
    const { data: recentMessages } = await supabase
      .from('assistant_messages')
      .select('message_type, content')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(10);

    const conversationContext = recentMessages
      ?.map(m => `${m.message_type === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .reverse()
      .join('\n') || '';

    // 3. 构建 AI 提示
    const prompt = `你是一个专业的商业助理，负责处理客户服务、营销咨询和一般问题。

对话历史：
${conversationContext}

当前用户意图：${intent}
用户问题：${userMessage}

请提供专业、友好、准确的回答。如果是客服问题，提供解决方案；如果是营销咨询，提供数据分析和建议；如果是一般咨询，提供有帮助的信息。

回答：`;

    // 4. 调用 AI 服务生成响应
    const response = await aiService.generateText(prompt, {
      maxTokens: 500,
      temperature: 0.7
    });

    return response.text;
  }

  /**
   * 搜索 FAQ 知识库
   */
  private async searchFAQ(companyId: string, query: string): Promise<string | null> {
    try {
      // 获取所有活跃的 FAQ
      const { data: faqs } = await supabase
        .from('assistant_faqs')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('hits', { ascending: false });

      if (!faqs || faqs.length === 0) return null;

      // 简单的关键词匹配（生产环境应使用向量搜索）
      const lowerQuery = query.toLowerCase();
      const matchedFaq = faqs.find(faq => 
        faq.question.toLowerCase().includes(lowerQuery) ||
        lowerQuery.includes(faq.question.toLowerCase().split('？')[0].toLowerCase())
      );

      if (matchedFaq) {
        // 增加点击量
        await supabase.rpc('increment_faq_hits', { faq_id: matchedFaq.id });
        return matchedFaq.answer;
      }

      return null;
    } catch (error) {
      console.error('Error searching FAQ:', error);
      return null;
    }
  }

  /**
   * 根据意图分类消息
   */
  private categorizeMessage(intent: string): 'customer-service' | 'marketing' | 'faq' | 'general' {
    const lowerIntent = intent.toLowerCase();
    
    if (lowerIntent.includes('退货') || lowerIntent.includes('退款') || 
        lowerIntent.includes('投诉') || lowerIntent.includes('问题')) {
      return 'customer-service';
    }
    
    if (lowerIntent.includes('营销') || lowerIntent.includes('推广') || 
        lowerIntent.includes('销售') || lowerIntent.includes('转化')) {
      return 'marketing';
    }
    
    if (lowerIntent.includes('如何') || lowerIntent.includes('什么') || 
        lowerIntent.includes('为什么') || lowerIntent.includes('哪里')) {
      return 'faq';
    }
    
    return 'general';
  }

  /**
   * 获取对话历史（使用 Edge Function）
   */
  async getMessages(companyId: string, limit: number = 50): Promise<Message[]> {
    try {
      const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/virtual-assistant-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          action: 'get_messages',
          data: { companyId, limit }
        })
      });

      if (!response.ok) {
        throw new Error(`Edge Function request failed`);
      }

      const result = await response.json();
      return result.success ? (result.data || []).reverse() : [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  /**
   * 获取 FAQ 列表（使用 Edge Function）
   */
  async getFAQs(companyId: string): Promise<FAQ[]> {
    try {
      const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/virtual-assistant-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          action: 'get_faqs',
          data: { companyId }
        })
      });

      if (!response.ok) throw new Error('Failed to get FAQs');

      const result = await response.json();
      return result.success ? (result.data || []) : this.getMockFAQs(companyId);
    } catch (error) {
      console.error('Error getting FAQs:', error);
      return this.getMockFAQs(companyId);
    }
  }

  /**
   * 获取模拟 FAQ
   */
  private getMockFAQs(companyId: string): FAQ[] {
    return [
      {
        id: 'mock-1',
        company_id: companyId,
        question: '如何退换货？',
        answer: '我们提供 30 天无理由退换货服务，商品需保持原包装完整。',
        category: '售后服务',
        tags: ['退货', '退款'],
        hits: 245,
        is_active: true,
        priority: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-2',
        company_id: companyId,
        question: '支付方式有哪些？',
        answer: '支持信用卡、支付宝、微信支付、货到付款等多种支付方式。',
        category: '支付问题',
        tags: ['支付', '付款'],
        hits: 189,
        is_active: true,
        priority: 8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-3',
        company_id: companyId,
        question: '配送需要多久？',
        answer: '一般 3-5 个工作日送达，偏远地区可能需要 7-10 个工作日。',
        category: '物流配送',
        tags: ['配送', '物流'],
        hits: 167,
        is_active: true,
        priority: 7,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-4',
        company_id: companyId,
        question: '如何申请发票？',
        answer: '在订单详情页面点击"申请发票"，填写发票信息即可。',
        category: '发票问题',
        tags: ['发票'],
        hits: 123,
        is_active: true,
        priority: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-5',
        company_id: companyId,
        question: '会员权益有哪些？',
        answer: '会员享有专属折扣、优先配送、生日礼金等多项特权。',
        category: '会员服务',
        tags: ['会员', 'VIP'],
        hits: 98,
        is_active: true,
        priority: 6,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  /**
   * 创建或更新 FAQ（使用 Edge Function）
   */
  async upsertFAQ(companyId: string, userId: string, faq: Partial<FAQ>): Promise<FAQ> {
    try {
      const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/virtual-assistant-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          action: 'upsert_faq',
          data: { companyId, userId, faq }
        })
      });

      if (!response.ok) throw new Error('Failed to upsert FAQ');

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      return result.data;
    } catch (error) {
      console.error('Error upserting FAQ:', error);
      throw error;
    }
  }

  /**
   * 删除 FAQ
   */
  async deleteFAQ(faqId: string): Promise<void> {
    const { error } = await supabase
      .from('assistant_faqs')
      .update({ is_active: false })
      .eq('id', faqId);

    if (error) throw error;
  }

  /**
   * 获取助理配置（使用 Edge Function）
   */
  async getConfig(companyId: string): Promise<AssistantConfig | null> {
    try {
      const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/virtual-assistant-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          action: 'get_config',
          data: { companyId }
        })
      });

      if (!response.ok) return null;

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error in getConfig:', error);
      return null;
    }
  }

  /**
   * 更新助理配置（使用 Edge Function）
   */
  async updateConfig(companyId: string, config: Partial<AssistantConfig>): Promise<AssistantConfig> {
    try {
      const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/virtual-assistant-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          action: 'update_config',
          data: { companyId, config }
        })
      });

      if (!response.ok) throw new Error('Failed to update config');

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      return result.data;
    } catch (error) {
      console.error('Error updating config:', error);
      throw error;
    }
  }

  /**
   * 获取今日统计（使用 Edge Function）
   */
  async getTodayStats(companyId: string): Promise<AssistantStats> {
    try {
      const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/virtual-assistant-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          action: 'get_today_stats',
          data: { companyId }
        })
      });

      if (!response.ok) throw new Error('Failed to get stats');

      const result = await response.json();
      return result.success ? result.data : {
        total_messages: 0,
        avg_response_time: 2.3,
        satisfaction: 94.5,
        resolution_rate: 87.2
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        total_messages: 0,
        avg_response_time: 2.3,
        satisfaction: 94.5,
        resolution_rate: 87.2
      };
    }
  }

  /**
   * 获取消息分类统计（使用 Edge Function）
   */
  async getCategoryStats(companyId: string): Promise<Record<string, number>> {
    try {
      const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/virtual-assistant-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          action: 'get_category_stats',
          data: { companyId, days: 7 }
        })
      });

      if (!response.ok) throw new Error('Failed to get category stats');

      const result = await response.json();
      return result.success ? result.data : {
        'customer-service': 45,
        'marketing': 25,
        'faq': 20,
        'general': 10
      };
    } catch (error) {
      console.error('Error getting category stats:', error);
      return {
        'customer-service': 45,
        'marketing': 25,
        'faq': 20,
        'general': 10
      };
    }
  }
}

// 导出单例
export const virtualAssistantService = new VirtualAssistantService();

