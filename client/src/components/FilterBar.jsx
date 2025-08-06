// src/components/FilterBar.jsx (第6步移动端优化版本)
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
  className = '',
  // 新增：用户角色和班级数据
  userRole = 'student',
  classes = []
}) {
  const [activeQuickFilter, setActiveQuickFilter] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      sortOrder: 'asc',
      // 重置高级筛选
      createdDateRange: null,
      deadlineRange: null,
      allowAIGC: 'all',
      needsFile: 'all',
      allowLateSubmission: 'all'
    });
  };

  // 计算当前激活的筛选器数量
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'category' || key === 'sortBy' || key === 'sortOrder') return false;
    if (key === 'createdDateRange' || key === 'deadlineRange') return !!value;
    return value && value !== 'all' && value !== '';
  }).length;

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 桌面端布局 */}
      <div className="hidden sm:block">
        {/* 主筛选栏 */}
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          {/* 搜索框 */}
          <div className="flex-1 w-full lg:w-auto">
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
          <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-start">
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
            currentFilters={filters}
            userRole={userRole}
            classes={classes}
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
      </div>

      {/* 移动端布局 */}
      <div className="block sm:hidden">
        {/* 移动端主控制栏 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <SearchInput
              value={filters.search || ''}
              onChange={handleSearchChange}
              onSearch={handleSearchSubmit}
              placeholder="搜索任务..."
              suggestions={searchSuggestions}
              searchHistory={searchHistory}
              onClearHistory={onClearSearchHistory}
              className="w-full"
            />
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`px-3 ${isMobileMenuOpen || hasActiveFilters ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* 移动端筛选菜单 */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl p-4 shadow-lg space-y-4">
                {/* 移动端操作按钮 */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    筛选选项
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onToggleAdvanced}
                      className={`text-xs ${showAdvanced ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                    >
                      高级筛选
                    </Button>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-xs text-red-600 dark:text-red-400"
                      >
                        清空
                      </Button>
                    )}
                  </div>
                </div>

                {/* 移动端快速筛选器 */}
                {quickFilters.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      快速筛选
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {quickFilters.map((filter) => {
                        const isActive = activeQuickFilter === filter.id;
                        return (
                          <button
                            key={filter.id}
                            onClick={() => handleQuickFilterChange(filter.id, filter.filter)}
                            className={`
                              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                              transition-all duration-200 text-left
                              ${isActive 
                                ? 'bg-blue-500 text-white shadow-md' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }
                            `}
                          >
                            <span className="text-base leading-none">{filter.icon}</span>
                            <span className="truncate">{filter.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 关闭按钮 */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                    fullWidth
                  >
                    收起筛选
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 移动端搜索结果统计 */}
        <div className="mt-3">
          <SearchResult
            total={totalCount}
            filtered={filteredCount}
            searchQuery={filters.search}
            hasActiveFilters={hasActiveFilters}
            onClearAll={clearAllFilters}
          />
        </div>
      </div>
    </div>
  );
}