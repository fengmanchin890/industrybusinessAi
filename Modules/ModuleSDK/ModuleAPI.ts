/**
 * 模块 API - 提供模块与平台交互的 API 接口
 */

import { supabase } from '../../lib/supabase';
import { ModuleContext, ModuleConfig } from './ModuleBase';

export class ModuleAPI {
  private context: ModuleContext;

  constructor(context: ModuleContext) {
    this.context = context;
  }

  /**
   * 报表管理
   */
  async createReport(
    title: string,
    content: string,
    reportType: string = 'auto_generated'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          company_id: this.context.companyId,
          module_id: this.context.moduleId,
          title,
          content,
          report_type: reportType,
          created_by: this.context.userId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating report:', error);
      return false;
    }
  }

  async getReports(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('company_id', this.context.companyId)
        .eq('module_id', this.context.moduleId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting reports:', error);
      return [];
    }
  }

  /**
   * 警示管理
   */
  async createAlert(
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    message: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('alerts')
        .insert({
          company_id: this.context.companyId,
          module_id: this.context.moduleId,
          severity,
          title,
          message,
          is_read: false
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating alert:', error);
      return false;
    }
  }

  async getAlerts(onlyUnread: boolean = true): Promise<any[]> {
    try {
      let query = supabase
        .from('alerts')
        .select('*')
        .eq('company_id', this.context.companyId)
        .eq('module_id', this.context.moduleId)
        .order('created_at', { ascending: false });

      if (onlyUnread) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting alerts:', error);
      return [];
    }
  }

  async markAlertAsRead(alertId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', alertId)
        .eq('company_id', this.context.companyId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking alert as read:', error);
      return false;
    }
  }

  /**
   * 数据连接管理
   */
  async getDataConnections(connectionType?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('data_connections')
        .select('*')
        .eq('company_id', this.context.companyId)
        .eq('status', 'active');

      if (connectionType) {
        query = query.eq('connection_type', connectionType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting data connections:', error);
      return [];
    }
  }

  async createDataConnection(
    connectionType: string,
    connectionName: string,
    connectionConfig: Record<string, any>
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('data_connections')
        .insert({
          company_id: this.context.companyId,
          connection_type: connectionType,
          connection_name: connectionName,
          connection_config: connectionConfig,
          status: 'active'
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error creating data connection:', error);
      return null;
    }
  }

  async updateDataConnectionStatus(
    connectionId: string,
    status: 'active' | 'inactive' | 'error'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('data_connections')
        .update({ status })
        .eq('id', connectionId)
        .eq('company_id', this.context.companyId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating data connection status:', error);
      return false;
    }
  }

  /**
   * 配置管理
   */
  async getConfig(): Promise<ModuleConfig> {
    return this.context.config;
  }

  async updateConfig(newSettings: Record<string, any>): Promise<boolean> {
    try {
      const updatedConfig = {
        ...this.context.config.settings,
        ...newSettings
      };

      const { error } = await supabase
        .from('company_modules')
        .update({ config: updatedConfig })
        .eq('company_id', this.context.companyId)
        .eq('module_id', this.context.moduleId);

      if (error) throw error;

      // 更新本地上下文
      this.context.config.settings = updatedConfig;
      return true;
    } catch (error) {
      console.error('Error updating config:', error);
      return false;
    }
  }

  /**
   * 公司信息
   */
  async getCompanyInfo(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', this.context.companyId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting company info:', error);
      return null;
    }
  }

  /**
   * 用户信息
   */
  async getUserInfo(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', this.context.userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  /**
   * 实时订阅
   */
  subscribeToTable(
    tableName: string,
    callback: (payload: any) => void
  ): () => void {
    const channel = supabase
      .channel(`${tableName}_${this.context.moduleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `company_id=eq.${this.context.companyId}`
        },
        callback
      )
      .subscribe();

    // 返回取消订阅函数
    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * 日志记录
   */
  async log(level: 'info' | 'warn' | 'error', message: string, data?: any): Promise<void> {
    console.log(`[Module ${this.context.moduleId}] [${level.toUpperCase()}] ${message}`, data);
    
    // 可以选择将日志存储到数据库
    // 这里暂时只输出到控制台
  }

  /**
   * 指标记录
   */
  async recordMetric(metricName: string, value: number, metadata?: Record<string, any>): Promise<boolean> {
    try {
      // 这里可以记录模块的运行指标
      // 暂时使用日志输出
      this.log('info', `Metric recorded: ${metricName}`, { value, metadata });
      return true;
    } catch (error) {
      console.error('Error recording metric:', error);
      return false;
    }
  }
}

/**
 * 创建模块 API 实例
 */
export function createModuleAPI(context: ModuleContext): ModuleAPI {
  return new ModuleAPI(context);
}

