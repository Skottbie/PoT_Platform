// src/utils/deviceUtils.js - 设备检测和键盘适配工具

/**
 * 设备检测工具类
 */
export class DeviceDetector {
  static userAgent = navigator.userAgent;
  static platform = navigator.platform;
  static maxTouchPoints = navigator.maxTouchPoints;

  // 基础设备检测
  static get isIOS() {
    return /iPad|iPhone|iPod/.test(this.userAgent);
  }

  static get isAndroid() {
    return /Android/.test(this.userAgent);
  }

  static get isIPhone() {
    return /iPhone/.test(this.userAgent);
  }

  static get isIPad() {
    // 检测新版 iPad（iOS 13+）
    return /iPad/.test(this.userAgent) || 
           (this.platform === 'MacIntel' && this.maxTouchPoints > 1);
  }

  static get isTablet() {
    return this.isIPad || 
           (this.isAndroid && !/Mobile/.test(this.userAgent)) ||
           (screen.width >= 768 && this.maxTouchPoints > 0);
  }

  static get isMobile() {
    return this.isIPhone || 
           (this.isAndroid && /Mobile/.test(this.userAgent)) ||
           (screen.width < 768 && this.maxTouchPoints > 0);
  }

  static get isSafari() {
    return /Safari/.test(this.userAgent) && !/Chrome/.test(this.userAgent);
  }

  static get isIOSSafari() {
    return this.isIOS && this.isSafari;
  }

  // 屏幕方向检测
  static get isLandscape() {
    return screen.orientation ? 
           screen.orientation.angle === 90 || screen.orientation.angle === 270 :
           window.orientation === 90 || window.orientation === 270;
  }

  static get isPortrait() {
    return !this.isLandscape;
  }

  // 设备能力检测
  static get supportsVisualViewport() {
    return 'visualViewport' in window;
  }

  static get supportsVibration() {
    return 'vibrate' in navigator;
  }

  static get supportsTouch() {
    return 'ontouchstart' in window || this.maxTouchPoints > 0;
  }

  // 获取设备类型
  static getDeviceType() {
    if (this.isIPhone) return 'iphone';
    if (this.isIPad) return 'ipad';
    if (this.isTablet) return 'tablet';
    if (this.isMobile) return 'mobile';
    return 'desktop';
  }

  // 获取键盘高度阈值（根据设备调整）
  static getKeyboardThreshold() {
    const deviceType = this.getDeviceType();
    switch (deviceType) {
      case 'iphone':
        return this.isLandscape ? 120 : 200;
      case 'ipad':
        return this.isLandscape ? 200 : 300;
      case 'tablet':
        return this.isLandscape ? 180 : 250;
      case 'mobile':
        return this.isLandscape ? 100 : 180;
      default:
        return 50;
    }
  }
}

/**
 * 虚拟键盘管理器
 */
export class VirtualKeyboardManager {
  constructor() {
    this.listeners = new Set();
    this.state = {
      isOpen: false,
      height: 0,
      visualHeight: window.innerHeight,
      windowHeight: window.innerHeight,
      threshold: DeviceDetector.getKeyboardThreshold()
    };
    
    this.init();
  }

  init() {
    if (!DeviceDetector.supportsVisualViewport) {
      // 降级处理：使用 resize 事件
      this.initFallback();
      return;
    }

    // 现代浏览器：使用 Visual Viewport API
    this.initVisualViewport();
  }

  initVisualViewport() {
    const updateState = () => {
      const windowHeight = window.innerHeight;
      const visualHeight = window.visualViewport?.height || windowHeight;
      const keyboardHeight = Math.max(0, windowHeight - visualHeight);
      const isOpen = keyboardHeight > this.state.threshold;
      
      const newState = {
        isOpen,
        height: keyboardHeight,
        visualHeight,
        windowHeight,
        threshold: this.state.threshold
      };

      // 只在状态真正改变时触发回调
      if (this.hasStateChanged(newState)) {
        this.state = newState;
        this.notifyListeners();
      }
    };

    // 监听视觉视口变化
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateState);
      window.visualViewport.addEventListener('scroll', updateState);
    }

    // 监听窗口大小变化
    window.addEventListener('resize', updateState);
    
    // 监听屏幕方向变化
    if (screen.orientation) {
      screen.orientation.addEventListener('change', () => {
        // 方向改变时重新计算阈值
        this.state.threshold = DeviceDetector.getKeyboardThreshold();
        setTimeout(updateState, 100); // 延迟执行，等待布局稳定
      });
    }

    // 初始状态
    updateState();
  }

  initFallback() {
    // 对于不支持 Visual Viewport API 的浏览器
    let initialHeight = window.innerHeight;
    
    const updateState = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = initialHeight - currentHeight;
      const isOpen = heightDiff > this.state.threshold;
      
      const newState = {
        isOpen,
        height: Math.max(0, heightDiff),
        visualHeight: currentHeight,
        windowHeight: currentHeight,
        threshold: this.state.threshold
      };

      if (this.hasStateChanged(newState)) {
        this.state = newState;
        this.notifyListeners();
      }
    };

    window.addEventListener('resize', updateState);
    
    // 重置初始高度（处理方向变化）
    if (screen.orientation) {
      screen.orientation.addEventListener('change', () => {
        setTimeout(() => {
          initialHeight = window.innerHeight;
          this.state.threshold = DeviceDetector.getKeyboardThreshold();
          updateState();
        }, 100);
      });
    }

    updateState();
  }

  hasStateChanged(newState) {
    return this.state.isOpen !== newState.isOpen ||
           Math.abs(this.state.height - newState.height) > 10;
  }

  // 添加状态变化监听器
  addListener(callback) {
    this.listeners.add(callback);
    // 立即调用一次，提供当前状态
    callback(this.state);
    
    return () => this.listeners.delete(callback);
  }

  // 通知所有监听器
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('VirtualKeyboardManager listener error:', error);
      }
    });
  }

  // 获取当前状态
  getState() {
    return { ...this.state };
  }

  // 清理资源
  destroy() {
    this.listeners.clear();
    // 移除事件监听器（如果需要的话）
  }
}

/**
 * React Hook for virtual keyboard
 */
export function useVirtualKeyboard() {
  const [keyboardState, setKeyboardState] = React.useState({
    isOpen: false,
    height: 0,
    visualHeight: window.innerHeight,
    windowHeight: window.innerHeight,
    threshold: DeviceDetector.getKeyboardThreshold()
  });

  React.useEffect(() => {
    const manager = new VirtualKeyboardManager();
    const unsubscribe = manager.addListener(setKeyboardState);
    
    return () => {
      unsubscribe();
      manager.destroy();
    };
  }, []);

  return keyboardState;
}

/**
 * 输入框聚焦管理器
 */
export class InputFocusManager {
  constructor() {
    this.activeElement = null;
    this.scrollPosition = 0;
    this.originalBodyStyle = {};
    this.init();
  }

  init() {
    // 监听输入框聚焦
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('focusout', this.handleFocusOut.bind(this));
  }

  handleFocusIn(event) {
    const element = event.target;
    
    // 只处理输入类元素
    if (!this.isInputElement(element)) return;

    this.activeElement = element;
    this.scrollPosition = window.scrollY;

    // iOS Safari 特殊处理
    if (DeviceDetector.isIOSSafari) {
      this.handleIOSFocus(element);
    }

    // iPad 特殊处理
    if (DeviceDetector.isIPad) {
      this.handleIPadFocus(element);
    }

    // 通用移动端处理
    if (DeviceDetector.isMobile || DeviceDetector.isTablet) {
      this.handleMobileFocus(element);
    }
  }

  handleFocusOut(event) {
    if (this.activeElement && event.target === this.activeElement) {
      this.activeElement = null;
      this.restoreBodyStyle();
    }
  }

  isInputElement(element) {
    const inputTypes = ['INPUT', 'TEXTAREA', 'SELECT'];
    const editableElements = element.contentEditable === 'true';
    return inputTypes.includes(element.tagName) || editableElements;
  }

  handleIOSFocus(element) {
    // 防止页面缩放
    if (parseFloat(element.style.fontSize) < 16) {
      element.style.fontSize = '16px';
    }

    // 滚动到视图中
    requestAnimationFrame(() => {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    });
  }

  handleIPadFocus(element) {
    // iPad 横屏时的特殊处理
    if (DeviceDetector.isLandscape) {
      // 减少页面高度，为键盘留出空间
      this.saveBodyStyle();
      document.body.style.height = '60vh';
      document.body.style.overflow = 'hidden';
    }
  }

  handleMobileFocus(element) {
    // 移动端通用处理
    this.saveBodyStyle();
    
    // 防止背景滚动
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.style.width = '100%';
  }

  saveBodyStyle() {
    this.originalBodyStyle = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      height: document.body.style.height,
      overflow: document.body.style.overflow
    };
  }

  restoreBodyStyle() {
    Object.keys(this.originalBodyStyle).forEach(key => {
      document.body.style[key] = this.originalBodyStyle[key];
    });

    // 恢复滚动位置
    if (this.scrollPosition > 0) {
      window.scrollTo(0, this.scrollPosition);
    }
  }
}

// 全局实例
let inputFocusManager = null;

/**
 * 初始化输入框聚焦管理
 */
export function initInputFocusManager() {
  if (!inputFocusManager && (DeviceDetector.isMobile || DeviceDetector.isTablet)) {
    inputFocusManager = new InputFocusManager();
  }
  return inputFocusManager;
}

/**
 * 触觉反馈工具
 */
export class HapticFeedback {
  static vibrate(pattern = 10) {
    if (DeviceDetector.supportsVibration) {
      navigator.vibrate(pattern);
    }
  }

  static light() {
    this.vibrate(10);
  }

  static medium() {
    this.vibrate(20);
  }

  static heavy() {
    this.vibrate([30, 10, 30]);
  }

  static success() {
    this.vibrate([10, 5, 10]);
  }

  static error() {
    this.vibrate([50, 25, 50]);
  }
  
  static warning() {
    // 为警告提供一个适中的震动模式，介于medium和heavy之间
    this.vibrate([25, 10, 25]);
  }
}

export default {
  DeviceDetector,
  VirtualKeyboardManager,
  useVirtualKeyboard,
  InputFocusManager,
  initInputFocusManager,
  HapticFeedback
};