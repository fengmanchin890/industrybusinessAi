/**
 * AI 倉儲排班系統 - 智能人力排班
 * 為倉儲業提供智能排班和人力優化
 */

import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../Contexts/AuthContext';
import { generateText, analyzeData } from '../../../lib/ai-service';

const metadata: ModuleMetadata = {
  id: 'warehouse-scheduler',
  name: 'AI 倉儲排班系統',
  version: '1.0.0',
  category: 'logistics',
  industry: ['logistics'],
  description: '智能倉儲排班系統，根據工作量自動生成最優班表',
  icon: 'Users',
  author: 'AI Business Platform',
  pricingTier: 'pro',
  features: [
    '智能排班',
    '工作量預測',
    '人力優化',
    '加班管理',
    '效率分析'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface Employee {
  id: string;
  name: string;
  position: 'picker' | 'packer' | 'supervisor' | 'driver';
  skillLevel: 'junior' | 'senior' | 'expert';
  hourlyRate: number;
  maxHoursPerDay: number;
  maxHoursPerWeek: number;
  availability: {
    monday: { start: string; end: string; available: boolean };
    tuesday: { start: string; end: string; available: boolean };
    wednesday: { start: string; end: string; available: boolean };
    thursday: { start: string; end: string; available: boolean };
    friday: { start: string; end: string; available: boolean };
    saturday: { start: string; end: string; available: boolean };
    sunday: { start: string; end: string; available: boolean };
  };
  currentHours: number;
  overtimeHours: number;
}

interface Workload {
  date: string;
  expectedOrders: number;
  expectedPicks: number;
  expectedPacks: number;
  peakHours: string[];
  specialRequirements: string[];
}

interface Shift {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  position: string;
  workload: number;
  overtime: boolean;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

interface ScheduleOptimization {
  totalCost: number;
  totalHours: number;
  coverage: number;
  efficiency: number;
  recommendations: string[];
}

export function WarehouseSchedulerModule({ context }: { context: ModuleContext }) {
  const { state, setRunning } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  const { company } = useAuth();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState<ScheduleOptimization | null>(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    scheduledShifts: 0,
    avgEfficiency: 0,
    totalCost: 0
  });

  // 模擬員工數據
  const mockEmployees: Employee[] = [
    {
      id: 'E001',
      name: '王小明',
      position: 'picker',
      skillLevel: 'senior',
      hourlyRate: 200,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      availability: {
        monday: { start: '08:00', end: '17:00', available: true },
        tuesday: { start: '08:00', end: '17:00', available: true },
        wednesday: { start: '08:00', end: '17:00', available: true },
        thursday: { start: '08:00', end: '17:00', available: true },
        friday: { start: '08:00', end: '17:00', available: true },
        saturday: { start: '09:00', end: '15:00', available: true },
        sunday: { start: '09:00', end: '15:00', available: false }
      },
      currentHours: 32,
      overtimeHours: 0
    },
    {
      id: 'E002',
      name: '李美華',
      position: 'packer',
      skillLevel: 'junior',
      hourlyRate: 180,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      availability: {
        monday: { start: '09:00', end: '18:00', available: true },
        tuesday: { start: '09:00', end: '18:00', available: true },
        wednesday: { start: '09:00', end: '18:00', available: true },
        thursday: { start: '09:00', end: '18:00', available: true },
        friday: { start: '09:00', end: '18:00', available: true },
        saturday: { start: '10:00', end: '16:00', available: true },
        sunday: { start: '10:00', end: '16:00', available: true }
      },
      currentHours: 28,
      overtimeHours: 0
    },
    {
      id: 'E003',
      name: '陳志強',
      position: 'supervisor',
      skillLevel: 'expert',
      hourlyRate: 300,
      maxHoursPerDay: 10,
      maxHoursPerWeek: 50,
      availability: {
        monday: { start: '07:00', end: '19:00', available: true },
        tuesday: { start: '07:00', end: '19:00', available: true },
        wednesday: { start: '07:00', end: '19:00', available: true },
        thursday: { start: '07:00', end: '19:00', available: true },
        friday: { start: '07:00', end: '19:00', available: true },
        saturday: { start: '08:00', end: '16:00', available: true },
        sunday: { start: '08:00', end: '16:00', available: true }
      },
      currentHours: 45,
      overtimeHours: 5
    },
    {
      id: 'E004',
      name: '林雅婷',
      position: 'driver',
      skillLevel: 'senior',
      hourlyRate: 250,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      availability: {
        monday: { start: '06:00', end: '15:00', available: true },
        tuesday: { start: '06:00', end: '15:00', available: true },
        wednesday: { start: '06:00', end: '15:00', available: true },
        thursday: { start: '06:00', end: '15:00', available: true },
        friday: { start: '06:00', end: '15:00', available: true },
        saturday: { start: '07:00', end: '14:00', available: true },
        sunday: { start: '07:00', end: '14:00', available: false }
      },
      currentHours: 35,
      overtimeHours: 0
    }
  ];

  // 模擬工作量預測
  const mockWorkloads: Workload[] = [
    {
      date: '2024-01-15',
      expectedOrders: 150,
      expectedPicks: 450,
      expectedPacks: 150,
      peakHours: ['10:00-12:00', '14:00-16:00'],
      specialRequirements: ['需要額外包裝人員']
    },
    {
      date: '2024-01-16',
      expectedOrders: 200,
      expectedPicks: 600,
      expectedPacks: 200,
      peakHours: ['09:00-11:00', '13:00-15:00', '16:00-18:00'],
      specialRequirements: ['需要加班處理']
    },
    {
      date: '2024-01-17',
      expectedOrders: 120,
      expectedPicks: 360,
      expectedPacks: 120,
      peakHours: ['11:00-13:00'],
      specialRequirements: []
    }
  ];

  useEffect(() => {
    loadData();
  }, [company?.id]);

  const loadData = async () => {
    try {
      setEmployees(mockEmployees);
      setWorkloads(mockWorkloads);
      
      setStats({
        totalEmployees: mockEmployees.length,
        scheduledShifts: 0,
        avgEfficiency: 85,
        totalCost: mockEmployees.reduce((sum, emp) => sum + (emp.currentHours * emp.hourlyRate), 0)
      });
    } catch (error) {
      console.error('載入排班數據失敗:', error);
    }
  };

  const optimizeSchedule = async () => {
    setOptimizing(true);
    setRunning();
    
    try {
      // 使用 AI 分析排班數據並優化
      const scheduleData = {
        employees: employees.map(emp => ({
          id: emp.id,
          name: emp.name,
          position: emp.position,
          skillLevel: emp.skillLevel,
          hourlyRate: emp.hourlyRate,
          maxHoursPerDay: emp.maxHoursPerDay,
          maxHoursPerWeek: emp.maxHoursPerWeek,
          currentHours: emp.currentHours,
          availability: emp.availability
        })),
        workloads: workloads,
        constraints: {
          minCoverage: 0.8,
          maxOvertime: 10,
          budgetLimit: 50000
        }
      };

      const systemPrompt = `你是一個專業的倉儲排班優化專家，專門為台灣的倉儲公司規劃最優的人力排班。請根據員工技能、工作量和約束條件，提供優化的排班建議。`;
      
      const prompt = `
請優化以下倉儲排班：

員工資訊：
${scheduleData.employees.map(emp => `
- ${emp.name}: ${emp.position} (技能: ${emp.skillLevel}, 時薪: NT$ ${emp.hourlyRate}, 已工作: ${emp.currentHours}小時)
`).join('')}

工作量預測：
${scheduleData.workloads.map(workload => `
- ${workload.date}: ${workload.expectedOrders}訂單, ${workload.expectedPicks}揀貨, ${workload.expectedPacks}包裝
  高峰時段: ${workload.peakHours.join(', ')}
  特殊需求: ${workload.specialRequirements.join(', ') || '無'}
`).join('')}

約束條件：
- 最低覆蓋率: ${scheduleData.constraints.minCoverage * 100}%
- 最大加班時數: ${scheduleData.constraints.maxOvertime}小時
- 預算限制: NT$ ${scheduleData.constraints.budgetLimit}

請提供優化的排班建議，包括：
1. 每日排班安排
2. 人力配置優化
3. 成本效益分析
4. 效率提升建議

請以 JSON 格式回應：
{
  "shifts": [
    {
      "employeeId": "E001",
      "date": "2024-01-15",
      "startTime": "08:00",
      "endTime": "17:00",
      "position": "picker",
      "workload": 0.8,
      "overtime": false
    }
  ],
  "optimization": {
    "totalCost": 45000,
    "totalHours": 120,
    "coverage": 0.9,
    "efficiency": 0.85,
    "recommendations": ["建議增加週末人力", "優化高峰時段配置"]
  }
}
      `;

      const aiResponse = await generateText(prompt, {
        systemPrompt,
        maxTokens: 2000,
        temperature: 0.3
      });

      try {
        const result = JSON.parse(aiResponse.content);
        
        // 創建優化後的班表
        const newShifts: Shift[] = result.shifts.map((shift: any, index: number) => ({
          id: `S${Date.now() + index}`,
          employeeId: shift.employeeId,
          date: shift.date,
          startTime: shift.startTime,
          endTime: shift.endTime,
          position: shift.position,
          workload: shift.workload,
          overtime: shift.overtime,
          status: 'scheduled' as const
        }));

        setShifts(prev => [...newShifts, ...prev]);
        setOptimization(result.optimization);
        
        await sendAlert('info', '排班優化完成', `已生成 ${newShifts.length} 個班次，預估效率提升 ${(result.optimization.efficiency * 100).toFixed(1)}%`);
        
      } catch (parseError) {
        console.error('AI 優化結果解析失敗:', parseError);
        
        // 備用排班規劃
        const fallbackShifts: Shift[] = employees.slice(0, 2).map((emp, index) => ({
          id: `S${Date.now() + index}`,
          employeeId: emp.id,
          date: workloads[0].date,
          startTime: '08:00',
          endTime: '17:00',
          position: emp.position,
          workload: 0.8,
          overtime: false,
          status: 'scheduled' as const
        }));
        
        setShifts(prev => [...fallbackShifts, ...prev]);
        setOptimization({
          totalCost: 36000,
          totalHours: 80,
          coverage: 0.85,
          efficiency: 0.8,
          recommendations: ['建議優化人力配置']
        });
      }
      
    } catch (error) {
      console.error('排班優化失敗:', error);
      await sendAlert('warning', '排班優化失敗', '無法完成排班優化，請手動調整');
    } finally {
      setOptimizing(false);
      setIdle();
    }
  };

  const confirmShift = async (shiftId: string) => {
    setShifts(prev => prev.map(shift => 
      shift.id === shiftId ? { ...shift, status: 'confirmed' } : shift
    ));
    
    await sendAlert('info', '班次確認', `班次 ${shiftId} 已確認`);
  };

  const completeShift = async (shiftId: string) => {
    setShifts(prev => prev.map(shift => 
      shift.id === shiftId ? { ...shift, status: 'completed' } : shift
    ));
    
    await sendAlert('success', '班次完成', `班次 ${shiftId} 已完成`);
  };

  const generateScheduleReport = async () => {
    const scheduledShifts = shifts.filter(s => s.status === 'scheduled');
    const confirmedShifts = shifts.filter(s => s.status === 'confirmed');
    const completedShifts = shifts.filter(s => s.status === 'completed');
    
    const reportContent = `
# 倉儲排班報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 排班總覽
- 總員工數：${stats.totalEmployees}
- 已排班次：${stats.scheduledShifts}
- 平均效率：${stats.avgEfficiency}%
- 總成本：NT$ ${stats.totalCost.toLocaleString()}

## 員工資訊
${employees.map(emp => `
### ${emp.name}
- 職位：${emp.position === 'picker' ? '揀貨員' :
         emp.position === 'packer' ? '包裝員' :
         emp.position === 'supervisor' ? '主管' : '司機'}
- 技能等級：${emp.skillLevel === 'junior' ? '初級' :
             emp.skillLevel === 'senior' ? '中級' : '高級'}
- 時薪：NT$ ${emp.hourlyRate}
- 本週工時：${emp.currentHours}小時
- 加班時數：${emp.overtimeHours}小時
- 最大工時：${emp.maxHoursPerWeek}小時/週
`).join('\n')}

## 工作量預測
${workloads.map(workload => `
### ${workload.date}
- 預期訂單：${workload.expectedOrders}
- 預期揀貨：${workload.expectedPicks}
- 預期包裝：${workload.expectedPacks}
- 高峰時段：${workload.peakHours.join(', ')}
- 特殊需求：${workload.specialRequirements.join(', ') || '無'}
`).join('\n')}

## 班次安排
${shifts.length === 0 ? '暫無班次安排' : shifts.map(shift => `
### 班次 ${shift.id}
- 員工：${employees.find(e => e.id === shift.employeeId)?.name}
- 日期：${shift.date}
- 時間：${shift.startTime} - ${shift.endTime}
- 職位：${shift.position === 'picker' ? '揀貨員' :
         shift.position === 'packer' ? '包裝員' :
         shift.position === 'supervisor' ? '主管' : '司機'}
- 工作量：${(shift.workload * 100).toFixed(0)}%
- 加班：${shift.overtime ? '是' : '否'}
- 狀態：${shift.status === 'scheduled' ? '📋 已排班' :
         shift.status === 'confirmed' ? '✅ 已確認' :
         shift.status === 'completed' ? '🎯 已完成' : '❌ 已取消'}
`).join('\n')}

## 優化分析
${optimization ? `
- 總成本：NT$ ${optimization.totalCost.toLocaleString()}
- 總工時：${optimization.totalHours}小時
- 覆蓋率：${(optimization.coverage * 100).toFixed(1)}%
- 效率：${(optimization.efficiency * 100).toFixed(1)}%
- 建議：${optimization.recommendations.join(', ')}
` : '暫無優化數據'}

## 效率統計
- 已排班次：${scheduledShifts.length}
- 已確認班次：${confirmedShifts.length}
- 已完成班次：${completedShifts.length}
- 平均工時：${shifts.length > 0 ? (shifts.reduce((sum, s) => {
  const start = new Date(`2000-01-01T${s.startTime}`);
  const end = new Date(`2000-01-01T${s.endTime}`);
  return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}, 0) / shifts.length).toFixed(1) : '0'}小時

## 建議改進
${optimization && optimization.efficiency < 0.8 ? '💡 效率偏低，建議優化排班配置' :
  employees.some(e => e.overtimeHours > 5) ? '💡 加班時數過多，建議增加人力' :
  '✅ 排班效率良好'}
    `.trim();

    await generateReport('倉儲排班報告', reportContent, 'schedule');
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'picker': return 'bg-blue-100 text-blue-700';
      case 'packer': return 'bg-green-100 text-green-700';
      case 'supervisor': return 'bg-purple-100 text-purple-700';
      case 'driver': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-purple-100 text-purple-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 倉儲排班系統</h3>
          <p className="text-slate-600 mt-1">智能人力排班，優化倉儲營運效率</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={optimizeSchedule}
            disabled={optimizing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Calendar className="w-5 h-5" />
            {optimizing ? '優化中...' : '優化排班'}
          </button>
          <button
            onClick={generateScheduleReport}
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
              <p className="text-sm text-slate-600">總員工數</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalEmployees}</p>
            </div>
            <Users className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">已排班次</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.scheduledShifts}</p>
            </div>
            <Calendar className="w-10 h-10 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均效率</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.avgEfficiency}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-amber-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">總成本</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">NT$ {stats.totalCost.toLocaleString()}</p>
            </div>
            <Clock className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Optimization Results */}
      {optimization && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h4 className="text-lg font-bold text-slate-900 mb-4">優化結果</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">總成本</p>
              <p className="text-2xl font-bold text-slate-900">NT$ {optimization.totalCost.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">總工時</p>
              <p className="text-2xl font-bold text-slate-900">{optimization.totalHours}小時</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">覆蓋率</p>
              <p className="text-2xl font-bold text-slate-900">{(optimization.coverage * 100).toFixed(1)}%</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">效率</p>
              <p className="text-2xl font-bold text-slate-900">{(optimization.efficiency * 100).toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-4">
            <h5 className="font-semibold text-slate-900 mb-2">建議</h5>
            <ul className="text-sm text-slate-600 space-y-1">
              {optimization.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employees */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">員工資訊</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {employees.map((employee) => (
                <div key={employee.id} className="p-4 bg-slate-50 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-semibold text-slate-900">{employee.name}</h5>
                      <p className="text-sm text-slate-600">
                        {employee.position === 'picker' ? '揀貨員' :
                         employee.position === 'packer' ? '包裝員' :
                         employee.position === 'supervisor' ? '主管' : '司機'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded text-xs ${getPositionColor(employee.position)}`}>
                        {employee.skillLevel === 'junior' ? '初級' :
                         employee.skillLevel === 'senior' ? '中級' : '高級'}
                      </span>
                      <span className="text-xs text-slate-500">
                        NT$ {employee.hourlyRate}/時
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                    <span>本週工時: {employee.currentHours}小時</span>
                    <span>加班: {employee.overtimeHours}小時</span>
                    <span>最大工時: {employee.maxHoursPerWeek}小時</span>
                    <span>可用性: {Object.values(employee.availability).filter(a => a.available).length}/7天</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shifts */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">班次安排</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {shifts.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">暫無班次安排</h4>
                  <p className="text-slate-600">點擊「優化排班」開始規劃班次</p>
                </div>
              ) : (
                shifts.map((shift) => (
                  <div key={shift.id} className="p-4 bg-slate-50 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-semibold text-slate-900">
                          {employees.find(e => e.id === shift.employeeId)?.name}
                        </h5>
                        <p className="text-sm text-slate-600">{shift.date} {shift.startTime}-{shift.endTime}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded text-xs ${getPositionColor(shift.position)}`}>
                          {shift.position === 'picker' ? '揀貨員' :
                           shift.position === 'packer' ? '包裝員' :
                           shift.position === 'supervisor' ? '主管' : '司機'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(shift.status)}`}>
                          {shift.status === 'scheduled' ? '已排班' :
                           shift.status === 'confirmed' ? '已確認' :
                           shift.status === 'completed' ? '已完成' : '已取消'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-600">
                        <span>工作量: {(shift.workload * 100).toFixed(0)}%</span>
                        {shift.overtime && <span className="ml-2 text-orange-600">加班</span>}
                      </div>
                      <div className="flex gap-2">
                        {shift.status === 'scheduled' && (
                          <button
                            onClick={() => confirmShift(shift.id)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            確認
                          </button>
                        )}
                        {shift.status === 'confirmed' && (
                          <button
                            onClick={() => completeShift(shift.id)}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            完成
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Workload Forecast */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-4">工作量預測</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workloads.map((workload) => (
            <div key={workload.date} className="p-4 bg-slate-50 rounded-lg border">
              <h5 className="font-semibold text-slate-900 mb-2">{workload.date}</h5>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>訂單:</span>
                  <span className="font-semibold">{workload.expectedOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span>揀貨:</span>
                  <span className="font-semibold">{workload.expectedPicks}</span>
                </div>
                <div className="flex justify-between">
                  <span>包裝:</span>
                  <span className="font-semibold">{workload.expectedPacks}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500">高峰時段:</span>
                  <p className="text-xs">{workload.peakHours.join(', ')}</p>
                </div>
                {workload.specialRequirements.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500">特殊需求:</span>
                    <p className="text-xs">{workload.specialRequirements.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export class WarehouseScheduler extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <WarehouseSchedulerModule context={context} />;
  }
}
