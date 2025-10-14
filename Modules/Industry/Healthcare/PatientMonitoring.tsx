/**
 * AI 病患監控模組
 * 適用於醫療機構的病患生命徵象監控
 */

import React, { useState, useEffect } from 'react';
import { Heart, Activity, Thermometer, Droplets, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';

const metadata: ModuleMetadata = {
  id: 'patient-monitoring',
  name: 'AI 病患監控',
  version: '1.0.0',
  category: 'healthcare',
  industry: ['healthcare'],
  description: 'AI 驅動的病患生命徵象監控系統，即時分析異常並自動警示',
  icon: 'Heart',
  author: 'AI Business Platform',
  pricingTier: 'pro',
  features: [
    '即時生命徵象監控',
    'AI 異常檢測',
    '自動警示系統',
    '趨勢分析報告',
    '多病患管理'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface VitalSigns {
  heartRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  temperature: number;
  oxygenSaturation: number;
  timestamp: Date;
}

interface Patient {
  id: string;
  name: string;
  room: string;
  age: number;
  condition: string;
  vitalSigns: VitalSigns[];
  status: 'stable' | 'warning' | 'critical';
}

export function PatientMonitoringModule({ context }: { context: ModuleContext }) {
  const { state, setRunning, setIdle } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: '1',
      name: '王小明',
      room: '301A',
      age: 65,
      condition: '高血壓',
      vitalSigns: [],
      status: 'stable'
    },
    {
      id: '2',
      name: '李美華',
      room: '302B',
      age: 72,
      condition: '糖尿病',
      vitalSigns: [],
      status: 'warning'
    },
    {
      id: '3',
      name: '陳志強',
      room: '303C',
      age: 58,
      condition: '心臟病',
      vitalSigns: [],
      status: 'critical'
    }
  ]);

  const [selectedPatient, setSelectedPatient] = useState<string>('1');
  const [isMonitoring, setIsMonitoring] = useState(false);

  // 模擬生命徵象數據生成
  const generateVitalSigns = (patient: Patient): VitalSigns => {
    const baseValues = {
      heartRate: 70 + Math.random() * 20,
      bloodPressure: { systolic: 120 + Math.random() * 20, diastolic: 80 + Math.random() * 10 },
      temperature: 36.5 + Math.random() * 1.5,
      oxygenSaturation: 95 + Math.random() * 5
    };

    // 根據病患狀況調整數值
    if (patient.condition === '高血壓') {
      baseValues.bloodPressure.systolic += 20;
      baseValues.bloodPressure.diastolic += 10;
    } else if (patient.condition === '糖尿病') {
      baseValues.heartRate += 10;
    } else if (patient.condition === '心臟病') {
      baseValues.heartRate += 15;
      baseValues.oxygenSaturation -= 3;
    }

    return {
      ...baseValues,
      timestamp: new Date()
    };
  };

  // 檢查異常狀況
  const checkAbnormalities = (vitalSigns: VitalSigns, patient: Patient) => {
    const alerts: string[] = [];

    if (vitalSigns.heartRate > 100 || vitalSigns.heartRate < 60) {
      alerts.push(`心率異常: ${vitalSigns.heartRate.toFixed(0)} bpm`);
    }

    if (vitalSigns.bloodPressure.systolic > 140 || vitalSigns.bloodPressure.diastolic > 90) {
      alerts.push(`血壓異常: ${vitalSigns.bloodPressure.systolic}/${vitalSigns.bloodPressure.diastolic}`);
    }

    if (vitalSigns.temperature > 37.5) {
      alerts.push(`體溫異常: ${vitalSigns.temperature.toFixed(1)}°C`);
    }

    if (vitalSigns.oxygenSaturation < 95) {
      alerts.push(`血氧異常: ${vitalSigns.oxygenSaturation.toFixed(1)}%`);
    }

    return alerts;
  };

  // 開始監控
  const startMonitoring = () => {
    setIsMonitoring(true);
    setRunning();
    
    const interval = setInterval(() => {
      setPatients(prevPatients => {
        return prevPatients.map(patient => {
          const newVitalSigns = generateVitalSigns(patient);
          const alerts = checkAbnormalities(newVitalSigns, patient);
          
          // 更新生命徵象
          const updatedVitalSigns = [...patient.vitalSigns, newVitalSigns].slice(-10); // 保留最近10筆
          
          // 更新狀態
          let newStatus: 'stable' | 'warning' | 'critical' = 'stable';
          if (alerts.length > 0) {
            newStatus = alerts.length >= 2 ? 'critical' : 'warning';
            
            // 發送警示
            if (alerts.length >= 2) {
              sendAlert('high', `病患 ${patient.name} 生命徵象異常`, alerts.join('; '));
            } else {
              sendAlert('medium', `病患 ${patient.name} 需要關注`, alerts.join('; '));
            }
          }

          return {
            ...patient,
            vitalSigns: updatedVitalSigns,
            status: newStatus
          };
        });
      });
    }, 5000); // 每5秒更新一次

    // 清理函數
    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
      setIdle();
    };
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    setIdle();
  };

  const generatePatientReport = async (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient || patient.vitalSigns.length === 0) return;

    const latestVitals = patient.vitalSigns[patient.vitalSigns.length - 1];
    const avgHeartRate = patient.vitalSigns.reduce((sum, v) => sum + v.heartRate, 0) / patient.vitalSigns.length;
    const avgTemp = patient.vitalSigns.reduce((sum, v) => sum + v.temperature, 0) / patient.vitalSigns.length;

    const reportContent = `
# 病患監控報告 - ${patient.name}
生成時間：${new Date().toLocaleString('zh-TW')}

## 病患資訊
- 姓名：${patient.name}
- 病房：${patient.room}
- 年齡：${patient.age}歲
- 診斷：${patient.condition}
- 目前狀態：${patient.status === 'stable' ? '穩定' : patient.status === 'warning' ? '需關注' : '危急'}

## 最新生命徵象
- 心率：${latestVitals.heartRate.toFixed(0)} bpm
- 血壓：${latestVitals.bloodPressure.systolic}/${latestVitals.bloodPressure.diastolic} mmHg
- 體溫：${latestVitals.temperature.toFixed(1)}°C
- 血氧：${latestVitals.oxygenSaturation.toFixed(1)}%

## 統計數據
- 平均心率：${avgHeartRate.toFixed(0)} bpm
- 平均體溫：${avgTemp.toFixed(1)}°C
- 監控時長：${patient.vitalSigns.length * 5} 分鐘

## 趨勢分析
${patient.vitalSigns.length >= 3 ? `
- 心率趨勢：${patient.vitalSigns[patient.vitalSigns.length - 1].heartRate > patient.vitalSigns[0].heartRate ? '上升' : '下降'}
- 體溫趨勢：${patient.vitalSigns[patient.vitalSigns.length - 1].temperature > patient.vitalSigns[0].temperature ? '上升' : '下降'}
` : '- 數據不足，無法分析趨勢'}

## 建議
${patient.status === 'critical' ? '⚠️ 立即通知醫師，病患狀況危急' : 
  patient.status === 'warning' ? '⚠️ 密切監控，建議醫師評估' : 
  '✓ 生命徵象穩定，繼續常規監控'}
    `.trim();

    await generateReport(`病患監控報告 - ${patient.name}`, reportContent, 'custom');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'stable': return <Heart className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Heart className="w-5 h-5 text-slate-600" />;
    }
  };

  const currentPatient = patients.find(p => p.id === selectedPatient);
  const latestVitals = currentPatient?.vitalSigns[currentPatient.vitalSigns.length - 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 病患監控</h3>
          <p className="text-slate-600 mt-1">即時生命徵象監控與異常檢測</p>
        </div>
        <div className="flex gap-2">
          {isMonitoring ? (
            <button
              onClick={stopMonitoring}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              停止監控
            </button>
          ) : (
            <button
              onClick={startMonitoring}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              開始監控
            </button>
          )}
        </div>
      </div>

      {/* Patient List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {patients.map(patient => (
          <div
            key={patient.id}
            onClick={() => setSelectedPatient(patient.id)}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedPatient === patient.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-900">{patient.name}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                {patient.status === 'stable' ? '穩定' : patient.status === 'warning' ? '需關注' : '危急'}
              </span>
            </div>
            <div className="text-sm text-slate-600 space-y-1">
              <p>病房：{patient.room}</p>
              <p>診斷：{patient.condition}</p>
              <p>年齡：{patient.age}歲</p>
            </div>
            <div className="flex items-center gap-2 mt-3">
              {getStatusIcon(patient.status)}
              <span className="text-sm text-slate-600">
                {patient.vitalSigns.length > 0 ? '監控中' : '未開始'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Current Patient Details */}
      {currentPatient && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold text-slate-900">
              {currentPatient.name} - 即時監控
            </h4>
            <button
              onClick={() => generatePatientReport(currentPatient.id)}
              disabled={currentPatient.vitalSigns.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              生成報告
            </button>
          </div>

          {latestVitals ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600">心率</p>
                    <p className="text-2xl font-bold text-red-700">{latestVitals.heartRate.toFixed(0)}</p>
                    <p className="text-xs text-red-600">bpm</p>
                  </div>
                  <Heart className="w-8 h-8 text-red-600" />
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">血壓</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {latestVitals.bloodPressure.systolic}/{latestVitals.bloodPressure.diastolic}
                    </p>
                    <p className="text-xs text-blue-600">mmHg</p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600">體溫</p>
                    <p className="text-2xl font-bold text-orange-700">{latestVitals.temperature.toFixed(1)}</p>
                    <p className="text-xs text-orange-600">°C</p>
                  </div>
                  <Thermometer className="w-8 h-8 text-orange-600" />
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">血氧</p>
                    <p className="text-2xl font-bold text-green-700">{latestVitals.oxygenSaturation.toFixed(1)}</p>
                    <p className="text-xs text-green-600">%</p>
                  </div>
                  <Droplets className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>尚未開始監控</p>
              <p className="text-sm mt-1">點擊「開始監控」按鈕開始收集生命徵象數據</p>
            </div>
          )}

          {/* Monitoring Status */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
                <span className="text-sm font-medium text-slate-700">
                  {isMonitoring ? '監控中' : '已停止'}
                </span>
              </div>
              <div className="text-sm text-slate-600">
                更新頻率：每5秒
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 導出模組類（用於註冊）
export class PatientMonitoring extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <PatientMonitoringModule context={context} />;
  }
}
