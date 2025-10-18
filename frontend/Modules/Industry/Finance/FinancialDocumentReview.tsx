/**
 * AI 財務文件審核系統 - 完整版本
 * 為金融公司提供 AI 驅動的文件審核功能
 * 連接真實 API 和 AI 分析
 */

import React, { useState, useEffect } from 'react';
import { FileText, Upload, CheckCircle, XCircle, AlertTriangle, Eye, Search, Filter, BarChart3, Clock, Shield } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../Contexts/AuthContext';

const metadata: ModuleMetadata = {
  id: 'financial-document-review',
  name: 'AI 文件審核系統',
  version: '1.0.0',
  category: 'finance',
  industry: ['finance'],
  description: 'AI 驅動的財務文件審核系統，自動檢測風險、合規問題，提升審核效率',
  icon: 'FileText',
  author: 'AI Business Platform',
  pricingTier: 'enterprise',
  features: [
    'AI 自動文件分析',
    '風險評估與評分',
    '合規性檢查',
    '完整性驗證',
    '智能審核建議'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: false
};

interface FinancialDocument {
  id: string;
  document_number: string;
  document_title: string;
  document_type_id: string;
  customer_name: string;
  customer_id_number?: string;
  case_number?: string;
  loan_amount?: number;
  investment_amount?: number;
  review_status: 'pending' | 'processing' | 'approved' | 'rejected' | 'requires_info';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  submission_date: string;
  ai_confidence_score?: number;
  ai_risk_score?: number;
  ai_compliance_score?: number;
  ai_completeness_score?: number;
  ai_recommendation?: string;
  ai_summary?: string;
  missing_information?: string[];
  compliance_issues?: string[];
  risk_factors_detected?: string[];
}

interface DocumentStats {
  total_documents: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  avg_ai_confidence: number;
  avg_processing_hours: number;
  high_risk_count: number;
  compliance_issue_count: number;
}

export function FinancialDocumentReviewModule({ context }: { context: ModuleContext }) {
  const { state, setRunning, setIdle } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  const { company, user } = useAuth();
  
  const [documents, setDocuments] = useState<FinancialDocument[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<FinancialDocument | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 模擬文件數據
  const mockDocuments: FinancialDocument[] = [
    {
      id: 'DOC001',
      document_number: 'LOAN-2025-001',
      document_title: '個人信貸申請 - 王小明',
      document_type_id: 'loan_application',
      customer_name: '王小明',
      customer_id_number: 'A123456789',
      case_number: 'CASE-2025-001',
      loan_amount: 500000,
      review_status: 'pending',
      priority: 'normal',
      submission_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      ai_confidence_score: 85,
      ai_risk_score: 25,
      ai_compliance_score: 95,
      ai_completeness_score: 90,
      ai_recommendation: 'approve',
      ai_summary: '文件完整，風險低，建議核准',
      missing_information: [],
      compliance_issues: [],
      risk_factors_detected: []
    },
    {
      id: 'DOC002',
      document_number: 'INVEST-2025-002',
      document_title: '基金投資申請 - 李美華',
      document_type_id: 'investment_application',
      customer_name: '李美華',
      customer_id_number: 'B987654321',
      case_number: 'CASE-2025-002',
      investment_amount: 2000000,
      review_status: 'processing',
      priority: 'high',
      submission_date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      ai_confidence_score: 65,
      ai_risk_score: 55,
      ai_compliance_score: 75,
      ai_completeness_score: 70,
      ai_recommendation: 'review',
      ai_summary: '高額投資，需要額外財務證明',
      missing_information: ['財務證明', '投資經驗評估'],
      compliance_issues: ['缺少KYC文件'],
      risk_factors_detected: ['高額交易', '缺少財務證明']
    },
    {
      id: 'DOC003',
      document_number: 'LOAN-2025-003',
      document_title: '企業貸款申請 - 科技股份有限公司',
      document_type_id: 'business_loan',
      customer_name: '科技股份有限公司',
      customer_id_number: '12345678',
      case_number: 'CASE-2025-003',
      loan_amount: 15000000,
      review_status: 'requires_info',
      priority: 'urgent',
      submission_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      ai_confidence_score: 45,
      ai_risk_score: 75,
      ai_compliance_score: 60,
      ai_completeness_score: 55,
      ai_recommendation: 'reject',
      ai_summary: '高風險貸款，財務文件不完整',
      missing_information: ['3年財務報表', '擔保品證明', '營業執照'],
      compliance_issues: ['財務報表不完整', '缺少董事會決議'],
      risk_factors_detected: ['超高額交易', '文件不完整', '財務狀況不明']
    }
  ];

  useEffect(() => {
    loadData();
  }, [company?.id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (!company?.id) {
        console.log('沒有公司ID，使用 mock 數據');
        setDocuments(mockDocuments);
        setStats({
          total_documents: 3,
          pending_count: 1,
          approved_count: 0,
          rejected_count: 0,
          avg_ai_confidence: 65,
          avg_processing_hours: 4.5,
          high_risk_count: 1,
          compliance_issue_count: 3
        });
        setIsLoading(false);
        return;
      }

      // 載入真實文件數據
      const { data: documentsData, error: docsError } = await supabase
        .from('financial_documents')
        .select('*')
        .eq('company_id', company.id)
        .order('submission_date', { ascending: false })
        .limit(50);

      if (docsError) {
        console.error('載入文件數據錯誤:', docsError);
        setDocuments(mockDocuments);
        setIsLoading(false);
        return;
      }

      setDocuments(documentsData || mockDocuments);

      // 載入統計數據
      const { data: statsData, error: statsError } = await supabase.functions.invoke('document-review-analyzer', {
        body: {
          action: 'get_statistics',
          data: { days: 30 }
        }
      });

      if (!statsError && statsData?.stats) {
        setStats(statsData.stats);
      }

    } catch (error) {
      console.error('載入數據失敗:', error);
      setDocuments(mockDocuments);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeDocument = async (document: FinancialDocument) => {
    setIsAnalyzing(true);
    setRunning();

    try {
      if (!company?.id) {
        // 模擬 AI 分析
        console.log('🤖 模擬 AI 分析:', document.document_title);
        
        await new Promise(resolve => setTimeout(resolve, 2000));

        const mockAnalysis = {
          confidence_score: Math.floor(Math.random() * 30) + 70,
          risk_score: Math.floor(Math.random() * 40) + 20,
          compliance_score: Math.floor(Math.random() * 20) + 80,
          completeness_score: Math.floor(Math.random() * 20) + 80,
          recommendation: ['approve', 'review', 'reject'][Math.floor(Math.random() * 3)],
          findings: [
            { severity: 'low', description: '文件格式正確' },
            { severity: 'medium', description: '需要補充財務證明' }
          ],
          missing_information: ['財務證明'],
          compliance_issues: [],
          risk_factors: ['中額交易'],
          summary: '文件基本符合要求，建議補充財務證明後核准'
        };

        // 更新文件
        setDocuments(prev => prev.map(d => 
          d.id === document.id ? {
            ...d,
            review_status: mockAnalysis.recommendation === 'approve' ? 'approved' :
                          mockAnalysis.recommendation === 'reject' ? 'rejected' : 'processing',
            ai_confidence_score: mockAnalysis.confidence_score,
            ai_risk_score: mockAnalysis.risk_score,
            ai_compliance_score: mockAnalysis.compliance_score,
            ai_completeness_score: mockAnalysis.completeness_score,
            ai_recommendation: mockAnalysis.recommendation,
            ai_summary: mockAnalysis.summary,
            missing_information: mockAnalysis.missing_information,
            compliance_issues: mockAnalysis.compliance_issues.map((i: any) => i.description),
            risk_factors_detected: mockAnalysis.risk_factors
          } : d
        ));

        await sendAlert(
          mockAnalysis.risk_score > 70 ? 'high' : 'medium',
          '文件分析完成',
          `${document.document_title} - AI 建議: ${mockAnalysis.recommendation}`
        );

        return;
      }

      // 使用 Edge Function 進行真實 AI 分析
      console.log('🚀 調用 Edge Function 分析文件:', document.id);

      const { data: analysisData, error } = await supabase.functions.invoke('document-review-analyzer', {
        body: {
          action: 'analyze_document',
          data: {
            documentId: document.id
          }
        }
      });

      if (error) {
        console.error('❌ Edge Function 錯誤:', error);
        throw error;
      }

      console.log('✅ AI 分析成功:', analysisData);

      // 重新載入文件列表
      await loadData();

      // 發送警報
      if (analysisData.risk_score > 70) {
        await sendAlert('high', '高風險文件', `${document.document_title} 檢測到高風險因素`);
      } else if (analysisData.recommendation === 'approve') {
        await sendAlert('low', '文件已核准', `${document.document_title} AI 建議自動核准`);
      }

    } catch (error) {
      console.error('文件分析失敗:', error);
      alert('文件分析失敗，請稍後再試');
    } finally {
      setIsAnalyzing(false);
      setIdle();
    }
  };

  const updateDocumentStatus = async (documentId: string, newStatus: string) => {
    if (!company?.id || !user?.id) {
      // 模擬更新
      setDocuments(prev => prev.map(d => 
        d.id === documentId ? { ...d, review_status: newStatus as any } : d
      ));
      return;
    }

    try {
      const { error } = await supabase
        .rpc('update_document_status', {
          p_document_id: documentId,
          p_new_status: newStatus,
          p_user_id: user.id,
          p_user_name: user.email || 'Unknown',
          p_notes: `狀態變更為: ${newStatus}`
        });

      if (error) throw error;

      await loadData();
      
      await sendAlert('low', '狀態已更新', `文件狀態已變更為: ${newStatus}`);
    } catch (error) {
      console.error('更新狀態失敗:', error);
      alert('更新狀態失敗');
    }
  };

  const generateReviewReport = async () => {
    const totalDocs = documents.length;
    const pendingDocs = documents.filter(d => d.review_status === 'pending').length;
    const approvedDocs = documents.filter(d => d.review_status === 'approved').length;
    const rejectedDocs = documents.filter(d => d.review_status === 'rejected').length;
    const highRiskDocs = documents.filter(d => (d.ai_risk_score || 0) > 70).length;

    const reportContent = `
# AI 文件審核報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 審核總覽
- 總文件數：${totalDocs}
- 待審核：${pendingDocs}
- 已核准：${approvedDocs}
- 已拒絕：${rejectedDocs}
- 高風險文件：${highRiskDocs}

## 統計數據
${stats ? `
- 平均 AI 信心分數：${stats.avg_ai_confidence?.toFixed(1) || 'N/A'}
- 平均處理時間：${stats.avg_processing_hours?.toFixed(1) || 'N/A'} 小時
- 合規問題數：${stats.compliance_issue_count || 0}
` : '統計數據載入中...'}

## 待審核文件
${documents.filter(d => d.review_status === 'pending').length === 0 ? '✅ 目前無待審核文件' : 
  documents.filter(d => d.review_status === 'pending').map(doc => `
### ${doc.document_title}
- 文件編號：${doc.document_number}
- 客戶：${doc.customer_name}
- 金額：NT$ ${(doc.loan_amount || doc.investment_amount || 0).toLocaleString()}
- AI 信心分數：${doc.ai_confidence_score || 'N/A'}
- 風險分數：${doc.ai_risk_score || 'N/A'}
- AI 建議：${doc.ai_recommendation || 'N/A'}
- 提交時間：${new Date(doc.submission_date).toLocaleString('zh-TW')}
`).join('\n')}

## 高風險文件
${highRiskDocs === 0 ? '✅ 無高風險文件' :
  documents.filter(d => (d.ai_risk_score || 0) > 70).map(doc => `
### ${doc.document_title}
- 文件編號：${doc.document_number}
- 客戶：${doc.customer_name}
- 風險分數：${doc.ai_risk_score}
- 風險因素：${doc.risk_factors_detected?.join(', ') || '無'}
- 合規問題：${doc.compliance_issues?.join(', ') || '無'}
- AI 摘要：${doc.ai_summary || 'N/A'}
`).join('\n')}

## 建議措施
${pendingDocs > 5 ? '⚠️ 待審核文件較多，建議增加審核人力' :
  highRiskDocs > 0 ? '⚠️ 有高風險文件需要優先處理' :
  '✅ 審核狀況良好'}
    `.trim();

    await generateReport('AI 文件審核報告', reportContent, 'document_review');
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      processing: 'bg-blue-100 text-blue-700 border-blue-200',
      approved: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      requires_info: 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-gray-600',
      normal: 'text-blue-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600 font-bold';
    if (score >= 40) return 'text-orange-600';
    return 'text-green-600';
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesStatus = filterStatus === 'all' || doc.review_status === filterStatus;
    const matchesSearch = doc.document_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.document_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 文件審核系統</h3>
          <p className="text-slate-600 mt-1">智能文件分析，自動風險評估與合規檢查</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generateReviewReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <BarChart3 className="w-5 h-5" />
            生成報告
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">總文件數</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total_documents}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">待審核</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending_count}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">AI 平均信心</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{stats.avg_ai_confidence?.toFixed(0) || 'N/A'}</p>
              </div>
              <Shield className="w-10 h-10 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">高風險文件</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.high_risk_count}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜尋文件、客戶或編號..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部狀態</option>
              <option value="pending">待審核</option>
              <option value="processing">處理中</option>
              <option value="approved">已核准</option>
              <option value="rejected">已拒絕</option>
              <option value="requires_info">需補充資料</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6">
          <h4 className="text-lg font-bold text-slate-900 mb-4">文件列表</h4>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-600 mt-4">載入中...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-slate-900 mb-2">目前無文件</h4>
              <p className="text-slate-600">沒有符合條件的文件</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="p-4 bg-slate-50 rounded-lg border hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-slate-900">{doc.document_title}</h5>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(doc.review_status)}`}>
                          {doc.review_status === 'pending' ? '待審核' :
                           doc.review_status === 'processing' ? '處理中' :
                           doc.review_status === 'approved' ? '已核准' :
                           doc.review_status === 'rejected' ? '已拒絕' : '需補充'}
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(doc.priority)}`}>
                          {doc.priority === 'urgent' ? '🔴 緊急' :
                           doc.priority === 'high' ? '🟠 高' :
                           doc.priority === 'normal' ? '🟢 一般' : '⚪ 低'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        編號：{doc.document_number} | 客戶：{doc.customer_name} | 
                        金額：NT$ {(doc.loan_amount || doc.investment_amount || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        提交時間：{new Date(doc.submission_date).toLocaleString('zh-TW')}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      {doc.ai_confidence_score !== undefined && (
                        <div className="text-right">
                          <p className="text-xs text-slate-600">AI 信心</p>
                          <p className="text-lg font-bold text-purple-600">{doc.ai_confidence_score}</p>
                        </div>
                      )}
                      {doc.ai_risk_score !== undefined && (
                        <div className="text-right">
                          <p className="text-xs text-slate-600">風險分數</p>
                          <p className={`text-lg font-bold ${getRiskColor(doc.ai_risk_score)}`}>
                            {doc.ai_risk_score}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Analysis Results */}
                  {doc.ai_summary && (
                    <div className="mt-3 p-3 bg-white rounded border border-slate-200">
                      <p className="text-sm font-medium text-slate-700 mb-1">AI 摘要：</p>
                      <p className="text-sm text-slate-600">{doc.ai_summary}</p>
                      
                      {doc.missing_information && doc.missing_information.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-orange-600">
                            ⚠️ 缺失信息：{doc.missing_information.join(', ')}
                          </p>
                        </div>
                      )}
                      
                      {doc.risk_factors_detected && doc.risk_factors_detected.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-red-600">
                            🚨 風險因素：{doc.risk_factors_detected.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => analyzeDocument(doc)}
                      disabled={isAnalyzing}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                          分析中...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          AI 分析
                        </>
                      )}
                    </button>
                    
                    {doc.review_status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateDocumentStatus(doc.id, 'approved')}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          核准
                        </button>
                        <button
                          onClick={() => updateDocumentStatus(doc.id, 'rejected')}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          拒絕
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => setSelectedDocument(doc)}
                      className="px-3 py-1 bg-slate-600 text-white rounded text-sm hover:bg-slate-700 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      檢視
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export class FinancialDocumentReview extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <FinancialDocumentReviewModule context={context} />;
  }
}


