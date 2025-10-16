/**
 * 長照 AI 監測系統 - 智能照護監控
 * 為長照機構提供智能監測和預警服務
 */

import React, { useState, useEffect } from 'react';
import { Heart, Activity, AlertTriangle, Users, Clock, Camera } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../Contexts/AuthContext';
import { generateText, analyzeSentiment } from '../../../lib/ai-service';

const metadata: ModuleMetadata = {
  id: 'eldercare-monitoring',
  name: '長照 AI 監測系統',
  version: '1.0.0',
  category: 'healthcare',
  industry: ['healthcare'],
  description: '智能長照監測系統，偵測跌倒、異常呼吸、行為異常等緊急情況',
  icon: 'Heart',
  author: 'AI Business Platform',
  pricingTier: 'pro',
  features: [
    '跌倒偵測',
    '呼吸監測',
    '行為異常偵測',
    '即時預警',
    '照護記錄'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface Resident {
  id: string;
  name: string;
  age: number;
  room: string;
  bed: string;
  medicalConditions: string[];
  riskLevel: 'low' | 'medium' | 'high';
  emergencyContact: string;
  lastCheck: Date;
  status: 'normal' | 'warning' | 'alert' | 'emergency';
}

interface MonitoringData {
  residentId: string;
  timestamp: Date;
  heartRate: number;
  respiratoryRate: number;
  movement: number;
  position: 'lying' | 'sitting' | 'standing' | 'walking';
  fallDetected: boolean;
  breathingAbnormal: boolean;
  behaviorAnomaly: boolean;
  temperature: number;
  oxygenSaturation: number;
}

interface AlertEvent {
  id: string;
  residentId: string;
  residentName: string;
  type: 'fall' | 'breathing' | 'behavior' | 'vital' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
}

export function ElderCareMonitoringModule({ context }: { context: ModuleContext }) {
  const { state, setRunning } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  const { company } = useAuth();
  
  const [residents, setResidents] = useState<Resident[]>([]);
  const [monitoringData, setMonitoringData] = useState<MonitoringData[]>([]);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [monitoring, setMonitoring] = useState(true);
  const [stats, setStats] = useState({
    totalResidents: 0,
    activeAlerts: 0,
    emergencyCount: 0,
    avgResponseTime: 0
  });

  // 模擬住民數據
  const mockResidents: Resident[] = [
    {
      id: 'R001',
      name: '陳阿嬤',
      age: 85,
      room: 'A101',
      bed: '1',
      medicalConditions: ['高血壓', '糖尿病', '輕度失智'],
      riskLevel: 'high',
      emergencyContact: '0912-345-678',
      lastCheck: new Date(Date.now() - 5 * 60 * 1000),
      status: 'normal'
    },
    {
      id: 'R002',
      name: '李阿公',
      age: 78,
      room: 'A102',
      bed: '2',
      medicalConditions: ['心臟病', '關節炎'],
      riskLevel: 'medium',
      emergencyContact: '0987-654-321',
      lastCheck: new Date(Date.now() - 2 * 60 * 1000),
      status: 'warning'
    },
    {
      id: 'R003',
      name: '王阿嬤',
      age: 92,
      room: 'A103',
      bed: '1',
      medicalConditions: ['失智症', '骨質疏鬆'],
      riskLevel: 'high',
      emergencyContact: '0933-222-111',
      lastCheck: new Date(Date.now() - 1 * 60 * 1000),
      status: 'alert'
    }
  ];

  useEffect(() => {
    loadResidents();
    if (monitoring) {
      startMonitoring();
    }
  }, [company?.id, monitoring]);

  const loadResidents = async () => {
    try {
      setResidents(mockResidents);
      setStats({
        totalResidents: mockResidents.length,
        activeAlerts: mockResidents.filter(r => r.status !== 'normal').length,
        emergencyCount: mockResidents.filter(r => r.status === 'emergency').length,
        avgResponseTime: 3.5
      });
    } catch (error) {
      console.error('載入住民資料失敗:', error);
    }
  };

  const startMonitoring = () => {
    setRunning();
    
    // 模擬即時監測數據
    const interval = setInterval(() => {
      if (!monitoring) {
        clearInterval(interval);
        return;
      }

      // 生成監測數據
      const newData: MonitoringData[] = residents.map(resident => {
        const baseHeartRate = 60 + Math.random() * 40;
        const baseRespiratoryRate = 12 + Math.random() * 8;
        const movement = Math.random() * 100;
        
        // 模擬異常情況
        const fallDetected = Math.random() < 0.02; // 2% 跌倒機率
        const breathingAbnormal = Math.random() < 0.05; // 5% 呼吸異常機率
        const behaviorAnomaly = Math.random() < 0.03; // 3% 行為異常機率
        
        return {
          residentId: resident.id,
          timestamp: new Date(),
          heartRate: baseHeartRate + (breathingAbnormal ? 20 : 0),
          respiratoryRate: baseRespiratoryRate + (breathingAbnormal ? 10 : 0),
          movement,
          position: movement > 80 ? 'walking' : movement > 50 ? 'standing' : movement > 20 ? 'sitting' : 'lying',
          fallDetected,
          breathingAbnormal,
          behaviorAnomaly,
          temperature: 36.5 + Math.random() * 1.5,
          oxygenSaturation: 95 + Math.random() * 5
        };
      });

      setMonitoringData(prev => [...newData, ...prev.slice(0, 50)]); // 保留最近50筆

      // 檢查異常並生成警示
      newData.forEach(data => {
        const resident = residents.find(r => r.id === data.residentId);
        if (!resident) return;

        let alertType: AlertEvent['type'] | null = null;
        let severity: AlertEvent['severity'] = 'low';
        let message = '';

        if (data.fallDetected) {
          alertType = 'fall';
          severity = 'critical';
          message = '偵測到跌倒事件';
        } else if (data.breathingAbnormal) {
          alertType = 'breathing';
          severity = 'high';
          message = '呼吸異常偵測';
        } else if (data.behaviorAnomaly) {
          alertType = 'behavior';
          severity = 'medium';
          message = '行為異常偵測';
        } else if (data.heartRate > 120 || data.heartRate < 50) {
          alertType = 'vital';
          severity = 'high';
          message = '心率異常';
        } else if (data.oxygenSaturation < 90) {
          alertType = 'vital';
          severity = 'critical';
          message = '血氧濃度過低';
        }

        if (alertType) {
          const alert: AlertEvent = {
            id: Date.now().toString(),
            residentId: resident.id,
            residentName: resident.name,
            type: alertType,
            severity,
            message,
            timestamp: new Date(),
            acknowledged: false,
            resolved: false
          };

          setAlerts(prev => [alert, ...prev.slice(0, 20)]); // 保留最近20筆警示
          
          // 發送即時警示
          sendAlert(severity === 'critical' ? 'critical' : severity === 'high' ? 'high' : 'medium', 
                   `${resident.name} - ${message}`, 
                   `房間: ${resident.room}, 床位: ${resident.bed}`);
        }
      });

    }, 5000); // 每5秒更新一次

    return () => clearInterval(interval);
  };

  const acknowledgeAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const resolveAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const generateMonitoringReport = async () => {
    const activeAlerts = alerts.filter(a => !a.resolved);
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.resolved);
    
    const reportContent = `
# 長照監測報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 監測總覽
- 總住民數：${stats.totalResidents}
- 活躍警示：${stats.activeAlerts}
- 緊急事件：${stats.emergencyCount}
- 平均回應時間：${stats.avgResponseTime} 分鐘

## 住民狀態
${residents.map(resident => `
### ${resident.name} (${resident.age}歲)
- 房間：${resident.room}-${resident.bed}
- 風險等級：${resident.riskLevel === 'high' ? '🔴 高' : resident.riskLevel === 'medium' ? '🟡 中' : '🟢 低'}
- 目前狀態：${resident.status === 'normal' ? '✅ 正常' : 
              resident.status === 'warning' ? '⚠️ 警告' : 
              resident.status === 'alert' ? '🔴 警示' : '🚨 緊急'}
- 最後檢查：${resident.lastCheck.toLocaleString('zh-TW')}
- 醫療狀況：${resident.medicalConditions.join(', ')}
- 緊急聯絡：${resident.emergencyContact}
`).join('\n')}

## 活躍警示
${activeAlerts.length === 0 ? '✅ 目前無活躍警示' : activeAlerts.map(alert => `
### ${alert.residentName} - ${alert.message}
- 類型：${alert.type === 'fall' ? '跌倒' : 
         alert.type === 'breathing' ? '呼吸' : 
         alert.type === 'behavior' ? '行為' : 
         alert.type === 'vital' ? '生命徵象' : '緊急'}
- 嚴重程度：${alert.severity === 'critical' ? '🔴 緊急' : 
             alert.severity === 'high' ? '🟠 高' : 
             alert.severity === 'medium' ? '🟡 中' : '🟢 低'}
- 時間：${alert.timestamp.toLocaleString('zh-TW')}
- 狀態：${alert.acknowledged ? '✅ 已確認' : '⏳ 待確認'} ${alert.resolved ? '✅ 已解決' : '⏳ 處理中'}
`).join('\n')}

## 緊急事件統計
${criticalAlerts.length === 0 ? '✅ 目前無緊急事件' : `
- 緊急事件數：${criticalAlerts.length}
- 最近緊急事件：${criticalAlerts[0]?.timestamp.toLocaleString('zh-TW')}
- 需要立即關注的住民：${criticalAlerts.map(a => a.residentName).join(', ')}
`}

## 建議措施
${criticalAlerts.length > 0 ? '🚨 有緊急事件需要立即處理' :
  activeAlerts.length > 0 ? '⚠️ 有警示需要關注' :
  '✅ 所有住民狀況正常'}

## AI 分析建議
${residents.filter(r => r.riskLevel === 'high').length > 0 ? 
  '💡 建議加強高風險住民的監測頻率' : 
  '✅ 風險控制良好'}
    `.trim();

    await generateReport('長照監測報告', reportContent, 'eldercare');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-700 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'alert': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'emergency': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">長照 AI 監測系統</h3>
          <p className="text-slate-600 mt-1">智能監測長照住民，即時偵測異常情況</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMonitoring(!monitoring)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              monitoring
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <Activity className="w-5 h-5" />
            {monitoring ? '停止監測' : '開始監測'}
          </button>
          <button
            onClick={generateMonitoringReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              <p className="text-sm text-slate-600">總住民數</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalResidents}</p>
            </div>
            <Users className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">活躍警示</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{stats.activeAlerts}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">緊急事件</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.emergencyCount}</p>
            </div>
            <Heart className="w-10 h-10 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均回應時間</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.avgResponseTime}分</p>
            </div>
            <Clock className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Residents Status */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">住民狀態</h4>
            <div className="space-y-3">
              {residents.map((resident) => (
                <div
                  key={resident.id}
                  onClick={() => setSelectedResident(resident)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedResident?.id === resident.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-semibold text-slate-900">{resident.name}</h5>
                      <p className="text-sm text-slate-600">{resident.age}歲 | {resident.room}-{resident.bed}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${getStatusColor(resident.status)}`}>
                      {resident.status === 'normal' ? '正常' :
                       resident.status === 'warning' ? '警告' :
                       resident.status === 'alert' ? '警示' : '緊急'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      resident.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                      resident.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      風險: {resident.riskLevel === 'high' ? '高' : resident.riskLevel === 'medium' ? '中' : '低'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {Math.floor((Date.now() - resident.lastCheck.getTime()) / 60000)}分鐘前檢查
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    狀況: {resident.medicalConditions.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">即時警示</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.filter(alert => !alert.resolved).length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">目前無警示</h4>
                  <p className="text-slate-600">所有住民狀況正常</p>
                </div>
              ) : (
                alerts.filter(alert => !alert.resolved).map((alert) => (
                  <div key={alert.id} className="p-4 bg-slate-50 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-semibold text-slate-900">{alert.residentName}</h5>
                        <p className="text-sm text-slate-600">{alert.message}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${getSeverityColor(alert.severity)}`}>
                        {alert.severity === 'critical' ? '緊急' :
                         alert.severity === 'high' ? '高' :
                         alert.severity === 'medium' ? '中' : '低'}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {alert.timestamp.toLocaleTimeString('zh-TW')}
                      </span>
                      <div className="flex gap-2">
                        {!alert.acknowledged && (
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            確認
                          </button>
                        )}
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          解決
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Monitoring Data */}
      {selectedResident && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h4 className="text-lg font-bold text-slate-900 mb-4">
            {selectedResident.name} - 即時監測數據
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {monitoringData.filter(data => data.residentId === selectedResident.id).slice(0, 1).map((data) => (
              <>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Heart className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">心率</p>
                  <p className="text-2xl font-bold text-slate-900">{data.heartRate.toFixed(0)}</p>
                  <p className="text-xs text-slate-500">次/分</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">呼吸</p>
                  <p className="text-2xl font-bold text-slate-900">{data.respiratoryRate.toFixed(0)}</p>
                  <p className="text-xs text-slate-500">次/分</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Camera className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">位置</p>
                  <p className="text-lg font-bold text-slate-900">
                    {data.position === 'lying' ? '躺臥' :
                     data.position === 'sitting' ? '坐著' :
                     data.position === 'standing' ? '站立' : '行走'}
                  </p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">血氧</p>
                  <p className="text-2xl font-bold text-slate-900">{data.oxygenSaturation.toFixed(0)}</p>
                  <p className="text-xs text-slate-500">%</p>
                </div>
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export class ElderCareMonitoring extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <ElderCareMonitoringModule context={context} />;
  }
}
