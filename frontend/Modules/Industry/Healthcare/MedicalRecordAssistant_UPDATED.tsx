/**
 * AI 病歷助理 - 智能病歷分析與摘要
 * 為醫療機構提供病歷智能分析服務
 */

import React, { useState, useEffect } from 'react';
import { FileText, Stethoscope, AlertTriangle, Clock, User, Calendar, RefreshCw } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';
import { useAuth } from '../../../Contexts/AuthContext';
import { medicalRecordService, type MedicalRecord as DBMedicalRecord, type AIAnalysis } from '../../../lib/medical-record-service';

const metadata: ModuleMetadata = {
  id: 'medical-record-assistant',
  name: 'AI 病歷助理',
  version: '1.0.0',
  category: 'healthcare',
  industry: ['healthcare'],
  description: '智能病歷分析與摘要，協助醫師快速理解病患狀況',
  icon: 'FileText',
  author: 'AI Business Platform',
  pricingTier: 'pro',
  features: [
    '病歷智能摘要',
    '症狀分析',
    '診斷建議',
    '藥物交互作用檢查',
    '風險評估'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

export function MedicalRecordAssistantModule({ context }: { context: ModuleContext }) {
  const { state, setRunning, setIdle } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  const { company } = useAuth();
  
  const [records, setRecords] = useState<DBMedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DBMedicalRecord | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalRecords: 0,
    analyzedToday: 0,
    avgAnalysisTime: 0,
    accuracyRate: 0
  });

  // 載入數據
  useEffect(() => {
    setRunning();
    loadData();
    return () => setIdle();
  }, [context.companyId, setRunning, setIdle]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 並行載入病歷和統計數據
      const [recordsData, statsData] = await Promise.all([
        medicalRecordService.getMedicalRecords(context.companyId),
        medicalRecordService.getStats(context.companyId)
      ]);

      setRecords(recordsData);
      setStats({
        totalRecords: statsData.total_records,
        analyzedToday: statsData.analyzed_today,
        avgAnalysisTime: statsData.avg_analysis_time,
        accuracyRate: statsData.accuracy_rate
      });
    } catch (err) {
      console.error('Error loading data:', err);
      setError('載入數據失敗');
    } finally {
      setLoading(false);
    }
  };

  const analyzeRecord = async (record: DBMedicalRecord) => {
    setAnalyzing(true);
    setSelectedRecord(record);
    setError(null);
    
    try {
      // 先檢查是否已有分析結果
      let existingAnalysis = await medicalRecordService.getAnalysis(record.id);
      
      if (!existingAnalysis) {
        // 使用真實 AI 服務分析病歷
        existingAnalysis = await medicalRecordService.analyzeRecord(context.companyId, record);
        
        // 更新統計數據
        const updatedStats = await medicalRecordService.getStats(context.companyId);
        setStats({
          totalRecords: updatedStats.total_records,
          analyzedToday: updatedStats.analyzed_today,
          avgAnalysisTime: updatedStats.avg_analysis_time,
          accuracyRate: updatedStats.accuracy_rate
        });
      }

      setAiAnalysis(existingAnalysis);

      // 如果緊急程度高，發送警報
      if (existingAnalysis.urgency_level === 'high' || existingAnalysis.urgency_level === 'critical') {
        const patientName = record.patient?.patient_name || '未知患者';
        await sendAlert(
          `高風險病歷警示：${patientName}`,
          `緊急程度：${existingAnalysis.urgency_level}\n${existingAnalysis.summary}`,
          existingAnalysis.urgency_level
        );
      }
    } catch (error) {
      console.error('分析病歷失敗:', error);
      setError('AI 分析失敗，請稍後重試');
    } finally {
      setAnalyzing(false);
    }
  };

  const generateMedicalReport = async () => {
    if (!selectedRecord || !aiAnalysis) {
      alert('請先選擇並分析病歷');
      return;
    }

    const patientName = selectedRecord.patient?.patient_name || '未知患者';
    const patientAge = selectedRecord.patient?.age || 'N/A';
    const patientGender = selectedRecord.patient?.gender === 'male' ? '男' : '女';
    const visitDate = new Date(selectedRecord.visit_date).toLocaleDateString('zh-TW');

    const reportContent = `
# 病歷分析報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 病患資訊
- 姓名：${patientName}
- 年齡：${patientAge} 歲
- 性別：${patientGender}
- 就診日期：${visitDate}
- 主訴：${selectedRecord.chief_complaint}

## AI 分析摘要
${aiAnalysis.summary}

## 關鍵發現
${aiAnalysis.key_findings.map(finding => `• ${finding}`).join('\n')}

## 風險因素
${aiAnalysis.risk_factors.map(risk => `• ${risk}`).join('\n')}

## 建議診斷
${aiAnalysis.suggested_diagnosis.map(diagnosis => `• ${diagnosis}`).join('\n')}

## 藥物交互作用
${aiAnalysis.medication_interactions.map(interaction => `• ${interaction}`).join('\n')}

## 追蹤建議
${aiAnalysis.follow_up_recommendations.map(recommendation => `• ${recommendation}`).join('\n')}

## 緊急程度
${aiAnalysis.urgency_level === 'critical' ? '🔴 緊急' :
  aiAnalysis.urgency_level === 'high' ? '🟠 高' :
  aiAnalysis.urgency_level === 'medium' ? '🟡 中' : '🟢 低'}

## 生命徵象
- 血壓：${selectedRecord.vital_signs.bloodPressure || 'N/A'}
- 心率：${selectedRecord.vital_signs.heartRate || 'N/A'} 次/分
- 體溫：${selectedRecord.vital_signs.temperature || 'N/A'}°C
- 呼吸：${selectedRecord.vital_signs.respiratoryRate || 'N/A'} 次/分
- 血氧：${selectedRecord.vital_signs.oxygenSaturation || 'N/A'}%

## 治療計畫
${selectedRecord.treatment_plan.map(plan => `• ${plan}`).join('\n')}

## 追蹤指示
${selectedRecord.follow_up_instructions || '無特別指示'}
    `.trim();

    await generateReport(`病歷分析報告 - ${patientName}`, reportContent, 'medical');
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'low': return <Stethoscope className="w-5 h-5 text-green-600" />;
      default: return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 病歷分析</h3>
          <p className="text-slate-600 mt-1">智能病歷分析與摘要，協助醫師快速理解病患狀況</p>
        </div>
        <button
          onClick={generateMedicalReport}
          disabled={!selectedRecord || !aiAnalysis}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          生成報告
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">總病歷數</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalRecords}</p>
            </div>
            <FileText className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">今日已分析</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.analyzedToday}</p>
            </div>
            <Stethoscope className="w-10 h-10 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均分析時間</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.avgAnalysisTime}秒</p>
            </div>
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">準確率</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.accuracyRate}%</p>
            </div>
            <User className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Records List */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">病歷列表</h4>
            
            {records.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">尚無病歷記錄</p>
                <p className="text-sm text-slate-500 mt-1">請先在 Supabase 執行 migration SQL</p>
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((record) => {
                  const patientName = record.patient?.patient_name || '未知患者';
                  const patientAge = record.patient?.age || 'N/A';
                  const patientGender = record.patient?.gender === 'male' ? '男' : '女';
                  const visitDate = new Date(record.visit_date).toLocaleDateString('zh-TW');

                  return (
                    <div
                      key={record.id}
                      onClick={() => analyzeRecord(record)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedRecord?.id === record.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="font-semibold text-slate-900">{patientName}</h5>
                          <p className="text-sm text-slate-600">{patientAge}歲, {patientGender}</p>
                        </div>
                        <span className="text-xs text-slate-500">{visitDate}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{record.chief_complaint}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {record.diagnosis[0] || '待診斷'}
                        </span>
                        <span className="text-xs text-slate-500">
                          ID: {record.patient?.patient_id || record.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Analysis Results */}
        <div>
          {selectedRecord ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-slate-900">
                  {selectedRecord.patient?.patient_name || '未知患者'} - AI 分析結果
                </h4>
                {aiAnalysis && (
                  <div className={`flex items-center gap-2 px-3 py-1 rounded border ${getUrgencyColor(aiAnalysis.urgency_level)}`}>
                    {getUrgencyIcon(aiAnalysis.urgency_level)}
                    <span className="text-sm font-medium">
                      {aiAnalysis.urgency_level === 'critical' ? '緊急' :
                       aiAnalysis.urgency_level === 'high' ? '高' :
                       aiAnalysis.urgency_level === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                )}
              </div>

              {analyzing ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-600">AI 正在分析病歷...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">分析摘要</h5>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                      {aiAnalysis.summary}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">關鍵發現</h5>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {aiAnalysis.key_findings.map((finding, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">風險因素</h5>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {aiAnalysis.risk_factors.map((risk, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-600 mt-1">•</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">建議診斷</h5>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {aiAnalysis.suggested_diagnosis.map((diagnosis, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span>{diagnosis}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {aiAnalysis.medication_interactions && aiAnalysis.medication_interactions.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-slate-900 mb-2">藥物交互作用</h5>
                      <ul className="text-sm text-slate-600 space-y-1">
                        {aiAnalysis.medication_interactions.map((interaction, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-amber-600 mt-1">•</span>
                            <span>{interaction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">追蹤建議</h5>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {aiAnalysis.follow_up_recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-purple-600 mt-1">•</span>
                          <span>{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Stethoscope className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">點擊病歷開始 AI 分析</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-900 mb-2">選擇病歷</h4>
                <p className="text-slate-600">從左側列表選擇一個病歷開始分析</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export class MedicalRecordAssistant extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <MedicalRecordAssistantModule context={context} />;
  }
}

