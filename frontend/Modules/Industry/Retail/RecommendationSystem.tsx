/**
 * AI 推荐系统模组 - 个性化推荐
 * 基于用户行为和商品特征的智能推荐
 */

import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Users, ShoppingCart, Target, BarChart3 } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration } from '../../ModuleSDK';

const metadata: ModuleMetadata = {
  id: 'recommendation-system',
  name: 'AI 推荐系统',
  version: '1.0.0',
  category: 'retail',
  industry: ['retail'],
  description: '个性化商品推荐，提升转换率和客单价',
  icon: 'Sparkles',
  author: 'AI Business Platform',
  pricingTier: 'pro',
  features: [
    '协同过滤推荐',
    '内容推荐',
    '实时推荐',
    'A/B 测试',
    '效果追踪'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: false,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  score: number;
}

interface RecommendationStrategy {
  id: string;
  name: string;
  description: string;
  active: boolean;
  performance: {
    ctr: number;
    cvr: number;
    revenue: number;
  };
}

const mockProducts: Product[] = [
  { id: '1', name: '无线蓝牙耳机', category: '3C数码', price: 299, image: '🎧', score: 0.95 },
  { id: '2', name: '运动手环', category: '智能穿戴', price: 199, image: '⌚', score: 0.92 },
  { id: '3', name: '便携充电宝', category: '3C数码', price: 159, image: '🔋', score: 0.88 },
  { id: '4', name: '防水运动包', category: '户外用品', price: 399, image: '🎒', score: 0.85 },
  { id: '5', name: '智能体重秤', category: '健康', price: 129, image: '⚖️', score: 0.82 },
  { id: '6', name: '保温水壶', category: '生活用品', price: 89, image: '🍶', score: 0.78 },
];

export function RecommendationSystemModule({ context }: { context: ModuleContext }) {
  const { state, setRunning } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  
  const [selectedStrategy, setSelectedStrategy] = useState<string>('collaborative');
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    totalRecommendations: 15243,
    clickThroughRate: 8.7,
    conversionRate: 3.2,
    avgOrderValue: 458
  });

  const strategies: RecommendationStrategy[] = [
    {
      id: 'collaborative',
      name: '协同过滤推荐',
      description: '基于用户行为相似度推荐',
      active: true,
      performance: { ctr: 8.7, cvr: 3.2, revenue: 125600 }
    },
    {
      id: 'content',
      name: '内容推荐',
      description: '基于商品特征相似度推荐',
      active: true,
      performance: { ctr: 7.2, cvr: 2.8, revenue: 98300 }
    },
    {
      id: 'realtime',
      name: '实时推荐',
      description: '基于当前浏览行为推荐',
      active: true,
      performance: { ctr: 9.1, cvr: 3.5, revenue: 142800 }
    },
    {
      id: 'trending',
      name: '热门推荐',
      description: '基于商品热度推荐',
      active: false,
      performance: { ctr: 6.5, cvr: 2.1, revenue: 76500 }
    }
  ];

  useEffect(() => {
    setRunning();
    loadRecommendations();
  }, [selectedStrategy]);

  const loadRecommendations = () => {
    // 模拟加载推荐结果
    const shuffled = [...mockProducts]
      .map(p => ({ ...p, score: Math.random() * 0.3 + 0.7 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
    setRecommendations(shuffled);
  };

  const generatePerformanceReport = async () => {
    const reportContent = `
# AI 推荐系统性能报告
生成时间：${new Date().toLocaleString('zh-TW')}

## 整体表现
- 总推荐次数：${stats.totalRecommendations.toLocaleString()}
- 点击率 (CTR)：${stats.clickThroughRate}%
- 转化率 (CVR)：${stats.conversionRate}%
- 平均订单金额：¥${stats.avgOrderValue}

## 推荐策略对比

### 1. 协同过滤推荐
- 点击率：${strategies[0].performance.ctr}%
- 转化率：${strategies[0].performance.cvr}%
- 贡献营收：¥${strategies[0].performance.revenue.toLocaleString()}
- 状态：${strategies[0].active ? '✅ 启用中' : '⏸️ 已停用'}

### 2. 内容推荐
- 点击率：${strategies[1].performance.ctr}%
- 转化率：${strategies[1].performance.cvr}%
- 贡献营收：¥${strategies[1].performance.revenue.toLocaleString()}
- 状态：${strategies[1].active ? '✅ 启用中' : '⏸️ 已停用'}

### 3. 实时推荐
- 点击率：${strategies[2].performance.ctr}%
- 转化率：${strategies[2].performance.cvr}%
- 贡献营收：¥${strategies[2].performance.revenue.toLocaleString()}
- 状态：${strategies[2].active ? '✅ 启用中' : '⏸️ 已停用'}

## 优化建议
${stats.clickThroughRate < 7 ? '⚠️ 点击率偏低，建议优化推荐算法' :
  stats.conversionRate < 3 ? '⚠️ 转化率有待提升，建议优化推荐精准度' :
  '✅ 推荐表现良好，建议继续优化以提升营收'}

## 最佳推荐商品 Top 6
${recommendations.map((p, i) => `${i + 1}. ${p.name} - 推荐分数：${(p.score * 100).toFixed(1)}%`).join('\n')}
    `.trim();

    await generateReport('AI 推荐系统性能报告', reportContent, 'recommendation_performance');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 推荐系统</h3>
          <p className="text-slate-600 mt-1">个性化商品推荐，提升转换率和客单价</p>
        </div>
        <button
          onClick={generatePerformanceReport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          生成报告
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">总推荐次数</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalRecommendations.toLocaleString()}</p>
            </div>
            <Target className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 rounded-xl border border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">点击率 (CTR)</p>
              <p className="text-3xl font-bold text-green-700 mt-1">{stats.clickThroughRate}%</p>
            </div>
            <Users className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700">转化率 (CVR)</p>
              <p className="text-3xl font-bold text-amber-700 mt-1">{stats.conversionRate}%</p>
            </div>
            <ShoppingCart className="w-10 h-10 text-amber-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl border border-purple-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700">平均订单金额</p>
              <p className="text-3xl font-bold text-purple-700 mt-1">¥{stats.avgOrderValue}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Recommendation Strategies */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-slate-700" />
          <h4 className="text-lg font-bold text-slate-900">推荐策略</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategies.map(strategy => (
            <div
              key={strategy.id}
              onClick={() => setSelectedStrategy(strategy.id)}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedStrategy === strategy.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h5 className="font-bold text-slate-900">{strategy.name}</h5>
                  <p className="text-sm text-slate-600 mt-1">{strategy.description}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  strategy.active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {strategy.active ? '启用中' : '已停用'}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200">
                <div>
                  <p className="text-xs text-slate-500">CTR</p>
                  <p className="font-bold text-green-600">{strategy.performance.ctr}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">CVR</p>
                  <p className="font-bold text-amber-600">{strategy.performance.cvr}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">营收</p>
                  <p className="font-bold text-purple-600">¥{(strategy.performance.revenue / 1000).toFixed(1)}K</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Products */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h4 className="text-lg font-bold text-slate-900">
              推荐商品预览
            </h4>
          </div>
          <span className="text-sm text-slate-600">
            策略：{strategies.find(s => s.id === selectedStrategy)?.name}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map(product => (
            <div
              key={product.id}
              className="border-2 border-slate-200 rounded-lg p-4 hover:border-blue-600 hover:shadow-lg transition-all"
            >
              <div className="text-5xl text-center mb-3">{product.image}</div>
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-semibold text-slate-900 flex-1">{product.name}</h5>
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded ml-2">
                  <Sparkles className="w-3 h-3" />
                  {(product.score * 100).toFixed(0)}
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-2">{product.category}</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-blue-600">¥{product.price}</p>
                <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                  查看详情
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <h4 className="font-bold text-slate-900 mb-3">💡 性能洞察</h4>
        <div className="space-y-2 text-sm">
          <p className="text-slate-700">
            • 实时推荐策略表现最佳，CTR 达到 {strategies[2].performance.ctr}%
          </p>
          <p className="text-slate-700">
            • 协同过滤推荐在转化率上表现优异，CVR 为 {strategies[0].performance.cvr}%
          </p>
          <p className="text-slate-700">
            • 建议同时启用多个推荐策略，通过 A/B 测试持续优化
          </p>
          <p className="text-slate-700">
            • 推荐系统已为您带来超过 ¥{strategies.reduce((sum, s) => sum + s.performance.revenue, 0).toLocaleString()} 的营收
          </p>
        </div>
      </div>
    </div>
  );
}

export class RecommendationSystem extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <RecommendationSystemModule context={context} />;
  }
}

