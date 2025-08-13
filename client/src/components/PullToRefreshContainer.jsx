// src/components/PullToRefreshContainer.jsx - 简化版本
import { useRef, useEffect } from 'react';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from './PullToRefreshIndicator';

const PullToRefreshContainer = ({ 
  children, 
  onRefresh, 
  className = '',
  disabled = false,
  threshold = 70,
  ...options 
}) => {
  const {
    containerRef,
    pullDistance,
    isRefreshing,
    canRelease,
    isPulling,
  } = usePullToRefresh(onRefresh, {
    threshold,
    disabled,
    ...options
  });

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={{ 
        // 🔧 关键修复：让容器不干扰正常滚动
        height: '100%',
        minHeight: '100vh',
        position: 'relative',
        // 🔧 重要：不设置 overflow: hidden，让页面自然滚动
      }}
    >
      {/* 下拉刷新指示器 */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        threshold={threshold}
        isRefreshing={isRefreshing}
        canRelease={canRelease}
        isPulling={isPulling}
      />

      {/* 🔧 关键修复：简化内容容器，不干扰滚动 */}
      <div 
        className="relative z-0"
        style={{
          transition: isRefreshing ? 'none' : 'transform 0.3s ease-out',
          transform: `translateY(${isPulling || isRefreshing ? Math.min(pullDistance, threshold) : 0}px)`,
          // 🔧 重要：让内容正常流动，不设置特殊的滚动属性
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefreshContainer;