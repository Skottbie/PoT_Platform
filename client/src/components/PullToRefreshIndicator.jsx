// src/components/PullToRefreshIndicator.jsx - 优化版本
import { motion, AnimatePresence } from 'framer-motion';

const PullToRefreshIndicator = ({ 
  pullDistance, 
  threshold, 
  isRefreshing, 
  canRelease,
  isPulling
}) => {
  // 计算指示器状态
  const getIndicatorState = () => {
    if (isRefreshing) return 'refreshing';
    if (canRelease) return 'release';
    if (isPulling && pullDistance > 10) return 'pulling'; // 🔧 添加最小拉动距离
    return 'hidden';
  };

  const state = getIndicatorState();
  const progress = Math.min(pullDistance / threshold, 1);

  // 🔧 只在真正有拉动时才显示
  const shouldShow = state !== 'hidden';

  // 获取状态文本
  const getStateText = () => {
    switch (state) {
      case 'pulling':
        return '下拉刷新';
      case 'release':
        return '释放刷新';
      case 'refreshing':
        return '刷新中...';
      default:
        return '';
    }
  };

  // 获取箭头旋转角度
  const getArrowRotation = () => {
    if (state === 'release') return 180;
    if (state === 'pulling') return progress * 180;
    return 0;
  };

  // 🔧 修复：动态计算指示器位置，避免布局偏移
  const indicatorHeight = Math.min(pullDistance, threshold + 20);

  return (
    <div 
      className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-sm"
      style={{
        height: `${indicatorHeight}px`,
        transform: `translateY(${-Math.max(0, threshold + 20 - pullDistance)}px)`,
        opacity: shouldShow ? 1 : 0,
        transition: isRefreshing ? 'none' : 'opacity 0.2s ease-out',
      }}
    >
      <AnimatePresence>
        {shouldShow && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-2 py-2"
          >
            {/* 指示器图标 */}
            <div className="relative flex items-center justify-center">
              {state === 'refreshing' ? (
                // 加载中的旋转动画
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
                />
              ) : (
                // 箭头指示器
                <motion.div
                  animate={{ rotate: getArrowRotation() }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="w-6 h-6 flex items-center justify-center"
                >
                  <svg 
                    className={`w-4 h-4 ${
                      state === 'release' 
                        ? 'text-green-500' 
                        : 'text-blue-500'
                    }`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                    />
                  </svg>
                </motion.div>
              )}

              {/* 进度环 - 只在拉动时显示 */}
              {state === 'pulling' && (
                <svg 
                  className="absolute inset-0 w-6 h-6 transform -rotate-90"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-gray-300 dark:text-gray-600"
                  />
                  <motion.circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-blue-500"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: progress }}
                    transition={{ duration: 0.1 }}
                    strokeDasharray="63"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>

            {/* 状态文本 */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-sm font-medium ${
                state === 'release' 
                  ? 'text-green-600 dark:text-green-400' 
                  : state === 'refreshing'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {getStateText()}
            </motion.p>

            {/* 成功状态点 */}
            {state === 'release' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PullToRefreshIndicator;