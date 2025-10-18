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
      JSON.stringify({ status: 'healthy', service: 'nursing-schedule-ai', version: '1.0.0' }),
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
      case 'optimize_schedule':
        result = await optimizeSchedule(supabase, userData.company_id, data, user.id)
        break
      case 'check_conflicts':
        result = await checkConflicts(supabase, userData.company_id, data)
        break
      case 'get_staff_availability':
        result = await getStaffAvailability(supabase, userData.company_id, data)
        break
      case 'get_statistics':
        result = await getStatistics(supabase, userData.company_id, data)
        break
      case 'suggest_assignment':
        result = await suggestAssignment(supabase, userData.company_id, data)
        break
      case 'validate_workload':
        result = await validateWorkload(supabase, data)
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

// AI 優化排班
async function optimizeSchedule(supabase: any, companyId: string, data: any, userId: string) {
  const { periodStart, periodEnd, departments } = data
  
  console.log('Optimizing schedule for company:', companyId)
  
  // 獲取待排班次
  const { data: pendingShifts, error: shiftsError } = await supabase
    .from('nursing_shifts')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'pending')
    .gte('shift_date', periodStart || new Date().toISOString().split('T')[0])
    .order('shift_date', { ascending: true })
  
  if (shiftsError) throw shiftsError
  
  // 獲取可用護理人員
  const { data: availableStaff, error: staffError } = await supabase
    .from('nursing_staff')
    .select('*')
    .eq('company_id', companyId)
    .in('status', ['available', 'busy'])
  
  if (staffError) throw staffError
  
  const assignments = []
  const conflicts = []
  const suggestions = []
  let scheduledCount = 0
  
  // AI 優化演算法
  for (const shift of pendingShifts || []) {
    const shiftDate = new Date(shift.shift_date)
    const weekStart = new Date(shiftDate)
    weekStart.setDate(shiftDate.getDate() - shiftDate.getDay())
    
    // 為每個班次尋找最佳護理人員
    const candidates = []
    
    for (const staff of availableStaff || []) {
      let score = 0
      
      // 1. 技能匹配分數 (40%)
      const matchedSkills = staff.skills.filter((skill: string) => 
        shift.required_skills.includes(skill)
      )
      const skillMatchRate = matchedSkills.length / shift.required_skills.length
      score += skillMatchRate * 40
      
      // 2. 偏好匹配分數 (20%)
      const shiftType = getShiftType(shift.shift_time)
      if (staff.preferences && staff.preferences.includes(shiftType)) {
        score += 20
      }
      
      // 3. 工作量平衡分數 (30%)
      const { data: weeklyHours } = await supabase.rpc('calculate_weekly_hours', {
        p_staff_id: staff.id,
        p_week_start: weekStart.toISOString().split('T')[0]
      })
      
      const currentHours = weeklyHours || 0
      const remainingCapacity = staff.max_hours_per_week - currentHours
      
      if (remainingCapacity >= shift.duration_hours) {
        const utilizationRate = currentHours / staff.max_hours_per_week
        score += (1 - utilizationRate) * 30 // 優先分配給工時較少的人員
      } else {
        score -= 50 // 超時扣分
      }
      
      // 4. 狀態加分 (10%)
      if (staff.status === 'available') {
        score += 10
      }
      
      // 檢查衝突
      const { data: conflictCheck } = await supabase.rpc('check_schedule_conflicts', {
        p_staff_id: staff.id,
        p_shift_id: shift.id
      })
      
      const hasConflict = conflictCheck && conflictCheck.length > 0 && conflictCheck[0].has_conflict
      
      if (!hasConflict && score > 50) {
        candidates.push({
          staff_id: staff.id,
          staff_name: staff.name,
          score,
          matched_skills: matchedSkills,
          current_hours: currentHours,
          remaining_capacity: remainingCapacity
        })
      }
    }
    
    // 按分數排序
    candidates.sort((a, b) => b.score - a.score)
    
    // 選擇最佳候選人
    const selectedStaff = candidates.slice(0, shift.min_staff_required)
    
    if (selectedStaff.length >= shift.min_staff_required) {
      // 創建排班分配
      for (const candidate of selectedStaff) {
        try {
          const { data: assignment, error: assignError } = await supabase
            .from('shift_assignments')
            .insert({
              company_id: companyId,
              shift_id: shift.id,
              staff_id: candidate.staff_id,
              assignment_status: 'assigned',
              assigned_by: userId,
              assigned_at: new Date().toISOString()
            })
            .select()
            .single()
          
          if (!assignError) {
            assignments.push({
              shift_id: shift.id,
              staff_id: candidate.staff_id,
              staff_name: candidate.staff_name,
              score: candidate.score
            })
          }
        } catch (e) {
          console.warn('Error creating assignment:', e)
        }
      }
      
      // 更新班次狀態
      await supabase
        .from('nursing_shifts')
        .update({ status: 'scheduled', updated_at: new Date().toISOString() })
        .eq('id', shift.id)
      
      scheduledCount++
    } else {
      // 記錄衝突
      conflicts.push({
        shift_id: shift.id,
        shift_date: shift.shift_date,
        shift_time: shift.shift_time,
        department: shift.department,
        reason: 'insufficient_qualified_staff',
        available_candidates: candidates.length,
        required_staff: shift.min_staff_required
      })
      
      await supabase.from('schedule_conflicts').insert({
        company_id: companyId,
        conflict_type: 'understaffed',
        severity: 'high',
        shift_id: shift.id,
        description: `${shift.department} ${shift.shift_time} 缺乏符合條件的護理人員`,
        resolution_status: 'pending'
      })
    }
  }
  
  // 計算覆蓋率
  const totalShifts = (pendingShifts || []).length
  const coverageRate = totalShifts > 0 ? (scheduledCount / totalShifts) * 100 : 0
  
  // 生成建議
  if (coverageRate < 80) {
    suggestions.push('建議招募更多護理人員或調整班次時間')
  }
  if (conflicts.length > 0) {
    suggestions.push(`發現 ${conflicts.length} 個班次缺乏人力，建議重新評估人力配置`)
  }
  if (coverageRate >= 90) {
    suggestions.push('排班覆蓋率良好，建議維持目前配置')
  }
  
  // 記錄優化結果
  await supabase.from('schedule_optimizations').insert({
    company_id: companyId,
    period_start: periodStart || new Date().toISOString().split('T')[0],
    period_end: periodEnd || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    total_shifts: totalShifts,
    scheduled_shifts: scheduledCount,
    unscheduled_shifts: totalShifts - scheduledCount,
    coverage_rate: coverageRate,
    optimization_algorithm: 'ai_skill_based',
    ai_suggestions: suggestions,
    optimized_by: userId
  })
  
  return {
    success: true,
    total_shifts: totalShifts,
    scheduled_shifts: scheduledCount,
    coverage_rate: Math.round(coverageRate * 100) / 100,
    assignments: assignments.length,
    conflicts: conflicts.length,
    suggestions,
    detailed_conflicts: conflicts,
    message: `成功優化 ${scheduledCount} 個班次，覆蓋率 ${Math.round(coverageRate)}%`
  }
}

// 檢查排班衝突
async function checkConflicts(supabase: any, companyId: string, data: any) {
  const { staffId, shiftId } = data
  
  const { data: conflicts, error } = await supabase.rpc('check_schedule_conflicts', {
    p_staff_id: staffId,
    p_shift_id: shiftId
  })
  
  if (error) throw error
  
  const hasConflict = conflicts && conflicts.length > 0 && conflicts[0].has_conflict
  
  return {
    has_conflict: hasConflict,
    conflicts: hasConflict ? conflicts : [],
    can_assign: !hasConflict
  }
}

// 獲取護理人員可用性
async function getStaffAvailability(supabase: any, companyId: string, data: any) {
  const { date, department } = data
  
  const { data: staff, error } = await supabase
    .from('nursing_staff')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'available')
  
  if (error) throw error
  
  // 過濾符合科別要求的人員
  let availableStaff = staff || []
  
  if (department) {
    availableStaff = availableStaff.filter((s: any) => {
      const deptSkills = getDepartmentSkills(department)
      return s.skills.some((skill: string) => deptSkills.includes(skill))
    })
  }
  
  return {
    date,
    department,
    total_available: availableStaff.length,
    staff: availableStaff.map((s: any) => ({
      id: s.id,
      name: s.name,
      position: s.position,
      skills: s.skills,
      status: s.status
    }))
  }
}

// 獲取統計數據
async function getStatistics(supabase: any, companyId: string, data: any) {
  try {
    const { data: stats, error } = await supabase.rpc('get_nursing_schedule_stats', {
      p_company_id: companyId
    })
    
    if (error) {
      console.warn('Error getting stats:', error)
      return { stats: null }
    }
    
    return {
      stats: stats && stats.length > 0 ? stats[0] : null,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.warn('Error in getStatistics:', error)
    return { stats: null }
  }
}

// AI 建議分配
async function suggestAssignment(supabase: any, companyId: string, data: any) {
  const { shiftId } = data
  
  // 獲取班次信息
  const { data: shift, error: shiftError } = await supabase
    .from('nursing_shifts')
    .select('*')
    .eq('id', shiftId)
    .single()
  
  if (shiftError || !shift) throw new Error('Shift not found')
  
  // 獲取所有護理人員
  const { data: allStaff, error: staffError } = await supabase
    .from('nursing_staff')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'available')
  
  if (staffError) throw staffError
  
  const suggestions = []
  
  for (const staff of allStaff || []) {
    // 檢查技能匹配
    const { data: skillMatch } = await supabase.rpc('check_skill_match', {
      p_staff_id: staff.id,
      p_shift_id: shiftId
    })
    
    if (skillMatch && skillMatch.length > 0 && skillMatch[0].is_qualified) {
      // 檢查衝突
      const { data: conflictCheck } = await supabase.rpc('check_schedule_conflicts', {
        p_staff_id: staff.id,
        p_shift_id: shiftId
      })
      
      const hasConflict = conflictCheck && conflictCheck.length > 0 && conflictCheck[0].has_conflict
      
      if (!hasConflict) {
        suggestions.push({
          staff_id: staff.id,
          staff_name: staff.name,
          position: staff.position,
          matched_skills: skillMatch[0].matched_skills,
          recommendation_score: skillMatch[0].matched_skills.length * 20
        })
      }
    }
  }
  
  // 按推薦分數排序
  suggestions.sort((a, b) => b.recommendation_score - a.recommendation_score)
  
  return {
    shift_id: shiftId,
    shift_info: {
      date: shift.shift_date,
      time: shift.shift_time,
      department: shift.department
    },
    suggestions: suggestions.slice(0, 5),
    total_candidates: suggestions.length
  }
}

// 驗證工作量
async function validateWorkload(supabase: any, data: any) {
  const { staffId, weekStart } = data
  
  const { data: staff } = await supabase
    .from('nursing_staff')
    .select('name, max_hours_per_week')
    .eq('id', staffId)
    .single()
  
  const { data: weeklyHours } = await supabase.rpc('calculate_weekly_hours', {
    p_staff_id: staffId,
    p_week_start: weekStart
  })
  
  const currentHours = weeklyHours || 0
  const maxHours = staff?.max_hours_per_week || 40
  const utilizationRate = (currentHours / maxHours) * 100
  
  const warnings = []
  
  if (utilizationRate >= 100) {
    warnings.push({
      type: 'overtime',
      severity: 'critical',
      message: '護理人員已達最大工時'
    })
  } else if (utilizationRate >= 90) {
    warnings.push({
      type: 'near_limit',
      severity: 'high',
      message: '護理人員接近最大工時'
    })
  }
  
  return {
    staff_id: staffId,
    staff_name: staff?.name,
    current_hours: currentHours,
    max_hours: maxHours,
    remaining_hours: Math.max(0, maxHours - currentHours),
    utilization_rate: Math.round(utilizationRate * 100) / 100,
    is_overloaded: utilizationRate >= 100,
    warnings
  }
}

// 輔助函數：獲取班次類型
function getShiftType(shiftTime: string): string {
  const hour = parseInt(shiftTime.split(':')[0])
  if (hour >= 8 && hour < 16) return '日班'
  if (hour >= 16 && hour < 24) return '小夜班'
  return '夜班'
}

// 輔助函數：獲取科別所需技能
function getDepartmentSkills(department: string): string[] {
  const skillMap: Record<string, string[]> = {
    '內科': ['內科', '一般護理'],
    '外科': ['外科', '一般護理'],
    '急診': ['急診', '緊急救護'],
    'ICU': ['ICU', '重症護理', '急診'],
    '兒科': ['兒科', '一般護理'],
    '婦產科': ['婦產科', '一般護理']
  }
  return skillMap[department] || []
}


