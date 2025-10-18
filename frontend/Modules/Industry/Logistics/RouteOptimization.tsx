import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

interface Vehicle {
  id: string;
  vehicle_code: string;
  vehicle_type: string;
  license_plate: string;
  capacity_kg: number;
  status: string;
}

interface Location {
  id: string;
  location_code: string;
  location_name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface Task {
  id: string;
  task_code: string;
  location_id: string;
  priority: string;
  cargo_weight_kg: number;
  status: string;
  delivery_locations?: Location;
}

interface Route {
  id: string;
  route_code: string;
  route_name: string;
  total_distance_km: number;
  estimated_duration_minutes: number;
  total_stops: number;
  optimization_score: number;
  status: string;
}

interface OptimizationResult {
  route_code: string;
  optimized_sequence: any[];
  total_distance_km: number;
  estimated_duration_hours: number;
  optimization_score: number;
  estimated_fuel_cost: number;
  recommendations: string[];
}

const RouteOptimization: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedStartLocation, setSelectedStartLocation] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadVehicles();
    loadLocations();
    loadTasks();
    loadRoutes();
    loadStats();
  }, []);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'available')
        .order('vehicle_code');

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_locations')
        .select('*')
        .order('location_name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_tasks')
        .select(`
          *,
          delivery_locations(*)
        `)
        .eq('status', 'pending')
        .order('priority');

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('optimized_routes')
        .select('*')
        .gte('route_date', selectedDate)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
      console.error('Error loading routes:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('route-optimizer', {
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

  const handleOptimizeRoute = async () => {
    if (!selectedVehicle || !selectedStartLocation || selectedTasks.length === 0) {
      alert('請選擇車輛、起點和至少一個配送任務');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('route-optimizer', {
        body: {
          action: 'optimize_route',
          data: {
            taskIds: selectedTasks,
            vehicleId: selectedVehicle,
            startLocationId: selectedStartLocation,
            date: selectedDate
          }
        }
      });

      if (error) throw error;
      
      setOptimizationResult(data);
      console.log('✅ AI 路線優化:', data);
      
      // 重新載入路線列表
      loadRoutes();
      
      alert(`✅ 路線優化完成！\n總距離: ${data.total_distance_km}km\n預計時間: ${data.estimated_duration_hours}小時\n優化分數: ${data.optimization_score}分`);
    } catch (error: any) {
      console.error('❌ 優化失敗:', error);
      alert('優化失敗: ' + (error.message || '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config: any = {
      urgent: { label: '緊急', class: 'bg-red-100 text-red-800' },
      high: { label: '高', class: 'bg-orange-100 text-orange-800' },
      normal: { label: '普通', class: 'bg-blue-100 text-blue-800' },
      low: { label: '低', class: 'bg-gray-100 text-gray-800' }
    };

    const cfg = config[priority] || config.normal;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.class}`}>
        {cfg.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const config: any = {
      planned: { label: '已規劃', class: 'bg-blue-100 text-blue-800' },
      active: { label: '進行中', class: 'bg-green-100 text-green-800' },
      completed: { label: '已完成', class: 'bg-gray-100 text-gray-800' },
      cancelled: { label: '已取消', class: 'bg-red-100 text-red-800' }
    };

    const cfg = config[status] || config.planned;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.class}`}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🗺️ AI 路線優化系統
        </h1>
        <p className="text-gray-600">
          使用 AI 智能優化配送路線，降低成本提升效率
        </p>
      </div>

      {/* 統計卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">總路線數</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total_routes || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">進行中</div>
            <div className="text-2xl font-bold text-green-600">{stats.active_routes || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">總里程</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.total_distance ? `${parseFloat(stats.total_distance).toFixed(0)}km` : '0km'}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">平均效率</div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.avg_efficiency ? `${parseFloat(stats.avg_efficiency).toFixed(0)}分` : '0分'}
            </div>
          </div>
        </div>
      )}

      {/* AI 優化面板 */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">🤖 AI 路線優化</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇車輛 *
            </label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- 請選擇車輛 --</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.vehicle_code} - {vehicle.license_plate} ({vehicle.vehicle_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              起點位置 *
            </label>
            <select
              value={selectedStartLocation}
              onChange={(e) => setSelectedStartLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- 請選擇起點 --</option>
              {locations.filter(l => l.location_type === 'warehouse').map((location) => (
                <option key={location.id} value={location.id}>
                  {location.location_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              配送日期
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            選擇配送任務 * (已選擇 {selectedTasks.length} 個)
          </label>
          <div className="border border-gray-300 rounded-md p-4 max-h-64 overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                沒有待配送的任務
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                      selectedTasks.includes(task.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => handleTaskToggle(task.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{task.task_code}</div>
                        <div className="text-sm text-gray-600">
                          {task.delivery_locations?.location_name} - {task.delivery_locations?.address}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          重量: {task.cargo_weight_kg}kg
                        </div>
                      </div>
                      <div className="ml-4">
                        {getPriorityBadge(task.priority)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleOptimizeRoute}
          disabled={loading || !selectedVehicle || !selectedStartLocation || selectedTasks.length === 0}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
        >
          {loading ? '優化中...' : '🤖 開始 AI 路線優化'}
        </button>

        {/* 優化結果 */}
        {optimizationResult && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-3">
              ✨ 優化結果 (分數: {optimizationResult.optimization_score}分)
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600">總距離</div>
                <div className="text-lg font-bold text-gray-900">
                  {optimizationResult.total_distance_km}km
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">預計時間</div>
                <div className="text-lg font-bold text-gray-900">
                  {optimizationResult.estimated_duration_hours}小時
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">停靠站數</div>
                <div className="text-lg font-bold text-gray-900">
                  {optimizationResult.optimized_sequence.length}站
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">預估油費</div>
                <div className="text-lg font-bold text-green-600">
                  ${optimizationResult.estimated_fuel_cost}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">💡 建議:</div>
              <ul className="list-disc list-inside space-y-1">
                {optimizationResult.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-600">{rec}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">📍 優化後路線順序:</div>
              <div className="space-y-2">
                {optimizationResult.optimized_sequence.map((stop, index) => (
                  <div key={index} className="flex items-start bg-white p-3 rounded border">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                      {stop.order}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{stop.location_name}</div>
                      <div className="text-sm text-gray-600">{stop.address}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        距離: {stop.distance_from_previous}km | 
                        ETA: {new Date(stop.eta).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })} |
                        停留: {stop.service_time_minutes}分
                      </div>
                    </div>
                    {stop.priority && (
                      <div className="ml-2">
                        {getPriorityBadge(stop.priority)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 路線列表 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          📋 最近路線 ({routes.length})
        </h2>

        {routes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            尚無路線記錄
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    路線代碼
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    距離
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    站數
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    優化分數
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    狀態
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {routes.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{route.route_code}</div>
                      <div className="text-sm text-gray-500">{route.route_name}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {route.total_distance_km}km
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {route.total_stops}站
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {route.optimization_score}分
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(route.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteOptimization;


