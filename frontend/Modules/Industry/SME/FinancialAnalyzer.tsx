/**
 * AI 財務分析助理 - 現金流預測與預算建議
 * 為中小企業提供智能財務分析
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, AlertTriangle, Calculator } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../Contexts/AuthContext';
import { generateText, analyzeData } from '../../../lib/ai-service';

const metadata: ModuleMetadata = {
  id: 'financial-analyzer',
  name: 'AI 財務分析助理',
  version: '1.0.0',
  category: 'sme',
  industry: ['sme'],
  description: '智能財務分析，現金流預測，預算建議，為中小企業提供財務決策支援',
  icon: 'Calculator',
  author: 'AI Business Platform',
  pricingTier: 'basic',
  features: [
    '現金流預測分析',
    '自動預算建議',
    '財務風險警示',
    '收支趨勢分析',
    '投資回報計算'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: false
};

interface FinancialData {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
}

interface CashFlowProjection {
  month: string;
  projectedIncome: number;
  projectedExpense: number;
  netCashFlow: number;
  cumulativeBalance: number;
}

interface BudgetRecommendation {
  category: string;
  currentSpending: number;
  recommendedBudget: number;
  variance: number;
  priority: 'high' | 'medium' | 'low';
}

export function FinancialAnalyzerModule({ context }: { context: ModuleContext }) {
  const { state, setRunning } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  const { company } = useAuth();
  
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [cashFlowProjection, setCashFlowProjection] = useState<CashFlowProjection[]>([]);
  const [budgetRecommendations, setBudgetRecommendations] = useState<BudgetRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    cashFlowTrend: 'stable' as 'up' | 'down' | 'stable',
    riskLevel: 'low' as 'low' | 'medium' | 'high'
  });

  // 載入財務數據
  useEffect(() => {
    loadFinancialData();
  }, [company?.id]);

  const loadFinancialData = async () => {
    if (!company?.id) return;
    
    setLoading(true);
    try {
      // 模擬財務數據 - 實際應用中會從 ERP/會計系統獲取
      const mockData: FinancialData[] = [
        { id: '1', date: '2024-01-01', type: 'income', category: '銷售收入', amount: 500000, description: '產品銷售' },
        { id: '2', date: '2024-01-02', type: 'expense', category: '人事成本', amount: 150000, description: '員工薪資' },
        { id: '3', date: '2024-01-03', type: 'expense', category: '營運費用', amount: 80000, description: '辦公室租金' },
        { id: '4', date: '2024-01-04', type: 'income', category: '服務收入', amount: 200000, description: '諮詢服務' },
        { id: '5', date: '2024-01-05', type: 'expense', category: '行銷費用', amount: 50000, description: '廣告投放' },
        { id: '6', date: '2024-01-06', type: 'expense', category: '設備維護', amount: 30000, description: '設備保養' },
        { id: '7', date: '2024-01-07', type: 'income', category: '其他收入', amount: 100000, description: '投資收益' },
        { id: '8', date: '2024-01-08', type: 'expense', category: '稅務費用', amount: 40000, description: '營業稅' }
      ];
      
      setFinancialData(mockData);
      
      // 計算摘要
      const totalIncome = mockData.filter(d => d.type === 'income').reduce((sum, d) => sum + d.amount, 0);
      const totalExpense = mockData.filter(d => d.type === 'expense').reduce((sum, d) => sum + d.amount, 0);
      const netProfit = totalIncome - totalExpense;
      
      setSummary({
        totalIncome,
        totalExpense,
        netProfit,
        cashFlowTrend: netProfit > 0 ? 'up' : netProfit < -50000 ? 'down' : 'stable',
        riskLevel: netProfit < -100000 ? 'high' : netProfit < 0 ? 'medium' : 'low'
      });
      
      // 生成現金流預測
      generateCashFlowProjection(mockData);
      
      // 生成預算建議
      generateBudgetRecommendations(mockData);
      
    } catch (error) {
      console.error('載入財務數據失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCashFlowProjection = (data: FinancialData[]) => {
    const projection: CashFlowProjection[] = [];
    const currentMonth = new Date();
    
    for (let i = 0; i < 6; i++) {
      const month = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + i, 1);
      const monthStr = month.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });
      
      // 基於歷史數據預測
      const avgIncome = data.filter(d => d.type === 'income').reduce((sum, d) => sum + d.amount, 0) / 3;
      const avgExpense = data.filter(d => d.type === 'expense').reduce((sum, d) => sum + d.amount, 0) / 3;
      
      const projectedIncome = avgIncome * (1 + (Math.random() - 0.5) * 0.2);
      const projectedExpense = avgExpense * (1 + (Math.random() - 0.5) * 0.1);
      const netCashFlow = projectedIncome - projectedExpense;
      
      const cumulativeBalance = i === 0 ? summary.netProfit : 
        projection[i - 1].cumulativeBalance + netCashFlow;
      
      projection.push({
        month: monthStr,
        projectedIncome,
        projectedExpense,
        netCashFlow,
        cumulativeBalance
      });
    }
    
    setCashFlowProjection(projection);
  };

  const generateBudgetRecommendations = (data: FinancialData[]) => {
    const categoryTotals = data.reduce((acc, item) => {
      if (item.type === 'expense') {
        acc[item.category] = (acc[item.category] || 0) + item.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    const recommendations: BudgetRecommendation[] = Object.entries(categoryTotals).map(([category, currentSpending]) => {
      let recommendedBudget = currentSpending;
      let priority: 'high' | 'medium' | 'low' = 'low';
      
      // AI 預算建議邏輯
      if (category === '人事成本') {
        recommendedBudget = currentSpending * 1.05; // 建議增加 5%
        priority = 'high';
      } else if (category === '行銷費用') {
        recommendedBudget = currentSpending * 1.2; // 建議增加 20%
        priority = 'medium';
      } else if (category === '營運費用') {
        recommendedBudget = currentSpending * 0.95; // 建議減少 5%
        priority = 'medium';
      }
      
      return {
        category,
        currentSpending,
        recommendedBudget,
        variance: recommendedBudget - currentSpending,
        priority
      };
    });

    setBudgetRecommendations(recommendations);
  };

  const generateFinancialReport = async () => {
    try {
      // 使用 AI 分析財務數據
      const financialDataForAI = {
        summary,
        cashFlowProjection,
        budgetRecommendations,
        transactions: financialData
      };

      const aiAnalysis = await analyzeData([financialDataForAI], '財務分析');
      
      const reportContent = `
# 財務分析報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 財務摘要
- 總收入：NT$ ${summary.totalIncome.toLocaleString()}
- 總支出：NT$ ${summary.totalExpense.toLocaleString()}
- 淨利潤：NT$ ${summary.netProfit.toLocaleString()}
- 現金流趨勢：${summary.cashFlowTrend === 'up' ? '📈 上升' : summary.cashFlowTrend === 'down' ? '📉 下降' : '➡️ 穩定'}
- 風險等級：${summary.riskLevel === 'high' ? '🔴 高' : summary.riskLevel === 'medium' ? '🟡 中' : '🟢 低'}

## 現金流預測（未來 6 個月）
${cashFlowProjection.map(p => `
### ${p.month}
- 預期收入：NT$ ${p.projectedIncome.toLocaleString()}
- 預期支出：NT$ ${p.projectedExpense.toLocaleString()}
- 淨現金流：NT$ ${p.netCashFlow.toLocaleString()}
- 累積餘額：NT$ ${p.cumulativeBalance.toLocaleString()}
`).join('\n')}

## 預算建議
${budgetRecommendations.map(r => `
### ${r.category}
- 目前支出：NT$ ${r.currentSpending.toLocaleString()}
- 建議預算：NT$ ${r.recommendedBudget.toLocaleString()}
- 差異：NT$ ${r.variance.toLocaleString()} (${r.variance > 0 ? '增加' : '減少'})
- 優先級：${r.priority === 'high' ? '🔴 高' : r.priority === 'medium' ? '🟡 中' : '🟢 低'}
`).join('\n')}

## AI 深度分析
${aiAnalysis}

## 傳統建議
${summary.riskLevel === 'high' ? '⚠️ 財務風險較高，建議立即檢討支出結構' : 
  summary.riskLevel === 'medium' ? '💡 財務狀況一般，建議優化成本控制' : 
  '✅ 財務狀況良好，可考慮投資擴張'}
      `.trim();

      await generateReport('財務分析報告', reportContent, 'financial');
    } catch (error) {
      console.error('AI 分析失敗:', error);
      
      // 備用報告生成
      const reportContent = `
# 財務分析報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 財務摘要
- 總收入：NT$ ${summary.totalIncome.toLocaleString()}
- 總支出：NT$ ${summary.totalExpense.toLocaleString()}
- 淨利潤：NT$ ${summary.netProfit.toLocaleString()}
- 現金流趨勢：${summary.cashFlowTrend === 'up' ? '📈 上升' : summary.cashFlowTrend === 'down' ? '📉 下降' : '➡️ 穩定'}
- 風險等級：${summary.riskLevel === 'high' ? '🔴 高' : summary.riskLevel === 'medium' ? '🟡 中' : '🟢 低'}

## 現金流預測（未來 6 個月）
${cashFlowProjection.map(p => `
### ${p.month}
- 預期收入：NT$ ${p.projectedIncome.toLocaleString()}
- 預期支出：NT$ ${p.projectedExpense.toLocaleString()}
- 淨現金流：NT$ ${p.netCashFlow.toLocaleString()}
- 累積餘額：NT$ ${p.cumulativeBalance.toLocaleString()}
`).join('\n')}

## 預算建議
${budgetRecommendations.map(r => `
### ${r.category}
- 目前支出：NT$ ${r.currentSpending.toLocaleString()}
- 建議預算：NT$ ${r.recommendedBudget.toLocaleString()}
- 差異：NT$ ${r.variance.toLocaleString()} (${r.variance > 0 ? '增加' : '減少'})
- 優先級：${r.priority === 'high' ? '🔴 高' : r.priority === 'medium' ? '🟡 中' : '🟢 低'}
`).join('\n')}

## 建議
${summary.riskLevel === 'high' ? '⚠️ 財務風險較高，建議立即檢討支出結構' : 
  summary.riskLevel === 'medium' ? '💡 財務狀況一般，建議優化成本控制' : 
  '✅ 財務狀況良好，可考慮投資擴張'}
      `.trim();

      await generateReport('財務分析報告', reportContent, 'financial');
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'down': return <TrendingDown className="w-5 h-5 text-red-600" />;
      default: return <TrendingUp className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 財務分析助理</h3>
          <p className="text-slate-600 mt-1">智能財務分析，現金流預測，預算建議</p>
        </div>
        <button
          onClick={generateFinancialReport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          生成報告
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">總收入</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                NT$ {summary.totalIncome.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">總支出</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                NT$ {summary.totalExpense.toLocaleString()}
              </p>
            </div>
            <TrendingDown className="w-10 h-10 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">淨利潤</p>
              <p className={`text-3xl font-bold mt-1 ${
                summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                NT$ {summary.netProfit.toLocaleString()}
              </p>
            </div>
            {getTrendIcon(summary.cashFlowTrend)}
          </div>
        </div>
        
        <div className={`rounded-xl border p-6 ${getRiskColor(summary.riskLevel)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-75">風險等級</p>
              <p className="text-3xl font-bold mt-1">
                {summary.riskLevel === 'high' ? '高' : summary.riskLevel === 'medium' ? '中' : '低'}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* Cash Flow Projection */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-4">現金流預測</h4>
        <div className="space-y-3">
          {cashFlowProjection.map((projection, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <h5 className="font-semibold text-slate-900">{projection.month}</h5>
                <p className="text-sm text-slate-600">
                  收入: NT$ {projection.projectedIncome.toLocaleString()} | 
                  支出: NT$ {projection.projectedExpense.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  projection.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  NT$ {projection.netCashFlow.toLocaleString()}
                </div>
                <div className="text-sm text-slate-600">
                  餘額: NT$ {projection.cumulativeBalance.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Recommendations */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-4">預算建議</h4>
        <div className="space-y-3">
          {budgetRecommendations.map((rec, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <h5 className="font-semibold text-slate-900">{rec.category}</h5>
                <p className="text-sm text-slate-600">
                  目前: NT$ {rec.currentSpending.toLocaleString()} | 
                  建議: NT$ {rec.recommendedBudget.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  rec.variance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {rec.variance >= 0 ? '+' : ''}NT$ {rec.variance.toLocaleString()}
                </div>
                <div className={`text-sm px-2 py-1 rounded ${
                  rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                  rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {rec.priority === 'high' ? '高優先級' : 
                   rec.priority === 'medium' ? '中優先級' : '低優先級'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-4">財務記錄</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2">日期</th>
                <th className="text-left py-2">類型</th>
                <th className="text-left py-2">類別</th>
                <th className="text-left py-2">金額</th>
                <th className="text-left py-2">描述</th>
              </tr>
            </thead>
            <tbody>
              {financialData.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-2">{item.date}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      item.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.type === 'income' ? '收入' : '支出'}
                    </span>
                  </td>
                  <td className="py-2">{item.category}</td>
                  <td className={`py-2 font-semibold ${
                    item.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    NT$ {item.amount.toLocaleString()}
                  </td>
                  <td className="py-2">{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export class FinancialAnalyzer extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <FinancialAnalyzerModule context={context} />;
  }
}
