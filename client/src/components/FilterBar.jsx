// src/components/FilterBar.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchInput from './SearchInput';
import QuickFilters from './QuickFilters';
import SearchResult from './SearchResult';
import Button from './Button';

export default function FilterBar({
  filters,
  onFiltersChange,
  quickFilters = [],
  showAdvanced = false,
  onToggleAdvanced,
  // 搜索相关props
  searchSuggestions = [],
  searchHistory = [],
  onClearSearchHistory,
  onSearch,
  // 结果统计
  totalCount = 0,
  filteredCount = 0,
  className = ''
}) {
  const [activeQuickFilter, setActiveQuickFilter] = useState(null);

  const handleQuickFilterChange = (filterId, filterConfig) => {
    if (activeQuickFilter === filterId) {
      // 取消激活的快速筛选
      setActiveQuickFilter(null);
      onFiltersChange({
        ...filters,
        // 重置到默认状态
        classId: 'all',
        deadline: 'all',
        submitted: 'all',
        taskType: 'all'
      });
    } else {
      // 应用新的快速筛选
      setActiveQuickFilter(filterId);
      onFiltersChange({
        ...filters,
        ...filterConfig
      });
    }
  };

  const handleSearchChange = (searchValue) => {
    onFiltersChange({
      ...filters,
      search: searchValue
    });
  };

  const handleSearchSubmit = (searchValue) => {
    onSearch?.(searchValue);
    onFiltersChange({
      ...filters,
      search: searchValue
    });
  };

  const clearAllFilters = () => {
    setActiveQuickFilter(null);
    onFiltersChange({
      category: filters.category, // 保持当前分类
      classId: 'all',
      deadline: 'all',
      submitted: 'all',
      taskType: 'all',
      search: '',
      sortBy: 'deadline',
      sortOrder: 'asc'
    });
  };

  // 计算当前激活的筛选器数量
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'category' || key === 'sortBy' || key === 'sortOrder') return false;
    return value && value !== 'all' && value !== '';
  }).length;

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 主筛选栏 */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* 搜索框 */}
        <div className="flex-1 w-full sm:w-auto">
          <SearchInput
            value={filters.search || ''}
            onChange={handleSearchChange}
            onSearch={handleSearchSubmit}
            placeholder="搜索任务标题、班级..."
            suggestions={searchSuggestions}
            searchHistory={searchHistory}
            onClearHistory={onClearSearchHistory}
          />
        </div>

        {/* 筛选器控制按钮 */}
        <div className="flex items-center gap-2">
          {/* 高级筛选切换 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleAdvanced}
            className={`${showAdvanced ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
          >
            🏷️ 筛选
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {/* 清空筛选 */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              清空
            </Button>
          )}
        </div>
      </div>

      {/* 快速筛选器 */}
      {quickFilters.length > 0 && (
        <QuickFilters
          filters={quickFilters}
          activeFilter={activeQuickFilter}
          onFilterChange={handleQuickFilterChange}
        />
      )}

      {/* 搜索结果统计 */}
      <SearchResult
        total={totalCount}
        filtered={filteredCount}
        searchQuery={filters.search}
        hasActiveFilters={hasActiveFilters}
        onClearAll={clearAllFilters}
      />

      {/* 高级筛选器占位（后续步骤实现） */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                高级筛选器 - 将在第4步实现
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}