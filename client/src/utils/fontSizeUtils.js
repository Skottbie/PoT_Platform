// client/src/utils/fontSizeUtils.js - 字号管理工具类

import { DeviceDetector } from './deviceUtils';
import React from 'react'
/**
 * AIGC 聊天字号管理器
 */
export class FontSizeManager {
  // 字号配置
  static FONT_SIZES = {
    standard: { size: 16, label: '标准', value: 'standard' },
    large: { size: 18, label: '大', value: 'large' },
    xlarge: { size: 20, label: '特大', value: 'xlarge' },
    xxlarge: { size: 22, label: '巨大', value: 'xxlarge' }
  };

  static STORAGE_KEY = 'aigc_font_size_preference';

  /**
   * 获取智能推荐字号
   */
  static getRecommendedSize() {
    const deviceType = DeviceDetector.getDeviceType();
    
    switch (deviceType) {
      case 'iphone':
      case 'mobile':
        return 'standard'; // 16px
      case 'ipad':
      case 'tablet':
        return 'large'; // 18px
      default:
        return 'large'; // 18px
    }
  }

  /**
   * 获取当前用户偏好字号
   */
  static getCurrentSize() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved && this.FONT_SIZES[saved]) {
        return saved;
      }
    } catch (error) {
      console.warn('无法读取字号偏好设置:', error);
    }
    
    // 返回智能推荐
    return this.getRecommendedSize();
  }

  /**
   * 保存用户字号偏好
   */
  static saveSize(sizeKey) {
    if (!this.FONT_SIZES[sizeKey]) {
      console.warn('无效的字号选项:', sizeKey);
      return false;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, sizeKey);
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
    return this.FONT_SIZES[sizeKey] || this.FONT_SIZES[this.getRecommendedSize()];
  }

  /**
   * 获取所有字号选项
   */
  static getAllSizes() {
    return Object.values(this.FONT_SIZES);
  }

  /**
   * 生成CSS样式变量
   */
  static generateCSSVariables(sizeKey) {
    const config = this.getSizeConfig(sizeKey);
    const baseSize = config.size;
    
    return {
      '--aigc-font-size-base': `${baseSize}px`,
      '--aigc-font-size-sm': `${Math.round(baseSize * 0.875)}px`, // 14px -> 19px
      '--aigc-font-size-xs': `${Math.round(baseSize * 0.75)}px`,  // 12px -> 17px
      '--aigc-line-height': baseSize <= 16 ? '1.6' : '1.5', // 大字号行高适当紧凑
      '--aigc-code-font-size': `${Math.round(baseSize * 0.9)}px`, // 代码字号稍小
    };
  }

  /**
   * 应用字号到页面
   */
  static applySize(sizeKey) {
    const variables = this.generateCSSVariables(sizeKey);
    const root = document.documentElement;
    
    Object.entries(variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
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
}

/**
 * React Hook for font size management
 */
export function useFontSize() {
  const [currentSize, setCurrentSize] = React.useState(() => 
    FontSizeManager.getCurrentSize()
  );

  const changeSize = React.useCallback((sizeKey) => {
    if (FontSizeManager.saveSize(sizeKey)) {
      FontSizeManager.applySize(sizeKey);
      setCurrentSize(sizeKey);
      return true;
    }
    return false;
  }, []);

  const resetSize = React.useCallback(() => {
    const recommended = FontSizeManager.resetToRecommended();
    setCurrentSize(recommended);
    return recommended;
  }, []);

  // 初始化应用字号
  React.useEffect(() => {
    FontSizeManager.applySize(currentSize);
  }, []);

  return {
    currentSize,
    currentConfig: FontSizeManager.getSizeConfig(currentSize),
    allSizes: FontSizeManager.getAllSizes(),
    recommendedSize: FontSizeManager.getRecommendedSize(),
    changeSize,
    resetSize,
  };
}

export default FontSizeManager;