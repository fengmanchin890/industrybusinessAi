import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface AnalysisRequest {
  action: 'analyze_transaction' | 'analyze_pattern' | 'evaluate_risk' | 'generate_report' | 'detect_anomalies'
  data: {
    transactionId?: string
    userId?: string
    transactions?: any[]
    startDate?: string
    endDate?: string
    transaction?: any // Allow passing transaction data directly
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
        service: 'fraud-detection-analyzer',
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
      case 'analyze_transaction':
        result = await analyzeTransaction(supabase, userData.company_id, data)
        break
      case 'analyze_pattern':
        result = await analyzePattern(supabase, userData.company_id, data)
        break
      case 'evaluate_risk':
        result = await evaluateRisk(supabase, userData.company_id, data)
        break
      case 'generate_report':
        result = await generateReport(supabase, userData.company_id, data)
        break
      case 'detect_anomalies':
        result = await detectAnomalies(supabase, userData.company_id, data)
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

async function analyzeTransaction(supabase: any, companyId: string, data: any) {
  const { transactionId, transaction: providedTransaction } = data

  console.log('Received data:', { 
    hasTransactionId: !!transactionId, 
    hasProvidedTransaction: !!providedTransaction,
    transactionKeys: providedTransaction ? Object.keys(providedTransaction) : []
  })

  let transaction
  let isSimulated = false

  // If transaction data is provided directly, use it (for simulated/real-time transactions)
  if (providedTransaction && Object.keys(providedTransaction).length > 0) {
    transaction = providedTransaction
    isSimulated = true
    console.log('Using provided transaction data (simulated or real-time)')
  } else if (transactionId) {
    // Otherwise, fetch from database (for stored transactions)
    console.log('Fetching transaction from database:', transactionId)
    const { data: dbTransaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('company_id', companyId)
      .single()

    if (fetchError) {
      console.error('Database fetch error:', fetchError)
      throw new Error(`Transaction not found in database: ${fetchError.message}`)
    }
    
    if (!dbTransaction) {
      throw new Error('Transaction not found in database')
    }
    
    transaction = dbTransaction
    console.log('Transaction fetched from database')
  } else {
    console.error('No transaction data or ID provided')
    throw new Error('Transaction ID or transaction data is required')
  }

  // 基礎風險評分計算
  let riskScore = 0
  const riskFactors: string[] = []

  // Convert amount to number if it's a string
  const amount = typeof transaction.amount === 'string' ? 
    parseFloat(transaction.amount) : transaction.amount

  if (isNaN(amount)) {
    console.error('Invalid amount:', transaction.amount)
    throw new Error('Invalid transaction amount')
  }

  // 金額異常檢查
  if (amount > 100000) {
    riskScore += 50
    riskFactors.push('超高額交易')
  } else if (amount > 50000) {
    riskScore += 30
    riskFactors.push('高額交易')
  }

  // IP 地理位置檢查 (Check for both 'Taiwan' and 'TW')
  const country = transaction.location?.country || ''
  if (country && country !== 'Taiwan' && country !== 'TW') {
    riskScore += 20
    riskFactors.push('異常地理位置')
  }

  // 時間檢查 (凌晨交易)
  try {
    const transactionTime = transaction.transaction_time || transaction.timestamp
    if (transactionTime) {
      const hour = new Date(transactionTime).getHours()
      if (!isNaN(hour) && hour >= 0 && hour <= 5) {
        riskScore += 15
        riskFactors.push('非營業時間交易')
      }
    }
  } catch (timeError) {
    console.warn('Error parsing transaction time:', timeError)
  }

  // 獲取用戶歷史行為 (with error handling)
  try {
    const { data: userProfile, error: profileError } = await supabase
      .from('user_behavior_profiles')
      .select('*')
      .eq('user_id', transaction.user_id)
      .eq('company_id', companyId)
      .single()

    if (!profileError && userProfile) {
      // 與正常行為比較
      const typicalAmount = parseFloat(userProfile.typical_transaction_amount || 0)
      if (amount > typicalAmount * 3) {
        riskScore += 25
        riskFactors.push('金額遠超常規')
      }
    } else {
      riskScore += 10
      riskFactors.push('新用戶無歷史記錄')
    }
  } catch (profileError) {
    console.warn('Error fetching user profile:', profileError)
    riskScore += 10
    riskFactors.push('新用戶無歷史記錄')
  }

  // 檢查短時間內的多筆交易 (with error handling)
  try {
    const { data: recentTransactions, error: recentError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', transaction.user_id)
      .eq('company_id', companyId)
      .gte('transaction_time', new Date(Date.now() - 3600000).toISOString())
      .order('transaction_time', { ascending: false })

    if (!recentError && recentTransactions && recentTransactions.length > 5) {
      riskScore += 20
      riskFactors.push('短時間內頻繁交易')
    }
  } catch (recentError) {
    console.warn('Error fetching recent transactions:', recentError)
  }

  const fraudProbability = Math.min(riskScore, 100)
  const isSuspicious = fraudProbability > 70

  console.log('Risk analysis complete:', {
    riskScore,
    fraudProbability,
    isSuspicious,
    isSimulated,
    riskFactors
  })

  // 更新交易風險分數 (only if transaction exists in DB, not for simulated transactions)
  if (transactionId && !isSimulated) {
    console.log('Updating transaction in database...')
    try {
      await supabase
        .from('transactions')
        .update({
          risk_score: riskScore,
          fraud_probability: fraudProbability,
          transaction_status: isSuspicious ? 'flagged' : transaction.transaction_status,
          flagged_reason: isSuspicious ? riskFactors.join(', ') : null
        })
        .eq('id', transactionId)
      console.log('Transaction updated successfully')
    } catch (updateError) {
      console.warn('Error updating transaction:', updateError)
    }
  } else if (isSimulated) {
    console.log('Skipping database update for simulated transaction')
  }

  // 如果高風險，創建警報 (only if transaction exists in DB, not for simulated transactions)
  if (isSuspicious && transactionId && !isSimulated) {
    console.log('Creating fraud alert...')
    try {
      await supabase
        .from('fraud_alerts')
        .insert({
          company_id: companyId,
          transaction_id: transactionId,
          alert_type: 'high_risk_transaction',
          severity: fraudProbability > 85 ? 'critical' : 'high',
          message: `檢測到高風險交易: ${riskFactors.join(', ')}`,
          details: {
            risk_score: riskScore,
            fraud_probability: fraudProbability,
            risk_factors: riskFactors,
            transaction_amount: amount
          },
          status: 'new'
        })
      console.log('Fraud alert created successfully')
    } catch (alertError) {
      console.warn('Error creating fraud alert:', alertError)
    }
  } else if (isSuspicious && isSimulated) {
    console.log('High risk detected in simulated transaction, but not creating DB alert')
  }

  return {
    transaction_id: transaction.id || transactionId,
    risk_assessment: {
      risk_score: Math.round(riskScore),
      fraud_probability: Math.round(fraudProbability),
      risk_level: fraudProbability > 70 ? 'high' : fraudProbability > 40 ? 'medium' : 'low',
      is_suspicious: isSuspicious
    },
    risk_factors: riskFactors,
    recommendations: isSuspicious ? [
      '建議人工審核此交易',
      '聯繫客戶確認交易真實性',
      '暫時凍結相關帳戶'
    ] : ['交易風險在可接受範圍內'],
    analysis: {
      summary: isSuspicious ? 
        `此交易被標記為高風險，風險分數: ${Math.round(riskScore)}分` : 
        '交易正常，無明顯詐欺跡象',
      detailed_factors: riskFactors.map(factor => ({
        factor,
        impact: 'high'
      }))
    }
  }
}

async function analyzePattern(supabase: any, companyId: string, data: any) {
  const { userId, startDate, endDate } = data

  const query = supabase
    .from('transactions')
    .select('*')
    .eq('company_id', companyId)
    .order('transaction_time', { ascending: false })
    .limit(100)

  if (userId) {
    query.eq('user_id', userId)
  }
  if (startDate) {
    query.gte('transaction_time', startDate)
  }
  if (endDate) {
    query.lte('transaction_time', endDate)
  }

  const { data: transactions } = await query

  if (!transactions || transactions.length === 0) {
    return {
      patterns: [],
      anomalies: [],
      message: '沒有足夠的數據進行模式分析'
    }
  }

  const patterns: any[] = []
  const anomalies: any[] = []

  // 分析交易時間模式
  const hourDistribution: { [key: number]: number } = {}
  transactions.forEach(t => {
    const hour = new Date(t.transaction_time).getHours()
    hourDistribution[hour] = (hourDistribution[hour] || 0) + 1
  })

  const maxHour = Object.entries(hourDistribution).reduce((a, b) => a[1] > b[1] ? a : b)
  patterns.push({
    type: 'time_pattern',
    description: `最常交易時段: ${maxHour[0]}:00 - ${parseInt(maxHour[0]) + 1}:00`,
    frequency: maxHour[1]
  })

  // 分析金額模式
  const amounts = transactions.map(t => parseFloat(t.amount || 0))
  const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
  const maxAmount = Math.max(...amounts)

  patterns.push({
    type: 'amount_pattern',
    description: `平均交易金額: $${avgAmount.toFixed(2)}`,
    max_amount: maxAmount
  })

  // 檢測異常
  const highValueTransactions = transactions.filter(t => 
    parseFloat(t.amount || 0) > avgAmount * 3
  )
  
  if (highValueTransactions.length > 0) {
    anomalies.push({
      type: 'high_value',
      count: highValueTransactions.length,
      description: '檢測到異常高額交易',
      severity: 'medium'
    })
  }

  return {
    patterns,
    anomalies,
    statistics: {
      total_transactions: transactions.length,
      average_amount: Math.round(avgAmount * 100) / 100,
      highest_amount: maxAmount,
      flagged_count: transactions.filter(t => t.risk_score > 70).length
    }
  }
}

async function evaluateRisk(supabase: any, companyId: string, data: any) {
  const { userId } = data

  if (!userId) {
    throw new Error('User ID is required')
  }

  // 獲取用戶最近的交易
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .order('transaction_time', { ascending: false })
    .limit(50)

  if (!transactions || transactions.length === 0) {
    return {
      risk_level: 'low',
      risk_score: 0,
      message: '該用戶沒有交易記錄'
    }
  }

  let totalRiskScore = 0
  let flaggedCount = 0

  transactions.forEach(t => {
    totalRiskScore += parseFloat(t.risk_score || 0)
    if (t.is_fraudulent) {
      flaggedCount++
    }
  })

  const avgRiskScore = totalRiskScore / transactions.length
  const riskLevel = avgRiskScore > 70 ? 'high' : avgRiskScore > 40 ? 'medium' : 'low'

  // 更新或創建用戶行為檔案
  const { data: existingProfile } = await supabase
    .from('user_behavior_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .single()

  const amounts = transactions.map(t => parseFloat(t.amount || 0))
  const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length

  const profileData = {
    company_id: companyId,
    user_id: userId,
    typical_transaction_amount: avgAmount,
    typical_transaction_frequency: transactions.length,
    risk_level: riskLevel,
    profile_data: {
      avg_risk_score: avgRiskScore,
      flagged_transactions: flaggedCount,
      total_transactions: transactions.length
    }
  }

  if (existingProfile) {
    await supabase
      .from('user_behavior_profiles')
      .update(profileData)
      .eq('id', existingProfile.id)
  } else {
    await supabase
      .from('user_behavior_profiles')
      .insert(profileData)
  }

  return {
    user_id: userId,
    risk_level: riskLevel,
    risk_score: Math.round(avgRiskScore),
    statistics: {
      total_transactions: transactions.length,
      flagged_transactions: flaggedCount,
      average_amount: Math.round(avgAmount * 100) / 100,
      fraud_rate: ((flaggedCount / transactions.length) * 100).toFixed(2) + '%'
    },
    recommendations: riskLevel === 'high' ? [
      '建議加強帳戶監控',
      '要求額外的身份驗證',
      '限制單筆交易額度'
    ] : ['目前風險等級正常']
  }
}

async function generateReport(supabase: any, companyId: string, data: any) {
  const { startDate, endDate } = data

  // 使用統計函數
  const { data: stats } = await supabase
    .rpc('get_fraud_statistics', {
      p_company_id: companyId,
      p_days: 30
    })

  // 獲取最近的案例
  const { data: recentCases } = await supabase
    .from('fraud_cases')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(10)

  // 獲取活躍警報
  const { data: activeAlerts } = await supabase
    .from('fraud_alerts')
    .select('*')
    .eq('company_id', companyId)
    .in('status', ['new', 'investigating'])
    .order('created_at', { ascending: false })
    .limit(20)

  return {
    report_date: new Date().toISOString(),
    period: `Last 30 days`,
    statistics: stats && stats.length > 0 ? stats[0] : {},
    recent_cases: recentCases || [],
    active_alerts: activeAlerts || [],
    summary: {
      total_alerts: activeAlerts?.length || 0,
      open_cases: recentCases?.filter(c => c.case_status === 'open').length || 0,
      critical_alerts: activeAlerts?.filter(a => a.severity === 'critical').length || 0
    }
  }
}

async function detectAnomalies(supabase: any, companyId: string, data: any) {
  // 獲取最近的交易
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('company_id', companyId)
    .gte('transaction_time', new Date(Date.now() - 24 * 3600000).toISOString())
    .order('transaction_time', { ascending: false })

  if (!recentTransactions || recentTransactions.length === 0) {
    return {
      anomalies: [],
      message: '過去24小時內沒有交易記錄'
    }
  }

  const anomalies: any[] = []

  // 檢測相同IP的大量交易
  const ipCount: { [key: string]: number } = {}
  recentTransactions.forEach(t => {
    if (t.ip_address) {
      ipCount[t.ip_address] = (ipCount[t.ip_address] || 0) + 1
    }
  })

  Object.entries(ipCount).forEach(([ip, count]) => {
    if (count > 10) {
      anomalies.push({
        type: 'suspicious_ip',
        description: `來自 IP ${ip} 的異常大量交易`,
        count,
        severity: 'high',
        recommendation: '調查此 IP 地址的交易'
      })
    }
  })

  // 檢測快速連續交易
  const userTransactions: { [key: string]: any[] } = {}
  recentTransactions.forEach(t => {
    if (t.user_id) {
      if (!userTransactions[t.user_id]) {
        userTransactions[t.user_id] = []
      }
      userTransactions[t.user_id].push(t)
    }
  })

  Object.entries(userTransactions).forEach(([userId, transactions]) => {
    if (transactions.length > 5) {
      const times = transactions.map(t => new Date(t.transaction_time).getTime())
      const maxTimeDiff = Math.max(...times) - Math.min(...times)
      
      if (maxTimeDiff < 300000) { // 5分鐘內
        anomalies.push({
          type: 'rapid_transactions',
          description: `用戶在短時間內進行多筆交易`,
          user_id: userId,
          count: transactions.length,
          severity: 'medium',
          recommendation: '驗證用戶身份'
        })
      }
    }
  })

  return {
    anomalies,
    total_anomalies: anomalies.length,
    detection_time: new Date().toISOString()
  }
}

