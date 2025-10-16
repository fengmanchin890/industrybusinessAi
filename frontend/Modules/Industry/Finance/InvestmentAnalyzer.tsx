/**
 * AI 投資分析模組
 * 適用於金融機構的智能投資分析
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Target, BarChart3 } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';

const metadata: ModuleMetadata = {
  id: 'investment-analyzer',
  name: 'AI 投資分析',
  version: '1.0.0',
  category: 'finance',
  industry: ['finance'],
  description: 'AI 驅動的投資分析系統，智能選股與投資組合優化',
  icon: 'TrendingUp',
  author: 'AI Business Platform',
  pricingTier: 'pro',
  features: [
    '智能選股',
    '投資組合優化',
    '風險收益分析',
    '市場趨勢預測',
    '投資建議'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  pe: number;
  sector: string;
  score: number;
  recommendation: 'buy' | 'hold' | 'sell';
}

interface Portfolio {
  id: string;
  name: string;
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  risk: number;
  sharpeRatio: number;
  holdings: PortfolioHolding[];
}

interface PortfolioHolding {
  stock: Stock;
  shares: number;
  value: number;
  weight: number;
  return: number;
  returnPercent: number;
}

interface AnalysisResult {
  portfolioId: string;
  optimization: {
    expectedReturn: number;
    risk: number;
    sharpeRatio: number;
    recommendations: string[];
  };
  rebalancing: {
    suggestedChanges: RebalancingChange[];
    expectedImprovement: number;
  };
}

interface RebalancingChange {
  stock: Stock;
  currentWeight: number;
  suggestedWeight: number;
  action: 'buy' | 'sell' | 'hold';
  amount: number;
}

export function InvestmentAnalyzerModule({ context }: { context: ModuleContext }) {
  const { state, setRunning, setIdle } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stats, setStats] = useState({
    totalStocks: 0,
    totalPortfolios: 0,
    averageReturn: 0,
    topPerformer: ''
  });

  // 模擬股票數據
  const mockStocks: Stock[] = [
    {
      symbol: 'TSMC',
      name: '台積電',
      price: 580,
      change: 15,
      changePercent: 2.65,
      volume: 25000000,
      marketCap: 15000000000000,
      pe: 18.5,
      sector: '半導體',
      score: 85,
      recommendation: 'buy'
    },
    {
      symbol: '2330',
      name: '鴻海',
      price: 105,
      change: -2,
      changePercent: -1.87,
      volume: 18000000,
      marketCap: 1450000000000,
      pe: 12.3,
      sector: '電子製造',
      score: 72,
      recommendation: 'hold'
    },
    {
      symbol: '2454',
      name: '聯發科',
      price: 920,
      change: 25,
      changePercent: 2.79,
      volume: 12000000,
      marketCap: 1470000000000,
      pe: 22.1,
      sector: '半導體',
      score: 78,
      recommendation: 'buy'
    },
    {
      symbol: '2317',
      name: '鴻海',
      price: 98,
      change: -3,
      changePercent: -2.97,
      volume: 15000000,
      marketCap: 1350000000000,
      pe: 11.8,
      sector: '電子製造',
      score: 65,
      recommendation: 'sell'
    },
    {
      symbol: '2881',
      name: '富邦金',
      price: 65,
      change: 1.5,
      changePercent: 2.36,
      volume: 8000000,
      marketCap: 650000000000,
      pe: 8.9,
      sector: '金融',
      score: 70,
      recommendation: 'hold'
    }
  ];

  // 模擬投資組合數據
  const mockPortfolios: Portfolio[] = [
    {
      id: '1',
      name: '科技成長組合',
      totalValue: 1000000,
      totalReturn: 85000,
      totalReturnPercent: 8.5,
      risk: 15.2,
      sharpeRatio: 0.56,
      holdings: [
        {
          stock: mockStocks[0],
          shares: 1000,
          value: 580000,
          weight: 0.58,
          return: 50000,
          returnPercent: 9.43
        },
        {
          stock: mockStocks[2],
          shares: 200,
          value: 184000,
          weight: 0.184,
          return: 15000,
          returnPercent: 8.88
        },
        {
          stock: mockStocks[4],
          shares: 1000,
          value: 65000,
          weight: 0.065,
          return: 5000,
          returnPercent: 8.33
        }
      ]
    },
    {
      id: '2',
      name: '平衡型組合',
      totalValue: 500000,
      totalReturn: 25000,
      totalReturnPercent: 5.0,
      risk: 8.5,
      sharpeRatio: 0.59,
      holdings: [
        {
          stock: mockStocks[0],
          shares: 200,
          value: 116000,
          weight: 0.232,
          return: 10000,
          returnPercent: 9.43
        },
        {
          stock: mockStocks[1],
          shares: 500,
          value: 52500,
          weight: 0.105,
          return: -1000,
          returnPercent: -1.87
        },
        {
          stock: mockStocks[4],
          shares: 2000,
          value: 130000,
          weight: 0.26,
          return: 10000,
          returnPercent: 8.33
        }
      ]
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setStocks(mockStocks);
      setPortfolios(mockPortfolios);
      updateStats();
    } catch (error) {
      console.error('載入投資數據失敗:', error);
    }
  };

  const updateStats = () => {
    const totalStocks = stocks.length;
    const totalPortfolios = portfolios.length;
    const averageReturn = portfolios.length > 0 
      ? portfolios.reduce((sum, p) => sum + p.totalReturnPercent, 0) / portfolios.length 
      : 0;
    const topPerformer = portfolios.length > 0 
      ? portfolios.reduce((max, p) => p.totalReturnPercent > max.totalReturnPercent ? p : max).name
      : '';

    setStats({
      totalStocks,
      totalPortfolios,
      averageReturn: Math.round(averageReturn * 10) / 10,
      topPerformer
    });
  };

  const analyzePortfolio = async (portfolioId: string) => {
    setIsAnalyzing(true);
    setRunning();

    try {
      // 模擬AI投資分析過程
      await new Promise(resolve => setTimeout(resolve, 3000));

      const portfolio = portfolios.find(p => p.id === portfolioId);
      if (!portfolio) return;

      // 計算優化建議
      const expectedReturn = portfolio.totalReturnPercent + Math.random() * 2 - 1;
      const risk = portfolio.risk + Math.random() * 2 - 1;
      const sharpeRatio = expectedReturn / risk;

      const recommendations: string[] = [];
      const suggestedChanges: RebalancingChange[] = [];

      // 分析各持股
      portfolio.holdings.forEach(holding => {
        const stock = holding.stock;
        
        // 根據AI評分和推薦生成建議
        if (stock.recommendation === 'buy' && holding.weight < 0.3) {
          recommendations.push(`建議增持 ${stock.name}，目前權重過低`);
          suggestedChanges.push({
            stock,
            currentWeight: holding.weight,
            suggestedWeight: Math.min(holding.weight + 0.1, 0.3),
            action: 'buy',
            amount: Math.round((portfolio.totalValue * 0.1) / stock.price)
          });
        } else if (stock.recommendation === 'sell' && holding.weight > 0.1) {
          recommendations.push(`建議減持 ${stock.name}，風險過高`);
          suggestedChanges.push({
            stock,
            currentWeight: holding.weight,
            suggestedWeight: Math.max(holding.weight - 0.1, 0.05),
            action: 'sell',
            amount: Math.round((portfolio.totalValue * 0.1) / stock.price)
          });
        }
      });

      // 添加一般性建議
      if (portfolio.risk > 15) {
        recommendations.push('投資組合風險偏高，建議增加防禦性資產');
      }
      if (portfolio.sharpeRatio < 0.5) {
        recommendations.push('風險調整後收益偏低，建議優化資產配置');
      }

      const result: AnalysisResult = {
        portfolioId,
        optimization: {
          expectedReturn: Math.round(expectedReturn * 10) / 10,
          risk: Math.round(risk * 10) / 10,
          sharpeRatio: Math.round(sharpeRatio * 100) / 100,
          recommendations
        },
        rebalancing: {
          suggestedChanges,
          expectedImprovement: Math.round((expectedReturn - portfolio.totalReturnPercent) * 10) / 10
        }
      };

      setAnalysisResults(prev => {
        const filtered = prev.filter(r => r.portfolioId !== portfolioId);
        return [result, ...filtered];
      });

      // 發送警示
      if (result.optimization.risk > 20) {
        await sendAlert('high', '投資組合風險過高', `組合 ${portfolio.name} 風險達 ${result.optimization.risk}%，建議調整`);
      }

    } catch (error) {
      console.error('投資分析失敗:', error);
      await sendAlert('warning', '分析失敗', '投資分析過程中發生錯誤');
    } finally {
      setIsAnalyzing(false);
      setIdle();
    }
  };

  const analyzeAllPortfolios = async () => {
    setIsAnalyzing(true);
    setRunning();

    try {
      for (const portfolio of portfolios) {
        await analyzePortfolio(portfolio.id);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('批量分析失敗:', error);
    } finally {
      setIsAnalyzing(false);
      setIdle();
    }
  };

  const generateInvestmentReport = async () => {
    const reportContent = `
# 投資分析報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 投資總覽
- 追蹤股票數：${stats.totalStocks}
- 投資組合數：${stats.totalPortfolios}
- 平均報酬率：${stats.averageReturn}%
- 最佳表現組合：${stats.topPerformer}

## 股票分析
${stocks.map(stock => `
### ${stock.name} (${stock.symbol})
- 股價：NT$ ${stock.price}
- 漲跌：${stock.change > 0 ? '+' : ''}${stock.change} (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent}%)
- 成交量：${(stock.volume / 1000000).toFixed(1)}M
- 市值：NT$ ${(stock.marketCap / 1000000000).toFixed(0)}B
- 本益比：${stock.pe}
- 產業：${stock.sector}
- AI評分：${stock.score}/100
- 投資建議：${stock.recommendation === 'buy' ? '🟢 買入' : 
             stock.recommendation === 'hold' ? '🟡 持有' : '🔴 賣出'}
`).join('\n')}

## 投資組合詳情
${portfolios.map(portfolio => `
### ${portfolio.name}
- 總價值：NT$ ${portfolio.totalValue.toLocaleString()}
- 總報酬：NT$ ${portfolio.totalReturn.toLocaleString()} (${portfolio.totalReturnPercent > 0 ? '+' : ''}${portfolio.totalReturnPercent}%)
- 風險：${portfolio.risk}%
- 夏普比率：${portfolio.sharpeRatio}

#### 持股明細
${portfolio.holdings.map(holding => `
- ${holding.stock.name}: ${holding.shares}股 (${(holding.weight * 100).toFixed(1)}%)
  價值: NT$ ${holding.value.toLocaleString()}
  報酬: NT$ ${holding.return.toLocaleString()} (${holding.returnPercent > 0 ? '+' : ''}${holding.returnPercent}%)
`).join('')}
`).join('\n')}

## AI分析結果
${analysisResults.length === 0 ? '尚未進行投資分析' : analysisResults.map(result => {
  const portfolio = portfolios.find(p => p.id === result.portfolioId);
  return `
### ${portfolio?.name} - AI分析
- 預期報酬率：${result.optimization.expectedReturn}%
- 預期風險：${result.optimization.risk}%
- 夏普比率：${result.optimization.sharpeRatio}

#### 投資建議
${result.optimization.recommendations.map(rec => `- 💡 ${rec}`).join('\n')}

#### 再平衡建議
${result.rebalancing.suggestedChanges.length === 0 ? '無需調整' : result.rebalancing.suggestedChanges.map(change => `
- ${change.stock.name}: ${change.action === 'buy' ? '買入' : change.action === 'sell' ? '賣出' : '持有'}
  目前權重: ${(change.currentWeight * 100).toFixed(1)}% → 建議權重: ${(change.suggestedWeight * 100).toFixed(1)}%
  建議數量: ${change.amount}股
`).join('')}

預期改善：${result.rebalancing.expectedImprovement > 0 ? '+' : ''}${result.rebalancing.expectedImprovement}%
`;
}).join('\n')}

## 市場趨勢分析
${stocks.filter(s => s.changePercent > 0).length > stocks.filter(s => s.changePercent < 0).length ? 
  '📈 市場整體表現良好，多數股票上漲' :
  stocks.filter(s => s.changePercent < 0).length > stocks.filter(s => s.changePercent > 0).length ?
  '📉 市場表現疲弱，多數股票下跌' :
  '➡️ 市場表現平穩'}

## 風險警示
${portfolios.filter(p => p.risk > 15).length > 0 ? 
  `⚠️ 有 ${portfolios.filter(p => p.risk > 15).length} 個投資組合風險過高` :
  '✅ 所有投資組合風險控制良好'}

## 投資建議
1. 定期檢視投資組合表現
2. 根據市場變化調整資產配置
3. 注意風險控制，避免過度集中
4. 考慮分散投資降低風險
5. 關注基本面變化，適時調整策略
    `.trim();

    await generateReport('投資分析報告', reportContent, 'investment');
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'buy': return 'text-green-600 bg-green-100';
      case 'hold': return 'text-yellow-600 bg-yellow-100';
      case 'sell': return 'text-red-600 bg-red-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'buy': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'hold': return <Target className="w-5 h-5 text-yellow-600" />;
      case 'sell': return <TrendingDown className="w-5 h-5 text-red-600" />;
      default: return <Target className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 投資分析</h3>
          <p className="text-slate-600 mt-1">智能投資組合分析與優化建議</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={analyzeAllPortfolios}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                分析中...
              </>
            ) : (
              <>
                <BarChart3 className="w-5 h-5" />
                批量分析
              </>
            )}
          </button>
          <button
            onClick={generateInvestmentReport}
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
              <p className="text-sm text-slate-600">追蹤股票</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalStocks}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">投資組合</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.totalPortfolios}</p>
            </div>
            <PieChart className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均報酬</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.averageReturn}%</p>
            </div>
            <DollarSign className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">最佳組合</p>
              <p className="text-lg font-bold text-orange-600 mt-1">{stats.topPerformer}</p>
            </div>
            <Target className="w-10 h-10 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Stock Analysis */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-4">股票分析</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stocks.map((stock) => (
            <div key={stock.symbol} className="p-4 bg-slate-50 rounded-lg border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h5 className="font-semibold text-slate-900">{stock.name}</h5>
                  <p className="text-sm text-slate-600">{stock.symbol}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getRecommendationIcon(stock.recommendation)}
                  <span className={`px-2 py-1 rounded text-xs ${getRecommendationColor(stock.recommendation)}`}>
                    {stock.recommendation === 'buy' ? '買入' :
                     stock.recommendation === 'hold' ? '持有' : '賣出'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">股價:</span>
                  <span className="font-medium">NT$ {stock.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">漲跌:</span>
                  <span className={`font-medium ${stock.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.change > 0 ? '+' : ''}{stock.change} ({stock.changePercent > 0 ? '+' : ''}{stock.changePercent}%)
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">AI評分:</span>
                  <span className="font-medium">{stock.score}/100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">產業:</span>
                  <span className="font-medium">{stock.sector}</span>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                成交量: {(stock.volume / 1000000).toFixed(1)}M | 本益比: {stock.pe}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio Analysis */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-4">投資組合</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portfolios.map((portfolio) => (
            <div key={portfolio.id} className="p-4 bg-slate-50 rounded-lg border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h5 className="font-semibold text-slate-900">{portfolio.name}</h5>
                  <p className="text-sm text-slate-600">投資組合</p>
                </div>
                <button
                  onClick={() => analyzePortfolio(portfolio.id)}
                  disabled={isAnalyzing}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  分析
                </button>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">總價值:</span>
                  <span className="font-medium">NT$ {(portfolio.totalValue / 10000).toFixed(0)}萬</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">總報酬:</span>
                  <span className={`font-medium ${portfolio.totalReturnPercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {portfolio.totalReturnPercent > 0 ? '+' : ''}{portfolio.totalReturnPercent}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">風險:</span>
                  <span className="font-medium">{portfolio.risk}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">夏普比率:</span>
                  <span className="font-medium">{portfolio.sharpeRatio}</span>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                持股數: {portfolio.holdings.length} | 總報酬: NT$ {(portfolio.totalReturn / 10000).toFixed(0)}萬
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResults.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h4 className="text-lg font-bold text-slate-900 mb-4">AI分析結果</h4>
          <div className="space-y-4">
            {analysisResults.map((result, index) => {
              const portfolio = portfolios.find(p => p.id === result.portfolioId);
              return (
                <div key={index} className="p-4 bg-slate-50 rounded-lg border">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-semibold text-slate-900">{portfolio?.name}</h5>
                      <p className="text-sm text-slate-600">AI分析結果</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-600">預期報酬</div>
                      <div className="text-lg font-bold text-blue-600">{result.optimization.expectedReturn}%</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-sm text-slate-600">預期風險</div>
                      <div className="text-lg font-bold">{result.optimization.risk}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-slate-600">夏普比率</div>
                      <div className="text-lg font-bold">{result.optimization.sharpeRatio}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-slate-600">預期改善</div>
                      <div className={`text-lg font-bold ${result.rebalancing.expectedImprovement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {result.rebalancing.expectedImprovement > 0 ? '+' : ''}{result.rebalancing.expectedImprovement}%
                      </div>
                    </div>
                  </div>

                  {result.optimization.recommendations.length > 0 && (
                    <div className="mb-3">
                      <h6 className="text-sm font-semibold text-blue-700 mb-2">💡 投資建議</h6>
                      <ul className="text-sm text-blue-600 space-y-1">
                        {result.optimization.recommendations.map((rec, i) => (
                          <li key={i}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.rebalancing.suggestedChanges.length > 0 && (
                    <div>
                      <h6 className="text-sm font-semibold text-green-700 mb-2">🔄 再平衡建議</h6>
                      <div className="space-y-2">
                        {result.rebalancing.suggestedChanges.map((change, i) => (
                          <div key={i} className="text-sm text-green-600">
                            • {change.stock.name}: {change.action === 'buy' ? '買入' : change.action === 'sell' ? '賣出' : '持有'} {change.amount}股
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
export class InvestmentAnalyzer extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <InvestmentAnalyzerModule context={context} />;
  }
}
