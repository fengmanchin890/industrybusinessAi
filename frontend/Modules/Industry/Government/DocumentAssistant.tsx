/**
 * AI 公文助理 - 智能公文處理系統
 * 為政府機構提供智能公文處理服務
 */

import React, { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, AlertTriangle, Send, Archive } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../Contexts/AuthContext';
import { generateText, summarizeText } from '../../../lib/ai-service';

const metadata: ModuleMetadata = {
  id: 'document-assistant',
  name: 'AI 公文助理',
  version: '1.0.0',
  category: 'government',
  industry: ['government'],
  description: '智能公文處理系統，自動生成回覆建議、摘要公文',
  icon: 'FileText',
  author: 'AI Business Platform',
  pricingTier: 'enterprise',
  features: [
    '公文智能摘要',
    '回覆建議生成',
    '分類歸檔',
    '流程追蹤',
    '合規檢查'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface Document {
  id: string;
  title: string;
  type: 'incoming' | 'outgoing' | 'internal' | 'circular';
  category: 'policy' | 'budget' | 'personnel' | 'procurement' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sender: string;
  recipient: string;
  content: string;
  attachments: string[];
  receivedDate: Date;
  dueDate?: Date;
  status: 'pending' | 'processing' | 'reviewed' | 'approved' | 'sent' | 'archived';
  assignedTo?: string;
  aiSummary?: string;
  aiReply?: string;
  workflow: WorkflowStep[];
}

interface WorkflowStep {
  id: string;
  name: string;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  completedAt?: Date;
  comments?: string;
}

interface AIAnalysis {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  suggestedReply: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  estimatedProcessingTime: number;
}

export function DocumentAssistantModule({ context }: { context: ModuleContext }) {
  const { state, setRunning, setIdle } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  const { company } = useAuth();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    processedToday: 0,
    avgProcessingTime: 0,
    efficiencyRate: 0
  });

  // 模擬公文數據
  const mockDocuments: Document[] = [
    {
      id: 'D001',
      title: '關於推動數位政府服務優化計畫',
      type: 'incoming',
      category: 'policy',
      priority: 'high',
      sender: '行政院數位發展部',
      recipient: '各縣市政府',
      content: `主旨：為提升政府服務效率，推動數位轉型，請各縣市政府配合執行數位政府服務優化計畫。

說明：
一、依據行政院「數位國家‧創新經濟發展方案」辦理。
二、為提升民眾對政府服務的滿意度，請各縣市政府：
   (一) 建置一站式服務平台
   (二) 推動無紙化辦公
   (三) 加強資安防護措施
   (四) 培訓數位人才

三、請於三個月內提報執行計畫，並定期回報進度。

四、本計畫所需經費由中央補助百分之五十。

請查照。`,
      attachments: ['數位政府服務優化計畫.pdf', '經費補助辦法.docx'],
      receivedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'processing',
      assignedTo: '資訊局',
      workflow: [
        { id: 'W001', name: '收文登記', assignedTo: '文書組', status: 'completed', completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { id: 'W002', name: '分文處理', assignedTo: '資訊局', status: 'in_progress' },
        { id: 'W003', name: '研擬回覆', assignedTo: '資訊局', status: 'pending' },
        { id: 'W004', name: '核稿', assignedTo: '秘書長', status: 'pending' },
        { id: 'W005', name: '發文', assignedTo: '文書組', status: 'pending' }
      ]
    },
    {
      id: 'D002',
      title: '年度預算編列說明',
      type: 'internal',
      category: 'budget',
      priority: 'urgent',
      sender: '主計處',
      recipient: '各局處',
      content: `主旨：請各局處配合辦理112年度預算編列作業。

說明：
一、依據「預算法」及「中央政府總預算編製辦法」辦理。
二、請各局處於本月底前完成預算編列：
   (一) 人事費用預算
   (二) 業務費用預算
   (三) 資本支出預算
   (四) 其他費用預算

三、預算編列原則：
   (一) 撙節開支，提高效率
   (二) 優先編列必要支出
   (三) 配合政策推動

四、請於期限內提報預算書。

請配合辦理。`,
      attachments: ['預算編列表格.xlsx', '編列說明.pdf'],
      receivedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'pending',
      assignedTo: '主計處',
      workflow: [
        { id: 'W006', name: '收文登記', assignedTo: '文書組', status: 'completed', completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        { id: 'W007', name: '分文處理', assignedTo: '主計處', status: 'pending' },
        { id: 'W008', name: '預算審查', assignedTo: '主計處', status: 'pending' },
        { id: 'W009', name: '核稿', assignedTo: '市長', status: 'pending' }
      ]
    },
    {
      id: 'D003',
      title: '民眾陳情案件處理',
      type: 'incoming',
      category: 'general',
      priority: 'medium',
      sender: '民眾 陳先生',
      recipient: '市長室',
      content: `主旨：陳情本市某路段交通問題

說明：
一、本市中山路與中正路交叉口交通號誌設置不當，經常造成交通壅塞。
二、建議事項：
   (一) 調整號誌時相
   (二) 增設左轉專用道
   (三) 加強交通疏導

三、希望相關單位能儘速改善，以維護用路人安全。

請查照。`,
      attachments: [],
      receivedDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
      status: 'reviewed',
      assignedTo: '交通局',
      aiSummary: '民眾陳情中山路與中正路交叉口交通問題，建議調整號誌時相及增設左轉專用道',
      aiReply: '感謝您的陳情，本府已轉請交通局研議改善方案，將於一個月內回覆處理結果。',
      workflow: [
        { id: 'W010', name: '收文登記', assignedTo: '文書組', status: 'completed', completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
        { id: 'W011', name: '分文處理', assignedTo: '交通局', status: 'completed', completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        { id: 'W012', name: '研擬回覆', assignedTo: '交通局', status: 'completed', completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000) },
        { id: 'W013', name: '核稿', assignedTo: '秘書長', status: 'pending' },
        { id: 'W014', name: '發文', assignedTo: '文書組', status: 'pending' }
      ]
    }
  ];

  useEffect(() => {
    loadDocuments();
  }, [company?.id]);

  const loadDocuments = async () => {
    try {
      setDocuments(mockDocuments);
      
      setStats({
        totalDocuments: mockDocuments.length,
        processedToday: mockDocuments.filter(d => d.status === 'reviewed' || d.status === 'sent').length,
        avgProcessingTime: 2.5,
        efficiencyRate: 85
      });
    } catch (error) {
      console.error('載入公文失敗:', error);
    }
  };

  const analyzeDocument = async (document: Document) => {
    setAnalyzing(true);
    setSelectedDocument(document);
    setRunning();
    
    try {
      // 使用 AI 分析公文
      const systemPrompt = `你是一個專業的政府公文處理專家，專門協助政府機構處理公文。請根據公文內容進行分析，提供摘要、重點、建議回覆等。`;
      
      const prompt = `
請分析以下公文：

標題：${document.title}
類型：${document.type === 'incoming' ? '來文' :
       document.type === 'outgoing' ? '去文' :
       document.type === 'internal' ? '內部文' : '通函'}
類別：${document.category === 'policy' ? '政策' :
       document.category === 'budget' ? '預算' :
       document.category === 'personnel' ? '人事' :
       document.category === 'procurement' ? '採購' : '一般'}
發文者：${document.sender}
收文者：${document.recipient}
內容：
${document.content}

請提供以下分析：
1. 公文摘要
2. 關鍵重點
3. 待辦事項
4. 建議回覆
5. 緊急程度評估
6. 預估處理時間

請以 JSON 格式回應：
{
  "summary": "公文摘要",
  "keyPoints": ["重點1", "重點2"],
  "actionItems": ["待辦1", "待辦2"],
  "suggestedReply": "建議回覆內容",
  "urgencyLevel": "low/medium/high/urgent",
  "category": "建議分類",
  "estimatedProcessingTime": 預估天數
}
      `;

      const aiResponse = await generateText(prompt, {
        systemPrompt,
        maxTokens: 1000,
        temperature: 0.3
      });

      try {
        // 使用 aiResponse.text 而不是 aiResponse.content
        const responseText = aiResponse.text || aiResponse.content || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        
        if (!analysis) {
          throw new Error('No JSON found in response');
        }
        
        // 更新公文分析結果
        setDocuments(prev => prev.map(doc => 
          doc.id === document.id 
            ? { 
                ...doc, 
                aiSummary: analysis.summary,
                aiReply: analysis.suggestedReply,
                status: 'reviewed'
              }
            : doc
        ));

        await sendAlert('info', '公文分析完成', `公文「${document.title}」分析完成，緊急程度：${analysis.urgencyLevel}`);
        
      } catch (parseError) {
        console.error('AI 分析結果解析失敗:', parseError);
        
        // 備用分析結果
        const fallbackSummary = await summarizeText(document.content, 100);
        
        setDocuments(prev => prev.map(doc => 
          doc.id === document.id 
            ? { 
                ...doc, 
                aiSummary: fallbackSummary,
                aiReply: '感謝來文，本府將依相關規定辦理。',
                status: 'reviewed'
              }
            : doc
        ));
      }
      
    } catch (error) {
      console.error('公文分析失敗:', error);
      await sendAlert('warning', '公文分析失敗', '無法完成公文分析，請手動處理');
    } finally {
      setAnalyzing(false);
      setIdle();
    }
  };

  const approveDocument = async (documentId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, status: 'approved' } : doc
    ));
    
    await sendAlert('success', '公文已核准', `公文 ${documentId} 已核准`);
  };

  const sendDocument = async (documentId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, status: 'sent' } : doc
    ));
    
    await sendAlert('success', '公文已發送', `公文 ${documentId} 已發送`);
  };

  const archiveDocument = async (documentId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, status: 'archived' } : doc
    ));
    
    await sendAlert('info', '公文已歸檔', `公文 ${documentId} 已歸檔`);
  };

  const generateDocumentReport = async () => {
    const processedDocuments = documents.filter(d => d.status === 'reviewed' || d.status === 'sent');
    const pendingDocuments = documents.filter(d => d.status === 'pending');
    const urgentDocuments = documents.filter(d => d.priority === 'urgent');
    
    const reportContent = `
# 公文處理報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 處理總覽
- 總公文數：${stats.totalDocuments}
- 今日已處理：${stats.processedToday}
- 平均處理時間：${stats.avgProcessingTime} 天
- 處理效率：${stats.efficiencyRate}%

## 公文狀態
- 待處理：${pendingDocuments.length}
- 處理中：${documents.filter(d => d.status === 'processing').length}
- 已審核：${documents.filter(d => d.status === 'reviewed').length}
- 已核准：${documents.filter(d => d.status === 'approved').length}
- 已發送：${documents.filter(d => d.status === 'sent').length}
- 已歸檔：${documents.filter(d => d.status === 'archived').length}

## 緊急公文
${urgentDocuments.length === 0 ? '✅ 目前無緊急公文' : urgentDocuments.map(doc => `
### ${doc.title}
- 發文者：${doc.sender}
- 收文者：${doc.recipient}
- 狀態：${doc.status === 'pending' ? '待處理' :
         doc.status === 'processing' ? '處理中' :
         doc.status === 'reviewed' ? '已審核' :
         doc.status === 'approved' ? '已核准' :
         doc.status === 'sent' ? '已發送' : '已歸檔'}
- 截止日期：${doc.dueDate ? doc.dueDate.toLocaleDateString('zh-TW') : '無'}
- 指派給：${doc.assignedTo || '未指派'}
`).join('\n')}

## 公文分類統計
${Object.entries(documents.reduce((acc, doc) => {
  acc[doc.category] = (acc[doc.category] || 0) + 1;
  return acc;
}, {} as Record<string, number>)).map(([category, count]) => `
- ${category === 'policy' ? '政策' :
     category === 'budget' ? '預算' :
     category === 'personnel' ? '人事' :
     category === 'procurement' ? '採購' : '一般'}：${count} 份`).join('\n')}

## 工作流程進度
${documents.map(doc => `
### ${doc.title}
${doc.workflow.map(step => `
- ${step.name} (${step.assignedTo}): ${step.status === 'completed' ? '✅ 已完成' :
                                      step.status === 'in_progress' ? '🔄 進行中' :
                                      step.status === 'rejected' ? '❌ 已駁回' : '⏳ 待處理'}
`).join('')}
`).join('\n')}

## AI 分析結果
${processedDocuments.map(doc => `
### ${doc.title}
- AI 摘要：${doc.aiSummary || '無'}
- AI 建議回覆：${doc.aiReply || '無'}
- 處理狀態：${doc.status === 'reviewed' ? '已審核' :
             doc.status === 'approved' ? '已核准' :
             doc.status === 'sent' ? '已發送' : '處理中'}
`).join('\n')}

## 效率分析
- 平均處理時間：${stats.avgProcessingTime} 天
- 處理效率：${stats.efficiencyRate}%
- AI 輔助率：${processedDocuments.length > 0 ? ((processedDocuments.filter(d => d.aiSummary).length / processedDocuments.length) * 100).toFixed(1) : 0}%

## 建議改進
${pendingDocuments.length > 0 ? '💡 有公文待處理，建議加快處理速度' :
  urgentDocuments.length > 0 ? '🚨 有緊急公文需要立即處理' :
  '✅ 公文處理狀況良好'}

## AI 建議
${stats.efficiencyRate < 80 ? '💡 處理效率偏低，建議優化工作流程' :
  stats.avgProcessingTime > 5 ? '💡 處理時間較長，建議加強人力配置' :
  '✅ 公文處理系統運行良好'}
    `.trim();

    await generateReport('公文處理報告', reportContent, 'document');
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
      case 'pending': return 'bg-slate-100 text-slate-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'reviewed': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'sent': return 'bg-purple-100 text-purple-700';
      case 'archived': return 'bg-gray-100 text-gray-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 公文助理</h3>
          <p className="text-slate-600 mt-1">智能公文處理系統，自動生成回覆建議</p>
        </div>
        <button
          onClick={generateDocumentReport}
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
              <p className="text-sm text-slate-600">總公文數</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalDocuments}</p>
            </div>
            <FileText className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">今日已處理</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.processedToday}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均處理時間</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.avgProcessingTime}天</p>
            </div>
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">處理效率</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.efficiencyRate}%</p>
            </div>
            <Archive className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents List */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">公文列表</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {documents.map((document) => (
                <div
                  key={document.id}
                  onClick={() => setSelectedDocument(document)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedDocument?.id === document.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-semibold text-slate-900">{document.title}</h5>
                      <p className="text-sm text-slate-600">
                        {document.type === 'incoming' ? '來文' :
                         document.type === 'outgoing' ? '去文' :
                         document.type === 'internal' ? '內部文' : '通函'} | 
                        {document.category === 'policy' ? '政策' :
                         document.category === 'budget' ? '預算' :
                         document.category === 'personnel' ? '人事' :
                         document.category === 'procurement' ? '採購' : '一般'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(document.priority)}`}>
                        {document.priority === 'urgent' ? '緊急' :
                         document.priority === 'high' ? '高' :
                         document.priority === 'medium' ? '中' : '低'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(document.status)}`}>
                        {document.status === 'pending' ? '待處理' :
                         document.status === 'processing' ? '處理中' :
                         document.status === 'reviewed' ? '已審核' :
                         document.status === 'approved' ? '已核准' :
                         document.status === 'sent' ? '已發送' : '已歸檔'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      <span>{document.sender}</span>
                      {document.dueDate && (
                        <span className="ml-2">截止: {document.dueDate.toLocaleDateString('zh-TW')}</span>
                      )}
                    </div>
                    {document.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          analyzeDocument(document);
                        }}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        開始分析
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Document Details */}
        <div>
          {selectedDocument ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-slate-900">
                  {selectedDocument.title}
                </h4>
                <div className="flex gap-2">
                  {selectedDocument.status === 'reviewed' && (
                    <button
                      onClick={() => approveDocument(selectedDocument.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      核准
                    </button>
                  )}
                  {selectedDocument.status === 'approved' && (
                    <button
                      onClick={() => sendDocument(selectedDocument.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      發送
                    </button>
                  )}
                  {selectedDocument.status === 'sent' && (
                    <button
                      onClick={() => archiveDocument(selectedDocument.id)}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                    >
                      歸檔
                    </button>
                  )}
                </div>
              </div>

              {analyzing ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-600">AI 正在分析公文...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-slate-700">發文者：</span>
                      <span className="text-slate-600">{selectedDocument.sender}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">收文者：</span>
                      <span className="text-slate-600">{selectedDocument.recipient}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">收文日期：</span>
                      <span className="text-slate-600">{selectedDocument.receivedDate.toLocaleDateString('zh-TW')}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">截止日期：</span>
                      <span className="text-slate-600">{selectedDocument.dueDate?.toLocaleDateString('zh-TW') || '無'}</span>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">公文內容</h5>
                    <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 whitespace-pre-wrap">
                      {selectedDocument.content}
                    </div>
                  </div>

                  {selectedDocument.aiSummary && (
                    <div>
                      <h5 className="font-semibold text-slate-900 mb-2">AI 摘要</h5>
                      <div className="bg-blue-50 p-4 rounded-lg text-sm text-slate-700">
                        {selectedDocument.aiSummary}
                      </div>
                    </div>
                  )}

                  {selectedDocument.aiReply && (
                    <div>
                      <h5 className="font-semibold text-slate-900 mb-2">AI 建議回覆</h5>
                      <div className="bg-green-50 p-4 rounded-lg text-sm text-slate-700">
                        {selectedDocument.aiReply}
                      </div>
                    </div>
                  )}

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">工作流程</h5>
                    <div className="space-y-2">
                      {selectedDocument.workflow.map((step) => (
                        <div key={step.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <span className="font-medium text-slate-900">{step.name}</span>
                            <span className="text-sm text-slate-600 ml-2">({step.assignedTo})</span>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs ${
                            step.status === 'completed' ? 'bg-green-100 text-green-700' :
                            step.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            step.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {step.status === 'completed' ? '已完成' :
                             step.status === 'in_progress' ? '進行中' :
                             step.status === 'rejected' ? '已駁回' : '待處理'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-900 mb-2">選擇公文</h4>
                <p className="text-slate-600">從左側列表選擇一個公文開始處理</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export class DocumentAssistant extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <DocumentAssistantModule context={context} />;
  }
}
