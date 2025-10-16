import React, { useEffect, useState } from 'react';
import { useAuth } from '../Contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { FileText, Download, Calendar, Filter } from 'lucide-react';

interface Report {
  id: string;
  title: string;
  content: string;
  report_type: string;
  created_at: string;
  created_by: string | null;
  module: {
    name: string;
  } | null;
  creator: {
    full_name: string;
  } | null;
}

export function ReportsView() {
  const { company } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    loadReports();
  }, [company?.id]);

  const loadReports = async () => {
    if (!company?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          title,
          content,
          report_type,
          created_at,
          created_by,
          module:ai_modules(name),
          creator:users(full_name)
        `)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReports(data as any || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { value: 'all', label: '全部' },
    { value: 'daily', label: '每日' },
    { value: 'weekly', label: '每週' },
    { value: 'monthly', label: '每月' },
    { value: 'alert', label: '警示' },
    { value: 'custom', label: '自訂' },
    { value: 'marketing', label: '行銷' }
  ];

  const filteredReports = selectedType === 'all'
    ? reports
    : reports.filter((r) => r.report_type === selectedType);

  const buildWeekly = async () => {
    if (!company?.id) return;
    setBuilding(true);
    try {
      // 取近7天銷售彙整
      const { data: rows } = await supabase
        .from('sales_transactions')
        .select('sold_at, item_name, quantity')
        .eq('company_id', company.id)
        .gte('sold_at', new Date(Date.now()-6*24*3600*1000).toISOString().slice(0,10))
        .order('sold_at');

      const items: Record<string, number> = {};
      (rows||[]).forEach((r:any)=>{ items[r.item_name] = (items[r.item_name]||0)+Number(r.quantity||0); });
      const top = Object.entries(items).sort((a,b)=>b[1]-a[1]).slice(0,5);
      const lines = top.map(([name,qty])=>`- ${name}: ${qty}`);
      const content = `近7天熱銷 Top5\n${lines.join('\n')}\n\n總筆數：${rows?.length||0}`;

      await supabase.from('reports').insert({
        company_id: company.id,
        module_id: null,
        title: '進貨建議（週報）',
        content,
        report_type: 'weekly',
      });
      await loadReports();
      alert('已生成週報');
    } finally {
      setBuilding(false);
    }
  };

  const handleExport = (report: Report) => {
    const blob = new Blob([report.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">報告</h2>
        <p className="text-slate-600 mt-1">查看和管理 AI 生成的報告</p>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="w-5 h-5 text-slate-600" />
        <div className="flex gap-2 flex-wrap">
          {reportTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedType === type.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <button onClick={buildWeekly} disabled={building}
            className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm disabled:opacity-50">
            {building? '產生中…' : '建立週報'}
          </button>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">未找到報告</p>
          <p className="text-sm text-slate-500 mt-1">AI 模組生成的報告將顯示在此處</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedReport?.id === report.id
                    ? 'border-blue-600 shadow-md'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">{report.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded capitalize">
                        {report.report_type}
                      </span>
                      {report.module && (
                        <span>{report.module.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.created_at).toLocaleDateString()} at{' '}
                      {new Date(report.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            ))}
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start">
            {selectedReport ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {selectedReport.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="bg-slate-100 px-2 py-1 rounded capitalize">
                        {selectedReport.report_type}
                      </span>
                      <span>
                        {new Date(selectedReport.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExport(selectedReport)}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    title="匯出報告"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans">
                      {selectedReport.content}
                    </pre>
                  </div>
                </div>

                {selectedReport.creator && (
                  <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-600">
                    建立者：{selectedReport.creator.full_name}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">選擇報告以查看詳情</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
