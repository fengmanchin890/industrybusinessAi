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

