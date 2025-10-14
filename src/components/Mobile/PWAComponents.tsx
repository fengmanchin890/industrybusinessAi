/**
 * PWA 安裝提示組件
 */

import React, { useState, useEffect } from 'react';
import { Smartphone, X, Download, Star } from 'lucide-react';

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export function PWAInstallPrompt({ onInstall, onDismiss }: PWAInstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 檢查是否已經安裝
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (isInstalled) {
      return;
    }

    // 監聽安裝提示事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 檢查是否已經拒絕過安裝
    const hasRejectedInstall = localStorage.getItem('pwa-install-rejected');
    if (hasRejectedInstall) {
      const rejectTime = parseInt(hasRejectedInstall);
      const daysSinceReject = (Date.now() - rejectTime) / (1000 * 60 * 60 * 24);
      
      // 7 天後再次顯示
      if (daysSinceReject < 7) {
        setShowPrompt(false);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA 安裝成功');
        onInstall?.();
      } else {
        console.log('PWA 安裝被拒絕');
        localStorage.setItem('pwa-install-rejected', Date.now().toString());
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('PWA 安裝失敗:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-rejected', Date.now().toString());
    onDismiss?.();
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-4 shadow-2xl animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-6 h-6" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">安裝 AI 商業平台</h3>
          <p className="text-sm opacity-90 mb-3">
            獲得更好的使用體驗，支援離線使用、推送通知等功能
          </p>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleInstall}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              立即安裝
            </button>
            
            <button
              onClick={handleDismiss}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* 功能特色 */}
      <div className="mt-3 pt-3 border-t border-white border-opacity-20">
        <div className="flex items-center gap-4 text-xs opacity-90">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            <span>離線使用</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            <span>快速啟動</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            <span>推送通知</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * PWA 狀態指示器
 */
export function PWAStatusIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // 檢查網路狀態
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 檢查是否為 PWA
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
      
      setIsPWA(isStandalone || (isIOS && isInStandaloneMode));
    };

    checkPWA();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isPWA) return null;

  return (
    <div className="fixed top-16 right-4 z-40">
      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
        isOnline 
          ? 'bg-green-100 text-green-700' 
          : 'bg-red-100 text-red-700'
      }`}>
        {isOnline ? '已連線' : '離線模式'}
      </div>
    </div>
  );
}

/**
 * PWA 更新提示
 */
export function PWAUpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setShowUpdatePrompt(true);
      });
    }
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 bg-blue-600 text-white rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold">有新版本可用</h3>
            <p className="text-sm opacity-90">點擊更新以獲得最新功能</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleUpdate}
            className="px-3 py-1 bg-white text-blue-600 rounded text-sm font-medium hover:bg-gray-100"
          >
            更新
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-1 text-white hover:bg-blue-700 rounded text-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
