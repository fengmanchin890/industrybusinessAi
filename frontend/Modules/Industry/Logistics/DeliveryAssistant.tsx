/**
 * AI 配送助理 - 智能路線優化
 * 為物流公司提供智能配送路線規劃
 */

import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Clock, Fuel, Route, Navigation } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../Contexts/AuthContext';
import { generateText, analyzeData } from '../../../lib/ai-service';

const metadata: ModuleMetadata = {
  id: 'delivery-assistant',
  name: 'AI 配送助理',
  version: '1.0.0',
  category: 'logistics',
  industry: ['logistics'],
  description: '智能配送路線優化，根據即時交通和訂單量自動規劃最佳路線',
  icon: 'Truck',
  author: 'AI Business Platform',
  pricingTier: 'pro',
  features: [
    '智能路線規劃',
    '即時交通整合',
    '載重優化',
    '燃油效率分析',
    '配送時間預測'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface DeliveryOrder {
  id: string;
  customerName: string;
  address: string;
  coordinates: { lat: number; lng: number };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  weight: number;
  volume: number;
  deliveryWindow: {
    start: string;
    end: string;
  };
  specialInstructions: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed';
  estimatedDeliveryTime?: Date;
}

interface Vehicle {
  id: string;
  driverName: string;
  licensePlate: string;
  capacity: number;
  currentLocation: { lat: number; lng: number };
  fuelLevel: number;
  status: 'available' | 'busy' | 'maintenance';
  currentRoute?: DeliveryRoute;
}

interface DeliveryRoute {
  id: string;
  vehicleId: string;
  orders: DeliveryOrder[];
  totalDistance: number;
  estimatedDuration: number;
  fuelConsumption: number;
  startTime: Date;
  endTime: Date;
  status: 'planned' | 'active' | 'completed';
  waypoints: { lat: number; lng: number; orderId?: string }[];
}

interface TrafficData {
  route: string;
  congestionLevel: 'low' | 'medium' | 'high' | 'severe';
  estimatedDelay: number;
  alternativeRoutes: string[];
}

export function DeliveryAssistantModule({ context }: { context: ModuleContext }) {
  const { state, setRunning, setIdle } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  const { company } = useAuth();
  
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedToday: 0,
    avgDeliveryTime: 0,
    fuelEfficiency: 0
  });

  // 模擬配送訂單
  const mockOrders: DeliveryOrder[] = [
    {
      id: 'O001',
      customerName: '王小明',
      address: '台北市信義區信義路五段7號',
      coordinates: { lat: 25.0330, lng: 121.5654 },
      priority: 'high',
      weight: 2.5,
      volume: 0.1,
      deliveryWindow: { start: '09:00', end: '12:00' },
      specialInstructions: '請按門鈴，如無人應答請致電',
      status: 'pending'
    },
    {
      id: 'O002',
      customerName: '李美華',
      address: '台北市大安區敦化南路二段216號',
      coordinates: { lat: 25.0260, lng: 121.5438 },
      priority: 'medium',
      weight: 1.8,
      volume: 0.08,
      deliveryWindow: { start: '10:00', end: '14:00' },
      specialInstructions: '大樓管理員代收',
      status: 'pending'
    },
    {
      id: 'O003',
      customerName: '陳志強',
      address: '台北市松山區南京東路四段133號',
      coordinates: { lat: 25.0520, lng: 121.5440 },
      priority: 'urgent',
      weight: 3.2,
      volume: 0.15,
      deliveryWindow: { start: '08:00', end: '10:00' },
      specialInstructions: '急件，請優先配送',
      status: 'pending'
    },
    {
      id: 'O004',
      customerName: '林雅婷',
      address: '台北市中山區民生東路二段141號',
      coordinates: { lat: 25.0580, lng: 121.5320 },
      priority: 'low',
      weight: 1.2,
      volume: 0.05,
      deliveryWindow: { start: '14:00', end: '18:00' },
      specialInstructions: '無特殊要求',
      status: 'pending'
    }
  ];

  // 模擬車輛
  const mockVehicles: Vehicle[] = [
    {
      id: 'V001',
      driverName: '張司機',
      licensePlate: 'ABC-1234',
      capacity: 1000,
      currentLocation: { lat: 25.0400, lng: 121.5500 },
      fuelLevel: 85,
      status: 'available'
    },
    {
      id: 'V002',
      driverName: '李司機',
      licensePlate: 'DEF-5678',
      capacity: 800,
      currentLocation: { lat: 25.0300, lng: 121.5400 },
      fuelLevel: 92,
      status: 'available'
    },
    {
      id: 'V003',
      driverName: '王司機',
      licensePlate: 'GHI-9012',
      capacity: 1200,
      currentLocation: { lat: 25.0500, lng: 121.5600 },
      fuelLevel: 78,
      status: 'busy'
    }
  ];

  useEffect(() => {
    loadData();
  }, [company?.id]);

  const loadData = async () => {
    try {
      setOrders(mockOrders);
      setVehicles(mockVehicles);
      
      setStats({
        totalOrders: mockOrders.length,
        completedToday: 1,
        avgDeliveryTime: 45,
        fuelEfficiency: 8.5
      });
    } catch (error) {
      console.error('載入配送數據失敗:', error);
    }
  };

  const optimizeRoutes = async () => {
    setOptimizing(true);
    setRunning();
    
    try {
      // 使用 AI 分析配送數據並優化路線
      const deliveryData = {
        orders: orders.filter(o => o.status === 'pending'),
        vehicles: vehicles.filter(v => v.status === 'available'),
        trafficData,
        constraints: {
          maxCapacity: 1000,
          maxDeliveryTime: 8 * 60, // 8小時
          fuelEfficiency: 8.5
        }
      };

      const systemPrompt = `你是一個專業的物流路線優化專家，專門為台灣的配送公司規劃最佳配送路線。請根據訂單、車輛和交通狀況，提供優化的配送路線建議。`;
      
      const prompt = `
請優化以下配送路線：

訂單資訊：
${deliveryData.orders.map(order => `
- ${order.customerName}: ${order.address} (優先級: ${order.priority}, 重量: ${order.weight}kg, 時間窗口: ${order.deliveryWindow.start}-${order.deliveryWindow.end})
`).join('')}

可用車輛：
${deliveryData.vehicles.map(vehicle => `
- ${vehicle.licensePlate} (司機: ${vehicle.driverName}, 容量: ${vehicle.capacity}kg, 油量: ${vehicle.fuelLevel}%)
`).join('')}

約束條件：
- 最大載重: ${deliveryData.constraints.maxCapacity}kg
- 最大配送時間: ${deliveryData.constraints.maxDeliveryTime}分鐘
- 燃油效率: ${deliveryData.constraints.fuelEfficiency}km/L

請提供優化的路線規劃，包括：
1. 車輛分配
2. 配送順序
3. 預估時間
4. 燃油消耗
5. 效率提升建議

請以 JSON 格式回應：
{
  "routes": [
    {
      "vehicleId": "V001",
      "orders": ["O001", "O002"],
      "totalDistance": 25.5,
      "estimatedDuration": 180,
      "fuelConsumption": 3.0,
      "waypoints": [
        {"lat": 25.0330, "lng": 121.5654, "orderId": "O001"},
        {"lat": 25.0260, "lng": 121.5438, "orderId": "O002"}
      ]
    }
  ],
  "efficiency": {
    "totalDistance": 45.2,
    "totalTime": 320,
    "fuelSaved": 2.5,
    "timeSaved": 45
  }
}
      `;

      const aiResponse = await generateText(prompt, {
        systemPrompt,
        maxTokens: 1500,
        temperature: 0.3
      });

      try {
        const optimization = JSON.parse(aiResponse.content);
        
        // 創建優化後的路線
        const newRoutes: DeliveryRoute[] = optimization.routes.map((route: any, index: number) => ({
          id: `R${Date.now() + index}`,
          vehicleId: route.vehicleId,
          orders: route.orders.map((orderId: string) => 
            orders.find(o => o.id === orderId)
          ).filter(Boolean) as DeliveryOrder[],
          totalDistance: route.totalDistance,
          estimatedDuration: route.estimatedDuration,
          fuelConsumption: route.fuelConsumption,
          startTime: new Date(),
          endTime: new Date(Date.now() + route.estimatedDuration * 60 * 1000),
          status: 'planned' as const,
          waypoints: route.waypoints
        }));

        setRoutes(prev => [...newRoutes, ...prev]);
        
        // 更新訂單狀態
        setOrders(prev => prev.map(order => {
          const assignedRoute = newRoutes.find(route => 
            route.orders.some(o => o.id === order.id)
          );
          return assignedRoute ? { ...order, status: 'assigned' as const } : order;
        }));

        await sendAlert('info', '路線優化完成', `已優化 ${newRoutes.length} 條配送路線，預估節省 ${optimization.efficiency.timeSaved} 分鐘`);
        
      } catch (parseError) {
        console.error('AI 優化結果解析失敗:', parseError);
        
        // 備用路線規劃
        const fallbackRoutes: DeliveryRoute[] = [
          {
            id: `R${Date.now()}`,
            vehicleId: vehicles[0].id,
            orders: orders.filter(o => o.status === 'pending').slice(0, 2),
            totalDistance: 25.5,
            estimatedDuration: 180,
            fuelConsumption: 3.0,
            startTime: new Date(),
            endTime: new Date(Date.now() + 180 * 60 * 1000),
            status: 'planned',
            waypoints: orders.filter(o => o.status === 'pending').slice(0, 2).map(o => ({
              lat: o.coordinates.lat,
              lng: o.coordinates.lng,
              orderId: o.id
            }))
          }
        ];
        
        setRoutes(prev => [...fallbackRoutes, ...prev]);
      }
      
    } catch (error) {
      console.error('路線優化失敗:', error);
      await sendAlert('warning', '路線優化失敗', '無法完成路線優化，請手動規劃');
    } finally {
      setOptimizing(false);
      setIdle();
    }
  };

  const startDelivery = async (routeId: string) => {
    setRoutes(prev => prev.map(route => 
      route.id === routeId ? { ...route, status: 'active' } : route
    ));
    
    await sendAlert('info', '配送開始', `路線 ${routeId} 已開始配送`);
  };

  const completeDelivery = async (routeId: string) => {
    setRoutes(prev => prev.map(route => 
      route.id === routeId ? { ...route, status: 'completed' } : route
    ));
    
    // 更新訂單狀態
    const route = routes.find(r => r.id === routeId);
    if (route) {
      setOrders(prev => prev.map(order => 
        route.orders.some(o => o.id === order.id) 
          ? { ...order, status: 'delivered' }
          : order
      ));
    }
    
    await sendAlert('success', '配送完成', `路線 ${routeId} 已成功完成配送`);
  };

  const generateDeliveryReport = async () => {
    const completedRoutes = routes.filter(r => r.status === 'completed');
    const activeRoutes = routes.filter(r => r.status === 'active');
    const pendingOrders = orders.filter(o => o.status === 'pending');
    
    const reportContent = `
# 配送營運報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 配送總覽
- 總訂單數：${stats.totalOrders}
- 今日完成：${stats.completedToday}
- 平均配送時間：${stats.avgDeliveryTime} 分鐘
- 燃油效率：${stats.fuelEfficiency} km/L

## 訂單狀態
- 待配送：${pendingOrders.length}
- 配送中：${activeRoutes.length}
- 已完成：${completedRoutes.length}

## 車輛狀態
${vehicles.map(vehicle => `
### ${vehicle.licensePlate} (${vehicle.driverName})
- 狀態：${vehicle.status === 'available' ? '✅ 可用' : 
         vehicle.status === 'busy' ? '🚛 配送中' : '🔧 維修中'}
- 載重容量：${vehicle.capacity} kg
- 油量：${vehicle.fuelLevel}%
- 位置：${vehicle.currentLocation.lat.toFixed(4)}, ${vehicle.currentLocation.lng.toFixed(4)}
`).join('\n')}

## 配送路線
${routes.map(route => `
### 路線 ${route.id}
- 車輛：${vehicles.find(v => v.id === route.vehicleId)?.licensePlate}
- 訂單數：${route.orders.length}
- 總距離：${route.totalDistance} km
- 預估時間：${route.estimatedDuration} 分鐘
- 燃油消耗：${route.fuelConsumption} L
- 狀態：${route.status === 'planned' ? '📋 已規劃' :
         route.status === 'active' ? '🚛 配送中' : '✅ 已完成'}
- 配送訂單：${route.orders.map(o => o.customerName).join(', ')}
`).join('\n')}

## 效率分析
${routes.length > 0 ? `
- 總配送距離：${routes.reduce((sum, r) => sum + r.totalDistance, 0).toFixed(1)} km
- 總配送時間：${routes.reduce((sum, r) => sum + r.estimatedDuration, 0)} 分鐘
- 總燃油消耗：${routes.reduce((sum, r) => sum + r.fuelConsumption, 0).toFixed(1)} L
- 平均每單距離：${(routes.reduce((sum, r) => sum + r.totalDistance, 0) / routes.reduce((sum, r) => sum + r.orders.length, 0)).toFixed(1)} km
` : '暫無配送路線數據'}

## 建議改進
${pendingOrders.length > 0 ? '💡 有未配送訂單，建議立即優化路線' :
  stats.fuelEfficiency < 8.0 ? '💡 燃油效率偏低，建議優化路線規劃' :
  '✅ 配送效率良好'}
    `.trim();

    await generateReport('配送營運報告', reportContent, 'delivery');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-slate-100 text-slate-700';
      case 'assigned': return 'bg-blue-100 text-blue-700';
      case 'in_transit': return 'bg-yellow-100 text-yellow-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 配送助理</h3>
          <p className="text-slate-600 mt-1">智能路線優化，提升配送效率</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={optimizeRoutes}
            disabled={optimizing || orders.filter(o => o.status === 'pending').length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Route className="w-5 h-5" />
            {optimizing ? '優化中...' : '優化路線'}
          </button>
          <button
            onClick={generateDeliveryReport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
              <p className="text-sm text-slate-600">總訂單數</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalOrders}</p>
            </div>
            <Truck className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">今日完成</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.completedToday}</p>
            </div>
            <Clock className="w-10 h-10 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均配送時間</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.avgDeliveryTime}分</p>
            </div>
            <Navigation className="w-10 h-10 text-amber-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">燃油效率</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.fuelEfficiency}km/L</p>
            </div>
            <Fuel className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">配送訂單</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {orders.map((order) => (
                <div key={order.id} className="p-4 bg-slate-50 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-semibold text-slate-900">{order.customerName}</h5>
                      <p className="text-sm text-slate-600">{order.address}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(order.priority)}`}>
                        {order.priority === 'urgent' ? '緊急' :
                         order.priority === 'high' ? '高' :
                         order.priority === 'medium' ? '中' : '低'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
                        {order.status === 'pending' ? '待配送' :
                         order.status === 'assigned' ? '已分配' :
                         order.status === 'in_transit' ? '配送中' :
                         order.status === 'delivered' ? '已送達' : '配送失敗'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>重量: {order.weight}kg</span>
                    <span>時間: {order.deliveryWindow.start}-{order.deliveryWindow.end}</span>
                  </div>
                  {order.specialInstructions && (
                    <p className="text-xs text-slate-500 mt-2">
                      備註: {order.specialInstructions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Routes */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">配送路線</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {routes.length === 0 ? (
                <div className="text-center py-8">
                  <Route className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">暫無配送路線</h4>
                  <p className="text-slate-600">點擊「優化路線」開始規劃配送</p>
                </div>
              ) : (
                routes.map((route) => (
                  <div key={route.id} className="p-4 bg-slate-50 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-semibold text-slate-900">路線 {route.id}</h5>
                        <p className="text-sm text-slate-600">
                          {vehicles.find(v => v.id === route.vehicleId)?.licensePlate} - 
                          {vehicles.find(v => v.id === route.vehicleId)?.driverName}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        route.status === 'planned' ? 'bg-blue-100 text-blue-700' :
                        route.status === 'active' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {route.status === 'planned' ? '已規劃' :
                         route.status === 'active' ? '配送中' : '已完成'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                      <span>距離: {route.totalDistance}km</span>
                      <span>時間: {route.estimatedDuration}分</span>
                      <span>訂單: {route.orders.length}個</span>
                      <span>燃油: {route.fuelConsumption}L</span>
                    </div>
                    <div className="flex gap-2">
                      {route.status === 'planned' && (
                        <button
                          onClick={() => startDelivery(route.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          開始配送
                        </button>
                      )}
                      {route.status === 'active' && (
                        <button
                          onClick={() => completeDelivery(route.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          完成配送
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicles Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-4">車輛狀態</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="p-4 bg-slate-50 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-slate-900">{vehicle.licensePlate}</h5>
                <span className={`px-2 py-1 rounded text-xs ${
                  vehicle.status === 'available' ? 'bg-green-100 text-green-700' :
                  vehicle.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {vehicle.status === 'available' ? '可用' :
                   vehicle.status === 'busy' ? '配送中' : '維修中'}
                </span>
              </div>
              <div className="text-sm text-slate-600 space-y-1">
                <p>司機: {vehicle.driverName}</p>
                <p>容量: {vehicle.capacity}kg</p>
                <p>油量: {vehicle.fuelLevel}%</p>
                <p>位置: {vehicle.currentLocation.lat.toFixed(4)}, {vehicle.currentLocation.lng.toFixed(4)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export class DeliveryAssistant extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <DeliveryAssistantModule context={context} />;
  }
}
