/**
 * AI 文件審核系統 - 智能合約與申請書審核
 * 為金融機構提供智能文件審核服務
 */

import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, Clock, AlertTriangle, Eye } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../Contexts/AuthContext';
import { generateText, analyzeData } from '../../../lib/ai-service';

const metadata: ModuleMetadata = {
  id: 'document-review',
  name: 'AI 文件審核系統',
  version: '1.0.0',
  category: 'finance',
  industry: ['finance'],
  description: '智能合約與申請書審核，自動識別風險條款和合規問題',
  icon: 'FileText',
  author: 'AI Business Platform',
  pricingTier: 'enterprise',
  features: [
    '智能文件解析',
    '風險條款識別',
    '合規性檢查',
    '自動摘要生成',
    '審核建議'
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
  type: 'contract' | 'application' | 'agreement' | 'policy' | 'report';
  category: 'loan' | 'insurance' | 'investment' | 'compliance' | 'legal';
  content: string;
  uploadDate: Date;
  status: 'pending' | 'processing' | 'reviewed' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  reviewResult?: DocumentReview;
}

interface DocumentReview {
  id: string;
  documentId: string;
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceScore: number;
  issues: ReviewIssue[];
  recommendations: string[];
  summary: string;
  reviewedAt: Date;
  reviewedBy: string;
}

interface ReviewIssue {
  id: string;
  type: 'risk' | 'compliance' | 'legal' | 'financial' | 'operational';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  suggestion: string;
  status: 'open' | 'resolved' | 'ignored';
}

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
}

export function DocumentReviewModule({ context }: { context: ModuleContext }) {
  const { state, setRunning } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  const { company } = useAuth();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    reviewedToday: 0,
    avgReviewTime: 0,
    complianceRate: 0
  });

  // 模擬文件數據
  const mockDocuments: Document[] = [
    {
      id: 'D001',
      title: '房屋貸款合約',
      type: 'contract',
      category: 'loan',
      content: `甲方：台灣銀行
乙方：王小明

第一條 貸款金額
甲方同意向乙方提供新台幣五百萬元整之房屋貸款。

第二條 利率
年利率為百分之二點五，採機動利率計息。

第三條 還款方式
乙方應按月分期償還本息，共計三百六十期。

第四條 擔保品
乙方應提供位於台北市信義區之不動產作為擔保。

第五條 違約條款
如乙方逾期未還款，甲方得要求提前清償全部債務。

第六條 其他約定
本合約未盡事宜，依相關法令規定辦理。`,
      uploadDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'reviewed',
      priority: 'high',
      assignedTo: '審核員A',
      reviewResult: {
        id: 'R001',
        documentId: 'D001',
        overallScore: 85,
        riskLevel: 'medium',
        complianceScore: 90,
        issues: [
          {
            id: 'I001',
            type: 'risk',
            severity: 'medium',
            description: '違約條款過於嚴苛',
            location: '第五條',
            suggestion: '建議調整違約條款，給予適當寬限期',
            status: 'open'
          }
        ],
        recommendations: ['建議調整違約條款', '增加寬限期規定'],
        summary: '整體合約結構完整，但違約條款需要調整',
        reviewedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        reviewedBy: 'AI 審核系統'
      }
    },
    {
      id: 'D002',
      title: '保險申請書',
      type: 'application',
      category: 'insurance',
      content: `申請人：李美華
身分證字號：A123456789
申請險種：終身壽險
保額：新台幣一百萬元
受益人：陳志強

健康狀況聲明：
1. 過去五年內無重大疾病
2. 無家族遺傳病史
3. 目前無服用任何藥物

職業：會計師
年收入：新台幣八十萬元

聲明事項：
本人聲明以上資料均屬實，如有虛偽不實，願負法律責任。`,
      uploadDate: new Date(Date.now() - 1 * 60 * 60 * 1000),
      status: 'processing',
      priority: 'medium',
      assignedTo: '審核員B'
    },
    {
      id: 'D003',
      title: '投資協議書',
      type: 'agreement',
      category: 'investment',
      content: `投資方：ABC投資公司
被投資方：XYZ科技股份有限公司

第一條 投資金額
投資方同意投資新台幣一千萬元。

第二條 股權比例
投資方取得被投資方百分之二十股權。

第三條 投資條件
1. 被投資方應達成年度營收目標
2. 被投資方應維持財務透明度
3. 投資方享有董事會席次

第四條 退出機制
投資方得於三年後要求被投資方回購股權。

第五條 保密條款
雙方應保守商業機密。`,
      uploadDate: new Date(Date.now() - 30 * 60 * 1000),
      status: 'pending',
      priority: 'urgent'
    }
  ];

  // 合規規則
  const complianceRules: ComplianceRule[] = [
    {
      id: 'R001',
      name: '利率上限檢查',
      description: '檢查貸款利率是否符合法規上限',
      category: 'loan',
      severity: 'critical',
      keywords: ['利率', '年利率', '利息']
    },
    {
      id: 'R002',
      name: '違約條款合理性',
      description: '檢查違約條款是否過於嚴苛',
      category: 'contract',
      severity: 'high',
      keywords: ['違約', '提前清償', '逾期']
    },
    {
      id: 'R003',
      name: '健康狀況聲明',
      description: '檢查保險申請的健康狀況聲明完整性',
      category: 'insurance',
      severity: 'medium',
      keywords: ['健康狀況', '疾病', '家族病史']
    },
    {
      id: 'R004',
      name: '投資條件明確性',
      description: '檢查投資條件是否明確具體',
      category: 'investment',
      severity: 'high',
      keywords: ['投資條件', '營收目標', '財務透明度']
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
        reviewedToday: mockDocuments.filter(d => d.status === 'reviewed').length,
        avgReviewTime: 15,
        complianceRate: 85
      });
    } catch (error) {
      console.error('載入文件失敗:', error);
    }
  };

  const reviewDocument = async (document: Document) => {
    setReviewing(true);
    setSelectedDocument(document);
    setRunning();
    
    try {
      // 使用 AI 審核文件
      const systemPrompt = `你是一個專業的金融文件審核專家，專門審核合約、申請書等金融文件。請根據文件內容進行詳細審核，識別風險、合規問題並提供建議。`;
      
      const prompt = `
請審核以下金融文件：

文件標題：${document.title}
文件類型：${document.type}
文件類別：${document.category}
文件內容：
${document.content}

請進行以下審核：
1. 整體風險評估 (0-100分)
2. 合規性檢查 (0-100分)
3. 識別具體問題和風險
4. 提供改進建議
5. 生成審核摘要

請以 JSON 格式回應：
{
  "overallScore": 0-100,
  "riskLevel": "low/medium/high/critical",
  "complianceScore": 0-100,
  "issues": [
    {
      "type": "risk/compliance/legal/financial/operational",
      "severity": "low/medium/high/critical",
      "description": "問題描述",
      "location": "問題位置",
      "suggestion": "建議改進"
    }
  ],
  "recommendations": ["建議1", "建議2"],
  "summary": "審核摘要"
}
      `;

      const aiResponse = await generateText(prompt, {
        systemPrompt,
        maxTokens: 1500,
        temperature: 0.3
      });

      try {
        const reviewData = JSON.parse(aiResponse.content);
        
        const reviewResult: DocumentReview = {
          id: `R${Date.now()}`,
          documentId: document.id,
          overallScore: reviewData.overallScore,
          riskLevel: reviewData.riskLevel,
          complianceScore: reviewData.complianceScore,
          issues: reviewData.issues.map((issue: any, index: number) => ({
            id: `I${Date.now()}_${index}`,
            type: issue.type,
            severity: issue.severity,
            description: issue.description,
            location: issue.location,
            suggestion: issue.suggestion,
            status: 'open' as const
          })),
          recommendations: reviewData.recommendations,
          summary: reviewData.summary,
          reviewedAt: new Date(),
          reviewedBy: 'AI 審核系統'
        };

        // 更新文件狀態
        setDocuments(prev => prev.map(doc => 
          doc.id === document.id 
            ? { ...doc, status: 'reviewed', reviewResult }
            : doc
        ));

        // 如果有高風險問題，發送警示
        if (reviewData.riskLevel === 'critical' || reviewData.riskLevel === 'high') {
          await sendAlert('warning', '文件審核警示', `文件「${document.title}」存在高風險問題`);
        }
        
        await sendAlert('info', '文件審核完成', `文件「${document.title}」審核完成，風險等級：${reviewData.riskLevel}`);
        
      } catch (parseError) {
        console.error('AI 審核結果解析失敗:', parseError);
        
        // 備用審核結果
        const fallbackReview: DocumentReview = {
          id: `R${Date.now()}`,
          documentId: document.id,
          overallScore: 75,
          riskLevel: 'medium',
          complianceScore: 80,
          issues: [
            {
              id: `I${Date.now()}`,
              type: 'compliance',
              severity: 'medium',
              description: '需要進一步人工審核',
              location: '全文',
              suggestion: '建議人工複審',
              status: 'open'
            }
          ],
          recommendations: ['建議人工複審'],
          summary: '文件需要進一步人工審核',
          reviewedAt: new Date(),
          reviewedBy: 'AI 審核系統'
        };

        setDocuments(prev => prev.map(doc => 
          doc.id === document.id 
            ? { ...doc, status: 'reviewed', reviewResult: fallbackReview }
            : doc
        ));
      }
      
    } catch (error) {
      console.error('文件審核失敗:', error);
      await sendAlert('warning', '文件審核失敗', '無法完成文件審核，請手動處理');
    } finally {
      setReviewing(false);
      setIdle();
    }
  };

  const approveDocument = async (documentId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, status: 'approved' } : doc
    ));
    
    await sendAlert('success', '文件已核准', `文件 ${documentId} 已核准`);
  };

  const rejectDocument = async (documentId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, status: 'rejected' } : doc
    ));
    
    await sendAlert('warning', '文件已駁回', `文件 ${documentId} 已駁回`);
  };

  const resolveIssue = async (documentId: string, issueId: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === documentId && doc.reviewResult) {
        const updatedIssues = doc.reviewResult.issues.map(issue =>
          issue.id === issueId ? { ...issue, status: 'resolved' as const } : issue
        );
        return {
          ...doc,
          reviewResult: { ...doc.reviewResult, issues: updatedIssues }
        };
      }
      return doc;
    }));
    
    await sendAlert('info', '問題已解決', `文件 ${documentId} 的問題 ${issueId} 已解決`);
  };

  const generateReviewReport = async () => {
    const reviewedDocuments = documents.filter(d => d.status === 'reviewed');
    const approvedDocuments = documents.filter(d => d.status === 'approved');
    const rejectedDocuments = documents.filter(d => d.status === 'rejected');
    const pendingDocuments = documents.filter(d => d.status === 'pending');
    
    const reportContent = `
# 文件審核報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 審核總覽
- 總文件數：${stats.totalDocuments}
- 今日已審核：${stats.reviewedToday}
- 平均審核時間：${stats.avgReviewTime} 分鐘
- 合規率：${stats.complianceRate}%

## 文件狀態
- 待審核：${pendingDocuments.length}
- 已審核：${reviewedDocuments.length}
- 已核准：${approvedDocuments.length}
- 已駁回：${rejectedDocuments.length}

## 審核結果詳情
${reviewedDocuments.map(doc => `
### ${doc.title}
- 類型：${doc.type === 'contract' ? '合約' :
         doc.type === 'application' ? '申請書' :
         doc.type === 'agreement' ? '協議書' :
         doc.type === 'policy' ? '保單' : '報告'}
- 類別：${doc.category === 'loan' ? '貸款' :
         doc.category === 'insurance' ? '保險' :
         doc.category === 'investment' ? '投資' :
         doc.category === 'compliance' ? '合規' : '法律'}
- 優先級：${doc.priority === 'urgent' ? '🔴 緊急' :
           doc.priority === 'high' ? '🟠 高' :
           doc.priority === 'medium' ? '🟡 中' : '🟢 低'}
- 整體評分：${doc.reviewResult?.overallScore}/100
- 風險等級：${doc.reviewResult?.riskLevel === 'critical' ? '🔴 緊急' :
             doc.reviewResult?.riskLevel === 'high' ? '🟠 高' :
             doc.reviewResult?.riskLevel === 'medium' ? '🟡 中' : '🟢 低'}
- 合規評分：${doc.reviewResult?.complianceScore}/100
- 問題數量：${doc.reviewResult?.issues.length || 0}
- 審核摘要：${doc.reviewResult?.summary || '無'}
- 審核時間：${doc.reviewResult?.reviewedAt.toLocaleString('zh-TW')}
`).join('\n')}

## 問題統計
${reviewedDocuments.reduce((acc, doc) => {
  if (doc.reviewResult) {
    doc.reviewResult.issues.forEach(issue => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
    });
  }
  return acc;
}, {} as Record<string, number>)

## 風險分析
${reviewedDocuments.filter(d => d.reviewResult?.riskLevel === 'critical' || d.reviewResult?.riskLevel === 'high').length > 0 ? `
- 高風險文件：${reviewedDocuments.filter(d => d.reviewResult?.riskLevel === 'critical' || d.reviewResult?.riskLevel === 'high').length} 份
- 需要立即關注的文件：${reviewedDocuments.filter(d => d.reviewResult?.riskLevel === 'critical' || d.reviewResult?.riskLevel === 'high').map(d => d.title).join(', ')}
` : '✅ 目前無高風險文件'}

## 合規檢查結果
${reviewedDocuments.filter(d => d.reviewResult && d.reviewResult.complianceScore < 80).length > 0 ? `
- 合規問題文件：${reviewedDocuments.filter(d => d.reviewResult && d.reviewResult.complianceScore < 80).length} 份
- 需要改進的文件：${reviewedDocuments.filter(d => d.reviewResult && d.reviewResult.complianceScore < 80).map(d => d.title).join(', ')}
` : '✅ 所有文件合規性良好'}

## 建議措施
${pendingDocuments.length > 0 ? '💡 有文件待審核，建議加快審核速度' :
  reviewedDocuments.filter(d => d.reviewResult?.riskLevel === 'critical' || d.reviewResult?.riskLevel === 'high').length > 0 ? '🚨 有高風險文件需要立即處理' :
  '✅ 文件審核狀況良好'}

## AI 建議
${stats.complianceRate < 80 ? '💡 合規率偏低，建議加強文件審核標準' :
  stats.avgReviewTime > 20 ? '💡 審核時間較長，建議優化審核流程' :
  '✅ 審核系統運行良好'}
    `.trim();

    await generateReport('文件審核報告', reportContent, 'document_review');
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
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 文件審核系統</h3>
          <p className="text-slate-600 mt-1">智能合約與申請書審核，自動識別風險條款</p>
        </div>
        <button
          onClick={generateReviewReport}
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
              <p className="text-sm text-slate-600">總文件數</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalDocuments}</p>
            </div>
            <FileText className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">今日已審核</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.reviewedToday}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均審核時間</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.avgReviewTime}分</p>
            </div>
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">合規率</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.complianceRate}%</p>
            </div>
            <Eye className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents List */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">文件列表</h4>
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
                        {document.type === 'contract' ? '合約' :
                         document.type === 'application' ? '申請書' :
                         document.type === 'agreement' ? '協議書' :
                         document.type === 'policy' ? '保單' : '報告'} | 
                        {document.category === 'loan' ? '貸款' :
                         document.category === 'insurance' ? '保險' :
                         document.category === 'investment' ? '投資' :
                         document.category === 'compliance' ? '合規' : '法律'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(document.priority)}`}>
                        {document.priority === 'urgent' ? '緊急' :
                         document.priority === 'high' ? '高' :
                         document.priority === 'medium' ? '中' : '低'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(document.status)}`}>
                        {document.status === 'pending' ? '待審核' :
                         document.status === 'processing' ? '處理中' :
                         document.status === 'reviewed' ? '已審核' :
                         document.status === 'approved' ? '已核准' : '已駁回'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {document.uploadDate.toLocaleDateString('zh-TW')}
                    </span>
                    {document.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          reviewDocument(document);
                        }}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        開始審核
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Review Results */}
        <div>
          {selectedDocument ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-slate-900">
                  {selectedDocument.title} - 審核結果
                </h4>
                {selectedDocument.reviewResult && (
                  <div className={`px-3 py-1 rounded ${getRiskColor(selectedDocument.reviewResult.riskLevel)}`}>
                    <span className="text-sm font-medium">
                      {selectedDocument.reviewResult.riskLevel === 'critical' ? '緊急' :
                       selectedDocument.reviewResult.riskLevel === 'high' ? '高' :
                       selectedDocument.reviewResult.riskLevel === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                )}
              </div>

              {reviewing ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-600">AI 正在審核文件...</p>
                </div>
              ) : selectedDocument.reviewResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">整體評分</p>
                      <p className="text-2xl font-bold text-slate-900">{selectedDocument.reviewResult.overallScore}/100</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">合規評分</p>
                      <p className="text-2xl font-bold text-slate-900">{selectedDocument.reviewResult.complianceScore}/100</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">審核摘要</h5>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                      {selectedDocument.reviewResult.summary}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">發現問題</h5>
                    <div className="space-y-2">
                      {selectedDocument.reviewResult.issues.map((issue) => (
                        <div key={issue.id} className="p-3 bg-slate-50 rounded-lg border">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-slate-900">{issue.description}</p>
                              <p className="text-sm text-slate-600">位置: {issue.location}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className={`px-2 py-1 rounded text-xs ${getRiskColor(issue.severity)}`}>
                                {issue.severity === 'critical' ? '緊急' :
                                 issue.severity === 'high' ? '高' :
                                 issue.severity === 'medium' ? '中' : '低'}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                issue.status === 'open' ? 'bg-red-100 text-red-700' :
                                issue.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {issue.status === 'open' ? '未解決' :
                                 issue.status === 'resolved' ? '已解決' : '已忽略'}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">建議: {issue.suggestion}</p>
                          {issue.status === 'open' && (
                            <button
                              onClick={() => resolveIssue(selectedDocument.id, issue.id)}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                            >
                              標記為已解決
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">建議措施</h5>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {selectedDocument.reviewResult.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => approveDocument(selectedDocument.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                      核准
                    </button>
                    <button
                      onClick={() => rejectDocument(selectedDocument.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4" />
                      駁回
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">選擇文件進行審核</h4>
                  <p className="text-slate-600">從左側列表選擇文件開始 AI 審核</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-900 mb-2">選擇文件</h4>
                <p className="text-slate-600">從左側列表選擇一個文件開始審核</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export class DocumentReview extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <DocumentReviewModule context={context} />;
  }
}
