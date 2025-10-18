import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TeachingRequest {
  action: 'explain_concept' | 'generate_question' | 'analyze_answer' | 'create_learning_path' | 'provide_feedback' | 'recommend_next_topic'
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
    const { action, data } = await req.json() as TeachingRequest

    let result: any = {}

    switch (action) {
      case 'explain_concept':
        result = await explainConcept(data, companyId, supabaseClient)
        break

      case 'generate_question':
        result = await generateQuestion(data, companyId, supabaseClient)
        break

      case 'analyze_answer':
        result = await analyzeAnswer(data, companyId, supabaseClient)
        break

      case 'create_learning_path':
        result = await createLearningPath(data, companyId, supabaseClient)
        break

      case 'provide_feedback':
        result = await provideFeedback(data, companyId, supabaseClient)
        break

      case 'recommend_next_topic':
        result = await recommendNextTopic(data, companyId, supabaseClient)
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
 * 解釋概念
 */
async function explainConcept(data: any, companyId: string, supabaseClient: any) {
  const { subject, topic, studentLevel = 'intermediate', learningStyle = 'visual' } = data
  const openaiKey = Deno.env.get('OPENAI_API_KEY')

  if (openaiKey) {
    const prompt = `你是一位專業的台灣教師，擅長用淺顯易懂的方式解釋概念。

科目: ${subject}
主題: ${topic}
學生程度: ${studentLevel} (beginner/intermediate/advanced)
學習風格: ${learningStyle} (visual/auditory/kinesthetic/reading)

請提供一個完整的概念解釋（JSON 格式）：
1. summary: 簡要說明（1-2 句話）
2. detailed_explanation: 詳細解釋（3-5 段落，使用台灣教育情境和例子）
3. key_points: 重點整理（陣列，3-5 個重點）
4. examples: 實際例子（陣列，2-3 個貼近台灣學生生活的例子）
5. common_mistakes: 常見錯誤（陣列）
6. practice_suggestions: 練習建議（陣列）
7. visual_aids: 視覺輔助建議（如果適用）
8. real_world_applications: 實際應用場景

根據學習風格調整說明方式：
- visual: 多用圖表、圖像描述
- auditory: 強調聲音、節奏、口訣
- kinesthetic: 強調動手操作、實際體驗
- reading: 提供詳細文字說明、參考資料

使用繁體中文，只回傳 JSON。`

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
            { role: 'system', content: '你是台灣優秀的教師，擅長個人化教學和概念解釋。' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const aiData = await response.json()
      const explanation = JSON.parse(aiData.choices[0].message.content)

      return {
        success: true,
        explanation,
        ai_powered: true,
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      return basicExplanation(subject, topic)
    }
  }

  return basicExplanation(subject, topic)
}

/**
 * 基本解釋（備援）
 */
function basicExplanation(subject: string, topic: string) {
  return {
    success: true,
    explanation: {
      summary: `${topic}是${subject}中的重要概念`,
      detailed_explanation: `${topic}的基本定義和說明。建議參考教科書或與老師討論以獲得更深入的理解。`,
      key_points: [`理解${topic}的定義`, `掌握${topic}的應用`, `練習相關題目`],
      examples: [`例子1: 基本應用`, `例子2: 進階應用`],
      common_mistakes: [`誤解概念定義`, `計算錯誤`],
      practice_suggestions: [`閱讀教科書相關章節`, `完成練習題`, `與同學討論`],
      visual_aids: '建議繪製概念圖',
      real_world_applications: '請與老師討論實際應用',
    },
    ai_powered: false,
  }
}

/**
 * 生成問題
 */
async function generateQuestion(data: any, companyId: string, supabaseClient: any) {
  const { subject, topic, difficulty = 'medium', questionType = 'multiple_choice', count = 1 } = data
  const openaiKey = Deno.env.get('OPENAI_API_KEY')

  if (openaiKey) {
    const prompt = `你是台灣資深教師，擅長出題。請根據以下要求生成${count}道題目：

科目: ${subject}
主題: ${topic}
難度: ${difficulty} (easy/medium/hard)
題型: ${questionType}

請生成${count}道題目（JSON 陣列格式）：
[
  {
    "question_text": "題目內容",
    "question_type": "${questionType}",
    "difficulty": "${difficulty}",
    "options": ["選項A", "選項B", "選項C", "選項D"], // 若為選擇題
    "correct_answer": "正確答案",
    "explanation": "詳細解釋為什麼這是正確答案",
    "hints": ["提示1", "提示2"],
    "related_concepts": ["相關概念1", "相關概念2"],
    "estimated_time_minutes": 3
  }
]

要求：
- 符合台灣教育課綱
- 使用繁體中文
- 題目清晰明確
- 答案準確
- 提供詳細解釋

只回傳 JSON 陣列。`

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
            { role: 'system', content: '你是專業出題老師，熟悉台灣教育體系。' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 2000,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const aiData = await response.json()
      const questions = JSON.parse(aiData.choices[0].message.content)

      return {
        success: true,
        questions,
        ai_powered: true,
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      return generateBasicQuestion(subject, topic, difficulty, questionType)
    }
  }

  return generateBasicQuestion(subject, topic, difficulty, questionType)
}

/**
 * 基本題目生成（備援）
 */
function generateBasicQuestion(subject: string, topic: string, difficulty: string, questionType: string) {
  const question = {
    question_text: `關於${topic}的${difficulty}難度問題`,
    question_type: questionType,
    difficulty,
    options: questionType === 'multiple_choice' ? ['選項 A', '選項 B', '選項 C', '選項 D'] : [],
    correct_answer: '請參考教科書',
    explanation: '建議與老師討論答案',
    hints: ['複習相關概念', '仔細閱讀題目'],
    related_concepts: [topic],
    estimated_time_minutes: 5,
  }

  return {
    success: true,
    questions: [question],
    ai_powered: false,
  }
}

/**
 * 分析答案
 */
async function analyzeAnswer(data: any, companyId: string, supabaseClient: any) {
  const { questionText, correctAnswer, studentAnswer, subject, topic } = data
  const openaiKey = Deno.env.get('OPENAI_API_KEY')

  if (openaiKey) {
    const prompt = `你是一位細心的台灣教師，正在批改學生作業。

題目: ${questionText}
正確答案: ${correctAnswer}
學生答案: ${studentAnswer}
科目: ${subject}
主題: ${topic}

請分析學生的答案（JSON 格式）：
1. is_correct: true/false
2. score: 0-100 分數
3. analysis: 詳細分析學生的答題
4. strengths: 答題中的優點（陣列）
5. weaknesses: 需要改進的地方（陣列）
6. error_type: 錯誤類型（如: "概念錯誤", "計算錯誤", "理解不完整"等）
7. feedback: 給學生的鼓勵性回饋
8. suggestions: 學習建議（陣列）
9. related_topics_to_review: 需要複習的相關主題（陣列）
10. next_steps: 建議的下一步（陣列）

使用鼓勵性語氣，建設性的批評，繁體中文。只回傳 JSON。`

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
            { role: 'system', content: '你是有耐心的老師，擅長發現學生的優點並給予建設性建議。' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 1500,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const aiData = await response.json()
      const analysis = JSON.parse(aiData.choices[0].message.content)

      return {
        success: true,
        analysis,
        ai_powered: true,
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      return basicAnalysis(studentAnswer, correctAnswer)
    }
  }

  return basicAnalysis(studentAnswer, correctAnswer)
}

/**
 * 基本分析（備援）
 */
function basicAnalysis(studentAnswer: string, correctAnswer: string) {
  const isCorrect = studentAnswer?.toLowerCase().trim() === correctAnswer?.toLowerCase().trim()

  return {
    success: true,
    analysis: {
      is_correct: isCorrect,
      score: isCorrect ? 100 : 0,
      analysis: isCorrect ? '答案正確！' : '答案不正確，請再複習相關概念。',
      strengths: isCorrect ? ['答案正確'] : [],
      weaknesses: isCorrect ? [] : ['答案需要改進'],
      error_type: isCorrect ? null : '答案錯誤',
      feedback: isCorrect ? '做得很好！繼續保持！' : '不要氣餒，再試試看！',
      suggestions: ['複習相關概念', '多做練習'],
      related_topics_to_review: [],
      next_steps: ['繼續練習', '與老師討論'],
    },
    ai_powered: false,
  }
}

/**
 * 創建學習路徑
 */
async function createLearningPath(data: any, companyId: string, supabaseClient: any) {
  const { studentId, subject, currentLevel, targetLevel, timeframe } = data
  const openaiKey = Deno.env.get('OPENAI_API_KEY')

  // 獲取學生資料
  const { data: student } = await supabaseClient
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single()

  if (!student) {
    throw new Error('找不到學生資料')
  }

  // 獲取掌握度資料
  const { data: mastery } = await supabaseClient
    .from('knowledge_mastery')
    .select('*')
    .eq('student_id', studentId)
    .eq('subject', subject)

  if (openaiKey) {
    const prompt = `你是教育專家，請為學生設計個人化學習路徑。

學生資訊:
- 姓名: ${student.name}
- 年級: ${student.grade}
- 程度: ${student.learning_level}
- 學習風格: ${student.learning_style}
- 優勢: ${student.strengths?.join(', ') || '待評估'}
- 弱項: ${student.weaknesses?.join(', ') || '待評估'}
- 目標: ${student.goals?.join(', ') || '提升成績'}

學習任務:
- 科目: ${subject}
- 目前程度: ${currentLevel}
- 目標程度: ${targetLevel}
- 時間框架: ${timeframe}

已掌握的知識點:
${mastery?.filter((m: any) => m.mastery_status === 'mastered').map((m: any) => `- ${m.topic}: ${m.knowledge_point}`).join('\n') || '無'}

請設計學習路徑（JSON 格式）：
{
  "path_name": "路徑名稱",
  "description": "路徑說明",
  "estimated_weeks": 數字,
  "milestones": [
    {
      "order": 1,
      "title": "里程碑標題",
      "description": "說明",
      "topics": ["主題1", "主題2"],
      "skills": ["技能1"],
      "learning_objectives": ["目標1"],
      "estimated_hours": 數字,
      "resources": ["資源建議"],
      "required_accuracy": 80
    }
  ],
  "weekly_schedule": "每週學習建議",
  "success_criteria": "成功標準"
}

使用繁體中文，只回傳 JSON。`

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
            { role: 'system', content: '你是教育專家，擅長設計個人化學習路徑。' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.6,
          max_tokens: 2500,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const aiData = await response.json()
      const learningPath = JSON.parse(aiData.choices[0].message.content)

      return {
        success: true,
        learning_path: learningPath,
        ai_powered: true,
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      return basicLearningPath(subject, currentLevel, targetLevel)
    }
  }

  return basicLearningPath(subject, currentLevel, targetLevel)
}

/**
 * 基本學習路徑（備援）
 */
function basicLearningPath(subject: string, currentLevel: string, targetLevel: string) {
  return {
    success: true,
    learning_path: {
      path_name: `${subject}學習計畫`,
      description: `從${currentLevel}提升至${targetLevel}`,
      estimated_weeks: 8,
      milestones: [
        {
          order: 1,
          title: '基礎建立',
          description: '掌握基礎概念',
          topics: ['基礎概念1', '基礎概念2'],
          skills: ['基本技能'],
          learning_objectives: ['理解基本概念'],
          estimated_hours: 10,
          resources: ['教科書', '練習題'],
          required_accuracy: 80,
        },
        {
          order: 2,
          title: '進階練習',
          description: '深化理解',
          topics: ['進階主題1', '進階主題2'],
          skills: ['進階技能'],
          learning_objectives: ['靈活運用'],
          estimated_hours: 15,
          resources: ['進階教材', '實作練習'],
          required_accuracy: 85,
        },
      ],
      weekly_schedule: '每週學習3-4小時',
      success_criteria: '達到目標程度',
    },
    ai_powered: false,
  }
}

/**
 * 提供回饋
 */
async function provideFeedback(data: any, companyId: string, supabaseClient: any) {
  const { studentId, sessionId } = data

  // 獲取學習會話資料
  const { data: session } = await supabaseClient
    .from('learning_sessions')
    .select('*, students(*)')
    .eq('id', sessionId)
    .single()

  if (!session) {
    throw new Error('找不到學習會話')
  }

  // 獲取該會話的問題
  const { data: questions } = await supabaseClient
    .from('learning_questions')
    .select('*')
    .eq('session_id', sessionId)

  const openaiKey = Deno.env.get('OPENAI_API_KEY')

  if (openaiKey) {
    const correctCount = questions?.filter((q: any) => q.is_correct).length || 0
    const totalCount = questions?.length || 0
    const accuracy = totalCount > 0 ? (correctCount / totalCount * 100).toFixed(0) : 0

    const prompt = `你是關心學生的老師，請提供鼓勵性的學習回饋。

學生: ${session.students.name}
科目: ${session.subject}
主題: ${session.topic}
學習時間: ${session.duration_minutes || 0} 分鐘
答對題數: ${correctCount}/${totalCount}
正確率: ${accuracy}%

請提供回饋（JSON 格式）：
{
  "overall_feedback": "整體回饋（鼓勵性、肯定優點）",
  "strengths_observed": ["觀察到的優點"],
  "areas_for_improvement": ["可以改進的地方（用正面語氣）"],
  "specific_praise": "具體的稱讚",
  "encouragement": "鼓勵的話",
  "next_session_goals": ["下次學習目標"],
  "motivation_tip": "學習動力小建議"
}

使用溫暖、鼓勵的語氣，繁體中文。只回傳 JSON。`

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
            { role: 'system', content: '你是溫暖有愛心的老師，擅長鼓勵學生。' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 1000,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const aiData = await response.json()
      const feedback = JSON.parse(aiData.choices[0].message.content)

      // 更新會話的 AI 回饋
      await supabaseClient
        .from('learning_sessions')
        .update({ ai_feedback: feedback.overall_feedback })
        .eq('id', sessionId)

      return {
        success: true,
        feedback,
        ai_powered: true,
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      return basicFeedback()
    }
  }

  return basicFeedback()
}

/**
 * 基本回饋（備援）
 */
function basicFeedback() {
  return {
    success: true,
    feedback: {
      overall_feedback: '你今天的學習表現很棒！繼續保持努力！',
      strengths_observed: ['認真學習', '完成練習'],
      areas_for_improvement: ['可以多花時間複習'],
      specific_praise: '你很認真完成了練習！',
      encouragement: '繼續加油，你一定可以做得更好！',
      next_session_goals: ['複習今天的內容', '練習更多題目'],
      motivation_tip: '每天進步一點點，就會有大改變！',
    },
    ai_powered: false,
  }
}

/**
 * 推薦下一個主題
 */
async function recommendNextTopic(data: any, companyId: string, supabaseClient: any) {
  const { studentId, subject, currentTopic } = data

  // 獲取學生掌握度
  const { data: mastery } = await supabaseClient
    .from('knowledge_mastery')
    .select('*')
    .eq('student_id', studentId)
    .eq('subject', subject)
    .order('mastery_level', { ascending: false })

  const masteredTopics = mastery?.filter((m: any) => m.mastery_status === 'mastered').map((m: any) => m.topic) || []
  const learningTopics = mastery?.filter((m: any) => m.mastery_status === 'learning').map((m: any) => m.topic) || []

  const openaiKey = Deno.env.get('OPENAI_API_KEY')

  if (openaiKey) {
    const prompt = `你是課程規劃專家，請推薦下一個學習主題。

科目: ${subject}
目前主題: ${currentTopic}
已掌握: ${masteredTopics.join(', ') || '無'}
學習中: ${learningTopics.join(', ') || '無'}

請推薦下一個主題（JSON 格式）：
{
  "recommended_topic": "推薦主題名稱",
  "reason": "推薦理由",
  "prerequisites": ["前置知識"],
  "difficulty_level": "easy/medium/hard",
  "estimated_time_hours": 數字,
  "learning_objectives": ["學習目標"],
  "why_next": "為什麼現在學這個主題最合適",
  "alternative_topics": ["其他可選主題"]
}

使用繁體中文，只回傳 JSON。`

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
            { role: 'system', content: '你是課程規劃專家，了解知識的邏輯順序。' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.6,
          max_tokens: 1000,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const aiData = await response.json()
      const recommendation = JSON.parse(aiData.choices[0].message.content)

      return {
        success: true,
        recommendation,
        ai_powered: true,
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      return basicRecommendation(subject, currentTopic)
    }
  }

  return basicRecommendation(subject, currentTopic)
}

/**
 * 基本推薦（備援）
 */
function basicRecommendation(subject: string, currentTopic: string) {
  return {
    success: true,
    recommendation: {
      recommended_topic: '下一個章節',
      reason: `延續${currentTopic}的學習`,
      prerequisites: [currentTopic],
      difficulty_level: 'medium',
      estimated_time_hours: 5,
      learning_objectives: ['掌握新概念', '應用所學'],
      why_next: '循序漸進學習',
      alternative_topics: ['複習舊章節', '練習題'],
    },
    ai_powered: false,
  }
}

