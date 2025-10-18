// =====================================================
// AI 护理排班优化器 Edge Function
// =====================================================
// 用途: 智能护理人员排班、工作量预测、冲突检测

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// AI 模拟函数
function simulateAI() {
  return {
    processing: true,
    model: 'nursing-schedule-optimizer-v1',
    timestamp: new Date().toISOString()
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { action, data } = await req.json()
    console.log('🏥 Nursing Schedule Optimizer Action:', action)

    let result

    switch (action) {
      case 'optimize_schedule':
        result = await optimizeSchedule(supabase, data)
        break
      
      case 'predict_workload':
        result = await predictWorkload(supabase, data)
        break
      
      case 'suggest_nurses':
        result = await suggestNurses(supabase, data)
        break
      
      case 'check_conflicts':
        result = await checkConflicts(supabase, data)
        break
      
      case 'get_statistics':
        result = await getStatistics(supabase, data)
        break
      
      case 'auto_assign':
        result = await autoAssignShifts(supabase, data)
        break
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// =====================================================
// 1. AI 智能排班优化
// =====================================================
async function optimizeSchedule(supabase: any, data: any) {
  const { companyId, wardId, date, shiftType } = data
  console.log('🤖 Optimizing schedule for:', { wardId, date, shiftType })

  // 获取病房信息
  const { data: ward } = await supabase
    .from('nursing_wards')
    .select('*')
    .eq('id', wardId)
    .single()

  if (!ward) throw new Error('Ward not found')

  // 获取可用护士
  const { data: nurses } = await supabase
    .from('nurses')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'active')

  // 获取工作量预测
  const { data: prediction } = await supabase
    .from('nursing_workload_predictions')
    .select('*')
    .eq('ward_id', wardId)
    .eq('prediction_date', date)
    .eq('shift_type', shiftType)
    .single()

  // AI 评分和推荐
  const scoredNurses = nurses.map((nurse: any) => {
    let score = 80

    // 专长匹配
    if (nurse.specialties?.includes(ward.department)) {
      score += 10
    }

    // 职级加分
    if (nurse.level === 'N4' || nurse.level === 'N3') {
      score += 5
    }

    // 偏好班次
    if (nurse.preferred_shifts?.includes(shiftType)) {
      score += 8
    }

    // 经验加分
    score += Math.min(nurse.years_of_experience, 10)

    // 绩效加分
    score += (nurse.performance_rating || 0) * 2

    return {
      ...nurse,
      suitability_score: Math.min(Math.round(score), 100),
      recommendation_reason: generateRecommendationReason(nurse, ward, shiftType)
    }
  })

  // 排序并选择最合适的护士
  const recommendedNurses = scoredNurses
    .sort((a: any, b: any) => b.suitability_score - a.suitability_score)
    .slice(0, prediction?.recommended_nurse_count || ward.required_nurse_ratio * ward.bed_count)

  const aiMetadata = simulateAI()

  return {
    ward_name: ward.ward_name,
    date: date,
    shift_type: shiftType,
    required_nurses: prediction?.recommended_nurse_count || Math.ceil(ward.bed_count / ward.required_nurse_ratio),
    recommended_nurses: recommendedNurses,
    total_recommended: recommendedNurses.length,
    average_suitability: Math.round(
      recommendedNurses.reduce((sum: number, n: any) => sum + n.suitability_score, 0) / recommendedNurses.length
    ),
    predicted_workload: prediction?.predicted_acuity_score || 'medium',
    optimization_confidence: prediction?.confidence_score || 85,
    ai_metadata: aiMetadata
  }
}

// =====================================================
// 2. 工作量预测
// =====================================================
async function predictWorkload(supabase: any, data: any) {
  const { companyId, wardId, date, shiftType } = data
  console.log('📊 Predicting workload for:', { wardId, date, shiftType })

  // 获取病房信息
  const { data: ward } = await supabase
    .from('nursing_wards')
    .select('*')
    .eq('id', wardId)
    .single()

  // 获取历史数据
  const sevenDaysAgo = new Date(date)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: historicalSchedules } = await supabase
    .from('nursing_work_schedules')
    .select('*')
    .eq('ward_id', wardId)
    .eq('shift_type', shiftType)
    .gte('schedule_date', sevenDaysAgo.toISOString().split('T')[0])
    .lte('schedule_date', date)

  // AI 预测逻辑
  const avgPatientCount = historicalSchedules?.length 
    ? Math.round(historicalSchedules.reduce((sum: number, s: any) => sum + (s.patient_count || 0), 0) / historicalSchedules.length)
    : ward.bed_count * 0.8

  const avgWorkload = historicalSchedules?.length
    ? historicalSchedules.reduce((sum: number, s: any) => sum + (s.workload_score || 0), 0) / historicalSchedules.length
    : 50

  // 预测因素
  const dayOfWeek = new Date(date).getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  
  let acuityMultiplier = 1.0
  if (ward.acuity_level === 'critical') acuityMultiplier = 1.5
  else if (ward.acuity_level === 'high') acuityMultiplier = 1.3
  else if (ward.acuity_level === 'low') acuityMultiplier = 0.8

  let shiftMultiplier = 1.0
  if (shiftType === 'night') shiftMultiplier = 1.1
  else if (shiftType === 'evening') shiftMultiplier = 1.05

  const predictedAcuity = avgWorkload * acuityMultiplier * shiftMultiplier * (isWeekend ? 0.9 : 1.0)
  const recommendedNurses = Math.ceil((avgPatientCount * acuityMultiplier) / ward.required_nurse_ratio)

  const prediction = {
    ward_id: wardId,
    prediction_date: date,
    shift_type: shiftType,
    predicted_patient_count: Math.round(avgPatientCount),
    predicted_acuity_score: Math.round(predictedAcuity * 10) / 10,
    recommended_nurse_count: recommendedNurses,
    confidence_score: 85 + Math.random() * 10,
    factors: {
      historical_average: avgWorkload,
      acuity_level: ward.acuity_level,
      is_weekend: isWeekend,
      shift_type: shiftType,
      acuity_multiplier: acuityMultiplier
    }
  }

  // 保存预测
  await supabase
    .from('nursing_workload_predictions')
    .upsert({
      company_id: companyId,
      ...prediction
    })

  const aiMetadata = simulateAI()

  return {
    ...prediction,
    ai_metadata: aiMetadata
  }
}

// =====================================================
// 3. 推荐护士
// =====================================================
async function suggestNurses(supabase: any, data: any) {
  const { companyId, wardId, date, shiftType, requiredCount } = data
  console.log('👥 Suggesting nurses for:', { wardId, date, shiftType })

  // 获取病房
  const { data: ward } = await supabase
    .from('nursing_wards')
    .select('*')
    .eq('id', wardId)
    .single()

  // 获取可用护士（排除已排班和请假的）
  const { data: allNurses } = await supabase
    .from('nurses')
    .select('*')
    .eq('company_id', companyId)
    .eq('department', ward.department)
    .eq('status', 'active')

  // 获取已排班的护士
  const { data: existingSchedules } = await supabase
    .from('nursing_work_schedules')
    .select('nurse_id')
    .eq('schedule_date', date)
    .neq('status', 'cancelled')

  const scheduledNurseIds = new Set(existingSchedules?.map((s: any) => s.nurse_id) || [])

  // 筛选可用护士
  const availableNurses = allNurses?.filter((nurse: any) => {
    // 排除已排班
    if (scheduledNurseIds.has(nurse.id)) return false
    
    // 排除不可用日期
    if (nurse.unavailable_dates?.includes(date)) return false
    
    return true
  }) || []

  // AI 评分
  const suggestions = availableNurses.map((nurse: any) => {
    let score = 70

    // 专长匹配
    if (nurse.specialties?.includes(ward.department)) score += 15
    
    // 偏好班次
    if (nurse.preferred_shifts?.includes(shiftType)) score += 10
    
    // 经验
    score += Math.min(nurse.years_of_experience * 0.5, 15)
    
    // 绩效
    score += (nurse.performance_rating || 0) * 4

    return {
      nurse_id: nurse.id,
      nurse_name: nurse.name,
      position: nurse.position,
      level: nurse.level,
      specialties: nurse.specialties,
      years_of_experience: nurse.years_of_experience,
      suitability_score: Math.min(Math.round(score), 100),
      availability: 'available',
      recommendation: score >= 85 ? 'highly_recommended' : score >= 75 ? 'recommended' : 'suitable'
    }
  })

  const topSuggestions = suggestions
    .sort((a: any, b: any) => b.suitability_score - a.suitability_score)
    .slice(0, requiredCount || 5)

  const aiMetadata = simulateAI()

  return {
    total_available: availableNurses.length,
    suggestions: topSuggestions,
    ai_metadata: aiMetadata
  }
}

// =====================================================
// 4. 检查排班冲突
// =====================================================
async function checkConflicts(supabase: any, data: any) {
  const { nurseId, date, startTime, endTime, excludeScheduleId } = data
  console.log('⚠️ Checking conflicts for nurse:', nurseId)

  const { data: conflicts } = await supabase
    .from('nursing_work_schedules')
    .select('*')
    .eq('nurse_id', nurseId)
    .eq('schedule_date', date)
    .neq('status', 'cancelled')
    .neq('id', excludeScheduleId || '')

  const hasConflict = conflicts?.some((schedule: any) => {
    const scheduleStart = new Date(schedule.start_time)
    const scheduleEnd = new Date(schedule.end_time)
    const newStart = new Date(startTime)
    const newEnd = new Date(endTime)

    return (newStart < scheduleEnd && newEnd > scheduleStart)
  }) || false

  return {
    has_conflict: hasConflict,
    conflicts: hasConflict ? conflicts : [],
    conflict_count: conflicts?.length || 0
  }
}

// =====================================================
// 5. 获取统计数据
// =====================================================
async function getStatistics(supabase: any, data: any) {
  const { companyId } = data
  console.log('📈 Getting statistics for company:', companyId)

  // 调用数据库函数
  const { data: stats, error } = await supabase
    .rpc('get_nursing_schedule_stats', { p_company_id: companyId })

  if (error) {
    console.error('Error getting stats:', error)
    throw error
  }

  // 获取近期排班趋势
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: recentSchedules } = await supabase
    .from('nursing_work_schedules')
    .select('schedule_date, shift_type, workload_score')
    .eq('company_id', companyId)
    .gte('schedule_date', sevenDaysAgo.toISOString().split('T')[0])
    .neq('status', 'cancelled')

  const aiMetadata = simulateAI()

  return {
    ...stats,
    recent_schedules_count: recentSchedules?.length || 0,
    ai_metadata: aiMetadata
  }
}

// =====================================================
// 6. 自动分配班次
// =====================================================
async function autoAssignShifts(supabase: any, data: any) {
  const { companyId, wardId, dateRange, shiftTypes } = data
  console.log('🤖 Auto-assigning shifts for:', { wardId, dateRange })

  const assignments = []
  const errors = []

  for (const date of dateRange) {
    for (const shiftType of shiftTypes) {
      try {
        // 预测工作量
        const workload = await predictWorkload(supabase, {
          companyId,
          wardId,
          date,
          shiftType
        })

        // 优化排班
        const optimization = await optimizeSchedule(supabase, {
          companyId,
          wardId,
          date,
          shiftType
        })

        // 创建排班记录
        const schedules = optimization.recommended_nurses.slice(0, workload.recommended_nurse_count).map((nurse: any) => ({
          company_id: companyId,
          nurse_id: nurse.id,
          ward_id: wardId,
          schedule_date: date,
          shift_type: shiftType,
          start_time: `${date}T${getShiftStartTime(shiftType)}`,
          end_time: `${date}T${getShiftEndTime(shiftType)}`,
          workload_score: workload.predicted_acuity_score,
          status: 'scheduled'
        }))

        const { data: created, error: insertError } = await supabase
          .from('nursing_work_schedules')
          .insert(schedules)
          .select()

        if (insertError) throw insertError

        assignments.push({
          date,
          shift_type: shiftType,
          assigned_count: created.length
        })

      } catch (error) {
        errors.push({
          date,
          shift_type: shiftType,
          error: error.message
        })
      }
    }
  }

  const aiMetadata = simulateAI()

  return {
    total_assignments: assignments.length,
    successful: assignments,
    errors: errors,
    ai_metadata: aiMetadata
  }
}

// =====================================================
// 辅助函数
// =====================================================

function generateRecommendationReason(nurse: any, ward: any, shiftType: string) {
  const reasons = []
  
  if (nurse.specialties?.includes(ward.department)) {
    reasons.push(`专长匹配: ${ward.department}`)
  }
  
  if (nurse.level === 'N4' || nurse.level === 'N3') {
    reasons.push(`高级护士 (${nurse.level})`)
  }
  
  if (nurse.preferred_shifts?.includes(shiftType)) {
    reasons.push(`偏好${shiftType}班`)
  }
  
  if (nurse.years_of_experience >= 5) {
    reasons.push(`${nurse.years_of_experience}年经验`)
  }
  
  if (nurse.performance_rating >= 4.0) {
    reasons.push(`绩效优秀 (${nurse.performance_rating}/5.0)`)
  }
  
  return reasons.join(' • ') || '基本符合要求'
}

function getShiftStartTime(shiftType: string): string {
  switch (shiftType) {
    case 'day': return '08:00:00'
    case 'evening': return '16:00:00'
    case 'night': return '00:00:00'
    default: return '08:00:00'
  }
}

function getShiftEndTime(shiftType: string): string {
  switch (shiftType) {
    case 'day': return '16:00:00'
    case 'evening': return '00:00:00'
    case 'night': return '08:00:00'
    default: return '16:00:00'
  }
}


