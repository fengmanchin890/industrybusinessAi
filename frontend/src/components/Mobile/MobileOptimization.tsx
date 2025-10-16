/**
 * 行動端優化組件 - 提供更好的行動端體驗
 */

import React, { useState, useEffect } from 'react';
import { Menu, X, Smartphone, Wifi, WifiOff, Battery, Signal } from 'lucide-react';
import { PWAInstallPrompt, PWAStatusIndicator, PWAUpdatePrompt } from './PWAComponents';

interface MobileOptimizationProps {
  children: React.ReactNode;
}

export function MobileOptimization({ children }: MobileOptimizationProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // 檢測行動端
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // 檢測網路狀態
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBanner(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 檢測電池狀態
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }

    // 檢測 PWA 安裝狀態
    const checkPWAInstallation = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsPWAInstalled(true);
      } else {
        setIsPWAInstalled(false);
      }
    };

    checkPWAInstallation();
    window.addEventListener('resize', checkPWAInstallation);

    // 檢測安裝提示
    let deferredPrompt: any;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      setShowInstallPrompt(true);
    });

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('resize', checkPWAInstallation);
    };
  }, []);

  const installPWA = async () => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    const deferredPrompt = (window as any).deferredPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setShowInstallPrompt(false);
    }
  };

  return (
    <div className="mobile-optimization">
      {/* PWA 更新提示 */}
      <PWAUpdatePrompt />
      
      {/* PWA 狀態指示器 */}
      <PWAStatusIndicator />
      
      {/* 離線橫幅 */}
      {showOfflineBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 px-4">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm">您目前處於離線狀態，部分功能可能無法使用</span>
          </div>
        </div>
      )}

      {/* PWA 安裝提示 */}
      <PWAInstallPrompt />

      {/* 行動端狀態列 */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-black text-white text-xs py-1 px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>{new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-400" />
            )}
            {batteryLevel !== null && (
              <div className="flex items-center gap-1">
                <Battery className="w-3 h-3" />
                <span>{batteryLevel}%</span>
              </div>
            )}
            <Signal className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* 主要內容 */}
      <div className={isMobile ? 'pt-6' : ''}>
        {children}
      </div>

      {/* 行動端底部導航 */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200">
          <div className="flex justify-around py-2">
            <button className="flex flex-col items-center gap-1 p-2 text-blue-600">
              <div className="w-6 h-6 bg-blue-600 rounded"></div>
              <span className="text-xs">首頁</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-2 text-slate-600">
              <div className="w-6 h-6 bg-slate-300 rounded"></div>
              <span className="text-xs">模組</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-2 text-slate-600">
              <div className="w-6 h-6 bg-slate-300 rounded"></div>
              <span className="text-xs">報告</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-2 text-slate-600">
              <div className="w-6 h-6 bg-slate-300 rounded"></div>
              <span className="text-xs">設定</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 響應式網格組件
 */
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: number;
}

export function ResponsiveGrid({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4 
}: ResponsiveGridProps) {
  return (
    <div 
      className={`grid gap-${gap} grid-cols-${cols.mobile} md:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop}`}
    >
      {children}
    </div>
  );
}

/**
 * 行動端友好的卡片組件
 */
interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MobileCard({ children, className = '', onClick }: MobileCardProps) {
  return (
    <div 
      className={`bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow ${
        onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/**
 * 行動端優化的按鈕組件
 */
interface MobileButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function MobileButton({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  onClick,
  disabled = false,
  className = ''
}: MobileButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 active:scale-95';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-slate-200 text-slate-700 hover:bg-slate-300 active:bg-slate-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  const widthClasses = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

/**
 * 行動端優化的輸入框組件
 */
interface MobileInputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function MobileInput({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  disabled = false,
  error,
  className = ''
}: MobileInputProps) {
  return (
    <div className="w-full">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={`w-full px-4 py-3 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
        } ${disabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'} ${className}`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

/**
 * 行動端優化的模態框組件
 */
interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function MobileModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}: MobileModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full mx-4'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className={`w-full ${sizeClasses[size]} bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden`}>
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        )}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
