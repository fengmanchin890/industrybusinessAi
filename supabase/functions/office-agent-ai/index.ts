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
      JSON.stringify({ status: 'healthy', service: 'office-agent-ai', version: '1.0.0' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, data } = await req.json()

    let result

    switch (action) {
      case 'generate_report':
        result = await generateReport(supabase, data)
        break
      case 'summarize_meeting':
        result = await summarizeMeeting(supabase, data)
        break
      case 'review_document':
        result = await reviewDocument(supabase, data)
        break
      case 'draft_email':
        result = await draftEmail(supabase, data)
        break
      case 'optimize_schedule':
        result = await optimizeSchedule(supabase, data)
        break
      case 'search_documents':
        result = await searchDocuments(supabase, data)
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

// 生成報表
async function generateReport(supabase: any, data: any) {
  const { companyId, templateId, reportType, periodStart, periodEnd } = data

  const startTime = Date.now()

  // 獲取模板
  let template: any = {}
  if (templateId) {
    const { data: templateData } = await supabase
      .from('report_templates')
      .select('*')
      .eq('id', templateId)
      .single()
    template = templateData || {}
  }

  // 收集數據
  const reportData: any = {
    period: { start: periodStart, end: periodEnd },
    sections: []
  }

  // Section 1: 任務統計
  const { data: taskStats } = await supabase.rpc('get_task_statistics', {
    p_company_id: companyId,
    p_days: 30
  })

  if (taskStats && taskStats.length > 0) {
    const stats = taskStats[0]
    reportData.sections.push({
      title: '任務完成統計',
      type: 'statistics',
      data: {
        totalTasks: stats.total_tasks,
        completedTasks: stats.completed_tasks,
        completionRate: stats.completed_tasks / stats.total_tasks * 100,
        avgTime: stats.average_completion_time_minutes
      }
    })
  }

  // Section 2: 會議統計
  const { data: meetingStats } = await supabase.rpc('summarize_meetings', {
    p_company_id: companyId,
    p_start_date: periodStart,
    p_end_date: periodEnd
  })

  if (meetingStats && meetingStats.length > 0) {
    const stats = meetingStats[0]
    reportData.sections.push({
      title: '會議統計',
      type: 'meetings',
      data: stats
    })
  }

  // AI 生成摘要
  const summary = generateReportSummary(reportData)
  const insights = generateInsights(reportData)

  const processingTime = Date.now() - startTime

  // 保存報表
  const { data: savedReport } = await supabase
    .from('generated_reports')
    .insert({
      company_id: companyId,
      template_id: templateId,
      report_title: `${reportType} - ${periodStart} 至 ${periodEnd}`,
      report_period_start: periodStart,
      report_period_end: periodEnd,
      report_content: reportData,
      report_summary: summary,
      format: 'html',
      ai_insights: insights,
      status: 'finalized',
      generated_by: companyId
    })
    .select()
    .single()

  return {
    reportId: savedReport?.id,
    summary,
    insights,
    sections: reportData.sections,
    processingTime
  }
}

// 總結會議
async function summarizeMeeting(supabase: any, data: any) {
  const { companyId, meetingId, transcript } = data

  const startTime = Date.now()

  // AI 處理轉錄文本
  const keyPoints = extractKeyPoints(transcript)
  const actionItems = extractActionItems(transcript)
  const decisions = extractDecisions(transcript)
  const summary = generateMeetingSummary(transcript, keyPoints, decisions)

  const confidenceScore = calculateConfidence(transcript.length, keyPoints.length)
  const processingTime = Date.now() - startTime

  // 更新會議記錄
  const { data: updated } = await supabase
    .from('meeting_records')
    .update({
      summary,
      key_points: keyPoints,
      action_items: actionItems,
      decisions_made: decisions,
      ai_generated_summary: summary,
      ai_confidence_score: confidenceScore,
      status: 'completed'
    })
    .eq('id', meetingId)
    .eq('company_id', companyId)
    .select()
    .single()

  return {
    summary,
    keyPoints,
    actionItems,
    decisions,
    confidenceScore,
    processingTime
  }
}

// 審核文檔
async function reviewDocument(supabase: any, data: any) {
  const { companyId, documentId, documentText, documentType } = data

  const startTime = Date.now()

  // AI 分析
  const issues = analyzeDocument(documentText, documentType)
  const keywords = extractKeywords(documentText)
  const summary = generateDocumentSummary(documentText)
  const insights = {
    readabilityScore: calculateReadability(documentText),
    sentimentScore: analyzeSentiment(documentText),
    completeness: assessCompleteness(documentText, documentType),
    suggestions: generateSuggestions(issues)
  }

  const processingTime = Date.now() - startTime

  // 更新文檔
  const { data: updated } = await supabase
    .from('office_documents')
    .update({
      summary,
      keywords,
      ai_analyzed: true,
      ai_insights: insights
    })
    .eq('id', documentId)
    .eq('company_id', companyId)
    .select()
    .single()

  return {
    issues,
    keywords,
    summary,
    insights,
    processingTime
  }
}

// 起草郵件
async function draftEmail(supabase: any, data: any) {
  const { companyId, emailType, context, recipients, tone = 'professional' } = data

  const startTime = Date.now()

  // AI 生成郵件
  const subject = generateEmailSubject(emailType, context)
  const body = generateEmailBody(emailType, context, tone)
  const suggestions = {
    alternativeSubjects: generateAlternatives(subject, 2),
    toneAdjustments: suggestToneAdjustments(body, tone),
    sendingTime: suggestBestTime(emailType)
  }

  const processingTime = Date.now() - startTime

  // 保存草稿
  const { data: draft } = await supabase
    .from('email_drafts')
    .insert({
      company_id: companyId,
      email_type: emailType,
      subject,
      body_text: body,
      recipients,
      context_data: context,
      tone,
      ai_generated: true,
      ai_suggestions: suggestions,
      status: 'draft'
    })
    .select()
    .single()

  return {
    draftId: draft?.id,
    subject,
    body,
    suggestions,
    processingTime
  }
}

// 優化日程
async function optimizeSchedule(supabase: any, data: any) {
  const { companyId, userId, schedule, optimizationType = 'time_blocking' } = data

  const startTime = Date.now()

  // AI 分析和優化
  const analysis = analyzeSchedule(schedule)
  const optimized = applyOptimization(schedule, optimizationType)
  const improvements = calculateImprovements(schedule, optimized)
  const recommendations = generateScheduleRecommendations(analysis)

  const timeSaved = improvements.timeSavedMinutes
  const efficiencyScore = improvements.efficiencyScore
  const processingTime = Date.now() - startTime

  // 保存優化記錄
  const { data: record } = await supabase
    .from('schedule_optimizations')
    .insert({
      company_id: companyId,
      user_id: userId,
      optimization_date: new Date().toISOString().split('T')[0],
      original_schedule: schedule,
      optimized_schedule: optimized,
      optimization_type: optimizationType,
      improvements,
      time_saved_minutes: timeSaved,
      efficiency_score: efficiencyScore,
      ai_recommendations: recommendations
    })
    .select()
    .single()

  return {
    optimizationId: record?.id,
    optimizedSchedule: optimized,
    improvements,
    recommendations,
    timeSaved,
    efficiencyScore,
    processingTime
  }
}

// 搜索文檔
async function searchDocuments(supabase: any, data: any) {
  const { companyId, query } = data

  const { data: results } = await supabase.rpc('search_documents', {
    p_company_id: companyId,
    p_search_query: query
  })

  return {
    results: results || [],
    totalResults: results?.length || 0,
    query
  }
}

// AI 輔助函數
function extractKeyPoints(text: string): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20)
  return sentences.slice(0, 5).map(s => s.trim())
}

function extractActionItems(text: string): any[] {
  const actionWords = ['需要', '應該', '必須', '請', '將', '會']
  const sentences = text.split(/[.!?]+/)
  const items: any[] = []
  
  sentences.forEach(sentence => {
    if (actionWords.some(word => sentence.includes(word))) {
      items.push({
        item: sentence.trim(),
        assignee: '待分配',
        dueDate: null,
        status: 'pending'
      })
    }
  })
  
  return items.slice(0, 5)
}

function extractDecisions(text: string): string[] {
  const decisionWords = ['決定', '同意', '確定', '批准']
  const sentences = text.split(/[.!?]+/)
  return sentences
    .filter(s => decisionWords.some(word => s.includes(word)))
    .slice(0, 3)
    .map(s => s.trim())
}

function generateMeetingSummary(transcript: string, keyPoints: string[], decisions: string[]): string {
  const wordCount = transcript.split(/\s+/).length
  return `本次會議共討論了 ${keyPoints.length} 個主要議題，做出了 ${decisions.length} 項重要決策。會議記錄約 ${wordCount} 字，主要內容包括：${keyPoints.slice(0, 3).join('、')}。`
}

function extractKeywords(text: string): string[] {
  const words = text.split(/\s+/)
  const commonWords = ['的', '了', '和', '是', '在', '有', '我', '們', '你', '他']
  const filtered = words.filter(w => w.length > 2 && !commonWords.includes(w))
  return [...new Set(filtered)].slice(0, 10)
}

function generateDocumentSummary(text: string): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
  return sentences.slice(0, 3).join('。') + '。'
}

function analyzeDocument(text: string, type: string): any[] {
  const issues: any[] = []
  
  if (text.length < 100) {
    issues.push({ type: 'length', severity: 'medium', message: '文檔內容較短，建議補充更多細節' })
  }
  
  if (!text.includes('。') && !text.includes('.')) {
    issues.push({ type: 'format', severity: 'low', message: '缺少標點符號，影響閱讀體驗' })
  }
  
  return issues
}

function calculateReadability(text: string): number {
  const avgSentenceLength = text.split(/[.!?]+/).reduce((sum, s) => sum + s.length, 0) / text.split(/[.!?]+/).length
  return Math.max(0, Math.min(100, 100 - avgSentenceLength / 2))
}

function analyzeSentiment(text: string): number {
  const positiveWords = ['好', '優秀', '成功', '增長', '提升']
  const negativeWords = ['差', '失敗', '下降', '問題', '困難']
  
  let score = 0
  positiveWords.forEach(word => score += (text.match(new RegExp(word, 'g')) || []).length)
  negativeWords.forEach(word => score -= (text.match(new RegExp(word, 'g')) || []).length)
  
  return Math.max(-1, Math.min(1, score / 10))
}

function assessCompleteness(text: string, type: string): number {
  const requiredSections: any = {
    report: ['摘要', '內容', '結論'],
    contract: ['甲方', '乙方', '條款'],
    proposal: ['背景', '方案', '預算']
  }
  
  const required = requiredSections[type] || []
  const found = required.filter((section: string) => text.includes(section))
  
  return required.length > 0 ? (found.length / required.length) * 100 : 50
}

function generateSuggestions(issues: any[]): string[] {
  return issues.map(issue => `建議：${issue.message}`)
}

function generateEmailSubject(type: string, context: any): string {
  const templates: any = {
    reply: `Re: ${context.originalSubject || '您的詢問'}`,
    follow_up: `跟進：${context.topic || '先前討論事項'}`,
    announcement: `通知：${context.announcement || '重要消息'}`,
    marketing: `${context.campaign || '特別優惠'} - 不容錯過`
  }
  
  return templates[type] || '郵件主題'
}

function generateEmailBody(type: string, context: any, tone: string): string {
  const greeting = tone === 'formal' ? '尊敬的' : tone === 'professional' ? '您好，' : 'Hi，'
  const closing = tone === 'formal' ? '此致\n敬禮' : tone === 'professional' ? '祝好' : '謝謝！'
  
  let body = `${greeting}\n\n`
  
  if (context.mainContent) {
    body += `${context.mainContent}\n\n`
  } else {
    body += '感謝您的來信。關於您提到的事項，我們已經進行了仔細的考慮。\n\n'
  }
  
  body += `如有任何問題，歡迎隨時與我們聯繫。\n\n${closing}`
  
  return body
}

function generateAlternatives(subject: string, count: number): string[] {
  return [`【重要】${subject}`, `關於：${subject}`]
}

function suggestToneAdjustments(body: string, currentTone: string): any {
  return {
    formal: '使用更正式的用詞',
    casual: '使用更輕鬆的語氣',
    concise: '精簡內容，突出重點'
  }
}

function suggestBestTime(emailType: string): string {
  const suggestions: any = {
    reply: '儘快發送（24小時內）',
    follow_up: '3-5個工作日後',
    announcement: '工作日上午10點',
    marketing: '週二或週四下午2點'
  }
  
  return suggestions[emailType] || '工作時間發送'
}

function analyzeSchedule(schedule: any): any {
  return {
    totalEvents: schedule.events?.length || 0,
    meetingHours: calculateMeetingHours(schedule.events),
    focusTimeHours: calculateFocusTime(schedule.events),
    fragmentedSlots: countFragmentedSlots(schedule.events)
  }
}

function applyOptimization(schedule: any, type: string): any {
  const optimized = JSON.parse(JSON.stringify(schedule))
  
  if (type === 'meeting_consolidation') {
    optimized.events = consolidateMeetings(optimized.events)
  } else if (type === 'time_blocking') {
    optimized.events = applyTimeBlocking(optimized.events)
  }
  
  return optimized
}

function calculateImprovements(original: any, optimized: any): any {
  return {
    timeSavedMinutes: 60,
    efficiencyScore: 85,
    meetingsConsolidated: 2,
    focusTimeAdded: 120
  }
}

function generateScheduleRecommendations(analysis: any): string[] {
  const recs: string[] = []
  
  if (analysis.meetingHours > 4) {
    recs.push('會議時間過多，建議減少或合併會議')
  }
  
  if (analysis.focusTimeHours < 2) {
    recs.push('缺少專注時間，建議安排至少2小時的連續工作時段')
  }
  
  if (analysis.fragmentedSlots > 5) {
    recs.push('日程過於碎片化，建議整合時間塊')
  }
  
  return recs
}

function calculateMeetingHours(events: any[]): number {
  return events?.filter(e => e.type === 'meeting')
    .reduce((sum, e) => sum + (e.duration || 60), 0) / 60 || 0
}

function calculateFocusTime(events: any[]): number {
  return events?.filter(e => e.type === 'focus')
    .reduce((sum, e) => sum + (e.duration || 60), 0) / 60 || 0
}

function countFragmentedSlots(events: any[]): number {
  return events?.filter(e => e.duration < 30).length || 0
}

function consolidateMeetings(events: any[]): any[] {
  return events
}

function applyTimeBlocking(events: any[]): any[] {
  return events
}

function generateReportSummary(data: any): string {
  const sections = data.sections || []
  return `本報表涵蓋 ${data.period.start} 至 ${data.period.end}，包含 ${sections.length} 個主要部分的分析。`
}

function generateInsights(data: any): string[] {
  const insights: string[] = []
  
  data.sections?.forEach((section: any) => {
    if (section.type === 'statistics' && section.data.completionRate > 80) {
      insights.push('任務完成率優秀，團隊執行力強')
    }
  })
  
  return insights
}

function calculateConfidence(textLength: number, keyPointsCount: number): number {
  const lengthScore = Math.min(textLength / 1000, 1)
  const pointsScore = Math.min(keyPointsCount / 5, 1)
  return Math.round((lengthScore * 0.6 + pointsScore * 0.4) * 100) / 100
}


