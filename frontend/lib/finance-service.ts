/**
 * 财务服务客户端
 * Finance Service Client
 */
import { supabase } from './supabase';

// ==================== 数据类型定义 ====================

export interface FinancialReport {
  id: string;
  company_id: string;
  report_type: 'income_statement' | 'balance_sheet' | 'cash_flow' | 'custom';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  period_start: string;
  period_end: string;
  status: 'generating' | 'completed' | 'failed';
  data: Record<string, any>;
  summary?: Record<string, any>;
  generated_at: string;
  generated_by: string;
  revenue?: number;
  expenses?: number;
  profit?: number;
  assets?: number;
  liabilities?: number;
  equity?: number;
}

export interface CostAnalysisResult {
  period_start: string;
  period_end: string;
  total_cost: number;
  cost_by_category: Record<string, number>;
  cost_by_period: Record<string, number>;
  trends: Record<string, any>;
  insights: string[];
  top_cost_drivers: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export interface CostPredictionResult {
  predictions: Array<{
    period: string;
    predicted_cost: number;
    confidence_low: number;
    confidence_high: number;
    confidence: number;
  }>;
  model_used: string;
  accuracy_metrics: Record<string, number>;
  confidence_level: number;
  insights: string[];
  recommendations: string[];
}

export interface ROICalculationResult {
  project_id?: string;
  roi: number;
  roi_ratio: number;
  npv: number;
  irr?: number;
  payback_period?: number;
  profitability_index: number;
  risk_assessment: Record<string, any>;
}

export interface FinancialAnomaly {
  id: string;
  company_id: string;
  detected_at: string;
  date: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'investigating' | 'resolved' | 'false_positive';
  metric_name: string;
  expected_value: number;
  actual_value: number;
  deviation_percentage: number;
  confidence_score: number;
  description: string;
  potential_causes: string[];
  recommended_actions: string[];
}

// ==================== 服务类 ====================

export class FinanceService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_FINANCE_SERVICE_URL || 'http://localhost:8002';
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
    };
  }

  // ==================== 财务报表 ====================

  async generateReport(request: {
    report_type: string;
    period: string;
    period_start: string;
    period_end: string;
    company_id?: string;
  }): Promise<FinancialReport> {
    const response = await fetch(`${this.baseUrl}/api/v1/reports/generate`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Failed to generate report: ${response.statusText}`);
    }

    return response.json();
  }

  async getReport(reportId: string): Promise<FinancialReport> {
    const response = await fetch(`${this.baseUrl}/api/v1/reports/${reportId}`, {
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch report: ${response.statusText}`);
    }

    return response.json();
  }

  async listReports(companyId?: string, reportType?: string): Promise<FinancialReport[]> {
    const params = new URLSearchParams();
    if (companyId) params.append('company_id', companyId);
    if (reportType) params.append('report_type', reportType);

    const response = await fetch(
      `${this.baseUrl}/api/v1/reports/?${params.toString()}`,
      { headers: await this.getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to list reports: ${response.statusText}`);
    }

    return response.json();
  }

  async exportReport(reportId: string, format: 'excel' | 'pdf' | 'json' | 'csv'): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/reports/export`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ report_id: reportId, format })
    });

    if (!response.ok) {
      throw new Error(`Failed to export report: ${response.statusText}`);
    }

    return response.json();
  }

  // ==================== 成本分析 ====================

  async analyzeCosts(request: {
    start_date: string;
    end_date: string;
    company_id?: string;
    categories?: string[];
  }): Promise<CostAnalysisResult> {
    const response = await fetch(`${this.baseUrl}/api/v1/cost-analysis/analyze`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Failed to analyze costs: ${response.statusText}`);
    }

    return response.json();
  }

  async predictCosts(request: {
    historical_start: string;
    historical_end: string;
    prediction_periods?: number;
    company_id?: string;
  }): Promise<CostPredictionResult> {
    const response = await fetch(`${this.baseUrl}/api/v1/cost-analysis/predict`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Failed to predict costs: ${response.statusText}`);
    }

    return response.json();
  }

  async getCostOptimizations(companyId?: string): Promise<any[]> {
    const params = companyId ? `?company_id=${companyId}` : '';
    const response = await fetch(
      `${this.baseUrl}/api/v1/cost-analysis/optimize${params}`,
      { headers: await this.getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to get cost optimizations: ${response.statusText}`);
    }

    return response.json();
  }

  // ==================== ROI 计算 ====================

  async calculateROI(request: {
    initial_investment: number;
    cash_flows: Array<{ period: number; amount: number; type: string }>;
    discount_rate?: number;
    project_duration: number;
    project_id?: string;
  }): Promise<ROICalculationResult> {
    const response = await fetch(`${this.baseUrl}/api/v1/roi/calculate`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Failed to calculate ROI: ${response.statusText}`);
    }

    return response.json();
  }

  async compareProjects(projectIds: string[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/roi/compare`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ project_ids: projectIds })
    });

    if (!response.ok) {
      throw new Error(`Failed to compare projects: ${response.statusText}`);
    }

    return response.json();
  }

  // ==================== 异常检测 ====================

  async detectAnomalies(request: {
    start_date: string;
    end_date: string;
    company_id?: string;
    metrics?: string[];
    sensitivity?: number;
  }): Promise<{
    period_start: string;
    period_end: string;
    total_anomalies: number;
    anomalies_by_severity: Record<string, number>;
    anomalies_by_type: Record<string, number>;
    anomalies: FinancialAnomaly[];
    insights: string[];
    recommendations: string[];
  }> {
    const response = await fetch(`${this.baseUrl}/api/v1/anomaly/detect`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Failed to detect anomalies: ${response.statusText}`);
    }

    return response.json();
  }

  async getAlerts(companyId?: string, severity?: string): Promise<FinancialAnomaly[]> {
    const params = new URLSearchParams();
    if (companyId) params.append('company_id', companyId);
    if (severity) params.append('severity', severity);

    const response = await fetch(
      `${this.baseUrl}/api/v1/anomaly/alerts?${params.toString()}`,
      { headers: await this.getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to get alerts: ${response.statusText}`);
    }

    return response.json();
  }

  // ==================== 健康检查 ====================

  async healthCheck(): Promise<{ status: string; service: string; version: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.json();
    } catch (error) {
      console.error('Finance service health check failed:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const financeService = new FinanceService();

