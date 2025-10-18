// ========================================
// AI 健康監測系統 - Edge Function
// ========================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VitalSigns {
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  temperature?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  blood_glucose?: number;
}

interface HealthAnalysis {
  health_score: number;
  risk_level: string;
  alerts: any[];
  recommendations: string[];
  ai_insights: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { action, data } = await req.json()
    console.log('🏥 Health Monitoring Action:', action)

    switch (action) {
      case 'analyze_vital_signs':
        return await analyzeVitalSigns(supabaseClient, data)
      case 'predict_health_risk':
        return await predictHealthRisk(supabaseClient, data)
      case 'generate_health_report':
        return await generateHealthReport(supabaseClient, data)
      case 'get_statistics':
        return await getStatistics(supabaseClient, data)
      case 'check_alert_conditions':
        return await checkAlertConditions(supabaseClient, data)
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

// 分析生命體征
async function analyzeVitalSigns(supabaseClient: any, data: any) {
  console.log('📊 Analyzing vital signs:', data)
  
  const { patientId, vitalSigns } = data
  
  if (!patientId || !vitalSigns) {
    throw new Error('Missing required fields: patientId, vitalSigns')
  }

  // 獲取患者資料
  const { data: patient, error: patientError } = await supabaseClient
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .single()

  if (patientError) {
    console.error('Error fetching patient:', patientError)
  }

  // AI 分析生命體征
  const analysis = performVitalSignsAnalysis(vitalSigns, patient)
  
  // 儲存分析結果
  const { error: metricsError } = await supabaseClient
    .from('health_metrics')
    .insert({
      company_id: data.companyId,
      patient_id: patientId,
      health_score: analysis.health_score,
      risk_level: analysis.risk_level,
      ai_analysis: {
        insights: analysis.ai_insights,
        recommendations: analysis.recommendations
      }
    })

  if (metricsError) {
    console.error('Error saving metrics:', metricsError)
  }

  // 如果有警報，創建警報記錄
  if (analysis.alerts.length > 0) {
    for (const alert of analysis.alerts) {
      await supabaseClient
        .from('health_alerts')
        .insert({
          company_id: data.companyId,
          patient_id: patientId,
          alert_type: alert.type,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          measurement_value: alert.value,
          normal_range: alert.normal_range,
          recommendation: alert.recommendation
        })
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      analysis: analysis,
      alerts_created: analysis.alerts.length
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  )
}

// 預測健康風險
async function predictHealthRisk(supabaseClient: any, data: any) {
  console.log('🔮 Predicting health risk for patient:', data.patientId)
  
  const { patientId } = data
  
  // 獲取患者歷史數據
  const { data: vitals, error } = await supabaseClient
    .from('vital_signs')
    .select('*')
    .eq('patient_id', patientId)
    .order('measurement_time', { ascending: false })
    .limit(30)

  if (error) throw error

  // AI 風險預測
  const riskPrediction = analyzeHealthTrends(vitals)
  
  return new Response(
    JSON.stringify({
      success: true,
      patient_id: patientId,
      risk_prediction: riskPrediction,
      data_points: vitals.length
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  )
}

// 生成健康報告
async function generateHealthReport(supabaseClient: any, data: any) {
  console.log('📋 Generating health report:', data)
  
  const { patientId, periodStart, periodEnd } = data
  
  // 獲取期間內的數據
  const { data: vitals } = await supabaseClient
    .from('vital_signs')
    .select('*')
    .eq('patient_id', patientId)
    .gte('measurement_time', periodStart)
    .lte('measurement_time', periodEnd)

  const { data: alerts } = await supabaseClient
    .from('health_alerts')
    .select('*')
    .eq('patient_id', patientId)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd)

  // 生成報告
  const report = generateReportSummary(vitals || [], alerts || [])
  
  // 儲存報告
  const { data: savedReport, error } = await supabaseClient
    .from('health_reports')
    .insert({
      company_id: data.companyId,
      patient_id: patientId,
      report_type: data.reportType || 'custom',
      report_period_start: periodStart,
      report_period_end: periodEnd,
      total_measurements: vitals?.length || 0,
      avg_health_score: report.avg_health_score,
      alerts_count: alerts?.length || 0,
      trends: report.trends,
      ai_insights: report.insights,
      recommendations: report.recommendations,
      generated_by: 'AI System'
    })
    .select()
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify({
      success: true,
      report: savedReport
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  )
}

// 獲取統計數據
async function getStatistics(supabaseClient: any, data: any) {
  console.log('📈 Getting statistics for company:', data.companyId)
  
  const { data: stats, error } = await supabaseClient
    .rpc('get_health_monitoring_stats', { p_company_id: data.companyId })

  if (error) throw error

  // 獲取最近警報
  const { data: recentAlerts } = await supabaseClient
    .from('health_alerts')
    .select('*, patients(patient_name)')
    .eq('company_id', data.companyId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(10)

  return new Response(
    JSON.stringify({
      success: true,
      stats: stats[0] || {},
      recent_alerts: recentAlerts || []
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  )
}

// 檢查警報條件
async function checkAlertConditions(supabaseClient: any, data: any) {
  const { vitalSigns } = data
  const alerts: any[] = []
  
  // 血壓檢查
  if (vitalSigns.systolic_bp) {
    if (vitalSigns.systolic_bp >= 180 || vitalSigns.diastolic_bp >= 120) {
      alerts.push({
        type: 'bp_critical',
        severity: 'critical',
        title: '血壓危險過高',
        description: `收縮壓 ${vitalSigns.systolic_bp}/${vitalSigns.diastolic_bp} mmHg 超過安全範圍`,
        value: `${vitalSigns.systolic_bp}/${vitalSigns.diastolic_bp}`,
        normal_range: '90-120 / 60-80 mmHg',
        recommendation: '立即就醫！血壓已達到危險水平'
      })
    } else if (vitalSigns.systolic_bp >= 140 || vitalSigns.diastolic_bp >= 90) {
      alerts.push({
        type: 'bp_high',
        severity: 'warning',
        title: '血壓偏高',
        description: `收縮壓 ${vitalSigns.systolic_bp}/${vitalSigns.diastolic_bp} mmHg 高於正常範圍`,
        value: `${vitalSigns.systolic_bp}/${vitalSigns.diastolic_bp}`,
        normal_range: '90-120 / 60-80 mmHg',
        recommendation: '建議休息後再次測量，如持續偏高請諮詢醫師'
      })
    }
  }

  // 心率檢查
  if (vitalSigns.heart_rate) {
    if (vitalSigns.heart_rate > 120 || vitalSigns.heart_rate < 50) {
      alerts.push({
        type: 'hr_abnormal',
        severity: vitalSigns.heart_rate > 140 || vitalSigns.heart_rate < 40 ? 'critical' : 'warning',
        title: '心率異常',
        description: `心率 ${vitalSigns.heart_rate} bpm 不在正常範圍`,
        value: `${vitalSigns.heart_rate} bpm`,
        normal_range: '60-100 bpm',
        recommendation: vitalSigns.heart_rate > 140 ? '立即就醫' : '建議諮詢醫師'
      })
    }
  }

  // 血糖檢查
  if (vitalSigns.blood_glucose) {
    if (vitalSigns.blood_glucose > 200) {
      alerts.push({
        type: 'glucose_high',
        severity: 'critical',
        title: '血糖過高',
        description: `血糖 ${vitalSigns.blood_glucose} mg/dL 過高`,
        value: `${vitalSigns.blood_glucose} mg/dL`,
        normal_range: '70-140 mg/dL (飯後)',
        recommendation: '立即諮詢醫師，可能需要調整藥物'
      })
    } else if (vitalSigns.blood_glucose < 70) {
      alerts.push({
        type: 'glucose_low',
        severity: 'warning',
        title: '血糖過低',
        description: `血糖 ${vitalSigns.blood_glucose} mg/dL 過低`,
        value: `${vitalSigns.blood_glucose} mg/dL`,
        normal_range: '70-140 mg/dL',
        recommendation: '立即補充糖分，並注意監測'
      })
    }
  }

  // 血氧檢查
  if (vitalSigns.oxygen_saturation && vitalSigns.oxygen_saturation < 95) {
    alerts.push({
      type: 'spo2_low',
      severity: vitalSigns.oxygen_saturation < 90 ? 'critical' : 'warning',
      title: '血氧飽和度偏低',
      description: `血氧 ${vitalSigns.oxygen_saturation}% 低於正常範圍`,
      value: `${vitalSigns.oxygen_saturation}%`,
      normal_range: '95-100%',
      recommendation: vitalSigns.oxygen_saturation < 90 ? '立即就醫' : '注意監測，如持續偏低請就醫'
    })
  }

  return new Response(
    JSON.stringify({
      success: true,
      alerts: alerts,
      total_alerts: alerts.length
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  )
}

// ==================== AI 分析函數 ====================

function performVitalSignsAnalysis(vitals: VitalSigns, patient: any): HealthAnalysis {
  let health_score = 100
  const alerts: any[] = []
  const recommendations: string[] = []
  
  // 血壓評分
  if (vitals.systolic_bp && vitals.diastolic_bp) {
    if (vitals.systolic_bp >= 180 || vitals.diastolic_bp >= 120) {
      health_score -= 30
      alerts.push({
        type: 'bp_critical',
        severity: 'critical',
        title: '血壓危險過高',
        description: `收縮壓 ${vitals.systolic_bp}/${vitals.diastolic_bp} mmHg`,
        value: `${vitals.systolic_bp}/${vitals.diastolic_bp}`,
        normal_range: '90-120 / 60-80 mmHg',
        recommendation: '立即就醫'
      })
    } else if (vitals.systolic_bp >= 140 || vitals.diastolic_bp >= 90) {
      health_score -= 15
      recommendations.push('血壓偏高，建議控制鹽分攝取')
    }
  }

  // 心率評分
  if (vitals.heart_rate) {
    if (vitals.heart_rate > 120 || vitals.heart_rate < 50) {
      health_score -= 20
      recommendations.push('心率異常，建議諮詢醫師')
    }
  }

  // 血糖評分
  if (vitals.blood_glucose) {
    if (vitals.blood_glucose > 200 || vitals.blood_glucose < 70) {
      health_score -= 25
      recommendations.push('血糖異常，請注意飲食控制')
    }
  }

  // 血氧評分
  if (vitals.oxygen_saturation && vitals.oxygen_saturation < 95) {
    health_score -= 20
    recommendations.push('血氧偏低，注意呼吸狀況')
  }

  // 確保分數在 0-100 範圍內
  health_score = Math.max(0, Math.min(100, health_score))

  // 判斷風險等級
  let risk_level = 'low'
  if (health_score < 60) risk_level = 'critical'
  else if (health_score < 75) risk_level = 'high'
  else if (health_score < 85) risk_level = 'moderate'

  const ai_insights = generateHealthInsights(vitals, health_score, patient)

  return {
    health_score,
    risk_level,
    alerts,
    recommendations: recommendations.length > 0 ? recommendations : ['各項指標正常，請持續保持健康生活習慣'],
    ai_insights
  }
}

function generateHealthInsights(vitals: VitalSigns, score: number, patient: any): string {
  const insights: string[] = []
  
  insights.push(`綜合健康評分：${score}/100`)
  
  if (vitals.systolic_bp && vitals.diastolic_bp) {
    insights.push(`血壓 ${vitals.systolic_bp}/${vitals.diastolic_bp} mmHg`)
  }
  
  if (vitals.heart_rate) {
    insights.push(`心率 ${vitals.heart_rate} bpm`)
  }
  
  if (vitals.blood_glucose) {
    insights.push(`血糖 ${vitals.blood_glucose} mg/dL`)
  }
  
  if (patient?.chronic_conditions && patient.chronic_conditions.length > 0) {
    insights.push(`慢性病：${patient.chronic_conditions.join('、')}`)
  }
  
  return insights.join('。') + '。'
}

function analyzeHealthTrends(vitals: any[]): any {
  if (!vitals || vitals.length === 0) {
    return {
      trend: 'insufficient_data',
      risk_score: 50,
      prediction: '數據不足，無法進行趨勢分析'
    }
  }

  // 計算平均值和趨勢
  const avgBP = vitals.reduce((sum, v) => sum + (v.systolic_bp || 0), 0) / vitals.length
  const avgHR = vitals.reduce((sum, v) => sum + (v.heart_rate || 0), 0) / vitals.length
  
  let risk_score = 0
  if (avgBP > 140) risk_score += 30
  if (avgHR > 100 || avgHR < 60) risk_score += 20
  
  const trend = risk_score > 40 ? 'deteriorating' : risk_score > 20 ? 'stable' : 'improving'
  
  return {
    trend,
    risk_score,
    avg_systolic_bp: Math.round(avgBP),
    avg_heart_rate: Math.round(avgHR),
    prediction: risk_score > 40 ? '健康狀況需要關注' : risk_score > 20 ? '健康狀況穩定' : '健康狀況良好',
    recommendations: risk_score > 40 ? ['建議定期回診', '注意飲食控制', '適度運動'] : ['保持良好生活習慣']
  }
}

function generateReportSummary(vitals: any[], alerts: any[]): any {
  const total = vitals.length
  
  if (total === 0) {
    return {
      avg_health_score: 0,
      trends: {},
      insights: '無數據',
      recommendations: ['開始記錄健康數據']
    }
  }

  const avgBP = vitals.reduce((sum, v) => sum + (v.systolic_bp || 0), 0) / total
  const avgHR = vitals.reduce((sum, v) => sum + (v.heart_rate || 0), 0) / total
  
  const health_score = 100 - (alerts.length * 5) - (avgBP > 140 ? 15 : 0) - (avgHR > 100 ? 10 : 0)
  
  return {
    avg_health_score: Math.max(0, health_score),
    trends: {
      avg_blood_pressure: Math.round(avgBP),
      avg_heart_rate: Math.round(avgHR),
      measurement_frequency: `${total} 次測量`
    },
    insights: `期間內共記錄 ${total} 次測量，平均血壓 ${Math.round(avgBP)} mmHg，平均心率 ${Math.round(avgHR)} bpm。${alerts.length > 0 ? `發現 ${alerts.length} 個警報。` : '無異常警報。'}`,
    recommendations: alerts.length > 3 ? ['請諮詢醫師', '加強健康監測'] : ['持續保持健康習慣', '定期測量']
  }
}


