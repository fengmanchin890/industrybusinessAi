import { useEffect, useState } from 'react';
import { useAuth } from '../../../Contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface Alert {
  id: string;
  severity: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  module: {
    name: string;
  } | null;
}

export function AlertsView() {
  const { company } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadAlerts();
  }, [company?.id]);

  const loadAlerts = async () => {
    if (!company?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          id,
          severity,
          title,
          message,
          is_read,
          created_at,
          module:ai_modules(name)
        `)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAlerts(data as any || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;

      await loadAlerts();
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!company?.id) return;

    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('company_id', company.id)
        .eq('is_read', false);

      if (error) throw error;

      await loadAlerts();
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const filteredAlerts = filter === 'unread'
    ? alerts.filter((a) => !a.is_read)
    : alerts;

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">提醒</h2>
          <p className="text-slate-600 mt-1">
            監控 AI 模組發出的重要通知
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <CheckCircle className="w-5 h-5" />
            全部標記為已讀
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          全部提醒 ({alerts.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          未讀 ({unreadCount})
        </button>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-slate-600">
            {filter === 'unread' ? '沒有未讀提醒！' : '尚無提醒'}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            AI 模組的提醒將顯示在此處
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-xl border p-4 transition-all ${
                alert.is_read ? 'border-slate-200' : getSeverityColor(alert.severity)
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  {getSeverityIcon(alert.severity)}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {alert.title}
                      </h3>
                      <p className="text-sm text-slate-700 mb-2">{alert.message}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        {alert.module && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded">
                            {alert.module.name}
                          </span>
                        )}
                        <span className="capitalize">{alert.severity}</span>
                        <span>
                          {new Date(alert.created_at).toLocaleDateString()} at{' '}
                          {new Date(alert.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {!alert.is_read && (
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        標記為已讀
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
