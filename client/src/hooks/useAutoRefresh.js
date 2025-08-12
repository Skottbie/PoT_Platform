// src/hooks/useAutoRefresh.js - 自动定时刷新Hook
import { useEffect, useRef, useCallback } from 'react';

const useAutoRefresh = (refreshFn, options = {}) => {
  const {
    interval = 60000,           // 刷新间隔（毫秒）
    enabled = true,             // 是否启用自动刷新
    pauseOnHidden = true,       // 页面隐藏时暂停
    pauseOnOffline = true,      // 离线时暂停
    enableBatteryOptimization = true, // 电池优化
  } = options;

  const intervalRef = useRef(null);
  const isActiveRef = useRef(true);
  const refreshFnRef = useRef(refreshFn);

  // 更新刷新函数引用
  useEffect(() => {
    refreshFnRef.current = refreshFn;
  }, [refreshFn]);

  // 启动定时器
  const startTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (enabled && isActiveRef.current) {
      intervalRef.current = setInterval(() => {
        if (isActiveRef.current && refreshFnRef.current) {
          refreshFnRef.current();
        }
      }, interval);
    }
  }, [enabled, interval]);

  // 停止定时器
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 暂停/恢复刷新
  const pauseRefresh = useCallback(() => {
    isActiveRef.current = false;
    stopTimer();
  }, [stopTimer]);

  const resumeRefresh = useCallback(() => {
    isActiveRef.current = true;
    startTimer();
  }, [startTimer]);

  // 检查网络状态
  const handleNetworkChange = useCallback(() => {
    if (pauseOnOffline) {
      if (navigator.onLine) {
        resumeRefresh();
      } else {
        pauseRefresh();
      }
    }
  }, [pauseOnOffline, pauseRefresh, resumeRefresh]);

  // 检查页面可见性
  const handleVisibilityChange = useCallback(() => {
    if (pauseOnHidden) {
      if (document.hidden) {
        pauseRefresh();
      } else {
        // 页面重新可见时立即刷新一次，然后恢复定时刷新
        if (refreshFnRef.current) {
          refreshFnRef.current();
        }
        resumeRefresh();
      }
    }
  }, [pauseOnHidden, pauseRefresh, resumeRefresh]);

  // 电池状态优化
  const handleBatteryChange = useCallback((battery) => {
    if (enableBatteryOptimization && battery) {
      // 低电量时暂停自动刷新
      if (battery.level < 0.2 && !battery.charging) {
        pauseRefresh();
      } else if (battery.level > 0.3 || battery.charging) {
        resumeRefresh();
      }
    }
  }, [enableBatteryOptimization, pauseRefresh, resumeRefresh]);

  // 初始化和清理
  useEffect(() => {
    // 启动定时器
    startTimer();

    // 添加事件监听器
    if (pauseOnHidden) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    
    if (pauseOnOffline) {
      window.addEventListener('online', handleNetworkChange);
      window.addEventListener('offline', handleNetworkChange);
    }

    // 电池状态监听（如果支持）
    if (enableBatteryOptimization && 'getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        battery.addEventListener('levelchange', () => handleBatteryChange(battery));
        battery.addEventListener('chargingchange', () => handleBatteryChange(battery));
        // 初始检查
        handleBatteryChange(battery);
      }).catch(() => {
        // 电池API不支持，忽略
      });
    }

    return () => {
      stopTimer();
      
      if (pauseOnHidden) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      
      if (pauseOnOffline) {
        window.removeEventListener('online', handleNetworkChange);
        window.removeEventListener('offline', handleNetworkChange);
      }
    };
  }, [
    startTimer, 
    stopTimer, 
    handleVisibilityChange, 
    handleNetworkChange, 
    handleBatteryChange,
    pauseOnHidden,
    pauseOnOffline,
    enableBatteryOptimization
  ]);

  // 当配置变化时重新启动定时器
  useEffect(() => {
    startTimer();
  }, [enabled, interval, startTimer]);

  return {
    isActive: isActiveRef.current,
    pauseRefresh,
    resumeRefresh,
    manualRefresh: refreshFnRef.current,
  };
};

export default useAutoRefresh;