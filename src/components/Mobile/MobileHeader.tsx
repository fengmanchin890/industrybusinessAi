/**
 * 移动端顶部导航栏
 */

import { Menu, Bell, User } from 'lucide-react';

interface MobileHeaderProps {
  onMenuClick: () => void;
  companyName?: string;
  unreadAlerts?: number;
}

export function MobileHeader({ onMenuClick, companyName, unreadAlerts = 0 }: MobileHeaderProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-30">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h1 className="font-bold text-slate-900">AI Business Platform</h1>
          {companyName && (
            <p className="text-xs text-slate-600">{companyName}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            {unreadAlerts > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

