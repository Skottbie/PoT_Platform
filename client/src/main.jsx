import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { Toaster } from 'react-hot-toast';
import { trackPerformance } from './utils/performance';
import { initInputFocusManager } from './utils/deviceUtils';

// 生产环境性能监控
if (import.meta.env.PROD) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const timing = performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
      
      // 发送到你的API
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loadTime,
          domContentLoaded,
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch(() => {}); // 静默失败
      
      // 同时存储到localStorage供调试
      localStorage.setItem('perf_data', JSON.stringify({
        loadTime,
        domContentLoaded,
        timestamp: new Date().toISOString()
      }));
    }, 0);
  });
}

// === 暗色模式自动检测逻辑 ===
function applyDarkMode() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (prefersDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// 初次加载
applyDarkMode()

// 监听系统主题切换
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyDarkMode)

// 🎯 性能和设备检测初始化
trackPerformance();

// 🎯 移动端输入框聚焦管理初始化
document.addEventListener('DOMContentLoaded', () => {
  //initInputFocusManager();
});

// 🎯 移动端视口元标签动态调整
function adjustViewportMeta() {
  let viewportMeta = document.querySelector('meta[name="viewport"]');
  
  if (!viewportMeta) {
    viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    document.head.appendChild(viewportMeta);
  }
  
  // 基础视口设置
  let viewportContent = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
  
  // 检测是否为移动端
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  if (isMobile) {
    // 移动端：防止缩放和优化用户体验
    viewportContent += ', user-scalable=no, maximum-scale=1.0, minimum-scale=1.0';
    
    if (isIOS) {
      // iOS特殊处理：状态栏样式
      viewportContent += ', shrink-to-fit=no';
      
      // 添加苹果专用的meta标签
      const webAppCapable = document.createElement('meta');
      webAppCapable.name = 'apple-mobile-web-app-capable';
      webAppCapable.content = 'yes';
      document.head.appendChild(webAppCapable);
      
      const statusBarStyle = document.createElement('meta');
      statusBarStyle.name = 'apple-mobile-web-app-status-bar-style';
      statusBarStyle.content = 'black-translucent';
      document.head.appendChild(statusBarStyle);
    }
  }
  
  viewportMeta.content = viewportContent;
}

// 调整视口元标签
adjustViewportMeta();

// 🎯 移动端专用CSS变量设置
function setMobileCSSVariables() {
  const root = document.documentElement;
  
  // 设备检测
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // 设置CSS变量
  root.style.setProperty('--is-mobile', isMobile ? '1' : '0');
  root.style.setProperty('--is-tablet', isTablet ? '1' : '0');
  root.style.setProperty('--is-touch', isTouch ? '1' : '0');
  root.style.setProperty('--screen-width', `${window.innerWidth}px`);
  root.style.setProperty('--screen-height', `${window.innerHeight}px`);
  
  // 安全区域变量
  if (CSS.supports('padding: env(safe-area-inset-top)')) {
    root.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
    root.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
    root.style.setProperty('--safe-area-left', 'env(safe-area-inset-left)');
    root.style.setProperty('--safe-area-right', 'env(safe-area-inset-right)');
  } else {
    // 降级处理
    root.style.setProperty('--safe-area-top', '0px');
    root.style.setProperty('--safe-area-bottom', '0px');
    root.style.setProperty('--safe-area-left', '0px');
    root.style.setProperty('--safe-area-right', '0px');
  }
}

// 初始设置
setMobileCSSVariables();

// 监听窗口大小变化
window.addEventListener('resize', setMobileCSSVariables);
window.addEventListener('orientationchange', () => {
  // 延迟执行，等待方向改变完成
  setTimeout(setMobileCSSVariables, 100);
});

// 🎯 PWA支持检测
if ('serviceWorker' in navigator && import.meta.env.PROD) {
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <>
      <App />
      <Toaster 
        position="top-center"
        toastOptions={{
          // 移动端优化的Toast样式
          duration: 2000, // 缩短持续时间，避免与下拉刷新冲突
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '12px',
            padding: '12px 16px',
            maxWidth: '90vw',
            wordBreak: 'break-word',
            zIndex: 9999, // 确保在下拉刷新指示器之上
          },
          success: {
            duration: 1500, // 成功提示更短
            style: {
              background: '#10b981',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#10b981',
            },
          },
          error: {
            duration: 3000, // 错误提示稍长
            style: {
              background: '#ef4444',
            },
            iconTheme: {
              primary: '#ffffff', 
              secondary: '#ef4444',
            },
          },
          loading: {
            style: {
              background: '#6b7280',
            },
          },
        }}
        containerStyle={{
          top: 20,
          left: 20,
          right: 20,
          zIndex: 9999,
        }}
        // 🎯 移动端优化：避免与下拉刷新手势冲突
        gutter={8}
        reverseOrder={false}
      />
    </>
  </React.StrictMode>,
);