/**
 * AI 路線優化模組
 * 適用於物流配送的路線規劃與優化
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Truck, Clock, Fuel, Route, Navigation } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';

const metadata: ModuleMetadata = {
  id: 'route-optimizer',
  name: 'AI 路線優化',
  version: '1.0.0',
  category: 'logistics',
  industry: ['logistics'],
  description: 'AI 驅動的配送路線優化系統，減少配送時間與成本',
  icon: 'Route',
  author: 'AI Business Platform',
  pricingTier: 'pro',
  features: [
    '智能路線規劃',
    '即時交通分析',
    '多車隊管理',
    '成本優化',
    '配送追蹤'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface DeliveryPoint {
  id: string;
  address: string;
  customer: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timeWindow: { start: string; end: string };
  coordinates: { lat: number; lng: number };
  packageWeight: number;
  estimatedDeliveryTime: number;
  status: 'pending' | 'assigned' | 'in-transit' | 'delivered';
}

interface Vehicle {
  id: string;
  driver: string;
  capacity: number;
  currentLocation: { lat: number; lng: number };
  status: 'idle' | 'loading' | 'delivering' | 'returning';
  fuelLevel: number;
  estimatedArrival: Date | null;
}

interface OptimizedRoute {
  vehicleId: string;
  driver: string;
  deliveries: DeliveryPoint[];
  totalDistance: number;
  totalTime: number;
  totalCost: number;
  fuelConsumption: number;
  efficiency: number;
}

export function RouteOptimizerModule({ context }: { context: ModuleContext }) {
  const { state, setRunning, setIdle } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    completedDeliveries: 0,
    totalDistance: 0,
    totalCost: 0,
    averageEfficiency: 0
  });

  // 模擬配送點數據
  const mockDeliveryPoints: DeliveryPoint[] = [
    {
      id: '1',
      address: '台北市信義區信義路五段7號',
      customer: '王小明',
      priority: 'high',
      timeWindow: { start: '09:00', end: '12:00' },
      coordinates: { lat: 25.0330, lng: 121.5654 },
      packageWeight: 2.5,
      estimatedDeliveryTime: 15,
      status: 'pending'
    },
    {
      id: '2',
      address: '台北市大安區敦化南路二段216號',
      customer: '李美華',
      priority: 'medium',
      timeWindow: { start: '10:00', end: '14:00' },
      coordinates: { lat: 25.0260, lng: 121.5480 },
      packageWeight: 1.8,
      estimatedDeliveryTime: 10,
      status: 'pending'
    },
    {
      id: '3',
      address: '台北市中山區南京東路二段100號',
      customer: '陳志強',
      priority: 'urgent',
      timeWindow: { start: '08:00', end: '10:00' },
      coordinates: { lat: 25.0520, lng: 121.5250 },
      packageWeight: 3.2,
      estimatedDeliveryTime: 20,
      status: 'pending'
    },
    {
      id: '4',
      address: '台北市松山區民生東路三段130號',
      customer: '張雅婷',
      priority: 'low',
      timeWindow: { start: '14:00', end: '18:00' },
      coordinates: { lat: 25.0580, lng: 121.5450 },
      packageWeight: 1.2,
      estimatedDeliveryTime: 8,
      status: 'pending'
    },
    {
      id: '5',
      address: '台北市內湖區瑞光路399號',
      customer: '林建國',
      priority: 'medium',
      timeWindow: { start: '11:00', end: '15:00' },
      coordinates: { lat: 25.0700, lng: 121.5800 },
      packageWeight: 2.0,
      estimatedDeliveryTime: 12,
      status: 'pending'
    }
  ];

  // 模擬車隊數據
  const mockVehicles: Vehicle[] = [
    {
      id: 'V001',
      driver: '張司機',
      capacity: 100,
      currentLocation: { lat: 25.0400, lng: 121.5600 },
      status: 'idle',
      fuelLevel: 80,
      estimatedArrival: null
    },
    {
      id: 'V002',
      driver: '李司機',
      capacity: 80,
      currentLocation: { lat: 25.0300, lng: 121.5500 },
      status: 'idle',
      fuelLevel: 65,
      estimatedArrival: null
    },
    {
      id: 'V003',
      driver: '王司機',
      capacity: 120,
      currentLocation: { lat: 25.0500, lng: 121.5700 },
      status: 'idle',
      fuelLevel: 90,
      estimatedArrival: null
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setDeliveryPoints(mockDeliveryPoints);
      setVehicles(mockVehicles);
      updateStats();
    } catch (error) {
      console.error('載入數據失敗:', error);
    }
  };

  const updateStats = () => {
    const totalDeliveries = deliveryPoints.length;
    const completedDeliveries = deliveryPoints.filter(p => p.status === 'delivered').length;
    const totalDistance = optimizedRoutes.reduce((sum, route) => sum + route.totalDistance, 0);
    const totalCost = optimizedRoutes.reduce((sum, route) => sum + route.totalCost, 0);
    const averageEfficiency = optimizedRoutes.length > 0 
      ? optimizedRoutes.reduce((sum, route) => sum + route.efficiency, 0) / optimizedRoutes.length 
      : 0;

    setStats({
      totalDeliveries,
      completedDeliveries,
      totalDistance,
      totalCost,
      averageEfficiency
    });
  };

  const optimizeRoutes = async () => {
    setIsOptimizing(true);
    setRunning();

    try {
      // 模擬AI路線優化過程
      await new Promise(resolve => setTimeout(resolve, 4000));

      const newRoutes: OptimizedRoute[] = [];
      const availableVehicles = vehicles.filter(v => v.status === 'idle');
      const pendingDeliveries = deliveryPoints.filter(p => p.status === 'pending');

      // 簡單的貪心算法分配
      let remainingDeliveries = [...pendingDeliveries];
      
      availableVehicles.forEach(vehicle => {
        if (remainingDeliveries.length === 0) return;

        // 按優先級和時間窗口排序
        const sortedDeliveries = remainingDeliveries.sort((a, b) => {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          return new Date(a.timeWindow.start).getTime() - new Date(b.timeWindow.start).getTime();
        });

        const vehicleDeliveries: DeliveryPoint[] = [];
        let currentWeight = 0;
        let totalDistance = 0;
        let totalTime = 0;

        // 分配配送點
        sortedDeliveries.forEach(delivery => {
          if (currentWeight + delivery.packageWeight <= vehicle.capacity) {
            vehicleDeliveries.push(delivery);
            currentWeight += delivery.packageWeight;
            totalDistance += Math.random() * 10 + 5; // 模擬距離
            totalTime += delivery.estimatedDeliveryTime;
          }
        });

        if (vehicleDeliveries.length > 0) {
          const fuelConsumption = totalDistance * 0.1; // 每公里0.1升
          const totalCost = fuelConsumption * 30 + totalTime * 0.5; // 油費 + 時間成本
          const efficiency = vehicleDeliveries.length / (totalDistance / 10); // 效率指標

          newRoutes.push({
            vehicleId: vehicle.id,
            driver: vehicle.driver,
            deliveries: vehicleDeliveries,
            totalDistance: Math.round(totalDistance * 10) / 10,
            totalTime: Math.round(totalTime),
            totalCost: Math.round(totalCost * 10) / 10,
            fuelConsumption: Math.round(fuelConsumption * 10) / 10,
            efficiency: Math.round(efficiency * 100) / 100
          });

          // 從待配送清單中移除已分配的配送點
          remainingDeliveries = remainingDeliveries.filter(d => 
            !vehicleDeliveries.some(vd => vd.id === d.id)
          );
        }
      });

      setOptimizedRoutes(newRoutes);

      // 更新配送點狀態
      const updatedDeliveries = deliveryPoints.map(delivery => {
        const isAssigned = newRoutes.some(route => 
          route.deliveries.some(d => d.id === delivery.id)
        );
        return isAssigned ? { ...delivery, status: 'assigned' as const } : delivery;
      });
      setDeliveryPoints(updatedDeliveries);

      // 更新統計
      updateStats();

      // 發送警示
      const unassignedDeliveries = remainingDeliveries.length;
      if (unassignedDeliveries > 0) {
        await sendAlert('medium', '部分配送無法分配', `有 ${unassignedDeliveries} 個配送點無法分配給現有車隊`);
      }

    } catch (error) {
      console.error('路線優化失敗:', error);
      await sendAlert('warning', '優化失敗', '路線優化過程中發生錯誤');
    } finally {
      setIsOptimizing(false);
      setIdle();
    }
  };

  const startDelivery = async (route: OptimizedRoute) => {
    // 更新車輛狀態
    setVehicles(prev => prev.map(vehicle => 
      vehicle.id === route.vehicleId 
        ? { ...vehicle, status: 'delivering' as const }
        : vehicle
    ));

    // 更新配送點狀態
    setDeliveryPoints(prev => prev.map(delivery => 
      route.deliveries.some(d => d.id === delivery.id)
        ? { ...delivery, status: 'in-transit' as const }
        : delivery
    ));

    await sendAlert('info', '配送開始', `車輛 ${route.vehicleId} 開始配送 ${route.deliveries.length} 個包裹`);
  };

  const generateRouteReport = async () => {
    const reportContent = `
# 路線優化報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 配送總覽
- 總配送數：${stats.totalDeliveries}
- 已完成配送：${stats.completedDeliveries}
- 總配送距離：${stats.totalDistance.toFixed(1)} 公里
- 總配送成本：NT$ ${stats.totalCost.toFixed(0)}
- 平均效率：${stats.averageEfficiency.toFixed(2)}

## 優化路線詳情
${optimizedRoutes.length === 0 ? '尚未進行路線優化' : optimizedRoutes.map((route, index) => `
### 路線 ${index + 1} - ${route.driver} (${route.vehicleId})
- 配送點數：${route.deliveries.length} 個
- 總距離：${route.totalDistance} 公里
- 總時間：${route.totalTime} 分鐘
- 總成本：NT$ ${route.totalCost}
- 油耗：${route.fuelConsumption} 公升
- 效率：${route.efficiency}

#### 配送順序
${route.deliveries.map((delivery, i) => `
${i + 1}. ${delivery.customer} - ${delivery.address}
   - 優先級：${delivery.priority === 'urgent' ? '🔴 緊急' :
              delivery.priority === 'high' ? '🟠 高' :
              delivery.priority === 'medium' ? '🟡 中' : '🟢 低'}
   - 時間窗口：${delivery.timeWindow.start} - ${delivery.timeWindow.end}
   - 包裹重量：${delivery.packageWeight} kg
   - 預估配送時間：${delivery.estimatedDeliveryTime} 分鐘
`).join('')}
`).join('\n')}

## 車隊狀態
${vehicles.map(vehicle => `
### ${vehicle.driver} (${vehicle.id})
- 狀態：${vehicle.status === 'idle' ? '🟢 待命' :
         vehicle.status === 'loading' ? '🟡 裝載中' :
         vehicle.status === 'delivering' ? '🔵 配送中' : '🟠 返回中'}
- 載重容量：${vehicle.capacity} kg
- 油量：${vehicle.fuelLevel}%
- 目前位置：${vehicle.currentLocation.lat.toFixed(4)}, ${vehicle.currentLocation.lng.toFixed(4)}
`).join('')}

## 待配送清單
${deliveryPoints.filter(p => p.status === 'pending').length === 0 ? 
  '✅ 所有配送已分配' : 
  deliveryPoints.filter(p => p.status === 'pending').map(delivery => `
- ${delivery.customer} - ${delivery.address}
  - 優先級：${delivery.priority}
  - 時間窗口：${delivery.timeWindow.start} - ${delivery.timeWindow.end}
`).join('')}

## 優化建議
${optimizedRoutes.length === 0 ? '請先執行路線優化' : `
1. 總體效率：${stats.averageEfficiency > 0.8 ? '✅ 良好' : stats.averageEfficiency > 0.6 ? '⚠️ 一般' : '❌ 需改善'}
2. 成本控制：${stats.totalCost < 1000 ? '✅ 成本控制良好' : '⚠️ 成本偏高，建議優化路線'}
3. 時間管理：建議優先處理緊急配送，確保客戶滿意度
4. 資源利用：${vehicles.filter(v => v.status === 'idle').length > 0 ? '有閒置車輛，可增加配送量' : '車隊利用率良好'}
`}
    `.trim();

    await generateReport('路線優化報告', reportContent, 'logistics');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-slate-600 bg-slate-100';
      case 'assigned': return 'text-blue-600 bg-blue-100';
      case 'in-transit': return 'text-yellow-600 bg-yellow-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 路線優化</h3>
          <p className="text-slate-600 mt-1">智能配送路線規劃與優化</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={optimizeRoutes}
            disabled={isOptimizing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOptimizing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                優化中...
              </>
            ) : (
              <>
                <Route className="w-5 h-5" />
                優化路線
              </>
            )}
          </button>
          <button
            onClick={generateRouteReport}
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
              <p className="text-sm text-slate-600">總配送數</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalDeliveries}</p>
            </div>
            <MapPin className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">已完成</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.completedDeliveries}</p>
            </div>
            <Truck className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">總距離</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.totalDistance.toFixed(1)}km</p>
            </div>
            <Navigation className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">總成本</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">NT$ {stats.totalCost.toFixed(0)}</p>
            </div>
            <Fuel className="w-10 h-10 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均效率</p>
              <p className="text-3xl font-bold text-cyan-600 mt-1">{stats.averageEfficiency.toFixed(2)}</p>
            </div>
            <Clock className="w-10 h-10 text-cyan-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Points */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">配送點清單</h4>
            <div className="space-y-3">
              {deliveryPoints.map((point) => (
                <div key={point.id} className="p-4 bg-slate-50 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-semibold text-slate-900">{point.customer}</h5>
                      <p className="text-sm text-slate-600">{point.address}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(point.priority)}`}>
                        {point.priority === 'urgent' ? '緊急' :
                         point.priority === 'high' ? '高' :
                         point.priority === 'medium' ? '中' : '低'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(point.status)}`}>
                        {point.status === 'pending' ? '待分配' :
                         point.status === 'assigned' ? '已分配' :
                         point.status === 'in-transit' ? '配送中' : '已完成'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-600">時間窗口：</span>
                      <span className="font-medium">{point.timeWindow.start} - {point.timeWindow.end}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">重量：</span>
                      <span className="font-medium">{point.packageWeight} kg</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Optimized Routes */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">優化路線</h4>
            
            {optimizedRoutes.length === 0 ? (
              <div className="text-center py-8">
                <Route className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-900 mb-2">尚未優化路線</h4>
                <p className="text-slate-600">點擊「優化路線」開始規劃配送路線</p>
              </div>
            ) : (
              <div className="space-y-4">
                {optimizedRoutes.map((route, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="font-semibold text-slate-900">
                          路線 {index + 1} - {route.driver}
                        </h5>
                        <p className="text-sm text-slate-600">{route.vehicleId}</p>
                      </div>
                      <button
                        onClick={() => startDelivery(route)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        開始配送
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-slate-600">配送點：</span>
                        <span className="font-medium">{route.deliveries.length} 個</span>
                      </div>
                      <div>
                        <span className="text-slate-600">距離：</span>
                        <span className="font-medium">{route.totalDistance} km</span>
                      </div>
                      <div>
                        <span className="text-slate-600">時間：</span>
                        <span className="font-medium">{route.totalTime} 分鐘</span>
                      </div>
                      <div>
                        <span className="text-slate-600">成本：</span>
                        <span className="font-medium">NT$ {route.totalCost}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600">
                      效率：{route.efficiency} | 油耗：{route.fuelConsumption}L
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 導出模組類（用於註冊）
export class RouteOptimizer extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <RouteOptimizerModule context={context} />;
  }
}
