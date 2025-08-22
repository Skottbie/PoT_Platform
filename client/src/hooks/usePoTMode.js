// client/src/hooks/usePoTMode.js - PoT Mode 状态管理
import { useState, useEffect, useCallback, useRef } from 'react';
import { useHapticFeedback } from './useDeviceDetetion';

// PoT Mode 专用模型配置
const POT_MODEL = 'pot-tutor'; // PoT专用模型标识
const POT_STORAGE_KEY = 'potMode';
const POT_GUIDE_STORAGE_KEY = 'potGuideHidden'; // 引导显示控制

/**
 * PoT Mode 状态管理 Hook
 * 负责 PoT 模式的开启/关闭、状态持久化、草稿集成等核心功能
 */
export const usePoTMode = () => {
  const haptic = useHapticFeedback();
  
  // PoT 核心状态
  const [potEnabled, setPotEnabled] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [lastActivated, setLastActivated] = useState(null);
  const [shouldShowGuide, setShouldShowGuide] = useState(true); // 是否显示引导
  
  // 用户原始模型选择（用于退出时恢复）
  const [originalModel, setOriginalModel] = useState('qwen-flash');
  const activationTimeoutRef = useRef(null);

  /**
   * 从 localStorage 加载 PoT 状态
   */
  const loadPoTState = useCallback(() => {
    try {
      const saved = localStorage.getItem(POT_STORAGE_KEY);
      const guideHidden = localStorage.getItem(POT_GUIDE_STORAGE_KEY) === 'true';
      
      if (saved) {
        const state = JSON.parse(saved);
        setPotEnabled(state.enabled || false);
        setIsFirstTime(state.isFirstTime !== false); // 默认为true
        setLastActivated(state.lastActivated || null);
      }
      
      // 设置引导显示状态（默认显示，除非用户主动隐藏）
      setShouldShowGuide(!guideHidden);
      
      return { saved, guideHidden };
    } catch (error) {
      console.warn('无法加载 PoT 状态:', error);
    }
    return null;
  }, []);

  /**
   * 保存引导显示设置
   */
  const saveGuidePreference = useCallback((dontShowAgain) => {
    try {
      localStorage.setItem(POT_GUIDE_STORAGE_KEY, dontShowAgain.toString());
      setShouldShowGuide(!dontShowAgain);
      return true;
    } catch (error) {
      console.warn('无法保存引导偏好设置:', error);
      return false;
    }
  }, []);
  const savePoTState = useCallback((state) => {
    try {
      const stateToSave = {
        enabled: state.enabled,
        isFirstTime: state.isFirstTime,
        lastActivated: state.lastActivated || Date.now()
      };
      localStorage.setItem(POT_STORAGE_KEY, JSON.stringify(stateToSave));
      return true;
    } catch (error) {
      console.warn('无法保存 PoT 状态:', error);
      return false;
    }
  }, []);

  /**
   * 激活动画序列
   * 1. 按下反馈（100ms）
   * 2. 加载状态（300ms）  
   * 3. 激活扩散（400ms）
   * 4. 完成状态
   */
  const runActivationAnimation = useCallback(async () => {
    setIsActivating(true);
    
    // 触觉反馈
    haptic.medium();
    
    // 总动画时间：800ms
    await new Promise(resolve => {
      activationTimeoutRef.current = setTimeout(resolve, 800);
    });
    
    setIsActivating(false);
  }, [haptic]);

  /**
   * 开启 PoT Mode
   */
  const enablePoTMode = useCallback(async (currentModel = 'qwen-flash') => {
    // 保存用户当前选择的模型
    setOriginalModel(currentModel);
    
    // 执行激活动画
    await runActivationAnimation();
    
    // 更新状态
    setPotEnabled(true);
    setLastActivated(Date.now());
    
    // 标记不是首次使用
    if (isFirstTime) {
      setIsFirstTime(false);
    }
    
    // 持久化状态
    savePoTState({
      enabled: true,
      isFirstTime: false,
      lastActivated: Date.now()
    });
    
    console.log('✅ PoT Mode 已激活');
    return true;
  }, [isFirstTime, runActivationAnimation, savePoTState]);

  /**
   * 关闭 PoT Mode
   */
  const disablePoTMode = useCallback(() => {
    setPotEnabled(false);
    setLastActivated(Date.now());
    
    // 持久化状态
    savePoTState({
      enabled: false,
      isFirstTime: false,
      lastActivated: Date.now()
    });
    
    console.log('🔄 PoT Mode 已关闭');
    return originalModel; // 返回原始模型以便恢复
  }, [originalModel, savePoTState]);

  /**
   * 切换 PoT Mode 状态
   */
  const togglePoTMode = useCallback(async (currentModel, hasConversation = false) => {
    // 如果正在激活中，忽略点击
    if (isActivating) {
      return { success: false, reason: 'activating' };
    }

    if (!potEnabled) {
      // 开启 PoT Mode
      const success = await enablePoTMode(currentModel);
      return { 
        success, 
        action: 'enabled', 
        newModel: POT_MODEL,
        needsClearConversation: hasConversation,
        showFirstTimeGuide: shouldShowGuide // 根据用户偏好决定是否显示引导
      };
    } else {
      // 关闭 PoT Mode
      const restoredModel = disablePoTMode();
      return { 
        success: true, 
        action: 'disabled', 
        newModel: restoredModel,
        needsClearConversation: hasConversation
      };
    }
  }, [potEnabled, isActivating, enablePoTMode, disablePoTMode, isFirstTime]);

  /**
   * 获取当前应该使用的模型
   */
  const getCurrentModel = useCallback((userSelectedModel) => {
    return potEnabled ? POT_MODEL : userSelectedModel;
  }, [potEnabled]);

  /**
   * 检查是否应该隐藏模型选择器
   */
  const shouldHideModelSelector = useCallback(() => {
    return potEnabled;
  }, [potEnabled]);

  /**
   * 检查是否应该隐藏推理开关
   */
  const shouldHideReasoningToggle = useCallback(() => {
    return potEnabled;
  }, [potEnabled]);

  /**
   * 获取输入框占位符文本
   */
  const getInputPlaceholder = useCallback(() => {
    return potEnabled ? 'PoT-Mode ON.' : '请输入消息...';
  }, [potEnabled]);

  /**
   * 获取PoT状态显示文本
   */
  const getPoTStatusText = useCallback(() => {
    return potEnabled ? 'PoT-Mode beta ON.' : '';
  }, [potEnabled]);

  // 组件挂载时加载状态
  useEffect(() => {
    loadPoTState();
  }, [loadPoTState]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (activationTimeoutRef.current) {
        clearTimeout(activationTimeoutRef.current);
      }
    };
  }, []);

  return {
    // 状态
    potEnabled,
    isFirstTime,
    isActivating,
    lastActivated,
    shouldShowGuide,
    
    // 操作
    togglePoTMode,
    enablePoTMode,
    disablePoTMode,
    saveGuidePreference,
    
    // 计算属性
    getCurrentModel,
    shouldHideModelSelector,
    shouldHideReasoningToggle,
    getInputPlaceholder,
    getPoTStatusText,
    
    // 常量
    POT_MODEL
  };
};