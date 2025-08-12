// src/components/PullToRefreshContainer.jsx - 修复版本
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
        minHeight: '100vh',
        // 🔧 简化样式，让子元素处理滚动
        position: 'relative',
        overflow: 'hidden', // 防止外层滚动
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

      {/* 内容容器 - 让内容自己处理滚动 */}
      <div 
        className="relative z-0 h-full"
        style={{
          transition: isRefreshing ? 'none' : 'transform 0.3s ease-out',
          transform: `translateY(${isPulling || isRefreshing ? Math.min(pullDistance, threshold) : 0}px)`,
          height: '100%',
          // 🔧 确保内容可以正常滚动
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefreshContainer;