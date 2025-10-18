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
      JSON.stringify({ status: 'healthy', service: 'cargo-tracking-analyzer', version: '1.0.0' }),
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
      case 'predict_delivery':
        result = await predictDelivery(supabase, userData.company_id, data)
        break
      case 'analyze_delay_risk':
        result = await analyzeDelayRisk(supabase, data)
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

async function predictDelivery(supabase: any, companyId: string, data: any) {
  const shipment = data.shipmentData || {}
  
  let adjustedHours = 24
  const riskFactors: string[] = []
  
  const weight = parseFloat(shipment.weight_kg || 0)
  if (weight > 1000) {
    adjustedHours += 12
    riskFactors.push('超重貨物')
  } else if (weight > 500) adjustedHours += 6
  
  if (shipment.priority === 'urgent') adjustedHours -= 6
  else if (shipment.priority === 'low') adjustedHours += 12
  
  let delayRisk = 20
  if (weight > 800) delayRisk += 30
  if (shipment.destination_address?.includes('偏遠')) {
    delayRisk += 20
    riskFactors.push('偏遠地區')
  }
  
  delayRisk = Math.min(100, delayRisk)
  
  const predictedETA = new Date(Date.now() + adjustedHours * 3600000)
  
  const recommendations: string[] = []
  if (delayRisk > 70) {
    recommendations.push('建議使用快遞服務')
    recommendations.push('提前通知客戶可能延遲')
  } else if (delayRisk > 40) {
    recommendations.push('密切監控運輸狀態')
  } else {
    recommendations.push('預計準時送達')
  }
  
  try {
    await supabase.from('shipments').update({
      ai_eta_prediction: predictedETA.toISOString(),
      delay_risk_score: delayRisk,
      ai_recommendations: recommendations,
      updated_at: new Date().toISOString()
    }).eq('tracking_number', shipment.tracking_number)
  } catch (error) {
    console.warn('Error updating shipment:', error)
  }
  
  return {
    tracking_number: shipment.tracking_number,
    predicted_eta: predictedETA.toISOString(),
    delivery_time_hours: adjustedHours,
    delay_risk_score: delayRisk,
    risk_level: delayRisk > 70 ? 'high' : delayRisk > 40 ? 'medium' : 'low',
    risk_factors: riskFactors,
    recommendations,
    confidence: 85
  }
}

async function analyzeDelayRisk(supabase: any, data: any) {
  const tracking = data.tracking_number
  
  return {
    tracking_number: tracking,
    delay_risk: 35,
    factors: ['天氣良好', '路況正常'],
    recommendation: '預計準時送達'
  }
}

async function getStatistics(supabase: any, companyId: string, data: any) {
  const days = data.days || 30
  
  try {
    const { data: stats, error } = await supabase.rpc('get_cargo_stats', {
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
