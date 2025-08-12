// src/components/PullToRefreshContainer.jsx - 下拉刷新容器组件
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
        height: '100%',
        minHeight: '100vh', // 🔧 确保最小高度
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y', // 🔧 允许垂直滚动
        overscrollBehavior: 'contain', // 🔧 防止过度滚动
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

      {/* 内容容器 */}
      <div 
        className="relative z-0"
        style={{
          transition: isRefreshing ? 'none' : 'transform 0.3s ease-out',
          transform: `translateY(${isPulling || isRefreshing ? Math.min(pullDistance, threshold) : 0}px)`,
          minHeight: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefreshContainer;