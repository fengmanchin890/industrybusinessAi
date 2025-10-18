/**
 * AI 護理排班 - 智能護理人員排班系統
 * 優化人力配置並確保服務品質
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, Clock, AlertCircle, CheckCircle, 
  UserPlus, RefreshCw, Download, Filter, TrendingUp,
  Activity, Award, Stethoscope
} from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';

const metadata: ModuleMetadata = {
  id: 'nursing-schedule',
  name: 'AI 護理排班',
  version: '2.0.0',
  category: 'healthcare',
  industry: ['healthcare'],
  description: 'AI 智能護理排班系統 - 優化人力配置、預測工作量、自動分配班次',
  icon: 'Users',
  author: 'AI Business Platform',
  pricingTier: 'pro',
  features: [
    'AI 智能排班',
    '工作量預測',
    '護士推薦',
    '衝突檢測',
    '自動分配',
    '數據統計'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface Nurse {
  id: string;
  employee_id: string;
  name: string;
  department: string;
  position: string;
  level: string;
  specialties: string[];
  years_of_experience: number;
  performance_rating: number;
  status: string;
  preferred_shifts?: string[];
}

interface Ward {
  id: string;
  ward_code: string;
  ward_name: string;
  department: string;
  bed_count: number;
  required_nurse_ratio: number;
  acuity_level: string;
}

interface WorkSchedule {
  id: string;
  nurse_id: string;
  nurse_name?: string;
  ward_id: string;
  ward_name?: string;
  schedule_date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  patient_count?: number;
  workload_score?: number;
  status: string;
}

interface WorkloadPrediction {
  ward_id: string;
  ward_name?: string;
  prediction_date: string;
  shift_type: string;
  predicted_patient_count: number;
  predicted_acuity_score: number;
  recommended_nurse_count: number;
  confidence_score: number;
}

interface ScheduleStats {
  total_nurses: number;
  active_nurses: number;
  total_wards: number;
  today_shifts: number;
  pending_requests: number;
  average_workload: number;
  schedule_fill_rate: number;
}

export function NursingScheduleModule({ context }: { context: ModuleContext }) {
  const { state, setRunning, setIdle } = useModuleState();
  const { generateReport } = useReportGeneration(context);

  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [predictions, setPredictions] = useState<WorkloadPrediction[]>([]);
  const [stats, setStats] = useState<ScheduleStats | null>(null);
  
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShiftType, setSelectedShiftType] = useState<string>('day');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 獲取當前用戶的 company_id
  const getCompanyId = async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      return userData?.company_id || null;
    } catch (error) {
      console.error('Error getting company_id:', error);
      return null;
    }
  };

  useEffect(() => {
    setRunning();
    loadAllData();
    return () => setIdle();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadNurses(),
        loadWards(),
        loadSchedules(),
        loadPredictions(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 載入護理人員
  const loadNurses = async () => {
    try {
      const companyId = await getCompanyId();
      if (!companyId) return;

      const { data, error } = await supabase
        .from('nursing_staff')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'available')
        .order('name');

      if (error) throw error;
      
      // 映射数据库字段到前端接口
      const mappedNurses: Nurse[] = (data || []).map(s => ({
        id: s.id,
        employee_id: s.staff_code || s.id,
        name: s.name,
        department: s.position || 'General',
        position: s.position,
        level: s.position?.includes('資深') ? 'Senior' : 'Regular',
        specialties: s.skills || [],
        years_of_experience: s.years_experience || 0,
        performance_rating: 4.5,
        status: s.status || 'available',
        preferred_shifts: s.preferences || []
      }));
      
      setNurses(mappedNurses);
    } catch (error) {
      console.error('Error loading nurses:', error);
    }
  };

  // 載入病房（从班次中提取唯一的部门作为病房）
  const loadWards = async () => {
    try {
      const companyId = await getCompanyId();
      if (!companyId) return;

      const { data, error } = await supabase
        .from('nursing_shifts')
        .select('department')
        .eq('company_id', companyId);

      if (error) throw error;
      
      // 提取唯一部门并转换为病房格式
      const uniqueDepts = [...new Set((data || []).map((s: any) => s.department))];
      const mappedWards: Ward[] = uniqueDepts.map((dept, index) => ({
        id: `ward-${index}`,
        ward_code: dept.substring(0, 3).toUpperCase(),
        ward_name: dept,
        department: dept,
        bed_count: 30,
        required_nurse_ratio: 5,
        acuity_level: dept.includes('ICU') || dept.includes('急診') ? 'critical' : 'medium'
      }));
      
      setWards(mappedWards);
    } catch (error) {
      console.error('Error loading wards:', error);
    }
  };

  // 載入排班
  const loadSchedules = async () => {
    try {
      const companyId = await getCompanyId();
      if (!companyId) return;

      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 7);

      const { data: shiftsData, error: shiftsError } = await supabase
        .from('nursing_shifts')
        .select('*')
        .eq('company_id', companyId)
        .gte('shift_date', startDate.toISOString().split('T')[0])
        .lte('shift_date', endDate.toISOString().split('T')[0])
        .order('shift_date');

      if (shiftsError) throw shiftsError;

      // 获取每个班次的分配信息
      const mappedSchedules: WorkSchedule[] = [];
      
      for (const shift of shiftsData || []) {
        const { data: assignments } = await supabase
          .from('shift_assignments')
          .select(`
            *,
            nursing_staff!inner(name)
          `)
          .eq('shift_id', shift.id);

        if (assignments && assignments.length > 0) {
          for (const assignment of assignments) {
            mappedSchedules.push({
              id: assignment.id,
              nurse_id: assignment.staff_id,
              nurse_name: assignment.nursing_staff?.name,
              ward_id: shift.department,
              ward_name: shift.department,
              schedule_date: shift.shift_date,
              shift_type: shift.shift_time.includes('08:00') ? 'day' : 
                          shift.shift_time.includes('16:00') ? 'evening' : 'night',
              start_time: shift.shift_date + 'T' + shift.start_time,
              end_time: shift.shift_date + 'T' + shift.end_time,
              patient_count: undefined,
              workload_score: shift.duration_hours * 10,
              status: shift.status
            });
          }
        } else {
          // 未分配的班次也显示
          mappedSchedules.push({
            id: shift.id,
            nurse_id: '',
            nurse_name: '待分配',
            ward_id: shift.department,
            ward_name: shift.department,
            schedule_date: shift.shift_date,
            shift_type: shift.shift_time.includes('08:00') ? 'day' : 
                        shift.shift_time.includes('16:00') ? 'evening' : 'night',
            start_time: shift.shift_date + 'T' + shift.start_time,
            end_time: shift.shift_date + 'T' + shift.end_time,
            patient_count: undefined,
            workload_score: undefined,
            status: 'pending'
          });
        }
      }

      setSchedules(mappedSchedules);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  // 載入工作量預測（暂时使用模拟数据，因为表不存在）
  const loadPredictions = async () => {
    try {
      // 暂时返回空数组，未来可以添加预测表
      setPredictions([]);
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
  };

  // 載入統計數據
  const loadStats = async () => {
    try {
      const companyId = await getCompanyId();
      if (!companyId) return;

      // 直接从数据库计算统计数据
      const { data: staffData } = await supabase
        .from('nursing_staff')
        .select('*')
        .eq('company_id', companyId);

      const { data: shiftsData } = await supabase
        .from('nursing_shifts')
        .select('*')
        .eq('company_id', companyId)
        .eq('shift_date', selectedDate);

      const totalNurses = staffData?.length || 0;
      const activeNurses = staffData?.filter(s => s.status === 'available').length || 0;
      const todayShifts = shiftsData?.length || 0;
      const scheduledShifts = shiftsData?.filter(s => s.status === 'scheduled').length || 0;
    
    setStats({
        total_nurses: totalNurses,
        active_nurses: activeNurses,
        total_wards: wards.length,
        today_shifts: todayShifts,
        pending_requests: todayShifts - scheduledShifts,
        average_workload: todayShifts > 0 ? (scheduledShifts / todayShifts) * 100 : 0,
        schedule_fill_rate: todayShifts > 0 ? (scheduledShifts / todayShifts) * 100 : 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // AI 智能排班優化（完整版：调用 Edge Function AI）
  const optimizeSchedule = async () => {
    setIsOptimizing(true);
    try {
      const companyId = await getCompanyId();
      if (!companyId) {
        alert('無法獲取公司資訊');
        return;
      }

      // 计算排班周期（未来7天）
      const startDate = new Date(selectedDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      // 调用完整 AI Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('請先登入');
        return;
      }

      console.log('🤖 調用 AI 排班優化...', {
        companyId,
        periodStart: startDate.toISOString().split('T')[0],
        periodEnd: endDate.toISOString().split('T')[0]
      });

      const response = await fetch(
        `${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/nursing-schedule-ai`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'optimize_schedule',
            data: {
              companyId: companyId,
              periodStart: startDate.toISOString().split('T')[0],
              periodEnd: endDate.toISOString().split('T')[0],
              wardFilter: selectedWard !== 'all' ? selectedWard : null
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 錯誤: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ AI 優化結果（完整）:', result);

      // 检查响应数据结构
      if (!result || typeof result !== 'object') {
        throw new Error('API 返回的數據格式錯誤');
      }

      // 兼容两种响应格式：{ data: {...} } 或 直接返回 {...}
      const optimizationResult = result.data || result;
      console.log('📊 優化結果數據:', optimizationResult);

      // 防御性检查
      if (!optimizationResult) {
        throw new Error('未收到優化結果數據');
      }
      
      let message = `🤖 AI 智能排班優化完成！\n\n`;
      
      // 安全访问属性
      const scheduledCount = optimizationResult.scheduled_count ?? optimizationResult.scheduledCount ?? 0;
      message += `✅ 成功排班: ${scheduledCount} 個班次\n`;
      
      const conflicts = optimizationResult.conflicts || [];
      if (conflicts.length > 0) {
        message += `⚠️ 發現衝突: ${conflicts.length} 個\n`;
      }
      
      const suggestions = optimizationResult.suggestions || [];
      if (suggestions.length > 0) {
        message += `\n💡 AI 建議:\n`;
        suggestions.slice(0, 3).forEach((suggestion: any) => {
          message += `  • ${suggestion.suggestion || suggestion.message || '建議'}\n`;
        });
      }
      
      if (optimizationResult.metrics) {
        message += `\n📊 優化指標:\n`;
        const coverageRate = optimizationResult.metrics.coverage_rate ?? optimizationResult.metrics.coverageRate ?? 0;
        const satisfactionScore = optimizationResult.metrics.satisfaction_score ?? optimizationResult.metrics.satisfactionScore ?? 0;
        message += `  • 覆蓋率: ${(coverageRate * 100).toFixed(1)}%\n`;
        message += `  • 滿意度: ${(satisfactionScore * 100).toFixed(1)}%\n`;
      }

      alert(message);

      // 重新加载数据
      await loadSchedules();
      await loadStats();
    } catch (error: any) {
      console.error('Error optimizing schedule:', error);
      alert(`❌ AI 優化失敗\n\n${error.message || '請稍後再試'}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  // 預測工作量（完整 AI 版）
  const predictWorkload = async () => {
    try {
      setRunning();
      const companyId = await getCompanyId();
      if (!companyId) {
        alert('無法獲取公司資訊');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('請先登入');
        return;
      }

      // 计算预测周期（未来7天）
      const startDate = new Date(selectedDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      console.log('📊 調用 AI 工作量預測...', {
        companyId,
        wardId: selectedWard !== 'all' ? selectedWard : null,
        periodStart: startDate.toISOString().split('T')[0],
        periodEnd: endDate.toISOString().split('T')[0]
      });

      const response = await fetch(
        `${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/nursing-schedule-ai`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'predict_workload',
            data: {
              companyId: companyId,
              wardId: selectedWard !== 'all' ? selectedWard : null,
              periodStart: startDate.toISOString().split('T')[0],
              periodEnd: endDate.toISOString().split('T')[0]
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 錯誤: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ AI 預測結果（完整）:', result);

      // 检查响应数据结构
      if (!result || typeof result !== 'object') {
        throw new Error('API 返回的數據格式錯誤');
      }

      // 兼容两种响应格式
      const predictions = result.data || result.predictions || result;
      console.log('📊 預測數據:', predictions);
      
      let message = `📊 AI 工作量預測完成！\n\n`;
      
      if (Array.isArray(predictions) && predictions.length > 0) {
        message += `預測期間: ${predictions.length} 天\n\n`;
        
        predictions.slice(0, 5).forEach((pred: any) => {
          const date = pred.prediction_date || pred.date || '未知';
          const patientCount = pred.predicted_patient_count ?? pred.patientCount ?? 0;
          const staffCount = pred.required_staff_count ?? pred.staffCount ?? 0;
          const workload = pred.estimated_workload ?? pred.workload ?? 0;
          
          message += `📅 ${date}\n`;
          message += `  患者數: ${patientCount}\n`;
          message += `  所需人力: ${staffCount} 人\n`;
          message += `  工作量: ${typeof workload === 'number' ? workload.toFixed(1) : workload}\n\n`;
        });
      } else {
        message += '暫無預測數據';
      }

      alert(message);
      
      // 重新加载预测数据
      await loadPredictions();
    } catch (error: any) {
      console.error('Error predicting workload:', error);
      alert(`❌ 工作量預測失敗\n\n${error.message || '請稍後再試'}`);
    } finally {
      setIdle();
    }
  };

  // 生成報告
  const handleGenerateReport = () => {
    const reportContent = `
# AI 護理排班系統報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 統計摘要
- 護理人員總數: ${stats?.total_nurses || 0}人
- 在職護士: ${stats?.active_nurses || 0}人
- 病房數量: ${stats?.total_wards || 0}個
- 今日排班: ${stats?.today_shifts || 0}班次
- 排班覆蓋率: ${stats?.schedule_fill_rate?.toFixed(1) || 0}%
- 平均工作量: ${stats?.average_workload?.toFixed(1) || 0}
- 待處理請求: ${stats?.pending_requests || 0}條

## 護理人員列表
${nurses.map(n => `- ${n.name} (${n.position}) - ${n.years_of_experience}年經驗 - 績效: ${n.performance_rating.toFixed(1)}`).join('\n')}

## 今日排班
${schedules.filter(s => s.schedule_date === selectedDate).map(s => 
  `- ${s.nurse_name} @ ${s.ward_name} (${s.shift_type}) - ${s.status}`
).join('\n')}
    `.trim();

    generateReport('AI 護理排班報告', reportContent, 'healthcare');
  };

  // 取得班次顏色
  const getShiftColor = (shiftType: string) => {
    switch (shiftType) {
      case 'day': return 'bg-blue-100 text-blue-800';
      case 'evening': return 'bg-purple-100 text-purple-800';
      case 'night': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 取得狀態顏色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600';
      case 'in_progress': return 'text-green-600';
      case 'completed': return 'text-gray-600';
      default: return 'text-yellow-600';
    }
  };

  // 取得護理強度顏色
  const getAcuityColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 篩選今日排班
  const todaySchedules = schedules.filter(s => s.schedule_date === selectedDate);
  const filteredSchedules = selectedWard === 'all' 
    ? todaySchedules 
    : todaySchedules.filter(s => s.ward_id === selectedWard);

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">AI 護理排班系統</h2>
          <p className="text-slate-600 mt-1">智能排班優化 • 工作量預測 • 人力配置</p>
        </div>
        <div className="flex gap-3">
           <button
             onClick={predictWorkload}
             className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
           >
             <TrendingUp className="w-5 h-5" />
             預測工作量
           </button>
          <button
            onClick={optimizeSchedule}
            disabled={isOptimizing}
             className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                優化中...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                AI 智能優化
              </>
            )}
          </button>
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            生成報告
          </button>
        </div>
      </div>

      {/* 統計卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            <div>
                <p className="text-sm text-slate-600">在職護士</p>
                <p className="text-2xl font-bold text-slate-900">{stats.active_nurses}</p>
                <p className="text-xs text-slate-500">共 {stats.total_nurses} 人</p>
            </div>
          </div>
        </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            <div>
                <p className="text-sm text-slate-600">今日排班</p>
                <p className="text-2xl font-bold text-slate-900">{stats.today_shifts}</p>
                <p className="text-xs text-slate-500">班次</p>
            </div>
          </div>
        </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            <div>
              <p className="text-sm text-slate-600">平均工作量</p>
                <p className="text-2xl font-bold text-slate-900">{stats.average_workload.toFixed(1)}</p>
                <p className="text-xs text-slate-500">評分</p>
            </div>
          </div>
        </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-amber-600" />
              </div>
            <div>
                <p className="text-sm text-slate-600">排班覆蓋率</p>
                <p className="text-2xl font-bold text-slate-900">{stats.schedule_fill_rate.toFixed(1)}%</p>
                <p className="text-xs text-slate-500">目標 ≥95%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 篩選器 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              病房
            </label>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部病房</option>
              {wards.map(ward => (
                <option key={ward.id} value={ward.id}>
                  {ward.ward_name} ({ward.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              日期
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>

            <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              班次類型
            </label>
            <select
              value={selectedShiftType}
              onChange={(e) => setSelectedShiftType(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="day">白班 (Day)</option>
              <option value="evening">小夜班 (Evening)</option>
              <option value="night">大夜班 (Night)</option>
            </select>
            </div>

          <div className="flex items-end">
            <button
              onClick={loadSchedules}
              className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <Filter className="w-5 h-5" />
              應用篩選
            </button>
          </div>
        </div>
      </div>

      {/* 今日排班列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">
            今日排班 ({filteredSchedules.length})
          </h3>
          <button
            onClick={loadSchedules}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
            </button>
          </div>

        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-slate-600">載入中...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">尚無排班記錄</p>
            <p className="text-sm text-slate-500">使用 AI 智能優化建立排班計劃</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSchedules.map(schedule => (
              <div
                key={schedule.id}
                className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                  </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-slate-900">{schedule.nurse_name}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getShiftColor(schedule.shift_type)}`}>
                          {schedule.shift_type === 'day' ? '白班' : schedule.shift_type === 'evening' ? '小夜班' : '大夜班'}
                        </span>
                        <span className={`text-sm font-medium ${getStatusColor(schedule.status)}`}>
                          {schedule.status === 'scheduled' ? '已排班' : 
                           schedule.status === 'in_progress' ? '進行中' : 
                           schedule.status === 'completed' ? '已完成' : '待確認'}
                  </span>
                </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Stethoscope className="w-4 h-4" />
                          {schedule.ward_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(schedule.start_time).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })} 
                          {' - '}
                          {new Date(schedule.end_time).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {schedule.patient_count && (
                          <span>患者數: {schedule.patient_count}</span>
                        )}
                        {schedule.workload_score && (
                          <span className="flex items-center gap-1">
                            <Activity className="w-4 h-4" />
                            工作量: {schedule.workload_score.toFixed(1)}
                        </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                      ))}
                    </div>
        )}
                  </div>

      {/* 病房列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 病房資訊 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">病房資訊</h3>
          <div className="space-y-3">
            {wards.map(ward => (
              <div key={ward.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-900">{ward.ward_name}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAcuityColor(ward.acuity_level)}`}>
                    {ward.acuity_level === 'critical' ? '重症' :
                     ward.acuity_level === 'high' ? '高' :
                     ward.acuity_level === 'medium' ? '中' : '低'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm text-slate-600">
                  <div>
                    <span className="text-slate-500">部門:</span> {ward.department}
                  </div>
                  <div>
                    <span className="text-slate-500">床位:</span> {ward.bed_count}
                  </div>
                  <div>
                    <span className="text-slate-500">護患比:</span> 1:{ward.required_nurse_ratio}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 工作量預測 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">工作量預測</h3>
          {predictions.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">尚無預測數據</p>
              <p className="text-sm text-slate-500">選擇病房後點擊「預測工作量」</p>
            </div>
          ) : (
          <div className="space-y-3">
              {predictions.slice(0, 5).map((pred, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                  <div>
                      <h4 className="font-semibold text-slate-900">{pred.ward_name}</h4>
                      <p className="text-sm text-slate-600">
                        {new Date(pred.prediction_date).toLocaleDateString('zh-TW')} - 
                        {pred.shift_type === 'day' ? '白班' : pred.shift_type === 'evening' ? '小夜班' : '大夜班'}
                      </p>
                  </div>
                    <span className="text-sm font-medium text-blue-600">
                      信心度: {Math.round(pred.confidence_score)}%
                  </span>
                </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center bg-slate-50 rounded p-2">
                      <p className="text-slate-500 text-xs">預測患者</p>
                      <p className="font-semibold text-slate-900">{pred.predicted_patient_count}人</p>
                    </div>
                    <div className="text-center bg-slate-50 rounded p-2">
                      <p className="text-slate-500 text-xs">護理強度</p>
                      <p className="font-semibold text-slate-900">{pred.predicted_acuity_score.toFixed(1)}</p>
                    </div>
                    <div className="text-center bg-slate-50 rounded p-2">
                      <p className="text-slate-500 text-xs">推薦護士</p>
                      <p className="font-semibold text-slate-900">{pred.recommended_nurse_count}人</p>
                    </div>
                  </div>
                </div>
                      ))}
                    </div>
          )}
        </div>
      </div>

      {/* 護理人員列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">護理人員 ({nurses.length})</h3>
                  </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nurses.map(nurse => (
            <div key={nurse.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                  <div>
                  <h4 className="font-semibold text-slate-900">{nurse.name}</h4>
                  <p className="text-sm text-slate-600">{nurse.position} • {nurse.level}</p>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  <Award className="w-4 h-4" />
                  <span className="text-sm font-medium">{nurse.performance_rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Stethoscope className="w-4 h-4" />
                  <span>{nurse.department}</span>
                </div>
                <div className="text-slate-600">
                  <span className="text-slate-500">經驗:</span> {nurse.years_of_experience} 年
                </div>
                {nurse.specialties && nurse.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {nurse.specialties.slice(0, 3).map((specialty, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {specialty}
                          </span>
                        ))}
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

export class NursingSchedule extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <NursingScheduleModule context={context} />;
  }
}
