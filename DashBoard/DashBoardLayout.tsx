import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '../Contexts/AuthContext';
import {
  LayoutDashboard,
  Store,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  Building2,
  ChevronDown
} from 'lucide-react';
import { MobileNav } from '../src/components/Mobile/MobileNav';

interface DashboardLayoutProps {
  children: ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
}

const navigation = [
  { id: 'overview', label: '總覽', icon: 'LayoutDashboard' },
  { id: 'modules', label: 'AI 模組', icon: 'Store' },
  { id: 'reports', label: '報告', icon: 'FileText' },
  { id: 'alerts', label: '提醒', icon: 'Bell' },
  { id: 'settings', label: '設定', icon: 'Settings' },
];

export function DashboardLayout({ children, activeView, onViewChange }: DashboardLayoutProps) {
  const { profile, company, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // 關閉菜單當視窗大小改變時（可選）
  // 注释掉，因为现在所有设备都使用汉堡菜单
  // useEffect(() => {
  //   const handleResize = () => {
  //     if (window.innerWidth >= 1024) {
  //       setMobileMenuOpen(false);
  //     }
  //   };
  //   window.addEventListener('resize', handleResize);
  //   return () => window.removeEventListener('resize', handleResize);
  // }, []);

  // 點擊外部關閉用戶菜單
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [userMenuOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleMobileViewChange = (view: string) => {
    onViewChange(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 頂部導航欄 */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 backdrop-blur-sm bg-white/95">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* 漢堡菜單按鈕 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200 active:scale-95"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6 text-slate-700" />
            </button>

            <div className="flex items-center gap-3 animate-slide-in">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center shadow-md">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-900">AI Business Platform</h1>
                <p className="text-xs text-slate-600">{company?.name}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 訂閱方案徽章 */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700 capitalize">
                {company?.subscription_tier || 'Basic'}
              </span>
            </div>
            
            {/* 用戶菜單 */}
            <div className="relative user-menu-container">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg transition-all duration-200 active:scale-95"
              >
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-slate-900">{profile?.full_name}</p>
                  <p className="text-xs text-slate-600 capitalize">{profile?.role}</p>
                </div>
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {profile?.full_name?.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 hidden md:block ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 animate-slide-up overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
                    <p className="text-sm font-bold text-slate-900">{profile?.full_name}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{profile?.email}</p>
                    <p className="text-xs text-slate-500 mt-1 capitalize">身份：{profile?.role}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    登出
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 使用改進的移動端導航組件 */}
      <MobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeView={activeView}
        onViewChange={handleMobileViewChange}
        menuItems={navigation}
        onLogout={handleSignOut}
        companyName={company?.name}
        companyIndustry={company?.industry}
      />

      {/* 主要內容 */}
      <main className="pt-16 min-h-screen">
        <div className="p-4 sm:p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
