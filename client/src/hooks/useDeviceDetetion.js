// src/hooks/useDeviceDetection.js - React版本的设备检测Hooks
import { useState, useEffect, useCallback, useRef } from 'react';
import { DeviceDetector, VirtualKeyboardManager, HapticFeedback } from '../utils/deviceUtils';

/**
 * 设备检测 Hook
 */
export function useDeviceDetection() {
  const [deviceInfo, setDeviceInfo] = useState(() => ({
    isMobile: DeviceDetector.isMobile,
    isTablet: DeviceDetector.isTablet,
    isIPhone: DeviceDetector.isIPhone,
    isIPad: DeviceDetector.isIPad,
    isIOS: DeviceDetector.isIOS,
    isAndroid: DeviceDetector.isAndroid,
    isSafari: DeviceDetector.isSafari,
    isIOSSafari: DeviceDetector.isIOSSafari,
    isLandscape: DeviceDetector.isLandscape,
    isPortrait: DeviceDetector.isPortrait,
    deviceType: DeviceDetector.getDeviceType(),
    supportsTouch: DeviceDetector.supportsTouch,
    supportsVibration: DeviceDetector.supportsVibration,
    supportsVisualViewport: DeviceDetector.supportsVisualViewport,
  }));

  useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceInfo({
        isMobile: DeviceDetector.isMobile,
        isTablet: DeviceDetector.isTablet,
        isIPhone: DeviceDetector.isIPhone,
        isIPad: DeviceDetector.isIPad,
        isIOS: DeviceDetector.isIOS,
        isAndroid: DeviceDetector.isAndroid,
        isSafari: DeviceDetector.isSafari,
        isIOSSafari: DeviceDetector.isIOSSafari,
        isLandscape: DeviceDetector.isLandscape,
        isPortrait: DeviceDetector.isPortrait,
        deviceType: DeviceDetector.getDeviceType(),
        supportsTouch: DeviceDetector.supportsTouch,
        supportsVibration: DeviceDetector.supportsVibration,
        supportsVisualViewport: DeviceDetector.supportsVisualViewport,
      });
    };

    // 监听窗口大小变化
    window.addEventListener('resize', updateDeviceInfo);
    
    // 监听屏幕方向变化
    if (screen.orientation) {
      screen.orientation.addEventListener('change', updateDeviceInfo);
    } else {
      // 降级处理
      window.addEventListener('orientationchange', updateDeviceInfo);
    }

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', updateDeviceInfo);
      } else {
        window.removeEventListener('orientationchange', updateDeviceInfo);
      }
    };
  }, []);

  return deviceInfo;
}

/**
 * 虚拟键盘检测 Hook
 */
export function useVirtualKeyboard() {
  const [keyboardState, setKeyboardState] = useState({
    isOpen: false,
    height: 0,
    visualHeight: window.innerHeight,
    windowHeight: window.innerHeight,
    threshold: DeviceDetector.getKeyboardThreshold()
  });

  const managerRef = useRef(null);

  useEffect(() => {
    // 只在移动端启用键盘检测
    if (DeviceDetector.isMobile || DeviceDetector.isTablet) {
      managerRef.current = new VirtualKeyboardManager();
      const unsubscribe = managerRef.current.addListener(setKeyboardState);
      
      return () => {
        unsubscribe();
        managerRef.current?.destroy();
      };
    }
  }, []);

  return keyboardState;
}

/**
 * 触觉反馈 Hook
 */
export function useHapticFeedback() {
  const deviceInfo = useDeviceDetection();

  const vibrate = useCallback((pattern = 10) => {
    if (deviceInfo.supportsVibration) {
      HapticFeedback.vibrate(pattern);
    }
  }, [deviceInfo.supportsVibration]);

  const light = useCallback(() => {
    if (deviceInfo.supportsVibration) {
      HapticFeedback.light();
    }
  }, [deviceInfo.supportsVibration]);

  const medium = useCallback(() => {
    if (deviceInfo.supportsVibration) {
      HapticFeedback.medium();
    }
  }, [deviceInfo.supportsVibration]);

  const heavy = useCallback(() => {
    if (deviceInfo.supportsVibration) {
      HapticFeedback.heavy();
    }
  }, [deviceInfo.supportsVibration]);

  const success = useCallback(() => {
    if (deviceInfo.supportsVibration) {
      HapticFeedback.success();
    }
  }, [deviceInfo.supportsVibration]);

  const error = useCallback(() => {
    if (deviceInfo.supportsVibration) {
      HapticFeedback.error();
    }
  }, [deviceInfo.supportsVibration]);

  return {
    vibrate,
    light,
    medium,
    heavy,
    success,
    error,
    isSupported: deviceInfo.supportsVibration
  };
}

/**
 * 响应式断点 Hook
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState(() => {
    const width = window.innerWidth;
    if (width < 640) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1280) return 'lg';
    if (width < 1536) return 'xl';
    return '2xl';
  });

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      let newBreakpoint;
      
      if (width < 640) newBreakpoint = 'xs';
      else if (width < 768) newBreakpoint = 'sm';
      else if (width < 1024) newBreakpoint = 'md';
      else if (width < 1280) newBreakpoint = 'lg';
      else if (width < 1536) newBreakpoint = 'xl';
      else newBreakpoint = '2xl';

      if (newBreakpoint !== breakpoint) {
        setBreakpoint(newBreakpoint);
      }
    };

    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, [breakpoint]);

  return {
    breakpoint,
    isXs: breakpoint === 'xs',
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    is2Xl: breakpoint === '2xl',
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
  };
}

/**
 * 安全区域 Hook
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      const top = parseInt(computedStyle.getPropertyValue('--safe-area-top') || '0');
      const bottom = parseInt(computedStyle.getPropertyValue('--safe-area-bottom') || '0');
      const left = parseInt(computedStyle.getPropertyValue('--safe-area-left') || '0');
      const right = parseInt(computedStyle.getPropertyValue('--safe-area-right') || '0');

      setSafeArea({ top, bottom, left, right });
    };

    updateSafeArea();
    
    // 监听样式变化（如果支持的话）
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(updateSafeArea);
      observer.observe(document.documentElement);
      
      return () => observer.disconnect();
    }
  }, []);

  return safeArea;
}

/**
 * 屏幕方向 Hook
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState(() => ({
    angle: screen.orientation?.angle || window.orientation || 0,
    type: screen.orientation?.type || 'portrait-primary',
    isPortrait: DeviceDetector.isPortrait,
    isLandscape: DeviceDetector.isLandscape,
  }));

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation({
        angle: screen.orientation?.angle || window.orientation || 0,
        type: screen.orientation?.type || 'portrait-primary',
        isPortrait: DeviceDetector.isPortrait,
        isLandscape: DeviceDetector.isLandscape,
      });
    };

    if (screen.orientation) {
      screen.orientation.addEventListener('change', updateOrientation);
      return () => screen.orientation.removeEventListener('change', updateOrientation);
    } else {
      window.addEventListener('orientationchange', updateOrientation);
      return () => window.removeEventListener('orientationchange', updateOrientation);
    }
  }, []);

  return orientation;
}

/**
 * 网络状态 Hook
 */
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState(() => ({
    isOnline: navigator.onLine,
    connection: navigator.connection || null,
    effectiveType: navigator.connection?.effectiveType || 'unknown',
    downlink: navigator.connection?.downlink || 0,
    rtt: navigator.connection?.rtt || 0,
  }));

  useEffect(() => {
    const updateNetworkStatus = () => {
      setNetworkStatus({
        isOnline: navigator.onLine,
        connection: navigator.connection || null,
        effectiveType: navigator.connection?.effectiveType || 'unknown',
        downlink: navigator.connection?.downlink || 0,
        rtt: navigator.connection?.rtt || 0,
      });
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    if (navigator.connection) {
      navigator.connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return networkStatus;
}

/**
 * 综合设备状态 Hook
 */
export function useDeviceState() {
  const device = useDeviceDetection();
  const keyboard = useVirtualKeyboard();
  const haptic = useHapticFeedback();
  const breakpoint = useBreakpoint();
  const safeArea = useSafeArea();
  const orientation = useOrientation();
  const network = useNetworkStatus();

  return {
    device,
    keyboard,
    haptic,
    breakpoint,
    safeArea,
    orientation,
    network,
  };
}