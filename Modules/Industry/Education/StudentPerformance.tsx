/**
 * AI 學生表現分析系統 - 智能學習成效評估
 * 為教育機構提供學生表現分析服務
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Award, AlertTriangle, BookOpen, Target } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../Contexts/AuthContext';
import { generateText, analyzeData } from '../../../lib/ai-service';

const metadata: ModuleMetadata = {
  id: 'student-performance',
  name: 'AI 學生表現分析系統',
  version: '1.0.0',
  category: 'education',
  industry: ['education'],
  description: '智能學習成效評估，提供個人化學習建議',
  icon: 'TrendingUp',
  author: 'AI Business Platform',
  pricingTier: 'pro',
  features: [
    '學習成效分析',
    '個人化建議',
    '預警系統',
    '進度追蹤',
    '家長報告'
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
  class: string;
  studentId: string;
  performance: StudentPerformance;
  learningProfile: LearningProfile;
  alerts: PerformanceAlert[];
}

interface StudentPerformance {
  overallScore: number;
  subjectScores: SubjectScore[];
  attendanceRate: number;
  homeworkCompletion: number;
  participationScore: number;
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
}

interface SubjectScore {
  subject: string;
  score: number;
  trend: 'improving' | 'stable' | 'declining';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

interface LearningProfile {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  strengths: string[];
  challenges: string[];
  interests: string[];
  goals: string[];
  studyHabits: string[];
}

interface PerformanceAlert {
  id: string;
  studentId: string;
  type: 'academic' | 'attendance' | 'behavior' | 'engagement';
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendations: string[];
  createdAt: Date;
  status: 'active' | 'resolved' | 'dismissed';
}

interface ClassStats {
  totalStudents: number;
  averageScore: number;
  attendanceRate: number;
  topPerformers: string[];
  atRiskStudents: string[];
}

export function StudentPerformanceModule({ context }: { context: ModuleContext }) {
  const { state, setRunning } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  const { company } = useAuth();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [classStats, setClassStats] = useState<ClassStats>({
    totalStudents: 0,
    averageScore: 0,
    attendanceRate: 0,
    topPerformers: [],
    atRiskStudents: []
  });

  // 模擬學生數據
  const mockStudents: Student[] = [
    {
      id: 'S001',
      name: '王小明',
      grade: '三年級',
      class: '3A',
      studentId: '2024001',
      performance: {
        overallScore: 85,
        subjectScores: [
          {
            subject: '數學',
            score: 92,
            trend: 'improving',
            strengths: ['計算能力', '邏輯思維'],
            weaknesses: ['應用題理解'],
            recommendations: ['多練習應用題', '加強閱讀理解']
          },
          {
            subject: '國語',
            score: 78,
            trend: 'stable',
            strengths: ['識字能力'],
            weaknesses: ['作文表達', '閱讀理解'],
            recommendations: ['增加閱讀量', '練習寫作']
          },
          {
            subject: '英文',
            score: 88,
            trend: 'improving',
            strengths: ['發音', '單字記憶'],
            weaknesses: ['文法應用'],
            recommendations: ['加強文法練習', '多聽英文']
          }
        ],
        attendanceRate: 95,
        homeworkCompletion: 90,
        participationScore: 85,
        trend: 'improving',
        lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      learningProfile: {
        learningStyle: 'visual',
        strengths: ['圖像記憶', '空間概念'],
        challenges: ['長時間專注', '文字理解'],
        interests: ['科學', '藝術'],
        goals: ['提升國語成績', '培養閱讀習慣'],
        studyHabits: ['喜歡圖表學習', '需要安靜環境']
      },
      alerts: [
        {
          id: 'A001',
          studentId: 'S001',
          type: 'academic',
          severity: 'medium',
          message: '國語成績需要提升',
          recommendations: ['增加閱讀練習', '尋求額外輔導'],
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          status: 'active'
        }
      ]
    },
    {
      id: 'S002',
      name: '李美華',
      grade: '三年級',
      class: '3A',
      studentId: '2024002',
      performance: {
        overallScore: 92,
        subjectScores: [
          {
            subject: '數學',
            score: 95,
            trend: 'stable',
            strengths: ['解題能力', '邏輯思維'],
            weaknesses: [],
            recommendations: ['挑戰更難題目']
          },
          {
            subject: '國語',
            score: 90,
            trend: 'improving',
            strengths: ['閱讀理解', '作文表達'],
            weaknesses: [],
            recommendations: ['保持現有水準']
          },
          {
            subject: '英文',
            score: 88,
            trend: 'stable',
            strengths: ['口語表達', '聽力'],
            weaknesses: ['拼字'],
            recommendations: ['加強拼字練習']
          }
        ],
        attendanceRate: 98,
        homeworkCompletion: 95,
        participationScore: 92,
        trend: 'stable',
        lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      learningProfile: {
        learningStyle: 'auditory',
        strengths: ['聽力理解', '口語表達'],
        challenges: [],
        interests: ['音樂', '語言'],
        goals: ['維持優秀成績', '培養領導能力'],
        studyHabits: ['喜歡討論學習', '善於記憶']
      },
      alerts: []
    },
    {
      id: 'S003',
      name: '陳志強',
      grade: '三年級',
      class: '3A',
      studentId: '2024003',
      performance: {
        overallScore: 72,
        subjectScores: [
          {
            subject: '數學',
            score: 68,
            trend: 'declining',
            strengths: [],
            weaknesses: ['基礎概念', '計算錯誤'],
            recommendations: ['加強基礎練習', '尋求額外輔導']
          },
          {
            subject: '國語',
            score: 75,
            trend: 'stable',
            strengths: ['識字能力'],
            weaknesses: ['理解能力', '表達能力'],
            recommendations: ['增加閱讀練習', '加強理解訓練']
          },
          {
            subject: '英文',
            score: 73,
            trend: 'declining',
            strengths: [],
            weaknesses: ['發音', '文法', '單字'],
            recommendations: ['從基礎開始', '尋求專業輔導']
          }
        ],
        attendanceRate: 88,
        homeworkCompletion: 75,
        participationScore: 70,
        trend: 'declining',
        lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      learningProfile: {
        learningStyle: 'kinesthetic',
        strengths: ['動手操作', '實作能力'],
        challenges: ['抽象概念', '文字學習'],
        interests: ['體育', '手工'],
        goals: ['提升學習成績', '建立學習信心'],
        studyHabits: ['需要實作學習', '喜歡活動式教學']
      },
      alerts: [
        {
          id: 'A002',
          studentId: 'S003',
          type: 'academic',
          severity: 'high',
          message: '整體成績持續下降',
          recommendations: ['立即安排輔導', '與家長溝通', '調整學習方法'],
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          status: 'active'
        },
        {
          id: 'A003',
          studentId: 'S003',
          type: 'attendance',
          severity: 'medium',
          message: '出席率偏低',
          recommendations: ['了解缺課原因', '加強家校溝通'],
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          status: 'active'
        }
      ]
    }
  ];

  useEffect(() => {
    loadStudents();
  }, [company?.id]);

  const loadStudents = async () => {
    try {
      setStudents(mockStudents);
      
      // 計算班級統計
      const totalStudents = mockStudents.length;
      const averageScore = mockStudents.reduce((sum, s) => sum + s.performance.overallScore, 0) / totalStudents;
      const attendanceRate = mockStudents.reduce((sum, s) => sum + s.performance.attendanceRate, 0) / totalStudents;
      const topPerformers = mockStudents
        .filter(s => s.performance.overallScore >= 90)
        .map(s => s.name);
      const atRiskStudents = mockStudents
        .filter(s => s.performance.overallScore < 75 || s.performance.trend === 'declining')
        .map(s => s.name);
      
      setClassStats({
        totalStudents,
        averageScore: Math.round(averageScore),
        attendanceRate: Math.round(attendanceRate),
        topPerformers,
        atRiskStudents
      });
    } catch (error) {
      console.error('載入學生數據失敗:', error);
    }
  };

  const analyzeStudent = async (student: Student) => {
    setAnalyzing(true);
    setSelectedStudent(student);
    setRunning();
    
    try {
      // 使用 AI 分析學生表現
      const systemPrompt = `你是一個專業的教育心理學家，專門分析學生學習表現並提供個人化建議。請根據學生數據進行全面分析。`;
      
      const prompt = `
請分析以下學生的學習表現：

學生姓名：${student.name}
年級：${student.grade}
班級：${student.class}
整體成績：${student.performance.overallScore}/100
出席率：${student.performance.attendanceRate}%
作業完成率：${student.performance.homeworkCompletion}%
參與度：${student.performance.participationScore}/100
學習趨勢：${student.performance.trend === 'improving' ? '進步中' :
           student.performance.trend === 'stable' ? '穩定' : '下降中'}

各科成績：
${student.performance.subjectScores.map(subject => `
- ${subject.subject}: ${subject.score}/100 (${subject.trend === 'improving' ? '進步' :
  subject.trend === 'stable' ? '穩定' : '下降'})
  優點: ${subject.strengths.join(', ')}
  弱點: ${subject.weaknesses.join(', ')}
`).join('')}

學習特質：
- 學習風格: ${student.learningProfile.learningStyle === 'visual' ? '視覺型' :
             student.learningProfile.learningStyle === 'auditory' ? '聽覺型' :
             student.learningProfile.learningStyle === 'kinesthetic' ? '動覺型' : '閱讀型'}
- 優點: ${student.learningProfile.strengths.join(', ')}
- 挑戰: ${student.learningProfile.challenges.join(', ')}
- 興趣: ${student.learningProfile.interests.join(', ')}
- 目標: ${student.learningProfile.goals.join(', ')}
- 學習習慣: ${student.learningProfile.studyHabits.join(', ')}

請提供：
1. 整體表現評估
2. 各科詳細分析
3. 學習建議
4. 家長溝通要點
5. 預警指標

請以 JSON 格式回應：
{
  "overallAssessment": "整體評估",
  "subjectAnalysis": [
    {
      "subject": "科目名稱",
      "assessment": "科目評估",
      "strengths": ["優點1", "優點2"],
      "weaknesses": ["弱點1", "弱點2"],
      "recommendations": ["建議1", "建議2"]
    }
  ],
  "learningRecommendations": ["建議1", "建議2"],
  "parentCommunication": ["溝通要點1", "溝通要點2"],
  "warningIndicators": ["預警1", "預警2"],
  "nextSteps": ["下一步1", "下一步2"]
}
      `;

      const aiResponse = await generateText(prompt, {
        systemPrompt,
        maxTokens: 1500,
        temperature: 0.3
      });

      try {
        const analysis = JSON.parse(aiResponse.content);
        
        // 更新學生分析結果
        const updatedStudent = {
          ...student,
          aiAnalysis: analysis,
          lastAnalyzed: new Date()
        };

        setStudents(prev => prev.map(s => 
          s.id === student.id ? updatedStudent : s
        ));

        await sendAlert('info', '學生分析完成', `學生「${student.name}」的分析已完成`);
        
      } catch (parseError) {
        console.error('AI 分析結果解析失敗:', parseError);
        
        // 備用分析結果
        const fallbackAnalysis = {
          overallAssessment: '需要進一步觀察和輔導',
          subjectAnalysis: student.performance.subjectScores.map(subject => ({
            subject: subject.subject,
            assessment: '需要持續關注',
            strengths: subject.strengths,
            weaknesses: subject.weaknesses,
            recommendations: subject.recommendations
          })),
          learningRecommendations: ['持續關注學習狀況', '提供適當輔導'],
          parentCommunication: ['定期溝通學習狀況'],
          warningIndicators: ['成績需要關注'],
          nextSteps: ['持續監控', '提供支援']
        };

        const updatedStudent = {
          ...student,
          aiAnalysis: fallbackAnalysis,
          lastAnalyzed: new Date()
        };

        setStudents(prev => prev.map(s => 
          s.id === student.id ? updatedStudent : s
        ));
      }
      
    } catch (error) {
      console.error('學生分析失敗:', error);
      await sendAlert('warning', '分析失敗', '無法完成學生分析，請手動處理');
    } finally {
      setAnalyzing(false);
      setIdle();
    }
  };

  const resolveAlert = async (studentId: string, alertId: string) => {
    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        const updatedAlerts = student.alerts.map(alert =>
          alert.id === alertId ? { ...alert, status: 'resolved' as const } : alert
        );
        return { ...student, alerts: updatedAlerts };
      }
      return student;
    }));
    
    await sendAlert('success', '警示已解決', `學生警示已解決`);
  };

  const generatePerformanceReport = async () => {
    const topPerformers = students.filter(s => s.performance.overallScore >= 90);
    const atRiskStudents = students.filter(s => s.performance.overallScore < 75 || s.performance.trend === 'declining');
    const activeAlerts = students.flatMap(s => s.alerts.filter(a => a.status === 'active'));
    
    const reportContent = `
# 學生表現分析報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 班級總覽
- 總學生數：${classStats.totalStudents}
- 平均成績：${classStats.averageScore}/100
- 平均出席率：${classStats.attendanceRate}%
- 優秀學生：${topPerformers.length} 人
- 需要關注：${atRiskStudents.length} 人

## 學生表現統計
- 優秀表現 (90分以上)：${topPerformers.length} 人
- 良好表現 (80-89分)：${students.filter(s => s.performance.overallScore >= 80 && s.performance.overallScore < 90).length} 人
- 需要關注 (75分以下)：${atRiskStudents.length} 人
- 進步中：${students.filter(s => s.performance.trend === 'improving').length} 人
- 穩定：${students.filter(s => s.performance.trend === 'stable').length} 人
- 下降中：${students.filter(s => s.performance.trend === 'declining').length} 人

## 優秀學生
${topPerformers.length === 0 ? '目前無優秀學生' : topPerformers.map(student => `
### ${student.name}
- 整體成績：${student.performance.overallScore}/100
- 出席率：${student.performance.attendanceRate}%
- 作業完成率：${student.performance.homeworkCompletion}%
- 參與度：${student.performance.participationScore}/100
- 學習趨勢：${student.performance.trend === 'improving' ? '進步中' :
             student.performance.trend === 'stable' ? '穩定' : '下降中'}
- 學習風格：${student.learningProfile.learningStyle === 'visual' ? '視覺型' :
             student.learningProfile.learningStyle === 'auditory' ? '聽覺型' :
             student.learningProfile.learningStyle === 'kinesthetic' ? '動覺型' : '閱讀型'}
- 優點：${student.learningProfile.strengths.join(', ')}
- 興趣：${student.learningProfile.interests.join(', ')}
`).join('\n')}

## 需要關注的學生
${atRiskStudents.length === 0 ? '目前無需要特別關注的學生' : atRiskStudents.map(student => `
### ${student.name}
- 整體成績：${student.performance.overallScore}/100
- 出席率：${student.performance.attendanceRate}%
- 作業完成率：${student.performance.homeworkCompletion}%
- 參與度：${student.performance.participationScore}/100
- 學習趨勢：${student.performance.trend === 'improving' ? '進步中' :
             student.performance.trend === 'stable' ? '穩定' : '下降中'}
- 學習挑戰：${student.learningProfile.challenges.join(', ')}
- 活躍警示：${student.alerts.filter(a => a.status === 'active').length} 個
- 建議措施：${student.alerts.filter(a => a.status === 'active').map(a => a.recommendations).flat().join(', ')}
`).join('\n')}

## 活躍警示
${activeAlerts.length === 0 ? '✅ 目前無活躍警示' : activeAlerts.map(alert => `
### ${alert.type === 'academic' ? '學業警示' :
         alert.type === 'attendance' ? '出席警示' :
         alert.type === 'behavior' ? '行為警示' : '參與度警示'}
- 學生：${students.find(s => s.id === alert.studentId)?.name}
- 嚴重程度：${alert.severity === 'high' ? '🔴 高' :
             alert.severity === 'medium' ? '🟡 中' : '🟢 低'}
- 訊息：${alert.message}
- 建議：${alert.recommendations.join(', ')}
- 建立時間：${alert.createdAt.toLocaleString('zh-TW')}
`).join('\n')}

## 科目表現分析
${students[0]?.performance.subjectScores.map(subject => `
### ${subject.subject}
- 平均成績：${Math.round(students.reduce((sum, s) => {
  const subjectScore = s.performance.subjectScores.find(ss => ss.subject === subject.subject);
  return sum + (subjectScore?.score || 0);
}, 0) / students.length)}/100
- 優秀學生：${students.filter(s => {
  const subjectScore = s.performance.subjectScores.find(ss => ss.subject === subject.subject);
  return subjectScore && subjectScore.score >= 90;
}).length} 人
- 需要關注：${students.filter(s => {
  const subjectScore = s.performance.subjectScores.find(ss => ss.subject === subject.subject);
  return subjectScore && subjectScore.score < 75;
}).length} 人
`).join('\n')}

## 學習風格分析
${students.reduce((acc, student) => {
  acc[student.learningProfile.learningStyle] = (acc[student.learningProfile.learningStyle] || 0) + 1;
  return acc;
}, {} as Record<string, number>)

## 建議措施
${atRiskStudents.length > 0 ? '🚨 有學生需要立即關注和輔導' :
  activeAlerts.length > 0 ? '⚠️ 有活躍警示需要處理' :
  '✅ 班級學習狀況良好'}

## AI 建議
${classStats.averageScore < 80 ? '💡 班級平均成績偏低，建議加強教學品質' :
  atRiskStudents.length > classStats.totalStudents * 0.2 ? '💡 需要關注的學生比例較高，建議調整教學策略' :
  '✅ 班級學習狀況良好，建議維持現有教學品質'}
    `.trim();

    await generateReport('學生表現分析報告', reportContent, 'student_performance');
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'stable': return 'text-blue-600';
      case 'declining': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 學生表現分析系統</h3>
          <p className="text-slate-600 mt-1">智能學習成效評估，提供個人化學習建議</p>
        </div>
        <button
          onClick={generatePerformanceReport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          生成報告
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">總學生數</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{classStats.totalStudents}</p>
            </div>
            <Users className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均成績</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{classStats.averageScore}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均出席率</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{classStats.attendanceRate}%</p>
            </div>
            <BookOpen className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">優秀學生</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{classStats.topPerformers.length}</p>
            </div>
            <Award className="w-10 h-10 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">需要關注</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{classStats.atRiskStudents.length}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-600" />
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
                      <p className="text-sm text-slate-600">
                        {student.grade} {student.class} | 學號: {student.studentId}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`text-sm font-medium ${getScoreColor(student.performance.overallScore)}`}>
                        {student.performance.overallScore}/100
                      </span>
                      <span className={`text-xs ${getTrendColor(student.performance.trend)}`}>
                        {student.performance.trend === 'improving' ? '↗ 進步' :
                         student.performance.trend === 'stable' ? '→ 穩定' : '↘ 下降'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <div className="flex gap-4">
                      <span>出席: {student.performance.attendanceRate}%</span>
                      <span>作業: {student.performance.homeworkCompletion}%</span>
                      <span>參與: {student.performance.participationScore}/100</span>
                    </div>
                    {student.alerts.filter(a => a.status === 'active').length > 0 && (
                      <span className="text-red-600 font-medium">
                        {student.alerts.filter(a => a.status === 'active').length} 個警示
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Student Details */}
        <div>
          {selectedStudent ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-slate-900">
                  {selectedStudent.name} - 學習分析
                </h4>
                <div className={`px-3 py-1 rounded ${getScoreColor(selectedStudent.performance.overallScore)}`}>
                  <span className="text-sm font-medium">
                    {selectedStudent.performance.overallScore}/100
                  </span>
                </div>
              </div>

              {analyzing ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-600">AI 正在分析學生表現...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">整體成績</p>
                      <p className={`text-2xl font-bold ${getScoreColor(selectedStudent.performance.overallScore)}`}>
                        {selectedStudent.performance.overallScore}/100
                      </p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">學習趨勢</p>
                      <p className={`text-lg font-bold ${getTrendColor(selectedStudent.performance.trend)}`}>
                        {selectedStudent.performance.trend === 'improving' ? '進步中' :
                         selectedStudent.performance.trend === 'stable' ? '穩定' : '下降中'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600">出席率</p>
                      <p className="text-lg font-bold text-slate-900">{selectedStudent.performance.attendanceRate}%</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600">作業完成</p>
                      <p className="text-lg font-bold text-slate-900">{selectedStudent.performance.homeworkCompletion}%</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600">參與度</p>
                      <p className="text-lg font-bold text-slate-900">{selectedStudent.performance.participationScore}/100</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">各科成績</h5>
                    <div className="space-y-2">
                      {selectedStudent.performance.subjectScores.map((subject, index) => (
                        <div key={index} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-900">{subject.subject}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${getScoreColor(subject.score)}`}>
                                {subject.score}/100
                              </span>
                              <span className={`text-xs ${getTrendColor(subject.trend)}`}>
                                {subject.trend === 'improving' ? '↗' :
                                 subject.trend === 'stable' ? '→' : '↘'}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-slate-600">
                            <p><span className="font-medium">優點:</span> {subject.strengths.join(', ')}</p>
                            <p><span className="font-medium">弱點:</span> {subject.weaknesses.join(', ')}</p>
                            <p><span className="font-medium">建議:</span> {subject.recommendations.join(', ')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">學習特質</h5>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm text-slate-600">
                      <p><span className="font-medium">學習風格:</span> 
                        {selectedStudent.learningProfile.learningStyle === 'visual' ? '視覺型' :
                         selectedStudent.learningProfile.learningStyle === 'auditory' ? '聽覺型' :
                         selectedStudent.learningProfile.learningStyle === 'kinesthetic' ? '動覺型' : '閱讀型'}
                      </p>
                      <p><span className="font-medium">優點:</span> {selectedStudent.learningProfile.strengths.join(', ')}</p>
                      <p><span className="font-medium">挑戰:</span> {selectedStudent.learningProfile.challenges.join(', ')}</p>
                      <p><span className="font-medium">興趣:</span> {selectedStudent.learningProfile.interests.join(', ')}</p>
                      <p><span className="font-medium">目標:</span> {selectedStudent.learningProfile.goals.join(', ')}</p>
                    </div>
                  </div>

                  {selectedStudent.alerts.filter(a => a.status === 'active').length > 0 && (
                    <div>
                      <h5 className="font-semibold text-slate-900 mb-2">活躍警示</h5>
                      <div className="space-y-2">
                        {selectedStudent.alerts.filter(a => a.status === 'active').map((alert) => (
                          <div key={alert.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-start justify-between mb-2">
                              <p className="font-medium text-red-900">{alert.message}</p>
                              <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(alert.severity)}`}>
                                {alert.severity === 'high' ? '高' :
                                 alert.severity === 'medium' ? '中' : '低'}
                              </span>
                            </div>
                            <div className="text-sm text-red-700 mb-2">
                              <p><span className="font-medium">建議:</span> {alert.recommendations.join(', ')}</p>
                            </div>
                            <button
                              onClick={() => resolveAlert(selectedStudent.id, alert.id)}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                            >
                              標記已解決
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => analyzeStudent(selectedStudent)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      AI 深度分析
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="text-center py-8">
                <TrendingUp className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-900 mb-2">選擇學生</h4>
                <p className="text-slate-600">從左側列表選擇一個學生查看詳細分析</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export class StudentPerformance extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <StudentPerformanceModule context={context} />;
  }
}
