import React, { useState, useEffect } from 'react';
import { Pill, AlertTriangle, CheckCircle, Clock, FileText, Activity } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useAuth } from '../../../Contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

const metadata: ModuleMetadata = {
  id: 'drug-management',
  name: 'AI 藥物管理系統',
  version: '1.0.0',
  category: 'healthcare',
  industry: ['healthcare'],
  description: 'AI 智能藥物管理，處方安全檢查，藥物交互作用分析',
  icon: 'Pill',
  author: 'AI Business Platform',
  pricingTier: 'pro',
  features: [
    '處方安全檢查',
    '藥物交互作用檢測',
    '劑量驗證',
    '過敏檢查',
    'AI 風險評估'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface Drug {
  id: string;
  drug_code: string;
  drug_name: string;
  generic_name: string;
  drug_category: string;
  dosage_form: string;
  strength: string;
  requires_prescription: boolean;
  controlled_substance: boolean;
}

interface Prescription {
  id: string;
  prescription_number: string;
  patient_name: string;
  doctor_name: string;
  prescription_date: string;
  status: string;
  ai_checked: boolean;
  ai_warnings: string[];
}

interface CheckResult {
  risk_score: number;
  risk_level: string;
  warnings: any[];
  recommendations: string[];
  total_warnings: number;
  critical_warnings: number;
}

interface DrugManagementModuleProps {
  context: ModuleContext;
}

const DrugManagementModule: React.FC<DrugManagementModuleProps> = ({ context }) => {
  const { company } = useAuth();
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState('');

  useEffect(() => {
    if (!company?.id) return;
    loadDrugs();
    loadPrescriptions();
    loadStats();
  }, []);

  const loadDrugs = async () => {
    if (!company?.id) return;
    try {
      const { data, error } = await supabase
        .from('drugs')
        .select('*')
        .eq('company_id', company.id)
        .eq('status', 'active')
        .order('drug_name');

      if (error) throw error;
      setDrugs(data || []);
    } catch (error) {
      console.error('Error loading drugs:', error);
    }
  };

  const loadPrescriptions = async () => {
    if (!company?.id) return;
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('company_id', company.id)
        .order('prescription_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    }
  };

  const loadStats = async () => {
    if (!company?.id) return;
    try {
      const { data, error } = await supabase.functions.invoke('drug-management-ai', {
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

  const handleCheckPrescription = async () => {
    if (!selectedPrescription) {
      alert('請先選擇處方');
      return;
    }

    setLoading(true);
    try {
      // 獲取處方詳情
      const { data: prescription } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('id', selectedPrescription)
        .single();

      // 獲取處方明細
      const { data: items } = await supabase
        .from('prescription_items')
        .select('*')
        .eq('prescription_id', selectedPrescription);

      // AI 檢查
      const { data, error } = await supabase.functions.invoke('drug-management-ai', {
        body: {
          action: 'check_prescription',
          data: {
            prescriptionId: selectedPrescription,
            patientInfo: {
              age: prescription.patient_age,
              weight: prescription.patient_weight,
              allergies: prescription.patient_allergies || []
            },
            prescriptionItems: items || []
          }
        }
      });

      if (error) throw error;
      
      setCheckResult(data);
      console.log('✅ AI 檢查完成:', data);
      
      alert(`AI 檢查完成\n風險分數: ${data.risk_score}\n風險等級: ${data.risk_level}\n警告數: ${data.total_warnings}`);
    } catch (error: any) {
      console.error('❌ 檢查失敗:', error);
      alert('檢查失敗: ' + (error.message || '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelBadge = (level: string) => {
    const config: any = {
      low: { label: '低風險', class: 'bg-green-100 text-green-800' },
      moderate: { label: '中風險', class: 'bg-yellow-100 text-yellow-800' },
      high: { label: '高風險', class: 'bg-red-100 text-red-800' }
    };
    const cfg = config[level] || config.low;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.class}`}>{cfg.label}</span>;
  };

  const getStatusBadge = (status: string) => {
    const config: any = {
      pending: { label: '待配藥', class: 'bg-yellow-100 text-yellow-800' },
      dispensed: { label: '已配藥', class: 'bg-green-100 text-green-800' },
      cancelled: { label: '已取消', class: 'bg-gray-100 text-gray-800' }
    };
    const cfg = config[status] || config.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.class}`}>{cfg.label}</span>;
  };

  const getSeverityBadge = (severity: string) => {
    const config: any = {
      critical: { label: '嚴重', class: 'bg-red-100 text-red-800' },
      high: { label: '高', class: 'bg-orange-100 text-orange-800' },
      moderate: { label: '中', class: 'bg-yellow-100 text-yellow-800' },
      low: { label: '低', class: 'bg-blue-100 text-blue-800' }
    };
    const cfg = config[severity] || config.low;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.class}`}>{cfg.label}</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          💊 AI 藥物管理系統
        </h1>
        <p className="text-gray-600">
          使用 AI 智能檢查處方，確保用藥安全
        </p>
      </div>

      {/* 統計卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">藥物總數</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total_drugs || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">本月處方</div>
            <div className="text-2xl font-bold text-blue-600">{stats.total_prescriptions || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">待配藥</div>
            <div className="text-2xl font-bold text-orange-600">{stats.pending_prescriptions || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">低庫存</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.low_stock_drugs || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">過期藥品</div>
            <div className="text-2xl font-bold text-red-600">{stats.expired_stock || 0}</div>
          </div>
        </div>
      )}

      {/* AI 檢查面板 */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">🤖 AI 處方檢查</h2>
        
        <div className="flex gap-4 mb-4">
          <select
            value={selectedPrescription}
            onChange={(e) => setSelectedPrescription(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">選擇處方進行檢查</option>
            {prescriptions.map((prescription) => (
              <option key={prescription.id} value={prescription.id}>
                {prescription.prescription_number} - {prescription.patient_name} ({prescription.prescription_date.split('T')[0]})
              </option>
            ))}
          </select>
          
          <button
            onClick={handleCheckPrescription}
            disabled={loading || !selectedPrescription}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition whitespace-nowrap"
          >
            {loading ? '檢查中...' : '🔍 AI 檢查'}
          </button>
        </div>

        {/* 檢查結果 */}
        {checkResult && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-blue-900">
                ✨ AI 檢查結果
              </h3>
              {getRiskLevelBadge(checkResult.risk_level)}
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">風險分數</div>
                <div className="text-2xl font-bold text-gray-900">{checkResult.risk_score}</div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">總警告數</div>
                <div className="text-2xl font-bold text-orange-600">{checkResult.total_warnings}</div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">嚴重警告</div>
                <div className="text-2xl font-bold text-red-600">{checkResult.critical_warnings}</div>
              </div>
            </div>

            {checkResult.warnings.length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">⚠️ 警告:</div>
                <div className="space-y-2">
                  {checkResult.warnings.map((warning, index) => (
                    <div key={index} className="flex items-start bg-white p-3 rounded border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getSeverityBadge(warning.severity)}
                          <span className="text-xs text-gray-500">{warning.type}</span>
                        </div>
                        <div className="text-sm text-gray-900">{warning.message}</div>
                        {warning.drugs && warning.drugs.length > 0 && (
                          <div className="text-xs text-gray-600 mt-1">
                            相關藥物: {warning.drugs.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">💡 建議:</div>
              <ul className="list-disc list-inside space-y-1">
                {checkResult.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-600">{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 處方列表 */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">
          📋 最近處方 ({prescriptions.length})
        </h2>

        {prescriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            尚無處方記錄
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">處方號</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">患者</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">醫師</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">狀態</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI檢查</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {prescriptions.map((prescription) => (
                  <tr key={prescription.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {prescription.prescription_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {prescription.patient_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {prescription.doctor_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {prescription.prescription_date.split('T')[0]}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(prescription.status)}
                    </td>
                    <td className="px-4 py-3">
                      {prescription.ai_checked ? (
                        <span className="text-green-600 text-sm">
                          ✓ 已檢查
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">未檢查</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 藥物列表 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          💊 藥物列表 ({drugs.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drugs.map((drug) => (
            <div key={drug.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium text-gray-900">{drug.drug_name}</div>
                  <div className="text-sm text-gray-600">{drug.drug_code}</div>
                </div>
                {drug.controlled_substance && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">管制</span>
                )}
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <div>通用名: {drug.generic_name || '無'}</div>
                <div>類別: {drug.drug_category}</div>
                <div>劑型: {drug.dosage_form}</div>
                <div>規格: {drug.strength}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export class DrugManagement extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <DrugManagementModule context={context} />;
  }
}
