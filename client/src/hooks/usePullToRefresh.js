// src/hooks/usePullToRefresh.js - 完全修复版本
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
  const scrollContainerRef = useRef(null); // 真正的滚动容器
  const startY = useRef(0);
  const hasTriggeredHaptic = useRef(false);
  const isPulling = useRef(false);

  // 🔧 找到真正的滚动容器
  const findScrollContainer = useCallback(() => {
    if (!containerRef.current) return null;
    
    // 检查自身是否可滚动
    const container = containerRef.current;
    if (container.scrollHeight > container.clientHeight) {
      return container;
    }
    
    // 查找第一个可滚动的子元素
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (node === container) return NodeFilter.FILTER_SKIP;
          
          const style = window.getComputedStyle(node);
          const isScrollable = (
            style.overflowY === 'auto' ||
            style.overflowY === 'scroll' ||
            style.overflow === 'auto' ||
            style.overflow === 'scroll'
          ) && node.scrollHeight > node.clientHeight;
          
          return isScrollable ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      }
    );
    
    return walker.nextNode() || container;
  }, []);

  // 🔧 检查是否在顶部
  const isAtTop = useCallback(() => {
    const scrollContainer = scrollContainerRef.current || findScrollContainer();
    if (!scrollContainer) return false;
    
    return scrollContainer.scrollTop <= 5;
  }, [findScrollContainer]);

  // 🔧 检查是否可以开始下拉刷新
  const canStartPullRefresh = useCallback(() => {
    if (disabled || isRefreshing || !containerRef.current) return false;
    return isAtTop();
  }, [disabled, isRefreshing, isAtTop]);

  // 处理触摸开始
  const handleTouchStart = useCallback((e) => {
    // 更新滚动容器引用
    scrollContainerRef.current = findScrollContainer();
    
    if (!canStartPullRefresh()) return;
    
    startY.current = e.touches[0].clientY;
    hasTriggeredHaptic.current = false;
    isPulling.current = false;
    
    // 重置状态
    setPullDistance(0);
    setCanRelease(false);
  }, [canStartPullRefresh, findScrollContainer]);

  // 🔧 完全重写触摸移动处理
  const handleTouchMove = useCallback((e) => {
    if (!containerRef.current || !scrollContainerRef.current) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;
    
    // 检查是否在顶部
    const currentlyAtTop = isAtTop();
    
    // 只有在页面顶部且向下拉动时才处理下拉刷新
    if (currentlyAtTop && deltaY > 10) {
      if (!canStartPullRefresh()) return;
      
      // 🔧 关键：阻止默认行为和事件冒泡
      e.preventDefault();
      e.stopPropagation();
      isPulling.current = true;
      
      // 计算下拉距离（添加阻尼效果）
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
    } else if (deltaY < -5 || !currentlyAtTop) {
      // 向上滑动或不在顶部时，重置状态
      if (isPulling.current) {
        isPulling.current = false;
        setPullDistance(0);
        setCanRelease(false);
        hasTriggeredHaptic.current = false;
      }
    }
    // 🔧 其他情况不阻止默认行为，允许正常滚动
  }, [canStartPullRefresh, threshold, resistance, canRelease, enableHaptic, isAtTop]);

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

    // 🔧 设置容器样式
    const originalStyle = {
      overscrollBehavior: container.style.overscrollBehavior,
      touchAction: container.style.touchAction,
    };
    
    container.style.overscrollBehavior = 'contain';
    container.style.touchAction = 'pan-y';

    // 🔧 使用正确的事件选项
    const touchStartOptions = { passive: true };
    const touchMoveOptions = { passive: false }; // 需要能够阻止默认行为
    const touchEndOptions = { passive: true };

    container.addEventListener('touchstart', handleTouchStart, touchStartOptions);
    container.addEventListener('touchmove', handleTouchMove, touchMoveOptions);
    container.addEventListener('touchend', handleTouchEnd, touchEndOptions);
    container.addEventListener('touchcancel', handleTouchEnd, touchEndOptions);

    return () => {
      // 清理事件监听器
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      
      // 恢复原始样式
      container.style.overscrollBehavior = originalStyle.overscrollBehavior;
      container.style.touchAction = originalStyle.touchAction;
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