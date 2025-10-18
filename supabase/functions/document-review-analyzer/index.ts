import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface AnalysisRequest {
  action: 'analyze_document' | 'check_compliance' | 'get_statistics' | 'validate_document' | 'extract_data'
  data: {
    documentId?: string
    documentType?: string
    documentContent?: any
    complianceRules?: string[]
    extractionFields?: string[]
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
        service: 'document-review-analyzer',
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
      case 'analyze_document':
        result = await analyzeDocument(supabase, userData.company_id, data)
        break
      case 'check_compliance':
        result = await checkCompliance(supabase, userData.company_id, data)
        break
      case 'validate_document':
        result = await validateDocument(supabase, userData.company_id, data)
        break
      case 'extract_data':
        result = await extractData(supabase, userData.company_id, data)
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

async function analyzeDocument(supabase: any, companyId: string, data: any) {
  const { documentId, documentContent } = data

  console.log('Analyzing document:', { documentId, hasContent: !!documentContent })

  let document

  // 如果提供文件 ID，從數據庫獲取
  if (documentId) {
    const { data: dbDocument, error } = await supabase
      .from('financial_documents')
      .select('*')
      .eq('id', documentId)
      .eq('company_id', companyId)
      .single()

    if (error || !dbDocument) {
      throw new Error('Document not found')
    }
    document = dbDocument
  } else if (documentContent) {
    // 使用提供的文件內容
    document = documentContent
  } else {
    throw new Error('Document ID or content is required')
  }

  // AI 分析邏輯
  console.log('Starting AI analysis...')

  // 1. 完整性檢查
  const completenessScore = await checkCompleteness(document)
  
  // 2. 風險評估
  const riskScore = await assessRisk(document)
  
  // 3. 合規性檢查
  const complianceScore = await checkComplianceScore(supabase, companyId, document)
  
  // 4. 信心分數（基於多個因素）
  const confidenceScore = Math.round(
    (completenessScore * 0.3 + 
     (100 - riskScore) * 0.4 + 
     complianceScore * 0.3)
  )

  // 5. 識別問題和缺失信息
  const findings = await identifyIssues(document)
  const missingInfo = await identifyMissingInfo(document)
  const complianceIssues = await identifyComplianceIssues(supabase, companyId, document)

  // 6. AI 建議
  let recommendation = 'review' // default
  let reasoning = ''

  if (confidenceScore >= 85 && riskScore < 30 && complianceIssues.length === 0) {
    recommendation = 'approve'
    reasoning = '文件完整、風險低、符合合規要求，建議自動核准'
  } else if (riskScore > 70 || complianceIssues.length > 2) {
    recommendation = 'reject'
    reasoning = '檢測到高風險因素或嚴重合規問題，建議拒絕'
  } else {
    recommendation = 'review'
    reasoning = '文件需要人工審核以確認關鍵信息'
  }

  // 7. 生成 AI 摘要
  const summary = generateDocumentSummary(document, findings, riskScore)

  const analysisResult = {
    document_id: documentId || document.id,
    confidence_score: confidenceScore,
    risk_score: riskScore,
    compliance_score: complianceScore,
    completeness_score: completenessScore,
    findings,
    missing_information: missingInfo,
    compliance_issues: complianceIssues,
    risk_factors: findings.filter((f: any) => f.severity === 'high' || f.severity === 'critical').map((f: any) => f.description),
    recommendation,
    reasoning,
    summary,
    analysis_timestamp: new Date().toISOString()
  }

  // 8. 如果有 documentId，更新數據庫
  if (documentId) {
    console.log('Updating document in database...')
    try {
      await supabase
        .from('financial_documents')
        .update({
          ai_confidence_score: confidenceScore,
          ai_risk_score: riskScore,
          ai_compliance_score: complianceScore,
          ai_completeness_score: completenessScore,
          ai_findings: findings,
          missing_information: missingInfo,
          compliance_issues: complianceIssues.map((i: any) => i.description),
          risk_factors_detected: analysisResult.risk_factors,
          ai_recommendation: recommendation,
          ai_reasoning: reasoning,
          ai_summary: summary,
          review_status: recommendation === 'approve' ? 'approved' : 
                        recommendation === 'reject' ? 'rejected' : 'processing',
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)

      // 記錄審核歷史
      await supabase
        .from('document_review_history')
        .insert({
          document_id: documentId,
          company_id: companyId,
          action: 'ai_analyzed',
          action_by_name: 'AI System',
          new_status: recommendation === 'approve' ? 'approved' : 
                      recommendation === 'reject' ? 'rejected' : 'processing',
          notes: `AI 分析完成: ${reasoning}`
        })

      console.log('Document updated successfully')
    } catch (updateError) {
      console.warn('Error updating document:', updateError)
    }
  }

  return analysisResult
}

async function checkCompleteness(document: any): Promise<number> {
  const requiredFields = [
    'document_title',
    'document_type_id',
    'customer_name',
    'file_url',
    'submission_date'
  ]

  const presentFields = requiredFields.filter(field => {
    const value = document[field]
    return value !== null && value !== undefined && value !== ''
  })

  const completenessScore = Math.round((presentFields.length / requiredFields.length) * 100)
  console.log('Completeness check:', { presentFields: presentFields.length, total: requiredFields.length, score: completenessScore })
  
  return completenessScore
}

async function assessRisk(document: any): Promise<number> {
  let riskScore = 0
  const factors: string[] = []

  // 金額風險
  const loanAmount = parseFloat(document.loan_amount || 0)
  const investmentAmount = parseFloat(document.investment_amount || 0)
  const totalAmount = loanAmount + investmentAmount

  if (totalAmount > 10000000) { // 超過 1000 萬
    riskScore += 30
    factors.push('高額交易')
  } else if (totalAmount > 5000000) { // 超過 500 萬
    riskScore += 20
    factors.push('中高額交易')
  } else if (totalAmount > 1000000) { // 超過 100 萬
    riskScore += 10
    factors.push('中額交易')
  }

  // 文件完整性風險
  if (!document.customer_id_number) {
    riskScore += 15
    factors.push('缺少客戶身份證號')
  }

  if (!document.file_url) {
    riskScore += 20
    factors.push('缺少文件檔案')
  }

  // 客戶信息風險
  if (!document.customer_name || document.customer_name.length < 2) {
    riskScore += 10
    factors.push('客戶信息不完整')
  }

  // 緊急/高優先級風險
  if (document.priority === 'urgent') {
    riskScore += 5
    factors.push('緊急案件需額外審查')
  }

  console.log('Risk assessment:', { riskScore, factors })
  
  return Math.min(riskScore, 100)
}

async function checkComplianceScore(supabase: any, companyId: string, document: any): Promise<number> {
  try {
    // 獲取適用的合規規則
    const { data: rules } = await supabase
      .from('compliance_rules')
      .select('*')
      .eq('is_active', true)

    if (!rules || rules.length === 0) {
      console.log('No compliance rules found, assuming 100% compliance')
      return 100
    }

    let passedRules = 0
    let totalRules = rules.length

    rules.forEach((rule: any) => {
      // 簡化的合規檢查邏輯
      const checkFields = rule.check_fields || []
      let rulePassed = true

      checkFields.forEach((field: string) => {
        if (!document[field] || document[field] === '') {
          rulePassed = false
        }
      })

      if (rulePassed) {
        passedRules++
      }
    })

    const complianceScore = Math.round((passedRules / totalRules) * 100)
    console.log('Compliance check:', { passedRules, totalRules, score: complianceScore })
    
    return complianceScore
  } catch (error) {
    console.warn('Error checking compliance:', error)
    return 80 // 預設分數
  }
}

async function identifyIssues(document: any): Promise<any[]> {
  const issues: any[] = []

  // 檢查基本信息
  if (!document.document_title || document.document_title.length < 5) {
    issues.push({
      type: 'completeness',
      severity: 'medium',
      field: 'document_title',
      description: '文件標題過短或缺失',
      recommendation: '請提供完整的文件標題'
    })
  }

  if (!document.customer_id_number) {
    issues.push({
      type: 'verification',
      severity: 'high',
      field: 'customer_id_number',
      description: '缺少客戶身份證號',
      recommendation: '必須提供客戶身份證號進行KYC驗證'
    })
  }

  // 檢查金額
  const loanAmount = parseFloat(document.loan_amount || 0)
  if (loanAmount > 10000000) {
    issues.push({
      type: 'risk',
      severity: 'high',
      field: 'loan_amount',
      description: '貸款金額超過1000萬元',
      recommendation: '需要額外的財務文件和擔保證明'
    })
  }

  // 檢查文件
  if (!document.file_url) {
    issues.push({
      type: 'critical',
      severity: 'critical',
      field: 'file_url',
      description: '缺少文件檔案',
      recommendation: '必須上傳相關文件'
    })
  }

  console.log('Issues identified:', issues.length)
  
  return issues
}

async function identifyMissingInfo(document: any): Promise<string[]> {
  const missing: string[] = []

  const importantFields = {
    customer_name: '客戶姓名',
    customer_id_number: '客戶身份證號',
    case_number: '案件編號',
    file_url: '文件檔案',
    document_description: '文件說明'
  }

  Object.entries(importantFields).forEach(([field, label]) => {
    if (!document[field] || document[field] === '') {
      missing.push(label)
    }
  })

  console.log('Missing information:', missing)
  
  return missing
}

async function identifyComplianceIssues(supabase: any, companyId: string, document: any): Promise<any[]> {
  const issues: any[] = []

  try {
    const { data: rules } = await supabase
      .from('compliance_rules')
      .select('*')
      .eq('is_active', true)
      .eq('is_mandatory', true)

    if (!rules) return issues

    rules.forEach((rule: any) => {
      const checkFields = rule.check_fields || []
      const missingFields: string[] = []

      checkFields.forEach((field: string) => {
        if (!document[field] || document[field] === '') {
          missingFields.push(field)
        }
      })

      if (missingFields.length > 0) {
        issues.push({
          rule_code: rule.rule_code,
          rule_name: rule.rule_name,
          severity: rule.severity,
          description: rule.violation_message || `違反 ${rule.rule_name}`,
          missing_fields: missingFields,
          action_required: rule.violation_action
        })
      }
    })
  } catch (error) {
    console.warn('Error checking compliance issues:', error)
  }

  console.log('Compliance issues:', issues.length)
  
  return issues
}

function generateDocumentSummary(document: any, findings: any[], riskScore: number): string {
  const docType = document.document_type_id || '未知類型'
  const customer = document.customer_name || '未知客戶'
  const amount = document.loan_amount || document.investment_amount || 0

  const issueCount = findings.length
  const criticalIssues = findings.filter(f => f.severity === 'critical').length
  const highIssues = findings.filter(f => f.severity === 'high').length

  let riskLevel = 'low'
  if (riskScore > 70) riskLevel = 'high'
  else if (riskScore > 40) riskLevel = 'medium'

  let summary = `文件類型: ${docType}\n`
  summary += `客戶: ${customer}\n`
  if (amount > 0) {
    summary += `金額: NT$ ${amount.toLocaleString()}\n`
  }
  summary += `風險等級: ${riskLevel}\n`
  summary += `風險分數: ${riskScore}/100\n`
  
  if (issueCount > 0) {
    summary += `\n檢測到 ${issueCount} 個問題:\n`
    if (criticalIssues > 0) summary += `- ${criticalIssues} 個嚴重問題\n`
    if (highIssues > 0) summary += `- ${highIssues} 個高風險問題\n`
  } else {
    summary += `\n✅ 未檢測到重大問題`
  }

  return summary
}

async function checkCompliance(supabase: any, companyId: string, data: any) {
  const { documentId } = data

  const { data: document } = await supabase
    .from('financial_documents')
    .select('*')
    .eq('id', documentId)
    .eq('company_id', companyId)
    .single()

  if (!document) {
    throw new Error('Document not found')
  }

  const complianceIssues = await identifyComplianceIssues(supabase, companyId, document)
  const complianceScore = await checkComplianceScore(supabase, companyId, document)

  return {
    document_id: documentId,
    compliance_score: complianceScore,
    is_compliant: complianceIssues.length === 0,
    issues: complianceIssues,
    timestamp: new Date().toISOString()
  }
}

async function validateDocument(supabase: any, companyId: string, data: any) {
  const { documentContent } = data

  const completenessScore = await checkCompleteness(documentContent)
  const missingInfo = await identifyMissingInfo(documentContent)

  return {
    is_valid: completenessScore >= 70 && missingInfo.length === 0,
    completeness_score: completenessScore,
    missing_information: missingInfo,
    validation_errors: missingInfo.length > 0 ? ['請補充缺失信息'] : [],
    timestamp: new Date().toISOString()
  }
}

async function extractData(supabase: any, companyId: string, data: any) {
  const { documentId, extractionFields } = data

  const { data: document } = await supabase
    .from('financial_documents')
    .select('*')
    .eq('id', documentId)
    .eq('company_id', companyId)
    .single()

  if (!document) {
    throw new Error('Document not found')
  }

  const extractedData: any = {}
  
  if (extractionFields && extractionFields.length > 0) {
    extractionFields.forEach((field: string) => {
      if (document[field] !== undefined) {
        extractedData[field] = document[field]
      }
    })
  } else {
    // 提取關鍵字段
    extractedData.customer_name = document.customer_name
    extractedData.customer_id_number = document.customer_id_number
    extractedData.loan_amount = document.loan_amount
    extractedData.case_number = document.case_number
    extractedData.submission_date = document.submission_date
  }

  return {
    document_id: documentId,
    extracted_data: extractedData,
    extraction_timestamp: new Date().toISOString()
  }
}

async function getStatistics(supabase: any, companyId: string, data: any) {
  const days = data.days || 30

  const { data: stats, error } = await supabase
    .rpc('get_document_review_stats', {
      p_company_id: companyId,
      p_days: days
    })

  if (error) {
    console.warn('Error getting stats:', error)
    return {
      period_days: days,
      stats: null,
      message: 'Unable to fetch statistics'
    }
  }

  return {
    period_days: days,
    stats: stats && stats.length > 0 ? stats[0] : null,
    timestamp: new Date().toISOString()
  }
}


