/**
 * AI 客戶服務助理 - 智能客服系統
 * 為中小企業提供 24/7 客戶服務支援
 */

import React, { useState, useEffect } from 'react';
import { MessageCircle, Bot, Users, Clock, TrendingUp, Send, CheckCircle } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../Contexts/AuthContext';
import { generateText, analyzeSentiment, identifyIntent } from '../../../lib/ai-service';

const metadata: ModuleMetadata = {
  id: 'customer-service-bot',
  name: 'AI 客戶服務助理',
  version: '1.0.0',
  category: 'sme',
  industry: ['sme'],
  description: '24/7 智能客服系統，自動回答客戶問題，提升服務效率',
  icon: 'MessageCircle',
  author: 'AI Business Platform',
  pricingTier: 'basic',
  features: [
    '24/7 自動客服',
    '智能問答',
    '多語言支援',
    '情緒分析',
    '轉接人工客服'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: false
};

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  sentiment?: 'positive' | 'neutral' | 'negative';
  intent?: string;
  confidence?: number;
}

interface CustomerInquiry {
  id: string;
  customerId: string;
  customerName: string;
  email: string;
  phone?: string;
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  createdAt: Date;
  resolvedAt?: Date;
  messages: ChatMessage[];
}

interface BotResponse {
  message: string;
  intent: string;
  confidence: number;
  suggestedActions?: string[];
  escalateToHuman?: boolean;
}

export function CustomerServiceBotModule({ context }: { context: ModuleContext }) {
  const { state, setRunning } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  const { company } = useAuth();
  
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [activeInquiry, setActiveInquiry] = useState<CustomerInquiry | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [botTyping, setBotTyping] = useState(false);
  const [stats, setStats] = useState({
    totalInquiries: 0,
    resolvedToday: 0,
    avgResponseTime: 0,
    satisfactionScore: 0
  });

  // 預設客戶詢問
  const defaultInquiries: CustomerInquiry[] = [
    {
      id: '1',
      customerId: 'C001',
      customerName: '王小明',
      email: 'wang@example.com',
      phone: '0912-345-678',
      subject: '產品退貨問題',
      priority: 'high',
      status: 'open',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      messages: [
        {
          id: '1',
          content: '您好，我想退貨，但是已經超過7天了，還能退嗎？',
          sender: 'user',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: 'text',
          sentiment: 'negative',
          intent: 'return_request',
          confidence: 0.95
        },
        {
          id: '2',
          content: '您好！感謝您的詢問。根據我們的退貨政策，超過7天的商品確實無法退貨，但我們可以為您提供其他解決方案：\n\n1. 商品換貨（30天內）\n2. 商品維修服務\n3. 優惠券補償\n\n請問您希望選擇哪種方式呢？',
          sender: 'bot',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000),
          type: 'text',
          intent: 'policy_explanation',
          confidence: 0.88
        }
      ]
    },
    {
      id: '2',
      customerId: 'C002',
      customerName: '李美華',
      email: 'li@example.com',
      subject: '產品使用問題',
      priority: 'medium',
      status: 'in_progress',
      assignedTo: '客服小王',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      messages: [
        {
          id: '3',
          content: '請問這個產品要怎麼使用？說明書我看不太懂',
          sender: 'user',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          type: 'text',
          sentiment: 'neutral',
          intent: 'usage_question',
          confidence: 0.92
        },
        {
          id: '4',
          content: '我來為您詳細說明使用步驟：\n\n1. 首先確保電源已連接\n2. 按下開關按鈕\n3. 等待指示燈亮起\n4. 按照螢幕提示操作\n\n如果還有問題，我可以為您安排技術支援人員協助。',
          sender: 'bot',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000 + 45000),
          type: 'text',
          intent: 'usage_instruction',
          confidence: 0.85
        }
      ]
    },
    {
      id: '3',
      customerId: 'C003',
      customerName: '陳志強',
      email: 'chen@example.com',
      subject: '訂單查詢',
      priority: 'low',
      status: 'resolved',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      messages: [
        {
          id: '5',
          content: '我的訂單 #12345 什麼時候會到？',
          sender: 'user',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          type: 'text',
          sentiment: 'neutral',
          intent: 'order_inquiry',
          confidence: 0.98
        },
        {
          id: '6',
          content: '您的訂單 #12345 已於昨天出貨，預計明天下午會送達。您可以在我們的網站上追蹤物流狀態。',
          sender: 'bot',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 + 20000),
          type: 'text',
          intent: 'order_status',
          confidence: 0.90
        }
      ]
    }
  ];

  useEffect(() => {
    loadInquiries();
  }, [company?.id]);

  const loadInquiries = async () => {
    try {
      setInquiries(defaultInquiries);
      
      // 計算統計數據
      const totalInquiries = defaultInquiries.length;
      const resolvedToday = defaultInquiries.filter(i => 
        i.status === 'resolved' && 
        i.resolvedAt && 
        i.resolvedAt.toDateString() === new Date().toDateString()
      ).length;
      
      const avgResponseTime = defaultInquiries.reduce((sum, inquiry) => {
        if (inquiry.messages.length >= 2) {
          const userMessage = inquiry.messages.find(m => m.sender === 'user');
          const botMessage = inquiry.messages.find(m => m.sender === 'bot');
          if (userMessage && botMessage) {
            return sum + (botMessage.timestamp.getTime() - userMessage.timestamp.getTime()) / 1000 / 60;
          }
        }
        return sum;
      }, 0) / totalInquiries;

      setStats({
        totalInquiries,
        resolvedToday,
        avgResponseTime: Math.round(avgResponseTime),
        satisfactionScore: 4.2
      });
    } catch (error) {
      console.error('載入客戶詢問失敗:', error);
    }
  };

  const generateBotResponse = async (userMessage: string): Promise<BotResponse> => {
    try {
      // 使用真實 AI 分析用戶意圖和情感
      const [sentimentResult, intentResult] = await Promise.all([
        analyzeSentiment(userMessage),
        identifyIntent(userMessage, [
          'return_request', 'order_inquiry', 'usage_question', 
          'complaint', 'pricing', 'general_inquiry'
        ])
      ]);

      // 根據意圖生成回應
      const systemPrompt = `你是一個專業的客戶服務代表，專門為台灣的中小企業提供客戶服務。請根據客戶的問題和情感狀態，提供友善、專業且有用的回應。`;
      
      let prompt = '';
      if (intentResult.intent === 'return_request') {
        prompt = `客戶想要退貨，請提供友善的回應並說明退貨政策。客戶情感：${sentimentResult.sentiment}，信心度：${sentimentResult.confidence}`;
      } else if (intentResult.intent === 'order_inquiry') {
        prompt = `客戶詢問訂單狀態，請提供查詢方式並協助解決。客戶情感：${sentimentResult.sentiment}`;
      } else if (intentResult.intent === 'usage_question') {
        prompt = `客戶詢問產品使用方法，請提供詳細的操作指引。客戶情感：${sentimentResult.sentiment}`;
      } else if (intentResult.intent === 'complaint') {
        prompt = `客戶有抱怨，請表達歉意並提供解決方案。客戶情感：${sentimentResult.sentiment}，需要特別關注。`;
      } else if (intentResult.intent === 'pricing') {
        prompt = `客戶詢問價格，請提供價格資訊並說明價值。客戶情感：${sentimentResult.sentiment}`;
      } else {
        prompt = `客戶有一般詢問，請提供友善的協助。客戶情感：${sentimentResult.sentiment}`;
      }

      const aiResponse = await generateText(prompt, {
        systemPrompt,
        maxTokens: 300,
        temperature: 0.7
      });

      return {
        message: aiResponse.content,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        suggestedActions: ['查看訂單', '聯繫客服', '產品說明'],
        escalateToHuman: sentimentResult.sentiment === 'negative' || intentResult.intent === 'complaint' || userMessage.includes('人工')
      };
    } catch (error) {
      console.error('AI 分析失敗:', error);
      
      // 備用回應邏輯
      const intents = [
        { intent: 'return_request', keywords: ['退貨', '退款', '退錢'] },
        { intent: 'order_inquiry', keywords: ['訂單', '查詢', '什麼時候', '到貨'] },
        { intent: 'usage_question', keywords: ['怎麼用', '使用', '說明', '教學'] },
        { intent: 'complaint', keywords: ['抱怨', '不滿意', '問題', '故障'] },
        { intent: 'pricing', keywords: ['價格', '多少錢', '費用', '收費'] }
      ];

      const matchedIntent = intents.find(i => 
        i.keywords.some(keyword => userMessage.includes(keyword))
      ) || { intent: 'general_inquiry', keywords: [] };

      const responses: Record<string, string> = {
        return_request: '我了解您想要退貨。根據我們的退貨政策，商品在7天內可以無條件退貨。請告訴我您的訂單號碼，我來為您處理。',
        order_inquiry: '我來幫您查詢訂單狀態。請提供您的訂單號碼，我會立即為您確認配送狀況。',
        usage_question: '我很樂意為您說明產品使用方法。請告訴我您遇到什麼具體問題，我會提供詳細的操作指引。',
        complaint: '很抱歉給您帶來不便。我會認真處理您的問題，請詳細描述遇到的情況，我會盡快為您解決。',
        pricing: '關於價格資訊，我可以為您查詢最新的產品價格。請告訴我您感興趣的產品型號。',
        general_inquiry: '您好！我是 AI 客服助理，很高興為您服務。請告訴我您需要什麼協助，我會盡力幫助您。'
      };

      return {
        message: responses[matchedIntent.intent] || responses.general_inquiry,
        intent: matchedIntent.intent,
        confidence: 0.7,
        suggestedActions: ['查看訂單', '聯繫客服', '產品說明'],
        escalateToHuman: matchedIntent.intent === 'complaint' || userMessage.includes('人工')
      };
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeInquiry) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    // 添加用戶消息
    setInquiries(prev => prev.map(inquiry => 
      inquiry.id === activeInquiry.id 
        ? { ...inquiry, messages: [...inquiry.messages, userMessage] }
        : inquiry
    ));

    setNewMessage('');
    setBotTyping(true);

    // 模擬 AI 處理時間
    setTimeout(async () => {
      const botResponse = await generateBotResponse(newMessage);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: botResponse.message,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text',
        intent: botResponse.intent,
        confidence: botResponse.confidence
      };

      // 添加機器人回應
      setInquiries(prev => prev.map(inquiry => 
        inquiry.id === activeInquiry.id 
          ? { ...inquiry, messages: [...inquiry.messages, botMessage] }
          : inquiry
      ));

      setBotTyping(false);

      // 如果需要轉接人工客服
      if (botResponse.escalateToHuman) {
        await sendAlert('warning', '需要人工客服', '客戶詢問需要轉接人工客服處理');
      }
    }, 2000);
  };

  const generateServiceReport = async () => {
    const openInquiries = inquiries.filter(i => i.status === 'open').length;
    const inProgressInquiries = inquiries.filter(i => i.status === 'in_progress').length;
    const resolvedInquiries = inquiries.filter(i => i.status === 'resolved').length;

    const reportContent = `
# 客戶服務報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 服務統計
- 總詢問數：${stats.totalInquiries}
- 今日已解決：${stats.resolvedToday}
- 平均回應時間：${stats.avgResponseTime} 分鐘
- 客戶滿意度：${stats.satisfactionScore}/5.0

## 詢問狀態
- 待處理：${openInquiries}
- 處理中：${inProgressInquiries}
- 已解決：${resolvedInquiries}

## 熱門問題類型
${Object.entries(inquiries.reduce((acc, inquiry) => {
  inquiry.messages.forEach(msg => {
    if (msg.intent) {
      acc[msg.intent] = (acc[msg.intent] || 0) + 1;
    }
  });
  return acc;
}, {} as Record<string, number>)).map(([intent, count]) => `
- ${intent === 'return_request' ? '退貨申請' :
     intent === 'order_inquiry' ? '訂單查詢' :
     intent === 'usage_question' ? '使用問題' :
     intent === 'complaint' ? '投訴' :
     intent === 'pricing' ? '價格諮詢' : '一般詢問'}：${count} 次`).join('\n')}

## AI 客服表現
- 自動回應率：${((resolvedInquiries / stats.totalInquiries) * 100).toFixed(1)}%
- 平均信心度：${(inquiries.reduce((sum, inquiry) => {
  const botMessages = inquiry.messages.filter(m => m.sender === 'bot' && m.confidence);
  return sum + botMessages.reduce((s, m) => s + (m.confidence || 0), 0);
}, 0) / inquiries.reduce((sum, inquiry) => 
  sum + inquiry.messages.filter(m => m.sender === 'bot' && m.confidence).length, 0) * 100).toFixed(1)}%

## 建議改進
${stats.satisfactionScore < 4.0 ? '💡 客戶滿意度有待提升，建議優化回應品質' : 
  stats.avgResponseTime > 5 ? '💡 回應時間較長，建議優化 AI 處理速度' : 
  '✅ 客服表現良好，建議保持現有服務水準'}
    `.trim();

    await generateReport('客戶服務報告', reportContent, 'customer_service');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 客戶服務助理</h3>
          <p className="text-slate-600 mt-1">24/7 智能客服系統，自動回答客戶問題</p>
        </div>
        <button
          onClick={generateServiceReport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          生成報告
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">總詢問數</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalInquiries}</p>
            </div>
            <MessageCircle className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">今日已解決</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.resolvedToday}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均回應時間</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.avgResponseTime}分</p>
            </div>
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">滿意度評分</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.satisfactionScore}/5</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inquiries List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">客戶詢問</h4>
            <div className="space-y-3">
              {inquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  onClick={() => setActiveInquiry(inquiry)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    activeInquiry?.id === inquiry.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-semibold text-slate-900">{inquiry.customerName}</h5>
                    <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(inquiry.priority)}`}>
                      {inquiry.priority === 'urgent' ? '緊急' :
                       inquiry.priority === 'high' ? '高' :
                       inquiry.priority === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{inquiry.subject}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(inquiry.status)}`}>
                      {inquiry.status === 'open' ? '待處理' :
                       inquiry.status === 'in_progress' ? '處理中' :
                       inquiry.status === 'resolved' ? '已解決' : '已關閉'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {inquiry.createdAt.toLocaleString('zh-TW', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          {activeInquiry ? (
            <div className="bg-white rounded-xl border border-slate-200 h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">{activeInquiry.customerName}</h4>
                    <p className="text-sm text-slate-600">{activeInquiry.subject}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-slate-600">AI 客服</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {activeInquiry.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs opacity-75">
                          {message.timestamp.toLocaleTimeString('zh-TW')}
                        </span>
                        {message.confidence && (
                          <span className="text-xs opacity-75">
                            信心度: {(message.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {botTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 text-slate-900 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm">AI 正在思考...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-slate-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="輸入您的問題..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 h-[600px] flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-900 mb-2">選擇客戶詢問</h4>
                <p className="text-slate-600">從左側列表選擇一個客戶詢問開始對話</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export class CustomerServiceBot extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <CustomerServiceBotModule context={context} />;
  }
}
