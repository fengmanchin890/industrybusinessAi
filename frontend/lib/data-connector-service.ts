/**
 * 数据连接器服务
 * 管理工业数据连接（PLC、MES、Excel 等）
 */

import { supabase } from './supabase';

export interface DataConnection {
  id: string;
  name: string;
  type: 'PLC' | 'MES' | 'ERP' | 'Excel' | 'Database' | 'API';
  status: 'connected' | 'disconnected' | 'error' | 'testing';
  last_sync: string;
  record_count: number;
  config?: Record<string, any>;
  error_message?: string;
  company_id?: string;
}

export interface ExcelUploadResponse {
  connection_id: string;
  filename: string;
  stats: {
    rows: number;
    columns: string[];
    dtypes: Record<string, string>;
    null_counts: Record<string, number>;
  };
  preview: Record<string, any>[];
  total_rows: number;
  status: string;
  message: string;
}

export interface ConnectionTestRequest {
  type: string;
  config: Record<string, any>;
}

export interface ConnectionTestResponse {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

export class DataConnectorService {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = import.meta.env.VITE_DATA_CONNECTOR_URL || 'http://localhost:8001';
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    // 添加公司 ID
    if (user?.user_metadata?.company_id) {
      headers['X-Company-ID'] = user.user_metadata.company_id;
    }
    
    return headers;
  }

  /**
   * 获取所有数据连接
   */
  async listConnections(): Promise<DataConnection[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/connectors/connections/`, {
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to list connections: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error listing connections:', error);
      throw error;
    }
  }

  /**
   * 获取单个连接详情
   */
  async getConnection(connectionId: string): Promise<DataConnection> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/connectors/connections/${connectionId}`,
        {
          headers: await this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get connection: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error getting connection:', error);
      throw error;
    }
  }

  /**
   * 创建新连接
   */
  async createConnection(
    name: string,
    type: string,
    config: Record<string, any> = {}
  ): Promise<DataConnection> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/connectors/connections/`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ name, type, config }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create connection: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error creating connection:', error);
      throw error;
    }
  }

  /**
   * 测试连接
   */
  async testConnection(request: ConnectionTestRequest): Promise<ConnectionTestResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/connectors/connections/test`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to test connection: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error testing connection:', error);
      throw error;
    }
  }

  /**
   * 同步连接数据
   */
  async syncConnection(connectionId: string): Promise<DataConnection> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/connectors/connections/${connectionId}/sync`,
        {
          method: 'POST',
          headers: await this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to sync connection: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error syncing connection:', error);
      throw error;
    }
  }

  /**
   * 更新连接
   */
  async updateConnection(
    connectionId: string,
    updates: Record<string, any>
  ): Promise<DataConnection> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/connectors/connections/${connectionId}`,
        {
          method: 'PUT',
          headers: await this.getAuthHeaders(),
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update connection: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error updating connection:', error);
      throw error;
    }
  }

  /**
   * 删除连接
   */
  async deleteConnection(connectionId: string): Promise<{ status: string; message: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/connectors/connections/${connectionId}`,
        {
          method: 'DELETE',
          headers: await this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete connection: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error deleting connection:', error);
      throw error;
    }
  }

  /**
   * 上传 Excel 文件
   */
  async uploadExcel(file: File, connectionName?: string): Promise<ExcelUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (connectionName) {
        formData.append('connection_name', connectionName);
      }

      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      if (user?.user_metadata?.company_id) {
        headers['X-Company-ID'] = user.user_metadata.company_id;
      }

      const response = await fetch(`${this.baseUrl}/api/v1/connectors/upload/excel`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `Upload failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error uploading Excel:', error);
      throw error;
    }
  }

  /**
   * 检查连接健康状态
   */
  async checkHealth(): Promise<{
    status: string;
    total_connections: number;
    connected: number;
    disconnected: number;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/connectors/connections/health/check`,
        {
          headers: await this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const dataConnectorService = new DataConnectorService();

export default dataConnectorService;

