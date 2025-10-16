/**
 * 模块开发 Hooks - 为模块提供便捷的 React Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { ModuleContext, ModuleConfig, ModuleState } from './ModuleBase';
import { supabase } from '../../lib/supabase';

/**
 * 使用模块上下文
 */
export function useModuleContext(moduleId: string, companyId: string, userId: string): ModuleContext {
  const [config, setConfig] = useState<ModuleConfig>({
    enabled: true,
    settings: {}
  });

  useEffect(() => {
    loadModuleConfig();
  }, [moduleId, companyId]);

  const loadModuleConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('company_modules')
        .select('config, is_enabled')
        .eq('company_id', companyId)
        .eq('module_id', moduleId)
        .single();

      if (error) throw error;

      if (data) {
        setConfig({
          enabled: data.is_enabled,
          settings: data.config || {}
        });
      }
    } catch (error) {
      console.error('Error loading module config:', error);
    }
  };

  return {
    companyId,
    userId,
    moduleId,
    config
  };
}

/**
 * 使用模块配置
 */
export function useModuleConfig(context: ModuleContext) {
  const [config, setConfig] = useState<ModuleConfig>(context.config);
  const [loading, setLoading] = useState(false);

  const updateConfig = useCallback(async (newSettings: Record<string, any>) => {
    setLoading(true);
    try {
      const updatedConfig = {
        ...config,
        settings: { ...config.settings, ...newSettings }
      };

      const { error } = await supabase
        .from('company_modules')
        .update({ config: updatedConfig.settings })
        .eq('company_id', context.companyId)
        .eq('module_id', context.moduleId);

      if (error) throw error;

      setConfig(updatedConfig);
      return true;
    } catch (error) {
      console.error('Error updating module config:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [context, config]);

  return { config, updateConfig, loading };
}

/**
 * 使用模块状态
 */
export function useModuleState(initialState?: Partial<ModuleState>) {
  const [state, setState] = useState<ModuleState>({
    status: 'idle',
    ...initialState
  });

  const updateState = useCallback((updates: Partial<ModuleState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setRunning = useCallback(() => {
    updateState({ status: 'running', lastRun: new Date() });
  }, [updateState]);

  const setError = useCallback((errorMessage: string) => {
    updateState({ status: 'error', errorMessage });
  }, [updateState]);

  const setIdle = useCallback(() => {
    updateState({ status: 'idle', errorMessage: undefined });
  }, [updateState]);

  return { state, updateState, setRunning, setError, setIdle };
}

/**
 * 使用模块数据加载
 */
export function useModuleData<T>(
  context: ModuleContext,
  tableName: string,
  query?: any
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let queryBuilder = supabase
        .from(tableName)
        .select('*')
        .eq('company_id', context.companyId);

      if (query) {
        // 应用额外的查询条件
        Object.entries(query).forEach(([key, value]) => {
          queryBuilder = queryBuilder.eq(key, value);
        });
      }

      const { data: result, error: queryError } = await queryBuilder;

      if (queryError) throw queryError;

      setData(result as T[]);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading module data:', err);
    } finally {
      setLoading(false);
    }
  }, [context, tableName, query]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, reload: loadData };
}

/**
 * 使用报表生成
 */
export function useReportGeneration(context: ModuleContext) {
  const [generating, setGenerating] = useState(false);

  const generateReport = useCallback(async (
    title: string,
    content: string,
    reportType: string = 'auto_generated'
  ) => {
    setGenerating(true);
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          company_id: context.companyId,
          module_id: context.moduleId,
          title,
          content,
          report_type: reportType,
          created_by: context.userId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error generating report:', error);
      return false;
    } finally {
      setGenerating(false);
    }
  }, [context]);

  return { generateReport, generating };
}

/**
 * 使用警示发送
 */
export function useAlertSending(context: ModuleContext) {
  const [sending, setSending] = useState(false);

  const sendAlert = useCallback(async (
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    message: string
  ) => {
    setSending(true);
    try {
      const { error } = await supabase
        .from('alerts')
        .insert({
          company_id: context.companyId,
          module_id: context.moduleId,
          severity,
          title,
          message,
          is_read: false
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending alert:', error);
      return false;
    } finally {
      setSending(false);
    }
  }, [context]);

  return { sendAlert, sending };
}

/**
 * 使用数据连接
 */
export function useDataConnection(context: ModuleContext, connectionType?: string) {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnections();
  }, [context, connectionType]);

  const loadConnections = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('data_connections')
        .select('*')
        .eq('company_id', context.companyId)
        .eq('status', 'active');

      if (connectionType) {
        query = query.eq('connection_type', connectionType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error loading data connections:', error);
    } finally {
      setLoading(false);
    }
  };

  return { connections, loading, reload: loadConnections };
}

/**
 * 使用实时订阅
 */
export function useModuleRealtime<T>(
  context: ModuleContext,
  tableName: string,
  onUpdate: (payload: any) => void
) {
  useEffect(() => {
    const channel = supabase
      .channel(`${tableName}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `company_id=eq.${context.companyId}`
        },
        onUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [context, tableName, onUpdate]);
}

