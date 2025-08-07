import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { Toaster } from 'react-hot-toast';
import { trackPerformance } from './utils/performance';


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

trackPerformance();


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <>
      <App />
      <Toaster position="top-center" />
    </>
    
  </React.StrictMode>,

);
