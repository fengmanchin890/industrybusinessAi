/**
 * AI 智能搜索模组 - 语义搜索
 * 让用户用自然语言找到想要的商品
 */

import { useState, useEffect } from 'react';
import { Search, Sparkles, TrendingUp, Filter } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';

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
  product_id?: string;
  id?: string;
  product_name?: string;
  name?: string;
  category: string;
  price: number;
  image_url?: string;
  image?: string;
  description?: string;
  similarity_score?: number;
  relevance?: number;
}

export function SemanticSearchModule({ context }: { context: ModuleContext }) {
  const { state } = useModuleState();
  const { company, user } = context;
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSearches: 0,
    avgResultsClicked: 0,
    searchSuccessRate: 0
  });

  useEffect(() => {
    loadStatistics();
  }, [company?.id]);

  const loadStatistics = async () => {
    if (!company?.id) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('semantic-search-ai', {
        body: {
          action: 'get_statistics',
          data: { companyId: company.id, days: 7 }
        }
      });

      if (error) throw error;
      
      if (data?.data) {
        setStats({
          totalSearches: data.data.total_searches || 0,
          avgResultsClicked: data.data.avg_results_count || 0,
          searchSuccessRate: data.data.search_success_rate || 0
        });
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !company?.id) return;

    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('semantic-search-ai', {
        body: {
          action: 'search',
          data: {
            companyId: company.id,
            query: searchQuery,
            limit: 20
          }
        }
      });

      if (error) throw error;

      if (data?.data) {
        setResults(data.data.results || []);
        setCurrentSearchId(data.data.searchQueryId);
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalSearches: prev.totalSearches + 1
        }));
      }
    } catch (error) {
      console.error('Error searching:', error);
      alert('搜索失败，请稍后重试');
    } finally {
      setSearching(false);
    }
  };

  const handleProductClick = async (productId: string) => {
    if (!currentSearchId) return;

    try {
      await supabase.functions.invoke('semantic-search-ai', {
        body: {
          action: 'track_click',
          data: {
            searchQueryId: currentSearchId,
            productId: productId
          }
        }
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
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
            {results.map(product => {
              const productId = product.product_id || product.id || '';
              const productName = product.product_name || product.name || '未命名产品';
              const relevanceScore = product.similarity_score || product.relevance || 0;
              const imageUrl = product.image_url || product.image;
              
              return (
                <div
                  key={productId}
                  onClick={() => handleProductClick(productId)}
                  className="border-2 border-slate-200 rounded-lg p-4 hover:border-blue-600 hover:shadow-lg transition-all cursor-pointer"
                >
                  {imageUrl ? (
                    imageUrl.startsWith('http') ? (
                      <img src={imageUrl} alt={productName} className="w-full h-32 object-cover rounded mb-3" />
                    ) : (
                      <div className="text-6xl text-center mb-3">{imageUrl}</div>
                    )
                  ) : (
                    <div className="w-full h-32 bg-slate-100 rounded mb-3 flex items-center justify-center">
                      <Search className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-semibold text-slate-900 flex-1 mr-2">{productName}</h5>
                    <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded whitespace-nowrap">
                      <Sparkles className="w-3 h-3" />
                      {(relevanceScore * 100).toFixed(0)}%
                    </div>
                  </div>
                  {product.description && (
                    <p className="text-xs text-slate-500 mb-2 line-clamp-2">{product.description}</p>
                  )}
                  <p className="text-sm text-slate-600 mb-2">{product.category}</p>
                  <p className="text-xl font-bold text-blue-600">¥{product.price}</p>
                </div>
              );
            })}
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

