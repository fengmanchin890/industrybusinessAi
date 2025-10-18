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
      JSON.stringify({ status: 'healthy', service: 'drug-management-ai', version: '1.0.0' }),
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
      case 'check_prescription':
        result = await checkPrescription(supabase, userData.company_id, data)
        break
      case 'check_interactions':
        result = await checkInteractions(supabase, data)
        break
      case 'validate_dosage':
        result = await validateDosage(supabase, data)
        break
      case 'get_statistics':
        result = await getStatistics(supabase, userData.company_id, data)
        break
      case 'check_allergies':
        result = await checkAllergies(supabase, data)
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

// AI 檢查處方
async function checkPrescription(supabase: any, companyId: string, data: any) {
  const { prescriptionId, patientInfo, prescriptionItems } = data
  
  console.log('Checking prescription:', prescriptionId)
  
  const warnings = []
  const recommendations = []
  let riskScore = 0
  
  // 獲取處方中的所有藥物
  const drugIds = prescriptionItems.map((item: any) => item.drug_id)
  
  // 獲取藥物詳細信息
  const { data: drugs, error: drugsError } = await supabase
    .from('drugs')
    .select('*')
    .in('id', drugIds)
  
  if (drugsError) throw drugsError
  
  // 檢查藥物相互作用
  if (drugs.length > 1) {
    riskScore += 15
    warnings.push({
      type: 'interaction',
      severity: 'moderate',
      message: '處方包含多種藥物，請檢查可能的相互作用',
      drugs: drugs.map((d: any) => d.drug_name)
    })
  }
  
  // 檢查過敏
  if (patientInfo.allergies && patientInfo.allergies.length > 0) {
    drugs.forEach((drug: any) => {
      const allergyMatch = patientInfo.allergies.some((allergy: string) =>
        drug.drug_name.toLowerCase().includes(allergy.toLowerCase()) ||
        drug.generic_name?.toLowerCase().includes(allergy.toLowerCase())
      )
      
      if (allergyMatch) {
        riskScore += 50
        warnings.push({
          type: 'allergy',
          severity: 'critical',
          message: `患者對 ${drug.drug_name} 可能過敏`,
          drugs: [drug.drug_name]
        })
      }
    })
  }
  
  // 檢查劑量
  prescriptionItems.forEach((item: any) => {
    const drug = drugs.find((d: any) => d.id === item.drug_id)
    if (!drug) return
    
    // 簡化的劑量檢查
    const quantity = parseInt(item.quantity) || 0
    const durationDays = parseInt(item.duration_days) || 1
    const dailyDose = quantity / durationDays
    
    if (dailyDose > 10) { // 簡化邏輯
      riskScore += 20
      warnings.push({
        type: 'overdose',
        severity: 'high',
        message: `${drug.drug_name} 劑量可能過高`,
        drugs: [drug.drug_name]
      })
    }
    
    // 檢查管制藥品
    if (drug.controlled_substance) {
      warnings.push({
        type: 'controlled',
        severity: 'moderate',
        message: `${drug.drug_name} 為管制藥品，需要特別管控`,
        drugs: [drug.drug_name]
      })
    }
  })
  
  // 檢查患者年齡
  if (patientInfo.age) {
    if (patientInfo.age < 12) {
      riskScore += 10
      recommendations.push('兒童用藥需特別注意劑量調整')
    } else if (patientInfo.age > 65) {
      riskScore += 10
      recommendations.push('老年患者用藥需特別注意副作用')
    }
  }
  
  // 生成建議
  if (riskScore < 20) {
    recommendations.push('處方安全性良好')
  } else if (riskScore < 50) {
    recommendations.push('建議審查處方，注意患者監測')
  } else {
    recommendations.push('建議醫師重新評估處方')
  }
  
  // 儲存警示記錄
  if (warnings.length > 0 && prescriptionId) {
    for (const warning of warnings) {
      try {
        await supabase.from('drug_alerts').insert({
          company_id: companyId,
          prescription_id: prescriptionId,
          alert_type: warning.type,
          severity: warning.severity,
          message: warning.message,
          drugs_involved: drugIds,
          recommendations
        })
      } catch (e) {
        console.warn('Error saving alert:', e)
      }
    }
  }
  
  return {
    prescription_id: prescriptionId,
    risk_score: Math.min(100, riskScore),
    risk_level: riskScore < 20 ? 'low' : riskScore < 50 ? 'moderate' : 'high',
    warnings,
    recommendations,
    ai_checked: true,
    total_warnings: warnings.length,
    critical_warnings: warnings.filter((w: any) => w.severity === 'critical').length
  }
}

// 檢查藥物相互作用
async function checkInteractions(supabase: any, data: any) {
  const { drugIds } = data
  
  if (!drugIds || drugIds.length < 2) {
    return {
      has_interactions: false,
      interactions: [],
      message: '需要至少兩種藥物來檢查相互作用'
    }
  }
  
  // 獲取藥物信息
  const { data: drugs } = await supabase
    .from('drugs')
    .select('*')
    .in('id', drugIds)
  
  const interactions = []
  
  // 簡化的相互作用檢查
  if (drugs && drugs.length > 1) {
    // 檢查抗生素 + 其他藥物
    const hasAntibiotic = drugs.some((d: any) => d.drug_category === 'antibiotic')
    const hasPainkiller = drugs.some((d: any) => d.drug_category === 'painkiller')
    
    if (hasAntibiotic && hasPainkiller) {
      interactions.push({
        severity: 'moderate',
        message: '抗生素與止痛藥可能影響藥效',
        recommendation: '建議分開服用，間隔至少2小時'
      })
    }
    
    // 通用警告
    if (drugs.length >= 3) {
      interactions.push({
        severity: 'moderate',
        message: '多種藥物併用可能增加副作用風險',
        recommendation: '建議密切監測患者反應'
      })
    }
  }
  
  return {
    has_interactions: interactions.length > 0,
    total_drugs: drugs?.length || 0,
    interactions,
    drugs_checked: drugs?.map((d: any) => ({
      id: d.id,
      name: d.drug_name,
      category: d.drug_category
    }))
  }
}

// 驗證劑量
async function validateDosage(supabase: any, data: any) {
  const { drugId, quantity, durationDays, patientWeight, patientAge } = data
  
  // 獲取藥物信息
  const { data: drug } = await supabase
    .from('drugs')
    .select('*')
    .eq('id', drugId)
    .single()
  
  if (!drug) throw new Error('Drug not found')
  
  const dailyDose = quantity / (durationDays || 1)
  const warnings = []
  let isValid = true
  
  // 簡化的劑量驗證
  if (dailyDose > 10) {
    isValid = false
    warnings.push({
      type: 'overdose',
      message: '劑量可能過高，請重新評估'
    })
  }
  
  if (patientAge && patientAge < 12) {
    warnings.push({
      type: 'pediatric',
      message: '兒童用藥需要特別注意劑量調整'
    })
  }
  
  if (patientWeight && patientWeight < 30) {
    warnings.push({
      type: 'low_weight',
      message: '體重較輕，建議根據體重調整劑量'
    })
  }
  
  return {
    drug_id: drugId,
    drug_name: drug.drug_name,
    is_valid: isValid && warnings.length === 0,
    daily_dose: dailyDose,
    warnings,
    recommendations: isValid ? 
      ['劑量在安全範圍內'] : 
      ['建議醫師重新評估劑量', '考慮患者個體差異']
  }
}

// 檢查過敏
async function checkAllergies(supabase: any, data: any) {
  const { drugIds, patientAllergies } = data
  
  if (!patientAllergies || patientAllergies.length === 0) {
    return {
      has_allergies: false,
      message: '患者無已知過敏史'
    }
  }
  
  const { data: drugs } = await supabase
    .from('drugs')
    .select('*')
    .in('id', drugIds)
  
  const allergyMatches = []
  
  drugs?.forEach((drug: any) => {
    patientAllergies.forEach((allergy: string) => {
      if (drug.drug_name.toLowerCase().includes(allergy.toLowerCase()) ||
          drug.generic_name?.toLowerCase().includes(allergy.toLowerCase())) {
        allergyMatches.push({
          drug: drug.drug_name,
          allergy,
          severity: 'critical',
          message: `患者對 ${drug.drug_name} 可能過敏`
        })
      }
    })
  })
  
  return {
    has_allergies: allergyMatches.length > 0,
    allergy_matches: allergyMatches,
    recommendation: allergyMatches.length > 0 ? 
      '請停止使用致敏藥物並尋找替代藥物' : 
      '未檢測到已知過敏藥物'
  }
}

// 獲取統計
async function getStatistics(supabase: any, companyId: string, data: any) {
  try {
    const { data: stats, error } = await supabase.rpc('get_drug_stats', {
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


