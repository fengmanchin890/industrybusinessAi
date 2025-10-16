/**
 * AI 市民服務系統 - 智能市民服務與諮詢
 * 為政府機構提供智能市民服務
 */

import React, { useState, useEffect } from 'react';
import { Users, MessageCircle, Clock, CheckCircle, AlertTriangle, Phone } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../Contexts/AuthContext';
import { generateText, analyzeSentiment } from '../../../lib/ai-service';

const metadata: ModuleMetadata = {
  id: 'citizen-service',
  name: 'AI 市民服務系統',
  version: '1.0.0',
  category: 'government',
  industry: ['government'],
  description: '智能市民服務與諮詢，提供24小時線上服務',
  icon: 'Users',
  author: 'AI Business Platform',
  pricingTier: 'enterprise',
  features: [
    '智能客服',
    '服務預約',
    '問題分類',
    '情緒分析',
    '服務追蹤'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface ServiceRequest {
  id: string;
  citizenId: string;
  citizenName: string;
  contactInfo: string;
  serviceType: 'consultation' | 'complaint' | 'application' | 'inquiry' | 'appointment';
  category: 'social_welfare' | 'tax' | 'housing' | 'education' | 'healthcare' | 'business' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  status: 'new' | 'processing' | 'resolved' | 'closed';
  assignedTo?: string;
  response?: string;
  satisfaction?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ServiceStats {
  totalRequests: number;
  resolvedToday: number;
  avgResponseTime: number;
  satisfactionRate: number;
  pendingRequests: number;
}

export function CitizenServiceModule({ context }: { context: ModuleContext }) {
  const { state, setRunning, setIdle } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  const { company } = useAuth();
  
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState<ServiceStats>({
    totalRequests: 0,
    resolvedToday: 0,
    avgResponseTime: 0,
    satisfactionRate: 0,
    pendingRequests: 0
  });

  // 模擬服務請求數據
  const mockRequests: ServiceRequest[] = [
    {
      id: 'SR001',
      citizenId: 'C001',
      citizenName: '王小明',
      contactInfo: '0912-345-678',
      serviceType: 'consultation',
      category: 'social_welfare',
      priority: 'medium',
      description: '請問如何申請低收入戶補助？需要準備哪些文件？',
      status: 'processing',
      assignedTo: '服務員A',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
      id: 'SR002',
      citizenId: 'C002',
      citizenName: '李美華',
      contactInfo: '0987-654-321',
      serviceType: 'complaint',
      category: 'housing',
      priority: 'high',
      description: '住家附近道路施工噪音過大，影響生活品質，希望相關單位處理',
      status: 'new',
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: 'SR003',
      citizenId: 'C003',
      citizenName: '陳志強',
      contactInfo: '0911-222-333',
      serviceType: 'application',
      category: 'business',
      priority: 'urgent',
      description: '申請營業登記證，需要了解申請流程和所需文件',
      status: 'resolved',
      assignedTo: '服務員B',
      response: '已提供完整申請流程和文件清單，請至工商服務處辦理',
      satisfaction: 5,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
    }
  ];

  useEffect(() => {
    loadRequests();
  }, [company?.id]);

  const loadRequests = async () => {
    try {
      setRequests(mockRequests);
      
      setStats({
        totalRequests: mockRequests.length,
        resolvedToday: mockRequests.filter(r => r.status === 'resolved').length,
        avgResponseTime: 2.5,
        satisfactionRate: 4.2,
        pendingRequests: mockRequests.filter(r => r.status === 'new' || r.status === 'processing').length
      });
    } catch (error) {
      console.error('載入服務請求失敗:', error);
    }
  };

  const processRequest = async (request: ServiceRequest) => {
    setProcessing(true);
    setSelectedRequest(request);
    setRunning();
    
    try {
      // 使用 AI 分析服務請求
      const systemPrompt = `你是一個專業的政府服務人員，專門處理市民服務請求。請根據請求內容提供專業、友善的回覆建議。`;
      
      const prompt = `
請處理以下市民服務請求：

請求類型：${request.serviceType === 'consultation' ? '諮詢' :
           request.serviceType === 'complaint' ? '投訴' :
           request.serviceType === 'application' ? '申請' :
           request.serviceType === 'inquiry' ? '查詢' : '預約'}

服務類別：${request.category === 'social_welfare' ? '社會福利' :
           request.category === 'tax' ? '稅務' :
           request.category === 'housing' ? '住宅' :
           request.category === 'education' ? '教育' :
           request.category === 'healthcare' ? '醫療' :
           request.category === 'business' ? '工商' : '一般'}

優先級：${request.priority === 'urgent' ? '緊急' :
         request.priority === 'high' ? '高' :
         request.priority === 'medium' ? '中' : '低'}

請求內容：${request.description}

請提供：
1. 專業回覆建議
2. 後續處理步驟
3. 相關聯繫方式
4. 預估處理時間

請以 JSON 格式回應：
{
  "response": "專業回覆內容",
  "nextSteps": ["步驟1", "步驟2"],
  "contactInfo": "相關聯繫方式",
  "estimatedTime": "預估處理時間",
  "priority": "low/medium/high/urgent"
}
      `;

      const aiResponse = await generateText(prompt, {
        systemPrompt,
        maxTokens: 800,
        temperature: 0.3
      });

      try {
        const analysis = JSON.parse(aiResponse.content);
        
        // 更新請求狀態
        const updatedRequest = {
          ...request,
          status: 'processing' as const,
          assignedTo: 'AI 服務系統',
          response: analysis.response,
          updatedAt: new Date()
        };

        setRequests(prev => prev.map(req => 
          req.id === request.id ? updatedRequest : req
        ));

        await sendAlert('info', '服務請求已處理', `請求 ${request.id} 已開始處理`);
        
      } catch (parseError) {
        console.error('AI 回應解析失敗:', parseError);
        
        // 備用回覆
        const fallbackResponse = `感謝您的服務請求，我們已收到您的${request.serviceType === 'consultation' ? '諮詢' : '請求'}，將盡快為您處理。`;
        
        const updatedRequest = {
          ...request,
          status: 'processing' as const,
          assignedTo: 'AI 服務系統',
          response: fallbackResponse,
          updatedAt: new Date()
        };

        setRequests(prev => prev.map(req => 
          req.id === request.id ? updatedRequest : req
        ));
      }
      
    } catch (error) {
      console.error('處理服務請求失敗:', error);
      await sendAlert('warning', '處理失敗', '無法處理服務請求，請手動處理');
    } finally {
      setProcessing(false);
      setIdle();
    }
  };

  const resolveRequest = async (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, status: 'resolved', updatedAt: new Date() }
        : req
    ));
    
    await sendAlert('success', '請求已解決', `服務請求 ${requestId} 已解決`);
  };

  const generateServiceReport = async () => {
    const resolvedRequests = requests.filter(r => r.status === 'resolved');
    const pendingRequests = requests.filter(r => r.status === 'new' || r.status === 'processing');
    const highPriorityRequests = requests.filter(r => r.priority === 'high' || r.priority === 'urgent');
    
    const reportContent = `
# 市民服務報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 服務總覽
- 總請求數：${stats.totalRequests}
- 今日已解決：${stats.resolvedToday}
- 平均回應時間：${stats.avgResponseTime} 小時
- 滿意度：${stats.satisfactionRate}/5
- 待處理：${stats.pendingRequests}

## 請求統計
- 已解決：${resolvedRequests.length}
- 處理中：${requests.filter(r => r.status === 'processing').length}
- 新請求：${requests.filter(r => r.status === 'new').length}
- 高優先級：${highPriorityRequests.length}

## 服務類型分析
${Object.entries(requests.reduce((acc, req) => {
  acc[req.serviceType] = (acc[req.serviceType] || 0) + 1;
  return acc;
}, {} as Record<string, number>)).map(([type, count]) => `
- ${type === 'consultation' ? '諮詢' :
     type === 'complaint' ? '投訴' :
     type === 'application' ? '申請' :
     type === 'inquiry' ? '查詢' : '預約'}：${count} 件`).join('\n')}

## 類別分析
${Object.entries(requests.reduce((acc, req) => {
  acc[req.category] = (acc[req.category] || 0) + 1;
  return acc;
}, {} as Record<string, number>)).map(([category, count]) => `
- ${category === 'social_welfare' ? '社會福利' :
     category === 'tax' ? '稅務' :
     category === 'housing' ? '住宅' :
     category === 'education' ? '教育' :
     category === 'healthcare' ? '醫療' :
     category === 'business' ? '商業' : '一般'}：${count} 件`).join('\n')}

## 高優先級請求
${highPriorityRequests.length === 0 ? '✅ 目前無高優先級請求' : highPriorityRequests.map(req => `
### 請求 ${req.id}
- 市民：${req.citizenName}
- 類型：${req.serviceType === 'consultation' ? '諮詢' :
         req.serviceType === 'complaint' ? '投訴' :
         req.serviceType === 'application' ? '申請' :
         req.serviceType === 'inquiry' ? '查詢' : '預約'}
- 類別：${req.category === 'social_welfare' ? '社會福利' :
         req.category === 'tax' ? '稅務' :
         req.category === 'housing' ? '住宅' :
         req.category === 'education' ? '教育' :
         req.category === 'healthcare' ? '醫療' :
         req.category === 'business' ? '工商' : '一般'}
- 優先級：${req.priority === 'urgent' ? '🔴 緊急' :
           req.priority === 'high' ? '🟠 高' : '🟡 中'}
- 狀態：${req.status === 'new' ? '🆕 新請求' :
         req.status === 'processing' ? '🔄 處理中' :
         req.status === 'resolved' ? '✅ 已解決' : '📁 已關閉'}
- 描述：${req.description}
- 建立時間：${req.createdAt.toLocaleString('zh-TW')}
`).join('\n')}

## 待處理請求
${pendingRequests.length === 0 ? '✅ 目前無待處理請求' : pendingRequests.map(req => `
### 請求 ${req.id}
- 市民：${req.citizenName}
- 類型：${req.serviceType === 'consultation' ? '諮詢' :
         req.serviceType === 'complaint' ? '投訴' :
         req.serviceType === 'application' ? '申請' :
         req.serviceType === 'inquiry' ? '查詢' : '預約'}
- 優先級：${req.priority === 'urgent' ? '🔴 緊急' :
           req.priority === 'high' ? '🟠 高' :
           req.priority === 'medium' ? '🟡 中' : '🟢 低'}
- 描述：${req.description}
- 建立時間：${req.createdAt.toLocaleString('zh-TW')}
`).join('\n')}

## 服務品質分析
- 平均回應時間：${stats.avgResponseTime} 小時
- 滿意度評分：${stats.satisfactionRate}/5
- 解決率：${stats.totalRequests > 0 ? ((resolvedRequests.length / stats.totalRequests) * 100).toFixed(1) : 0}%

## 建議措施
${pendingRequests.length > 0 ? '💡 有請求待處理，建議加快處理速度' :
  highPriorityRequests.length > 0 ? '🚨 有高優先級請求需要立即處理' :
  '✅ 服務狀況良好'}

## AI 建議
${stats.avgResponseTime > 4 ? '💡 回應時間較長，建議優化處理流程' :
  stats.satisfactionRate < 4 ? '💡 滿意度偏低，建議改善服務品質' :
  '✅ 服務系統運行良好'}
    `.trim();

    await generateReport('市民服務報告', reportContent, 'citizen_service');
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
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'processing': return 'bg-yellow-100 text-yellow-700';
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
          <h3 className="text-2xl font-bold text-slate-900">AI 市民服務系統</h3>
          <p className="text-slate-600 mt-1">智能市民服務與諮詢，提供24小時線上服務</p>
        </div>
        <button
          onClick={generateServiceReport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          生成報告
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">總請求數</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalRequests}</p>
            </div>
            <Users className="w-10 h-10 text-blue-600" />
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
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.avgResponseTime}時</p>
            </div>
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">滿意度</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.satisfactionRate}/5</p>
            </div>
            <MessageCircle className="w-10 h-10 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">待處理</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.pendingRequests}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Requests */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">服務請求</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {requests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedRequest?.id === request.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-semibold text-slate-900">{request.citizenName}</h5>
                      <p className="text-sm text-slate-600">
                        {request.serviceType === 'consultation' ? '諮詢' :
                         request.serviceType === 'complaint' ? '投訴' :
                         request.serviceType === 'application' ? '申請' :
                         request.serviceType === 'inquiry' ? '查詢' : '預約'} | 
                        {request.category === 'social_welfare' ? '社會福利' :
                         request.category === 'tax' ? '稅務' :
                         request.category === 'housing' ? '住宅' :
                         request.category === 'education' ? '教育' :
                         request.category === 'healthcare' ? '醫療' :
                         request.category === 'business' ? '工商' : '一般'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(request.priority)}`}>
                        {request.priority === 'urgent' ? '緊急' :
                         request.priority === 'high' ? '高' :
                         request.priority === 'medium' ? '中' : '低'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(request.status)}`}>
                        {request.status === 'new' ? '新請求' :
                         request.status === 'processing' ? '處理中' :
                         request.status === 'resolved' ? '已解決' : '已關閉'}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 mb-2">
                    <p>{request.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {request.createdAt.toLocaleDateString('zh-TW')}
                    </span>
                    {request.status === 'new' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          processRequest(request);
                        }}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        開始處理
                      </button>
                    )}
                    {request.status === 'processing' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resolveRequest(request.id);
                        }}
                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                      >
                        標記解決
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Request Details */}
        <div>
          {selectedRequest ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-slate-900">
                  請求詳情 - {selectedRequest.citizenName}
                </h4>
                <div className={`px-3 py-1 rounded ${getPriorityColor(selectedRequest.priority)}`}>
                  <span className="text-sm font-medium">
                    {selectedRequest.priority === 'urgent' ? '緊急' :
                     selectedRequest.priority === 'high' ? '高' :
                     selectedRequest.priority === 'medium' ? '中' : '低'}
                  </span>
                </div>
              </div>

              {processing ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-600">AI 正在處理請求...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">請求資訊</h5>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                      <p><span className="font-medium">請求ID：</span>{selectedRequest.id}</p>
                      <p><span className="font-medium">市民姓名：</span>{selectedRequest.citizenName}</p>
                      <p><span className="font-medium">聯絡方式：</span>{selectedRequest.contactInfo}</p>
                      <p><span className="font-medium">服務類型：</span>
                        {selectedRequest.serviceType === 'consultation' ? '諮詢' :
                         selectedRequest.serviceType === 'complaint' ? '投訴' :
                         selectedRequest.serviceType === 'application' ? '申請' :
                         selectedRequest.serviceType === 'inquiry' ? '查詢' : '預約'}
                      </p>
                      <p><span className="font-medium">服務類別：</span>
                        {selectedRequest.category === 'social_welfare' ? '社會福利' :
                         selectedRequest.category === 'tax' ? '稅務' :
                         selectedRequest.category === 'housing' ? '住宅' :
                         selectedRequest.category === 'education' ? '教育' :
                         selectedRequest.category === 'healthcare' ? '醫療' :
                         selectedRequest.category === 'business' ? '工商' : '一般'}
                      </p>
                      <p><span className="font-medium">狀態：</span>
                        {selectedRequest.status === 'new' ? '新請求' :
                         selectedRequest.status === 'processing' ? '處理中' :
                         selectedRequest.status === 'resolved' ? '已解決' : '已關閉'}
                      </p>
                      <p><span className="font-medium">建立時間：</span>{selectedRequest.createdAt.toLocaleString('zh-TW')}</p>
                      {selectedRequest.assignedTo && (
                        <p><span className="font-medium">指派給：</span>{selectedRequest.assignedTo}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">請求內容</h5>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-slate-700">{selectedRequest.description}</p>
                    </div>
                  </div>

                  {selectedRequest.response && (
                    <div>
                      <h5 className="font-semibold text-slate-900 mb-2">AI 回覆</h5>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-slate-700">{selectedRequest.response}</p>
                      </div>
                    </div>
                  )}

                  {selectedRequest.satisfaction && (
                    <div>
                      <h5 className="font-semibold text-slate-900 mb-2">滿意度評分</h5>
                      <div className="flex items-center gap-2">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-6 h-6 rounded-full ${
                              i < selectedRequest.satisfaction! 
                                ? 'bg-yellow-400' 
                                : 'bg-slate-200'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-slate-600">
                          {selectedRequest.satisfaction}/5
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-900 mb-2">選擇服務請求</h4>
                <p className="text-slate-600">從左側列表選擇一個請求查看詳情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export class CitizenService extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <CitizenServiceModule context={context} />;
  }
}
