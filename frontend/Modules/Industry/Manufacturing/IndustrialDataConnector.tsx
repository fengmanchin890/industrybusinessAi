import React, { useState, useEffect } from 'react';
import { ModuleContext } from '../../ModuleSDK';
import { Database, Upload, Download, Settings, Activity, AlertTriangle, CheckCircle, Plus, X, FileText, Server, Cpu, Monitor } from 'lucide-react';
import { dataConnectorService, DataConnection as APIDataConnection } from '../../../lib/data-connector-service';

interface DataConnection {
  id: string;
  name: string;
  type: 'PLC' | 'MES' | 'ERP' | 'Excel' | 'Database';
  status: 'connected' | 'disconnected' | 'error' | 'testing';
  lastSync: string;
  recordCount: number;
  error_message?: string;
}

interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'alert';
  data: any;
}

export function IndustrialDataConnector({ context }: { context: ModuleContext }) {
  const [connections, setConnections] = useState<DataConnection[]>([
    {
      id: '1',
      name: 'PLC 生產線 A',
      type: 'PLC',
      status: 'connected',
      lastSync: '2025-01-16 14:30:25',
      recordCount: 15420
    },
    {
      id: '2',
      name: 'MES 系統',
      type: 'MES',
      status: 'connected',
      lastSync: '2025-01-16 14:29:15',
      recordCount: 8930
    },
    {
      id: '3',
      name: 'Excel 報表',
      type: 'Excel',
      status: 'error',
      lastSync: '2025-01-16 13:45:10',
      recordCount: 0
    }
  ]);

  const [widgets, setWidgets] = useState<DashboardWidget[]>([
    {
      id: '1',
      title: '生產效率 (OEE)',
      type: 'metric',
      data: { value: 85.6, unit: '%', trend: 'up' }
    },
    {
      id: '2',
      title: '設備運行時間',
      type: 'chart',
      data: { type: 'line', points: [95, 87, 92, 88, 96, 91, 89] }
    },
    {
      id: '3',
      title: '品質檢測率',
      type: 'metric',
      data: { value: 98.2, unit: '%', trend: 'stable' }
    }
  ]);

  const [isConnecting, setIsConnecting] = useState(false);
  const [showAddConnectionModal, setShowAddConnectionModal] = useState(false);
  const [showExcelUploadModal, setShowExcelUploadModal] = useState(false);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [showPLCModal, setShowPLCModal] = useState(false);
  const [showRealtimeModal, setShowRealtimeModal] = useState(false);
  const [realtimeData, setRealtimeData] = useState<any>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const apiConnections = await dataConnectorService.listConnections();
      const formattedConnections: DataConnection[] = apiConnections.map(conn => ({
        id: conn.id,
        name: conn.name,
        type: conn.type as any,
        status: conn.status as any,
        lastSync: conn.last_sync,
        recordCount: conn.record_count,
        error_message: conn.error_message
      }));
      setConnections(formattedConnections);
    } catch (error) {
      console.warn('Data Connector service not available, using mock data:', error);
      // 使用模拟数据作为降级方案
      setConnections([
        {
          id: '1',
          name: 'PLC 生產線 A',
          type: 'PLC',
          status: 'connected',
          lastSync: '2025-01-16 14:30:25',
          recordCount: 15420
        },
        {
          id: '2',
          name: 'MES 系統',
          type: 'MES',
          status: 'connected',
          lastSync: '2025-01-16 14:29:15',
          recordCount: 8930
        },
        {
          id: '3',
          name: 'Excel 報表',
          type: 'Excel',
          status: 'error',
          lastSync: '2025-01-16 13:45:10',
          recordCount: 0,
          error_message: '找不到指定的 Excel 文件'
        }
      ]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return '已連接';
      case 'error':
        return '連接錯誤';
      default:
        return '未連接';
    }
  };

  const handleConnect = async (connectionId: string) => {
    setIsConnecting(true);
    
    try {
      const updated = await dataConnectorService.syncConnection(connectionId);
      
      // 更新本地状态
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId 
          ? {
              ...conn,
              status: updated.status as any,
              lastSync: updated.last_sync,
              recordCount: updated.record_count,
              error_message: updated.error_message
            }
          : conn
      ));
    } catch (error) {
      console.warn('Service not available, using mock sync:', error);
      // 模拟连接过程
      setTimeout(() => {
        setConnections(prev => prev.map(conn => 
          conn.id === connectionId 
            ? { 
                ...conn, 
                status: 'connected', 
                lastSync: new Date().toLocaleString('zh-TW'),
                recordCount: conn.recordCount > 0 ? conn.recordCount + 100 : 1000,
                error_message: undefined
              }
            : conn
        ));
        setIsConnecting(false);
      }, 1000);
      return;
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = (connectionId: string) => {
    setConnections(prev => prev.map(conn => 
      conn.id === connectionId 
        ? { ...conn, status: 'disconnected' }
        : conn
    ));
  };

  // 新增連接功能
  const handleAddConnection = async (connectionData: any) => {
    setIsConnecting(true);
    
    try {
      await dataConnectorService.createConnection(
        connectionData.name || '新連接',
        connectionData.type || 'PLC',
        {}
      );
      
      // 重新加载连接列表
      await loadConnections();
      setShowAddConnectionModal(false);
    } catch (error) {
      console.warn('Service not available, using mock creation:', error);
      // 模拟创建连接
      const newConnection: DataConnection = {
        id: Date.now().toString(),
        name: connectionData.name || '新連接',
        type: connectionData.type || 'PLC',
        status: 'connected',
        lastSync: new Date().toLocaleString('zh-TW'),
        recordCount: Math.floor(Math.random() * 10000)
      };
      setConnections(prev => [...prev, newConnection]);
      setShowAddConnectionModal(false);
    } finally {
      setIsConnecting(false);
    }
  };

  // Excel 上傳功能
  const handleExcelUpload = async (file: File) => {
    console.log('上傳 Excel 文件:', file.name);
    setIsConnecting(true);
    
    try {
      const result = await dataConnectorService.uploadExcel(file);
      
      // 重新加载连接列表
      await loadConnections();
      
      setShowExcelUploadModal(false);
      alert(`成功上传！\n文件: ${result.filename}\n记录数: ${result.total_rows}`);
    } catch (error) {
      console.warn('Service not available, using mock upload:', error);
      // 模拟上传处理
      setTimeout(() => {
        setConnections(prev => prev.map(conn => 
          conn.type === 'Excel' 
            ? { 
                ...conn, 
                status: 'connected', 
                recordCount: 5000, 
                lastSync: new Date().toLocaleString('zh-TW'),
                error_message: undefined
              }
            : conn
        ));
        setShowExcelUploadModal(false);
        alert(`模拟上传成功！\n文件: ${file.name}\n记录数: 5000\n\n注意：这是模拟数据，请启动后端服务以使用真实功能`);
        setIsConnecting(false);
      }, 1500);
      return;
    } finally {
      setIsConnecting(false);
    }
  };

  // 數據庫連接功能
  const handleDatabaseConnect = (dbConfig: any) => {
    console.log('連接數據庫:', dbConfig);
    const newConnection: DataConnection = {
      id: Date.now().toString(),
      name: dbConfig.name || 'MySQL 數據庫',
      type: 'Database',
      status: 'connected',
      lastSync: new Date().toLocaleString('zh-TW'),
      recordCount: Math.floor(Math.random() * 50000)
    };
    setConnections(prev => [...prev, newConnection]);
    setShowDatabaseModal(false);
  };

  // PLC 配置功能
  const handlePLCConfigure = (plcConfig: any) => {
    console.log('配置 PLC:', plcConfig);
    const newConnection: DataConnection = {
      id: Date.now().toString(),
      name: plcConfig.name || 'PLC 控制器',
      type: 'PLC',
      status: 'connected',
      lastSync: new Date().toLocaleString('zh-TW'),
      recordCount: Math.floor(Math.random() * 20000)
    };
    setConnections(prev => [...prev, newConnection]);
    setShowPLCModal(false);
  };

  // 實時監控功能
  const handleRealtimeMonitor = () => {
    setShowRealtimeModal(true);
    // 模擬實時數據更新
    const interval = setInterval(() => {
      setRealtimeData({
        oee: (85 + Math.random() * 10).toFixed(1),
        temperature: (45 + Math.random() * 10).toFixed(1),
        pressure: (2.5 + Math.random() * 0.5).toFixed(2),
        speed: (1200 + Math.random() * 200).toFixed(0),
        timestamp: new Date().toLocaleTimeString('zh-TW')
      });
    }, 1000);

    // 清理定時器
    setTimeout(() => {
      clearInterval(interval);
    }, 30000);
  };

  return (
    <div className="space-y-6">
      {/* 標題和狀態 */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">工業數據連接器</h2>
            <p className="text-blue-100 mt-1">串接 PLC、MES、ERP 等工業數據源，自動生成儀表板與預測報表</p>
            <div className="mt-2 text-sm text-blue-200">
              💡 提示：目前使用模拟数据。要使用完整功能，请启动后端服务：
              <code className="ml-1 bg-blue-600 px-2 py-0.5 rounded">scripts\start-ai-services.bat</code>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{connections.filter(c => c.status === 'connected').length}</div>
            <div className="text-blue-100">活躍連接</div>
          </div>
        </div>
      </div>

      {/* 數據連接狀態 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">數據連接狀態</h3>
          <button 
            onClick={() => setShowAddConnectionModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增連接
          </button>
        </div>

        <div className="space-y-3">
          {connections.map((connection) => (
            <div key={connection.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-4">
                {getStatusIcon(connection.status)}
                <div>
                  <div className="font-medium text-slate-900">{connection.name}</div>
                  <div className="text-sm text-slate-600">
                    {connection.type} • {connection.recordCount.toLocaleString()} 筆記錄 • 
                    最後同步: {connection.lastSync}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  connection.status === 'connected' 
                    ? 'bg-green-100 text-green-700'
                    : connection.status === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {getStatusText(connection.status)}
                </span>
                {connection.status === 'connected' ? (
                  <button 
                    onClick={() => handleDisconnect(connection.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    onClick={() => handleConnect(connection.id)}
                    disabled={isConnecting}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                  >
                    <Activity className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 儀表板預覽 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">實時儀表板</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            匯出報表
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {widgets.map((widget) => (
            <div key={widget.id} className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-slate-900">{widget.title}</h4>
                <div className={`w-2 h-2 rounded-full ${
                  widget.data.trend === 'up' ? 'bg-green-500' : 
                  widget.data.trend === 'down' ? 'bg-red-500' : 'bg-blue-500'
                }`}></div>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {widget.data.value}
                <span className="text-sm font-normal text-slate-600 ml-1">{widget.data.unit}</span>
              </div>
              {widget.type === 'chart' && (
                <div className="mt-2 text-xs text-slate-500">
                  過去 7 天趨勢
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">快速操作</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => setShowExcelUploadModal(true)}
            className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <FileText className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">上傳 Excel</span>
          </button>
          <button 
            onClick={() => setShowDatabaseModal(true)}
            className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Server className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium text-green-900">連接數據庫</span>
          </button>
          <button 
            onClick={() => setShowPLCModal(true)}
            className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <Cpu className="w-6 h-6 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">配置 PLC</span>
          </button>
          <button 
            onClick={handleRealtimeMonitor}
            className="flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <Monitor className="w-6 h-6 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">實時監控</span>
          </button>
        </div>
      </div>

      {/* 新增連接模態框 */}
      {showAddConnectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">新增數據連接</h3>
              <button onClick={() => setShowAddConnectionModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">連接名稱</label>
                <input 
                  type="text" 
                  placeholder="輸入連接名稱"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">連接類型</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                  <option value="PLC">PLC</option>
                  <option value="MES">MES</option>
                  <option value="ERP">ERP</option>
                  <option value="Database">Database</option>
                  <option value="Excel">Excel</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button 
                  onClick={() => setShowAddConnectionModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
                >
                  取消
                </button>
                <button 
                  onClick={() => handleAddConnection({ name: '新連接', type: 'PLC' })}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  新增
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel 上傳模態框 */}
      {showExcelUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">上傳 Excel 文件</h3>
              <button onClick={() => setShowExcelUploadModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600">拖拽 Excel 文件到這裡或點擊選擇</p>
                <input 
                  type="file" 
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleExcelUpload(file);
                  }}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button 
                  onClick={() => setShowExcelUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
                >
                  取消
                </button>
                <button 
                  onClick={() => handleExcelUpload(new File([''], 'demo.xlsx'))}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  開始上傳
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 數據庫連接模態框 */}
      {showDatabaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">連接數據庫</h3>
              <button onClick={() => setShowDatabaseModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">數據庫類型</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="oracle">Oracle</option>
                  <option value="sqlserver">SQL Server</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">主機地址</label>
                <input 
                  type="text" 
                  placeholder="192.168.1.100"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">端口</label>
                <input 
                  type="number" 
                  placeholder="3306"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">數據庫名稱</label>
                <input 
                  type="text" 
                  placeholder="production_db"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button 
                  onClick={() => setShowDatabaseModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
                >
                  取消
                </button>
                <button 
                  onClick={() => handleDatabaseConnect({ name: 'MySQL 數據庫' })}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  測試連接
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLC 配置模態框 */}
      {showPLCModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">配置 PLC</h3>
              <button onClick={() => setShowPLCModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">PLC 型號</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                  <option value="siemens">Siemens S7</option>
                  <option value="mitsubishi">Mitsubishi FX</option>
                  <option value="omron">Omron CP</option>
                  <option value="allen-bradley">Allen-Bradley</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">IP 地址</label>
                <input 
                  type="text" 
                  placeholder="192.168.1.50"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">端口</label>
                <input 
                  type="number" 
                  placeholder="102"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">機架/插槽</label>
                <input 
                  type="text" 
                  placeholder="0/1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button 
                  onClick={() => setShowPLCModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
                >
                  取消
                </button>
                <button 
                  onClick={() => handlePLCConfigure({ name: 'PLC 控制器' })}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg"
                >
                  保存配置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 實時監控模態框 */}
      {showRealtimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">實時監控</h3>
              <button onClick={() => setShowRealtimeModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {realtimeData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{realtimeData.oee}%</div>
                    <div className="text-sm text-blue-800">OEE</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{realtimeData.temperature}°C</div>
                    <div className="text-sm text-green-800">溫度</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{realtimeData.pressure} bar</div>
                    <div className="text-sm text-orange-800">壓力</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{realtimeData.speed} RPM</div>
                    <div className="text-sm text-purple-800">轉速</div>
                  </div>
                </div>
                <div className="text-center text-sm text-slate-600">
                  最後更新: {realtimeData.timestamp}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
