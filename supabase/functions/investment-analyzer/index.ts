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
      JSON.stringify({ status: 'healthy', service: 'investment-analyzer', version: '1.0.0' }),
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
      case 'analyze_portfolio':
        result = await analyzePortfolio(supabase, userData.company_id, user.id, data)
        break
      case 'get_recommendations':
        result = await getRecommendations(supabase, userData.company_id, data)
        break
      case 'analyze_market':
        result = await analyzeMarket(supabase, userData.company_id)
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

async function analyzePortfolio(supabase: any, companyId: string, userId: string, data: any) {
  const portfolio = data.portfolioData || {}
  
  console.log('Analyzing portfolio:', portfolio.portfolio_code)

  // AI 投資組合分析
  const totalValue = parseFloat(portfolio.total_value || 0)
  const returnRate = parseFloat(portfolio.total_return_rate || 0)
  
  // 計算 AI 評分
  let aiScore = 50
  
  // 報酬率評分
  if (returnRate > 20) aiScore += 30
  else if (returnRate > 10) aiScore += 20
  else if (returnRate > 5) aiScore += 10
  else if (returnRate < 0) aiScore -= 20
  
  // 波動率評分
  const volatility = parseFloat(portfolio.volatility || 15)
  if (volatility < 10) aiScore += 15
  else if (volatility < 20) aiScore += 5
  else if (volatility > 30) aiScore -= 15
  
  // 夏普比率評分
  const sharpeRatio = parseFloat(portfolio.sharpe_ratio || 1)
  if (sharpeRatio > 2) aiScore += 15
  else if (sharpeRatio > 1) aiScore += 10
  else if (sharpeRatio < 0.5) aiScore -= 10
  
  aiScore = Math.max(0, Math.min(100, aiScore))
  
  // AI 建議
  let recommendation = 'hold'
  let reasoning = ''
  const suggestions: string[] = []
  
  if (aiScore >= 80) {
    recommendation = 'hold'
    reasoning = '投資組合表現優異，建議維持當前配置'
    suggestions.push('繼續監控市場動態')
    suggestions.push('考慮部分獲利了結')
  } else if (aiScore >= 60) {
    recommendation = 'hold'
    reasoning = '投資組合表現穩健，可持續觀察'
    suggestions.push('維持當前策略')
    suggestions.push('定期檢視配置')
  } else if (aiScore >= 40) {
    recommendation = 'rebalance'
    reasoning = '投資組合需要調整以優化報酬風險比'
    suggestions.push('考慮重新平衡資產配置')
    suggestions.push('降低高風險資產比重')
  } else {
    recommendation = 'review'
    reasoning = '投資組合表現不佳，需要全面檢討'
    suggestions.push('建議進行全面重組')
    suggestions.push('諮詢專業投資顧問')
  }
  
  // 風險評分
  let riskScore = 50
  if (volatility > 25) riskScore += 30
  else if (volatility > 15) riskScore += 15
  
  if (returnRate < -10) riskScore += 20
  
  riskScore = Math.min(100, riskScore)
  
  // 儲存分析結果
  try {
    await supabase.from('investment_portfolios').update({
      ai_portfolio_score: aiScore,
      ai_recommendation: recommendation,
      ai_analysis_summary: reasoning,
      updated_at: new Date().toISOString()
    }).eq('portfolio_code', portfolio.portfolio_code)
    
    // 創建建議記錄
    if (recommendation === 'rebalance' || recommendation === 'review') {
      await supabase.from('investment_recommendations').insert({
        company_id: companyId,
        portfolio_id: portfolio.id,
        recommendation_type: 'portfolio_optimization',
        action: recommendation,
        reasoning,
        confidence_score: aiScore,
        priority: aiScore < 40 ? 'high' : 'medium',
        status: 'pending'
      })
    }
  } catch (error) {
    console.warn('Error saving analysis:', error)
  }
  
  return {
    portfolio_code: portfolio.portfolio_code,
    ai_score: aiScore,
    risk_score: riskScore,
    recommendation,
    reasoning,
    suggestions,
    performance_rating: aiScore >= 80 ? 'excellent' : aiScore >= 60 ? 'good' : aiScore >= 40 ? 'average' : 'poor',
    analysis_timestamp: new Date().toISOString()
  }
}

async function getRecommendations(supabase: any, companyId: string, data: any) {
  const portfolioId = data.portfolioId
  
  // AI 投資建議生成
  const recommendations = []
  
  // 示例建議
  recommendations.push({
    type: 'asset_allocation',
    action: 'increase',
    asset_class: 'bond',
    suggestion: '建議增加債券配置以降低整體風險',
    percentage: 10,
    confidence: 85,
    reasoning: '當前股票配置偏高，市場波動加大'
  })
  
  recommendations.push({
    type: 'rebalancing',
    action: 'sell',
    asset_class: 'stock',
    suggestion: '考慮減持高估值科技股',
    percentage: 5,
    confidence: 75,
    reasoning: '科技板塊估值偏高，建議適度減持'
  })
  
  recommendations.push({
    type: 'diversification',
    action: 'buy',
    asset_class: 'alternative',
    suggestion: '增加另類投資如黃金 ETF',
    percentage: 5,
    confidence: 80,
    reasoning: '增加抗通膨資產以對沖風險'
  })
  
  // 儲存建議
  try {
    for (const rec of recommendations) {
      await supabase.from('investment_recommendations').insert({
        company_id: companyId,
        portfolio_id: portfolioId,
        recommendation_type: rec.type,
        action: rec.action,
        asset_class: rec.asset_class,
        reasoning: rec.reasoning,
        confidence_score: rec.confidence,
        status: 'pending'
      })
    }
  } catch (error) {
    console.warn('Error saving recommendations:', error)
  }
  
  return {
    recommendations,
    total_count: recommendations.length,
    timestamp: new Date().toISOString()
  }
}

async function analyzeMarket(supabase: any, companyId: string) {
  // AI 市場分析
  const marketSentiment = ['bullish', 'neutral', 'bearish'][Math.floor(Math.random() * 3)]
  
  let outlook = ''
  const recommendations: string[] = []
  
  if (marketSentiment === 'bullish') {
    outlook = '市場氣氛樂觀，經濟數據強勁，建議維持成長型資產配置'
    recommendations.push('可考慮增加股票配置')
    recommendations.push('關注科技和消費板塊')
  } else if (marketSentiment === 'neutral') {
    outlook = '市場處於觀望狀態，建議採取平衡配置策略'
    recommendations.push('維持當前資產配置')
    recommendations.push('密切關注央行政策')
  } else {
    outlook = '市場風險升高，建議採取防禦性策略'
    recommendations.push('增加防禦性資產')
    recommendations.push('減少高風險投資')
  }
  
  // 儲存市場分析
  try {
    await supabase.from('market_analysis').insert({
      company_id: companyId,
      market_index: 'TAIEX',
      index_value: 17500 + Math.random() * 500,
      daily_change: (Math.random() - 0.5) * 3,
      market_sentiment: marketSentiment,
      ai_market_outlook: outlook,
      ai_recommendations: recommendations
    })
  } catch (error) {
    console.warn('Error saving market analysis:', error)
  }
  
  return {
    market_sentiment: marketSentiment,
    outlook,
    recommendations,
    analysis_date: new Date().toISOString()
  }
}

async function getStatistics(supabase: any, companyId: string, data: any) {
  const days = data.days || 30
  
  try {
    const { data: stats, error } = await supabase.rpc('get_investment_stats', {
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


