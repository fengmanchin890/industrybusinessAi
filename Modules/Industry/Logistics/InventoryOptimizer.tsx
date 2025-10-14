/**
 * AI 庫存優化模組
 * 適用於物流/倉儲的智能庫存管理
 */

import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, TrendingDown, AlertTriangle, BarChart3, RefreshCw } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';

const metadata: ModuleMetadata = {
  id: 'inventory-optimizer',
  name: 'AI 庫存優化',
  version: '1.0.0',
  category: 'logistics',
  industry: ['logistics'],
  description: 'AI 驅動的庫存優化系統，預測需求並自動調整庫存水準',
  icon: 'Package',
  author: 'AI Business Platform',
  pricingTier: 'pro',
  features: [
    '需求預測',
    '庫存優化',
    '自動補貨建議',
    '滯銷品分析',
    '成本優化'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitCost: number;
  sellingPrice: number;
  demandForecast: number;
  turnoverRate: number;
  lastRestock: Date;
  status: 'normal' | 'low' | 'out' | 'overstock';
}

interface OptimizationSuggestion {
  itemId: string;
  action: 'restock' | 'reduce' | 'clearance' | 'maintain';
  quantity: number;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedSavings: number;
}

export function InventoryOptimizerModule({ context }: { context: ModuleContext }) {
  const { state, setRunning, setIdle } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    overstockItems: 0,
    totalValue: 0,
    optimizationSavings: 0
  });

  // 模擬庫存數據
  const mockInventory: InventoryItem[] = [
    {
      id: '1',
      sku: 'SKU001',
      name: 'iPhone 15 Pro',
      category: '電子產品',
      currentStock: 5,
      minStock: 10,
      maxStock: 50,
      unitCost: 25000,
      sellingPrice: 30000,
      demandForecast: 15,
      turnoverRate: 2.5,
      lastRestock: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: 'low'
    },
    {
      id: '2',
      sku: 'SKU002',
      name: 'MacBook Air M3',
      category: '電子產品',
      currentStock: 25,
      minStock: 5,
      maxStock: 30,
      unitCost: 35000,
      sellingPrice: 42000,
      demandForecast: 8,
      turnoverRate: 1.2,
      lastRestock: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'normal'
    },
    {
      id: '3',
      sku: 'SKU003',
      name: 'AirPods Pro',
      category: '配件',
      currentStock: 0,
      minStock: 20,
      maxStock: 100,
      unitCost: 5000,
      sellingPrice: 6500,
      demandForecast: 30,
      turnoverRate: 4.0,
      lastRestock: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      status: 'out'
    },
    {
      id: '4',
      sku: 'SKU004',
      name: '舊款iPhone 13',
      category: '電子產品',
      currentStock: 80,
      minStock: 10,
      maxStock: 30,
      unitCost: 20000,
      sellingPrice: 22000,
      demandForecast: 5,
      turnoverRate: 0.3,
      lastRestock: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      status: 'overstock'
    },
    {
      id: '5',
      sku: 'SKU005',
      name: 'iPad Air',
      category: '平板電腦',
      currentStock: 15,
      minStock: 8,
      maxStock: 25,
      unitCost: 18000,
      sellingPrice: 22000,
      demandForecast: 12,
      turnoverRate: 2.0,
      lastRestock: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'normal'
    }
  ];

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setInventory(mockInventory);
      updateStats(mockInventory);
    } catch (error) {
      console.error('載入庫存失敗:', error);
    }
  };

  const updateStats = (items: InventoryItem[]) => {
    const totalItems = items.length;
    const lowStockItems = items.filter(item => item.status === 'low' || item.status === 'out').length;
    const overstockItems = items.filter(item => item.status === 'overstock').length;
    const totalValue = items.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
    
    setStats({
      totalItems,
      lowStockItems,
      overstockItems,
      totalValue,
      optimizationSavings: 0
    });
  };

  const analyzeInventory = async () => {
    setIsAnalyzing(true);
    setRunning();

    try {
      // 模擬AI分析過程
      await new Promise(resolve => setTimeout(resolve, 3000));

      const newSuggestions: OptimizationSuggestion[] = [];

      inventory.forEach(item => {
        // 缺貨建議
        if (item.status === 'out' || item.status === 'low') {
          const suggestedQuantity = Math.max(item.demandForecast * 2, item.minStock);
          newSuggestions.push({
            itemId: item.id,
            action: 'restock',
            quantity: suggestedQuantity,
            reason: `庫存不足，預測需求 ${item.demandForecast} 件`,
            priority: item.status === 'out' ? 'urgent' : 'high',
            estimatedSavings: item.demandForecast * (item.sellingPrice - item.unitCost)
          });
        }

        // 過量庫存建議
        if (item.status === 'overstock') {
          const excessQuantity = item.currentStock - item.maxStock;
          newSuggestions.push({
            itemId: item.id,
            action: 'reduce',
            quantity: excessQuantity,
            reason: `庫存過量 ${excessQuantity} 件，周轉率僅 ${item.turnoverRate}`,
            priority: 'medium',
            estimatedSavings: excessQuantity * item.unitCost * 0.1 // 假設減少10%成本
          });
        }

        // 滯銷品建議
        if (item.turnoverRate < 0.5 && item.currentStock > item.minStock) {
          newSuggestions.push({
            itemId: item.id,
            action: 'clearance',
            quantity: Math.floor(item.currentStock * 0.3),
            reason: `周轉率過低 (${item.turnoverRate})，建議促銷清倉`,
            priority: 'medium',
            estimatedSavings: Math.floor(item.currentStock * 0.3) * (item.unitCost * 0.2)
          });
        }
      });

      setSuggestions(newSuggestions);

      // 計算優化節省
      const totalSavings = newSuggestions.reduce((sum, suggestion) => sum + suggestion.estimatedSavings, 0);
      setStats(prev => ({ ...prev, optimizationSavings: totalSavings }));

      // 發送警示
      const urgentSuggestions = newSuggestions.filter(s => s.priority === 'urgent');
      if (urgentSuggestions.length > 0) {
        await sendAlert('high', '緊急補貨需求', `有 ${urgentSuggestions.length} 項商品需要立即補貨`);
      }

    } catch (error) {
      console.error('庫存分析失敗:', error);
      await sendAlert('warning', '分析失敗', '庫存分析過程中發生錯誤');
    } finally {
      setIsAnalyzing(false);
      setIdle();
    }
  };

  const applySuggestion = async (suggestion: OptimizationSuggestion) => {
    const item = inventory.find(i => i.id === suggestion.itemId);
    if (!item) return;

    let updatedItem = { ...item };

    switch (suggestion.action) {
      case 'restock':
        updatedItem.currentStock += suggestion.quantity;
        updatedItem.lastRestock = new Date();
        updatedItem.status = 'normal';
        break;
      case 'reduce':
        updatedItem.currentStock = Math.max(0, updatedItem.currentStock - suggestion.quantity);
        updatedItem.status = updatedItem.currentStock <= updatedItem.minStock ? 'low' : 'normal';
        break;
      case 'clearance':
        updatedItem.currentStock = Math.max(0, updatedItem.currentStock - suggestion.quantity);
        break;
    }

    setInventory(prev => prev.map(i => i.id === suggestion.itemId ? updatedItem : i));
    setSuggestions(prev => prev.filter(s => s.itemId !== suggestion.itemId));
    
    // 更新統計
    updateStats(inventory.map(i => i.id === suggestion.itemId ? updatedItem : i));
  };

  const generateInventoryReport = async () => {
    const reportContent = `
# 庫存優化報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 庫存總覽
- 總商品數：${stats.totalItems}
- 低庫存商品：${stats.lowStockItems}
- 過量庫存商品：${stats.overstockItems}
- 庫存總價值：NT$ ${stats.totalValue.toLocaleString()}
- 優化節省預估：NT$ ${stats.optimizationSavings.toLocaleString()}

## 商品詳情
${inventory.map(item => `
### ${item.name} (${item.sku})
- 類別：${item.category}
- 目前庫存：${item.currentStock} 件
- 庫存狀態：${item.status === 'normal' ? '✅ 正常' : 
              item.status === 'low' ? '⚠️ 低庫存' : 
              item.status === 'out' ? '🔴 缺貨' : '📦 過量'}
- 庫存範圍：${item.minStock} - ${item.maxStock} 件
- 需求預測：${item.demandForecast} 件/月
- 周轉率：${item.turnoverRate} 次/月
- 單位成本：NT$ ${item.unitCost.toLocaleString()}
- 售價：NT$ ${item.sellingPrice.toLocaleString()}
- 最後補貨：${item.lastRestock.toLocaleDateString('zh-TW')}
`).join('\n')}

## 優化建議
${suggestions.length === 0 ? '✅ 目前無優化建議' : suggestions.map(suggestion => {
  const item = inventory.find(i => i.id === suggestion.itemId);
  return `
### ${item?.name} - ${suggestion.action === 'restock' ? '補貨建議' : 
                     suggestion.action === 'reduce' ? '減量建議' : 
                     suggestion.action === 'clearance' ? '清倉建議' : '維持現狀'}
- 建議動作：${suggestion.action === 'restock' ? `補貨 ${suggestion.quantity} 件` :
             suggestion.action === 'reduce' ? `減少 ${suggestion.quantity} 件` :
             suggestion.action === 'clearance' ? `清倉 ${suggestion.quantity} 件` : '維持現狀'}
- 原因：${suggestion.reason}
- 優先級：${suggestion.priority === 'urgent' ? '🔴 緊急' :
           suggestion.priority === 'high' ? '🟠 高' :
           suggestion.priority === 'medium' ? '🟡 中' : '🟢 低'}
- 預估節省：NT$ ${suggestion.estimatedSavings.toLocaleString()}
`;
}).join('\n')}

## 分析建議
${stats.lowStockItems > 0 ? `⚠️ 有 ${stats.lowStockItems} 項商品庫存不足，建議立即補貨` : '✅ 庫存水準正常'}
${stats.overstockItems > 0 ? `📦 有 ${stats.overstockItems} 項商品庫存過量，建議促銷或減量` : '✅ 無過量庫存'}
${stats.optimizationSavings > 0 ? `💰 執行優化建議可節省約 NT$ ${stats.optimizationSavings.toLocaleString()}` : '✅ 庫存配置已優化'}

## 建議措施
1. 定期監控庫存水準，避免缺貨和過量
2. 根據需求預測調整補貨策略
3. 對滯銷品實施促銷活動
4. 優化庫存周轉率，提高資金效率
    `.trim();

    await generateReport('庫存優化報告', reportContent, 'inventory');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-100';
      case 'low': return 'text-yellow-600 bg-yellow-100';
      case 'out': return 'text-red-600 bg-red-100';
      case 'overstock': return 'text-orange-600 bg-orange-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-700 bg-red-100 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-700 bg-green-100 border-green-200';
      default: return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 庫存優化</h3>
          <p className="text-slate-600 mt-1">智能庫存管理與需求預測</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={analyzeInventory}
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
                分析庫存
              </>
            )}
          </button>
          <button
            onClick={generateInventoryReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            生成報告
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">總商品數</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalItems}</p>
            </div>
            <Package className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">低庫存</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.lowStockItems}</p>
            </div>
            <TrendingDown className="w-10 h-10 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">過量庫存</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{stats.overstockItems}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">庫存價值</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">NT$ {(stats.totalValue / 1000).toFixed(0)}K</p>
            </div>
            <BarChart3 className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">優化節省</p>
              <p className="text-2xl font-bold text-green-600 mt-1">NT$ {(stats.optimizationSavings / 1000).toFixed(0)}K</p>
            </div>
            <RefreshCw className="w-10 h-10 text-green-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory List */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">庫存清單</h4>
            <div className="space-y-3">
              {inventory.map((item) => (
                <div key={item.id} className="p-4 bg-slate-50 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-semibold text-slate-900">{item.name}</h5>
                      <p className="text-sm text-slate-600">{item.sku} | {item.category}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                      {item.status === 'normal' ? '正常' :
                       item.status === 'low' ? '低庫存' :
                       item.status === 'out' ? '缺貨' : '過量'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-600">庫存：</span>
                      <span className="font-medium">{item.currentStock} 件</span>
                    </div>
                    <div>
                      <span className="text-slate-600">需求預測：</span>
                      <span className="font-medium">{item.demandForecast} 件/月</span>
                    </div>
                    <div>
                      <span className="text-slate-600">周轉率：</span>
                      <span className="font-medium">{item.turnoverRate} 次/月</span>
                    </div>
                    <div>
                      <span className="text-slate-600">庫存價值：</span>
                      <span className="font-medium">NT$ {(item.currentStock * item.unitCost).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Optimization Suggestions */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">優化建議</h4>
            
            {suggestions.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-900 mb-2">無優化建議</h4>
                <p className="text-slate-600">點擊「分析庫存」開始優化分析</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => {
                  const item = inventory.find(i => i.id === suggestion.itemId);
                  return (
                    <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(suggestion.priority)}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="font-semibold">{item?.name}</h5>
                          <p className="text-sm">{suggestion.reason}</p>
                        </div>
                        <span className="text-xs font-medium">
                          {suggestion.priority === 'urgent' ? '緊急' :
                           suggestion.priority === 'high' ? '高' :
                           suggestion.priority === 'medium' ? '中' : '低'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-medium">
                            {suggestion.action === 'restock' ? `補貨 ${suggestion.quantity} 件` :
                             suggestion.action === 'reduce' ? `減少 ${suggestion.quantity} 件` :
                             suggestion.action === 'clearance' ? `清倉 ${suggestion.quantity} 件` : '維持現狀'}
                          </span>
                          <span className="text-slate-600 ml-2">
                            節省 NT$ {suggestion.estimatedSavings.toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => applySuggestion(suggestion)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          執行
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 導出模組類（用於註冊）
export class InventoryOptimizer extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <InventoryOptimizerModule context={context} />;
  }
}
