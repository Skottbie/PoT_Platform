// client/src/utils/performance.js - 新建文件
export const trackPerformance = () => {
  if (!window.performance || import.meta.env.DEV) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      const timing = performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
      
      // 发送到后端
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          loadTime,
          domContentLoaded,
          url: window.location.href,
          userAgent: navigator.userAgent.substring(0, 100) // 截断userAgent
        })
      }).catch(() => {}); // 静默失败
      
      // 同时记录到localStorage
      const perfData = {
        loadTime,
        domContentLoaded,
        timestamp: new Date().toISOString(),
        url: window.location.pathname
      };
      
      localStorage.setItem('perf_last', JSON.stringify(perfData));
      
      // 如果加载时间过长，显示提示
      if (loadTime > 3000) {
        console.warn('页面加载较慢:', loadTime + 'ms');
      }
    }, 100);
  });
};