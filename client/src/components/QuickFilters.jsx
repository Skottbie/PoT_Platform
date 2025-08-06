// src/components/QuickFilters.jsx
import { motion } from 'framer-motion';
import { getFilterDisplayText } from '../utils/filterUtils';

export default function QuickFilters({
  filters = [],
  activeFilter,
  onFilterChange,
  currentFilters = {}, // 当前应用的筛选器状态
  className = ''
}) {
  if (filters.length === 0) return null;

  // 检查筛选器是否匹配当前状态
  const isFilterActive = (filter) => {
    if (activeFilter === filter.id) return true;
    
    // 检查筛选条件是否与当前状态匹配
    return Object.entries(filter.filter).every(([key, value]) => {
      return currentFilters[key] === value;
    });
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          快速筛选
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-700"></div>
        
        {/* 当前应用的筛选器提示 */}
        {Object.values(currentFilters).some(v => v && v !== 'all' && v !== '') && (
          <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            <span>已应用筛选</span>
          </div>
        )}
      </div>

      {/* 快速筛选按钮 */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter, index) => {
          const isActive = isFilterActive(filter);
          const hasMatchingConditions = Object.entries(filter.filter).some(([key, value]) => {
            return currentFilters[key] === value;
          });
          
          return (
            <motion.button
              key={filter.id}
              onClick={() => onFilterChange(filter.id, filter.filter)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                transition-all duration-200 select-none relative overflow-hidden
                ${isActive 
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25 scale-105' 
                  : hasMatchingConditions
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700'
                  : 'bg-white/70 dark:bg-gray-700/70 text-gray-700 dark:text-gray-200 border border-gray-200/50 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm'
                }
              `}
              whileHover={{ 
                scale: isActive ? 1.05 : 1.02,
                transition: { duration: 0.1 }
              }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* 背景动画效果 */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
              
              {/* 内容 */}
              <div className="relative flex items-center gap-1.5">
                <span className="text-base leading-none">{filter.icon}</span>
                <span>{filter.label}</span>
                
                {/* 激活状态指示器 */}
                {isActive && (
                  <motion.div
                    className="w-1 h-1 bg-white rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                  />
                )}
                
                {/* 部分匹配指示器 */}
                {!isActive && hasMatchingConditions && (
                  <motion.div
                    className="w-1 h-1 bg-blue-500 dark:bg-blue-400 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                  />
                )}
              </div>
              
              {/* Hover时的背景效果 */}
              {!isActive && (
                <motion.div
                  className="absolute inset-0 bg-gray-100 dark:bg-gray-600 opacity-0"
                  whileHover={{ opacity: 0.1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </motion.button>
          );
        })}

        {/* 自定义筛选器添加按钮 */}
        <motion.button
          className="
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
            bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300
            border border-dashed border-gray-300 dark:border-gray-500
            hover:border-gray-400 dark:hover:border-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500
            transition-all duration-200 relative overflow-hidden
          "
          whileHover={{ 
            scale: 1.02,
            transition: { duration: 0.1 }
          }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: filters.length * 0.05 }}
        >
          <span className="text-base leading-none">➕</span>// src/components/QuickFilters.jsx
import { motion } from 'framer-motion';

export default function QuickFilters({
  filters = [],
  activeFilter,
  onFilterChange,
  className = ''
}) {
  if (filters.length === 0) return null;

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          快速筛选
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-700"></div>
      </div>

      {/* 快速筛选按钮 */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter, index) => {
          const isActive = activeFilter === filter.id;
          
          return (
            <motion.button
              key={filter.id}
              onClick={() => onFilterChange(filter.id, filter.filter)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                transition-all duration-200 select-none
                ${isActive 
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25 scale-105' 
                  : 'bg-white/70 dark:bg-gray-700/70 text-gray-700 dark:text-gray-200 border border-gray-200/50 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm'
                }
              `}
              whileHover={{ scale: isActive ? 1.05 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <span className="text-base leading-none">{filter.icon}</span>
              <span>{filter.label}</span>
              
              {/* 激活状态指示器 */}
              {isActive && (
                <motion.div
                  className="w-1 h-1 bg-white rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                />
              )}
            </motion.button>
          );
        })}

        {/* 自定义筛选器添加按钮 - 占位 */}
        <motion.button
          className="
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
            bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300
            border border-dashed border-gray-300 dark:border-gray-500
            hover:border-gray-400 dark:hover:border-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500
            transition-all duration-200
          "
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: filters.length * 0.05 }}
        >
          <span className="text-base leading-none">➕</span>
          <span>自定义</span>
          
          {/* Hover效果 */}
          <motion.div
            className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 opacity-0"
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        </motion.button>
      </div>

      {/* 筛选器说明文字 */}
      {activeFilter && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-3 text-xs text-gray-500 dark:text-gray-400"
        >
          <div className="flex items-center gap-2">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              已应用快速筛选: {filters.find(f => f.id === activeFilter)?.label}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}