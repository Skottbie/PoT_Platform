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
  const isAtTop = useRef(false); // 🔧 新增：记录是否在顶部开始拖拽

  // 处理触摸开始
  const handleTouchStart = useCallback((e) => {
    if (disabled || isRefreshing) return;
    
    // 🔧 关键修复：在开始时就检查并记录是否在顶部
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop > 5) { // 给一点容错空间
      isAtTop.current = false;
      return; // 不在顶部，直接返回，不记录任何状态
    }
    
    // 只有在页面顶部才记录开始状态
    isAtTop.current = true;
    startY.current = e.touches[0].clientY;
    hasTriggeredHaptic.current = false;
    isPulling.current = false;
    
    // 重置状态
    setPullDistance(0);
    setCanRelease(false);
    
    console.log('🟢 在页面顶部开始触摸，记录起始位置:', startY.current);
  }, [disabled, isRefreshing]);

  // 处理触摸移动
  const handleTouchMove = useCallback((e) => {
    if (disabled || isRefreshing || !containerRef.current) return;
    
    // 🔧 关键修复：只有在顶部开始的拖拽才处理
    if (!isAtTop.current) {
      return; // 不是从顶部开始的拖拽，直接忽略
    }
    
    // 🔧 再次确认仍在顶部（防止在拖拽过程中页面滚动了）
    const currentScrollTop = containerRef.current.scrollTop;
    if (currentScrollTop > 5) {
      // 页面已经滚动了，停止下拉刷新逻辑
      isAtTop.current = false;
      isPulling.current = false;
      setPullDistance(0);
      setCanRelease(false);
      console.log('🔴 页面滚动了，停止下拉刷新');
      return;
    }
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;
    
    console.log('👆 触摸移动:', { deltaY, scrollTop: currentScrollTop });
    
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
    console.log('✋ 触摸结束:', { isPulling: isPulling.current, canRelease, isAtTop: isAtTop.current });
    
    // 🔧 修复：只有从顶部开始的拖拽才处理结束逻辑
    if (!isAtTop.current || !isPulling.current) {
      // 重置状态
      isAtTop.current = false;
      isPulling.current = false;
      setPullDistance(0);
      setCanRelease(false);
      hasTriggeredHaptic.current = false;
      return;
    }
    
    isPulling.current = false;
    isAtTop.current = false; // 重置顶部标记
    
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
    container.style.overscrollBehavior = 'contain'; // 🔧 修改为 contain
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