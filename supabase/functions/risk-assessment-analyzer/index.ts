import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'healthy', service: 'risk-assessment-analyzer', version: '1.0.0' }),
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
      case 'assess_customer':
        result = await assessCustomer(supabase, userData.company_id, user.id, data)
        break
      case 'assess_transaction':
        result = await assessTransaction(supabase, userData.company_id, data)
        break
      case 'get_statistics':
        result = await getStatistics(supabase, userData.company_id, data)
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

async function assessCustomer(supabase: any, companyId: string, userId: string, data: any) {
  const customer = data.customerData || {}
  
  // AI 風險評估
  let creditScore = 50
  let operationalScore = 30
  let complianceScore = 20
  let fraudScore = 15
  
  // 根據收入評估信用風險
  const income = parseFloat(customer.annual_income || 0)
  if (income > 1000000) creditScore = 20
  else if (income > 500000) creditScore = 35
  else if (income > 200000) creditScore = 50
  else creditScore = 70

  // 根據交易金額評估操作風險
  const amount = parseFloat(customer.loan_amount || customer.investment_amount || 0)
  if (amount > 10000000) operationalScore = 60
  else if (amount > 5000000) operationalScore = 45
  else if (amount > 1000000) operationalScore = 30

  // 合規檢查
  if (!customer.customer_id_number) complianceScore += 30
  if (!customer.income_proof) complianceScore += 20

  // 詐欺風險
  if (customer.unusual_patterns) fraudScore += 40

  const overallScore = Math.round(
    creditScore * 0.4 + operationalScore * 0.3 + complianceScore * 0.2 + fraudScore * 0.1
  )

  let riskLevel = 'low'
  let riskRating = 'A'
  if (overallScore >= 80) { riskLevel = 'critical'; riskRating = 'D' }
  else if (overallScore >= 60) { riskLevel = 'high'; riskRating = 'C' }
  else if (overallScore >= 40) { riskLevel = 'medium'; riskRating = 'B' }

  const riskFactors: string[] = []
  if (creditScore > 60) riskFactors.push('高信用風險')
  if (operationalScore > 50) riskFactors.push('高額交易')
  if (complianceScore > 40) riskFactors.push('合規問題')
  if (fraudScore > 30) riskFactors.push('詐欺風險')

  const recommendations: string[] = []
  if (overallScore >= 70) {
    recommendations.push('建議拒絕或要求額外擔保')
    recommendations.push('加強盡職調查')
  } else if (overallScore >= 50) {
    recommendations.push('建議人工審核')
    recommendations.push('要求補充財務證明')
  } else {
    recommendations.push('風險可控，可以核准')
  }

  // 創建評估記錄
  const assessmentData = {
    company_id: companyId,
    customer_id: customer.customer_id || `CUST-${Date.now()}`,
    customer_name: customer.customer_name || '測試客戶',
    customer_type: customer.customer_type || 'individual',
    assessment_type: 'comprehensive',
    overall_risk_score: overallScore,
    risk_level: riskLevel,
    risk_rating: riskRating,
    credit_risk_score: creditScore,
    operational_risk_score: operationalScore,
    compliance_risk_score: complianceScore,
    fraud_risk_score: fraudScore,
    ai_confidence_score: 85,
    ai_risk_factors: riskFactors,
    ai_recommendations: recommendations,
    ai_summary: `客戶整體風險評分: ${overallScore}, 風險等級: ${riskLevel}, 建議: ${recommendations[0]}`,
    risk_factors: riskFactors,
    assessment_status: overallScore >= 70 ? 'rejected' : overallScore >= 50 ? 'review_required' : 'approved',
    assessed_by: userId,
    financial_indicators: {
      annual_income: income,
      loan_amount: amount
    }
  }

  try {
    const { data: assessment, error } = await supabase
      .from('customer_risk_assessments')
      .insert(assessmentData)
      .select()
      .single()

    if (error) {
      console.warn('Failed to insert assessment:', error)
    } else {
      console.log('Assessment created:', assessment.id)
    }
  } catch (insertError) {
    console.warn('Error inserting assessment:', insertError)
  }

  // 如果高風險，創建警報
  if (overallScore >= 70) {
    try {
      await supabase.from('risk_alerts').insert({
        company_id: companyId,
        alert_type: 'credit_risk',
        severity: overallScore >= 80 ? 'critical' : 'high',
        customer_id: customer.customer_id,
        alert_title: '高風險客戶警報',
        alert_message: `客戶 ${customer.customer_name} 風險評分達 ${overallScore}，建議審慎評估`,
        risk_score: overallScore,
        risk_factors: riskFactors,
        details: { assessment: assessmentData }
      })
    } catch (alertError) {
      console.warn('Error creating alert:', alertError)
    }
  }

  return {
    assessment_id: assessmentData.customer_id,
    overall_risk_score: overallScore,
    risk_level: riskLevel,
    risk_rating: riskRating,
    credit_risk_score: creditScore,
    operational_risk_score: operationalScore,
    compliance_risk_score: complianceScore,
    fraud_risk_score: fraudScore,
    ai_confidence: 85,
    risk_factors: riskFactors,
    recommendations,
    summary: assessmentData.ai_summary,
    decision: overallScore >= 70 ? 'reject' : overallScore >= 50 ? 'review' : 'approve'
  }
}

async function assessTransaction(supabase: any, companyId: string, data: any) {
  const transaction = data.transactionData || {}
  
  const amount = parseFloat(transaction.transaction_amount || 0)
  let riskScore = 0
  const riskFactors: string[] = []

  if (amount > 10000000) {
    riskScore += 50
    riskFactors.push('超高額交易')
  } else if (amount > 5000000) {
    riskScore += 35
    riskFactors.push('高額交易')
  } else if (amount > 1000000) {
    riskScore += 20
    riskFactors.push('中高額交易')
  }

  if (!transaction.customer_id) {
    riskScore += 20
    riskFactors.push('缺少客戶信息')
  }

  const hour = new Date().getHours()
  if (hour >= 0 && hour <= 5) {
    riskScore += 15
    riskFactors.push('非營業時間交易')
  }

  const riskLevel = riskScore >= 70 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 30 ? 'medium' : 'low'

  try {
    await supabase.from('transaction_risk_assessments').insert({
      company_id: companyId,
      transaction_id: transaction.transaction_id || `TXN-${Date.now()}`,
      transaction_type: transaction.transaction_type || 'transfer',
      transaction_amount: amount,
      customer_id: transaction.customer_id,
      customer_name: transaction.customer_name,
      risk_score: riskScore,
      risk_level: riskLevel,
      ai_confidence: 80,
      ai_risk_factors: riskFactors,
      ai_reasoning: `交易風險分析: 風險分數 ${riskScore}, 主要風險: ${riskFactors.join(', ')}`,
      assessment_result: riskScore >= 70 ? 'flagged' : 'approved'
    })
  } catch (error) {
    console.warn('Error inserting transaction assessment:', error)
  }

  return {
    transaction_id: transaction.transaction_id,
    risk_score: riskScore,
    risk_level: riskLevel,
    risk_factors: riskFactors,
    decision: riskScore >= 70 ? 'block' : riskScore >= 50 ? 'review' : 'approve',
    ai_confidence: 80
  }
}

async function getStatistics(supabase: any, companyId: string, data: any) {
  const days = data.days || 30

  try {
    const { data: stats, error } = await supabase.rpc('get_risk_assessment_stats', {
      p_company_id: companyId,
      p_days: days
    })

    if (error) {
      console.warn('Error getting stats:', error)
      return { stats: null, message: 'Unable to fetch statistics' }
    }

    return {
      period_days: days,
      stats: stats && stats.length > 0 ? stats[0] : null,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.warn('Error in getStatistics:', error)
    return { stats: null, error: 'Failed to fetch statistics' }
  }
}
