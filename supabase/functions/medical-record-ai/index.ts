// ========================================
// AI 病歷助理系統 - Edge Function
// ========================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MedicalRecordData {
  patientName: string;
  patientAge: number;
  patientGender: string;
  chiefComplaint: string;
  symptoms: string[];
  vitalSigns?: any;
  physicalExamination?: string;
  pastHistory?: string[];
  medications?: any;
}

interface AIAnalysisResult {
  summary: string;
  keyPoints: string[];
  symptomAnalysis: any;
  diagnosisSuggestions: string[];
  riskFactors: string[];
  riskLevel: string;
  treatmentRecommendations: string[];
  followUpSuggestions: string[];
  confidenceScore: number;
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
    console.log('📋 Medical Record Action:', action)

    switch (action) {
      case 'analyze_record':
        return await analyzeRecord(supabaseClient, data)
      case 'generate_summary':
        return await generateSummary(supabaseClient, data)
      case 'suggest_diagnosis':
        return await suggestDiagnosis(supabaseClient, data)
      case 'check_medication_interactions':
        return await checkMedicationInteractions(supabaseClient, data)
      case 'assess_risk':
        return await assessRisk(supabaseClient, data)
      case 'get_statistics':
        return await getStatistics(supabaseClient, data)
      case 'search_records':
        return await searchRecords(supabaseClient, data)
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

// 分析病歷記錄
async function analyzeRecord(supabaseClient: any, data: any) {
  console.log('📊 Analyzing medical record:', data.recordId)
  
  const startTime = Date.now()
  const { recordId, companyId } = data
  
  if (!recordId) {
    throw new Error('Missing recordId')
  }

  // 獲取病歷記錄
  const { data: record, error: recordError } = await supabaseClient
    .from('medical_records')
    .select('*')
    .eq('id', recordId)
    .single()

  if (recordError) throw recordError

  // 執行 AI 分析
  const analysis = performComprehensiveAnalysis(record)
  const processingTime = Date.now() - startTime

  // 儲存分析結果
  const { data: savedAnalysis, error: saveError } = await supabaseClient
    .from('medical_record_analysis')
    .insert({
      company_id: companyId,
      medical_record_id: recordId,
      analysis_type: 'comprehensive',
      ai_summary: analysis.summary,
      key_points: analysis.keyPoints,
      symptom_analysis: analysis.symptomAnalysis,
      diagnosis_suggestions: analysis.diagnosisSuggestions,
      risk_factors: analysis.riskFactors,
      risk_level: analysis.riskLevel,
      treatment_recommendations: analysis.treatmentRecommendations,
      follow_up_suggestions: analysis.followUpSuggestions,
      confidence_score: analysis.confidenceScore,
      processing_time_ms: processingTime,
      model_version: 'v1.0'
    })
    .select()
    .single()

  if (saveError) {
    console.error('Error saving analysis:', saveError)
  }

  // 如果是高風險，保存診斷建議
  if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
    for (const suggestion of analysis.diagnosisSuggestions.slice(0, 3)) {
      await supabaseClient
        .from('diagnosis_suggestions')
        .insert({
          company_id: companyId,
          medical_record_id: recordId,
          suggestion_text: suggestion,
          confidence_score: analysis.confidenceScore,
          reasoning: analysis.summary,
          supporting_symptoms: record.symptoms || []
        })
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      analysis: analysis,
      processing_time_ms: processingTime,
      saved_analysis_id: savedAnalysis?.id
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  )
}

// 生成摘要
async function generateSummary(supabaseClient: any, data: any) {
  console.log('📝 Generating summary for record:', data.recordId)
  
  const { recordId } = data

  const { data: record, error } = await supabaseClient
    .from('medical_records')
    .select('*')
    .eq('id', recordId)
    .single()

  if (error) throw error

  const summary = generateRecordSummary(record)

  return new Response(
    JSON.stringify({
      success: true,
      summary: summary
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  )
}

// 建議診斷
async function suggestDiagnosis(supabaseClient: any, data: any) {
  console.log('🔍 Suggesting diagnosis')
  
  const { symptoms, vitalSigns, patientAge, patientGender } = data

  const suggestions = performDiagnosisReasoning(symptoms, vitalSigns, patientAge, patientGender)

  return new Response(
    JSON.stringify({
      success: true,
      suggestions: suggestions
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  )
}

// 檢查藥物交互作用
async function checkMedicationInteractions(supabaseClient: any, data: any) {
  console.log('💊 Checking medication interactions')
  
  const { medications } = data
  
  if (!medications || medications.length === 0) {
    return new Response(
      JSON.stringify({
        success: true,
        interactions: [],
        warnings: []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }

  const interactions = checkDrugInteractions(medications)

  return new Response(
    JSON.stringify({
      success: true,
      interactions: interactions.interactions,
      warnings: interactions.warnings
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  )
}

// 評估風險
async function assessRisk(supabaseClient: any, data: any) {
  console.log('⚠️ Assessing risk')
  
  const { symptoms, vitalSigns, pastHistory, age } = data

  const riskAssessment = performRiskAssessment(symptoms, vitalSigns, pastHistory, age)

  return new Response(
    JSON.stringify({
      success: true,
      risk_assessment: riskAssessment
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
    .rpc('get_medical_record_stats', { p_company_id: data.companyId })

  if (error) throw error

  // 獲取最近記錄
  const { data: recentRecords } = await supabaseClient
    .from('medical_records')
    .select('id, record_number, patient_name, visit_date, doctor_name, chief_complaint, status')
    .eq('company_id', data.companyId)
    .order('visit_date', { ascending: false })
    .limit(10)

  return new Response(
    JSON.stringify({
      success: true,
      stats: stats[0] || {},
      recent_records: recentRecords || []
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  )
}

// 搜尋病歷
async function searchRecords(supabaseClient: any, data: any) {
  console.log('🔎 Searching records:', data.searchTerm)
  
  const { data: results, error } = await supabaseClient
    .rpc('search_medical_records', {
      p_company_id: data.companyId,
      p_search_term: data.searchTerm,
      p_limit: data.limit || 20
    })

  if (error) throw error

  return new Response(
    JSON.stringify({
      success: true,
      results: results || [],
      count: results?.length || 0
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  )
}

// ==================== AI 分析函數 ====================

function performComprehensiveAnalysis(record: any): AIAnalysisResult {
  const symptoms = record.symptoms || []
  const vitalSigns = record.vital_signs || {}
  const pastHistory = record.past_history || []
  
  // 生成摘要
  const summary = `患者 ${record.patient_name}（${record.patient_age}歲，${record.patient_gender === 'male' ? '男' : '女'}）` +
    `因「${record.chief_complaint}」就診。` +
    (symptoms.length > 0 ? `主要症狀包括：${symptoms.slice(0, 3).join('、')}。` : '') +
    (Object.keys(vitalSigns).length > 0 ? `生命體征：${formatVitalSigns(vitalSigns)}。` : '')

  // 提取關鍵點
  const keyPoints = extractKeyPoints(record)

  // 症狀分析
  const symptomAnalysis = analyzeSymptoms(symptoms, vitalSigns)

  // 診斷建議
  const diagnosisSuggestions = generateDiagnosisSuggestions(symptoms, vitalSigns, record.patient_age)

  // 風險因素
  const riskFactors = identifyRiskFactors(symptoms, vitalSigns, pastHistory, record.patient_age)

  // 風險等級
  const riskLevel = calculateRiskLevel(riskFactors, symptoms, vitalSigns)

  // 治療建議
  const treatmentRecommendations = generateTreatmentRecommendations(diagnosisSuggestions, riskLevel)

  // 追蹤建議
  const followUpSuggestions = generateFollowUpSuggestions(riskLevel, diagnosisSuggestions)

  // 信心度
  const confidenceScore = calculateConfidenceScore(symptoms, vitalSigns, record)

  return {
    summary,
    keyPoints,
    symptomAnalysis,
    diagnosisSuggestions,
    riskFactors,
    riskLevel,
    treatmentRecommendations,
    followUpSuggestions,
    confidenceScore
  }
}

function formatVitalSigns(vitalSigns: any): string {
  const parts: string[] = []
  if (vitalSigns.bloodPressure) parts.push(`血壓 ${vitalSigns.bloodPressure}`)
  if (vitalSigns.heartRate) parts.push(`心率 ${vitalSigns.heartRate} bpm`)
  if (vitalSigns.temperature) parts.push(`體溫 ${vitalSigns.temperature}°C`)
  if (vitalSigns.respiratoryRate) parts.push(`呼吸 ${vitalSigns.respiratoryRate}/min`)
  return parts.join('、')
}

function extractKeyPoints(record: any): string[] {
  const points: string[] = []
  
  if (record.chief_complaint) {
    points.push(`主訴：${record.chief_complaint}`)
  }
  
  if (record.symptoms && record.symptoms.length > 0) {
    points.push(`症狀：${record.symptoms.slice(0, 5).join('、')}`)
  }
  
  if (record.past_history && record.past_history.length > 0) {
    points.push(`病史：${record.past_history.join('、')}`)
  }
  
  if (record.vital_signs) {
    points.push(`生命體征：${formatVitalSigns(record.vital_signs)}`)
  }
  
  return points
}

function analyzeSymptoms(symptoms: string[], vitalSigns: any): any {
  const analysis: any = {
    total_symptoms: symptoms.length,
    severity: 'mild',
    categories: []
  }

  // 按類別分析症狀
  const respiratorySymptoms = symptoms.filter(s => 
    s.includes('咳嗽') || s.includes('呼吸') || s.includes('胸悶')
  )
  if (respiratorySymptoms.length > 0) {
    analysis.categories.push({ category: '呼吸系統', symptoms: respiratorySymptoms })
  }

  const cardiovascularSymptoms = symptoms.filter(s => 
    s.includes('心悸') || s.includes('胸痛') || s.includes('心跳')
  )
  if (cardiovascularSymptoms.length > 0) {
    analysis.categories.push({ category: '心血管系統', symptoms: cardiovascularSymptoms })
  }

  const digestiveSymptoms = symptoms.filter(s => 
    s.includes('腹痛') || s.includes('噁心') || s.includes('嘔吐') || s.includes('腹瀉')
  )
  if (digestiveSymptoms.length > 0) {
    analysis.categories.push({ category: '消化系統', symptoms: digestiveSymptoms })
  }

  // 判定嚴重程度
  if (symptoms.length >= 5 || 
      symptoms.some(s => s.includes('劇烈') || s.includes('嚴重') || s.includes('昏厥'))) {
    analysis.severity = 'severe'
  } else if (symptoms.length >= 3) {
    analysis.severity = 'moderate'
  }

  return analysis
}

function generateDiagnosisSuggestions(symptoms: string[], vitalSigns: any, age: number): string[] {
  const suggestions: string[] = []

  // 基於症狀的初步診斷建議
  if (symptoms.some(s => s.includes('發燒') || s.includes('咳嗽') || s.includes('喉嚨痛'))) {
    suggestions.push('上呼吸道感染')
  }

  if (symptoms.some(s => s.includes('腹痛') || s.includes('腹瀉')) && symptoms.some(s => s.includes('嘔吐'))) {
    suggestions.push('急性胃腸炎')
  }

  if (symptoms.some(s => s.includes('頭痛') || s.includes('頭暈')) && 
      vitalSigns?.bloodPressure && parseInt(vitalSigns.bloodPressure.split('/')[0]) > 140) {
    suggestions.push('高血壓相關症狀')
  }

  if (symptoms.some(s => s.includes('胸痛') || s.includes('呼吸困難'))) {
    if (age > 50) {
      suggestions.push('需排除心血管疾病')
    }
    suggestions.push('需排除肺部疾病')
  }

  if (symptoms.some(s => s.includes('疲勞') || s.includes('無力')) && symptoms.length < 3) {
    suggestions.push('過度勞累')
    suggestions.push('建議檢查甲狀腺功能')
  }

  // 如果沒有明確建議，給出通用建議
  if (suggestions.length === 0) {
    suggestions.push('需進一步檢查以確定診斷')
    suggestions.push('建議完善相關檢驗')
  }

  return suggestions
}

function identifyRiskFactors(symptoms: string[], vitalSigns: any, pastHistory: string[], age: number): string[] {
  const riskFactors: string[] = []

  // 年齡相關風險
  if (age > 65) {
    riskFactors.push('高齡患者')
  }

  // 生命體征異常
  if (vitalSigns?.bloodPressure) {
    const [systolic, diastolic] = vitalSigns.bloodPressure.split('/').map((v: string) => parseInt(v))
    if (systolic >= 140 || diastolic >= 90) {
      riskFactors.push('血壓偏高')
    }
  }

  if (vitalSigns?.heartRate) {
    const hr = parseInt(vitalSigns.heartRate)
    if (hr > 100 || hr < 60) {
      riskFactors.push('心率異常')
    }
  }

  if (vitalSigns?.temperature) {
    const temp = parseFloat(vitalSigns.temperature)
    if (temp >= 38.5) {
      riskFactors.push('高燒')
    }
  }

  // 既往病史
  if (pastHistory && pastHistory.length > 0) {
    if (pastHistory.some(h => h.includes('糖尿病'))) {
      riskFactors.push('糖尿病病史')
    }
    if (pastHistory.some(h => h.includes('高血壓'))) {
      riskFactors.push('高血壓病史')
    }
    if (pastHistory.some(h => h.includes('心臟'))) {
      riskFactors.push('心臟病史')
    }
  }

  // 症狀相關風險
  if (symptoms.some(s => s.includes('胸痛') || s.includes('呼吸困難'))) {
    riskFactors.push('有心肺症狀')
  }

  return riskFactors
}

function calculateRiskLevel(riskFactors: string[], symptoms: string[], vitalSigns: any): string {
  let riskScore = 0

  // 風險因素評分
  riskScore += riskFactors.length * 10

  // 症狀嚴重程度
  if (symptoms.some(s => s.includes('劇烈') || s.includes('嚴重'))) {
    riskScore += 30
  }
  if (symptoms.length >= 5) {
    riskScore += 20
  }

  // 生命體征異常
  if (vitalSigns?.temperature && parseFloat(vitalSigns.temperature) >= 39) {
    riskScore += 20
  }
  if (vitalSigns?.bloodPressure) {
    const systolic = parseInt(vitalSigns.bloodPressure.split('/')[0])
    if (systolic >= 180) {
      riskScore += 30
    }
  }

  // 判定風險等級
  if (riskScore >= 60) return 'critical'
  if (riskScore >= 40) return 'high'
  if (riskScore >= 20) return 'moderate'
  return 'low'
}

function generateTreatmentRecommendations(diagnosisSuggestions: string[], riskLevel: string): string[] {
  const recommendations: string[] = []

  if (riskLevel === 'critical' || riskLevel === 'high') {
    recommendations.push('建議立即住院觀察治療')
    recommendations.push('需密切監測生命體征')
  }

  if (diagnosisSuggestions.some(d => d.includes('感染'))) {
    recommendations.push('考慮使用抗生素治療')
    recommendations.push('多休息，多飲水')
  }

  if (diagnosisSuggestions.some(d => d.includes('高血壓'))) {
    recommendations.push('血壓管理，低鹽飲食')
    recommendations.push('評估是否需要調整降壓藥物')
  }

  if (diagnosisSuggestions.some(d => d.includes('胃腸炎'))) {
    recommendations.push('清淡飲食，避免油膩')
    recommendations.push('補充電解質')
  }

  if (recommendations.length === 0) {
    recommendations.push('對症治療')
    recommendations.push('注意休息')
    recommendations.push('如症狀加重請及時就醫')
  }

  return recommendations
}

function generateFollowUpSuggestions(riskLevel: string, diagnosisSuggestions: string[]): string[] {
  const suggestions: string[] = []

  if (riskLevel === 'critical' || riskLevel === 'high') {
    suggestions.push('24-48 小時內複診')
    suggestions.push('如症狀惡化立即回診')
  } else if (riskLevel === 'moderate') {
    suggestions.push('3-7 天後複診')
    suggestions.push('注意觀察症狀變化')
  } else {
    suggestions.push('如症狀未改善，1-2 週後複診')
  }

  if (diagnosisSuggestions.some(d => d.includes('檢查'))) {
    suggestions.push('安排相關檢驗檢查')
    suggestions.push('檢查結果出來後返診')
  }

  return suggestions
}

function calculateConfidenceScore(symptoms: string[], vitalSigns: any, record: any): number {
  let score = 50 // 基礎分數

  // 有完整症狀描述
  if (symptoms && symptoms.length >= 3) score += 15
  
  // 有生命體征
  if (vitalSigns && Object.keys(vitalSigns).length >= 3) score += 15
  
  // 有病史資料
  if (record.past_history && record.past_history.length > 0) score += 10
  
  // 有體格檢查
  if (record.physical_examination) score += 10

  return Math.min(100, score)
}

function generateRecordSummary(record: any): string {
  let summary = `【病歷摘要】\n`
  summary += `患者：${record.patient_name}（${record.patient_age}歲，${record.patient_gender === 'male' ? '男性' : '女性'}）\n`
  summary += `就診日期：${new Date(record.visit_date).toLocaleDateString('zh-TW')}\n`
  summary += `主訴：${record.chief_complaint}\n`
  
  if (record.symptoms && record.symptoms.length > 0) {
    summary += `症狀：${record.symptoms.join('、')}\n`
  }
  
  if (record.vital_signs) {
    summary += `生命體征：${formatVitalSigns(record.vital_signs)}\n`
  }
  
  if (record.diagnosis) {
    summary += `診斷：${record.diagnosis}\n`
  }
  
  if (record.treatment_plan) {
    summary += `治療計劃：${record.treatment_plan}\n`
  }

  return summary
}

function performDiagnosisReasoning(symptoms: string[], vitalSigns: any, age: number, gender: string): any[] {
  const suggestions = generateDiagnosisSuggestions(symptoms, vitalSigns, age)
  
  return suggestions.map((suggestion, index) => ({
    diagnosis: suggestion,
    confidence: 85 - (index * 10),
    reasoning: `基於症狀分析和患者年齡、性別等因素`,
    icd_code: null
  }))
}

function checkDrugInteractions(medications: any[]): any {
  // 簡化版藥物交互檢查
  const interactions: any[] = []
  const warnings: string[] = []

  if (medications.length > 3) {
    warnings.push('同時使用多種藥物，請注意可能的交互作用')
  }

  return { interactions, warnings }
}

function performRiskAssessment(symptoms: string[], vitalSigns: any, pastHistory: string[], age: number): any {
  const riskFactors = identifyRiskFactors(symptoms, vitalSigns, pastHistory, age)
  const riskLevel = calculateRiskLevel(riskFactors, symptoms, vitalSigns)

  return {
    risk_level: riskLevel,
    risk_factors: riskFactors,
    risk_score: riskFactors.length * 10 + (symptoms.length * 5),
    recommendations: riskLevel === 'high' || riskLevel === 'critical' 
      ? ['建議立即就醫', '密切監測'] 
      : ['注意觀察', '如症狀加重請就醫']
  }
}


