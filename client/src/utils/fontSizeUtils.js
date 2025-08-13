// client/src/utils/fontSizeUtils.js - 设备自适应字号管理器

import { DeviceDetector } from './deviceUtils';
import React from 'react'

/**
 * AIGC 聊天字号管理器 - 设备自适应版
 */
export class FontSizeManager {
  // 设备自适应字号配置
  static FONT_SIZES = {
    // 手机端字号范围 (< 640px)
    mobile: {
      small: { size: 14, label: '小', value: 'small' },
      standard: { size: 16, label: '标准', value: 'standard' },
      large: { size: 18, label: '大', value: 'large' },
      xlarge: { size: 20, label: '特大', value: 'xlarge' }
    },
    // 平板端字号范围 (640px - 1024px)
    tablet: {
      standard: { size: 16, label: '标准', value: 'standard' },
      large: { size: 18, label: '大', value: 'large' },
      xlarge: { size: 20, label: '特大', value: 'xlarge' },
      xxlarge: { size: 22, label: '巨大', value: 'xxlarge' }
    },
    // 桌面端字号范围 (> 1024px)
    desktop: {
      standard: { size: 16, label: '标准', value: 'standard' },
      large: { size: 18, label: '大', value: 'large' },
      xlarge: { size: 20, label: '特大', value: 'xlarge' },
      xxlarge: { size: 22, label: '巨大', value: 'xxlarge' }
    }
  };

  static STORAGE_KEY = 'aigc_font_size_preference';

  /**
   * 获取当前设备类型
   */
  static getCurrentDeviceType() {
    const width = window.innerWidth;
    if (width < 640) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * 获取当前设备的字号配置
   */
  static getCurrentDeviceSizes() {
    const deviceType = this.getCurrentDeviceType();
    return this.FONT_SIZES[deviceType];
  }

  /**
   * 获取智能推荐字号
   */
  static getRecommendedSize() {
    const deviceType = this.getCurrentDeviceType();
    const deviceInfo = DeviceDetector;
    
    // 基于设备类型和特征智能推荐
    switch (deviceType) {
      case 'mobile':
        // 小屏手机推荐小字号，大屏手机推荐标准字号
        return window.innerWidth < 375 ? 'small' : 'standard';
      case 'tablet':
        // 平板推荐大字号，阅读体验更好
        return 'large';
      case 'desktop':
        // 桌面端推荐大字号
        return 'large';
      default:
        return 'standard';
    }
  }

  /**
   * 获取当前用户偏好字号
   */
  static getCurrentSize() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const currentDevice = this.getCurrentDeviceType();
        
        // 检查保存的字号在当前设备上是否可用
        const deviceSizes = this.getCurrentDeviceSizes();
        if (parsed.deviceType === currentDevice && deviceSizes[parsed.size]) {
          return parsed.size;
        }
      }
    } catch (error) {
      console.warn('无法读取字号偏好设置:', error);
    }
    
    // 返回智能推荐
    return this.getRecommendedSize();
  }

  /**
   * 保存用户字号偏好（包含设备信息）
   */
  static saveSize(sizeKey) {
    const deviceSizes = this.getCurrentDeviceSizes();
    if (!deviceSizes[sizeKey]) {
      console.warn('无效的字号选项:', sizeKey);
      return false;
    }

    try {
      const saveData = {
        size: sizeKey,
        deviceType: this.getCurrentDeviceType(),
        timestamp: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saveData));
      return true;
    } catch (error) {
      console.warn('无法保存字号偏好设置:', error);
      return false;
    }
  }

  /**
   * 获取字号配置
   */
  static getSizeConfig(sizeKey) {
    const deviceSizes = this.getCurrentDeviceSizes();
    return deviceSizes[sizeKey] || deviceSizes[this.getRecommendedSize()];
  }

  /**
   * 获取当前设备的所有字号选项
   */
  static getAllSizes() {
    return Object.values(this.getCurrentDeviceSizes());
  }

  /**
   * 生成CSS样式变量
   */
  static generateCSSVariables(sizeKey) {
    const config = this.getSizeConfig(sizeKey);
    const baseSize = config.size;
    const deviceType = this.getCurrentDeviceType();
    
    // 移动端行高稍微紧凑一些
    const lineHeight = deviceType === 'mobile' 
      ? (baseSize <= 16 ? '1.5' : '1.4')
      : (baseSize <= 16 ? '1.6' : '1.5');
    
    return {
      '--aigc-font-size-base': `${baseSize}px`,
      '--aigc-font-size-sm': `${Math.round(baseSize * 0.875)}px`,
      '--aigc-font-size-xs': `${Math.round(baseSize * 0.75)}px`,
      '--aigc-line-height': lineHeight,
      '--aigc-code-font-size': `${Math.round(baseSize * 0.9)}px`,
    };
  }

  /**
   * 应用字号到页面
   */
  static applySize(sizeKey) {
    const variables = this.generateCSSVariables(sizeKey);
    const root = document.documentElement;
    
    // 添加平滑过渡
    root.style.transition = 'font-size 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    Object.entries(variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // 移除过渡，避免影响其他动画
    setTimeout(() => {
      root.style.transition = '';
    }, 300);
  }

  /**
   * 重置为推荐字号
   */
  static resetToRecommended() {
    const recommended = this.getRecommendedSize();
    this.saveSize(recommended);
    this.applySize(recommended);
    return recommended;
  }

  /**
   * 处理设备变化（如横竖屏切换、窗口大小变化）
   */
  static handleDeviceChange() {
    const currentSize = this.getCurrentSize();
    // 重新应用字号，确保在新设备尺寸下的适配
    this.applySize(currentSize);
    return currentSize;
  }
}

/**
 * React Hook for font size management - 设备自适应版
 */
export function useFontSize() {
  const [currentSize, setCurrentSize] = React.useState(() => 
    FontSizeManager.getCurrentSize()
  );

  const [deviceType, setDeviceType] = React.useState(() =>
    FontSizeManager.getCurrentDeviceType()
  );

  // 🔧 添加强制更新机制，确保配置信息同步
  const [updateTrigger, setUpdateTrigger] = React.useState(0);

  const changeSize = React.useCallback((sizeKey) => {
    if (FontSizeManager.saveSize(sizeKey)) {
      FontSizeManager.applySize(sizeKey);
      setCurrentSize(sizeKey);
      setUpdateTrigger(prev => prev + 1); // 强制触发更新
      return true;
    }
    return false;
  }, []);

  const resetSize = React.useCallback(() => {
    const recommended = FontSizeManager.resetToRecommended();
    setCurrentSize(recommended);
    setUpdateTrigger(prev => prev + 1); // 强制触发更新
    return recommended;
  }, []);

  // 监听设备变化
  React.useEffect(() => {
    const handleResize = () => {
      const newDeviceType = FontSizeManager.getCurrentDeviceType();
      if (newDeviceType !== deviceType) {
        setDeviceType(newDeviceType);
        // 设备类型变化时，重新获取适合的字号
        const newSize = FontSizeManager.handleDeviceChange();
        setCurrentSize(newSize);
        setUpdateTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [deviceType]);

  // 初始化应用字号
  React.useEffect(() => {
    FontSizeManager.applySize(currentSize);
  }, []);

  // 🔧 实时计算当前配置，确保总是最新的
  const currentConfig = React.useMemo(() => {
    return FontSizeManager.getSizeConfig(currentSize);
  }, [currentSize, updateTrigger]);

  return {
    currentSize,
    currentConfig,
    allSizes: FontSizeManager.getAllSizes(),
    recommendedSize: FontSizeManager.getRecommendedSize(),
    deviceType,
    changeSize,
    resetSize,
  };
}

export default FontSizeManager;