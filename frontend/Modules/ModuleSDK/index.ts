/**
 * Module SDK 导出入口
 */

export {
  ModuleBase,
  ModuleRegistry,
  type ModuleMetadata,
  type ModuleConfig,
  type ModuleContext,
  type ModuleCapabilities,
  type ModuleState,
  type ModuleLifecycle,
  type ModuleDataProcessor
} from './ModuleBase';

export {
  useModuleContext,
  useModuleConfig,
  useModuleState,
  useModuleData,
  useReportGeneration,
  useAlertSending,
  useDataConnection,
  useModuleRealtime
} from './ModuleHooks';

export {
  ModuleAPI,
  createModuleAPI
} from './ModuleAPI';

// Export all modules
export { PredictiveMaintenance } from '../Industry/Manufacturing/PredictiveMaintenance';
export { QualityInspection } from '../Industry/Manufacturing/QualityInspection';
export { VoiceOrdering } from '../Industry/FoodBeverage/VoiceOrdering';
export { PurchaseForecast } from '../Industry/FoodBeverage/PurchaseForecast';
export { MarketingAssistant } from '../Industry/SME/MarketingAssistant';
export { OfficeAgent } from '../Industry/SME/OfficeAgent';
export { FinancialAnalyzer } from '../Industry/SME/FinancialAnalyzer';
export { WorkflowAutomation } from '../Industry/SME/WorkflowAutomation';
export { CustomerServiceBot } from '../Industry/SME/CustomerServiceBot';
export { SemanticSearch } from '../Industry/Retail/SemanticSearch';
export { MedicalRecordAssistant } from '../Industry/Healthcare/MedicalRecordAssistant';
export { ElderCareMonitoring } from '../Industry/Healthcare/ElderCareMonitoring';
export { DeliveryAssistant } from '../Industry/Logistics/DeliveryAssistant';
export { WarehouseScheduler } from '../Industry/Logistics/WarehouseScheduler';
export { RiskAssessment } from '../Industry/Finance/RiskAssessment';
export { InvestmentAnalyzer } from '../Industry/Finance/InvestmentAnalyzer';
export { FraudDetection } from '../Industry/Finance/FraudDetection';
export { DocumentReview } from '../Industry/Finance/DocumentReview';
export { DocumentAssistant } from '../Industry/Government/DocumentAssistant';
export { CitizenService } from '../Industry/Government/CitizenService';
export { PolicyAnalysis } from '../Industry/Government/PolicyAnalysis';
export { LearningAssistant } from '../Industry/Education/LearningAssistant';
export { StudentPerformance } from '../Industry/Education/StudentPerformance';
export { CurriculumOptimizer } from '../Industry/Education/CurriculumOptimizer';

