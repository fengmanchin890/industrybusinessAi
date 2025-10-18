/**
 * Security Analyzer Edge Function
 * AI 驅動的安全威脅分析
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  company_id: string;
  event_id?: string;
  analysis_type: 'threat' | 'event' | 'asset' | 'compliance';
  data?: any;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { company_id, event_id, analysis_type, data }: AnalysisRequest = await req.json();

    if (!company_id || !analysis_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let result;
    switch (analysis_type) {
      case 'threat':
        result = await analyzeThreat(supabase, company_id, data);
        break;
      case 'event':
        result = await analyzeEvent(supabase, company_id, event_id);
        break;
      case 'asset':
        result = await analyzeAsset(supabase, company_id, data);
        break;
      case 'compliance':
        result = await analyzeCompliance(supabase, company_id);
        break;
      default:
        throw new Error('Invalid analysis type');
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analysis failed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * 分析安全事件
 */
async function analyzeEvent(supabase: any, companyId: string, eventId?: string) {
  // 獲取事件資料
  const { data: event, error } = await supabase
    .from('security_events')
    .select('*')
    .eq('id', eventId)
    .eq('company_id', companyId)
    .single();

  if (error || !event) {
    throw new Error('Event not found');
  }

  // 使用 AI 分析（如果有 OpenAI key）
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  let aiAnalysis = null;

  if (openaiKey) {
    aiAnalysis = await performAIAnalysis(event, openaiKey);
  } else {
    // Fallback: 基於規則的分析
    aiAnalysis = await performRuleBasedAnalysis(event);
  }

  // 更新事件的 AI 分析結果
  await supabase
    .from('security_events')
    .update({
      ai_threat_score: aiAnalysis.threatScore,
      ai_analysis: aiAnalysis.analysis,
      ai_recommendations: aiAnalysis.recommendations,
      false_positive_probability: aiAnalysis.falsePositiveProbability
    })
    .eq('id', eventId);

  return {
    event_id: eventId,
    threat_score: aiAnalysis.threatScore,
    analysis: aiAnalysis.analysis,
    recommendations: aiAnalysis.recommendations,
    priority: aiAnalysis.priority,
    false_positive_probability: aiAnalysis.falsePositiveProbability
  };
}

/**
 * AI 分析（使用 OpenAI）
 */
async function performAIAnalysis(event: any, apiKey: string) {
  const prompt = `
作為網路安全分析師，請分析以下安全事件：

事件類型：${event.event_type}
嚴重程度：${event.severity}
描述：${event.description}
來源：${event.source_ip}
目標系統：${event.target_system}
受影響系統：${event.affected_systems.join(', ')}

請以 JSON 格式提供：
1. 威脅評分 (0-100)
2. 詳細分析
3. 建議措施（至少 3 個）
4. 優先級 (critical/high/medium/low)
5. 誤報機率 (0-100)

JSON 格式：
{
  "threatScore": 85,
  "analysis": "詳細分析...",
  "recommendations": ["建議1", "建議2", "建議3"],
  "priority": "high",
  "falsePositiveProbability": 15
}
  `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: '你是專業的網路安全分析師，專門為台灣政府機關提供威脅分析。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch {
    // 如果無法解析 JSON，使用預設值
    return performRuleBasedAnalysis(event);
  }
}

/**
 * 基於規則的分析（Fallback）
 */
async function performRuleBasedAnalysis(event: any) {
  let threatScore = 50;
  const recommendations = [];
  
  // 根據事件類型調整威脅分數
  const typeScores: Record<string, number> = {
    'data_breach': 90,
    'intrusion': 85,
    'malware': 80,
    'ransomware': 95,
    'ddos': 70,
    'phishing': 60,
    'unauthorized_access': 75,
    'anomaly': 40
  };
  
  threatScore = typeScores[event.event_type] || 50;
  
  // 根據嚴重程度調整
  if (event.severity === 'critical') threatScore = Math.min(threatScore + 20, 100);
  if (event.severity === 'high') threatScore = Math.min(threatScore + 10, 100);
  
  // 生成建議
  if (event.event_type === 'intrusion') {
    recommendations.push('立即封鎖來源 IP 地址');
    recommendations.push('檢查並強化防火牆規則');
    recommendations.push('實施多因素驗證');
  } else if (event.event_type === 'malware') {
    recommendations.push('隔離受感染系統');
    recommendations.push('執行完整系統掃描');
    recommendations.push('更新防毒軟體定義檔');
  } else if (event.event_type === 'data_breach') {
    recommendations.push('立即限制資料存取權限');
    recommendations.push('調查資料外洩範圍');
    recommendations.push('通報相關單位');
  }
  
  // 通用建議
  recommendations.push('記錄所有相關活動');
  recommendations.push('通知安全團隊');
  recommendations.push('準備事件報告');
  
  return {
    threatScore,
    analysis: `基於事件類型 (${event.event_type}) 和嚴重程度 (${event.severity})，此事件需要${threatScore > 70 ? '立即' : '盡快'}處理。`,
    recommendations: recommendations.slice(0, 5),
    priority: threatScore > 80 ? 'critical' : threatScore > 60 ? 'high' : threatScore > 40 ? 'medium' : 'low',
    falsePositiveProbability: event.event_type === 'anomaly' ? 30 : 10
  };
}

/**
 * 分析資產安全態勢
 */
async function analyzeAsset(supabase: any, companyId: string, assetData: any) {
  // 計算資產風險分數
  let score = 100;
  const issues = [];
  
  // 檢查最後掃描時間
  if (assetData.last_scanned) {
    const daysSinceLastScan = Math.floor(
      (Date.now() - new Date(assetData.last_scanned).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastScan > 30) {
      score -= 15;
      issues.push('超過 30 天未進行安全掃描');
    }
  }
  
  // 檢查曝光等級
  if (assetData.exposure_level === 'public') {
    score -= 10;
    issues.push('資產暴露於公網');
  }
  
  // 檢查關鍵性
  if (assetData.criticality === 'critical' && assetData.exposure_level === 'public') {
    score -= 20;
    issues.push('關鍵資產暴露於公網，風險極高');
  }
  
  return {
    asset_id: assetData.id,
    security_score: Math.max(score, 0),
    risk_level: score < 60 ? 'high' : score < 80 ? 'medium' : 'low',
    issues,
    recommendations: [
      '定期執行安全掃描',
      '實施最小權限原則',
      '啟用安全監控',
      '定期更新安全補丁'
    ]
  };
}

/**
 * 威脅情報分析
 */
async function analyzeThreat(supabase: any, companyId: string, threatData: any) {
  // 簡單的威脅分析邏輯
  return {
    threat_level: 'high',
    analysis: '威脅分析完成',
    indicators: threatData.indicators || [],
    recommendations: [
      '加強監控相關指標',
      '更新檢測規則',
      '通知相關人員'
    ]
  };
}

/**
 * 合規性分析
 */
async function analyzeCompliance(supabase: any, companyId: string) {
  // 獲取所有資產和事件
  const { data: assets } = await supabase
    .from('security_assets')
    .select('*')
    .eq('company_id', companyId);
  
  const { data: events } = await supabase
    .from('security_events')
    .select('*')
    .eq('company_id', companyId)
    .gte('detected_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  
  // 計算合規分數
  const totalAssets = assets?.length || 0;
  const monitoredAssets = assets?.filter(a => a.monitoring_enabled).length || 0;
  const criticalEvents = events?.filter(e => e.severity === 'critical').length || 0;
  
  const complianceScore = Math.max(
    100 - (criticalEvents * 5) - ((totalAssets - monitoredAssets) * 3),
    0
  );
  
  return {
    compliance_score: complianceScore,
    total_assets: totalAssets,
    monitored_assets: monitoredAssets,
    critical_events_30d: criticalEvents,
    status: complianceScore > 80 ? 'compliant' : complianceScore > 60 ? 'partial' : 'non-compliant',
    recommendations: [
      '確保所有關鍵資產已啟用監控',
      '定期審查安全事件',
      '實施自動化合規檢查',
      '建立事件回應流程'
    ]
  };
}