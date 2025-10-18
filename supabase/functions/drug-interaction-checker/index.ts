/**
 * Drug Interaction Checker Edge Function
 * 使用 AI 檢查藥物交互作用、過敏反應和禁忌症
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckRequest {
  company_id: string;
  patient_id?: string;
  medications: Array<{
    medication_id: string;
    dosage: string;
    frequency: string;
  }>;
}

interface DrugInteraction {
  drug_a: string;
  drug_b: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  recommendation: string;
  mechanism?: string;
}

interface CheckResult {
  interactions_found: DrugInteraction[];
  allergies_detected: any[];
  contraindications_found: any[];
  overall_risk_score: number;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  ai_recommendations: string[];
  clinical_alerts: string[];
}

serve(async (req) => {
  // Handle CORS preflight
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

    const { company_id, patient_id, medications }: CheckRequest = await req.json();

    if (!company_id || !medications || medications.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();

    // 1. 載入藥物詳細資訊
    const medicationIds = medications.map(m => m.medication_id);
    const { data: medicationData, error: medError } = await supabase
      .from('medications')
      .select('*')
      .in('id', medicationIds);

    if (medError) throw medError;

    // 2. 檢查資料庫中的交互作用
    const dbInteractions: DrugInteraction[] = [];
    
    for (let i = 0; i < medicationData.length; i++) {
      for (let j = i + 1; j < medicationData.length; j++) {
        const drugA = medicationData[i];
        const drugB = medicationData[j];

        // 查詢交互作用
        const { data: interaction } = await supabase
          .from('drug_interactions')
          .select('*')
          .or(`and(drug_a_id.eq.${drugA.id},drug_b_id.eq.${drugB.id}),and(drug_a_id.eq.${drugB.id},drug_b_id.eq.${drugA.id})`)
          .single();

        if (interaction) {
          dbInteractions.push({
            drug_a: drugA.drug_name,
            drug_b: drugB.drug_name,
            severity: interaction.severity,
            description: interaction.description,
            recommendation: interaction.recommendation,
            mechanism: interaction.mechanism
          });
        }
      }
    }

    // 3. 檢查病患過敏記錄
    let allergiesDetected: any[] = [];
    if (patient_id) {
      const { data: allergies } = await supabase
        .from('patient_allergies')
        .select('*')
        .eq('patient_id', patient_id)
        .eq('is_active', true);

      if (allergies) {
        // 檢查是否有過敏的藥物
        allergiesDetected = allergies.filter(allergy => 
          allergy.allergen_type === 'medication' &&
          medicationIds.includes(allergy.medication_id)
        ).map(allergy => ({
          allergen_name: allergy.allergen_name,
          severity: allergy.reaction_severity,
          symptoms: allergy.reaction_symptoms,
          description: allergy.reaction_description
        }));
      }
    }

    // 4. 檢查禁忌症
    const contraindicationsFound: any[] = [];
    medicationData.forEach(med => {
      if (med.contraindications && med.contraindications.length > 0) {
        contraindicationsFound.push({
          drug_name: med.drug_name,
          contraindications: med.contraindications,
          warnings: med.warnings || []
        });
      }
    });

    // 5. AI 增強分析（如果有 OpenAI API Key）
    let aiRecommendations: string[] = [];
    let aiInsights: any = null;

    if (openaiApiKey && dbInteractions.length > 0) {
      try {
        const prompt = `你是一位臨床藥師，請分析以下藥物交互作用並提供專業建議：

藥物清單：
${medicationData.map((m, i) => `${i + 1}. ${m.drug_name} (${m.generic_name}) - ${medications[i].dosage}, ${medications[i].frequency}`).join('\n')}

已識別的交互作用：
${dbInteractions.map((inter, i) => `${i + 1}. ${inter.drug_a} 與 ${inter.drug_b}：${inter.severity} severity
   描述：${inter.description}
   建議：${inter.recommendation}`).join('\n\n')}

${allergiesDetected.length > 0 ? `病患過敏史：\n${allergiesDetected.map(a => `- ${a.allergen_name} (${a.severity})`).join('\n')}` : ''}

請提供：
1. 臨床風險評估
2. 具體的用藥建議
3. 需要監測的項目
4. 是否需要調整劑量或更換藥物

請以繁體中文回答，簡潔專業。`;

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
                content: '你是一位資深臨床藥師，擅長藥物治療管理和交互作用分析。'
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
          const aiText = aiResult.choices[0].message.content;
          
          // 解析 AI 建議
          aiRecommendations = aiText.split('\n').filter((line: string) => line.trim().length > 0);
          aiInsights = {
            full_analysis: aiText,
            model: 'gpt-4-turbo-preview'
          };
        }
      } catch (aiError) {
        console.error('AI analysis error:', aiError);
        // 如果 AI 失敗，繼續使用資料庫結果
      }
    }

    // 6. 計算風險分數
    let riskScore = 0;
    
    // 根據交互作用嚴重程度加分
    dbInteractions.forEach(inter => {
      switch (inter.severity) {
        case 'contraindicated': riskScore += 40; break;
        case 'major': riskScore += 25; break;
        case 'moderate': riskScore += 15; break;
        case 'minor': riskScore += 5; break;
      }
    });

    // 過敏反應加分
    allergiesDetected.forEach(allergy => {
      switch (allergy.severity) {
        case 'life-threatening': riskScore += 50; break;
        case 'severe': riskScore += 35; break;
        case 'moderate': riskScore += 20; break;
        case 'mild': riskScore += 10; break;
      }
    });

    // 禁忌症加分
    riskScore += contraindicationsFound.length * 15;

    // 限制在 0-100 之間
    riskScore = Math.min(100, riskScore);

    // 確定風險等級
    let riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    if (riskScore >= 70) riskLevel = 'critical';
    else if (riskScore >= 40) riskLevel = 'high';
    else if (riskScore >= 20) riskLevel = 'moderate';
    else riskLevel = 'low';

    // 7. 生成臨床警示
    const clinicalAlerts: string[] = [];
    
    if (allergiesDetected.length > 0) {
      clinicalAlerts.push(`⚠️ 警告：發現 ${allergiesDetected.length} 項過敏記錄，請立即檢視`);
    }
    
    const criticalInteractions = dbInteractions.filter(i => i.severity === 'contraindicated' || i.severity === 'major');
    if (criticalInteractions.length > 0) {
      clinicalAlerts.push(`⚠️ 嚴重：發現 ${criticalInteractions.length} 項高風險藥物交互作用`);
    }

    if (contraindicationsFound.length > 0) {
      clinicalAlerts.push(`⚠️ 注意：${contraindicationsFound.length} 種藥物有禁忌症需要確認`);
    }

    // 8. 生成預設建議（如果沒有 AI）
    if (aiRecommendations.length === 0 && riskScore > 0) {
      if (riskLevel === 'critical' || riskLevel === 'high') {
        aiRecommendations.push('建議立即諮詢臨床藥師或醫師');
        aiRecommendations.push('密切監測病患反應和生命徵象');
      }
      if (dbInteractions.length > 0) {
        aiRecommendations.push('定期監測相關生化指標');
        aiRecommendations.push('向病患說明可能的副作用');
      }
    }

    // 9. 保存檢查記錄
    const checkResult: CheckResult = {
      interactions_found: dbInteractions,
      allergies_detected: allergiesDetected,
      contraindications_found: contraindicationsFound,
      overall_risk_score: riskScore,
      risk_level: riskLevel,
      ai_recommendations: aiRecommendations,
      clinical_alerts: clinicalAlerts
    };

    const { data: savedCheck, error: saveError } = await supabase
      .from('drug_interaction_checks')
      .insert({
        company_id,
        patient_id: patient_id || null,
        medications_checked: medications,
        interactions_found: dbInteractions,
        allergies_detected: allergiesDetected,
        contraindications_found: contraindicationsFound,
        overall_risk_score: riskScore,
        risk_level: riskLevel,
        ai_recommendations: aiRecommendations,
        clinical_alerts: clinicalAlerts,
        ai_model: aiInsights ? aiInsights.model : 'database-only',
        confidence_score: aiInsights ? 95 : 85,
        check_duration_ms: Date.now() - startTime
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving check:', saveError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        check_id: savedCheck?.id,
        result: checkResult,
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

