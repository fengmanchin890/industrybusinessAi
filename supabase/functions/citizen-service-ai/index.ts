import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ServiceRequest {
  title: string
  description: string
  category?: string
  priority?: string
  citizenName?: string
  contactInfo?: string
}

interface AnalysisRequest {
  action: 'analyze_request' | 'suggest_response' | 'categorize' | 'sentiment_analysis' | 'generate_faq' | 'smart_search'
  data: any
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // 驗證用戶
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('未授權的訪問')
    }

    // 獲取公司 ID
    const { data: userData } = await supabaseClient
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userData?.company_id) {
      throw new Error('找不到公司資訊')
    }

    const companyId = userData.company_id
    const { action, data } = await req.json() as AnalysisRequest

    let result: any = {}

    switch (action) {
      case 'analyze_request':
        result = await analyzeServiceRequest(data, companyId, supabaseClient)
        break

      case 'suggest_response':
        result = await suggestResponse(data, companyId, supabaseClient)
        break

      case 'categorize':
        result = await categorizeRequest(data)
        break

      case 'sentiment_analysis':
        result = await analyzeSentiment(data)
        break

      case 'generate_faq':
        result = await generateFAQ(data, companyId, supabaseClient)
        break

      case 'smart_search':
        result = await smartSearch(data, companyId, supabaseClient)
        break

      default:
        throw new Error(`不支援的操作: ${action}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

/**
 * AI 分析服務請求
 */
async function analyzeServiceRequest(request: ServiceRequest, companyId: string, supabaseClient: any) {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')

  if (openaiKey) {
    // 使用 OpenAI 進行智能分析
    const prompt = `你是一個政府市民服務智能助理。請分析以下市民服務請求：

請求標題: ${request.title}
請求描述: ${request.description}
${request.category ? `類別: ${request.category}` : ''}

請提供以下分析（JSON 格式）：
1. category: 建議的服務類別（social_welfare/tax/housing/education/healthcare/business/transportation/environment/general）
2. priority: 優先級（low/medium/high/urgent）
3. sentiment: 情緒（positive/neutral/negative/urgent）
4. sentiment_score: 情緒分數（-1 到 1）
5. keywords: 關鍵詞陣列（最多5個）
6. suggested_department: 建議處理部門
7. estimated_resolution_time: 預估處理時間（小時）
8. required_actions: 需要的行動步驟（陣列）
9. similar_cases_query: 搜索類似案例的查詢字串
10. ai_summary: 簡短摘要

只回傳 JSON，不要其他文字。`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: '你是市民服務智能分析專家，專門協助政府機構提供更好的公共服務。' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const aiData = await response.json()
      const analysis = JSON.parse(aiData.choices[0].message.content)

      // 計算 SLA 截止時間
      const slaHours = analysis.estimated_resolution_time || 24
      const slaDeadline = new Date()
      slaDeadline.setHours(slaDeadline.getHours() + slaHours)

      return {
        success: true,
        analysis: {
          ...analysis,
          sla_deadline: slaDeadline.toISOString(),
          confidence: 0.85,
          ai_powered: true,
        },
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      // 如果 AI 失敗，使用規則引擎
      return await ruleBasedAnalysis(request)
    }
  }

  // 使用規則引擎
  return await ruleBasedAnalysis(request)
}

/**
 * 規則引擎分析
 */
function ruleBasedAnalysis(request: ServiceRequest) {
  const description = request.description.toLowerCase()
  const title = request.title.toLowerCase()
  const text = `${title} ${description}`

  // 類別判斷
  let category = 'general'
  if (/(補助|津貼|救助|低收|身障|老人|兒童)/i.test(text)) category = 'social_welfare'
  else if (/(稅|繳稅|報稅|牌照|營業)/i.test(text)) category = 'tax'
  else if (/(房屋|建築|都更|違建|公寓)/i.test(text)) category = 'housing'
  else if (/(學校|教育|入學|學籍)/i.test(text)) category = 'education'
  else if (/(醫療|健保|疫苗|診所)/i.test(text)) category = 'healthcare'
  else if (/(營業|登記|公司|商業)/i.test(text)) category = 'business'
  else if (/(交通|停車|道路|紅綠燈)/i.test(text)) category = 'transportation'
  else if (/(垃圾|環保|污染|噪音)/i.test(text)) category = 'environment'

  // 優先級判斷
  let priority = 'medium'
  if (/(緊急|急|危險|嚴重)/i.test(text)) priority = 'urgent'
  else if (/(重要|盡快|儘速)/i.test(text)) priority = 'high'
  else if (/(詢問|諮詢|請問)/i.test(text)) priority = 'low'

  // 情緒分析
  let sentiment = 'neutral'
  let sentimentScore = 0
  if (/(感謝|謝謝|很好|滿意|優秀)/i.test(text)) {
    sentiment = 'positive'
    sentimentScore = 0.6
  } else if (/(抱怨|不滿|糟糕|差|爛|問題)/i.test(text)) {
    sentiment = 'negative'
    sentimentScore = -0.6
  } else if (/(緊急|急|危險)/i.test(text)) {
    sentiment = 'urgent'
    sentimentScore = -0.3
  }

  // 關鍵詞提取
  const keywords: string[] = []
  const keywordPatterns = [
    /補助/g, /稅/g, /房屋/g, /學校/g, /醫療/g,
    /營業/g, /交通/g, /環保/g, /申請/g, /查詢/g,
  ]
  keywordPatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches && matches[0] && !keywords.includes(matches[0])) {
      keywords.push(matches[0])
    }
  })

  // 部門分配
  const departmentMap: Record<string, string> = {
    'social_welfare': '社會局',
    'tax': '稅務局',
    'housing': '都市發展局',
    'education': '教育局',
    'healthcare': '衛生局',
    'business': '經濟發展局',
    'transportation': '交通局',
    'environment': '環境保護局',
    'general': '市民服務中心',
  }

  // 預估處理時間（小時）
  const timeMap: Record<string, number> = {
    'urgent': 4,
    'high': 12,
    'medium': 24,
    'low': 48,
  }

  const slaHours = timeMap[priority]
  const slaDeadline = new Date()
  slaDeadline.setHours(slaDeadline.getHours() + slaHours)

  return {
    success: true,
    analysis: {
      category,
      priority,
      sentiment,
      sentiment_score: sentimentScore,
      keywords: keywords.slice(0, 5),
      suggested_department: departmentMap[category],
      estimated_resolution_time: slaHours,
      sla_deadline: slaDeadline.toISOString(),
      required_actions: [
        '確認市民身份',
        '審核相關文件',
        '分配至相關部門',
        '進行處理並回覆',
      ],
      similar_cases_query: keywords.join(' '),
      ai_summary: `${category}相關請求，優先級：${priority}`,
      confidence: 0.7,
      ai_powered: false,
    },
  }
}

/**
 * 建議回覆內容
 */
async function suggestResponse(data: any, companyId: string, supabaseClient: any) {
  const { requestId, requestTitle, requestDescription, category } = data
  const openaiKey = Deno.env.get('OPENAI_API_KEY')

  // 先從知識庫搜索
  const { data: kbData } = await supabaseClient
    .from('service_knowledge_base')
    .select('*')
    .eq('company_id', companyId)
    .eq('category', category)
    .eq('is_active', true)
    .limit(3)

  let knowledgeContext = ''
  if (kbData && kbData.length > 0) {
    knowledgeContext = kbData
      .map((kb: any) => `Q: ${kb.question}\nA: ${kb.answer}`)
      .join('\n\n')
  }

  if (openaiKey) {
    const prompt = `你是一個專業的政府市民服務人員。請為以下市民請求提供一個專業、友善、有幫助的回覆。

市民請求:
標題: ${requestTitle}
描述: ${requestDescription}

${knowledgeContext ? `相關知識庫:\n${knowledgeContext}\n` : ''}

請提供以下內容（JSON 格式）：
1. response: 完整的回覆內容（繁體中文，專業且友善）
2. key_points: 回覆的重點摘要（陣列）
3. next_steps: 建議的後續步驟（陣列）
4. required_documents: 需要的文件清單（陣列，如果適用）
5. estimated_time: 預估處理時間
6. contact_info: 相關聯絡資訊
7. reference_links: 參考連結（陣列，如果適用）

回覆應該包含：
- 禮貌的開頭
- 清楚的說明和指引
- 具體的行動步驟
- 相關規定或法規
- 聯絡方式
- 禮貌的結尾

只回傳 JSON，不要其他文字。`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: '你是專業的政府市民服務專員，提供準確、友善、有幫助的回覆。' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 1500,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const aiData = await response.json()
      const suggestion = JSON.parse(aiData.choices[0].message.content)

      return {
        success: true,
        suggestion: {
          ...suggestion,
          ai_generated: true,
          confidence: 0.85,
        },
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
    }
  }

  // 使用範本回覆
  return {
    success: true,
    suggestion: {
      response: `親愛的市民您好：\n\n感謝您的來信。我們已經收到您的請求，將盡快為您處理。\n\n${
        knowledgeContext ? '根據相關規定，' + kbData[0]?.answer : '我們的專員將盡快與您聯繫。'
      }\n\n如有任何問題，歡迎隨時聯絡我們。\n\n敬祝  順心\n市民服務中心 敬上`,
      key_points: ['已收到請求', '將盡快處理', '可隨時聯絡'],
      next_steps: ['等待專員聯絡', '準備相關文件'],
      required_documents: [],
      estimated_time: '1-3個工作天',
      contact_info: '市民服務專線：1999',
      reference_links: [],
      ai_generated: false,
      confidence: 0.6,
    },
  }
}

/**
 * 快速分類
 */
function categorizeRequest(data: any) {
  const { text } = data
  const analysis = ruleBasedAnalysis({ title: '', description: text })

  return {
    success: true,
    category: analysis.analysis.category,
    confidence: analysis.analysis.confidence,
  }
}

/**
 * 情緒分析
 */
function analyzeSentiment(data: any) {
  const { text } = data
  const analysis = ruleBasedAnalysis({ title: '', description: text })

  return {
    success: true,
    sentiment: analysis.analysis.sentiment,
    score: analysis.analysis.sentiment_score,
    keywords: analysis.analysis.keywords,
  }
}

/**
 * 生成 FAQ
 */
async function generateFAQ(data: any, companyId: string, supabaseClient: any) {
  const { requests } = data
  const openaiKey = Deno.env.get('OPENAI_API_KEY')

  if (!openaiKey) {
    return {
      success: false,
      error: '需要 OpenAI API Key 來生成 FAQ',
    }
  }

  // 分析常見問題模式
  const requestSummary = requests
    .slice(0, 20)
    .map((r: any, i: number) => `${i + 1}. ${r.title}: ${r.description.substring(0, 100)}...`)
    .join('\n')

  const prompt = `基於以下市民服務請求，生成 5 個最常見的 FAQ（常見問題與答案）：

${requestSummary}

請提供 JSON 陣列格式：
[
  {
    "question": "問題",
    "answer": "詳細答案",
    "category": "類別",
    "keywords": ["關鍵詞1", "關鍵詞2"]
  }
]

只回傳 JSON 陣列，不要其他文字。`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: '你是市民服務專家，擅長整理常見問題。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const aiData = await response.json()
    const faqs = JSON.parse(aiData.choices[0].message.content)

    return {
      success: true,
      faqs,
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * 智能搜索
 */
async function smartSearch(data: any, companyId: string, supabaseClient: any) {
  const { query, searchType = 'all' } = data

  const results: any = {
    requests: [],
    knowledge: [],
    faqs: [],
  }

  // 搜索服務請求
  if (searchType === 'all' || searchType === 'requests') {
    const { data: requests } = await supabaseClient
      .from('service_requests')
      .select('*')
      .eq('company_id', companyId)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(10)

    results.requests = requests || []
  }

  // 搜索知識庫
  if (searchType === 'all' || searchType === 'knowledge') {
    const { data: knowledge } = await supabaseClient
      .from('service_knowledge_base')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .or(`question.ilike.%${query}%,answer.ilike.%${query}%`)
      .limit(10)

    results.knowledge = knowledge || []
  }

  // 搜索 FAQ
  if (searchType === 'all' || searchType === 'faqs') {
    const { data: faqs } = await supabaseClient
      .from('service_faqs')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .or(`question.ilike.%${query}%,answer.ilike.%${query}%`)
      .limit(10)

    results.faqs = faqs || []
  }

  return {
    success: true,
    query,
    results,
    total: results.requests.length + results.knowledge.length + results.faqs.length,
  }
}

