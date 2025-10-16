/**
 * AI 藥物交互作用檢查模組
 * 適用於醫療機構的藥物安全檢查
 */

import React, { useState } from 'react';
import { Pill, AlertTriangle, CheckCircle, Search, Plus, X } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';

const metadata: ModuleMetadata = {
  id: 'drug-interaction-checker',
  name: 'AI 藥物交互作用檢查',
  version: '1.0.0',
  category: 'healthcare',
  industry: ['healthcare'],
  description: 'AI 驅動的藥物交互作用檢查系統，確保用藥安全',
  icon: 'Pill',
  author: 'AI Business Platform',
  pricingTier: 'basic',
  features: [
    '藥物交互作用檢查',
    '過敏原檢測',
    '劑量建議',
    '用藥安全報告',
    '藥物資料庫'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: false,
  requiresDataConnection: false
};

interface Drug {
  id: string;
  name: string;
  genericName: string;
  category: string;
  dosage: string;
  contraindications: string[];
  interactions: string[];
}

interface PatientMedication {
  drugId: string;
  drugName: string;
  dosage: string;
  frequency: string;
  startDate: string;
}

interface InteractionResult {
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

// 模擬藥物資料庫
const drugDatabase: Drug[] = [
  {
    id: '1',
    name: 'Warfarin',
    genericName: '華法林',
    category: '抗凝血劑',
    dosage: '2-10mg',
    contraindications: ['懷孕', '出血傾向', '嚴重肝病'],
    interactions: ['Aspirin', 'Ibuprofen', 'Digoxin']
  },
  {
    id: '2',
    name: 'Aspirin',
    genericName: '阿斯匹靈',
    category: '解熱鎮痛劑',
    dosage: '75-325mg',
    contraindications: ['胃潰瘍', '出血傾向', '對阿斯匹靈過敏'],
    interactions: ['Warfarin', 'Methotrexate', 'ACE抑制劑']
  },
  {
    id: '3',
    name: 'Digoxin',
    genericName: '毛地黃',
    category: '強心劑',
    dosage: '0.125-0.25mg',
    contraindications: ['房室傳導阻滯', '心室心律不整'],
    interactions: ['Warfarin', 'Furosemide', 'Amiodarone']
  },
  {
    id: '4',
    name: 'Metformin',
    genericName: '美福明',
    category: '糖尿病用藥',
    dosage: '500-2000mg',
    contraindications: ['腎功能不全', '嚴重感染', '脫水'],
    interactions: ['Contrast media', 'Alcohol']
  },
  {
    id: '5',
    name: 'Lisinopril',
    genericName: '賴諾普利',
    category: 'ACE抑制劑',
    dosage: '5-40mg',
    contraindications: ['懷孕', '雙側腎動脈狹窄'],
    interactions: ['Aspirin', 'Potassium supplements', 'NSAIDs']
  }
];

export function DrugInteractionCheckerModule({ context }: { context: ModuleContext }) {
  const { state, setRunning, setIdle } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  
  const [patientMedications, setPatientMedications] = useState<PatientMedication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Drug[]>([]);
  const [interactionResults, setInteractionResults] = useState<InteractionResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  // 搜尋藥物
  const searchDrugs = (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    const results = drugDatabase.filter(drug =>
      drug.name.toLowerCase().includes(term.toLowerCase()) ||
      drug.genericName.includes(term) ||
      drug.category.includes(term)
    );
    setSearchResults(results);
  };

  // 添加藥物到病患用藥清單
  const addMedication = (drug: Drug) => {
    const newMedication: PatientMedication = {
      drugId: drug.id,
      drugName: drug.name,
      dosage: drug.dosage,
      frequency: '每日一次',
      startDate: new Date().toISOString().split('T')[0]
    };

    setPatientMedications(prev => [...prev, newMedication]);
    setSearchTerm('');
    setSearchResults([]);
  };

  // 移除藥物
  const removeMedication = (drugId: string) => {
    setPatientMedications(prev => prev.filter(med => med.drugId !== drugId));
  };

  // 檢查藥物交互作用
  const checkInteractions = async () => {
    if (patientMedications.length < 2) {
      alert('至少需要兩種藥物才能檢查交互作用');
      return;
    }

    setIsChecking(true);
    setRunning();

    try {
      // 模擬AI檢查過程
      await new Promise(resolve => setTimeout(resolve, 2000));

      const results: InteractionResult[] = [];

      // 檢查每對藥物的交互作用
      for (let i = 0; i < patientMedications.length; i++) {
        for (let j = i + 1; j < patientMedications.length; j++) {
          const drug1 = drugDatabase.find(d => d.id === patientMedications[i].drugId);
          const drug2 = drugDatabase.find(d => d.id === patientMedications[j].drugId);

          if (drug1 && drug2) {
            // 檢查是否有交互作用
            const hasInteraction = drug1.interactions.some(interaction =>
              drug2.name.includes(interaction) || drug2.genericName.includes(interaction)
            ) || drug2.interactions.some(interaction =>
              drug1.name.includes(interaction) || drug1.genericName.includes(interaction)
            );

            if (hasInteraction) {
              const severity = Math.random() > 0.5 ? 'high' : 'medium';
              results.push({
                severity,
                description: `${drug1.name} 與 ${drug2.name} 可能產生交互作用`,
                recommendation: severity === 'high' 
                  ? '建議避免同時使用，或密切監控病患狀況'
                  : '建議調整劑量或監控副作用'
              });
            }
          }
        }
      }

      // 檢查禁忌症
      patientMedications.forEach(med => {
        const drug = drugDatabase.find(d => d.id === med.drugId);
        if (drug && drug.contraindications.length > 0) {
          results.push({
            severity: 'critical',
            description: `${drug.name} 有禁忌症：${drug.contraindications.join('、')}`,
            recommendation: '請確認病患無相關禁忌症後再使用'
          });
        }
      });

      setInteractionResults(results);

      // 發送警示
      const criticalResults = results.filter(r => r.severity === 'critical');
      const highResults = results.filter(r => r.severity === 'high');

      if (criticalResults.length > 0) {
        await sendAlert('high', '發現嚴重藥物交互作用', criticalResults.map(r => r.description).join('; '));
      } else if (highResults.length > 0) {
        await sendAlert('medium', '發現藥物交互作用', highResults.map(r => r.description).join('; '));
      }

    } catch (error) {
      console.error('檢查藥物交互作用時發生錯誤:', error);
      alert('檢查失敗，請稍後再試');
    } finally {
      setIsChecking(false);
      setIdle();
    }
  };

  // 生成用藥安全報告
  const generateSafetyReport = async () => {
    if (patientMedications.length === 0) {
      alert('請先添加藥物');
      return;
    }

    const reportContent = `
# 用藥安全檢查報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 病患用藥清單
${patientMedications.map((med, index) => `
${index + 1}. ${med.drugName}
   - 劑量：${med.dosage}
   - 頻率：${med.frequency}
   - 開始日期：${med.startDate}
`).join('')}

## 交互作用檢查結果
${interactionResults.length === 0 ? '✓ 未發現藥物交互作用' : interactionResults.map((result, index) => `
${index + 1}. [${result.severity === 'critical' ? '嚴重' : result.severity === 'high' ? '高' : result.severity === 'medium' ? '中' : '低'}] ${result.description}
   - 建議：${result.recommendation}
`).join('')}

## 安全建議
${interactionResults.filter(r => r.severity === 'critical').length > 0 ? 
  '⚠️ 發現嚴重交互作用，建議立即調整用藥方案' :
  interactionResults.filter(r => r.severity === 'high').length > 0 ?
  '⚠️ 發現高風險交互作用，建議密切監控' :
  '✓ 用藥方案相對安全，建議定期監控'}

## 注意事項
- 請定期監控病患用藥反應
- 如有異常症狀請立即停藥並就醫
- 建議定期重新評估用藥方案
    `.trim();

    await generateReport('用藥安全檢查報告', reportContent, 'custom');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-700 bg-blue-100 border-blue-200';
      default: return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'low': return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default: return <CheckCircle className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 藥物交互作用檢查</h3>
          <p className="text-slate-600 mt-1">確保用藥安全，預防藥物交互作用</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={checkInteractions}
            disabled={isChecking || patientMedications.length < 2}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChecking ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                檢查中...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                檢查交互作用
              </>
            )}
          </button>
          <button
            onClick={generateSafetyReport}
            disabled={patientMedications.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            生成報告
          </button>
        </div>
      </div>

      {/* Drug Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-4">搜尋藥物</h4>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              searchDrugs(e.target.value);
            }}
            placeholder="輸入藥物名稱、學名或分類..."
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map(drug => (
              <div
                key={drug.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
              >
                <div>
                  <h5 className="font-semibold text-slate-900">{drug.name}</h5>
                  <p className="text-sm text-slate-600">{drug.genericName} - {drug.category}</p>
                  <p className="text-xs text-slate-500">劑量：{drug.dosage}</p>
                </div>
                <button
                  onClick={() => addMedication(drug)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patient Medications */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-4">病患用藥清單</h4>
        
        {patientMedications.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Pill className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>尚未添加任何藥物</p>
            <p className="text-sm mt-1">請在上方搜尋並添加藥物</p>
          </div>
        ) : (
          <div className="space-y-3">
            {patientMedications.map((med, index) => (
              <div key={med.drugId} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Pill className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-900">{med.drugName}</h5>
                    <p className="text-sm text-slate-600">{med.dosage} - {med.frequency}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeMedication(med.drugId)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interaction Results */}
      {interactionResults.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h4 className="text-lg font-bold text-slate-900 mb-4">交互作用檢查結果</h4>
          
          <div className="space-y-3">
            {interactionResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityColor(result.severity)}`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(result.severity)}
                  <div className="flex-1">
                    <h5 className="font-semibold mb-2">{result.description}</h5>
                    <p className="text-sm">{result.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">用藥數量</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{patientMedications.length}</p>
            </div>
            <Pill className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">嚴重交互作用</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {interactionResults.filter(r => r.severity === 'critical').length}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">高風險交互作用</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {interactionResults.filter(r => r.severity === 'high').length}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">總交互作用</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{interactionResults.length}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-slate-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

// 導出模組類（用於註冊）
export class DrugInteractionChecker extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <DrugInteractionCheckerModule context={context} />;
  }
}
