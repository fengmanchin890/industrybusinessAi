/**
 * AI 貨物追蹤 - 智能貨物追蹤系統
 * 提供實時位置更新和異常警報
 */

import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Clock, AlertTriangle, CheckCircle, Package, Navigation, Phone } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../Contexts/AuthContext';
import { generateText, analyzeData } from '../../../lib/ai-service';

const metadata: ModuleMetadata = {
  id: 'cargo-tracking',
  name: 'AI 貨物追蹤',
  version: '1.0.0',
  category: 'logistics',
  industry: ['logistics'],
  description: '全程貨物追蹤系統，提供實時位置更新和異常警報',
  icon: 'Package',
  author: 'AI Business Platform',
  pricingTier: 'basic',
  features: [
    '實時位置追蹤',
    '異常狀態警報',
    '配送進度通知',
    '簽收確認',
    '歷史軌跡查詢'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface TrackingLocation {
  lat: number;
  lng: number;
  address: string;
  timestamp: Date;
}

interface CargoShipment {
  id: string;
  trackingNumber: string;
  customerName: string;
  origin: string;
  destination: string;
  currentLocation: TrackingLocation;
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception';
  estimatedDelivery: Date;
  actualDelivery?: Date;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  cargoType: string;
  weight: number;
  dimensions: string;
  specialInstructions?: string;
  signatureUrl?: string;
  photos?: string[];
  history: TrackingEvent[];
}

interface TrackingEvent {
  id: string;
  timestamp: Date;
  location: string;
  status: string;
  description: string;
  type: 'pickup' | 'transit' | 'delivery' | 'exception' | 'note';
}

export function CargoTrackingModule({ context }: { context: ModuleContext }) {
  const { state, setRunning, setIdle } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  const { company } = useAuth();
  
  const [shipments, setShipments] = useState<CargoShipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<CargoShipment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalShipments: 0,
    inTransit: 0,
    delivered: 0,
    exceptions: 0,
    onTimeRate: 0
  });

  // 模擬貨物資料
  const mockShipments: CargoShipment[] = [
    {
      id: 'S001',
      trackingNumber: 'TW2024001234',
      customerName: '台積電股份有限公司',
      origin: '台北市內湖區',
      destination: '新竹科學園區',
      currentLocation: {
        lat: 24.9936,
        lng: 121.3010,
        address: '國道一號中壢服務區',
        timestamp: new Date()
      },
      status: 'in_transit',
      estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000),
      driverName: '張大明',
      driverPhone: '0912-345-678',
      vehiclePlate: 'ABC-1234',
      cargoType: '精密電子零件',
      weight: 150,
      dimensions: '120x80x60 cm',
      specialInstructions: '輕拿輕放，避免碰撞',
      history: [
        {
          id: 'E001',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          location: '台北市內湖區',
          status: 'picked_up',
          description: '貨物已取件',
          type: 'pickup'
        },
        {
          id: 'E002',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          location: '國道一號南下',
          status: 'in_transit',
          description: '貨物運送中',
          type: 'transit'
        },
        {
          id: 'E003',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          location: '國道一號中壢服務區',
          status: 'in_transit',
          description: '經過中壢服務區',
          type: 'transit'
        }
      ]
    },
    {
      id: 'S002',
      trackingNumber: 'TW2024001235',
      customerName: '台灣大哥大股份有限公司',
      origin: '桃園市蘆竹區',
      destination: '台中市西屯區',
      currentLocation: {
        lat: 24.1477,
        lng: 120.6736,
        address: '台中市西屯區台灣大道',
        timestamp: new Date(Date.now() - 30 * 60 * 1000)
      },
      status: 'out_for_delivery',
      estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000),
      driverName: '李志明',
      driverPhone: '0923-456-789',
      vehiclePlate: 'DEF-5678',
      cargoType: '通訊設備',
      weight: 80,
      dimensions: '100x60x50 cm',
      history: [
        {
          id: 'E004',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          location: '桃園市蘆竹區',
          status: 'picked_up',
          description: '貨物已取件',
          type: 'pickup'
        },
        {
          id: 'E005',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          location: '台中市西屯區配送中心',
          status: 'in_transit',
          description: '抵達配送中心',
          type: 'transit'
        },
        {
          id: 'E006',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          location: '台中市西屯區',
          status: 'out_for_delivery',
          description: '貨物配送中',
          type: 'delivery'
        }
      ]
    },
    {
      id: 'S003',
      trackingNumber: 'TW2024001236',
      customerName: '統一超商股份有限公司',
      origin: '台南市永康區',
      destination: '高雄市前鎮區',
      currentLocation: {
        lat: 22.5968,
        lng: 120.3118,
        address: '高雄市前鎮區成功二路',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      status: 'delivered',
      estimatedDelivery: new Date(Date.now() - 2 * 60 * 60 * 1000),
      actualDelivery: new Date(Date.now() - 2 * 60 * 60 * 1000),
      driverName: '王小華',
      driverPhone: '0934-567-890',
      vehiclePlate: 'GHI-9012',
      cargoType: '食品飲料',
      weight: 200,
      dimensions: '150x100x80 cm',
      signatureUrl: 'signature.png',
      history: [
        {
          id: 'E007',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          location: '台南市永康區',
          status: 'picked_up',
          description: '貨物已取件',
          type: 'pickup'
        },
        {
          id: 'E008',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          location: '國道一號南下',
          status: 'in_transit',
          description: '貨物運送中',
          type: 'transit'
        },
        {
          id: 'E009',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          location: '高雄市前鎮區',
          status: 'delivered',
          description: '貨物已送達並簽收',
          type: 'delivery'
        }
      ]
    },
    {
      id: 'S004',
      trackingNumber: 'TW2024001237',
      customerName: '華碩電腦股份有限公司',
      origin: '台北市北投區',
      destination: '台中市南屯區',
      currentLocation: {
        lat: 24.7826,
        lng: 121.0178,
        address: '國道三號泰安休息站',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      status: 'exception',
      estimatedDelivery: new Date(Date.now() + 4 * 60 * 60 * 1000),
      driverName: '陳建志',
      driverPhone: '0945-678-901',
      vehiclePlate: 'JKL-3456',
      cargoType: '電腦零件',
      weight: 120,
      dimensions: '110x70x55 cm',
      specialInstructions: '需要冷藏運送',
      history: [
        {
          id: 'E010',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          location: '台北市北投區',
          status: 'picked_up',
          description: '貨物已取件',
          type: 'pickup'
        },
        {
          id: 'E011',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          location: '國道三號',
          status: 'in_transit',
          description: '貨物運送中',
          type: 'transit'
        },
        {
          id: 'E012',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          location: '國道三號泰安休息站',
          status: 'exception',
          description: '車輛故障，等待維修',
          type: 'exception'
        }
      ]
    }
  ];

  useEffect(() => {
    loadData();
  }, [company?.id]);

  const loadData = async () => {
    try {
      setShipments(mockShipments);
      
      // 計算統計數據
      const inTransitCount = mockShipments.filter(s => 
        s.status === 'in_transit' || s.status === 'out_for_delivery' || s.status === 'picked_up'
      ).length;
      const deliveredCount = mockShipments.filter(s => s.status === 'delivered').length;
      const exceptionCount = mockShipments.filter(s => s.status === 'exception').length;
      const onTimeDeliveries = mockShipments.filter(s => 
        s.status === 'delivered' && s.actualDelivery && s.actualDelivery <= s.estimatedDelivery
      ).length;
      
      setStats({
        totalShipments: mockShipments.length,
        inTransit: inTransitCount,
        delivered: deliveredCount,
        exceptions: exceptionCount,
        onTimeRate: deliveredCount > 0 ? (onTimeDeliveries / deliveredCount) * 100 : 0
      });
    } catch (error) {
      console.error('載入貨物追蹤數據失敗:', error);
    }
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = searchQuery === '' || 
      shipment.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.destination.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-slate-100 text-slate-700';
      case 'picked_up': return 'bg-blue-100 text-blue-700';
      case 'in_transit': return 'bg-yellow-100 text-yellow-700';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'exception': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待取件';
      case 'picked_up': return '已取件';
      case 'in_transit': return '運送中';
      case 'out_for_delivery': return '配送中';
      case 'delivered': return '已送達';
      case 'exception': return '異常';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'picked_up': return <Package className="w-5 h-5" />;
      case 'in_transit': return <Truck className="w-5 h-5" />;
      case 'out_for_delivery': return <Navigation className="w-5 h-5" />;
      case 'delivered': return <CheckCircle className="w-5 h-5" />;
      case 'exception': return <AlertTriangle className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const generateTrackingReport = async () => {
    const reportContent = `
# 貨物追蹤報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 配送總覽
- 總貨物數：${stats.totalShipments}
- 運送中：${stats.inTransit}
- 已送達：${stats.delivered}
- 異常件：${stats.exceptions}
- 準時送達率：${stats.onTimeRate.toFixed(1)}%

## 貨物明細
${shipments.map(shipment => `
### ${shipment.trackingNumber}
- 客戶：${shipment.customerName}
- 路線：${shipment.origin} → ${shipment.destination}
- 狀態：${getStatusText(shipment.status)}
- 當前位置：${shipment.currentLocation.address}
- 司機：${shipment.driverName} (${shipment.vehiclePlate})
- 貨物類型：${shipment.cargoType}
- 重量：${shipment.weight} kg
- 預計送達：${shipment.estimatedDelivery.toLocaleString('zh-TW')}
${shipment.actualDelivery ? `- 實際送達：${shipment.actualDelivery.toLocaleString('zh-TW')}` : ''}
${shipment.specialInstructions ? `- 特殊說明：${shipment.specialInstructions}` : ''}
`).join('\n')}

## 異常貨物
${stats.exceptions > 0 ? shipments
  .filter(s => s.status === 'exception')
  .map(s => `
### ${s.trackingNumber} - ${s.customerName}
- 當前位置：${s.currentLocation.address}
- 最後更新：${s.currentLocation.timestamp.toLocaleString('zh-TW')}
- 異常描述：${s.history[s.history.length - 1]?.description || '未知異常'}
`).join('\n') : '✅ 目前無異常貨物'}

## 效率分析
- 平均配送時間：預估中
- 準時送達率：${stats.onTimeRate.toFixed(1)}%
- 異常率：${((stats.exceptions / stats.totalShipments) * 100).toFixed(1)}%

${stats.exceptions > 0 ? '⚠️ 建議：請及時處理異常貨物，聯繫相關司機了解情況' : ''}
${stats.onTimeRate < 90 ? '💡 建議：準時率偏低，建議優化配送路線和時間規劃' : ''}
    `.trim();

    await generateReport('貨物追蹤報告', reportContent, 'tracking');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 貨物追蹤</h3>
          <p className="text-slate-600 mt-1">實時追蹤貨物位置與配送狀態</p>
        </div>
        <button
          onClick={generateTrackingReport}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          生成報告
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">總貨物數</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalShipments}</p>
            </div>
            <Package className="w-10 h-10 text-slate-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">運送中</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.inTransit}</p>
            </div>
            <Truck className="w-10 h-10 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">已送達</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.delivered}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">異常件</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.exceptions}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">準時率</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.onTimeRate.toFixed(0)}%</p>
            </div>
            <Clock className="w-10 h-10 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜尋追蹤號碼、客戶名稱或目的地..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">所有狀態</option>
              <option value="pending">待取件</option>
              <option value="picked_up">已取件</option>
              <option value="in_transit">運送中</option>
              <option value="out_for_delivery">配送中</option>
              <option value="delivered">已送達</option>
              <option value="exception">異常</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shipments List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipments Cards */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-slate-900">貨物清單</h4>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredShipments.map((shipment) => (
              <div
                key={shipment.id}
                onClick={() => setSelectedShipment(shipment)}
                className={`p-4 bg-white rounded-xl border-2 cursor-pointer transition-all ${
                  selectedShipment?.id === shipment.id
                    ? 'border-blue-500 shadow-lg'
                    : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h5 className="font-bold text-slate-900">{shipment.trackingNumber}</h5>
                    <p className="text-sm text-slate-600">{shipment.customerName}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(shipment.status)}`}>
                    {getStatusIcon(shipment.status)}
                    {getStatusText(shipment.status)}
                  </span>
                </div>
                
                <div className="flex items-start gap-2 text-sm text-slate-600 mb-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>{shipment.origin} → {shipment.destination}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      當前位置：{shipment.currentLocation.address}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{shipment.driverName} • {shipment.vehiclePlate}</span>
                  <span>{shipment.cargoType} • {shipment.weight}kg</span>
                </div>
                
                {shipment.status === 'exception' && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    {shipment.history[shipment.history.length - 1]?.description || '異常狀態'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Shipment Details */}
        <div>
          <h4 className="text-lg font-bold text-slate-900 mb-4">貨物詳情</h4>
          {selectedShipment ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-xl font-bold text-slate-900">{selectedShipment.trackingNumber}</h5>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${getStatusColor(selectedShipment.status)}`}>
                    {getStatusIcon(selectedShipment.status)}
                    {getStatusText(selectedShipment.status)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">客戶名稱</p>
                    <p className="font-semibold text-slate-900">{selectedShipment.customerName}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">貨物類型</p>
                    <p className="font-semibold text-slate-900">{selectedShipment.cargoType}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">重量</p>
                    <p className="font-semibold text-slate-900">{selectedShipment.weight} kg</p>
                  </div>
                  <div>
                    <p className="text-slate-600">尺寸</p>
                    <p className="font-semibold text-slate-900">{selectedShipment.dimensions}</p>
                  </div>
                </div>
              </div>

              {/* Route */}
              <div className="border-t pt-4">
                <h6 className="font-bold text-slate-900 mb-3">配送路線</h6>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">起點</p>
                      <p className="text-sm text-slate-600">{selectedShipment.origin}</p>
                    </div>
                  </div>
                  
                  <div className="ml-4 border-l-2 border-dashed border-slate-300 h-8"></div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <Navigation className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">當前位置</p>
                      <p className="text-sm text-slate-600">{selectedShipment.currentLocation.address}</p>
                      <p className="text-xs text-slate-500">
                        {selectedShipment.currentLocation.timestamp.toLocaleString('zh-TW')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="ml-4 border-l-2 border-dashed border-slate-300 h-8"></div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">目的地</p>
                      <p className="text-sm text-slate-600">{selectedShipment.destination}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Driver Info */}
              <div className="border-t pt-4">
                <h6 className="font-bold text-slate-900 mb-3">司機資訊</h6>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{selectedShipment.driverName}</p>
                    <p className="text-sm text-slate-600">車牌：{selectedShipment.vehiclePlate}</p>
                  </div>
                  <a
                    href={`tel:${selectedShipment.driverPhone}`}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Phone className="w-4 h-4" />
                    聯繫司機
                  </a>
                </div>
              </div>

              {/* Timeline */}
              <div className="border-t pt-4">
                <h6 className="font-bold text-slate-900 mb-3">配送歷程</h6>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedShipment.history.map((event, index) => (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        event.type === 'exception' ? 'bg-red-100' :
                        event.type === 'delivery' ? 'bg-green-100' :
                        event.type === 'pickup' ? 'bg-blue-100' :
                        'bg-yellow-100'
                      }`}>
                        {event.type === 'exception' ? <AlertTriangle className="w-4 h-4 text-red-600" /> :
                         event.type === 'delivery' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                         event.type === 'pickup' ? <Package className="w-4 h-4 text-blue-600" /> :
                         <Truck className="w-4 h-4 text-yellow-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">{event.description}</p>
                        <p className="text-xs text-slate-600">{event.location}</p>
                        <p className="text-xs text-slate-500">{event.timestamp.toLocaleString('zh-TW')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              {selectedShipment.specialInstructions && (
                <div className="border-t pt-4">
                  <h6 className="font-bold text-slate-900 mb-2">特殊說明</h6>
                  <p className="text-sm text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    {selectedShipment.specialInstructions}
                  </p>
                </div>
              )}

              {/* Delivery Time */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">預計送達時間</p>
                    <p className="font-semibold text-slate-900">
                      {selectedShipment.estimatedDelivery.toLocaleString('zh-TW')}
                    </p>
                  </div>
                  {selectedShipment.actualDelivery && (
                    <div>
                      <p className="text-slate-600">實際送達時間</p>
                      <p className="font-semibold text-green-600">
                        {selectedShipment.actualDelivery.toLocaleString('zh-TW')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-slate-900 mb-2">請選擇貨物</h4>
              <p className="text-slate-600">從左側清單選擇一個貨物以查看詳細資訊</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export class CargoTracking extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <CargoTrackingModule context={context} />;
  }
}
