/**
 * AI 學習助教 - 個人化教學系統
 * 為教育機構提供智能學習輔導服務
 */

import React, { useState, useEffect } from 'react';
import { BookOpen, Users, TrendingUp, Clock, Award, MessageCircle } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../Contexts/AuthContext';
import { generateText, analyzeData } from '../../../lib/ai-service';

const metadata: ModuleMetadata = {
  id: 'learning-assistant',
  name: 'AI 學習助教',
  version: '1.0.0',
  category: 'education',
  industry: ['education'],
  description: '個人化教學系統，整合 ChatGPT 與台灣教材，提供智能學習輔導',
  icon: 'BookOpen',
  author: 'AI Business Platform',
  pricingTier: 'pro',
  features: [
    '個人化學習路徑',
    '智能問答',
    '學習進度追蹤',
    '知識點分析',
    '學習建議'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface Student {
  id: string;
  name: string;
  grade: string;
  subject: string;
  learningLevel: 'beginner' | 'intermediate' | 'advanced';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  strengths: string[];
  weaknesses: string[];
  goals: string[];
  lastActive: Date;
}

interface LearningSession {
  id: string;
  studentId: string;
  subject: string;
  topic: string;
  duration: number;
  startTime: Date;
  endTime: Date;
  questions: Question[];
  performance: PerformanceMetrics;
  aiFeedback: string;
}

interface Question {
  id: string;
  content: string;
  type: 'multiple_choice' | 'short_answer' | 'essay' | 'problem_solving';
  difficulty: 'easy' | 'medium' | 'hard';
  correctAnswer: string;
  studentAnswer?: string;
  isCorrect?: boolean;
  explanation?: string;
}

interface PerformanceMetrics {
  accuracy: number;
  speed: number;
  confidence: number;
  improvement: number;
  knowledgeGaps: string[];
}

interface LearningPath {
  id: string;
  studentId: string;
  subject: string;
  currentLevel: number;
  targetLevel: number;
  milestones: Milestone[];
  estimatedCompletion: Date;
  progress: number;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  skills: string[];
  completed: boolean;
  completedAt?: Date;
}

export function LearningAssistantModule({ context }: { context: ModuleContext }) {
  const { state, setRunning, setIdle } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  const { company } = useAuth();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeSessions: 0,
    avgPerformance: 0,
    completionRate: 0
  });

  // 模擬學生數據
  const mockStudents: Student[] = [
    {
      id: 'S001',
      name: '王小明',
      grade: '國中二年級',
      subject: '數學',
      learningLevel: 'intermediate',
      learningStyle: 'visual',
      strengths: ['幾何', '代數'],
      weaknesses: ['統計', '機率'],
      goals: ['提升統計能力', '準備會考'],
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 'S002',
      name: '李美華',
      grade: '高中一年級',
      subject: '英文',
      learningLevel: 'advanced',
      learningStyle: 'auditory',
      strengths: ['聽力', '口語'],
      weaknesses: ['文法', '寫作'],
      goals: ['提升寫作能力', '準備學測'],
      lastActive: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
      id: 'S003',
      name: '陳志強',
      grade: '國小五年級',
      subject: '自然',
      learningLevel: 'beginner',
      learningStyle: 'kinesthetic',
      strengths: ['實驗操作'],
      weaknesses: ['理論理解'],
      goals: ['理解自然現象', '培養科學思維'],
      lastActive: new Date(Date.now() - 30 * 60 * 1000)
    }
  ];

  // 模擬學習路徑
  const mockLearningPaths: LearningPath[] = [
    {
      id: 'LP001',
      studentId: 'S001',
      subject: '數學',
      currentLevel: 3,
      targetLevel: 5,
      milestones: [
        { id: 'M001', title: '基礎統計概念', description: '學習平均數、中位數、眾數', skills: ['統計基礎'], completed: true, completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        { id: 'M002', title: '機率基礎', description: '學習基本機率概念', skills: ['機率基礎'], completed: false },
        { id: 'M003', title: '統計圖表', description: '學習製作和讀取統計圖表', skills: ['圖表分析'], completed: false }
      ],
      estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      progress: 33
    },
    {
      id: 'LP002',
      studentId: 'S002',
      subject: '英文',
      currentLevel: 4,
      targetLevel: 6,
      milestones: [
        { id: 'M004', title: '文法基礎', description: '學習基本文法規則', skills: ['文法'], completed: true, completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        { id: 'M005', title: '寫作技巧', description: '學習文章結構和寫作技巧', skills: ['寫作'], completed: false },
        { id: 'M006', title: '高級文法', description: '學習複雜文法結構', skills: ['高級文法'], completed: false }
      ],
      estimatedCompletion: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      progress: 25
    }
  ];

  useEffect(() => {
    loadData();
  }, [company?.id]);

  const loadData = async () => {
    try {
      setStudents(mockStudents);
      setLearningPaths(mockLearningPaths);
      
      setStats({
        totalStudents: mockStudents.length,
        activeSessions: 1,
        avgPerformance: 78,
        completionRate: 65
      });
    } catch (error) {
      console.error('載入學習數據失敗:', error);
    }
  };

  const startLearningSession = async (student: Student, topic: string) => {
    setRunning();
    
    try {
      // 使用 AI 生成學習內容
      const systemPrompt = `你是一個專業的教育 AI 助教，專門為台灣學生提供個人化學習輔導。請根據學生的學習風格和能力水平，設計適合的學習內容和問題。`;
      
      const prompt = `
請為以下學生設計學習內容：

學生資訊：
- 姓名：${student.name}
- 年級：${student.grade}
- 科目：${student.subject}
- 學習水平：${student.learningLevel === 'beginner' ? '初級' :
             student.learningLevel === 'intermediate' ? '中級' : '高級'}
- 學習風格：${student.learningStyle === 'visual' ? '視覺型' :
             student.learningStyle === 'auditory' ? '聽覺型' :
             student.learningStyle === 'kinesthetic' ? '動覺型' : '閱讀型'}
- 強項：${student.strengths.join(', ')}
- 弱項：${student.weaknesses.join(', ')}
- 學習目標：${student.goals.join(', ')}

學習主題：${topic}

請設計：
1. 學習內容說明
2. 3-5個練習題目
3. 學習建議
4. 後續學習方向

請以 JSON 格式回應：
{
  "content": "學習內容說明",
  "questions": [
    {
      "content": "題目內容",
      "type": "multiple_choice/short_answer/essay/problem_solving",
      "difficulty": "easy/medium/hard",
      "options": ["選項1", "選項2", "選項3", "選項4"],
      "correctAnswer": "正確答案",
      "explanation": "解答說明"
    }
  ],
  "suggestions": ["建議1", "建議2"],
  "nextSteps": ["下一步1", "下一步2"]
}
      `;

      const aiResponse = await generateText(prompt, {
        systemPrompt,
        maxTokens: 2000,
        temperature: 0.7
      });

      try {
        const sessionData = JSON.parse(aiResponse.content);
        
        const newSession: LearningSession = {
          id: `LS${Date.now()}`,
          studentId: student.id,
          subject: student.subject,
          topic,
          duration: 0,
          startTime: new Date(),
          endTime: new Date(),
          questions: sessionData.questions.map((q: any, index: number) => ({
            id: `Q${Date.now()}_${index}`,
            content: q.content,
            type: q.type,
            difficulty: q.difficulty,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation
          })),
          performance: {
            accuracy: 0,
            speed: 0,
            confidence: 0,
            improvement: 0,
            knowledgeGaps: []
          },
          aiFeedback: sessionData.content
        };

        setCurrentSession(newSession);
        setSessions(prev => [newSession, ...prev]);
        
        await sendAlert('info', '學習課程開始', `為 ${student.name} 開始 ${topic} 學習課程`);
        
      } catch (parseError) {
        console.error('AI 學習內容解析失敗:', parseError);
        
        // 備用學習內容
        const fallbackSession: LearningSession = {
          id: `LS${Date.now()}`,
          studentId: student.id,
          subject: student.subject,
          topic,
          duration: 0,
          startTime: new Date(),
          endTime: new Date(),
          questions: [
            {
              id: `Q${Date.now()}_1`,
              content: `請解釋 ${topic} 的基本概念`,
              type: 'short_answer',
              difficulty: 'medium',
              correctAnswer: '基本概念說明',
              explanation: '這是該主題的核心概念'
            }
          ],
          performance: {
            accuracy: 0,
            speed: 0,
            confidence: 0,
            improvement: 0,
            knowledgeGaps: []
          },
          aiFeedback: `讓我們開始學習 ${topic}，這是一個重要的主題。`
        };

        setCurrentSession(fallbackSession);
        setSessions(prev => [fallbackSession, ...prev]);
      }
      
    } catch (error) {
      console.error('學習課程生成失敗:', error);
      await sendAlert('warning', '學習課程生成失敗', '無法生成學習內容，請稍後再試');
    }
  };

  const submitAnswer = async (questionId: string, answer: string) => {
    if (!currentSession) return;

    const question = currentSession.questions.find(q => q.id === questionId);
    if (!question) return;

    const isCorrect = answer.toLowerCase().includes(question.correctAnswer.toLowerCase()) || 
                     answer === question.correctAnswer;

    // 更新問題答案
    const updatedQuestions = currentSession.questions.map(q =>
      q.id === questionId ? { ...q, studentAnswer: answer, isCorrect } : q
    );

    const updatedSession = {
      ...currentSession,
      questions: updatedQuestions
    };

    setCurrentSession(updatedSession);
    setSessions(prev => prev.map(s => s.id === currentSession.id ? updatedSession : s));

    // 提供即時反饋
    if (isCorrect) {
      await sendAlert('success', '回答正確！', '很好！你答對了這個問題');
    } else {
      await sendAlert('info', '需要改進', '答案不完全正確，請參考解釋');
    }
  };

  const completeSession = async () => {
    if (!currentSession) return;

    const correctAnswers = currentSession.questions.filter(q => q.isCorrect).length;
    const accuracy = (correctAnswers / currentSession.questions.length) * 100;
    
    const completedSession = {
      ...currentSession,
      endTime: new Date(),
      duration: Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000 / 60),
      performance: {
        ...currentSession.performance,
        accuracy,
        speed: currentSession.questions.length / (Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000 / 60)),
        confidence: accuracy > 80 ? 90 : accuracy > 60 ? 70 : 50
      }
    };

    setSessions(prev => prev.map(s => s.id === currentSession.id ? completedSession : s));
    setCurrentSession(null);
    setIdle();

    await sendAlert('success', '學習課程完成', `學習課程完成，準確率：${accuracy.toFixed(1)}%`);
  };

  const generateLearningReport = async () => {
    const completedSessions = sessions.filter(s => s.endTime);
    const studentProgress = students.map(student => {
      const studentSessions = sessions.filter(s => s.studentId === student.id);
      const avgAccuracy = studentSessions.length > 0 ? 
        studentSessions.reduce((sum, s) => sum + s.performance.accuracy, 0) / studentSessions.length : 0;
      return { student, avgAccuracy, sessionCount: studentSessions.length };
    });
    
    const reportContent = `
# 學習助教報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 學習總覽
- 總學生數：${stats.totalStudents}
- 活躍課程：${stats.activeSessions}
- 平均表現：${stats.avgPerformance}%
- 完成率：${stats.completionRate}%

## 學生學習狀況
${studentProgress.map(sp => `
### ${sp.student.name} (${sp.student.grade})
- 科目：${sp.student.subject}
- 學習水平：${sp.student.learningLevel === 'beginner' ? '初級' :
             sp.student.learningLevel === 'intermediate' ? '中級' : '高級'}
- 學習風格：${sp.student.learningStyle === 'visual' ? '視覺型' :
             sp.student.learningStyle === 'auditory' ? '聽覺型' :
             sp.student.learningStyle === 'kinesthetic' ? '動覺型' : '閱讀型'}
- 強項：${sp.student.strengths.join(', ')}
- 弱項：${sp.student.weaknesses.join(', ')}
- 學習目標：${sp.student.goals.join(', ')}
- 課程數：${sp.sessionCount}
- 平均準確率：${sp.avgAccuracy.toFixed(1)}%
- 最後活動：${sp.student.lastActive.toLocaleString('zh-TW')}
`).join('\n')}

## 學習路徑進度
${learningPaths.map(path => `
### ${students.find(s => s.id === path.studentId)?.name} - ${path.subject}
- 目前等級：${path.currentLevel}/5
- 目標等級：${path.targetLevel}/5
- 進度：${path.progress}%
- 預計完成：${path.estimatedCompletion.toLocaleDateString('zh-TW')}
- 里程碑：
${path.milestones.map(milestone => `
  - ${milestone.title}: ${milestone.completed ? '✅ 已完成' : '⏳ 進行中'}
    ${milestone.description}
`).join('')}
`).join('\n')}

## 課程統計
- 總課程數：${sessions.length}
- 已完成課程：${completedSessions.length}
- 平均課程時長：${completedSessions.length > 0 ? 
  (completedSessions.reduce((sum, s) => sum + s.duration, 0) / completedSessions.length).toFixed(1) : 0} 分鐘
- 平均準確率：${completedSessions.length > 0 ? 
  (completedSessions.reduce((sum, s) => sum + s.performance.accuracy, 0) / completedSessions.length).toFixed(1) : 0}%

## 學習表現分析
${completedSessions.length > 0 ? `
- 最高準確率：${Math.max(...completedSessions.map(s => s.performance.accuracy)).toFixed(1)}%
- 最低準確率：${Math.min(...completedSessions.map(s => s.performance.accuracy)).toFixed(1)}%
- 平均速度：${(completedSessions.reduce((sum, s) => sum + s.performance.speed, 0) / completedSessions.length).toFixed(1)} 題/分鐘
- 平均信心度：${(completedSessions.reduce((sum, s) => sum + s.performance.confidence, 0) / completedSessions.length).toFixed(1)}%
` : '暫無課程數據'}

## 知識點分析
${students.map(student => {
  const studentSessions = sessions.filter(s => s.studentId === student.id);
  const knowledgeGaps = studentSessions.flatMap(s => s.performance.knowledgeGaps);
  return `
### ${student.name}
- 知識缺口：${knowledgeGaps.length > 0 ? knowledgeGaps.join(', ') : '無'}
- 需要加強的領域：${student.weaknesses.join(', ')}
`;
}).join('\n')}

## 建議改進
${studentProgress.some(sp => sp.avgAccuracy < 70) ? '💡 部分學生表現需要提升，建議調整學習內容' :
  learningPaths.some(path => path.progress < 30) ? '💡 部分學習路徑進度較慢，建議增加學習時間' :
  '✅ 學習狀況良好'}

## AI 建議
${stats.avgPerformance < 75 ? '💡 整體表現偏低，建議優化學習內容和教學方法' :
  stats.completionRate < 70 ? '💡 完成率偏低，建議增加學習動機和興趣' :
  '✅ 學習助教系統運行良好'}
    `.trim();

    await generateReport('學習助教報告', reportContent, 'learning');
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStyleColor = (style: string) => {
    switch (style) {
      case 'visual': return 'bg-purple-100 text-purple-700';
      case 'auditory': return 'bg-blue-100 text-blue-700';
      case 'kinesthetic': return 'bg-green-100 text-green-700';
      case 'reading': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 學習助教</h3>
          <p className="text-slate-600 mt-1">個人化教學系統，智能學習輔導</p>
        </div>
        <button
          onClick={generateLearningReport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          生成報告
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">總學生數</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalStudents}</p>
            </div>
            <Users className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">活躍課程</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.activeSessions}</p>
            </div>
            <BookOpen className="w-10 h-10 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均表現</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.avgPerformance}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-amber-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">完成率</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.completionRate}%</p>
            </div>
            <Award className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students List */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">學生列表</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {students.map((student) => (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedStudent?.id === student.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-semibold text-slate-900">{student.name}</h5>
                      <p className="text-sm text-slate-600">{student.grade} | {student.subject}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded text-xs ${getLevelColor(student.learningLevel)}`}>
                        {student.learningLevel === 'beginner' ? '初級' :
                         student.learningLevel === 'intermediate' ? '中級' : '高級'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${getStyleColor(student.learningStyle)}`}>
                        {student.learningStyle === 'visual' ? '視覺' :
                         student.learningStyle === 'auditory' ? '聽覺' :
                         student.learningStyle === 'kinesthetic' ? '動覺' : '閱讀'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">
                    <p>強項: {student.strengths.join(', ')}</p>
                    <p>弱項: {student.weaknesses.join(', ')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startLearningSession(student, '基礎概念');
                      }}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      開始學習
                    </button>
                    <span className="text-xs text-slate-500">
                      {Math.floor((Date.now() - student.lastActive.getTime()) / 60000)}分鐘前
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Learning Session */}
        <div>
          {currentSession ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-slate-900">
                  {students.find(s => s.id === currentSession.studentId)?.name} - {currentSession.topic}
                </h4>
                <button
                  onClick={completeSession}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  完成課程
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-slate-900 mb-2">AI 學習內容</h5>
                  <p className="text-sm text-slate-700">{currentSession.aiFeedback}</p>
                </div>

                <div className="space-y-3">
                  {currentSession.questions.map((question, index) => (
                    <div key={question.id} className="p-4 bg-slate-50 rounded-lg border">
                      <h6 className="font-semibold text-slate-900 mb-2">
                        問題 {index + 1}: {question.content}
                      </h6>
                      
                      {question.type === 'multiple_choice' && (
                        <div className="space-y-2">
                          {['A', 'B', 'C', 'D'].map((option, i) => (
                            <label key={option} className="flex items-center gap-2">
                              <input type="radio" name={`question_${question.id}`} value={option} />
                              <span className="text-sm">{option}. 選項 {i + 1}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {question.type === 'short_answer' && (
                        <textarea
                          className="w-full p-2 border border-slate-300 rounded text-sm"
                          placeholder="請輸入您的答案..."
                          rows={3}
                        />
                      )}
                      
                      {question.studentAnswer && (
                        <div className="mt-3 p-3 bg-slate-100 rounded">
                          <p className="text-sm font-medium text-slate-700">您的答案: {question.studentAnswer}</p>
                          <p className={`text-sm ${question.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {question.isCorrect ? '✅ 正確' : '❌ 不正確'}
                          </p>
                          {question.explanation && (
                            <p className="text-sm text-slate-600 mt-1">解釋: {question.explanation}</p>
                          )}
                        </div>
                      )}
                      
                      <button
                        onClick={() => submitAnswer(question.id, '示例答案')}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        提交答案
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="text-center py-8">
                <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-900 mb-2">選擇學生開始學習</h4>
                <p className="text-slate-600">從左側列表選擇學生開始個人化學習課程</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Learning Paths */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-4">學習路徑</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {learningPaths.map((path) => (
            <div key={path.id} className="p-4 bg-slate-50 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-slate-900">
                  {students.find(s => s.id === path.studentId)?.name} - {path.subject}
                </h5>
                <span className="text-sm text-slate-600">進度: {path.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${path.progress}%` }}
                ></div>
              </div>
              <div className="space-y-2">
                {path.milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center gap-2">
                    <span className={milestone.completed ? 'text-green-600' : 'text-slate-400'}>
                      {milestone.completed ? '✅' : '⏳'}
                    </span>
                    <span className="text-sm text-slate-700">{milestone.title}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export class LearningAssistant extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <LearningAssistantModule context={context} />;
  }
}
