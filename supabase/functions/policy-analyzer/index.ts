/**
 * Policy Analyzer Edge Function
 * AI 驅動的政策分析系統
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  company_id: string;
  policy_id?: string;
  analysis_type: 'comprehensive' | 'impact' | 'risk' | 'effectiveness' | 'comparison' | 'simulation';
  parameters?: any;
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
    const { company_id, policy_id, analysis_type, parameters }: AnalysisRequest = await req.json();

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
      case 'comprehensive':
        result = await analyzeComprehensive(supabase, company_id, policy_id);
        break;
      case 'impact':
        result = await analyzeImpact(supabase, company_id, policy_id);
        break;
      case 'risk':
        result = await analyzeRisk(supabase, company_id, policy_id);
        break;
      case 'effectiveness':
        result = await analyzeEffectiveness(supabase, company_id, policy_id);
        break;
      case 'comparison':
        result = await comparePolicies(supabase, company_id, parameters);
        break;
      case 'simulation':
        result = await simulatePolicy(supabase, company_id, policy_id, parameters);
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
 * 綜合分析政策
 */
async function analyzeComprehensive(supabase: any, companyId: string, policyId: string) {
  // 獲取政策資料
  const { data: policy, error } = await supabase
    .from('policies')
    .select('*')
    .eq('id', policyId)
    .eq('company_id', companyId)
    .single();

  if (error || !policy) {
    throw new Error('Policy not found');
  }

  // 獲取指標數據
  const { data: indicators } = await supabase
    .from('policy_indicators')
    .select('*')
    .eq('policy_id', policyId);

  // 使用 AI 分析（如果有 OpenAI key）
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  let aiAnalysis = null;

  if (openaiKey) {
    aiAnalysis = await performAIAnalysis(policy, indicators, openaiKey);
  } else {
    // Fallback: 基於規則的分析
    aiAnalysis = await performRuleBasedAnalysis(policy, indicators);
  }

  // 保存分析結果
  const { data: savedAnalysis, error: saveError } = await supabase
    .from('policy_analyses')
    .insert({
      company_id: companyId,
      policy_id: policyId,
      analysis_type: 'comprehensive',
      overall_score: aiAnalysis.overallScore,
      effectiveness_score: aiAnalysis.effectivenessScore,
      efficiency_score: aiAnalysis.efficiencyScore,
      equity_score: aiAnalysis.equityScore,
      sustainability_score: aiAnalysis.sustainabilityScore,
      feasibility_score: aiAnalysis.feasibilityScore,
      positive_impacts: aiAnalysis.positiveImpacts,
      negative_impacts: aiAnalysis.negativeImpacts,
      affected_groups: aiAnalysis.affectedGroups,
      risks: aiAnalysis.risks,
      mitigation_strategies: aiAnalysis.mitigationStrategies,
      overall_risk_level: aiAnalysis.overallRiskLevel,
      ai_analysis: aiAnalysis.analysis,
      ai_recommendations: aiAnalysis.recommendations,
      ai_confidence_score: aiAnalysis.confidenceScore,
      ai_model_used: openaiKey ? 'gpt-4' : 'rule-based'
    })
    .select()
    .single();

  if (saveError) {
    console.error('Failed to save analysis:', saveError);
  }

  return {
    policy_id: policyId,
    ...aiAnalysis,
    analysis_id: savedAnalysis?.id
  };
}

/**
 * AI 分析（使用 OpenAI GPT-4）
 */
async function performAIAnalysis(policy: any, indicators: any[], apiKey: string) {
  const indicatorsSummary = indicators?.map(i => 
    `- ${i.indicator_name}: 目標 ${i.target_value}, 當前 ${i.current_value} ${i.unit} (${i.trend})`
  ).join('\n') || '無指標數據';

  const prompt = `
作為政策分析專家，請對以下台灣政府政策進行綜合評估：

政策資訊：
- 名稱：${policy.title}
- 類別：${policy.category}
- 目標：${policy.objectives?.join(', ')}
- 預算：${policy.budget_total ? `NT$ ${(policy.budget_total / 100000000).toFixed(2)} 億` : '未提供'}
- 目標族群：${policy.target_population}
- 實施日期：${policy.implementation_date}

績效指標：
${indicatorsSummary}

請以 JSON 格式提供以下評估（每項評分 0-100）：

{
  "overallScore": 整體評分,
  "effectivenessScore": 有效性評分（目標達成度）,
  "efficiencyScore": 效率評分（資源使用效率）,
  "equityScore": 公平性評分（利益分配公平性）,
  "sustainabilityScore": 永續性評分（長期可持續性）,
  "feasibilityScore": 可行性評分（實施難易度）,
  "positiveImpacts": ["正面影響1", "正面影響2", "正面影響3"],
  "negativeImpacts": ["負面影響1", "負面影響2"],
  "affectedGroups": ["受影響群體1", "受影響群體2"],
  "risks": [
    {
      "description": "風險描述",
      "probability": "high/medium/low",
      "impact": "high/medium/low",
      "mitigation": "緩解措施"
    }
  ],
  "mitigationStrategies": ["緩解策略1", "緩解策略2"],
  "overallRiskLevel": "low/medium/high/critical",
  "analysis": "詳細分析說明（200-300字）",
  "recommendations": ["建議1", "建議2", "建議3", "建議4", "建議5"],
  "confidenceScore": AI分析信心度0-100
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
        { 
          role: 'system', 
          content: '你是專業的政策分析專家，專門為台灣政府機關提供政策評估與建議。你的分析必須客觀、數據驅動，並考慮台灣的社會文化背景。' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch {
    // 如果無法解析 JSON，使用 fallback
    return performRuleBasedAnalysis(policy, indicators);
  }
}

/**
 * 基於規則的分析（Fallback）
 */
async function performRuleBasedAnalysis(policy: any, indicators: any[]) {
  // 計算各項評分
  let effectivenessScore = 70;
  let efficiencyScore = 65;
  let equityScore = 70;
  let sustainabilityScore = 60;
  let feasibilityScore = 75;

  // 根據指標狀態調整分數
  if (indicators && indicators.length > 0) {
    const onTrack = indicators.filter(i => i.status === 'on-track').length;
    const total = indicators.length;
    effectivenessScore = Math.round((onTrack / total) * 100);
  }

  // 根據預算執行率調整效率分數
  if (policy.budget_allocated && policy.budget_spent) {
    const spendRate = (policy.budget_spent / policy.budget_allocated) * 100;
    if (spendRate > 120) efficiencyScore -= 20; // 超支
    if (spendRate < 50) efficiencyScore -= 10; // 執行率低
  }

  // 根據類別調整分數
  const categoryAdjustments: Record<string, any> = {
    'social': { equity: 10, sustainability: 5 },
    'environmental': { sustainability: 15, equity: 5 },
    'economic': { efficiency: 10, feasibility: 5 },
    'education': { equity: 10, sustainability: 10 },
    'healthcare': { equity: 15, sustainability: 5 }
  };

  const adj = categoryAdjustments[policy.category] || {};
  equityScore += adj.equity || 0;
  sustainabilityScore += adj.sustainability || 0;
  efficiencyScore += adj.efficiency || 0;
  feasibilityScore += adj.feasibility || 0;

  // 限制評分範圍
  const clamp = (score: number) => Math.max(0, Math.min(100, score));
  
  effectivenessScore = clamp(effectivenessScore);
  efficiencyScore = clamp(efficiencyScore);
  equityScore = clamp(equityScore);
  sustainabilityScore = clamp(sustainabilityScore);
  feasibilityScore = clamp(feasibilityScore);

  const overallScore = Math.round(
    (effectivenessScore * 0.3 + efficiencyScore * 0.2 + equityScore * 0.2 + 
     sustainabilityScore * 0.15 + feasibilityScore * 0.15)
  );

  // 生成影響
  const positiveImpacts = [];
  const negativeImpacts = [];

  if (policy.category === 'social') {
    positiveImpacts.push('改善目標族群生活品質', '促進社會公平', '提升社會凝聚力');
    negativeImpacts.push('財政負擔增加', '可能產生依賴性');
  } else if (policy.category === 'economic') {
    positiveImpacts.push('促進經濟發展', '創造就業機會', '提升競爭力');
    negativeImpacts.push('可能產生市場扭曲', '短期財政壓力');
  } else if (policy.category === 'environmental') {
    positiveImpacts.push('改善環境品質', '促進永續發展', '提升生活環境');
    negativeImpacts.push('實施成本高', '可能影響經濟活動');
  } else {
    positiveImpacts.push('達成政策目標', '提升公共服務品質', '促進社會進步');
    negativeImpacts.push('資源投入需求', '執行過程挑戰');
  }

  // 生成風險
  const risks = [];
  if (policy.budget_total && policy.budget_total > 1000000000) {
    risks.push({
      description: '財政負擔過重',
      probability: 'medium',
      impact: 'high',
      mitigation: '建立多元財源機制，分階段實施'
    });
  }
  
  risks.push({
    description: '執行效果不如預期',
    probability: 'medium',
    impact: 'medium',
    mitigation: '建立監測機制，定期檢討調整'
  });

  if (!policy.stakeholders || policy.stakeholders.length < 3) {
    risks.push({
      description: '利害關係人溝通不足',
      probability: 'high',
      impact: 'medium',
      mitigation: '強化溝通機制，建立參與平台'
    });
  }

  const overallRiskLevel = risks.some(r => r.probability === 'high' && r.impact === 'high') 
    ? 'high' 
    : risks.length > 2 ? 'medium' : 'low';

  return {
    overallScore,
    effectivenessScore,
    efficiencyScore,
    equityScore,
    sustainabilityScore,
    feasibilityScore,
    positiveImpacts,
    negativeImpacts,
    affectedGroups: [policy.target_population || '一般民眾', '政府部門', '相關產業'],
    risks,
    mitigationStrategies: risks.map(r => r.mitigation),
    overallRiskLevel,
    analysis: `根據政策內容與現有數據分析，「${policy.title}」整體表現${overallScore > 70 ? '良好' : '尚可'}。有效性評分為 ${effectivenessScore}，顯示政策在達成目標方面${effectivenessScore > 70 ? '表現穩健' : '仍有改善空間'}。效率評分 ${efficiencyScore} 反映資源使用${efficiencyScore > 70 ? '效率佳' : '需優化'}。公平性與永續性分別獲得 ${equityScore} 與 ${sustainabilityScore} 分，建議持續關注長期影響。整體風險等級為${overallRiskLevel === 'high' ? '高' : overallRiskLevel === 'medium' ? '中' : '低'}，需要${overallRiskLevel === 'high' ? '立即' : '持續'}關注與管理。`,
    recommendations: [
      '建立完整的績效監測機制',
      '強化利害關係人溝通與參與',
      '定期檢討並調整實施策略',
      '確保資源配置效率',
      '建立風險預警與應變機制'
    ],
    confidenceScore: indicators && indicators.length > 3 ? 75 : 60
  };
}

/**
 * 影響評估
 */
async function analyzeImpact(supabase: any, companyId: string, policyId: string) {
  const { data: policy } = await supabase
    .from('policies')
    .select('*')
    .eq('id', policyId)
    .eq('company_id', companyId)
    .single();

  if (!policy) throw new Error('Policy not found');

  // 簡化的影響評估
  return {
    policy_id: policyId,
    economic_impact: {
      gdp_effect: 'positive',
      employment_effect: 'moderate',
      fiscal_impact: policy.budget_total > 1000000000 ? 'significant' : 'moderate'
    },
    social_impact: {
      quality_of_life: 'improved',
      equity: 'enhanced',
      social_cohesion: 'positive'
    },
    environmental_impact: {
      sustainability: policy.category === 'environmental' ? 'high' : 'moderate',
      resource_usage: 'efficient'
    }
  };
}

/**
 * 風險分析
 */
async function analyzeRisk(supabase: any, companyId: string, policyId: string) {
  // 簡化的風險分析
  return {
    policy_id: policyId,
    overall_risk_level: 'medium',
    risks: [
      {
        type: 'implementation',
        description: '執行過程可能遇到的挑戰',
        probability: 'medium',
        impact: 'medium'
      },
      {
        type: 'financial',
        description: '預算執行風險',
        probability: 'low',
        impact: 'high'
      }
    ],
    mitigation_strategies: [
      '建立風險監控機制',
      '準備應變計畫',
      '強化跨部門協調'
    ]
  };
}

/**
 * 效能評估
 */
async function analyzeEffectiveness(supabase: any, companyId: string, policyId: string) {
  const { data: indicators } = await supabase
    .from('policy_indicators')
    .select('*')
    .eq('policy_id', policyId);

  const totalIndicators = indicators?.length || 0;
  const achievedIndicators = indicators?.filter(i => 
    i.current_value >= i.target_value
  ).length || 0;

  const achievementRate = totalIndicators > 0 
    ? Math.round((achievedIndicators / totalIndicators) * 100) 
    : 0;

  return {
    policy_id: policyId,
    achievement_rate: achievementRate,
    total_indicators: totalIndicators,
    achieved_indicators: achievedIndicators,
    effectiveness_score: achievementRate,
    status: achievementRate > 80 ? 'excellent' : achievementRate > 60 ? 'good' : 'needs_improvement'
  };
}

/**
 * 政策比較
 */
async function comparePolicies(supabase: any, companyId: string, parameters: any) {
  const { policy_ids } = parameters;
  
  if (!policy_ids || policy_ids.length < 2) {
    throw new Error('At least 2 policies required for comparison');
  }

  const { data: policies } = await supabase
    .from('policies')
    .select('*, policy_analyses(*)')
    .in('id', policy_ids)
    .eq('company_id', companyId);

  return {
    compared_policies: policy_ids.length,
    policies: policies?.map(p => ({
      id: p.id,
      title: p.title,
      overall_score: p.policy_analyses?.[0]?.overall_score || 0,
      effectiveness: p.policy_analyses?.[0]?.effectiveness_score || 0,
      efficiency: p.policy_analyses?.[0]?.efficiency_score || 0
    })),
    recommendation: '建議選擇整體評分最高的政策'
  };
}

/**
 * 政策模擬
 */
async function simulatePolicy(supabase: any, companyId: string, policyId: string, parameters: any) {
  // 簡化的政策模擬
  return {
    policy_id: policyId,
    simulation_type: 'what-if',
    predicted_outcomes: {
      best_case: {
        achievement_rate: 95,
        budget_efficiency: 90,
        timeline: 'on-schedule'
      },
      most_likely: {
        achievement_rate: 75,
        budget_efficiency: 80,
        timeline: 'minor-delay'
      },
      worst_case: {
        achievement_rate: 50,
        budget_efficiency: 60,
        timeline: 'significant-delay'
      }
    },
    confidence_level: 70
  };
}