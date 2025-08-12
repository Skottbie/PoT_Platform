// src/hooks/usePullToRefresh.js - 简单可靠版
import { useState, useRef, useCallback, useEffect } from 'react';
import { HapticFeedback } from '../utils/deviceUtils';

const usePullToRefresh = (onRefresh, options = {}) => {
  const {
    threshold = 70,           
    resistance = 2.5,         
    snapBackDuration = 300,   
    enableHaptic = true,      
    disabled = false,
  } = options;

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRelease, setCanRelease] = useState(false);
  
  const containerRef = useRef(null);
  const startY = useRef(0);
  const hasTriggeredHaptic = useRef(false);
  const isPulling = useRef(false);

  // 处理触摸开始
  const handleTouchStart = useCallback((e) => {
    if (disabled || isRefreshing) return;
    
    // 🔧 关键检查：只有在页面顶部才记录开始位置
    if (!containerRef.current || containerRef.current.scrollTop > 0) {
      return; // 不在顶部，直接返回，不记录任何状态
    }
    
    startY.current = e.touches[0].clientY;
    hasTriggeredHaptic.current = false;
    isPulling.current = false;
    
    // 重置状态
    setPullDistance(0);
    setCanRelease(false);
    
    console.log('🟢 开始触摸 - 页面在顶部，记录起始位置:', startY.current);
  }, [disabled, isRefreshing]);

  // 处理触摸移动
  const handleTouchMove = useCallback((e) => {
    if (disabled || isRefreshing || !containerRef.current) return;
    
    // 🔧 再次检查：确保仍在页面顶部
    if (containerRef.current.scrollTop > 0) {
      // 页面已经滚动了，重置所有状态并退出
      isPulling.current = false;
      setPullDistance(0);
      setCanRelease(false);
      console.log('🔴 页面滚动了，退出下拉状态');
      return;
    }
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;
    
    console.log('👆 触摸移动:', { deltaY, scrollTop: containerRef.current.scrollTop });
    
    // 🔧 核心逻辑：只有向下拉动才处理
    if (deltaY > 10) { // 向下拉动超过10px才开始
      isPulling.current = true;
      e.preventDefault(); // 防止页面滚动
      
      // 计算下拉距离
      const distance = Math.max(0, deltaY / resistance);
      setPullDistance(distance);
      
      console.log('🟡 下拉中:', { distance, threshold });
      
      // 检查是否达到释放阈值
      const shouldRelease = distance >= threshold;
      if (shouldRelease !== canRelease) {
        setCanRelease(shouldRelease);
        console.log(shouldRelease ? '🟢 可以释放' : '🟡 继续拉动');
        
        // 触觉反馈
        if (shouldRelease && enableHaptic && !hasTriggeredHaptic.current) {
          HapticFeedback.medium();
          hasTriggeredHaptic.current = true;
        }
      }
    } else if (deltaY < -5) {
      // 向上推动，重置状态
      if (isPulling.current) {
        console.log('🔴 向上推动，重置状态');
        isPulling.current = false;
        setPullDistance(0);
        setCanRelease(false);
        hasTriggeredHaptic.current = false;
      }
    }
  }, [disabled, isRefreshing, threshold, resistance, canRelease, enableHaptic]);

  // 处理触摸结束
  const handleTouchEnd = useCallback(async () => {
    console.log('✋ 触摸结束:', { isPulling: isPulling.current, canRelease });
    
    if (!isPulling.current) return;
    
    isPulling.current = false;
    
    if (canRelease && !isRefreshing) {
      console.log('🚀 触发刷新');
      // 触发刷新
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
        if (enableHaptic) {
          HapticFeedback.success();
        }
        console.log('✅ 刷新完成');
      } catch (error) {
        console.error('❌ 刷新失败:', error);
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
          console.log('🔄 状态重置完成');
        }, snapBackDuration);
      }
    } else {
      // 回弹到初始位置
      console.log('↩️ 回弹到初始位置');
      setPullDistance(0);
      setCanRelease(false);
      hasTriggeredHaptic.current = false;
    }
  }, [canRelease, isRefreshing, onRefresh, threshold, snapBackDuration, enableHaptic]);

  // 绑定事件监听器
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 优化滚动行为
    container.style.overscrollBehavior = 'none';
    container.style.overflowX = 'hidden';

    console.log('🔧 绑定事件监听器');

    // 绑定事件
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      console.log('🧹 清理事件监听器');
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
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