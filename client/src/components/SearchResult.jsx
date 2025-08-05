// src/components/SearchResult.jsx
import { motion } from 'framer-motion';

export default function SearchResult({
  total,
  filtered,
  searchQuery,
  hasActiveFilters = false,
  onClearAll,
  className = ''
}) {
  const showSearchInfo = searchQuery?.trim() || hasActiveFilters;
  
  if (!showSearchInfo) {
    return (
      <div className={`flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 ${className}`}>
        <span>共 {total} 个任务</span>
      </div>
    );
  }

  const isSearching = searchQuery?.trim();
  const hasResults = filtered > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-between ${className}`}
    >
      <div className="flex items-center gap-3">
        {/* 搜索结果图标和文字 */}
        <div className="flex items-center gap-2">
          {hasResults ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">
                找到 {filtered} 个任务
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm font-medium">
                未找到相关任务
              </span>
            </div>
          )}
        </div>

        {/* 搜索关键词显示 */}
        {isSearching && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <span>搜索:</span>
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md font-mono">
              "{searchQuery}"
            </span>
          </div>
        )}

        {/* 筛选提示 */}
        {hasActiveFilters && !isSearching && (
          <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            <span>已应用筛选条件</span>
          </div>
        )}
      </div>

      {/* 清空按钮 */}
      {(isSearching || hasActiveFilters) && onClearAll && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>清空</span>
        </button>
      )}
    </motion.div>
  );
}