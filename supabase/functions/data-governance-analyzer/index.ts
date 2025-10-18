/**
 * Data Governance Analyzer Edge Function
 * AI 驅動的數據治理合規性分析
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  company_id: string;
  analysis_type: 'compliance' | 'privacy' | 'quality' | 'risk';
  data_asset_id?: string;
  check_type?: string;
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { company_id, analysis_type, data_asset_id, check_type }: AnalysisRequest = await req.json();

    if (!company_id || !analysis_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();
    let result: any = {};

    switch (analysis_type) {
      case 'compliance':
        result = await analyzeCompliance(supabase, company_id, data_asset_id, check_type, openaiApiKey);
        break;
      case 'privacy':
        result = await analyzePrivacy(supabase, company_id, data_asset_id, openaiApiKey);
        break;
      case 'quality':
        result = await analyzeQuality(supabase, company_id, data_asset_id, openaiApiKey);
        break;
      case 'risk':
        result = await analyzeRisk(supabase, company_id, data_asset_id, openaiApiKey);
        break;
      default:
        throw new Error('Invalid analysis type');
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis_type,
        result,
        execution_time_ms: Date.now() - startTime
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// 合規性分析
async function analyzeCompliance(
  supabase: any, 
  companyId: string, 
  assetId: string | undefined, 
  checkType: string | undefined,
  openaiApiKey: string | undefined
) {
  // 載入數據資產
  let query = supabase
    .from('data_assets')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'active');

  if (assetId) {
    query = query.eq('id', assetId);
  }

  const { data: assets, error } = await query;
  if (error) throw error;

  const issues: any[] = [];
  const recommendations: string[] = [];
  let complianceScore = 100;

  // 規則檢查
  for (const asset of assets) {
    // 檢查加密狀態
    if (asset.classification_level === 'confidential' || asset.classification_level === 'secret') {
      if (asset.encryption_status === 'none') {
        issues.push({
          asset_id: asset.id,
          asset_name: asset.asset_name,
          severity: 'high',
          issue: '敏感數據未加密',
          requirement: checkType || 'GDPR Article 32'
        });
        complianceScore -= 15;
      }
    }

    // 檢查訪問控制
    if (asset.access_control_type === 'none' || asset.access_control_type === 'public') {
      if (asset.classification_level !== 'public') {
        issues.push({
          asset_id: asset.id,
          asset_name: asset.asset_name,
          severity: 'high',
          issue: '缺少訪問控制',
          requirement: checkType || 'ISO 27001'
        });
        complianceScore -= 10;
      }
    }

    // 檢查備份策略
    if (asset.backup_status === 'none' && asset.requires_audit) {
      issues.push({
        asset_id: asset.id,
        asset_name: asset.asset_name,
        severity: 'medium',
        issue: '缺少備份策略',
        requirement: checkType || 'Business Continuity'
      });
      complianceScore -= 5;
    }

    // 檢查個人資料保護
    if (asset.is_personal_data) {
      if (!asset.retention_period_days) {
        issues.push({
          asset_id: asset.id,
          asset_name: asset.asset_name,
          severity: 'medium',
          issue: '未設定保留期限',
          requirement: 'GDPR Article 5(1)(e)'
        });
        complianceScore -= 5;
      }
    }
  }

  // 生成建議
  if (issues.length === 0) {
    recommendations.push('所有數據資產符合合規要求');
  } else {
    if (issues.some(i => i.issue.includes('加密'))) {
      recommendations.push('為敏感數據啟用加密（at-rest 和 in-transit）');
    }
    if (issues.some(i => i.issue.includes('訪問控制'))) {
      recommendations.push('實施角色基礎訪問控制（RBAC）');
    }
    if (issues.some(i => i.issue.includes('備份'))) {
      recommendations.push('建立定期備份策略（至少每週一次）');
    }
    if (issues.some(i => i.issue.includes('保留期限'))) {
      recommendations.push('為所有包含個人資料的資產設定保留期限');
    }
  }

  // AI 增強分析
  let aiInsights = null;
  if (openaiApiKey && issues.length > 0) {
    try {
      const prompt = `作為數據合規專家，請分析以下合規檢查結果：

檢查類型：${checkType || '一般合規檢查'}
數據資產數量：${assets.length}
發現問題數量：${issues.length}

問題清單：
${issues.map((issue, i) => `${i + 1}. [${issue.severity}] ${issue.asset_name}: ${issue.issue} (需符合: ${issue.requirement})`).join('\n')}

請提供：
1. 風險評估（0-100）
2. 優先改善建議（最重要的 3 項）
3. 合規路線圖

請用繁體中文簡潔回答。`;

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: '你是資深的數據治理與合規專家，擅長 GDPR、PDPA、ISO 27001 等標準。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (openaiResponse.ok) {
        const aiResult = await openaiResponse.json();
        aiInsights = aiResult.choices[0].message.content;
      }
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
    }
  }

  // 保存檢查結果
  const checkResult = {
    company_id: companyId,
    check_name: `${checkType || '合規'} 檢查 - ${new Date().toLocaleDateString('zh-TW')}`,
    check_type: checkType?.toLowerCase() || 'custom',
    data_asset_id: assetId || null,
    status: complianceScore >= 80 ? 'passed' : complianceScore >= 60 ? 'warning' : 'failed',
    compliance_score: Math.max(0, complianceScore),
    issues_found: issues,
    recommendations: recommendations,
    risk_level: complianceScore >= 80 ? 'low' : complianceScore >= 60 ? 'medium' : 'high',
    ai_analysis: aiInsights,
    ai_confidence_score: aiInsights ? 90 : null,
    checked_at: new Date().toISOString()
  };

  const { data: savedCheck, error: saveError } = await supabase
    .from('compliance_checks')
    .insert(checkResult)
    .select()
    .single();

  if (saveError) {
    console.error('Error saving check:', saveError);
  }

  return {
    check_id: savedCheck?.id,
    compliance_score: Math.max(0, complianceScore),
    status: checkResult.status,
    issues_count: issues.length,
    issues,
    recommendations,
    ai_insights: aiInsights
  };
}

// 隱私影響分析
async function analyzePrivacy(
  supabase: any,
  companyId: string,
  assetId: string | undefined,
  openaiApiKey: string | undefined
) {
  // 查找包含個人資料的資產
  let query = supabase
    .from('data_assets')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_personal_data', true)
    .eq('status', 'active');

  if (assetId) {
    query = query.eq('id', assetId);
  }

  const { data: assets, error } = await query;
  if (error) throw error;

  const risks: any[] = [];
  let riskScore = 0;

  for (const asset of assets) {
    const assetRisks: any[] = [];

    // 檢查加密
    if (asset.encryption_status !== 'both') {
      assetRisks.push({
        risk: '個人資料未完全加密',
        impact: 'high',
        likelihood: 'medium'
      });
      riskScore += 20;
    }

    // 檢查訪問控制
    if (asset.access_control_type === 'public') {
      assetRisks.push({
        risk: '個人資料可公開訪問',
        impact: 'critical',
        likelihood: 'high'
      });
      riskScore += 30;
    }

    // 檢查保留期限
    if (!asset.retention_period_days) {
      assetRisks.push({
        risk: '未設定資料保留期限',
        impact: 'medium',
        likelihood: 'high'
      });
      riskScore += 10;
    }

    if (assetRisks.length > 0) {
      risks.push({
        asset_id: asset.id,
        asset_name: asset.asset_name,
        risks: assetRisks
      });
    }
  }

  return {
    total_personal_data_assets: assets.length,
    risk_score: Math.min(100, riskScore),
    risk_level: riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low',
    risks,
    recommendations: [
      '對所有個人資料啟用完整加密',
      '實施最小權限原則',
      '設定明確的資料保留期限',
      '定期進行隱私影響評估'
    ]
  };
}

// 數據品質分析
async function analyzeQuality(
  supabase: any,
  companyId: string,
  assetId: string | undefined,
  openaiApiKey: string | undefined
) {
  const { data: asset, error } = await supabase
    .from('data_assets')
    .select('*')
    .eq('id', assetId)
    .single();

  if (error) throw error;

  // 簡化的品質評分
  let completenessScore = 100;
  let accuracyScore = 95;
  let consistencyScore = 90;
  let timelinessScore = asset.last_updated ? 
    (Date.now() - new Date(asset.last_updated).getTime()) / (1000 * 60 * 60 * 24) < 30 ? 95 : 70 : 50;
  let validityScore = asset.metadata ? 90 : 70;

  const overallScore = Math.round(
    (completenessScore + accuracyScore + consistencyScore + timelinessScore + validityScore) / 5
  );

  const grade = overallScore >= 90 ? 'A' : 
                overallScore >= 80 ? 'B' :
                overallScore >= 70 ? 'C' :
                overallScore >= 60 ? 'D' : 'F';

  // 保存評估
  const assessment = {
    company_id: companyId,
    data_asset_id: assetId,
    completeness_score: completenessScore,
    accuracy_score: accuracyScore,
    consistency_score: consistencyScore,
    timeliness_score: timelinessScore,
    validity_score: validityScore,
    overall_quality_score: overallScore,
    quality_grade: grade,
    assessed_at: new Date().toISOString()
  };

  await supabase
    .from('data_quality_assessments')
    .insert(assessment);

  return {
    asset_name: asset.asset_name,
    overall_score: overallScore,
    grade,
    dimensions: {
      completeness: completenessScore,
      accuracy: accuracyScore,
      consistency: consistencyScore,
      timeliness: timelinessScore,
      validity: validityScore
    }
  };
}

// 風險分析
async function analyzeRisk(
  supabase: any,
  companyId: string,
  assetId: string | undefined,
  openaiApiKey: string | undefined
) {
  // 獲取所有相關數據
  const { data: assets } = await supabase
    .from('data_assets')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'active');

  const { data: checks } = await supabase
    .from('compliance_checks')
    .select('*')
    .eq('company_id', companyId)
    .order('checked_at', { ascending: false })
    .limit(10);

  const { data: accessRecords } = await supabase
    .from('access_control_records')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_anomaly', true)
    .order('accessed_at', { ascending: false })
    .limit(10);

  // 計算整體風險
  let riskScore = 0;
  const riskFactors: any[] = [];

  // 敏感資料風險
  const sensitiveAssets = assets.filter((a: any) => 
    a.is_sensitive || a.classification_level === 'secret' || a.classification_level === 'top-secret'
  );
  if (sensitiveAssets.length > 0) {
    riskScore += sensitiveAssets.length * 5;
    riskFactors.push({
      factor: '敏感資料',
      count: sensitiveAssets.length,
      impact: 'high'
    });
  }

  // 未加密風險
  const unencryptedAssets = assets.filter((a: any) => a.encryption_status === 'none');
  if (unencryptedAssets.length > 0) {
    riskScore += unencryptedAssets.length * 10;
    riskFactors.push({
      factor: '未加密資料',
      count: unencryptedAssets.length,
      impact: 'high'
    });
  }

  // 合規問題風險
  const failedChecks = checks?.filter((c: any) => c.status === 'failed') || [];
  if (failedChecks.length > 0) {
    riskScore += failedChecks.length * 15;
    riskFactors.push({
      factor: '合規檢查失敗',
      count: failedChecks.length,
      impact: 'critical'
    });
  }

  // 異常訪問風險
  if (accessRecords && accessRecords.length > 0) {
    riskScore += accessRecords.length * 8;
    riskFactors.push({
      factor: '異常訪問記錄',
      count: accessRecords.length,
      impact: 'high'
    });
  }

  return {
    overall_risk_score: Math.min(100, riskScore),
    risk_level: riskScore >= 70 ? 'critical' : riskScore >= 40 ? 'high' : riskScore >= 20 ? 'medium' : 'low',
    risk_factors: riskFactors,
    total_assets: assets.length,
    sensitive_assets: sensitiveAssets.length,
    recommendations: [
      '立即加密所有敏感資料',
      '修復合規檢查中的問題',
      '調查並處理異常訪問',
      '定期進行安全審計'
    ]
  };
}

