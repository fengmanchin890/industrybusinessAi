/**
 * 模块基类 - 所有 AI 模块的基础类
 * 提供统一的接口和生命周期管理
 */

import { ReactNode } from 'react';
import { Database } from '../../lib/supabase';

export interface ModuleMetadata {
  id: string;
  name: string;
  version: string;
  category: string;
  industry: string[];
  description: string;
  icon: string;
  author: string;
  pricingTier: 'basic' | 'pro' | 'enterprise';
  features: string[];
  dependencies?: string[];
}

export interface ModuleConfig {
  enabled: boolean;
  settings: Record<string, any>;
  dataConnections?: string[];
}

export interface ModuleContext {
  companyId: string;
  userId: string;
  moduleId: string;
  config: ModuleConfig;
}

export interface ModuleCapabilities {
  canGenerateReports: boolean;
  canSendAlerts: boolean;
  canProcessData: boolean;
  canIntegrateExternal: boolean;
  requiresDataConnection: boolean;
}

export interface ModuleState {
  status: 'idle' | 'running' | 'error' | 'paused';
  lastRun?: Date;
  errorMessage?: string;
  metrics?: Record<string, any>;
}

/**
 * 模块生命周期钩子
 */
export interface ModuleLifecycle {
  onInstall?(context: ModuleContext): Promise<void>;
  onUninstall?(context: ModuleContext): Promise<void>;
  onEnable?(context: ModuleContext): Promise<void>;
  onDisable?(context: ModuleContext): Promise<void>;
  onConfigUpdate?(context: ModuleContext, newConfig: ModuleConfig): Promise<void>;
}

/**
 * 模块数据处理接口
 */
export interface ModuleDataProcessor {
  processData?(data: any, context: ModuleContext): Promise<any>;
  validateData?(data: any): Promise<boolean>;
  transformData?(data: any): Promise<any>;
}

/**
 * 模块基类
 */
export abstract class ModuleBase implements ModuleLifecycle, ModuleDataProcessor {
  protected metadata: ModuleMetadata;
  protected capabilities: ModuleCapabilities;
  protected state: ModuleState;

  constructor(metadata: ModuleMetadata, capabilities: ModuleCapabilities) {
    this.metadata = metadata;
    this.capabilities = capabilities;
    this.state = {
      status: 'idle'
    };
  }

  // Getters
  getMetadata(): ModuleMetadata {
    return this.metadata;
  }

  getCapabilities(): ModuleCapabilities {
    return this.capabilities;
  }

  getState(): ModuleState {
    return this.state;
  }

  // State management
  protected updateState(updates: Partial<ModuleState>): void {
    this.state = { ...this.state, ...updates };
  }

  // 抽象方法 - 必须由子类实现
  abstract render(context: ModuleContext): ReactNode;

  // 生命周期钩子 - 可选实现
  async onInstall(context: ModuleContext): Promise<void> {
    console.log(`Module ${this.metadata.name} installed`);
  }

  async onUninstall(context: ModuleContext): Promise<void> {
    console.log(`Module ${this.metadata.name} uninstalled`);
  }

  async onEnable(context: ModuleContext): Promise<void> {
    this.updateState({ status: 'running' });
    console.log(`Module ${this.metadata.name} enabled`);
  }

  async onDisable(context: ModuleContext): Promise<void> {
    this.updateState({ status: 'paused' });
    console.log(`Module ${this.metadata.name} disabled`);
  }

  async onConfigUpdate(context: ModuleContext, newConfig: ModuleConfig): Promise<void> {
    console.log(`Module ${this.metadata.name} config updated`);
  }

  // 数据处理 - 可选实现
  async processData(data: any, context: ModuleContext): Promise<any> {
    return data;
  }

  async validateData(data: any): Promise<boolean> {
    return true;
  }

  async transformData(data: any): Promise<any> {
    return data;
  }

  // 工具方法
  protected async generateReport(
    context: ModuleContext,
    title: string,
    content: string,
    reportType: string
  ): Promise<void> {
    if (!this.capabilities.canGenerateReports) {
      throw new Error('Module does not have report generation capability');
    }

    // 这里会调用 ModuleAPI 来创建报表
    console.log(`Generating report: ${title}`);
  }

  protected async sendAlert(
    context: ModuleContext,
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    message: string
  ): Promise<void> {
    if (!this.capabilities.canSendAlerts) {
      throw new Error('Module does not have alert sending capability');
    }

    console.log(`Sending alert [${severity}]: ${title}`);
  }

  protected async logMetric(metricName: string, value: any): Promise<void> {
    if (!this.state.metrics) {
      this.state.metrics = {};
    }
    this.state.metrics[metricName] = value;
  }
}

/**
 * 模块注册表
 */
export class ModuleRegistry {
  private static modules = new Map<string, typeof ModuleBase>();

  static register(moduleClass: typeof ModuleBase, metadata: ModuleMetadata): void {
    this.modules.set(metadata.id, moduleClass);
  }

  static get(moduleId: string): typeof ModuleBase | undefined {
    return this.modules.get(moduleId);
  }

  static getAll(): Map<string, typeof ModuleBase> {
    return this.modules;
  }

  static has(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }
}

