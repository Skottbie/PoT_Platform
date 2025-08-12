// src/hooks/usePullToRefresh.js - 修复版本
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
  const isScrollingDown = useRef(false); // 🔧 新增：记录滚动方向

  // 🔧 关键修复：检查是否可以开始下拉刷新
  const canStartPullRefresh = useCallback(() => {
    if (disabled || isRefreshing || !containerRef.current) return false;
    
    const scrollTop = containerRef.current.scrollTop;
    return scrollTop <= 5; // 只有在顶部5px内才允许下拉刷新
  }, [disabled, isRefreshing]);

  // 处理触摸开始
  const handleTouchStart = useCallback((e) => {
    if (!canStartPullRefresh()) return;
    
    startY.current = e.touches[0].clientY;
    hasTriggeredHaptic.current = false;
    isPulling.current = false;
    isScrollingDown.current = false;
    
    // 重置状态
    setPullDistance(0);
    setCanRelease(false);
  }, [canStartPullRefresh]);

  // 🔧 关键修复：处理触摸移动
  const handleTouchMove = useCallback((e) => {
    if (!containerRef.current) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;
    const currentScrollTop = containerRef.current.scrollTop;
    
    // 🔧 只有在页面顶部且向下拉动时才处理
    if (currentScrollTop <= 5 && deltaY > 10) {
      if (!canStartPullRefresh()) return;
      
      // 🔧 关键：只在这种情况下才阻止默认行为
      e.preventDefault();
      isPulling.current = true;
      
      // 计算下拉距离
      const distance = Math.max(0, deltaY / resistance);
      setPullDistance(distance);
      
      // 检查是否达到释放阈值
      const shouldRelease = distance >= threshold;
      if (shouldRelease !== canRelease) {
        setCanRelease(shouldRelease);
        
        // 触觉反馈
        if (shouldRelease && enableHaptic && !hasTriggeredHaptic.current) {
          HapticFeedback.medium();
          hasTriggeredHaptic.current = true;
        }
      }
    } else if (deltaY < -5) {
      // 向上滑动，重置状态
      if (isPulling.current) {
        isPulling.current = false;
        setPullDistance(0);
        setCanRelease(false);
        hasTriggeredHaptic.current = false;
      }
    }
    // 🔧 关键：其他情况不阻止默认行为，允许正常滚动
  }, [canStartPullRefresh, threshold, resistance, canRelease, enableHaptic]);

  // 处理触摸结束
  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) {
      // 重置所有状态
      setPullDistance(0);
      setCanRelease(false);
      hasTriggeredHaptic.current = false;
      return;
    }
    
    isPulling.current = false;
    
    if (canRelease && !isRefreshing) {
      // 触发刷新
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
        if (enableHaptic) {
          HapticFeedback.success();
        }
      } catch (error) {
        console.error('刷新失败:', error);
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

  // 🔧 优化事件监听器绑定
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 🔧 关键修复：优化滚动行为设置
    container.style.overscrollBehavior = 'contain';
    container.style.touchAction = 'pan-y'; // 🔧 允许垂直滚动

    // 🔧 关键修复：使用正确的 passive 设置
    const touchStartOptions = { passive: true };
    const touchMoveOptions = { passive: false }; // 只对 move 事件禁用 passive
    const touchEndOptions = { passive: true };

    container.addEventListener('touchstart', handleTouchStart, touchStartOptions);
    container.addEventListener('touchmove', handleTouchMove, touchMoveOptions);
    container.addEventListener('touchend', handleTouchEnd, touchEndOptions);
    container.addEventListener('touchcancel', handleTouchEnd, touchEndOptions);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      
      // 🔧 清理样式
      container.style.overscrollBehavior = '';
      container.style.touchAction = '';
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