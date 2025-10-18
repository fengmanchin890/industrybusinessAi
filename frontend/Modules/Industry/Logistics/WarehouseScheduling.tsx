import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

interface Employee {
  id: string;
  employee_code: string;
  name: string;
  position: string;
  skill_level: number;
  status: string;
  hourly_rate: number;
}

interface Schedule {
  id: string;
  employee_id: string;
  employee_name?: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  status: string;
  ai_optimized: boolean;
  ai_confidence_score: number;
}

interface OptimizationResult {
  recommended_employees: any[];
  estimated_labor_cost: string;
  optimization_confidence: number;
  suggestions: string[];
}

const WarehouseScheduling: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedShift, setSelectedShift] = useState('morning');
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadEmployees();
    loadSchedules();
    loadStats();
  }, [selectedDate]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouse_employees')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('work_schedules')
        .select(`
          *,
          warehouse_employees(name)
        `)
        .eq('schedule_date', selectedDate)
        .order('start_time');

      if (error) throw error;
      
      const formattedSchedules = (data || []).map((schedule: any) => ({
        ...schedule,
        employee_name: schedule.warehouse_employees?.name
      }));
      
      setSchedules(formattedSchedules);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('warehouse-scheduling-optimizer', {
        body: {
          action: 'get_statistics',
          data: { days: 7 }
        }
      });

      if (error) throw error;
      setStats(data?.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleOptimizeSchedule = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('warehouse-scheduling-optimizer', {
        body: {
          action: 'optimize_schedule',
          data: {
            date: selectedDate,
            shiftType: selectedShift,
            requiredStaff: 5
          }
        }
      });

      if (error) throw error;
      setOptimizationResult(data);
      console.log('✅ AI 優化結果:', data);
    } catch (error: any) {
      console.error('❌ 優化失敗:', error);
      alert('優化失敗: ' + (error.message || '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  const handlePredictWorkload = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('warehouse-scheduling-optimizer', {
        body: {
          action: 'predict_workload',
          data: {
            date: selectedDate,
            shiftType: selectedShift
          }
        }
      });

      if (error) throw error;
      console.log('✅ 工作負載預測:', data);
      alert(`預計需要 ${data.predicted_staff_needed} 名員工\n處理量: ${data.predicted_volume} 件\n信心度: ${data.confidence_level}%`);
    } catch (error: any) {
      console.error('❌ 預測失敗:', error);
      alert('預測失敗: ' + (error.message || '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (employeeId: string) => {
    try {
      const shiftTimes: any = {
        morning: { start: '08:00', end: '16:00' },
        afternoon: { start: '16:00', end: '00:00' },
        night: { start: '00:00', end: '08:00' }
      };

      const times = shiftTimes[selectedShift];

      const { error } = await supabase
        .from('work_schedules')
        .insert({
          employee_id: employeeId,
          schedule_date: selectedDate,
          start_time: times.start,
          end_time: times.end,
          status: 'scheduled',
          ai_optimized: true,
          ai_confidence_score: optimizationResult?.optimization_confidence || 85
        });

      if (error) throw error;
      
      alert('✅ 排班創建成功！');
      loadSchedules();
      setOptimizationResult(null);
    } catch (error: any) {
      console.error('Error creating schedule:', error);
      alert('創建失敗: ' + (error.message || '未知錯誤'));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      scheduled: { label: '已排班', class: 'bg-blue-100 text-blue-800' },
      confirmed: { label: '已確認', class: 'bg-green-100 text-green-800' },
      in_progress: { label: '進行中', class: 'bg-yellow-100 text-yellow-800' },
      completed: { label: '已完成', class: 'bg-gray-100 text-gray-800' },
      cancelled: { label: '已取消', class: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🏗️ AI 倉儲排班系統
        </h1>
        <p className="text-gray-600">
          使用 AI 智能優化員工排班，提升倉儲效率
        </p>
      </div>

      {/* 統計卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">總員工數</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total_employees}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">在職員工</div>
            <div className="text-2xl font-bold text-green-600">{stats.active_employees}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">本週班次</div>
            <div className="text-2xl font-bold text-blue-600">{stats.total_shifts}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">填充率</div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.fill_rate ? `${parseFloat(stats.fill_rate).toFixed(1)}%` : '0%'}
            </div>
          </div>
        </div>
      )}

      {/* 控制面板 */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">🤖 AI 排班優化</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇日期
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇班次
            </label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="morning">早班 (08:00-16:00)</option>
              <option value="afternoon">午班 (16:00-00:00)</option>
              <option value="night">夜班 (00:00-08:00)</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleOptimizeSchedule}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? '優化中...' : '🤖 AI 優化排班'}
            </button>
            <button
              onClick={handlePredictWorkload}
              disabled={loading}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition"
            >
              📊 預測工作負載
            </button>
          </div>
        </div>

        {/* AI 優化結果 */}
        {optimizationResult && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">
              ✨ AI 推薦結果 (信心度: {optimizationResult.optimization_confidence}%)
            </h3>
            
            <div className="mb-3">
              <div className="text-sm text-gray-600 mb-1">預估人力成本:</div>
              <div className="text-2xl font-bold text-green-600">
                ${optimizationResult.estimated_labor_cost}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">💡 建議:</div>
              <ul className="list-disc list-inside space-y-1">
                {optimizationResult.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-600">{suggestion}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">推薦員工:</div>
              <div className="space-y-2">
                {optimizationResult.recommended_employees.map((emp) => (
                  <div key={emp.employee_id} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div>
                      <div className="font-medium">{emp.employee_name} ({emp.employee_code})</div>
                      <div className="text-sm text-gray-600">
                        {emp.position} | 技能等級: {emp.skill_level} | 
                        適配度: {emp.suitability_score}分
                      </div>
                      {emp.matching_factors.length > 0 && (
                        <div className="text-xs text-green-600 mt-1">
                          ✓ {emp.matching_factors.join(', ')}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleCreateSchedule(emp.employee_id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                    >
                      建立排班
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 當日排班表 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          📅 {selectedDate} 排班表
        </h2>

        {schedules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            當日尚無排班記錄
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    員工
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    時間
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    狀態
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    AI優化
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {schedule.employee_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {schedule.start_time} - {schedule.end_time}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(schedule.status)}
                    </td>
                    <td className="px-4 py-3">
                      {schedule.ai_optimized ? (
                        <span className="text-green-600 text-sm">
                          ✓ AI優化 ({schedule.ai_confidence_score}%)
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">手動排班</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 員工列表 */}
      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <h2 className="text-xl font-semibold mb-4">
          👥 員工列表 ({employees.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div key={emp.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium text-gray-900">{emp.name}</div>
                  <div className="text-sm text-gray-600">{emp.employee_code}</div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                  {emp.status}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <div>職位: {emp.position}</div>
                <div>技能等級: {'⭐'.repeat(emp.skill_level)}</div>
                <div>時薪: ${emp.hourly_rate}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WarehouseScheduling;


