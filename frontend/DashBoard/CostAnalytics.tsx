/**
 * Cost Analytics Dashboard
 * Show AI spend, model usage distribution, cache performance, and cost optimization recommendations
 */

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Zap,
  Brain,
  Database,
  PieChart,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../Contexts/AuthContext';
import { aiAdapter } from '../lib/ai-adapter';

interface CostStats {
  totalCost: number;
  totalTokens: number;
  totalRequests: number;
  avgCostPerRequest: number;
  cacheHitRate: number;
  costSavings: number;
  byModel: Record<string, {
    count: number;
    tokens: number;
    cost: number;
  }>;
  byOperation: Record<string, {
    count: number;
    tokens: number;
    cost: number;
  }>;
  trend: 'up' | 'down' | 'stable';
}

interface Recommendation {
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  potential_savings: number;
  action: string;
}

export default function CostAnalytics() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CostStats | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get usage statistics from AI adapter
      const startDate = getStartDate(period);
      const usageStats = await aiAdapter.getUsageStats(startDate);
      
      if (usageStats) {
        // Transform to CostStats format
        const costStats: CostStats = {
          totalCost: usageStats.totalCost,
          totalTokens: usageStats.totalTokens,
          totalRequests: usageStats.totalRequests,
          avgCostPerRequest: usageStats.totalCost / usageStats.totalRequests || 0,
          cacheHitRate: usageStats.cacheHitRate,
          costSavings: calculateSavings(usageStats),
          byModel: usageStats.byModel,
          byOperation: usageStats.byOperation,
          trend: determineTrend(usageStats)
        };
        
        setStats(costStats);
        
        // Generate recommendations
        const recs = generateRecommendations(costStats);
        setRecommendations(recs);
      }
    } catch (error) {
      console.error('Failed to load cost analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = (period: string): Date => {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  };

  const calculateSavings = (usageStats: any): number => {
    // Calculate savings from cache hits
    const cacheHits = usageStats.totalRequests * usageStats.cacheHitRate;
    const avgCost = usageStats.totalCost / usageStats.totalRequests || 0;
    return cacheHits * avgCost;
  };

  const determineTrend = (usageStats: any): 'up' | 'down' | 'stable' => {
    // This would compare with previous period
    // For now, return stable
    return 'stable';
  };

  const generateRecommendations = (stats: CostStats): Recommendation[] => {
    const recs: Recommendation[] = [];

    // Check cache hit rate
    if (stats.cacheHitRate < 0.3) {
      recs.push({
        type: 'warning',
        title: '低快取命中率',
        description: `您的快取命中率僅 ${(stats.cacheHitRate * 100).toFixed(1)}%。啟用快取可顯著降低成本。`,
        potential_savings: stats.totalCost * 0.3,
        action: '啟用 AI 回應快取'
      });
    } else if (stats.cacheHitRate > 0.7) {
      recs.push({
        type: 'success',
        title: '優秀的快取效能',
        description: `您的快取命中率達 ${(stats.cacheHitRate * 100).toFixed(1)}%，已節省約 $${stats.costSavings.toFixed(2)}`,
        potential_savings: 0,
        action: '繼續保持'
      });
    }

    // Check for expensive models
    const expensiveModels = Object.entries(stats.byModel).filter(
      ([model, data]) => model.includes('gpt-4') || model.includes('opus')
    );
    
    if (expensiveModels.length > 0) {
      const expensiveCost = expensiveModels.reduce((sum, [_, data]) => sum + data.cost, 0);
      const expensiveRatio = expensiveCost / stats.totalCost;
      
      if (expensiveRatio > 0.5) {
        recs.push({
          type: 'info',
          title: '考慮使用更經濟的模型',
          description: `${(expensiveRatio * 100).toFixed(0)}% 的成本來自高階模型。對於一般任務，可考慮使用 GPT-3.5 或 Claude Haiku。`,
          potential_savings: expensiveCost * 0.8,
          action: '測試替代模型'
        });
      }
    }

    // Check for high-volume operations
    const operations = Object.entries(stats.byOperation);
    if (operations.length > 0) {
      const sorted = operations.sort((a, b) => b[1].cost - a[1].cost);
      const topOperation = sorted[0];
      
      if (topOperation[1].cost / stats.totalCost > 0.4) {
        recs.push({
          type: 'info',
          title: '優化高成本操作',
          description: `「${topOperation[0]}」操作佔總成本的 ${((topOperation[1].cost / stats.totalCost) * 100).toFixed(0)}%。優化此操作可大幅降低成本。`,
          potential_savings: topOperation[1].cost * 0.3,
          action: '查看優化建議'
        });
      }
    }

    return recs;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">載入中...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-center text-gray-600">
        無法載入成本分析數據
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">成本分析</h1>
        <p className="text-gray-600">AI 支出追蹤與優化建議</p>
      </div>

      {/* Period Selector */}
      <div className="mb-6 flex space-x-2">
        {(['day', 'week', 'month'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg font-medium ${
              period === p
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {p === 'day' ? '今天' : p === 'week' ? '本週' : '本月'}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-10 h-10 text-green-500" />
            {stats.trend === 'up' ? (
              <TrendingUp className="w-5 h-5 text-red-500" />
            ) : stats.trend === 'down' ? (
              <TrendingDown className="w-5 h-5 text-green-500" />
            ) : null}
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            ${stats.totalCost.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">總成本</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <Database className="w-10 h-10 text-blue-500 mb-4" />
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stats.totalRequests.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">AI 請求數</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <Zap className="w-10 h-10 text-purple-500 mb-4" />
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {(stats.cacheHitRate * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">快取命中率</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <TrendingDown className="w-10 h-10 text-green-500 mb-4" />
          <div className="text-3xl font-bold text-green-600 mb-1">
            ${stats.costSavings.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">快取節省成本</div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">優化建議</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`rounded-lg p-6 border-l-4 ${
                  rec.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-500'
                    : rec.type === 'success'
                    ? 'bg-green-50 border-green-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start">
                  {rec.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1 mr-3" />
                  ) : rec.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1 mr-3" />
                  ) : (
                    <Brain className="w-5 h-5 text-blue-600 mt-1 mr-3" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{rec.title}</h3>
                    <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                    {rec.potential_savings > 0 && (
                      <p className="text-sm font-medium text-green-600 mb-2">
                        💰 潛在節省: ${rec.potential_savings.toFixed(2)}
                      </p>
                    )}
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      {rec.action} →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model Usage Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-blue-500" />
            模型使用分佈
          </h3>
          <div className="space-y-4">
            {Object.entries(stats.byModel).map(([model, data]) => (
              <div key={model}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{model}</span>
                  <span className="text-sm text-gray-500">
                    ${data.cost.toFixed(2)} ({((data.cost / stats.totalCost) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(data.cost / stats.totalCost) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {data.count} 次請求 • {data.tokens.toLocaleString()} tokens
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
            操作類型分佈
          </h3>
          <div className="space-y-4">
            {Object.entries(stats.byOperation).map(([operation, data]) => (
              <div key={operation}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{operation}</span>
                  <span className="text-sm text-gray-500">
                    ${data.cost.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${(data.cost / stats.totalCost) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {data.count} 次請求 • {data.tokens.toLocaleString()} tokens
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">成本明細</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-gray-600">總 Token 使用量</span>
            <span className="font-semibold">{stats.totalTokens.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-gray-600">平均每次請求成本</span>
            <span className="font-semibold">${stats.avgCostPerRequest.toFixed(4)}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-gray-600">快取節省</span>
            <span className="font-semibold text-green-600">-${stats.costSavings.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-gray-700 font-medium">淨成本</span>
            <span className="text-xl font-bold text-gray-900">
              ${(stats.totalCost - stats.costSavings).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}



