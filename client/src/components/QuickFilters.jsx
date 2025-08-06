// src/components/QuickFilters.jsx (修复版本 - 解决状态同步和性能问题)
import { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import CustomFilterModal from './CustomFilterModal';
import CustomFilterManager from './CustomFilterManager';
import { useCustomFilters } from '../hooks/useCustomFilters';

export default function QuickFilters({
  filters = [],
  activeFilter,
  onFilterChange,
  currentFilters = {},
  userRole = 'student',
  classes = [],
  className = ''
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [editingFilter, setEditingFilter] = useState(null);

  // 🔧 修复：使用ref缓存之前的状态，避免不必要的重新计算
  const prevCurrentFiltersRef = useRef({});
  const prevFiltersRef = useRef([]);

  // 使用自定义筛选器Hook
  const {
    customFilters,
    isLoading,
    createCustomFilter,
    updateCustomFilter,
    deleteCustomFilter,
    applyCustomFilter,
    duplicateCustomFilter,
    renameCustomFilter,
    exportCustomFilters,
    importCustomFilters,
    resetToDefault,
    getFilterStats,
    searchCustomFilters
  } = useCustomFilters(userRole);

  // 🔧 修复：优化筛选器状态检查函数，使用深度比较和缓存
  const isFilterActive = useCallback((filter) => {
    if (activeFilter === filter.id) return true;
    
    // 检查筛选条件是否与当前状态匹配
    try {
      if (!filter.filter || typeof filter.filter !== 'object') {
        return false;
      }
      
      return Object.entries(filter.filter).every(([key, value]) => {
        const currentValue = currentFilters[key];
        
        // 处理不同类型的值比较
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(currentValue) === JSON.stringify(value);
        }
        
        return currentValue === value;
      });
    } catch (error) {
      console.warn('检查筛选器状态时出错:', error, filter);
      return false;
    }
  }, [activeFilter, currentFilters]);

  // 🔧 修复：优化自定义筛选器状态检查
  const isCustomFilterActive = useCallback((customFilter) => {
    try {
      if (!customFilter.filters || typeof customFilter.filters !== 'object') {
        return false;
      }
      
      return Object.entries(customFilter.filters).every(([key, value]) => {
        const currentValue = currentFilters[key];
        
        if (key === 'search') {
          return currentValue === value;
        }
        
        if (key.includes('Range')) {
          // 日期范围比较需要特殊处理
          if (!currentValue || !value) return !currentValue && !value;
          
          try {
            return JSON.stringify(currentValue) === JSON.stringify(value);
          } catch {
            return false;
          }
        }
        
        return currentValue === value;
      });
    } catch (error) {
      console.warn('检查自定义筛选器状态时出错:', error, customFilter);
      return false;
    }
  }, [currentFilters]);

  // 🔧 修复：优化应用自定义筛选器函数
  const handleApplyCustomFilter = useCallback((filterId) => {
    try {
      const filterConditions = applyCustomFilter(filterId);
      if (filterConditions && typeof onFilterChange === 'function') {
        onFilterChange('custom_' + filterId, filterConditions);
      }
    } catch (error) {
      console.error('应用自定义筛选器失败:', error);
    }
  }, [applyCustomFilter, onFilterChange]);

  // 🔧 修复：稳定化创建自定义筛选器函数
  const handleCreateCustomFilter = useCallback(async (filterData) => {
    try {
      const newFilter = await createCustomFilter(filterData);
      setShowCreateModal(false);
      return newFilter;
    } catch (error) {
      console.error('创建自定义筛选器失败:', error);
      throw error;
    }
  }, [createCustomFilter]);

  // 编辑自定义筛选器
  const handleEditCustomFilter = useCallback((filter) => {
    setEditingFilter(filter);
    setShowCreateModal(true);
  }, []);

  // 更新自定义筛选器
  const handleUpdateCustomFilter = useCallback(async (filterData) => {
    try {
      await updateCustomFilter(editingFilter.id, filterData);
      setEditingFilter(null);
      setShowCreateModal(false);
    } catch (error) {
      console.error('更新自定义筛选器失败:', error);
      throw error;
    }
  }, [updateCustomFilter, editingFilter]);

  // 🔧 修复：优化筛选器颜色类获取函数，添加缓存
  const getCustomFilterColorClasses = useCallback((filter) => {
    const isActive = isCustomFilterActive(filter);
    const colorMap = {
      blue: isActive ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700',
      green: isActive ? 'bg-green-500 text-white shadow-md shadow-green-500/25' : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700',
      red: isActive ? 'bg-red-500 text-white shadow-md shadow-red-500/25' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700',
      orange: isActive ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-700',
      purple: isActive ? 'bg-purple-500 text-white shadow-md shadow-purple-500/25' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700',
      pink: isActive ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25' : 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-700',
      indigo: isActive ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700',
      gray: isActive ? 'bg-gray-500 text-white shadow-md shadow-gray-500/25' : 'bg-gray-50 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
    };
    return colorMap[filter.color] || colorMap.blue;
  }, [isCustomFilterActive]);

  // 🔧 修复：安全的筛选器处理和性能优化
  const safeFilters = useMemo(() => {
    return Array.isArray(filters) ? filters : [];
  }, [filters]);

  const safeCustomFilters = useMemo(() => {
    return Array.isArray(customFilters) ? customFilters : [];
  }, [customFilters]);

  // 🔧 修复：优化加载状态渲染
  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            快速筛选
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-700"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-20 rounded-lg"></div>
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-24 rounded-lg"></div>
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-16 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          快速筛选
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-700"></div>
        
        {/* 管理按钮 - 仅在有自定义筛选器时显示 */}
        {safeCustomFilters.length > 0 && (
          <button
            onClick={() => setShowManager(true)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            <span>🛠️</span>
            <span>管理</span>
          </button>
        )}
      </div>

      {/* 快速筛选按钮 */}
      <div className="flex flex-wrap gap-2">
        {/* 默认快速筛选器 */}
        {safeFilters.map((filter, index) => {
          const isActive = isFilterActive(filter);
          const hasMatchingConditions = useMemo(() => {
            try {
              return Object.entries(filter.filter || {}).some(([key, value]) => {
                return currentFilters[key] === value;
              });
            } catch {
              return false;
            }
          }, [filter.filter, currentFilters]);
          
          return (
            <motion.button
              key={filter.id}
              onClick={() => {
                try {
                  if (typeof onFilterChange === 'function') {
                    onFilterChange(filter.id, filter.filter);
                  }
                } catch (error) {
                  console.error('应用筛选器失败:', error, filter);
                }
              }}
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

        {/* 自定义筛选器 */}
        {safeCustomFilters.map((customFilter, index) => {
          const isActive = isCustomFilterActive(customFilter);
          
          return (
            <motion.button
              key={customFilter.id}
              onClick={() => handleApplyCustomFilter(customFilter.id)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                transition-all duration-200 select-none relative overflow-hidden
                ${getCustomFilterColorClasses(customFilter)}
                ${isActive ? 'scale-105' : 'hover:scale-102'}
              `}
              whileHover={{ 
                scale: isActive ? 1.05 : 1.02,
                transition: { duration: 0.1 }
              }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (safeFilters.length + index) * 0.05 }}
              title={customFilter.description || customFilter.name}
            >
              {/* 内容 */}
              <div className="relative flex items-center gap-1.5">
                <span className="text-base leading-none">{customFilter.icon}</span>
                <span>{customFilter.name}</span>
                
                {/* 自定义标识 */}
                {!customFilter.isDefault && (
                  <div className="w-1 h-1 bg-current rounded-full opacity-60" />
                )}
                
                {/* 激活状态指示器 */}
                {isActive && (
                  <motion.div
                    className="w-1 h-1 bg-white rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                  />
                )}
              </div>
            </motion.button>
          );
        })}

        {/* 创建自定义筛选器按钮 */}
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
          transition={{ delay: (safeFilters.length + safeCustomFilters.length) * 0.05 }}
          onClick={() => setShowCreateModal(true)}
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
      {(activeFilter || safeCustomFilters.some(isCustomFilterActive)) && (
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
              已应用筛选: {
                activeFilter 
                  ? safeFilters.find(f => f.id === activeFilter)?.label
                  : safeCustomFilters.find(isCustomFilterActive)?.name
              }
            </span>
          </div>
        </motion.div>
      )}

      {/* 自定义筛选器创建弹窗 */}
      {showCreateModal && (
        <CustomFilterModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingFilter(null);
          }}
          onSave={editingFilter ? handleUpdateCustomFilter : handleCreateCustomFilter}
          currentFilters={currentFilters}
          editingFilter={editingFilter}
          userRole={userRole}
        />
      )}

      {/* 自定义筛选器管理弹窗 */}
      {showManager && (
        <CustomFilterManager
          isOpen={showManager}
          onClose={() => setShowManager(false)}
          customFilters={safeCustomFilters}
          onApplyFilter={handleApplyCustomFilter}
          onEditFilter={handleEditCustomFilter}
          onDeleteFilter={deleteCustomFilter}
          onDuplicateFilter={duplicateCustomFilter}
          onRenameFilter={renameCustomFilter}
          onExportFilters={exportCustomFilters}
          onImportFilters={importCustomFilters}
          onResetToDefault={resetToDefault}
          getFilterStats={getFilterStats}
          searchCustomFilters={searchCustomFilters}
        />
      )}
    </div>
  );
}