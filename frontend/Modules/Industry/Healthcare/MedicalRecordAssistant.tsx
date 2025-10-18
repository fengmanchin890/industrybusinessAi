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

interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'male' | 'female';
  visitDate: Date;
  chiefComplaint: string;
  symptoms: string[];
  vitalSigns: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    respiratoryRate: number;
    oxygenSaturation: number;
  };
  medicalHistory: string[];
  currentMedications: string[];
  allergies: string[];
  physicalExamination: string;
  laboratoryResults: {
    testName: string;
    result: string;
    normalRange: string;
    status: 'normal' | 'abnormal' | 'critical';
  }[];
  diagnosis: string[];
  treatmentPlan: string[];
  followUpInstructions: string;
  doctorNotes: string;
}

interface AIAnalysis {
  summary: string;
  keyFindings: string[];
  riskFactors: string[];
  suggestedDiagnosis: string[];
  medicationInteractions: string[];
  followUpRecommendations: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

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

  // 舊的模擬數據（保留作為備用）
  const mockRecords_BACKUP: any[] = [
    {
      id: '1',
      patientId: 'P001',
      patientName: '王小明',
      patientAge: 65,
      patientGender: 'male',
      visitDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      chiefComplaint: '胸痛、呼吸困難',
      symptoms: ['胸痛', '呼吸困難', '心悸', '疲勞'],
      vitalSigns: {
        bloodPressure: '150/95',
        heartRate: 95,
        temperature: 37.2,
        respiratoryRate: 22,
        oxygenSaturation: 92
      },
      medicalHistory: ['高血壓', '糖尿病', '高血脂'],
      currentMedications: ['Metformin 500mg', 'Lisinopril 10mg', 'Atorvastatin 20mg'],
      allergies: ['Penicillin'],
      physicalExamination: '心臟聽診有雜音，肺部有輕微濕囉音，下肢輕微水腫',
      laboratoryResults: [
        { testName: '血糖', result: '180 mg/dL', normalRange: '70-100 mg/dL', status: 'abnormal' },
        { testName: '膽固醇', result: '250 mg/dL', normalRange: '<200 mg/dL', status: 'abnormal' },
        { testName: '肌酸酐', result: '1.2 mg/dL', normalRange: '0.6-1.2 mg/dL', status: 'normal' }
      ],
      diagnosis: ['冠狀動脈疾病', '高血壓', '糖尿病'],
      treatmentPlan: ['調整藥物劑量', '飲食控制', '定期追蹤'],
      followUpInstructions: '一週後回診，如有胸痛加劇立即就醫',
      doctorNotes: '患者症狀穩定，需密切監控心臟功能'
    },
    {
      id: '2',
      patientId: 'P002',
      patientName: '李美華',
      patientAge: 45,
      patientGender: 'female',
      visitDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      chiefComplaint: '頭痛、噁心',
      symptoms: ['頭痛', '噁心', '嘔吐', '畏光'],
      vitalSigns: {
        bloodPressure: '140/90',
        heartRate: 85,
        temperature: 36.8,
        respiratoryRate: 18,
        oxygenSaturation: 98
      },
      medicalHistory: ['偏頭痛'],
      currentMedications: ['Ibuprofen 400mg'],
      allergies: ['無已知過敏'],
      physicalExamination: '神經學檢查正常，頸部僵硬，瞳孔對光反應正常',
      laboratoryResults: [
        { testName: '血壓', result: '140/90', normalRange: '<120/80', status: 'abnormal' },
        { testName: '血糖', result: '95 mg/dL', normalRange: '70-100 mg/dL', status: 'normal' }
      ],
      diagnosis: ['偏頭痛', '高血壓'],
      treatmentPlan: ['止痛藥物', '血壓控制', '生活型態調整'],
      followUpInstructions: '如症狀持續或加劇，請立即回診',
      doctorNotes: '建議進行進一步檢查排除其他原因'
    }
  ];

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

    const reportContent = `
# 病歷分析報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 病患資訊
- 姓名：${selectedRecord.patientName}
- 年齡：${selectedRecord.patientAge} 歲
- 性別：${selectedRecord.patientGender === 'male' ? '男' : '女'}
- 就診日期：${selectedRecord.visitDate ? new Date(selectedRecord.visitDate).toLocaleDateString('zh-TW') : 'N/A'}
- 主訴：${selectedRecord.chiefComplaint}

## AI 分析摘要
${aiAnalysis.summary}

## 關鍵發現
${(aiAnalysis.keyFindings || aiAnalysis.key_findings || []).map((finding: string) => `• ${finding}`).join('\n')}

## 風險因素
${(aiAnalysis.riskFactors || aiAnalysis.risk_factors || []).map((risk: string) => `• ${risk}`).join('\n')}

## 建議診斷
${(aiAnalysis.suggestedDiagnosis || aiAnalysis.suggested_diagnosis || []).map((diagnosis: string) => `• ${diagnosis}`).join('\n')}

## 藥物交互作用
${(aiAnalysis.medicationInteractions || aiAnalysis.medication_interactions || []).map((interaction: string) => `• ${interaction}`).join('\n')}

## 追蹤建議
${(aiAnalysis.followUpRecommendations || aiAnalysis.follow_up_recommendations || []).map((recommendation: string) => `• ${recommendation}`).join('\n')}

## 緊急程度
${aiAnalysis.urgencyLevel === 'critical' ? '🔴 緊急' :
  aiAnalysis.urgencyLevel === 'high' ? '🟠 高' :
  aiAnalysis.urgencyLevel === 'medium' ? '🟡 中' : '🟢 低'}

## 生命徵象
- 血壓：${selectedRecord.vitalSigns.bloodPressure}
- 心率：${selectedRecord.vitalSigns.heartRate} 次/分
- 體溫：${selectedRecord.vitalSigns.temperature}°C
- 呼吸：${selectedRecord.vitalSigns.respiratoryRate} 次/分
- 血氧：${selectedRecord.vitalSigns.oxygenSaturation}%

## 實驗室結果
${selectedRecord.laboratoryResults.map(result => `
### ${result.testName}
- 結果：${result.result}
- 正常值：${result.normalRange}
- 狀態：${result.status === 'normal' ? '✅ 正常' : result.status === 'abnormal' ? '⚠️ 異常' : '🔴 危急'}
`).join('\n')}

## 治療計畫
${selectedRecord.treatmentPlan.map(plan => `• ${plan}`).join('\n')}

## 追蹤指示
${selectedRecord.followUpInstructions}
    `.trim();

    await generateReport(`病歷分析報告 - ${selectedRecord.patientName}`, reportContent, 'medical');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 病歷助理</h3>
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
            <div className="space-y-3">
              {records.map((record) => (
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
                      <h5 className="font-semibold text-slate-900">{record.patientName}</h5>
                      <p className="text-sm text-slate-600">{record.patientAge}歲, {record.patientGender === 'male' ? '男' : '女'}</p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {record.visitDate ? new Date(record.visitDate).toLocaleDateString('zh-TW') : 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{record.chiefComplaint}</p>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                      {record.diagnosis[0]}
                    </span>
                    <span className="text-xs text-slate-500">
                      ID: {record.patientId}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        <div>
          {selectedRecord ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-slate-900">
                  {selectedRecord.patientName} - AI 分析結果
                </h4>
                {aiAnalysis && (
                  <div className={`flex items-center gap-2 px-3 py-1 rounded ${getUrgencyColor(aiAnalysis.urgencyLevel)}`}>
                    {getUrgencyIcon(aiAnalysis.urgencyLevel)}
                    <span className="text-sm font-medium">
                      {aiAnalysis.urgencyLevel === 'critical' ? '緊急' :
                       aiAnalysis.urgencyLevel === 'high' ? '高' :
                       aiAnalysis.urgencyLevel === 'medium' ? '中' : '低'}
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
                      {(aiAnalysis.keyFindings || aiAnalysis.key_findings || []).map((finding: string, index: number) => (
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
                      {(aiAnalysis.riskFactors || aiAnalysis.risk_factors || []).map((risk: string, index: number) => (
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
                      {(aiAnalysis.suggestedDiagnosis || aiAnalysis.suggested_diagnosis || []).map((diagnosis: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span>{diagnosis}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">追蹤建議</h5>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {(aiAnalysis.followUpRecommendations || aiAnalysis.follow_up_recommendations || []).map((recommendation: string, index: number) => (
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
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">選擇病歷進行分析</h4>
                  <p className="text-slate-600">從左側列表選擇病歷開始 AI 分析</p>
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
