/**
 * AI 風險評估模組
 * 適用於金融/保險的智能風險分析
 */

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, TrendingUp, TrendingDown, BarChart3, Calculator } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';

const metadata: ModuleMetadata = {
  id: 'risk-assessment',
  name: 'AI 風險評估',
  version: '1.0.0',
  category: 'finance',
  industry: ['finance'],
  description: 'AI 驅動的金融風險評估系統，智能分析信用風險與投資風險',
  icon: 'Shield',
  author: 'AI Business Platform',
  pricingTier: 'pro',
  features: [
    '信用風險評估',
    '投資風險分析',
    '市場風險監控',
    '風險預警系統',
    '合規性檢查'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface RiskProfile {
  id: string;
  name: string;
  type: 'individual' | 'corporate' | 'investment';
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastAssessment: Date;
  factors: RiskFactor[];
}

interface RiskFactor {
  category: string;
  score: number;
  weight: number;
  description: string;
  trend: 'up' | 'down' | 'stable';
}

interface AssessmentResult {
  profileId: string;
  overallScore: number;
  riskLevel: string;
  recommendations: string[];
  alerts: string[];
  confidence: number;
}

export function RiskAssessmentModule({ context }: { context: ModuleContext }) {
  const { state, setRunning, setIdle } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  
  const [riskProfiles, setRiskProfiles] = useState<RiskProfile[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [isAssessing, setIsAssessing] = useState(false);
  const [stats, setStats] = useState({
    totalProfiles: 0,
    highRiskProfiles: 0,
    averageRiskScore: 0,
    alertsGenerated: 0
  });

  // 模擬風險檔案數據
  const mockRiskProfiles: RiskProfile[] = [
    {
      id: '1',
      name: '王小明 - 個人信貸',
      type: 'individual',
      riskScore: 75,
      riskLevel: 'medium',
      lastAssessment: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      factors: [
        { category: '信用歷史', score: 80, weight: 0.3, description: '信用記錄良好', trend: 'stable' },
        { category: '收入穩定性', score: 70, weight: 0.25, description: '收入穩定但增長有限', trend: 'stable' },
        { category: '負債比率', score: 60, weight: 0.2, description: '負債比率偏高', trend: 'up' },
        { category: '就業狀況', score: 85, weight: 0.15, description: '就業穩定', trend: 'stable' },
        { category: '資產狀況', score: 65, weight: 0.1, description: '資產有限', trend: 'down' }
      ]
    },
    {
      id: '2',
      name: 'ABC科技公司 - 企業貸款',
      type: 'corporate',
      riskScore: 45,
      riskLevel: 'high',
      lastAssessment: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      factors: [
        { category: '財務狀況', score: 40, weight: 0.3, description: '財務狀況不佳', trend: 'down' },
        { category: '行業風險', score: 50, weight: 0.2, description: '行業競爭激烈', trend: 'down' },
        { category: '管理團隊', score: 60, weight: 0.2, description: '管理團隊經驗不足', trend: 'stable' },
        { category: '市場地位', score: 35, weight: 0.15, description: '市場地位薄弱', trend: 'down' },
        { category: '現金流', score: 45, weight: 0.15, description: '現金流緊張', trend: 'down' }
      ]
    },
    {
      id: '3',
      name: '科技股投資組合',
      type: 'investment',
      riskScore: 85,
      riskLevel: 'high',
      lastAssessment: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      factors: [
        { category: '市場波動', score: 90, weight: 0.25, description: '市場波動性高', trend: 'up' },
        { category: '行業集中度', score: 80, weight: 0.2, description: '行業集中度過高', trend: 'stable' },
        { category: '流動性風險', score: 75, weight: 0.15, description: '流動性風險中等', trend: 'stable' },
        { category: '估值風險', score: 85, weight: 0.2, description: '估值偏高', trend: 'up' },
        { category: '監管風險', score: 70, weight: 0.1, description: '監管環境變化', trend: 'up' },
        { category: '技術風險', score: 80, weight: 0.1, description: '技術變革風險', trend: 'stable' }
      ]
    }
  ];

  useEffect(() => {
    loadRiskProfiles();
  }, []);

  const loadRiskProfiles = async () => {
    try {
      setRiskProfiles(mockRiskProfiles);
      updateStats(mockRiskProfiles);
    } catch (error) {
      console.error('載入風險檔案失敗:', error);
    }
  };

  const updateStats = (profiles: RiskProfile[]) => {
    const totalProfiles = profiles.length;
    const highRiskProfiles = profiles.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length;
    const averageRiskScore = profiles.reduce((sum, p) => sum + p.riskScore, 0) / profiles.length;
    
    setStats({
      totalProfiles,
      highRiskProfiles,
      averageRiskScore: Math.round(averageRiskScore),
      alertsGenerated: assessmentResults.length
    });
  };

  const assessRisk = async (profileId: string) => {
    setIsAssessing(true);
    setRunning();

    try {
      // 模擬AI風險評估過程
      await new Promise(resolve => setTimeout(resolve, 3000));

      const profile = riskProfiles.find(p => p.id === profileId);
      if (!profile) return;

      // 計算加權風險分數
      const weightedScore = profile.factors.reduce((sum, factor) => 
        sum + (factor.score * factor.weight), 0
      );

      // 確定風險等級
      let riskLevel: string;
      if (weightedScore >= 80) riskLevel = 'critical';
      else if (weightedScore >= 60) riskLevel = 'high';
      else if (weightedScore >= 40) riskLevel = 'medium';
      else riskLevel = 'low';

      // 生成建議和警示
      const recommendations: string[] = [];
      const alerts: string[] = [];

      profile.factors.forEach(factor => {
        if (factor.score < 50) {
          alerts.push(`${factor.category}風險過高 (${factor.score}分)`);
          recommendations.push(`建議改善${factor.category}狀況`);
        } else if (factor.trend === 'down') {
          alerts.push(`${factor.category}趨勢惡化`);
          recommendations.push(`密切監控${factor.category}變化`);
        }
      });

      if (riskLevel === 'critical' || riskLevel === 'high') {
        alerts.push(`整體風險等級: ${riskLevel === 'critical' ? '極高' : '高'}`);
        recommendations.push('建議立即採取風險控制措施');
      }

      const result: AssessmentResult = {
        profileId,
        overallScore: Math.round(weightedScore),
        riskLevel,
        recommendations,
        alerts,
        confidence: 0.85 + Math.random() * 0.1
      };

      setAssessmentResults(prev => {
        const filtered = prev.filter(r => r.profileId !== profileId);
        return [result, ...filtered];
      });

      // 更新風險檔案
      setRiskProfiles(prev => prev.map(p => 
        p.id === profileId 
          ? { ...p, riskScore: result.overallScore, riskLevel: result.riskLevel as any, lastAssessment: new Date() }
          : p
      ));

      // 發送警示
      if (alerts.length > 0) {
        await sendAlert(
          riskLevel === 'critical' ? 'critical' : 'high',
          `風險評估警示 - ${profile.name}`,
          alerts.join('; ')
        );
      }

    } catch (error) {
      console.error('風險評估失敗:', error);
      await sendAlert('warning', '評估失敗', '風險評估過程中發生錯誤');
    } finally {
      setIsAssessing(false);
      setIdle();
    }
  };

  const assessAllProfiles = async () => {
    setIsAssessing(true);
    setRunning();

    try {
      for (const profile of riskProfiles) {
        await assessRisk(profile.id);
        // 添加延遲避免過快執行
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('批量評估失敗:', error);
    } finally {
      setIsAssessing(false);
      setIdle();
    }
  };

  const generateRiskReport = async () => {
    const reportContent = `
# 風險評估報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 風險總覽
- 總風險檔案數：${stats.totalProfiles}
- 高風險檔案數：${stats.highRiskProfiles}
- 平均風險分數：${stats.averageRiskScore}
- 生成警示數：${stats.alertsGenerated}

## 風險檔案詳情
${riskProfiles.map(profile => `
### ${profile.name}
- 類型：${profile.type === 'individual' ? '個人' : 
         profile.type === 'corporate' ? '企業' : '投資'}
- 風險分數：${profile.riskScore}/100
- 風險等級：${profile.riskLevel === 'low' ? '🟢 低' :
             profile.riskLevel === 'medium' ? '🟡 中' :
             profile.riskLevel === 'high' ? '🟠 高' : '🔴 極高'}
- 最後評估：${profile.lastAssessment.toLocaleDateString('zh-TW')}

#### 風險因子分析
${profile.factors.map(factor => `
- ${factor.category}: ${factor.score}分 (權重: ${(factor.weight * 100).toFixed(0)}%)
  ${factor.description}
  趨勢: ${factor.trend === 'up' ? '📈 上升' : factor.trend === 'down' ? '📉 下降' : '➡️ 穩定'}
`).join('')}
`).join('\n')}

## 評估結果
${assessmentResults.length === 0 ? '尚未進行風險評估' : assessmentResults.map(result => {
  const profile = riskProfiles.find(p => p.id === result.profileId);
  return `
### ${profile?.name} - 評估結果
- 綜合分數：${result.overallScore}/100
- 風險等級：${result.riskLevel === 'low' ? '🟢 低' :
             result.riskLevel === 'medium' ? '🟡 中' :
             result.riskLevel === 'high' ? '🟠 高' : '🔴 極高'}
- 置信度：${(result.confidence * 100).toFixed(1)}%

#### 風險警示
${result.alerts.length === 0 ? '✅ 無警示' : result.alerts.map(alert => `- ⚠️ ${alert}`).join('\n')}

#### 建議措施
${result.recommendations.map(rec => `- 💡 ${rec}`).join('\n')}
`;
}).join('\n')}

## 風險趨勢分析
${riskProfiles.map(profile => {
  const improvingFactors = profile.factors.filter(f => f.trend === 'up').length;
  const decliningFactors = profile.factors.filter(f => f.trend === 'down').length;
  return `
### ${profile.name}
- 改善因子：${improvingFactors} 個
- 惡化因子：${decliningFactors} 個
- 趨勢評估：${decliningFactors > improvingFactors ? '📉 風險上升' : 
             improvingFactors > decliningFactors ? '📈 風險下降' : '➡️ 風險穩定'}
`;
}).join('\n')}

## 建議措施
${stats.highRiskProfiles > 0 ? `⚠️ 有 ${stats.highRiskProfiles} 個高風險檔案需要關注` : '✅ 風險控制良好'}
${stats.averageRiskScore > 70 ? '⚠️ 平均風險分數偏高，建議加強風險管理' : '✅ 風險水準正常'}

## 合規性檢查
- 風險評估頻率：符合監管要求
- 風險分級標準：符合內部政策
- 警示機制：正常運作
- 報告完整性：符合要求
    `.trim();

    await generateReport('風險評估報告', reportContent, 'risk');
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case 'low': return <Shield className="w-5 h-5 text-green-600" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Shield className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 風險評估</h3>
          <p className="text-slate-600 mt-1">智能金融風險分析與預警系統</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={assessAllProfiles}
            disabled={isAssessing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAssessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                評估中...
              </>
            ) : (
              <>
                <BarChart3 className="w-5 h-5" />
                批量評估
              </>
            )}
          </button>
          <button
            onClick={generateRiskReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            生成報告
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">總檔案數</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalProfiles}</p>
            </div>
            <Shield className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">高風險檔案</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.highRiskProfiles}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均風險分數</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{stats.averageRiskScore}</p>
            </div>
            <Calculator className="w-10 h-10 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">生成警示</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.alertsGenerated}</p>
            </div>
            <BarChart3 className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Risk Profiles */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-4">風險檔案</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {riskProfiles.map((profile) => (
            <div key={profile.id} className="p-4 bg-slate-50 rounded-lg border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h5 className="font-semibold text-slate-900">{profile.name}</h5>
                  <p className="text-sm text-slate-600">
                    {profile.type === 'individual' ? '個人' : 
                     profile.type === 'corporate' ? '企業' : '投資'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getRiskLevelIcon(profile.riskLevel)}
                  <span className={`px-2 py-1 rounded text-xs ${getRiskLevelColor(profile.riskLevel)}`}>
                    {profile.riskLevel === 'low' ? '低' :
                     profile.riskLevel === 'medium' ? '中' :
                     profile.riskLevel === 'high' ? '高' : '極高'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">風險分數:</span>
                  <span className="font-medium">{profile.riskScore}/100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">最後評估:</span>
                  <span className="font-medium">{profile.lastAssessment.toLocaleDateString('zh-TW')}</span>
                </div>
              </div>

              <div className="space-y-1 mb-4">
                {profile.factors.slice(0, 3).map((factor, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{factor.category}:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{factor.score}</span>
                      {factor.trend === 'up' && <TrendingUp className="w-3 h-3 text-red-500" />}
                      {factor.trend === 'down' && <TrendingDown className="w-3 h-3 text-green-500" />}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => assessRisk(profile.id)}
                disabled={isAssessing}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                評估風險
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Assessment Results */}
      {assessmentResults.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h4 className="text-lg font-bold text-slate-900 mb-4">評估結果</h4>
          <div className="space-y-4">
            {assessmentResults.map((result, index) => {
              const profile = riskProfiles.find(p => p.id === result.profileId);
              return (
                <div key={index} className="p-4 bg-slate-50 rounded-lg border">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-semibold text-slate-900">{profile?.name}</h5>
                      <p className="text-sm text-slate-600">評估結果</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{result.overallScore}/100</span>
                      <span className={`px-2 py-1 rounded text-xs ${getRiskLevelColor(result.riskLevel)}`}>
                        {result.riskLevel === 'low' ? '低風險' :
                         result.riskLevel === 'medium' ? '中風險' :
                         result.riskLevel === 'high' ? '高風險' : '極高風險'}
                      </span>
                    </div>
                  </div>

                  {result.alerts.length > 0 && (
                    <div className="mb-3">
                      <h6 className="text-sm font-semibold text-red-700 mb-2">⚠️ 風險警示</h6>
                      <ul className="text-sm text-red-600 space-y-1">
                        {result.alerts.map((alert, i) => (
                          <li key={i}>• {alert}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.recommendations.length > 0 && (
                    <div>
                      <h6 className="text-sm font-semibold text-blue-700 mb-2">💡 建議措施</h6>
                      <ul className="text-sm text-blue-600 space-y-1">
                        {result.recommendations.map((rec, i) => (
                          <li key={i}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-3 text-xs text-slate-500">
                    置信度: {(result.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// 導出模組類（用於註冊）
export class RiskAssessment extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <RiskAssessmentModule context={context} />;
  }
}
