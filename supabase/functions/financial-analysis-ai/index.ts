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
      JSON.stringify({ status: 'healthy', service: 'financial-analysis-ai', version: '1.0.0' }),
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

    const { action, data } = await req.json()

    let result

    switch (action) {
      case 'analyze_cash_flow':
        result = await analyzeCashFlow(supabase, data)
        break
      
      case 'predict_cash_flow':
        result = await predictCashFlow(supabase, data)
        break
      
      case 'generate_budget_recommendations':
        result = await generateBudgetRecommendations(supabase, data)
        break
      
      case 'detect_financial_risks':
        result = await detectFinancialRisks(supabase, data)
        break
      
      case 'analyze_spending_patterns':
        result = await analyzeSpendingPatterns(supabase, data)
        break
      
      case 'calculate_financial_metrics':
        result = await calculateFinancialMetrics(supabase, data)
        break
      
      case 'generate_financial_insights':
        result = await generateFinancialInsights(supabase, data)
        break
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// AI 現金流分析
async function analyzeCashFlow(supabase: any, data: any) {
  const { companyId, startDate, endDate } = data

  // 獲取交易數據
  const { data: transactions, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('company_id', companyId)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .eq('status', 'confirmed')
    .order('transaction_date')

  if (error) throw error

  // 計算現金流
  let openingBalance = 0
  let totalIncome = 0
  let totalExpense = 0
  
  const dailyCashFlow: any[] = []
  const groupedByDate: any = {}

  transactions?.forEach((txn: any) => {
    const date = txn.transaction_date
    if (!groupedByDate[date]) {
      groupedByDate[date] = { income: 0, expense: 0, transactions: [] }
    }
    
    if (txn.transaction_type === 'income') {
      groupedByDate[date].income += parseFloat(txn.amount)
      totalIncome += parseFloat(txn.amount)
    } else if (txn.transaction_type === 'expense') {
      groupedByDate[date].expense += parseFloat(txn.amount)
      totalExpense += parseFloat(txn.amount)
    }
    
    groupedByDate[date].transactions.push(txn)
  })

  // 生成每日現金流
  Object.keys(groupedByDate).sort().forEach(date => {
    const dayData = groupedByDate[date]
    const netFlow = dayData.income - dayData.expense
    openingBalance += netFlow
    
    dailyCashFlow.push({
      date,
      income: dayData.income,
      expense: dayData.expense,
      netFlow,
      balance: openingBalance
    })
  })

  const netCashFlow = totalIncome - totalExpense
  const averageDailyIncome = totalIncome / Object.keys(groupedByDate).length
  const averageDailyExpense = totalExpense / Object.keys(groupedByDate).length

  // AI 分析
  const analysis = {
    totalIncome,
    totalExpense,
    netCashFlow,
    averageDailyIncome,
    averageDailyExpense,
    dailyCashFlow,
    trend: netCashFlow > 0 ? 'positive' : netCashFlow < 0 ? 'negative' : 'neutral',
    healthScore: calculateHealthScore(totalIncome, totalExpense),
    insights: generateCashFlowInsights(totalIncome, totalExpense, dailyCashFlow)
  }

  return analysis
}

// 預測未來現金流
async function predictCashFlow(supabase: any, data: any) {
  const { companyId, monthsAhead = 6 } = data

  // 調用數據庫函數
  const { data: predictions, error } = await supabase
    .rpc('predict_cash_flow', {
      p_company_id: companyId,
      p_months_ahead: monthsAhead
    })

  if (error) throw error

  // 增強 AI 預測
  const enhancedPredictions = predictions?.map((pred: any, index: number) => {
    const growthRate = 1 + (index * 0.02) // 假設 2% 月增長
    return {
      ...pred,
      projected_income: parseFloat(pred.projected_income) * growthRate,
      projected_expense: parseFloat(pred.projected_expense) * (1 + index * 0.015),
      confidence_level: Math.max(0.6, 0.9 - index * 0.05),
      ai_insights: generatePredictionInsights(pred, index)
    }
  })

  return {
    predictions: enhancedPredictions,
    summary: {
      averageMonthlyIncome: enhancedPredictions?.reduce((sum: number, p: any) => sum + p.projected_income, 0) / monthsAhead,
      averageMonthlyExpense: enhancedPredictions?.reduce((sum: number, p: any) => sum + p.projected_expense, 0) / monthsAhead,
      totalProjectedProfit: enhancedPredictions?.reduce((sum: number, p: any) => sum + (p.projected_income - p.projected_expense), 0)
    }
  }
}

// 生成預算建議
async function generateBudgetRecommendations(supabase: any, data: any) {
  const { companyId, period = 'monthly' } = data

  // 獲取歷史支出數據
  const { data: spending } = await supabase
    .rpc('get_category_spending', {
      p_company_id: companyId,
      p_start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      p_end_date: new Date().toISOString().split('T')[0]
    })

  const recommendations: any[] = []

  spending?.forEach((cat: any) => {
    const avgMonthlySpending = parseFloat(cat.total_amount) / 3
    const recommendedBudget = avgMonthlySpending * 1.1 // 10% buffer
    
    const recommendation = {
      category: cat.category,
      currentSpending: avgMonthlySpending,
      recommendedBudget,
      variance: recommendedBudget - avgMonthlySpending,
      priority: determinePriority(avgMonthlySpending, parseFloat(cat.total_amount)),
      aiSuggestions: generateCategoryAdvice(cat.category, avgMonthlySpending)
    }
    
    recommendations.push(recommendation)
  })

  return {
    recommendations: recommendations.sort((a, b) => b.currentSpending - a.currentSpending),
    totalRecommendedBudget: recommendations.reduce((sum, r) => sum + r.recommendedBudget, 0)
  }
}

// 檢測財務風險
async function detectFinancialRisks(supabase: any, data: any) {
  const { companyId } = data

  const risks: any[] = []

  // 獲取最近的交易
  const { data: recentTransactions } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('company_id', companyId)
    .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .eq('status', 'confirmed')

  if (!recentTransactions || recentTransactions.length === 0) {
    risks.push({
      type: 'no_data',
      severity: 'medium',
      title: '缺少財務數據',
      message: '系統中缺少足夠的財務交易數據進行風險分析',
      recommendations: ['開始記錄日常財務交易', '導入歷史財務數據']
    })
    return { risks, riskScore: 50 }
  }

  const totalIncome = recentTransactions.filter((t: any) => t.transaction_type === 'income')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0)
  const totalExpense = recentTransactions.filter((t: any) => t.transaction_type === 'expense')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0)

  // 風險 1: 負現金流
  if (totalExpense > totalIncome) {
    risks.push({
      type: 'negative_cash_flow',
      severity: 'high',
      title: '負現金流警告',
      message: `過去30天支出（$${totalExpense.toLocaleString()}）超過收入（$${totalIncome.toLocaleString()}）`,
      recommendations: [
        '審查並削減非必要支出',
        '加強應收帳款回收',
        '尋找額外收入來源'
      ]
    })
  }

  // 風險 2: 高支出比例
  const expenseRatio = totalExpense / totalIncome
  if (expenseRatio > 0.85) {
    risks.push({
      type: 'high_expense_ratio',
      severity: expenseRatio > 0.95 ? 'critical' : 'high',
      title: '支出比例過高',
      message: `支出占收入的 ${(expenseRatio * 100).toFixed(1)}%，利潤空間狹窄`,
      recommendations: [
        '制定成本控制計劃',
        '尋找供應商談判機會',
        '優化運營效率'
      ]
    })
  }

  // 風險 3: 異常大額支出
  const avgExpense = totalExpense / recentTransactions.filter((t: any) => t.transaction_type === 'expense').length
  const largeExpenses = recentTransactions.filter((t: any) => 
    t.transaction_type === 'expense' && parseFloat(t.amount) > avgExpense * 3
  )

  if (largeExpenses.length > 0) {
    risks.push({
      type: 'unusual_expenses',
      severity: 'medium',
      title: '發現異常大額支出',
      message: `檢測到 ${largeExpenses.length} 筆超過平均值3倍的支出`,
      recommendations: [
        '審查這些大額支出的必要性',
        '建立支出審批流程',
        '設置預算上限'
      ]
    })
  }

  const riskScore = calculateRiskScore(risks)

  return { risks, riskScore, totalRisks: risks.length }
}

// 分析支出模式
async function analyzeSpendingPatterns(supabase: any, data: any) {
  const { companyId, period = 90 } = data

  const { data: transactions } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('company_id', companyId)
    .eq('transaction_type', 'expense')
    .gte('transaction_date', new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .eq('status', 'confirmed')

  const patterns = {
    byCategory: {} as any,
    byWeekday: {} as any,
    byMonth: {} as any,
    trends: [] as any[]
  }

  transactions?.forEach((txn: any) => {
    const category = txn.category
    const date = new Date(txn.transaction_date)
    const weekday = date.toLocaleDateString('zh-TW', { weekday: 'long' })
    const month = date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })
    const amount = parseFloat(txn.amount)

    // 按分類
    if (!patterns.byCategory[category]) {
      patterns.byCategory[category] = { total: 0, count: 0, average: 0 }
    }
    patterns.byCategory[category].total += amount
    patterns.byCategory[category].count += 1

    // 按星期
    if (!patterns.byWeekday[weekday]) {
      patterns.byWeekday[weekday] = { total: 0, count: 0 }
    }
    patterns.byWeekday[weekday].total += amount
    patterns.byWeekday[weekday].count += 1

    // 按月份
    if (!patterns.byMonth[month]) {
      patterns.byMonth[month] = { total: 0, count: 0 }
    }
    patterns.byMonth[month].total += amount
    patterns.byMonth[month].count += 1
  })

  // 計算平均值
  Object.keys(patterns.byCategory).forEach(cat => {
    patterns.byCategory[cat].average = patterns.byCategory[cat].total / patterns.byCategory[cat].count
  })

  // 生成趨勢分析
  const sortedCategories = Object.entries(patterns.byCategory)
    .sort(([, a]: any, [, b]: any) => b.total - a.total)
    .slice(0, 5)

  patterns.trends = sortedCategories.map(([category, data]: any) => ({
    category,
    ...data,
    percentage: (data.total / transactions?.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) * 100).toFixed(1)
  }))

  return patterns
}

// 計算財務指標
async function calculateFinancialMetrics(supabase: any, data: any) {
  const { companyId, startDate, endDate } = data

  const { data: metrics, error } = await supabase
    .rpc('calculate_financial_metrics', {
      p_company_id: companyId,
      p_start_date: startDate,
      p_end_date: endDate
    })

  if (error) throw error

  const result = metrics?.[0] || {}

  return {
    totalRevenue: parseFloat(result.total_revenue || 0),
    totalExpense: parseFloat(result.total_expense || 0),
    netProfit: parseFloat(result.net_profit || 0),
    profitMargin: parseFloat(result.profit_margin || 0),
    transactionCount: result.transaction_count || 0,
    averageTransaction: result.transaction_count > 0 
      ? parseFloat(result.total_revenue || 0) / result.transaction_count 
      : 0
  }
}

// 生成財務洞察
async function generateFinancialInsights(supabase: any, data: any) {
  const { companyId } = data

  const insights: any[] = []

  // 獲取最近3個月的指標
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const metrics = await calculateFinancialMetrics(supabase, { companyId, startDate, endDate })
  const risks = await detectFinancialRisks(supabase, { companyId })

  // 洞察 1: 整體財務健康
  insights.push({
    type: 'health',
    title: '財務健康狀況',
    description: metrics.profitMargin > 20 
      ? '財務狀況良好，利潤率健康'
      : metrics.profitMargin > 10
      ? '財務狀況穩定，但有改進空間'
      : '需要關注成本控制和收入提升',
    score: Math.min(100, metrics.profitMargin * 4),
    recommendations: generateHealthRecommendations(metrics.profitMargin)
  })

  // 洞察 2: 風險評估
  insights.push({
    type: 'risk',
    title: '風險評估',
    description: `檢測到 ${risks.totalRisks} 個財務風險`,
    score: 100 - risks.riskScore,
    risks: risks.risks
  })

  // 洞察 3: 成長機會
  insights.push({
    type: 'growth',
    title: '成長機會',
    description: '基於歷史數據分析的成長建議',
    opportunities: [
      { title: '優化成本結構', potential: '節省 10-15% 運營成本' },
      { title: '提高收款效率', potential: '改善現金流 15-20%' },
      { title: '投資自動化', potential: '提升效率 20-30%' }
    ]
  })

  return { insights, overallScore: insights.reduce((sum, i) => sum + (i.score || 50), 0) / insights.length }
}

// 輔助函數
function calculateHealthScore(income: number, expense: number): number {
  const profitMargin = income > 0 ? ((income - expense) / income) * 100 : 0
  return Math.min(100, Math.max(0, profitMargin * 3))
}

function generateCashFlowInsights(income: number, expense: number, dailyFlow: any[]): string[] {
  const insights: string[] = []
  const netFlow = income - expense
  
  if (netFlow > 0) {
    insights.push(`正現金流：收入超過支出 $${netFlow.toLocaleString()}`)
  } else {
    insights.push(`負現金流：支出超過收入 $${Math.abs(netFlow).toLocaleString()}`)
  }
  
  const volatility = calculateVolatility(dailyFlow)
  if (volatility > 0.3) {
    insights.push('現金流波動較大，建議建立現金儲備')
  }
  
  return insights
}

function calculateVolatility(dailyFlow: any[]): number {
  if (dailyFlow.length < 2) return 0
  const values = dailyFlow.map(d => d.netFlow)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  return Math.sqrt(variance) / Math.abs(mean)
}

function generatePredictionInsights(prediction: any, index: number): string[] {
  const insights: string[] = []
  const netFlow = prediction.projected_income - prediction.projected_expense
  
  if (netFlow < 0) {
    insights.push('預計出現負現金流，建議提前準備')
  }
  if (index > 3) {
    insights.push('長期預測，實際情況可能變化')
  }
  
  return insights
}

function determinePriority(current: number, total: number): string {
  const percentage = current / total
  if (percentage > 0.3) return 'high'
  if (percentage > 0.15) return 'medium'
  return 'low'
}

function generateCategoryAdvice(category: string, spending: number): string[] {
  const advice: string[] = []
  
  if (category.includes('人事') || category.includes('薪資')) {
    advice.push('考慮績效獎金制度優化人力成本')
  } else if (category.includes('行銷') || category.includes('廣告')) {
    advice.push('追蹤ROI，優化行銷預算分配')
  } else if (category.includes('租金') || category.includes('水電')) {
    advice.push('探索節能方案或更經濟的辦公選項')
  }
  
  return advice
}

function calculateRiskScore(risks: any[]): number {
  const severityScores: any = { low: 10, medium: 25, high: 40, critical: 60 }
  const totalScore = risks.reduce((sum, risk) => sum + (severityScores[risk.severity] || 20), 0)
  return Math.min(100, totalScore)
}

function generateHealthRecommendations(profitMargin: number): string[] {
  if (profitMargin > 20) {
    return ['保持良好的財務紀律', '考慮投資成長機會']
  } else if (profitMargin > 10) {
    return ['審查成本結構', '尋找提高收入的機會']
  } else {
    return ['立即審查所有開支', '尋找成本削減機會', '提高定價或增加銷售']
  }
}

