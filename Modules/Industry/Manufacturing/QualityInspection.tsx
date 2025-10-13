/**
 * AI 品检模组 - 视觉检测
 * 适用于制造业的产品质量检测
 */

import { useState } from 'react';
import { Camera, CheckCircle, XCircle, Upload, Play, Pause, Settings } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';

const metadata: ModuleMetadata = {
  id: 'quality-inspection',
  name: 'AI 品检模组',
  version: '1.0.0',
  category: 'manufacturing',
  industry: ['manufacturing'],
  description: 'AI 视觉检测系统，接上摄影机即可自动检测产品瑕疵，本地推论无需上传数据',
  icon: 'Camera',
  author: 'AI Business Platform',
  pricingTier: 'pro',
  features: [
    '实时视觉检测',
    '自动瑕疵识别',
    '本地 Edge AI 推论',
    '自动生成检测报告',
    '异常自动警示'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface InspectionResult {
  id: string;
  timestamp: Date;
  imageUrl: string;
  result: 'pass' | 'fail';
  defects: string[];
  confidence: number;
}

export function QualityInspectionModule({ context }: { context: ModuleContext }) {
  const { state, setRunning, setIdle } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  
  const [isInspecting, setIsInspecting] = useState(false);
  const [results, setResults] = useState<InspectionResult[]>([]);
  const [stats, setStats] = useState({
    totalInspected: 0,
    passCount: 0,
    failCount: 0,
    defectRate: 0
  });

  const startInspection = async () => {
    setIsInspecting(true);
    setRunning();
    
    // 模拟启动检测
    console.log('Starting quality inspection...');
  };

  const stopInspection = () => {
    setIsInspecting(false);
    setIdle();
    console.log('Stopping quality inspection...');
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 模拟 AI 检测
    const mockResult: InspectionResult = {
      id: Date.now().toString(),
      timestamp: new Date(),
      imageUrl: URL.createObjectURL(file),
      result: Math.random() > 0.15 ? 'pass' : 'fail',
      defects: Math.random() > 0.15 ? [] : ['表面刮痕', '尺寸偏差'],
      confidence: 0.85 + Math.random() * 0.15
    };

    setResults(prev => [mockResult, ...prev.slice(0, 9)]);
    
    // 更新统计
    setStats(prev => {
      const total = prev.totalInspected + 1;
      const pass = prev.passCount + (mockResult.result === 'pass' ? 1 : 0);
      const fail = prev.failCount + (mockResult.result === 'fail' ? 1 : 0);
      return {
        totalInspected: total,
        passCount: pass,
        failCount: fail,
        defectRate: (fail / total) * 100
      };
    });

    // 如果检测失败，发送警示
    if (mockResult.result === 'fail') {
      await sendAlert(
        'medium',
        '检测到产品瑕疵',
        `发现 ${mockResult.defects.join('、')}，置信度：${(mockResult.confidence * 100).toFixed(1)}%`
      );
    }
  };

  const generateDailyReport = async () => {
    const reportContent = `
# 品检日报表
生成时间：${new Date().toLocaleString('zh-TW')}

## 统计数据
- 总检测数：${stats.totalInspected}
- 合格数：${stats.passCount}
- 不合格数：${stats.failCount}
- 瑕疵率：${stats.defectRate.toFixed(2)}%

## 最近检测结果
${results.slice(0, 5).map((r, i) => `
${i + 1}. [${r.result === 'pass' ? '✓ 合格' : '✗ 不合格'}] ${r.timestamp.toLocaleTimeString()}
   ${r.defects.length > 0 ? `瑕疵：${r.defects.join('、')}` : '无瑕疵'}
`).join('')}

## 建议
${stats.defectRate > 5 ? '⚠️ 瑕疵率偏高，建议检查生产流程' : '✓ 品质控制良好'}
    `.trim();

    await generateReport('品检日报表', reportContent, 'daily');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 品检模组</h3>
          <p className="text-slate-600 mt-1">实时视觉检测与品质控制</p>
        </div>
        <div className="flex gap-2">
          {isInspecting ? (
            <button
              onClick={stopInspection}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Pause className="w-5 h-5" />
              停止检测
            </button>
          ) : (
            <button
              onClick={startInspection}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play className="w-5 h-5" />
              启动检测
            </button>
          )}
          <button className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">总检测数</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalInspected}</p>
            </div>
            <Camera className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">合格数</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.passCount}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">不合格数</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.failCount}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">瑕疵率</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.defectRate.toFixed(1)}%</p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              stats.defectRate < 3 ? 'bg-green-100 text-green-600' :
              stats.defectRate < 5 ? 'bg-amber-100 text-amber-600' :
              'bg-red-100 text-red-600'
            }`}>
              !
            </div>
          </div>
        </div>
      </div>

      {/* Upload & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            <Upload className="w-5 h-5" />
            上传图片检测
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={generateDailyReport}
            disabled={stats.totalInspected === 0}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            生成日报表
          </button>
          <div className="text-sm text-slate-600">
            {isInspecting && (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                检测中...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-4">最近检测结果</h4>
        
        {results.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>尚无检测数据</p>
            <p className="text-sm mt-1">上传图片或连接摄影机开始检测</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(result => (
              <div
                key={result.id}
                className={`border-2 rounded-lg p-4 ${
                  result.result === 'pass'
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <img
                  src={result.imageUrl}
                  alt="检测图片"
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                <div className="flex items-center justify-between mb-2">
                  <span className={`flex items-center gap-1 font-semibold ${
                    result.result === 'pass' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.result === 'pass' ? (
                      <><CheckCircle className="w-4 h-4" /> 合格</>
                    ) : (
                      <><XCircle className="w-4 h-4" /> 不合格</>
                    )}
                  </span>
                  <span className="text-xs text-slate-600">
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                {result.defects.length > 0 && (
                  <div className="text-sm text-red-700">
                    瑕疵：{result.defects.join('、')}
                  </div>
                )}
                <div className="text-xs text-slate-600 mt-2">
                  置信度：{(result.confidence * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 导出模块类（用于注册）
export class QualityInspection extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <QualityInspectionModule context={context} />;
  }
}

