/**
 * 移动端底部标签栏
 */

import * as Icons from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon: string;
}

interface MobileBottomTabProps {
  activeView: string;
  onViewChange: (view: string) => void;
  tabs: TabItem[];
}

export function MobileBottomTab({ activeView, onViewChange, tabs }: MobileBottomTabProps) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(tab => {
          const Icon = (Icons as any)[tab.icon] || Icons.Box;
          const isActive = activeView === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                isActive
                  ? 'text-blue-600'
                  : 'text-slate-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-xs font-medium ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

