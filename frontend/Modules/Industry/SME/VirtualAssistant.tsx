/**
 * AI 虚拟助理 - 全方位智能助手
 * 整合行销、客服、FAQ 的综合 AI 解决方案
 */

import { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  TrendingUp, 
  HelpCircle, 
  BarChart3, 
  Users,
  Send,
  Bot,
  Sparkles,
  Settings,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';
import { virtualAssistantService } from '../../../lib/virtual-assistant-service';

const metadata: ModuleMetadata = {
  id: 'virtual-assistant',
  name: 'AI 虚拟助理',
  version: '1.0.0',
  category: 'sme',
  industry: ['sme'],
  description: '整合行销、客服、FAQ 的全方位 AI 助理',
  icon: 'Users',
  author: 'AI Business Platform',
  pricingTier: 'pro',
  features: [
    '智能客服',
    '行销自动化',
    'FAQ 管理',
    '多渠道整合',
    '数据分析'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: false
};

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  category?: 'customer-service' | 'marketing' | 'faq' | 'general';
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  hits: number;
}

type TabType = 'chat' | 'faq' | 'analytics' | 'settings';

export function VirtualAssistantModule({ context }: { context: ModuleContext }) {
  const { state, setRunning, setIdle } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [faqs, setFaqs] = useState<FAQ[]>([]);

  const [stats, setStats] = useState({
    todayMessages: 0,
    satisfaction: 94.5,
    responseTime: 2.3,
    resolution: 87.2
  });

  // 加载初始数据
  useEffect(() => {
    setRunning();
    loadData();
    return () => setIdle();
  }, [context.companyId, setRunning, setIdle]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [messagesData, faqsData, statsData] = await Promise.all([
        virtualAssistantService.getMessages(context.companyId, 50),
        virtualAssistantService.getFAQs(context.companyId),
        virtualAssistantService.getTodayStats(context.companyId)
      ]);

      // 转换消息格式
      const formattedMessages: Message[] = messagesData.map(msg => ({
        id: msg.id,
        type: msg.message_type,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        category: msg.category
      }));

      // 如果没有消息，添加欢迎消息
      if (formattedMessages.length === 0) {
        formattedMessages.push({
          id: 'welcome',
          type: 'assistant',
          content: '您好！我是您的 AI 虚拟助理，可以协助您处理客服、行销和 FAQ 相关问题。请问有什么可以帮您的？',
          timestamp: new Date(),
          category: 'general'
        });
      }

      setMessages(formattedMessages);
      setFaqs(faqsData);
      setStats({
        todayMessages: statsData.total_messages,
        satisfaction: statsData.satisfaction,
        responseTime: statsData.avg_response_time,
        resolution: statsData.resolution_rate
      });
    } catch (err) {
      console.error('Error loading data:', err);
      setError('加载数据失败，请稍后重试');
      // 设置默认欢迎消息
      setMessages([{
        id: 'welcome',
        type: 'assistant',
        content: '您好！我是您的 AI 虚拟助理，可以协助您处理客服、行销和 FAQ 相关问题。请问有什么可以帮您的？',
        timestamp: new Date(),
        category: 'general'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || processing) return;

    const userContent = inputText;
    setInputText('');
    setProcessing(true);

    // 先显示用户消息（乐观更新）
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      type: 'user',
      content: userContent,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      // 调用真实的 AI 服务
      const result = await virtualAssistantService.sendMessage(
        context.companyId,
        context.userId,
        userContent
      );

      // 用真实的消息替换临时消息
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempUserMsg.id);
        return [
          ...filtered,
          {
            id: result.userMessage.id,
            type: 'user',
            content: result.userMessage.content,
            timestamp: new Date(result.userMessage.created_at),
            category: result.userMessage.category
          },
          {
            id: result.assistantMessage.id,
            type: 'assistant',
            content: result.assistantMessage.content,
            timestamp: new Date(result.assistantMessage.created_at),
            category: result.assistantMessage.category
          }
        ];
      });

      // 更新统计数据
      setStats(prev => ({
        ...prev,
        todayMessages: prev.todayMessages + 2
      }));

    } catch (error) {
      console.error('Error sending message:', error);
      // 显示错误消息
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: '抱歉，我暂时无法回应。请稍后再试，或联系人工客服。',
        timestamp: new Date(),
        category: 'general'
      };
      setMessages(prev => [...prev, errorMsg]);
      setError('发送消息失败，请稍后重试');
    } finally {
      setProcessing(false);
    }
  };

  const generateAssistantReport = async () => {
    const reportContent = `
# AI 虚拟助理运营报告
生成时间：${new Date().toLocaleString('zh-CN')}

## 整体表现
- 今日处理消息：${stats.todayMessages} 条
- 客户满意度：${stats.satisfaction}%
- 平均响应时间：${stats.responseTime} 秒
- 问题解决率：${stats.resolution}%

## 热门 FAQ（Top 5）
${faqs.slice(0, 5).map((faq, idx) => `
${idx + 1}. **${faq.question}**
   - 分类：${faq.category}
   - 点击量：${faq.hits} 次
   - 答案：${faq.answer}
`).join('\n')}

## 消息分类统计
- 客户服务：${messages.filter(m => m.category === 'customer-service').length} 条
- 营销相关：${messages.filter(m => m.category === 'marketing').length} 条
- FAQ 查询：${messages.filter(m => m.category === 'faq').length} 条
- 一般咨询：${messages.filter(m => m.category === 'general').length} 条

## 优化建议
1. **提升响应速度**：当前平均 ${stats.responseTime} 秒，建议优化至 2 秒以内
2. **扩充 FAQ 库**：热门问题重复率高，建议增加更多常见问题
3. **智能路由**：复杂问题及时转接人工客服，提升解决率
4. **多渠道整合**：整合社交媒体、邮件、电话等多渠道服务

## 下一步行动
- 优化 AI 模型训练数据
- 建立客户反馈机制
- 实施 A/B 测试优化话术
    `.trim();

    await generateReport('AI 虚拟助理运营报告', reportContent, 'virtual_assistant_report');
  };

  const renderChat = () => (
    <div className="space-y-4">
      {/* Mock Mode Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-amber-800 font-medium">演示模式运行中</p>
          <p className="text-sm text-amber-700 mt-1">
            当前使用模拟数据运行。要启用完整功能（数据持久化、AI 分析），请在 Supabase Dashboard 中执行 migration SQL。
          </p>
          <p className="text-xs text-amber-600 mt-2">
            📄 文件位置：<code className="bg-amber-100 px-1 py-0.5 rounded">supabase/migrations/20251017000000_add_virtual_assistant_tables.sql</code>
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800 font-medium">操作失败</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <MessageCircle className="w-4 h-4" />
            今日消息
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.todayMessages}</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Sparkles className="w-4 h-4" />
            满意度
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.satisfaction}%</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <RefreshCw className="w-4 h-4" />
            响应时间
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.responseTime}s</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <BarChart3 className="w-4 h-4" />
            解决率
          </div>
          <div className="text-2xl font-bold text-purple-600">{stats.resolution}%</div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold">AI 虚拟助理</h4>
              <p className="text-sm text-blue-100">在线 · 实时响应</p>
            </div>
          </div>
        </div>

        <div className="h-96 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-900'
                }`}
              >
                <div className="text-sm">{msg.content}</div>
                <div className={`text-xs mt-1 ${msg.type === 'user' ? 'text-blue-100' : 'text-slate-500'}`}>
                  {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  {msg.category && (
                    <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {msg.category === 'customer-service' ? '客服' :
                       msg.category === 'marketing' ? '营销' :
                       msg.category === 'faq' ? 'FAQ' : '通用'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {processing && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="输入您的问题..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={processing}
            />
            <button
              onClick={handleSendMessage}
              disabled={processing || !inputText.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const [showAddFAQ, setShowAddFAQ] = useState(false);
  const [newFAQ, setNewFAQ] = useState({ question: '', answer: '', category: '客户服务' });
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});

  const handleAddFAQ = async () => {
    if (!newFAQ.question.trim() || !newFAQ.answer.trim()) {
      setError('请填写完整的问题和答案');
      return;
    }

    try {
      const faq = await virtualAssistantService.upsertFAQ(
        context.companyId,
        context.userId,
        {
          question: newFAQ.question,
          answer: newFAQ.answer,
          category: newFAQ.category,
          priority: 5
        }
      );

      setFaqs(prev => [faq, ...prev]);
      setShowAddFAQ(false);
      setNewFAQ({ question: '', answer: '', category: '客户服务' });
      setError(null);
    } catch (err) {
      console.error('Error adding FAQ:', err);
      setError('添加 FAQ 失败，请重试');
    }
  };

  const renderFAQ = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold text-slate-900">常见问题库</h4>
        <button 
          onClick={() => setShowAddFAQ(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
        >
          <span className="text-lg">+</span>
          新增 FAQ
        </button>
      </div>

      {/* 添加 FAQ 对话框 */}
      {showAddFAQ && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
              <h3 className="text-xl font-bold">新增 FAQ</h3>
              <button
                onClick={() => {
                  setShowAddFAQ(false);
                  setNewFAQ({ question: '', answer: '', category: '客户服务' });
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  分类
                </label>
                <select
                  value={newFAQ.category}
                  onChange={(e) => setNewFAQ(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>客户服务</option>
                  <option>售后服务</option>
                  <option>支付问题</option>
                  <option>物流配送</option>
                  <option>发票问题</option>
                  <option>会员服务</option>
                  <option>账户问题</option>
                  <option>订单问题</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  问题 *
                </label>
                <input
                  type="text"
                  value={newFAQ.question}
                  onChange={(e) => setNewFAQ(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="例如：如何退换货？"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  答案 *
                </label>
                <textarea
                  value={newFAQ.answer}
                  onChange={(e) => setNewFAQ(prev => ({ ...prev, answer: e.target.value }))}
                  placeholder="详细回答..."
                  rows={6}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddFAQ(false);
                  setNewFAQ({ question: '', answer: '', category: '客户服务' });
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddFAQ}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                保存 FAQ
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {faqs.map(faq => (
          <div key={faq.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  <h5 className="font-semibold text-slate-900">{faq.question}</h5>
                </div>
                <p className="text-sm text-slate-600 mb-2">{faq.answer}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">{faq.category}</span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {faq.hits} 次查看
                  </span>
                </div>
              </div>
              <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 加载分类统计
  useEffect(() => {
    const loadCategoryStats = async () => {
      try {
        const stats = await virtualAssistantService.getCategoryStats(context.companyId);
        setCategoryStats(stats);
      } catch (err) {
        console.error('Error loading category stats:', err);
      }
    };
    if (!loading) {
      loadCategoryStats();
    }
  }, [context.companyId, loading, messages.length]);

  const renderAnalytics = () => {
    // 计算分类百分比
    const total = Object.values(categoryStats).reduce((sum, count) => sum + count, 0) || 1;
    const categoryPercentages = {
      'customer-service': ((categoryStats['customer-service'] || 0) / total * 100).toFixed(1),
      'marketing': ((categoryStats['marketing'] || 0) / total * 100).toFixed(1),
      'faq': ((categoryStats['faq'] || 0) / total * 100).toFixed(1),
      'general': ((categoryStats['general'] || 0) / total * 100).toFixed(1)
    };

    return (
      <div className="space-y-4">
        <h4 className="text-lg font-bold text-slate-900">数据分析</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h5 className="font-semibold text-slate-900 mb-4">消息分类分布</h5>
            <div className="space-y-3">
              {[
                { label: '客户服务', value: parseFloat(categoryPercentages['customer-service']), color: 'bg-blue-600', key: 'customer-service' },
                { label: '营销咨询', value: parseFloat(categoryPercentages['marketing']), color: 'bg-green-600', key: 'marketing' },
                { label: 'FAQ 查询', value: parseFloat(categoryPercentages['faq']), color: 'bg-purple-600', key: 'faq' },
                { label: '一般咨询', value: parseFloat(categoryPercentages['general']), color: 'bg-slate-600', key: 'general' }
              ].map(item => (
                <div key={item.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{item.label}</span>
                    <span className="font-semibold text-slate-900">
                      {item.value.toFixed(1)}% ({categoryStats[item.key] || 0} 条)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className={`${item.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${item.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                基于最近 7 天的 {total} 条消息统计
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h5 className="font-semibold text-slate-900 mb-4">性能指标</h5>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">客户满意度</span>
                <span className="text-2xl font-bold text-green-600">{stats.satisfaction.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">平均响应时间</span>
                <span className="text-2xl font-bold text-blue-600">{stats.responseTime.toFixed(1)}s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">问题解决率</span>
                <span className="text-2xl font-bold text-purple-600">{stats.resolution.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">今日处理量</span>
                <span className="text-2xl font-bold text-slate-900">{stats.todayMessages}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                <p>💡 满意度基于用户反馈自动计算</p>
                <p className="mt-1">📊 数据每小时更新一次</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ 热门排行 */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h5 className="font-semibold text-slate-900 mb-4">热门 FAQ 排行</h5>
          <div className="space-y-3">
            {faqs.slice(0, 5).map((faq, idx) => (
              <div key={faq.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{faq.question}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{faq.category}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-blue-600">{faq.hits} 次查看</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={generateAssistantReport}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
        >
          <BarChart3 className="w-5 h-5" />
          生成完整分析报告
        </button>
      </div>
    );
  };

  const [assistantConfig, setAssistantConfig] = useState({
    assistant_name: 'AI 虚拟助理',
    welcome_message: '您好！我是您的 AI 虚拟助理，可以协助您处理客服、行销和 FAQ 相关问题。',
    response_speed: 'standard' as 'fast' | 'standard' | 'detailed',
    enable_multichannel: true,
    enable_auto_report: true
  });
  const [savingConfig, setSavingConfig] = useState(false);

  // 加载助理配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await virtualAssistantService.getConfig(context.companyId);
        if (config) {
          setAssistantConfig({
            assistant_name: config.assistant_name,
            welcome_message: config.welcome_message,
            response_speed: config.response_speed,
            enable_multichannel: config.enable_multichannel,
            enable_auto_report: config.enable_auto_report
          });
        }
      } catch (err) {
        console.error('Error loading config:', err);
      }
    };
    loadConfig();
  }, [context.companyId]);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await virtualAssistantService.updateConfig(context.companyId, assistantConfig);
      setError(null);
      // 显示成功提示
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successMsg.textContent = '✅ 设置已保存';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (err) {
      console.error('Error saving config:', err);
      setError('保存设置失败，请重试');
    } finally {
      setSavingConfig(false);
    }
  };

  const renderSettings = () => (
    <div className="space-y-4">
      <h4 className="text-lg font-bold text-slate-900">助理设置</h4>
      
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            助理名称
          </label>
          <input
            type="text"
            value={assistantConfig.assistant_name}
            onChange={(e) => setAssistantConfig(prev => ({ ...prev, assistant_name: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            欢迎语
          </label>
          <textarea
            value={assistantConfig.welcome_message}
            onChange={(e) => setAssistantConfig(prev => ({ ...prev, welcome_message: e.target.value }))}
            rows={3}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            响应速度
          </label>
          <select 
            value={assistantConfig.response_speed}
            onChange={(e) => setAssistantConfig(prev => ({ ...prev, response_speed: e.target.value as any }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="fast">快速（1-2 秒）</option>
            <option value="standard">标准（2-3 秒）</option>
            <option value="detailed">详细（3-5 秒）</option>
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={assistantConfig.enable_multichannel}
              onChange={(e) => setAssistantConfig(prev => ({ ...prev, enable_multichannel: e.target.checked }))}
              className="w-4 h-4 text-blue-600" 
            />
            <span className="text-sm text-slate-700">启用多渠道整合</span>
          </label>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={assistantConfig.enable_auto_report}
              onChange={(e) => setAssistantConfig(prev => ({ ...prev, enable_auto_report: e.target.checked }))}
              className="w-4 h-4 text-blue-600" 
            />
            <span className="text-sm text-slate-700">自动生成日报</span>
          </label>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <button 
            onClick={handleSaveConfig}
            disabled={savingConfig}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {savingConfig ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                保存中...
              </>
            ) : (
              '保存设置'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 虚拟助理</h3>
          <p className="text-slate-600 mt-1">整合客服、营销、FAQ 的全方位智能助手</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            在线运行中
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: 'chat' as TabType, label: '智能对话', icon: MessageCircle },
          { id: 'faq' as TabType, label: 'FAQ 管理', icon: HelpCircle },
          { id: 'analytics' as TabType, label: '数据分析', icon: BarChart3 },
          { id: 'settings' as TabType, label: '设置', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'chat' && renderChat()}
        {activeTab === 'faq' && renderFAQ()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
}

export class VirtualAssistant extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <VirtualAssistantModule context={context} />;
  }
}

