import React from 'react';
import { useAuth } from '../Contexts/AuthContext';
import { ModuleContext } from './ModuleSDK';
import { PurchaseForecastView } from './Industry/FoodBeverage/PurchaseForecast';
import { VoiceOrderingModule } from './Industry/FoodBeverage/VoiceOrdering';
import { MarketingAssistant } from './Industry/SME/MarketingAssistant';
import { IndustrialDataConnector } from './Industry/Manufacturing/IndustrialDataConnector';
import { QualityInspection } from './Industry/Manufacturing/QualityInspection';
import { PredictiveMaintenance } from './Industry/Manufacturing/PredictiveMaintenance';
import { CustomerServiceBot } from './Industry/SME/CustomerServiceBot';
import { SemanticSearch } from './Industry/Retail/SemanticSearch';
import { RecommendationSystem } from './Industry/Retail/RecommendationSystem';
import { FinancialAnalyzer } from './Industry/SME/FinancialAnalyzer';
import { OfficeAgent } from './Industry/SME/OfficeAgent';
import { VirtualAssistant } from './Industry/SME/VirtualAssistant';
import { MedicalRecordAssistant } from './Industry/Healthcare/MedicalRecordAssistant';
import { NursingSchedule } from './Industry/Healthcare/NursingSchedule';
import { DrugInteractionChecker } from './Industry/Healthcare/DrugInteractionChecker';
import { DrugManagement } from './Industry/Healthcare/DrugManagement';
import { HealthMonitoring } from './Industry/Healthcare/HealthMonitoring';
import { RouteOptimizer } from './Industry/Logistics/RouteOptimizer';
import { InventoryOptimizer } from './Industry/Logistics/InventoryOptimizer';
import { CargoTrackingModule } from './Industry/Logistics/CargoTracking';
import { WarehouseScheduler } from './Industry/Logistics/WarehouseScheduler';
import { RiskAssessment } from './Industry/Finance/RiskAssessment';
import { PolicyAnalysis } from './Industry/Government/PolicyAnalysis';
import { CitizenService } from './Industry/Government/CitizenService';
import { DataGovernance } from './Industry/Government/DataGovernance';
import { LearningAssistant } from './Industry/Education/LearningAssistant';
import { StudentPerformance } from './Industry/Education/StudentPerformance';
import { CurriculumOptimizer } from './Industry/Education/CurriculumOptimizer';
import { SecurityMonitor } from './Industry/Government/SecurityMonitor';
import { DocumentReview } from './Industry/Finance/DocumentReview';
import { InvestmentAnalyzer } from './Industry/Finance/InvestmentAnalyzer';
import { FraudDetection } from './Industry/Finance/FraudDetection';

export function ModuleRunner({ 
  moduleName, 
  moduleId, 
  onClose 
}: { 
  moduleName: string; 
  moduleId?: string;
  onClose: () => void;
}) {
  const { user, company } = useAuth();

  if (!user || !company?.id) {
    return <div className="p-6 text-slate-600">尚未載入使用者或公司資訊</div>;
  }

  const context: ModuleContext = {
    companyId: company.id,
    userId: user.id,
    moduleId: moduleId || moduleName, // 使用實際的 moduleId UUID，如果沒有則回退到名稱
    config: { enabled: true, settings: {} },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">{moduleName}</h3>
        <button onClick={onClose} className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded">返回</button>
      </div>

      {/* 依模組名稱渲染對應內容 */}
      {moduleName.includes('进货预测') || moduleName.includes('進貨預測') ? (
        <PurchaseForecastView context={context} />
      ) : moduleName.includes('點餐助理') || moduleName.includes('点餐助理') ? (
        <VoiceOrderingModule context={context} />
      ) : moduleName.includes('行銷') || moduleName.includes('行销') ? (
        <>{new MarketingAssistant().render(context)}</>
      ) : moduleName.includes('工業數據連接器') || moduleName.includes('工业数据连接器') || moduleName.includes('data-connector') ? (
        <IndustrialDataConnector context={context} />
      ) : moduleName.includes('品检') || moduleName.includes('品檢') || moduleName.includes('Quality Inspection') ? (
        <>{new QualityInspection().render(context)}</>
      ) : moduleName.includes('预测性维护') || moduleName.includes('預測性維護') || moduleName.includes('Predictive Maintenance') ? (
        <>{new PredictiveMaintenance().render(context)}</>
      ) : moduleName.includes('售后助理') || moduleName.includes('售後助理') || moduleName.includes('客戶服務') || moduleName.includes('客户服务') ? (
        <>{new CustomerServiceBot().render(context)}</>
      ) : moduleName.includes('智能搜索') || moduleName.includes('智慧搜尋') || moduleName.includes('Semantic Search') ? (
        <>{new SemanticSearch().render(context)}</>
      ) : moduleName.includes('推荐系统') || moduleName.includes('推薦系統') || moduleName.includes('Recommendation') ? (
        <>{new RecommendationSystem().render(context)}</>
      ) : moduleName.includes('财务分析') || moduleName.includes('財務分析') || moduleName.includes('Financial') ? (
        <>{new FinancialAnalyzer().render(context)}</>
      ) : moduleName.includes('Office Agent') || moduleName.includes('办公助理') || moduleName.includes('辦公助理') ? (
        <>{new OfficeAgent().render(context)}</>
      ) : moduleName.includes('虚拟助理') || moduleName.includes('虛擬助理') || moduleName.includes('Virtual Assistant') ? (
        <>{new VirtualAssistant().render(context)}</>
      ) : moduleName.includes('病歷') || moduleName.includes('病历') || moduleName.includes('Medical Record') ? (
        <>{new MedicalRecordAssistant().render(context)}</>
      ) : moduleName.includes('藥物管理') || moduleName.includes('药物管理') || moduleName.includes('AI 藥物') ? (
        <>{new DrugManagement().render(context)}</>
      ) : moduleName.includes('健康監測') || moduleName.includes('健康监测') || moduleName.includes('Health.*Monitor') ? (
        <>{new HealthMonitoring().render(context)}</>
      ) : moduleName.includes('藥物交互') || moduleName.includes('药物交互') || moduleName.includes('Drug') ? (
        <>{new DrugInteractionChecker().render(context)}</>
      ) : moduleName.includes('護理排班') || moduleName.includes('护理排班') || moduleName.includes('Nursing.*Schedul') ? (
        <>{new NursingSchedule().render(context)}</>
      ) : moduleName.includes('路線優化') || moduleName.includes('路线优化') || moduleName.includes('Route.*Optimi') ? (
        <>{new RouteOptimizer().render(context)}</>
      ) : moduleName.includes('庫存') || moduleName.includes('库存') || moduleName.includes('Inventory') ? (
        <>{new InventoryOptimizer().render(context)}</>
      ) : moduleName.includes('貨物追蹤') || moduleName.includes('货物追踪') || moduleName.includes('Cargo.*Track') ? (
        <CargoTrackingModule context={context} />
      ) : moduleName.includes('倉儲管理') || moduleName.includes('仓储管理') || moduleName.includes('倉儲排班') || moduleName.includes('仓储排班') || moduleName.includes('Warehouse') ? (
        <>{new WarehouseScheduler().render(context)}</>
      ) : moduleName.includes('風險評估') || moduleName.includes('风险评估') || moduleName.includes('Risk.*Assess') ? (
        <>{new RiskAssessment().render(context)}</>
      ) : moduleName.includes('政策分析') || moduleName.includes('Policy.*Analy') ? (
        <>{new PolicyAnalysis().render(context)}</>
      ) : moduleName.includes('數據治理') || moduleName.includes('数据治理') || moduleName.includes('Data.*Govern') ? (
        <>{new DataGovernance().render(context)}</>
      ) : moduleName.includes('市民服務') || moduleName.includes('市民服务') || moduleName.includes('公共服務') || moduleName.includes('公民服務') || moduleName.includes('公民服务') || moduleName.includes('Citizen.*Service') ? (
        <>{new CitizenService().render(context)}</>
      ) : moduleName.includes('學習分析') || moduleName.includes('学习分析') || moduleName.includes('Learning.*Assist') ? (
        <>{new LearningAssistant().render(context)}</>
      ) : moduleName.includes('評估系統') || moduleName.includes('评估系统') || moduleName.includes('表現分析') || moduleName.includes('表现分析') || moduleName.includes('Performance') ? (
        <>{new StudentPerformance().render(context)}</>
      ) : moduleName.includes('課程設計') || moduleName.includes('课程设计') || moduleName.includes('課程優化') || moduleName.includes('课程优化') || moduleName.includes('Curriculum') ? (
        <>{new CurriculumOptimizer().render(context)}</>
      ) : moduleName.includes('教學助手') || moduleName.includes('教学助手') || moduleName.includes('Teaching.*Assistant') ? (
        <>{new LearningAssistant().render(context)}</>
      ) : moduleName.includes('安全監控') || moduleName.includes('安全监控') || moduleName.includes('Security.*Monitor') ? (
        <>{new SecurityMonitor().render(context)}</>
      ) : moduleName.includes('文件審核') || moduleName.includes('文件审核') || moduleName.includes('Document.*Review') ? (
        <>{new DocumentReview().render(context)}</>
      ) : moduleName.includes('投資分析') || moduleName.includes('投资分析') || moduleName.includes('Investment.*Analy') ? (
        <>{new InvestmentAnalyzer().render(context)}</>
      ) : moduleName.includes('詐欺偵測') || moduleName.includes('诈欺侦测') || moduleName.includes('欺詐檢測') || moduleName.includes('欺诈检测') || moduleName.includes('Fraud.*Detection') ? (
        <>{new FraudDetection().render(context)}</>
      ) : (
        <div className="p-6 bg-white rounded-xl border">此模組尚未提供視圖</div>
      )}
    </div>
  );
}


