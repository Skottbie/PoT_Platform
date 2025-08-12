// src/hooks/usePullToRefresh.js - 下拉刷新核心Hook
import { useState, useRef, useCallback, useEffect } from 'react';
import { HapticFeedback } from '../utils/deviceUtils';

const usePullToRefresh = (onRefresh, options = {}) => {
  const {
    threshold = 70,           // 触发刷新的阈值
    resistance = 2.5,         // 拉动阻力系数
    snapBackDuration = 300,   // 回弹动画时长
    enableHaptic = true,      // 启用触觉反馈
    disabled = false,         // 禁用下拉刷新
  } = options;

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRelease, setCanRelease] = useState(false);
  
  const containerRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);
  const hasTriggeredHaptic = useRef(false);

  // 检查是否可以开始下拉
  const canStartPull = useCallback(() => {
    if (!containerRef.current || disabled || isRefreshing) return false;
    
    const scrollTop = containerRef.current.scrollTop;
    return scrollTop <= 0;
  }, [disabled, isRefreshing]);

  // 处理触摸开始
  const handleTouchStart = useCallback((e) => {
    if (!canStartPull()) return;
    
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
    isPulling.current = false;
    hasTriggeredHaptic.current = false;
  }, [canStartPull]);

  // 处理触摸移动
  const handleTouchMove = useCallback((e) => {
    if (!canStartPull()) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    // 🔧 修复：只有向下拉动且滚动位置为0时才触发下拉刷新
    if (deltaY > 5 && containerRef.current && containerRef.current.scrollTop <= 0) {
      isPulling.current = true;
      
      // 计算拉动距离，应用阻力
      const distance = Math.max(0, deltaY / resistance);
      setPullDistance(distance);

      // 检查是否达到触发阈值
      const shouldRelease = distance >= threshold;
      if (shouldRelease !== canRelease) {
        setCanRelease(shouldRelease);
        
        // 触觉反馈
        if (shouldRelease && enableHaptic && !hasTriggeredHaptic.current) {
          HapticFeedback.medium();
          hasTriggeredHaptic.current = true;
        }
      }

      // 防止页面滚动
      e.preventDefault();
    } else if (deltaY < -5) {
      // 向上滑动时，重置状态并允许正常滚动
      isPulling.current = false;
      setPullDistance(0);
      setCanRelease(false);
      hasTriggeredHaptic.current = false;
    }
  }, [canStartPull, threshold, resistance, canRelease, enableHaptic]);

  // 处理触摸结束
  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;

    isPulling.current = false;

    if (canRelease && !isRefreshing) {
      // 触发刷新
      setIsRefreshing(true);
      setPullDistance(threshold); // 保持在阈值位置
      
      try {
        await onRefresh();
        if (enableHaptic) {
          HapticFeedback.success();
        }
      } catch (error) {
        console.error('Refresh failed:', error);
        if (enableHaptic) {
          HapticFeedback.error();
        }
      } finally {
        // 回弹动画
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          setCanRelease(false);
          hasTriggeredHaptic.current = false;
        }, snapBackDuration);
      }
    } else {
      // 回弹到初始位置
      setPullDistance(0);
      setCanRelease(false);
      hasTriggeredHaptic.current = false;
    }
  }, [canRelease, isRefreshing, onRefresh, threshold, snapBackDuration, enableHaptic]);

  // 绑定事件监听器
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 防止浏览器默认的下拉刷新
    container.style.overscrollBehavior = 'none';
    container.style.overflowX = 'hidden';

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    canRelease,
    isPulling: isPulling.current && pullDistance > 0,
  };
};

export default usePullToRefresh;