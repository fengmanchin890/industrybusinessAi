import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

interface Product {
  id: string;
  product_code: string;
  product_name: string;
  category: string;
  unit_cost: number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
}

interface Inventory {
  id: string;
  product_id: string;
  current_quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  products?: Product;
}

interface AnalysisResult {
  total_products: number;
  critical_items: any[];
  low_stock_items: any[];
  overstock_items: any[];
  optimal_items: any[];
  health_score: number;
  recommendations: string[];
}

const InventoryOptimization: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [reorderRecommendations, setReorderRecommendations] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState('');

  useEffect(() => {
    loadProducts();
    loadInventory();
    loadStats();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('product_name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          products(*)
        `)
        .order('current_quantity', { ascending: true });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('inventory-optimizer', {
        body: {
          action: 'get_statistics',
          data: {}
        }
      });

      if (error) throw error;
      setStats(data?.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAnalyzeInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('inventory-optimizer', {
        body: {
          action: 'analyze_inventory',
          data: {}
        }
      });

      if (error) throw error;
      setAnalysisResult(data);
      console.log('✅ 庫存分析完成:', data);
    } catch (error: any) {
      console.error('❌ 分析失敗:', error);
      alert('分析失敗: ' + (error.message || '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReorder = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('inventory-optimizer', {
        body: {
          action: 'generate_reorder',
          data: {}
        }
      });

      if (error) throw error;
      setReorderRecommendations(data);
      console.log('✅ 補貨建議生成:', data);
      alert(`✅ 已生成 ${data.total_recommendations} 個補貨建議`);
    } catch (error: any) {
      console.error('❌ 生成失敗:', error);
      alert('生成失敗: ' + (error.message || '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  const handlePredictDemand = async () => {
    if (!selectedProduct) {
      alert('請先選擇商品');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('inventory-optimizer', {
        body: {
          action: 'predict_demand',
          data: {
            productId: selectedProduct,
            days: 30
          }
        }
      });

      if (error) throw error;
      console.log('✅ 需求預測:', data);
      alert(`需求預測完成\n平均每日需求: ${data.avg_daily_demand} 件\n建議安全庫存: ${Math.round(data.avg_daily_demand * 14)} 件`);
    } catch (error: any) {
      console.error('❌ 預測失敗:', error);
      alert('預測失敗: ' + (error.message || '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (current: number, min: number, max: number, reorder: number) => {
    if (current === 0) return { label: '缺貨', class: 'bg-red-100 text-red-800' };
    if (current <= reorder) return { label: '需補貨', class: 'bg-orange-100 text-orange-800' };
    if (current <= min) return { label: '低庫存', class: 'bg-yellow-100 text-yellow-800' };
    if (current >= max) return { label: '庫存過多', class: 'bg-purple-100 text-purple-800' };
    return { label: '正常', class: 'bg-green-100 text-green-800' };
  };

  const getUrgencyBadge = (urgency: string) => {
    const config: any = {
      critical: { label: '緊急', class: 'bg-red-100 text-red-800' },
      high: { label: '高', class: 'bg-orange-100 text-orange-800' },
      normal: { label: '普通', class: 'bg-blue-100 text-blue-800' }
    };
    const cfg = config[urgency] || config.normal;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.class}`}>{cfg.label}</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📦 AI 庫存優化系統
        </h1>
        <p className="text-gray-600">
          使用 AI 智能優化庫存管理，降低成本提升效率
        </p>
      </div>

      {/* 統計卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">總商品數</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total_products || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">庫存總值</div>
            <div className="text-2xl font-bold text-green-600">
              ${stats.total_stock_value ? parseFloat(stats.total_stock_value).toFixed(0) : '0'}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">低庫存項目</div>
            <div className="text-2xl font-bold text-orange-600">{stats.low_stock_items || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">缺貨項目</div>
            <div className="text-2xl font-bold text-red-600">{stats.out_of_stock_items || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">平均庫存</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.avg_stock_level ? parseFloat(stats.avg_stock_level).toFixed(0) : '0'}
            </div>
          </div>
        </div>
      )}

      {/* AI 分析面板 */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">🤖 AI 智能分析</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <button
            onClick={handleAnalyzeInventory}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? '分析中...' : '🔍 分析庫存狀況'}
          </button>
          
          <button
            onClick={handleGenerateReorder}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition"
          >
            {loading ? '生成中...' : '📋 生成補貨建議'}
          </button>

          <div className="flex gap-2">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">選擇商品預測需求</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.product_name}
                </option>
              ))}
            </select>
            <button
              onClick={handlePredictDemand}
              disabled={loading || !selectedProduct}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition whitespace-nowrap"
            >
              📊 預測
            </button>
          </div>
        </div>

        {/* 分析結果 */}
        {analysisResult && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">
              ✨ 分析結果 (健康分數: {analysisResult.health_score}分)
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">緊急處理</div>
                <div className="text-2xl font-bold text-red-600">{analysisResult.critical_items.length}</div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">低庫存</div>
                <div className="text-2xl font-bold text-orange-600">{analysisResult.low_stock_items.length}</div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">庫存過多</div>
                <div className="text-2xl font-bold text-purple-600">{analysisResult.overstock_items.length}</div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">狀態良好</div>
                <div className="text-2xl font-bold text-green-600">{analysisResult.optimal_items.length}</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">💡 建議:</div>
              <ul className="list-disc list-inside space-y-1">
                {analysisResult.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-600">{rec}</li>
                ))}
              </ul>
            </div>

            {analysisResult.critical_items.length > 0 && (
              <div>
                <div className="text-sm font-medium text-red-700 mb-2">🚨 需要立即處理的商品:</div>
                <div className="space-y-2">
                  {analysisResult.critical_items.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded border border-red-200">
                      <div>
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-sm text-gray-600">
                          當前庫存: {item.current_stock} | 補貨點: {item.reorder_point}
                        </div>
                      </div>
                      <div className="text-sm text-red-600 font-medium">{item.recommended_action}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 補貨建議 */}
        {reorderRecommendations && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-3">
              📋 補貨建議 (共 {reorderRecommendations.total_recommendations} 項)
            </h3>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">緊急</div>
                <div className="text-xl font-bold text-red-600">{reorderRecommendations.summary.critical}</div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">高優先級</div>
                <div className="text-xl font-bold text-orange-600">{reorderRecommendations.summary.high}</div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">預估成本</div>
                <div className="text-xl font-bold text-green-600">
                  ${reorderRecommendations.total_estimated_cost.toFixed(0)}
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {reorderRecommendations.recommendations.map((rec: any, index: number) => (
                <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                  <div className="flex-1">
                    <div className="font-medium">{rec.product_name} ({rec.product_code})</div>
                    <div className="text-sm text-gray-600">
                      當前: {rec.current_stock} | 建議補貨: {rec.recommended_quantity} 件 | 
                      成本: ${rec.estimated_cost.toFixed(0)}
                    </div>
                  </div>
                  <div className="ml-4">
                    {getUrgencyBadge(rec.urgency_level)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 庫存列表 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          📊 庫存列表 ({inventory.length})
        </h2>

        {inventory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            尚無庫存記錄
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">當前庫存</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">可用/保留</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">補貨點</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">狀態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inventory.map((item) => {
                  const product = item.products;
                  if (!product) return null;
                  
                  const status = getStockStatus(
                    item.current_quantity,
                    product.min_stock_level,
                    product.max_stock_level,
                    product.reorder_point
                  );
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{product.product_name}</div>
                        <div className="text-sm text-gray-500">{product.product_code}</div>
                      </td>
                      <td className="px-4 py-3 text-lg font-semibold">{item.current_quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.available_quantity} / {item.reserved_quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {product.reorder_point}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryOptimization;


