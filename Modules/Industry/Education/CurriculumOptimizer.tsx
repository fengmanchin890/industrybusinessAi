/**
 * AI 課程優化系統 - 智能課程設計與優化
 * 為教育機構提供課程設計與優化服務
 */

import React, { useState, useEffect } from 'react';
import { BookOpen, Target, Users, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../Contexts/AuthContext';
import { generateText, analyzeData } from '../../../lib/ai-service';

const metadata: ModuleMetadata = {
  id: 'curriculum-optimizer',
  name: 'AI 課程優化系統',
  version: '1.0.0',
  category: 'education',
  industry: ['education'],
  description: '智能課程設計與優化，提供個人化教學方案',
  icon: 'BookOpen',
  author: 'AI Business Platform',
  pricingTier: 'pro',
  features: [
    '課程設計',
    '內容優化',
    '進度追蹤',
    '效果評估',
    '個人化調整'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface Course {
  id: string;
  title: string;
  subject: string;
  grade: string;
  description: string;
  objectives: string[];
  duration: number; // weeks
  status: 'draft' | 'active' | 'completed' | 'archived';
  modules: CourseModule[];
  assessment: CourseAssessment;
  performance: CoursePerformance;
  lastUpdated: Date;
}

interface CourseModule {
  id: string;
  title: string;
  description: string;
  duration: number; // hours
  type: 'lecture' | 'practice' | 'assessment' | 'project' | 'discussion';
  content: string[];
  prerequisites: string[];
  learningOutcomes: string[];
  resources: string[];
}

interface CourseAssessment {
  totalWeight: number;
  assessments: Assessment[];
}

interface Assessment {
  id: string;
  name: string;
  type: 'quiz' | 'exam' | 'project' | 'presentation' | 'participation';
  weight: number;
  description: string;
  criteria: string[];
}

interface CoursePerformance {
  enrollmentCount: number;
  completionRate: number;
  averageScore: number;
  satisfactionRating: number;
  feedback: string[];
  improvements: string[];
}

interface CurriculumAnalysis {
  id: string;
  courseId: string;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  alignmentScore: number;
  engagementScore: number;
  difficultyScore: number;
  generatedAt: Date;
}

export function CurriculumOptimizerModule({ context }: { context: ModuleContext }) {
  const { state, setRunning } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  const { company } = useAuth();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    avgCompletionRate: 0,
    avgSatisfaction: 0
  });

  // 模擬課程數據
  const mockCourses: Course[] = [
    {
      id: 'C001',
      title: '國小三年級數學',
      subject: '數學',
      grade: '三年級',
      description: '基礎數學概念教學，包含數與量、幾何、統計等單元',
      objectives: [
        '建立數的概念',
        '培養計算能力',
        '發展邏輯思維',
        '提升問題解決能力'
      ],
      duration: 16,
      status: 'active',
      modules: [
        {
          id: 'M001',
          title: '數與量',
          description: '認識1000以內的數',
          duration: 8,
          type: 'lecture',
          content: ['數的認識', '數的比較', '數的運算'],
          prerequisites: [],
          learningOutcomes: ['能認識1000以內的數', '能比較數的大小'],
          resources: ['數位教材', '練習題', '遊戲活動']
        },
        {
          id: 'M002',
          title: '幾何',
          description: '認識基本幾何圖形',
          duration: 6,
          type: 'practice',
          content: ['平面圖形', '立體圖形', '圖形性質'],
          prerequisites: ['數與量'],
          learningOutcomes: ['能認識基本圖形', '能描述圖形特徵'],
          resources: ['幾何教具', '繪圖軟體', '實作活動']
        },
        {
          id: 'M003',
          title: '統計',
          description: '基礎統計概念',
          duration: 2,
          type: 'assessment',
          content: ['資料收集', '資料整理', '簡單圖表'],
          prerequisites: ['數與量', '幾何'],
          learningOutcomes: ['能收集資料', '能製作簡單圖表'],
          resources: ['統計圖表', '調查表', '分析工具']
        }
      ],
      assessment: {
        totalWeight: 100,
        assessments: [
          {
            id: 'A001',
            name: '期中測驗',
            type: 'exam',
            weight: 30,
            description: '數與量單元測驗',
            criteria: ['計算準確性', '概念理解', '應用能力']
          },
          {
            id: 'A002',
            name: '期末測驗',
            type: 'exam',
            weight: 40,
            description: '全學期綜合測驗',
            criteria: ['綜合應用', '問題解決', '邏輯推理']
          },
          {
            id: 'A003',
            name: '實作專案',
            type: 'project',
            weight: 20,
            description: '幾何圖形創作',
            criteria: ['創意表現', '技術運用', '作品完成度']
          },
          {
            id: 'A004',
            name: '課堂參與',
            type: 'participation',
            weight: 10,
            description: '課堂討論與活動參與',
            criteria: ['參與度', '合作精神', '學習態度']
          }
        ]
      },
      performance: {
        enrollmentCount: 25,
        completionRate: 88,
        averageScore: 82,
        satisfactionRating: 4.3,
        feedback: [
          '課程內容豐富有趣',
          '老師教學方式生動',
          '希望增加更多實作活動',
          '作業量適中'
        ],
        improvements: [
          '增加互動式教學',
          '提供更多練習機會',
          '加強個別指導'
        ]
      },
      lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'C002',
      title: '國小三年級國語',
      subject: '國語',
      grade: '三年級',
      description: '語文基礎能力培養，包含識字、閱讀、寫作等技能',
      objectives: [
        '提升識字能力',
        '培養閱讀理解',
        '發展寫作技巧',
        '增進語文表達'
      ],
      duration: 16,
      status: 'active',
      modules: [
        {
          id: 'M004',
          title: '識字教學',
          description: '認識常用漢字',
          duration: 6,
          type: 'lecture',
          content: ['字形結構', '字音學習', '字義理解'],
          prerequisites: [],
          learningOutcomes: ['能認識常用漢字', '能正確書寫'],
          resources: ['識字卡', '字帖', '多媒體教材']
        },
        {
          id: 'M005',
          title: '閱讀理解',
          description: '提升閱讀能力',
          duration: 8,
          type: 'practice',
          content: ['文章理解', '重點提取', '推論思考'],
          prerequisites: ['識字教學'],
          learningOutcomes: ['能理解文章內容', '能提取重點'],
          resources: ['閱讀教材', '理解練習', '討論活動']
        },
        {
          id: 'M006',
          title: '寫作練習',
          description: '基礎寫作技能',
          duration: 2,
          type: 'project',
          content: ['句子寫作', '段落組織', '文章結構'],
          prerequisites: ['識字教學', '閱讀理解'],
          learningOutcomes: ['能寫出完整句子', '能組織段落'],
          resources: ['寫作範例', '修改指導', '同儕互評']
        }
      ],
      assessment: {
        totalWeight: 100,
        assessments: [
          {
            id: 'A005',
            name: '識字測驗',
            type: 'quiz',
            weight: 25,
            description: '漢字識讀與書寫',
            criteria: ['識字準確性', '書寫正確性', '字義理解']
          },
          {
            id: 'A006',
            name: '閱讀測驗',
            type: 'exam',
            weight: 35,
            description: '閱讀理解能力測驗',
            criteria: ['理解準確性', '重點提取', '推論能力']
          },
          {
            id: 'A007',
            name: '寫作作業',
            type: 'project',
            weight: 30,
            description: '創意寫作練習',
            criteria: ['內容創意', '語言表達', '結構組織']
          },
          {
            id: 'A008',
            name: '口語表達',
            type: 'presentation',
            weight: 10,
            description: '口語表達能力評估',
            criteria: ['表達清晰', '內容豐富', '態度自信']
          }
        ]
      },
      performance: {
        enrollmentCount: 25,
        completionRate: 92,
        averageScore: 85,
        satisfactionRating: 4.5,
        feedback: [
          '課程設計循序漸進',
          '閱讀材料豐富多樣',
          '寫作指導詳細',
          '希望增加更多互動'
        ],
        improvements: [
          '增加小組討論',
          '提供更多寫作機會',
          '加強個別指導'
        ]
      },
      lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  ];

  useEffect(() => {
    loadCourses();
  }, [company?.id]);

  const loadCourses = async () => {
    try {
      setCourses(mockCourses);
      
      setStats({
        totalCourses: mockCourses.length,
        activeCourses: mockCourses.filter(c => c.status === 'active').length,
        avgCompletionRate: Math.round(mockCourses.reduce((sum, c) => sum + c.performance.completionRate, 0) / mockCourses.length),
        avgSatisfaction: Math.round((mockCourses.reduce((sum, c) => sum + c.performance.satisfactionRating, 0) / mockCourses.length) * 10) / 10
      });
    } catch (error) {
      console.error('載入課程失敗:', error);
    }
  };

  const optimizeCourse = async (course: Course) => {
    setOptimizing(true);
    setSelectedCourse(course);
    setRunning();
    
    try {
      // 使用 AI 優化課程
      const systemPrompt = `你是一個專業的課程設計專家，專門優化教育課程。請根據課程內容和表現數據提供優化建議。`;
      
      const prompt = `
請優化以下課程：

課程標題：${course.title}
科目：${course.subject}
年級：${course.grade}
課程描述：${course.description}
課程目標：${course.objectives.join(', ')}
課程時長：${course.duration} 週

課程模組：
${course.modules.map(module => `
- ${module.title}: ${module.description}
  時長: ${module.duration} 小時
  類型: ${module.type === 'lecture' ? '講授' :
         module.type === 'practice' ? '練習' :
         module.type === 'assessment' ? '評量' :
         module.type === 'project' ? '專案' : '討論'}
  內容: ${module.content.join(', ')}
  學習成果: ${module.learningOutcomes.join(', ')}
`).join('')}

評量方式：
${course.assessment.assessments.map(assessment => `
- ${assessment.name}: ${assessment.description}
  類型: ${assessment.type === 'quiz' ? '小考' :
         assessment.type === 'exam' ? '考試' :
         assessment.type === 'project' ? '專案' :
         assessment.type === 'presentation' ? '報告' : '參與'}
  權重: ${assessment.weight}%
  評量標準: ${assessment.criteria.join(', ')}
`).join('')}

課程表現：
- 修課人數: ${course.performance.enrollmentCount}
- 完成率: ${course.performance.completionRate}%
- 平均成績: ${course.performance.averageScore}/100
- 滿意度: ${course.performance.satisfactionRating}/5
- 學生意見: ${course.performance.feedback.join(', ')}
- 改進建議: ${course.performance.improvements.join(', ')}

請提供：
1. 整體課程評估 (0-100分)
2. 課程優勢分析
3. 需要改進的地方
4. 具體優化建議
5. 課程對齊度評估
6. 學生參與度評估
7. 難度適中性評估

請以 JSON 格式回應：
{
  "overallScore": 0-100,
  "strengths": ["優勢1", "優勢2"],
  "weaknesses": ["弱點1", "弱點2"],
  "recommendations": ["建議1", "建議2"],
  "alignmentScore": 0-100,
  "engagementScore": 0-100,
  "difficultyScore": 0-100,
  "specificImprovements": [
    {
      "module": "模組名稱",
      "improvement": "改進建議",
      "priority": "high/medium/low"
    }
  ],
  "assessmentImprovements": [
    {
      "assessment": "評量名稱",
      "improvement": "改進建議",
      "priority": "high/medium/low"
    }
  ]
}
      `;

      const aiResponse = await generateText(prompt, {
        systemPrompt,
        maxTokens: 2000,
        temperature: 0.3
      });

      try {
        const analysis = JSON.parse(aiResponse.content);
        
        const curriculumAnalysis: CurriculumAnalysis = {
          id: `CA${Date.now()}`,
          courseId: course.id,
          overallScore: analysis.overallScore,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          recommendations: analysis.recommendations,
          alignmentScore: analysis.alignmentScore,
          engagementScore: analysis.engagementScore,
          difficultyScore: analysis.difficultyScore,
          generatedAt: new Date()
        };

        // 更新課程分析結果
        const updatedCourse = {
          ...course,
          analysis: curriculumAnalysis,
          lastAnalyzed: new Date()
        };

        setCourses(prev => prev.map(c => 
          c.id === course.id ? updatedCourse : c
        ));

        await sendAlert('info', '課程優化完成', `課程「${course.title}」的優化分析已完成`);
        
      } catch (parseError) {
        console.error('AI 分析結果解析失敗:', parseError);
        
        // 備用分析結果
        const fallbackAnalysis: CurriculumAnalysis = {
          id: `CA${Date.now()}`,
          courseId: course.id,
          overallScore: 75,
          strengths: ['課程結構完整'],
          weaknesses: ['需要進一步優化'],
          recommendations: ['持續改進課程內容'],
          alignmentScore: 80,
          engagementScore: 75,
          difficultyScore: 70,
          generatedAt: new Date()
        };

        const updatedCourse = {
          ...course,
          analysis: fallbackAnalysis,
          lastAnalyzed: new Date()
        };

        setCourses(prev => prev.map(c => 
          c.id === course.id ? updatedCourse : c
        ));
      }
      
    } catch (error) {
      console.error('課程優化失敗:', error);
      await sendAlert('warning', '課程優化失敗', '無法完成課程優化，請手動處理');
    } finally {
      setOptimizing(false);
      setIdle();
    }
  };

  const generateCurriculumReport = async () => {
    const activeCourses = courses.filter(c => c.status === 'active');
    const completedCourses = courses.filter(c => c.status === 'completed');
    const analyzedCourses = courses.filter(c => c.analysis);
    
    const reportContent = `
# 課程優化報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 課程總覽
- 總課程數：${stats.totalCourses}
- 進行中：${stats.activeCourses}
- 已完成：${completedCourses.length}
- 已分析：${analyzedCourses.length}
- 平均完成率：${stats.avgCompletionRate}%
- 平均滿意度：${stats.avgSatisfaction}/5

## 課程狀態分析
- 草案：${courses.filter(c => c.status === 'draft').length}
- 進行中：${activeCourses.length}
- 已完成：${completedCourses.length}
- 已歸檔：${courses.filter(c => c.status === 'archived').length}

## 科目分析
${courses.reduce((acc, course) => {
  acc[course.subject] = (acc[course.subject] || 0) + 1;
  return acc;
}, {} as Record<string, number>)

## 年級分析
${courses.reduce((acc, course) => {
  acc[course.grade] = (acc[course.grade] || 0) + 1;
  return acc;
}, {} as Record<string, number>)

## 課程表現分析
${courses.map(course => `
### ${course.title}
- 科目：${course.subject}
- 年級：${course.grade}
- 狀態：${course.status === 'draft' ? '草案' :
         course.status === 'active' ? '進行中' :
         course.status === 'completed' ? '已完成' : '已歸檔'}
- 修課人數：${course.performance.enrollmentCount}
- 完成率：${course.performance.completionRate}%
- 平均成績：${course.performance.averageScore}/100
- 滿意度：${course.performance.satisfactionRating}/5
- 課程時長：${course.duration} 週
- 模組數：${course.modules.length}
- 評量數：${course.assessment.assessments.length}
- 最後更新：${course.lastUpdated.toLocaleDateString('zh-TW')}

#### 課程目標
${course.objectives.map(obj => `- ${obj}`).join('\n')}

#### 課程模組
${course.modules.map(module => `
- ${module.title}: ${module.description}
  時長: ${module.duration} 小時
  類型: ${module.type === 'lecture' ? '講授' :
         module.type === 'practice' ? '練習' :
         module.type === 'assessment' ? '評量' :
         module.type === 'project' ? '專案' : '討論'}
  學習成果: ${module.learningOutcomes.join(', ')}
`).join('\n')}

#### 評量方式
${course.assessment.assessments.map(assessment => `
- ${assessment.name}: ${assessment.description}
  類型: ${assessment.type === 'quiz' ? '小考' :
         assessment.type === 'exam' ? '考試' :
         assessment.type === 'project' ? '專案' :
         assessment.type === 'presentation' ? '報告' : '參與'}
  權重: ${assessment.weight}%
  評量標準: ${assessment.criteria.join(', ')}
`).join('\n')}

#### 學生意見
${course.performance.feedback.map(feedback => `- ${feedback}`).join('\n')}

#### 改進建議
${course.performance.improvements.map(improvement => `- ${improvement}`).join('\n')}
`).join('\n')}

## 已分析課程詳情
${analyzedCourses.map(course => `
### ${course.title} - AI 分析結果
- 整體評分：${course.analysis?.overallScore}/100
- 課程對齊度：${course.analysis?.alignmentScore}/100
- 學生參與度：${course.analysis?.engagementScore}/100
- 難度適中性：${course.analysis?.difficultyScore}/100
- 分析時間：${course.analysis?.generatedAt.toLocaleString('zh-TW')}

#### 課程優勢
${course.analysis?.strengths.map(strength => `- ${strength}`).join('\n')}

#### 需要改進
${course.analysis?.weaknesses.map(weakness => `- ${weakness}`).join('\n')}

#### 優化建議
${course.analysis?.recommendations.map(rec => `- ${rec}`).join('\n')}
`).join('\n')}

## 課程效果評估
- 平均完成率：${stats.avgCompletionRate}%
- 平均滿意度：${stats.avgSatisfaction}/5
- 高完成率課程：${courses.filter(c => c.performance.completionRate >= 90).length} 個
- 高滿意度課程：${courses.filter(c => c.performance.satisfactionRating >= 4.5).length} 個
- 需要關注課程：${courses.filter(c => c.performance.completionRate < 80 || c.performance.satisfactionRating < 4.0).length} 個

## 建議措施
${courses.filter(c => c.performance.completionRate < 80 || c.performance.satisfactionRating < 4.0).length > 0 ? '🚨 有課程需要立即優化' :
  analyzedCourses.length < courses.length ? '💡 建議對所有課程進行 AI 分析' :
  '✅ 課程狀況良好'}

## AI 建議
${stats.avgCompletionRate < 85 ? '💡 平均完成率偏低，建議優化課程設計' :
  stats.avgSatisfaction < 4.0 ? '💡 平均滿意度偏低，建議改善教學品質' :
  '✅ 課程系統運行良好'}
    `.trim();

    await generateReport('課程優化報告', reportContent, 'curriculum_optimization');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'archived': return 'bg-gray-100 text-gray-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 課程優化系統</h3>
          <p className="text-slate-600 mt-1">智能課程設計與優化，提供個人化教學方案</p>
        </div>
        <button
          onClick={generateCurriculumReport}
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
              <p className="text-sm text-slate-600">總課程數</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalCourses}</p>
            </div>
            <BookOpen className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">進行中</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.activeCourses}</p>
            </div>
            <Target className="w-10 h-10 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均完成率</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.avgCompletionRate}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均滿意度</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.avgSatisfaction}/5</p>
            </div>
            <Users className="w-10 h-10 text-amber-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Courses List */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">課程列表</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedCourse?.id === course.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-semibold text-slate-900">{course.title}</h5>
                      <p className="text-sm text-slate-600">
                        {course.subject} | {course.grade} | {course.duration} 週
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(course.status)}`}>
                        {course.status === 'draft' ? '草案' :
                         course.status === 'active' ? '進行中' :
                         course.status === 'completed' ? '已完成' : '已歸檔'}
                      </span>
                      {course.analysis && (
                        <span className={`text-xs font-medium ${getScoreColor(course.analysis.overallScore)}`}>
                          {course.analysis.overallScore}/100
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <div className="flex gap-4">
                      <span>修課: {course.performance.enrollmentCount}</span>
                      <span>完成: {course.performance.completionRate}%</span>
                      <span>滿意: {course.performance.satisfactionRating}/5</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {course.lastUpdated.toLocaleDateString('zh-TW')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Course Details */}
        <div>
          {selectedCourse ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-slate-900">
                  {selectedCourse.title} - 課程詳情
                </h4>
                {selectedCourse.analysis && (
                  <div className={`px-3 py-1 rounded ${getScoreColor(selectedCourse.analysis.overallScore)}`}>
                    <span className="text-sm font-medium">
                      {selectedCourse.analysis.overallScore}/100
                    </span>
                  </div>
                )}
              </div>

              {optimizing ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-600">AI 正在優化課程...</p>
                </div>
              ) : selectedCourse.analysis ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">整體評分</p>
                      <p className={`text-2xl font-bold ${getScoreColor(selectedCourse.analysis.overallScore)}`}>
                        {selectedCourse.analysis.overallScore}/100
                      </p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">課程對齊度</p>
                      <p className={`text-2xl font-bold ${getScoreColor(selectedCourse.analysis.alignmentScore)}`}>
                        {selectedCourse.analysis.alignmentScore}/100
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600">參與度</p>
                      <p className={`text-lg font-bold ${getScoreColor(selectedCourse.analysis.engagementScore)}`}>
                        {selectedCourse.analysis.engagementScore}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600">難度適中</p>
                      <p className={`text-lg font-bold ${getScoreColor(selectedCourse.analysis.difficultyScore)}`}>
                        {selectedCourse.analysis.difficultyScore}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">課程優勢</h5>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {selectedCourse.analysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">需要改進</h5>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {selectedCourse.analysis.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-600 mt-1">•</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">優化建議</h5>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {selectedCourse.analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">課程表現</h5>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm text-slate-600">
                      <p><span className="font-medium">修課人數:</span> {selectedCourse.performance.enrollmentCount}</p>
                      <p><span className="font-medium">完成率:</span> {selectedCourse.performance.completionRate}%</p>
                      <p><span className="font-medium">平均成績:</span> {selectedCourse.performance.averageScore}/100</p>
                      <p><span className="font-medium">滿意度:</span> {selectedCourse.performance.satisfactionRating}/5</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">課程資訊</h5>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm text-slate-600">
                      <p><span className="font-medium">科目:</span> {selectedCourse.subject}</p>
                      <p><span className="font-medium">年級:</span> {selectedCourse.grade}</p>
                      <p><span className="font-medium">時長:</span> {selectedCourse.duration} 週</p>
                      <p><span className="font-medium">狀態:</span> 
                        {selectedCourse.status === 'draft' ? '草案' :
                         selectedCourse.status === 'active' ? '進行中' :
                         selectedCourse.status === 'completed' ? '已完成' : '已歸檔'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">課程目標</h5>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {selectedCourse.objectives.map((obj, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">課程模組</h5>
                    <div className="space-y-2">
                      {selectedCourse.modules.map((module, index) => (
                        <div key={index} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-900">{module.title}</span>
                            <span className="text-sm text-slate-600">{module.duration} 小時</span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{module.description}</p>
                          <p className="text-xs text-slate-500">
                            類型: {module.type === 'lecture' ? '講授' :
                                   module.type === 'practice' ? '練習' :
                                   module.type === 'assessment' ? '評量' :
                                   module.type === 'project' ? '專案' : '討論'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => optimizeCourse(selectedCourse)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      AI 課程優化
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="text-center py-8">
                <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-900 mb-2">選擇課程</h4>
                <p className="text-slate-600">從左側列表選擇一個課程查看詳情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export class CurriculumOptimizer extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <CurriculumOptimizerModule context={context} />;
  }
}
