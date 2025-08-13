// src/hooks/usePullToRefresh.js - 完全重构版本
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
  const isScrolling = useRef(false);

  // 🔧 核心修复：更精确的滚动位置检测
  const getScrollTop = useCallback(() => {
    // 优先级顺序：window.scrollY > document.documentElement.scrollTop > document.body.scrollTop
    return window.scrollY || 
           document.documentElement.scrollTop || 
           document.body.scrollTop || 
           0;
  }, []);

  // 🔧 核心修复：严格的顶部检测
  const isAtTop = useCallback(() => {
    const scrollTop = getScrollTop();
    
    // 只有在真正的页面顶部才允许下拉刷新
    return scrollTop <= 3;
  }, [getScrollTop]);

  // 🔧 新增：滚动状态监听 - 优化版
  useEffect(() => {
    let scrollTimeout;
    let lastScrollTime = 0;

    const handleScroll = () => {
      const now = Date.now();
      lastScrollTime = now;
      isScrolling.current = true;
      
      // 如果正在滚动且不在顶部，重置下拉状态
      if (isPulling.current && !isAtTop()) {
        isPulling.current = false;
        setPullDistance(0);
        setCanRelease(false);
        hasTriggeredHaptic.current = false;
      }

      // 清除之前的定时器
      clearTimeout(scrollTimeout);
      
      // 🔧 关键修复：缩短延迟时间，快速响应滚动停止
      scrollTimeout = setTimeout(() => {
        // 确保真的停止了一段时间
        if (Date.now() - lastScrollTime >= 50) {
          isScrolling.current = false;
        }
      }, 50); // 从200ms减少到50ms
    };

    // 监听多个可能的滚动事件
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [isAtTop]);

  // 🔧 核心修复：更灵活的下拉条件检查
  const canStartPullRefresh = useCallback(() => {
    if (disabled || isRefreshing) return false;
    
    // 🔧 关键修复：只检查是否在顶部，不检查滚动状态
    const atTop = isAtTop();
    
    // 调试信息（生产环境可删除）
    if (process.env.NODE_ENV === 'development') {
      console.log('Pull refresh check:', {
        disabled,
        isRefreshing,
        atTop,
        scrollTop: getScrollTop(),
        canStart: atTop
      });
    }
    
    return atTop;
  }, [disabled, isRefreshing, isAtTop, getScrollTop]);

  // 🔧 重写：触摸开始处理
  const handleTouchStart = useCallback((e) => {
    startY.current = e.touches[0].clientY;
    hasTriggeredHaptic.current = false;
    isPulling.current = false;
    
    // 重置状态
    setPullDistance(0);
    setCanRelease(false);
    
    // 🔧 在顶部时总是准备处理下拉，不管是否在滚动
    // 这样可以捕获到用户在滑动结束时的下拉意图
  }, []);

  // 🔧 完全重写：触摸移动处理
  const handleTouchMove = useCallback((e) => {
    if (disabled || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;
    
    // 🔧 关键修复：更灵活的下拉判断
    if (deltaY > 15) { // 必须向下拉动超过15px
      // 🔧 实时检查是否在顶部
      const currentlyAtTop = isAtTop();
      
      if (currentlyAtTop) {
        // 🔧 关键：在顶部时立即阻止默认行为，防止浏览器刷新
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
      } else {
        // 不在顶部，重置下拉状态但不阻止滚动
        if (isPulling.current) {
          isPulling.current = false;
          setPullDistance(0);
          setCanRelease(false);
          hasTriggeredHaptic.current = false;
        }
        // 不调用 preventDefault()，让页面正常滚动
      }
    } else if (deltaY < -10) {
      // 向上滑动，重置状态
      if (isPulling.current) {
        isPulling.current = false;
        setPullDistance(0);
        setCanRelease(false);
        hasTriggeredHaptic.current = false;
      }
      // 不阻止向上滚动
    }
    // 🔧 小幅移动不做任何处理
  }, [disabled, isRefreshing, threshold, resistance, canRelease, enableHaptic, isAtTop]);

  // 🔧 重写：触摸结束处理
  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) {
      // 确保重置所有状态
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

    // 🔧 重要：防止浏览器原生下拉刷新
    const originalStyle = {
      overscrollBehavior: container.style.overscrollBehavior,
    };
    
    // 设置防止原生下拉刷新
    container.style.overscrollBehavior = 'contain';
    
    // 🔧 新增：在document level阻止原生下拉刷新
    const preventNativeRefresh = (e) => {
      // 如果用户在页面顶部下拉，阻止浏览器默认行为
      if (window.scrollY <= 3) {
        const touch = e.touches[0];
        if (touch) {
          const deltaY = touch.clientY - (touch.startY || touch.clientY);
          if (deltaY > 0) {
            e.preventDefault();
          }
        }
      }
    };

    // 🔧 关键：使用正确的事件选项
    const touchStartOptions = { passive: true };
    const touchMoveOptions = { passive: false }; // 需要能够阻止默认行为
    const touchEndOptions = { passive: true };

    container.addEventListener('touchstart', handleTouchStart, touchStartOptions);
    container.addEventListener('touchmove', handleTouchMove, touchMoveOptions);
    container.addEventListener('touchend', handleTouchEnd, touchEndOptions);
    container.addEventListener('touchcancel', handleTouchEnd, touchEndOptions);
    
    // 🔧 额外保护：在document级别防止原生刷新
    document.addEventListener('touchmove', preventNativeRefresh, { passive: false });

    return () => {
      // 清理事件监听器
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      document.removeEventListener('touchmove', preventNativeRefresh);
      
      // 恢复原始样式
      container.style.overscrollBehavior = originalStyle.overscrollBehavior;
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