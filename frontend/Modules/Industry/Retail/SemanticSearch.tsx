/**
 * AI 智能搜索模组 - 语义搜索
 * 让用户用自然语言找到想要的商品
 */

import { useState } from 'react';
import { Search, Sparkles, TrendingUp, Filter } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState } from '../../ModuleSDK';

const metadata: ModuleMetadata = {
  id: 'semantic-search',
  name: 'AI 智能搜索',
  version: '1.0.0',
  category: 'retail',
  industry: ['retail'],
  description: '基于语义理解的智能搜索，让顾客用自然语言找到商品',
  icon: 'Search',
  author: 'AI Business Platform',
  pricingTier: 'basic',
  features: [
    '自然语言搜索',
    '智能同义词识别',
    '图片搜索',
    '搜索结果排序优化',
    '搜索分析报告'
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
  relevance: number;
}

const mockProducts: Product[] = [
  { id: '1', name: '舒适运动鞋', category: '鞋类', price: 1299, image: '👟', relevance: 0.95 },
  { id: '2', name: '透气跑步鞋', category: '鞋类', price: 1599, image: '👟', relevance: 0.92 },
  { id: '3', name: '休闲帆布鞋', category: '鞋类', price: 899, image: '👞', relevance: 0.85 },
  { id: '4', name: '防水登山鞋', category: '鞋类', price: 2299, image: '🥾', relevance: 0.78 },
];

export function SemanticSearchModule({ context }: { context: ModuleContext }) {
  const { state } = useModuleState();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [stats, setStats] = useState({
    totalSearches: 1247,
    avgResultsClicked: 3.2,
    searchSuccessRate: 87
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    // 模拟 AI 搜索
    setTimeout(() => {
      setResults(mockProducts.map(p => ({
        ...p,
        relevance: Math.random() * 0.3 + 0.7
      })).sort((a, b) => b.relevance - a.relevance));
      setSearching(false);
      setStats(prev => ({
        ...prev,
        totalSearches: prev.totalSearches + 1
      }));
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">AI 智能搜索</h3>
        <p className="text-slate-600 mt-1">让顾客用自然语言找到商品</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">今日搜索次数</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalSearches}</p>
            </div>
            <Search className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均点击结果数</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.avgResultsClicked}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">搜索成功率</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.searchSuccessRate}%</p>
            </div>
            <Sparkles className="w-10 h-10 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="试试：「适合跑步的鞋子」「防水的户外装备」"
              className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-lg focus:border-blue-600 focus:outline-none text-lg"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
          >
            {searching ? '搜索中...' : '搜索'}
          </button>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-slate-600">热门搜索：</span>
          {['运动鞋', '夏季服装', '防晒用品', '3C配件'].map(keyword => (
            <button
              key={keyword}
              onClick={() => {
                setSearchQuery(keyword);
                setTimeout(handleSearch, 100);
              }}
              className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors text-sm"
            >
              {keyword}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-slate-900">
              找到 {results.length} 个相关商品
            </h4>
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900">
              <Filter className="w-4 h-4" />
              筛选
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {results.map(product => (
              <div
                key={product.id}
                className="border-2 border-slate-200 rounded-lg p-4 hover:border-blue-600 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="text-6xl text-center mb-3">{product.image}</div>
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-semibold text-slate-900">{product.name}</h5>
                  <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    <Sparkles className="w-3 h-3" />
                    {(product.relevance * 100).toFixed(0)}%
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-2">{product.category}</p>
                <p className="text-xl font-bold text-blue-600">${product.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {searching && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">AI 正在分析您的搜索...</p>
        </div>
      )}
    </div>
  );
}

export class SemanticSearch extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <SemanticSearchModule context={context} />;
  }
}

