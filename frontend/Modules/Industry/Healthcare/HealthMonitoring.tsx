import React, { useState, useEffect } from 'react';
import { Activity, Heart, Thermometer, Wind, Droplet, AlertTriangle, TrendingUp, Users, Clock } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useAuth } from '../../../Contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

const metadata: ModuleMetadata = {
  id: 'health-monitoring',
  name: 'AI 健康監測',
  version: '1.0.0',
  category: 'healthcare',
  industry: ['healthcare'],
  description: 'AI 智能健康監測，生命體征追蹤，健康風險預警',
  icon: 'Activity',
  author: 'AI Business Platform',
  pricingTier: 'pro',
  features: [
    '生命體征監測',
    'AI 健康分析',
    '異常預警',
    '健康趨勢分析',
    '智能報告生成'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface Patient {
  id: string;
  patient_code: string;
  patient_name: string;
  date_of_birth: string;
  gender: string;
  chronic_conditions: string[];
  status: string;
}

interface VitalSign {
  id: string;
  measurement_time: string;
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate: number;
  temperature: number;
  oxygen_saturation: number;
  blood_glucose: number;
}

interface HealthAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  patient_name?: string;
}

interface HealthStats {
  total_patients: number;
  active_patients: number;
  total_measurements_today: number;
  active_alerts: number;
  critical_alerts: number;
}

interface HealthMonitoringModuleProps {
  context: ModuleContext;
}

const HealthMonitoringModule: React.FC<HealthMonitoringModuleProps> = ({ context }) => {
  const { company } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  // 測量表單狀態
  const [newVitals, setNewVitals] = useState({
    systolic_bp: '',
    diastolic_bp: '',
    heart_rate: '',
    temperature: '',
    oxygen_saturation: '',
    blood_glucose: ''
  });

  useEffect(() => {
    if (!company?.id) return;
    loadPatients();
    loadAlerts();
    loadStats();
  }, [company?.id]);

  useEffect(() => {
    if (selectedPatient) {
      loadVitalSigns(selectedPatient);
    }
  }, [selectedPatient]);

  const loadPatients = async () => {
    if (!company?.id) return;
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('company_id', company.id)
        .eq('status', 'active')
        .order('patient_name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadVitalSigns = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('vital_signs')
        .select('*')
        .eq('patient_id', patientId)
        .order('measurement_time', { ascending: false })
        .limit(10);

      if (error) throw error;
      setVitalSigns(data || []);
    } catch (error) {
      console.error('Error loading vital signs:', error);
    }
  };

  const loadAlerts = async () => {
    if (!company?.id) return;
    try {
      const { data, error } = await supabase
        .from('health_alerts')
        .select('*, patients(patient_name)')
        .eq('company_id', company.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const alertsWithPatientName = (data || []).map(alert => ({
        ...alert,
        patient_name: (alert as any).patients?.patient_name
      }));
      
      setAlerts(alertsWithPatientName);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadStats = async () => {
    if (!company?.id) return;
    try {
      const { data, error } = await supabase.functions.invoke('health-monitoring-ai', {
        body: {
          action: 'get_statistics',
          data: { companyId: company.id }
        }
      });

      if (error) throw error;
      setStats(data?.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAddVitalSigns = async () => {
    if (!selectedPatient || !company?.id) {
      alert('請先選擇患者');
      return;
    }

    setLoading(true);
    try {
      // 準備生命體征數據
      const vitals = {
        company_id: company.id,
        patient_id: selectedPatient,
        systolic_bp: newVitals.systolic_bp ? parseInt(newVitals.systolic_bp) : null,
        diastolic_bp: newVitals.diastolic_bp ? parseInt(newVitals.diastolic_bp) : null,
        heart_rate: newVitals.heart_rate ? parseInt(newVitals.heart_rate) : null,
        temperature: newVitals.temperature ? parseFloat(newVitals.temperature) : null,
        oxygen_saturation: newVitals.oxygen_saturation ? parseInt(newVitals.oxygen_saturation) : null,
        blood_glucose: newVitals.blood_glucose ? parseFloat(newVitals.blood_glucose) : null
      };

      // 儲存到資料庫
      const { data: savedVital, error: insertError } = await supabase
        .from('vital_signs')
        .insert(vitals)
        .select()
        .single();

      if (insertError) throw insertError;

      // 使用 AI 分析
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('health-monitoring-ai', {
        body: {
          action: 'analyze_vital_signs',
          data: {
            companyId: company.id,
            patientId: selectedPatient,
            vitalSigns: vitals
          }
        }
      });

      if (analysisError) {
        console.error('AI analysis error:', analysisError);
      }

      setAnalysisResult(analysisData?.analysis);
      
      // 重新載入數據
      await loadVitalSigns(selectedPatient);
      await loadAlerts();
      await loadStats();
      
      // 清空表單
      setNewVitals({
        systolic_bp: '',
        diastolic_bp: '',
        heart_rate: '',
        temperature: '',
        oxygen_saturation: '',
        blood_glucose: ''
      });

      alert('✅ 生命體征已記錄並完成 AI 分析');
    } catch (error) {
      console.error('Error adding vital signs:', error);
      alert('❌ 記錄失敗：' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'moderate': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-8 h-8 text-blue-600" />
          AI 健康監測系統
        </h2>
        <p className="text-slate-600 mt-1">智能健康數據追蹤與分析</p>
      </div>

      {/* 統計卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">總患者數</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total_patients}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">活躍患者</p>
                <p className="text-2xl font-bold text-slate-900">{stats.active_patients}</p>
              </div>
              <Heart className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">今日測量</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total_measurements_today}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">活躍警報</p>
                <p className="text-2xl font-bold text-slate-900">{stats.active_alerts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">緊急警報</p>
                <p className="text-2xl font-bold text-slate-900">{stats.critical_alerts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側：患者選擇和測量輸入 */}
        <div className="space-y-6">
          {/* 患者選擇 */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              選擇患者
            </h3>
            
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- 請選擇患者 --</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.patient_name} ({patient.patient_code})
                  {patient.chronic_conditions && patient.chronic_conditions.length > 0 && 
                    ` - ${patient.chronic_conditions.join(', ')}`}
                </option>
              ))}
            </select>
          </div>

          {/* 生命體征輸入 */}
          {selectedPatient && (
            <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" />
                記錄生命體征
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    收縮壓 (mmHg)
                  </label>
                  <input
                    type="number"
                    value={newVitals.systolic_bp}
                    onChange={(e) => setNewVitals({...newVitals, systolic_bp: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="120"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    舒張壓 (mmHg)
                  </label>
                  <input
                    type="number"
                    value={newVitals.diastolic_bp}
                    onChange={(e) => setNewVitals({...newVitals, diastolic_bp: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="80"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    心率 (bpm)
                  </label>
                  <input
                    type="number"
                    value={newVitals.heart_rate}
                    onChange={(e) => setNewVitals({...newVitals, heart_rate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="75"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    體溫 (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newVitals.temperature}
                    onChange={(e) => setNewVitals({...newVitals, temperature: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="36.5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    血氧 (%)
                  </label>
                  <input
                    type="number"
                    value={newVitals.oxygen_saturation}
                    onChange={(e) => setNewVitals({...newVitals, oxygen_saturation: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="98"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    血糖 (mg/dL)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newVitals.blood_glucose}
                    onChange={(e) => setNewVitals({...newVitals, blood_glucose: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </div>
              </div>
              
              <button
                onClick={handleAddVitalSigns}
                disabled={loading}
                className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 flex items-center justify-center gap-2"
              >
                {loading ? '分析中...' : '記錄並進行 AI 分析'}
                <Activity className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* AI 分析結果 */}
          {analysisResult && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                AI 分析結果
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">健康評分：</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {analysisResult.health_score}/100
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">風險等級：</span>
                  <span className={`font-semibold ${getRiskLevelColor(analysisResult.risk_level)}`}>
                    {analysisResult.risk_level === 'low' && '低風險'}
                    {analysisResult.risk_level === 'moderate' && '中等風險'}
                    {analysisResult.risk_level === 'high' && '高風險'}
                    {analysisResult.risk_level === 'critical' && '緊急'}
                  </span>
                </div>
                
                {analysisResult.ai_insights && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                    <p className="text-sm text-slate-700">{analysisResult.ai_insights}</p>
                  </div>
                )}
                
                {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-slate-700 mb-2">建議：</p>
                    <ul className="space-y-1">
                      {analysisResult.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 右側：歷史記錄和警報 */}
        <div className="space-y-6">
          {/* 歷史測量記錄 */}
          {selectedPatient && vitalSigns.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                歷史測量記錄
              </h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {vitalSigns.map(vital => (
                  <div key={vital.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-slate-500">
                        {new Date(vital.measurement_time).toLocaleString('zh-TW')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {vital.systolic_bp && vital.diastolic_bp && (
                        <div>
                          <span className="text-slate-600">血壓：</span>
                          <span className="font-medium">{vital.systolic_bp}/{vital.diastolic_bp}</span>
                        </div>
                      )}
                      {vital.heart_rate && (
                        <div>
                          <span className="text-slate-600">心率：</span>
                          <span className="font-medium">{vital.heart_rate} bpm</span>
                        </div>
                      )}
                      {vital.temperature && (
                        <div>
                          <span className="text-slate-600">體溫：</span>
                          <span className="font-medium">{vital.temperature}°C</span>
                        </div>
                      )}
                      {vital.oxygen_saturation && (
                        <div>
                          <span className="text-slate-600">血氧：</span>
                          <span className="font-medium">{vital.oxygen_saturation}%</span>
                        </div>
                      )}
                      {vital.blood_glucose && (
                        <div>
                          <span className="text-slate-600">血糖：</span>
                          <span className="font-medium">{vital.blood_glucose}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 健康警報 */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              健康警報
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-slate-500 text-center py-4">目前無活躍警報</p>
              ) : (
                alerts.map(alert => (
                  <div 
                    key={alert.id} 
                    className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-white">
                        {alert.severity === 'critical' && '緊急'}
                        {alert.severity === 'warning' && '警告'}
                        {alert.severity === 'info' && '資訊'}
                      </span>
                    </div>
                    
                    {alert.patient_name && (
                      <p className="text-sm mb-1">
                        <span className="font-medium">患者：</span>{alert.patient_name}
                      </p>
                    )}
                    
                    <p className="text-sm mb-2">{alert.description}</p>
                    
                    <p className="text-xs text-slate-600">
                      {new Date(alert.created_at).toLocaleString('zh-TW')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export class HealthMonitoring extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <HealthMonitoringModule context={context} />;
  }
}


