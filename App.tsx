import React, { useState, Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { AuthProvider, useAuth } from './Contexts/AuthContext';
import { LoginForm } from './src/components/Auth/LoginForm';
import { RegisterForm } from './src/components/Auth/RegisterForm';
import { DashboardLayout } from './DashBoard/DashBoardLayout';
import { Overview } from './DashBoard/Overview';
import { ModulesView } from './Modules/ModuleView';
import { ReportsView } from './Reports/ReporsView';
import { AlertsView } from './src/components/Alerts/AlertsView';
import { SettingsView } from './Setting/Settingviews';
import { MobileOptimization } from './src/components/Mobile/MobileOptimization';
import { Building2, AlertTriangle, RefreshCw } from 'lucide-react';

// 错误边界组件
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-slide-up">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">出現錯誤</h2>
            <p className="text-slate-600 mb-6">
              抱歉，應用程式遇到了問題。請嘗試刷新頁面。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary inline-flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              刷新頁面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl mb-4 shadow-lg hover:scale-110 transition-transform duration-300">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            AI Business Platform
          </h1>
          <p className="text-slate-600">
            為台灣中小企業提供即插即用的 AI 解決方案
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                isLogin
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              登入
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                !isLogin
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              註冊
            </button>
          </div>

          <div className="animate-fade-in">
            {isLogin ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>

        <div className="mt-6 text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-sm text-slate-600">
            支援 8 大產業，AI 採用率低於 30%
          </p>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [activeView, setActiveView] = useState('overview');

  const renderView = () => {
    const viewComponents = {
      overview: <Overview />,
      modules: <ModulesView />,
      reports: <ReportsView />,
      alerts: <AlertsView />,
      settings: <SettingsView />,
    };

    return (
      <div className="animate-fade-in">
        {viewComponents[activeView as keyof typeof viewComponents] || <Overview />}
      </div>
    );
  };

  return (
    <DashboardLayout activeView={activeView} onViewChange={setActiveView}>
      {renderView()}
    </DashboardLayout>
  );
}

function AppContent() {
  const { user, loading, company, profile } = useAuth();

  console.log('🎨 AppContent render:', { 
    loading, 
    hasUser: !!user, 
    userId: user?.id,
    hasProfile: !!profile,
    hasCompany: !!company,
    companyId: company?.id
  });

  if (loading) {
    console.log('⏳ Showing loading screen');
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">載入中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('🔓 No user, showing login screen');
    return <AuthScreen />;
  }

  console.log('✅ User authenticated, showing dashboard');
  return <Dashboard />;
}

function App() {
  // 註冊 Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <MobileOptimization>
          <AppContent />
        </MobileOptimization>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
