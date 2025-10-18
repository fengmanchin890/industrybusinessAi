import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface AnalysisRequest {
  action: 'analyze_performance' | 'generate_recommendations' | 'predict_trajectory' | 'generate_report' | 'detect_at_risk'
  data: {
    studentId?: string
    classId?: string
    startDate?: string
    endDate?: string
    subject?: string
    reportType?: string
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  }

  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ 
        status: 'healthy',
        service: 'student-performance-analyzer',
        version: '1.0.0'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userData?.company_id) {
      throw new Error('User has no company')
    }

    const { action, data } = await req.json() as AnalysisRequest

    let result

    switch (action) {
      case 'analyze_performance':
        result = await analyzeStudentPerformance(supabase, userData.company_id, data)
        break
      case 'generate_recommendations':
        result = await generateRecommendations(supabase, userData.company_id, data)
        break
      case 'predict_trajectory':
        result = await predictTrajectory(supabase, userData.company_id, data)
        break
      case 'generate_report':
        result = await generatePerformanceReport(supabase, userData.company_id, data)
        break
      case 'detect_at_risk':
        result = await detectAtRiskStudents(supabase, userData.company_id, data)
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
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function analyzeStudentPerformance(supabase: any, companyId: string, data: any) {
  const { studentId } = data

  if (!studentId) {
    throw new Error('Student ID is required')
  }

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .eq('company_id', companyId)
    .single()

  if (!student) {
    throw new Error('Student not found')
  }

  const { data: grades } = await supabase
    .from('student_grades')
    .select('*')
    .eq('student_id', studentId)
    .order('assessment_date', { ascending: false })
    .limit(20)

  const { data: attendance } = await supabase
    .from('student_attendance')
    .select('*')
    .eq('student_id', studentId)
    .order('attendance_date', { ascending: false })
    .limit(30)

  const { data: homework } = await supabase
    .from('homework_completion')
    .select('*')
    .eq('student_id', studentId)
    .order('due_date', { ascending: false })
    .limit(20)

  const overallScore = grades?.length ? 
    grades.reduce((sum: number, g: any) => sum + parseFloat(g.percentage), 0) / grades.length : 0
  
  const attendanceRate = attendance?.length ?
    (attendance.filter((a: any) => a.status === 'present').length / attendance.length) * 100 : 0
  
  const homeworkCompletionRate = homework?.length ?
    (homework.filter((h: any) => h.submission_status !== 'not_submitted').length / homework.length) * 100 : 0

  const riskLevel = overallScore < 60 || attendanceRate < 75 || homeworkCompletionRate < 70 ? 'high' :
                    overallScore < 70 || attendanceRate < 85 || homeworkCompletionRate < 80 ? 'medium' : 'low'

  const trend = grades && grades.length >= 3 ? (() => {
    const recent = grades.slice(0, Math.ceil(grades.length / 2))
    const older = grades.slice(Math.ceil(grades.length / 2))
    const recentAvg = recent.reduce((sum: number, g: any) => sum + parseFloat(g.percentage), 0) / recent.length
    const olderAvg = older.reduce((sum: number, g: any) => sum + parseFloat(g.percentage), 0) / older.length
    return recentAvg > olderAvg + 5 ? 'improving' : recentAvg < olderAvg - 5 ? 'declining' : 'stable'
  })() : 'stable'

  return {
    student: {
      id: student.id,
      name: student.name,
      grade: student.grade,
      class: student.class_name
    },
    statistics: {
      overallScore: Math.round(overallScore),
      attendanceRate: Math.round(attendanceRate),
      homeworkCompletionRate: Math.round(homeworkCompletionRate)
    },
    analysis: {
      summary: `${student.name} 的整體表現${overallScore >= 80 ? '優秀' : overallScore >= 70 ? '良好' : overallScore >= 60 ? '及格' : '需要改進'}`,
      strengths: overallScore >= 80 ? ['學業表現優秀'] : ['持續努力學習'],
      weaknesses: overallScore < 70 ? ['整體成績需要提升'] : [],
      recommendations: overallScore < 70 ? ['建議安排課後輔導', '加強基礎知識複習'] : ['保持良好學習態度'],
      trend: trend,
      risk_level: riskLevel,
      next_steps: riskLevel === 'high' ? ['立即與家長聯繫', '安排一對一輔導'] : ['繼續保持', '定期追蹤']
    }
  }
}

async function generateRecommendations(supabase: any, companyId: string, data: any) {
  const { studentId } = data
  const performance = await analyzeStudentPerformance(supabase, companyId, { studentId })

  return {
    student_id: studentId,
    recommendations: {
      short_term_goals: ['提升作業完成率', '保持良好出席'],
      medium_term_goals: ['各科成績提升', '培養學習習慣'],
      long_term_goals: ['達到優秀水平'],
      action_plan: [
        {
          task: '建立學習計劃',
          timeline: '第一週',
          resources: ['學習計劃表']
        }
      ],
      parent_involvement: ['每週檢查進度', '定期與老師溝通']
    }
  }
}

async function predictTrajectory(supabase: any, companyId: string, data: any) {
  const { studentId } = data

  const { data: grades } = await supabase
    .from('student_grades')
    .select('assessment_date, percentage')
    .eq('student_id', studentId)
    .order('assessment_date', { ascending: true })
    .limit(20)

  if (!grades || grades.length < 3) {
    return {
      predicted_scores: [],
      confidence: 'low',
      message: '數據不足'
    }
  }

  const avgScore = grades.reduce((sum: number, g: any) => sum + parseFloat(g.percentage), 0) / grades.length

  return {
    student_id: studentId,
    predicted_scores: [
      { period: '下次評估', predicted_score: Math.round(avgScore), confidence: 'medium' }
    ],
    trend: 'stable'
  }
}

async function generatePerformanceReport(supabase: any, companyId: string, data: any) {
  const { studentId } = data
  const performance = await analyzeStudentPerformance(supabase, companyId, { studentId })
  const recommendations = await generateRecommendations(supabase, companyId, { studentId })

  const { error } = await supabase
    .from('performance_reports')
    .insert({
      company_id: companyId,
      student_id: studentId,
      report_type: 'individual',
      report_period: new Date().toISOString().split('T')[0],
      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      overall_score: performance.statistics.overallScore,
      attendance_rate: performance.statistics.attendanceRate,
      homework_completion_rate: performance.statistics.homeworkCompletionRate,
      ai_summary: performance.analysis.summary,
      ai_strengths: performance.analysis.strengths,
      ai_weaknesses: performance.analysis.weaknesses,
      ai_recommendations: performance.analysis.recommendations,
      performance_trend: performance.analysis.trend,
      status: 'published'
    })

  if (error) {
    console.error('Report save error:', error)
  }

  return {
    ...performance,
    recommendations: recommendations.recommendations
  }
}

async function detectAtRiskStudents(supabase: any, companyId: string, data: any) {
  const { data: students } = await supabase
    .from('students')
    .select('id, name, grade, class_name')
    .eq('company_id', companyId)
    .eq('is_active', true)

  if (!students || students.length === 0) {
    return { at_risk_students: [] }
  }

  const atRiskStudents = []

  for (const student of students) {
    const performance = await analyzeStudentPerformance(supabase, companyId, { 
      studentId: student.id 
    })

    if (performance.analysis.risk_level === 'high') {
      atRiskStudents.push({
        student,
        performance: performance.statistics,
        risk_factors: ['成績低於標準', '需要關注'],
        priority: 100 - performance.statistics.overallScore
      })
    }
  }

  return {
    at_risk_students: atRiskStudents,
    total_students: students.length,
    at_risk_count: atRiskStudents.length
  }
}
