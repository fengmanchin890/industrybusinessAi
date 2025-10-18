import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'healthy', service: 'route-optimizer', version: '1.0.0' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) throw new Error('Unauthorized')

    const { data: userData } = await supabase.from('users').select('company_id').eq('id', user.id).single()
    if (!userData?.company_id) throw new Error('User has no company')

    const { action, data } = await req.json()
    let result

    switch (action) {
      case 'optimize_route':
        result = await optimizeRoute(supabase, userData.company_id, data)
        break
      case 'calculate_distance':
        result = await calculateDistance(data)
        break
      case 'suggest_vehicle':
        result = await suggestVehicle(supabase, userData.company_id, data)
        break
      case 'get_statistics':
        result = await getStatistics(supabase, userData.company_id, data)
        break
      case 'estimate_time':
        result = await estimateTime(supabase, data)
        break
      default:
        throw new Error('Invalid action')
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// 計算兩點間距離（Haversine 公式）
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // 地球半徑 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// AI 路線優化（最近鄰居算法 + 啟發式優化）
async function optimizeRoute(supabase: any, companyId: string, data: any) {
  const { taskIds, vehicleId, startLocationId, date } = data
  
  console.log('Optimizing route for:', { taskIds, vehicleId, date })
  
  // 獲取起點位置
  const { data: startLoc } = await supabase
    .from('delivery_locations')
    .select('*')
    .eq('id', startLocationId)
    .single()
  
  if (!startLoc) throw new Error('Start location not found')
  
  // 獲取所有任務和對應的位置
  const { data: tasks, error: tasksError } = await supabase
    .from('delivery_tasks')
    .select(`
      *,
      delivery_locations(*)
    `)
    .in('id', taskIds)
    .eq('company_id', companyId)
  
  if (tasksError) throw tasksError
  if (!tasks || tasks.length === 0) throw new Error('No tasks found')
  
  // 最近鄰居算法優化路線
  const unvisited = [...tasks]
  const optimizedSequence = []
  let currentLat = startLoc.latitude
  let currentLng = startLoc.longitude
  let totalDistance = 0
  let currentTime = new Date()
  currentTime.setHours(8, 0, 0, 0) // 從早上 8:00 開始
  
  while (unvisited.length > 0) {
    // 找最近的未訪問位置
    let nearestIndex = 0
    let minDistance = Infinity
    
    for (let i = 0; i < unvisited.length; i++) {
      const task = unvisited[i]
      const loc = task.delivery_locations
      const distance = haversineDistance(
        currentLat, currentLng,
        parseFloat(loc.latitude), parseFloat(loc.longitude)
      )
      
      // 考慮優先級
      const priorityMultiplier = task.priority === 'urgent' ? 0.5 : 
                                  task.priority === 'high' ? 0.7 : 1.0
      const adjustedDistance = distance * priorityMultiplier
      
      if (adjustedDistance < minDistance) {
        minDistance = distance
        nearestIndex = i
      }
    }
    
    const selectedTask = unvisited.splice(nearestIndex, 1)[0]
    const loc = selectedTask.delivery_locations
    
    const distance = haversineDistance(
      currentLat, currentLng,
      parseFloat(loc.latitude), parseFloat(loc.longitude)
    )
    
    totalDistance += distance
    
    // 計算 ETA（假設平均速度 40 km/h）
    const travelTimeMinutes = Math.ceil((distance / 40) * 60)
    currentTime = new Date(currentTime.getTime() + travelTimeMinutes * 60000)
    
    // 加上服務時間
    const serviceTime = loc.service_time_minutes || 10
    const departureTime = new Date(currentTime.getTime() + serviceTime * 60000)
    
    optimizedSequence.push({
      task_id: selectedTask.id,
      location_id: loc.id,
      location_name: loc.location_name,
      address: loc.address,
      order: optimizedSequence.length + 1,
      distance_from_previous: Math.round(distance * 100) / 100,
      eta: currentTime.toISOString(),
      service_time_minutes: serviceTime,
      departure_time: departureTime.toISOString(),
      priority: selectedTask.priority,
      cargo_weight: selectedTask.cargo_weight_kg
    })
    
    currentLat = parseFloat(loc.latitude)
    currentLng = parseFloat(loc.longitude)
    currentTime = departureTime
  }
  
  // 返回起點的距離
  const returnDistance = haversineDistance(
    currentLat, currentLng,
    parseFloat(startLoc.latitude), parseFloat(startLoc.longitude)
  )
  totalDistance += returnDistance
  
  // 計算優化分數（基於距離、時間和優先級滿足度）
  const avgDistancePerStop = totalDistance / optimizedSequence.length
  const baseScore = 100 - Math.min(avgDistancePerStop * 2, 50)
  const urgentFirst = optimizedSequence[0]?.priority === 'urgent' ? 10 : 0
  const optimizationScore = Math.min(100, baseScore + urgentFirst)
  
  const totalDurationMinutes = Math.ceil((currentTime.getTime() - new Date().setHours(8, 0, 0, 0)) / 60000)
  const estimatedFuelCost = (totalDistance * 0.3 * 30) // 假設 0.3L/km, 30元/L
  
  // 儲存優化路線
  const routeCode = `ROUTE-${Date.now()}`
  const { data: savedRoute, error: routeError } = await supabase
    .from('optimized_routes')
    .insert({
      company_id: companyId,
      route_code: routeCode,
      route_name: `優化路線 ${new Date().toLocaleDateString('zh-TW')}`,
      vehicle_id: vehicleId,
      route_date: date,
      start_location_id: startLocationId,
      end_location_id: startLocationId,
      total_distance_km: Math.round(totalDistance * 100) / 100,
      estimated_duration_minutes: totalDurationMinutes,
      total_stops: optimizedSequence.length,
      optimization_score: Math.round(optimizationScore * 100) / 100,
      ai_optimized: true,
      route_sequence: optimizedSequence,
      fuel_cost: Math.round(estimatedFuelCost * 100) / 100,
      status: 'planned'
    })
    .select()
    .single()
  
  if (routeError) {
    console.warn('Error saving route:', routeError)
  }
  
  return {
    route_id: savedRoute?.id,
    route_code: routeCode,
    optimized_sequence: optimizedSequence,
    total_stops: optimizedSequence.length,
    total_distance_km: Math.round(totalDistance * 100) / 100,
    estimated_duration_minutes: totalDurationMinutes,
    estimated_duration_hours: Math.round(totalDurationMinutes / 60 * 10) / 10,
    optimization_score: Math.round(optimizationScore * 100) / 100,
    estimated_fuel_cost: Math.round(estimatedFuelCost * 100) / 100,
    return_distance_km: Math.round(returnDistance * 100) / 100,
    recommendations: [
      `路線已優化，總距離: ${Math.round(totalDistance)}km`,
      `預計行駛時間: ${Math.floor(totalDurationMinutes / 60)}小時${totalDurationMinutes % 60}分鐘`,
      `優化分數: ${Math.round(optimizationScore)}分`,
      urgentFirst > 0 ? '✓ 緊急任務已優先安排' : '建議檢查優先級設定'
    ]
  }
}

// 計算距離
async function calculateDistance(data: any) {
  const { lat1, lng1, lat2, lng2 } = data
  
  const distance = haversineDistance(
    parseFloat(lat1), parseFloat(lng1),
    parseFloat(lat2), parseFloat(lng2)
  )
  
  const travelTimeMinutes = Math.ceil((distance / 40) * 60) // 假設 40 km/h
  
  return {
    distance_km: Math.round(distance * 100) / 100,
    estimated_time_minutes: travelTimeMinutes,
    estimated_time_hours: Math.round(travelTimeMinutes / 60 * 10) / 10
  }
}

// 推薦車輛
async function suggestVehicle(supabase: any, companyId: string, data: any) {
  const { totalWeight, totalVolume, taskCount } = data
  
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'available')
    .order('capacity_kg', { ascending: false })
  
  if (error) throw error
  
  const suitable = vehicles.filter((v: any) => {
    const weightOk = !totalWeight || v.capacity_kg >= totalWeight
    const volumeOk = !totalVolume || v.capacity_m3 >= totalVolume
    return weightOk && volumeOk
  })
  
  return {
    suggested_vehicles: suitable.slice(0, 3).map((v: any) => ({
      id: v.id,
      vehicle_code: v.vehicle_code,
      vehicle_type: v.vehicle_type,
      license_plate: v.license_plate,
      capacity_kg: v.capacity_kg,
      capacity_m3: v.capacity_m3,
      suitability_score: 85
    })),
    total_available: suitable.length
  }
}

// 獲取統計
async function getStatistics(supabase: any, companyId: string, data: any) {
  const days = data.days || 7
  
  try {
    const { data: stats, error } = await supabase.rpc('get_route_stats', {
      p_company_id: companyId,
      p_days: days
    })
    
    if (error) {
      console.warn('Error getting stats:', error)
      return { stats: null }
    }
    
    return {
      period_days: days,
      stats: stats && stats.length > 0 ? stats[0] : null,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.warn('Error in getStatistics:', error)
    return { stats: null }
  }
}

// 估算時間
async function estimateTime(supabase: any, data: any) {
  const { distance, stops } = data
  
  const travelTime = Math.ceil((distance / 40) * 60) // 40 km/h
  const serviceTime = stops * 10 // 每站 10 分鐘
  const totalTime = travelTime + serviceTime
  
  return {
    travel_time_minutes: travelTime,
    service_time_minutes: serviceTime,
    total_time_minutes: totalTime,
    estimated_completion: new Date(Date.now() + totalTime * 60000).toISOString()
  }
}


