/**
 * AI 预测性维护模组 - 声音异常检测
 * 通过声音分析预测机台故障
 */

import { useState, useEffect } from 'react';
import { Volume2, AlertTriangle, Activity, TrendingUp, Wifi } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';

const metadata: ModuleMetadata = {
  id: 'predictive-maintenance',
  name: 'AI 预测性维护',
  version: '1.0.0',
  category: 'manufacturing',
  industry: ['manufacturing'],
  description: '通过声音异常检测预测机台故障，提前预警避免停机损失',
  icon: 'Activity',
  author: 'AI Business Platform',
  pricingTier: 'pro',
  features: [
    '实时声音监测',
    '异常模式识别',
    '故障预测分析',
    '维护提醒推送',
    '降低停机时间'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface MachineStatus {
  id: string;
  name: string;
  status: 'normal' | 'warning' | 'critical';
  health: number;
  soundLevel: number;
  vibration: number;
  temperature: number;
  lastMaintenance: Date;
  predictedFailure?: Date;
}

export function PredictiveMaintenanceModule({ context }: { context: ModuleContext }) {
  const { state, setRunning } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  
  const [machines, setMachines] = useState<MachineStatus[]>([
    {
      id: '1',
      name: 'CNC 机台 A1',
      status: 'normal',
      health: 95,
      soundLevel: 65,
      vibration: 0.2,
      temperature: 45,
      lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      name: '压铸机 B2',
      status: 'warning',
      health: 72,
      soundLevel: 82,
      vibration: 0.8,
      temperature: 68,
      lastMaintenance: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      predictedFailure: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      name: '组装线 C1',
      status: 'normal',
      health: 88,
      soundLevel: 58,
      vibration: 0.3,
      temperature: 42,
      lastMaintenance: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    }
  ]);

  const [monitoring, setMonitoring] = useState(true);

  useEffect(() => {
    if (monitoring) {
      setRunning();
      // 模拟实时数据更新
      const interval = setInterval(() => {
        setMachines(prev => prev.map(machine => ({
          ...machine,
          soundLevel: machine.soundLevel + (Math.random() - 0.5) * 5,
          vibration: Math.max(0, machine.vibration + (Math.random() - 0.5) * 0.1),
          temperature: machine.temperature + (Math.random() - 0.5) * 3,
          health: Math.max(0, Math.min(100, machine.health + (Math.random() - 0.5) * 2))
        })));
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [monitoring, setRunning]);

  const generateMaintenanceReport = async () => {
    const criticalMachines = machines.filter(m => m.status === 'critical' || m.status === 'warning');
    
    const reportContent = `
# 设备维护预测报告
生成时间：${new Date().toLocaleString('zh-TW')}

## 设备概况
总设备数：${machines.length}
正常：${machines.filter(m => m.status === 'normal').length}
警告：${machines.filter(m => m.status === 'warning').length}
紧急：${machines.filter(m => m.status === 'critical').length}

## 需要关注的设备
${criticalMachines.map(m => `
### ${m.name}
- 状态：${m.status === 'warning' ? '⚠️ 警告' : '🔴 紧急'}
- 健康度：${m.health.toFixed(0)}%
- 声音等级：${m.soundLevel.toFixed(1)} dB
- 振动：${m.vibration.toFixed(2)} mm/s
- 温度：${m.temperature.toFixed(1)}°C
- 上次维护：${Math.floor((Date.now() - m.lastMaintenance.getTime()) / (24 * 60 * 60 * 1000))} 天前
${m.predictedFailure ? `- ⚠️ 预测可能在 ${Math.ceil((m.predictedFailure.getTime() - Date.now()) / (24 * 60 * 60 * 1000))} 天内需要维护` : ''}
`).join('\n')}

## 维护建议
${criticalMachines.length === 0 ? '✓ 所有设备运行正常' : '建议尽快安排维护检查'}
    `.trim();

    await generateReport('设备维护预测报告', reportContent, 'maintenance');
  };

  const getStatusColor = (status: MachineStatus['status']) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-700 border-green-200';
      case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const getStatusIcon = (status: MachineStatus['status']) => {
    switch (status) {
      case 'normal': return <Activity className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 预测性维护</h3>
          <p className="text-slate-600 mt-1">实时监测设备健康状态，预测维护需求</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMonitoring(!monitoring)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              monitoring
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-slate-600 text-white hover:bg-slate-700'
            }`}
          >
            <Wifi className="w-5 h-5" />
            {monitoring ? '监测中' : '已暂停'}
          </button>
          <button
            onClick={generateMaintenanceReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            生成报告
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-600">总设备数</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{machines.length}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-6">
          <p className="text-sm text-green-700">正常运行</p>
          <p className="text-3xl font-bold text-green-700 mt-1">
            {machines.filter(m => m.status === 'normal').length}
          </p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
          <p className="text-sm text-amber-700">需要关注</p>
          <p className="text-3xl font-bold text-amber-700 mt-1">
            {machines.filter(m => m.status === 'warning').length}
          </p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-6">
          <p className="text-sm text-red-700">紧急维护</p>
          <p className="text-3xl font-bold text-red-700 mt-1">
            {machines.filter(m => m.status === 'critical').length}
          </p>
        </div>
      </div>

      {/* Machine List */}
      <div className="space-y-4">
        {machines.map(machine => (
          <div
            key={machine.id}
            className={`border-2 rounded-xl p-6 ${getStatusColor(machine.status)}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(machine.status)}
                <div>
                  <h4 className="text-lg font-bold">{machine.name}</h4>
                  <p className="text-sm opacity-75">
                    上次维护：{Math.floor((Date.now() - machine.lastMaintenance.getTime()) / (24 * 60 * 60 * 1000))} 天前
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{machine.health.toFixed(0)}%</div>
                <div className="text-sm opacity-75">健康度</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm font-medium">声音等级</span>
                </div>
                <div className="text-2xl font-bold">{machine.soundLevel.toFixed(1)} dB</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm font-medium">振动</span>
                </div>
                <div className="text-2xl font-bold">{machine.vibration.toFixed(2)} mm/s</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">温度</span>
                </div>
                <div className="text-2xl font-bold">{machine.temperature.toFixed(1)}°C</div>
              </div>
            </div>

            {machine.predictedFailure && (
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-current/20">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  预测可能在 {Math.ceil((machine.predictedFailure.getTime() - Date.now()) / (24 * 60 * 60 * 1000))} 天内需要维护
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 导出模块类（用于注册）
export class PredictiveMaintenance extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <PredictiveMaintenanceModule context={context} />;
  }
}

