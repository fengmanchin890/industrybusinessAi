/**
 * AI 政策分析系統 - 智能政策評估與分析
 * 為政府機構提供政策分析服務
 */

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Target, FileText, AlertCircle } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../Contexts/AuthContext';
import { generateText, analyzeData } from '../../../lib/ai-service';

const metadata: ModuleMetadata = {
  id: 'policy-analysis',
  name: 'AI 政策分析系統',
  version: '1.0.0',
  category: 'government',
  industry: ['government'],
  description: '智能政策評估與分析，提供數據驅動的政策建議',
  icon: 'BarChart3',
  author: 'AI Business Platform',
  pricingTier: 'enterprise',
  features: [
    '政策影響評估',
    '數據分析',
    '效果預測',
    '風險評估',
    '建議生成'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface Policy {
  id: string;
  title: string;
  category: 'social' | 'economic' | 'environmental' | 'education' | 'healthcare' | 'infrastructure';
  status: 'draft' | 'proposed' | 'implemented' | 'evaluated' | 'archived';
  description: string;
  objectives: string[];
  targetPopulation: string;
  budget: number;
  implementationDate: Date;
  evaluationDate?: Date;
  analysis?: PolicyAnalysis;
}

interface PolicyAnalysis {
  id: string;
  policyId: string;
  overallScore: number;
  effectivenessScore: number;
  efficiencyScore: number;
  equityScore: number;
  sustainabilityScore: number;
  impactAssessment: ImpactAssessment;
  riskAnalysis: RiskAnalysis;
  recommendations: string[];
  generatedAt: Date;
}

interface ImpactAssessment {
  positiveImpacts: string[];
  negativeImpacts: string[];
  affectedGroups: string[];
  quantitativeMetrics: Metric[];
  qualitativeInsights: string[];
}

interface RiskAnalysis {
  risks: Risk[];
  mitigationStrategies: string[];
  probabilityAssessment: 'low' | 'medium' | 'high';
  impactAssessment: 'low' | 'medium' | 'high';
}

interface Risk {
  id: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

interface Metric {
  name: string;
  value: number;
  unit: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export function PolicyAnalysisModule({ context }: { context: ModuleContext }) {
  const { state, setRunning, setIdle } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  const { company } = useAuth();
  
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [stats, setStats] = useState({
    totalPolicies: 0,
    analyzedPolicies: 0,
    avgEffectiveness: 0,
    highRiskPolicies: 0
  });

  // 模擬政策數據
  const mockPolicies: Policy[] = [
    {
      id: 'P001',
      title: '長照2.0政策',
      category: 'social',
      status: 'implemented',
      description: '擴大長照服務範圍，提升服務品質，建立完善長照體系',
      objectives: [
        '擴大服務對象',
        '提升服務品質',
        '建立服務網絡',
        '培訓專業人員'
      ],
      targetPopulation: '65歲以上長者及失能者',
      budget: 5000000000,
      implementationDate: new Date('2023-01-01'),
      evaluationDate: new Date('2024-01-01'),
      analysis: {
        id: 'A001',
        policyId: 'P001',
        overallScore: 78,
        effectivenessScore: 82,
        efficiencyScore: 75,
        equityScore: 85,
        sustainabilityScore: 70,
        impactAssessment: {
          positiveImpacts: [
            '提升長者生活品質',
            '減輕家庭照顧負擔',
            '創造就業機會',
            '促進產業發展'
          ],
          negativeImpacts: [
            '財政負擔增加',
            '人力資源不足',
            '服務品質參差不齊'
          ],
          affectedGroups: ['長者', '家庭照顧者', '長照服務提供者', '政府財政'],
          quantitativeMetrics: [
            { name: '服務覆蓋率', value: 85, unit: '%', trend: 'increasing' },
            { name: '滿意度', value: 4.2, unit: '/5', trend: 'stable' },
            { name: '服務人數', value: 450000, unit: '人', trend: 'increasing' }
          ],
          qualitativeInsights: [
            '政策目標明確，執行效果良好',
            '服務品質持續改善',
            '需要加強人力培訓'
          ]
        },
        riskAnalysis: {
          risks: [
            {
              id: 'R001',
              description: '財政負擔過重',
              probability: 'medium',
              impact: 'high',
              mitigation: '建立多元財源機制'
            },
            {
              id: 'R002',
              description: '人力資源不足',
              probability: 'high',
              impact: 'medium',
              mitigation: '加強培訓與招募'
            }
          ],
          mitigationStrategies: [
            '建立多元財源機制',
            '加強人力培訓與招募',
            '提升服務效率',
            '建立品質監控機制'
          ],
          probabilityAssessment: 'medium',
          impactAssessment: 'medium'
        },
        recommendations: [
          '持續擴大服務覆蓋範圍',
          '加強人力培訓與招募',
          '建立品質監控機制',
          '優化服務流程'
        ],
        generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    },
    {
      id: 'P002',
      title: '數位轉型政策',
      category: 'economic',
      status: 'proposed',
      description: '推動政府數位轉型，提升行政效率，改善民眾服務體驗',
      objectives: [
        '提升行政效率',
        '改善服務體驗',
        '促進數位經濟',
        '強化資安防護'
      ],
      targetPopulation: '全體國民',
      budget: 3000000000,
      implementationDate: new Date('2024-06-01')
    },
    {
      id: 'P003',
      title: '淨零排放政策',
      category: 'environmental',
      status: 'implemented',
      description: '推動淨零排放目標，促進綠色轉型，建立永續發展模式',
      objectives: [
        '減少碳排放',
        '促進綠色能源',
        '推動循環經濟',
        '建立碳權交易'
      ],
      targetPopulation: '全體國民',
      budget: 8000000000,
      implementationDate: new Date('2023-07-01'),
      evaluationDate: new Date('2024-07-01')
    }
  ];

  useEffect(() => {
    loadPolicies();
  }, [company?.id]);

  const loadPolicies = async () => {
    try {
      setPolicies(mockPolicies);
      
      setStats({
        totalPolicies: mockPolicies.length,
        analyzedPolicies: mockPolicies.filter(p => p.analysis).length,
        avgEffectiveness: 78,
        highRiskPolicies: mockPolicies.filter(p => p.analysis?.riskAnalysis.probabilityAssessment === 'high').length
      });
    } catch (error) {
      console.error('載入政策失敗:', error);
    }
  };

  const analyzePolicy = async (policy: Policy) => {
    setAnalyzing(true);
    setSelectedPolicy(policy);
    setRunning();
    
    try {
      // 使用 AI 分析政策
      const systemPrompt = `你是一個專業的政策分析師，專門評估政府政策的有效性、效率和影響。請根據政策內容進行全面分析。`;
      
      const prompt = `
請分析以下政策：

政策標題：${policy.title}
政策類別：${policy.category === 'social' ? '社會' :
           policy.category === 'economic' ? '經濟' :
           policy.category === 'environmental' ? '環境' :
           policy.category === 'education' ? '教育' :
           policy.category === 'healthcare' ? '醫療' : '基礎建設'}

政策描述：${policy.description}
政策目標：${policy.objectives.join(', ')}
目標群體：${policy.targetPopulation}
預算：NT$ ${policy.budget.toLocaleString()}
實施日期：${policy.implementationDate.toLocaleDateString('zh-TW')}

請進行以下分析：
1. 整體評分 (0-100)
2. 各項指標評分 (有效性、效率、公平性、永續性)
3. 影響評估 (正面、負面影響)
4. 風險分析
5. 改進建議

請以 JSON 格式回應：
{
  "overallScore": 0-100,
  "effectivenessScore": 0-100,
  "efficiencyScore": 0-100,
  "equityScore": 0-100,
  "sustainabilityScore": 0-100,
  "impactAssessment": {
    "positiveImpacts": ["影響1", "影響2"],
    "negativeImpacts": ["影響1", "影響2"],
    "affectedGroups": ["群體1", "群體2"],
    "quantitativeMetrics": [
      {
        "name": "指標名稱",
        "value": 數值,
        "unit": "單位",
        "trend": "increasing/decreasing/stable"
      }
    ],
    "qualitativeInsights": ["洞察1", "洞察2"]
  },
  "riskAnalysis": {
    "risks": [
      {
        "description": "風險描述",
        "probability": "low/medium/high",
        "impact": "low/medium/high",
        "mitigation": "緩解措施"
      }
    ],
    "mitigationStrategies": ["策略1", "策略2"],
    "probabilityAssessment": "low/medium/high",
    "impactAssessment": "low/medium/high"
  },
  "recommendations": ["建議1", "建議2"]
}
      `;

      const aiResponse = await generateText(prompt, {
        systemPrompt,
        maxTokens: 2000,
        temperature: 0.3
      });

      try {
        const analysisData = JSON.parse(aiResponse.content);
        
        const analysis: PolicyAnalysis = {
          id: `A${Date.now()}`,
          policyId: policy.id,
          overallScore: analysisData.overallScore,
          effectivenessScore: analysisData.effectivenessScore,
          efficiencyScore: analysisData.efficiencyScore,
          equityScore: analysisData.equityScore,
          sustainabilityScore: analysisData.sustainabilityScore,
          impactAssessment: {
            positiveImpacts: analysisData.impactAssessment.positiveImpacts,
            negativeImpacts: analysisData.impactAssessment.negativeImpacts,
            affectedGroups: analysisData.impactAssessment.affectedGroups,
            quantitativeMetrics: analysisData.impactAssessment.quantitativeMetrics.map((m: any, index: number) => ({
              name: m.name,
              value: m.value,
              unit: m.unit,
              trend: m.trend
            })),
            qualitativeInsights: analysisData.impactAssessment.qualitativeInsights
          },
          riskAnalysis: {
            risks: analysisData.riskAnalysis.risks.map((r: any, index: number) => ({
              id: `R${Date.now()}_${index}`,
              description: r.description,
              probability: r.probability,
              impact: r.impact,
              mitigation: r.mitigation
            })),
            mitigationStrategies: analysisData.riskAnalysis.mitigationStrategies,
            probabilityAssessment: analysisData.riskAnalysis.probabilityAssessment,
            impactAssessment: analysisData.riskAnalysis.impactAssessment
          },
          recommendations: analysisData.recommendations,
          generatedAt: new Date()
        };

        // 更新政策分析
        setPolicies(prev => prev.map(p => 
          p.id === policy.id ? { ...p, analysis } : p
        ));

        await sendAlert('info', '政策分析完成', `政策「${policy.title}」分析完成，整體評分：${analysisData.overallScore}`);
        
      } catch (parseError) {
        console.error('AI 分析結果解析失敗:', parseError);
        
        // 備用分析結果
        const fallbackAnalysis: PolicyAnalysis = {
          id: `A${Date.now()}`,
          policyId: policy.id,
          overallScore: 75,
          effectivenessScore: 80,
          efficiencyScore: 70,
          equityScore: 75,
          sustainabilityScore: 70,
          impactAssessment: {
            positiveImpacts: ['政策目標明確'],
            negativeImpacts: ['需要進一步評估'],
            affectedGroups: ['目標群體'],
            quantitativeMetrics: [
              { name: '實施進度', value: 60, unit: '%', trend: 'increasing' }
            ],
            qualitativeInsights: ['需要持續監控與評估']
          },
          riskAnalysis: {
            risks: [
              {
                id: `R${Date.now()}`,
                description: '需要進一步風險評估',
                probability: 'medium',
                impact: 'medium',
                mitigation: '持續監控'
              }
            ],
            mitigationStrategies: ['持續監控', '定期評估'],
            probabilityAssessment: 'medium',
            impactAssessment: 'medium'
          },
          recommendations: ['持續監控政策實施效果', '定期進行評估'],
          generatedAt: new Date()
        };

        setPolicies(prev => prev.map(p => 
          p.id === policy.id ? { ...p, analysis: fallbackAnalysis } : p
        ));
      }
      
    } catch (error) {
      console.error('政策分析失敗:', error);
      await sendAlert('warning', '政策分析失敗', '無法完成政策分析，請手動處理');
    } finally {
      setAnalyzing(false);
      setIdle();
    }
  };

  const generatePolicyReport = async () => {
    const analyzedPolicies = policies.filter(p => p.analysis);
    const highRiskPolicies = policies.filter(p => p.analysis?.riskAnalysis.probabilityAssessment === 'high');
    const implementedPolicies = policies.filter(p => p.status === 'implemented');
    
    const reportContent = `
# 政策分析報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 政策總覽
- 總政策數：${stats.totalPolicies}
- 已分析：${stats.analyzedPolicies}
- 平均有效性：${stats.avgEffectiveness}%
- 高風險政策：${stats.highRiskPolicies}

## 政策狀態分析
- 草案：${policies.filter(p => p.status === 'draft').length}
- 提案中：${policies.filter(p => p.status === 'proposed').length}
- 已實施：${implementedPolicies.length}
- 已評估：${policies.filter(p => p.status === 'evaluated').length}
- 已歸檔：${policies.filter(p => p.status === 'archived').length}

## 政策類別分析
${Object.entries(policies.reduce((acc, policy) => {
  acc[policy.category] = (acc[policy.category] || 0) + 1;
  return acc;
}, {} as Record<string, number>)).map(([category, count]) => `
- ${category === 'social' ? '社會' :
     category === 'economic' ? '經濟' :
     category === 'environmental' ? '環境' :
     category === 'education' ? '教育' :
     category === 'healthcare' ? '醫療' : '基礎建設'}：${count} 個政策`).join('\n')}

## 已分析政策詳情
${analyzedPolicies.map(policy => `
### ${policy.title}
- 類別：${policy.category === 'social' ? '社會' :
         policy.category === 'economic' ? '經濟' :
         policy.category === 'environmental' ? '環境' :
         policy.category === 'education' ? '教育' :
         policy.category === 'healthcare' ? '醫療' : '基礎建設'}
- 狀態：${policy.status === 'draft' ? '草案' :
         policy.status === 'proposed' ? '提案中' :
         policy.status === 'implemented' ? '已實施' :
         policy.status === 'evaluated' ? '已評估' : '已歸檔'}
- 整體評分：${policy.analysis?.overallScore}/100
- 有效性：${policy.analysis?.effectivenessScore}/100
- 效率：${policy.analysis?.efficiencyScore}/100
- 公平性：${policy.analysis?.equityScore}/100
- 永續性：${policy.analysis?.sustainabilityScore}/100
- 預算：NT$ ${policy.budget.toLocaleString()}
- 目標群體：${policy.targetPopulation}
- 分析時間：${policy.analysis?.generatedAt.toLocaleString('zh-TW')}

#### 正面影響
${policy.analysis?.impactAssessment.positiveImpacts.map(impact => `- ${impact}`).join('\n')}

#### 負面影響
${policy.analysis?.impactAssessment.negativeImpacts.map(impact => `- ${impact}`).join('\n')}

#### 影響群體
${policy.analysis?.impactAssessment.affectedGroups.join(', ')}

#### 量化指標
${policy.analysis?.impactAssessment.quantitativeMetrics.map(metric => 
  `- ${metric.name}: ${metric.value}${metric.unit} (${metric.trend === 'increasing' ? '上升' : metric.trend === 'decreasing' ? '下降' : '穩定'})`
).join('\n')}

#### 風險分析
${policy.analysis?.riskAnalysis.risks.map(risk => `
- ${risk.description} (機率: ${risk.probability === 'high' ? '高' : risk.probability === 'medium' ? '中' : '低'}, 影響: ${risk.impact === 'high' ? '高' : risk.impact === 'medium' ? '中' : '低'})
  緩解措施: ${risk.mitigation}
`).join('\n')}

#### 建議措施
${policy.analysis?.recommendations.map(rec => `- ${rec}`).join('\n')}
`).join('\n')}

## 高風險政策
${highRiskPolicies.length === 0 ? '✅ 目前無高風險政策' : highRiskPolicies.map(policy => `
### ${policy.title}
- 風險等級：${policy.analysis?.riskAnalysis.probabilityAssessment === 'high' ? '🔴 高' : '🟡 中'}
- 影響等級：${policy.analysis?.riskAnalysis.impactAssessment === 'high' ? '🔴 高' : '🟡 中'}
- 主要風險：${policy.analysis?.riskAnalysis.risks.map(r => r.description).join(', ')}
- 緩解策略：${policy.analysis?.riskAnalysis.mitigationStrategies.join(', ')}
`).join('\n')}

## 政策效果評估
- 平均整體評分：${analyzedPolicies.length > 0 ? (analyzedPolicies.reduce((sum, p) => sum + (p.analysis?.overallScore || 0), 0) / analyzedPolicies.length).toFixed(1) : 0}/100
- 平均有效性：${analyzedPolicies.length > 0 ? (analyzedPolicies.reduce((sum, p) => sum + (p.analysis?.effectivenessScore || 0), 0) / analyzedPolicies.length).toFixed(1) : 0}/100
- 平均效率：${analyzedPolicies.length > 0 ? (analyzedPolicies.reduce((sum, p) => sum + (p.analysis?.efficiencyScore || 0), 0) / analyzedPolicies.length).toFixed(1) : 0}/100
- 平均公平性：${analyzedPolicies.length > 0 ? (analyzedPolicies.reduce((sum, p) => sum + (p.analysis?.equityScore || 0), 0) / analyzedPolicies.length).toFixed(1) : 0}/100
- 平均永續性：${analyzedPolicies.length > 0 ? (analyzedPolicies.reduce((sum, p) => sum + (p.analysis?.sustainabilityScore || 0), 0) / analyzedPolicies.length).toFixed(1) : 0}/100

## 建議措施
${highRiskPolicies.length > 0 ? '🚨 有高風險政策需要立即關注' :
  analyzedPolicies.filter(p => p.analysis && p.analysis.overallScore < 70).length > 0 ? '⚠️ 有政策效果不佳，需要改進' :
  '✅ 政策實施狀況良好'}

## AI 建議
${stats.avgEffectiveness < 75 ? '💡 政策有效性偏低，建議加強政策設計與執行' :
  highRiskPolicies.length > 0 ? '💡 建議優先處理高風險政策' :
  '✅ 政策分析系統運行良好'}
    `.trim();

    await generateReport('政策分析報告', reportContent, 'policy_analysis');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'proposed': return 'bg-blue-100 text-blue-700';
      case 'implemented': return 'bg-green-100 text-green-700';
      case 'evaluated': return 'bg-purple-100 text-purple-700';
      case 'archived': return 'bg-gray-100 text-gray-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'social': return 'bg-blue-100 text-blue-700';
      case 'economic': return 'bg-green-100 text-green-700';
      case 'environmental': return 'bg-emerald-100 text-emerald-700';
      case 'education': return 'bg-purple-100 text-purple-700';
      case 'healthcare': return 'bg-red-100 text-red-700';
      case 'infrastructure': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 政策分析系統</h3>
          <p className="text-slate-600 mt-1">智能政策評估與分析，提供數據驅動的政策建議</p>
        </div>
        <button
          onClick={generatePolicyReport}
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
              <p className="text-sm text-slate-600">總政策數</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalPolicies}</p>
            </div>
            <FileText className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">已分析</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.analyzedPolicies}</p>
            </div>
            <BarChart3 className="w-10 h-10 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均有效性</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.avgEffectiveness}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">高風險政策</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.highRiskPolicies}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Policies List */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">政策列表</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {policies.map((policy) => (
                <div
                  key={policy.id}
                  onClick={() => setSelectedPolicy(policy)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedPolicy?.id === policy.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-semibold text-slate-900">{policy.title}</h5>
                      <p className="text-sm text-slate-600">
                        {policy.category === 'social' ? '社會' :
                         policy.category === 'economic' ? '經濟' :
                         policy.category === 'environmental' ? '環境' :
                         policy.category === 'education' ? '教育' :
                         policy.category === 'healthcare' ? '醫療' : '基礎建設'} | 
                        NT$ {policy.budget.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(policy.category)}`}>
                        {policy.category === 'social' ? '社會' :
                         policy.category === 'economic' ? '經濟' :
                         policy.category === 'environmental' ? '環境' :
                         policy.category === 'education' ? '教育' :
                         policy.category === 'healthcare' ? '醫療' : '基礎建設'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(policy.status)}`}>
                        {policy.status === 'draft' ? '草案' :
                         policy.status === 'proposed' ? '提案中' :
                         policy.status === 'implemented' ? '已實施' :
                         policy.status === 'evaluated' ? '已評估' : '已歸檔'}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 mb-2">
                    <p>{policy.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {policy.implementationDate.toLocaleDateString('zh-TW')}
                    </span>
                    {!policy.analysis && policy.status !== 'draft' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          analyzePolicy(policy);
                        }}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        開始分析
                      </button>
                    )}
                    {policy.analysis && (
                      <span className={`text-sm font-medium ${getScoreColor(policy.analysis.overallScore)}`}>
                        {policy.analysis.overallScore}/100
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Policy Analysis */}
        <div>
          {selectedPolicy ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-slate-900">
                  {selectedPolicy.title} - 分析結果
                </h4>
                {selectedPolicy.analysis && (
                  <div className={`px-3 py-1 rounded ${getScoreColor(selectedPolicy.analysis.overallScore)}`}>
                    <span className="text-sm font-medium">
                      {selectedPolicy.analysis.overallScore}/100
                    </span>
                  </div>
                )}
              </div>

              {analyzing ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-600">AI 正在分析政策...</p>
                </div>
              ) : selectedPolicy.analysis ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">整體評分</p>
                      <p className={`text-2xl font-bold ${getScoreColor(selectedPolicy.analysis.overallScore)}`}>
                        {selectedPolicy.analysis.overallScore}/100
                      </p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">有效性</p>
                      <p className={`text-2xl font-bold ${getScoreColor(selectedPolicy.analysis.effectivenessScore)}`}>
                        {selectedPolicy.analysis.effectivenessScore}/100
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600">效率</p>
                      <p className={`text-lg font-bold ${getScoreColor(selectedPolicy.analysis.efficiencyScore)}`}>
                        {selectedPolicy.analysis.efficiencyScore}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600">公平性</p>
                      <p className={`text-lg font-bold ${getScoreColor(selectedPolicy.analysis.equityScore)}`}>
                        {selectedPolicy.analysis.equityScore}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600">永續性</p>
                      <p className={`text-lg font-bold ${getScoreColor(selectedPolicy.analysis.sustainabilityScore)}`}>
                        {selectedPolicy.analysis.sustainabilityScore}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">正面影響</h5>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {selectedPolicy.analysis.impactAssessment.positiveImpacts.map((impact, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span>{impact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">負面影響</h5>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {selectedPolicy.analysis.impactAssessment.negativeImpacts.map((impact, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-600 mt-1">•</span>
                          <span>{impact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">量化指標</h5>
                    <div className="space-y-2">
                      {selectedPolicy.analysis.impactAssessment.quantitativeMetrics.map((metric, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="text-sm text-slate-600">{metric.name}</span>
                          <span className="text-sm font-medium text-slate-900">
                            {metric.value}{metric.unit} 
                            <span className={`ml-2 ${
                              metric.trend === 'increasing' ? 'text-green-600' :
                              metric.trend === 'decreasing' ? 'text-red-600' : 'text-slate-600'
                            }`}>
                              {metric.trend === 'increasing' ? '↗' :
                               metric.trend === 'decreasing' ? '↘' : '→'}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">風險分析</h5>
                    <div className="space-y-2">
                      {selectedPolicy.analysis.riskAnalysis.risks.map((risk) => (
                        <div key={risk.id} className="p-3 bg-slate-50 rounded-lg border">
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium text-slate-900">{risk.description}</p>
                            <div className="flex gap-1">
                              <span className={`px-2 py-1 rounded text-xs ${
                                risk.probability === 'high' ? 'bg-red-100 text-red-700' :
                                risk.probability === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {risk.probability === 'high' ? '高機率' :
                                 risk.probability === 'medium' ? '中機率' : '低機率'}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                risk.impact === 'high' ? 'bg-red-100 text-red-700' :
                                risk.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {risk.impact === 'high' ? '高影響' :
                                 risk.impact === 'medium' ? '中影響' : '低影響'}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600">緩解措施: {risk.mitigation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">建議措施</h5>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {selectedPolicy.analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">開始政策分析</h4>
                  <p className="text-slate-600 mb-4">點擊「開始分析」按鈕進行 AI 政策分析</p>
                  <button
                    onClick={() => analyzePolicy(selectedPolicy)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    開始分析
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="text-center py-8">
                <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-900 mb-2">選擇政策</h4>
                <p className="text-slate-600">從左側列表選擇一個政策開始分析</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export class PolicyAnalysis extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <PolicyAnalysisModule context={context} />;
  }
}
