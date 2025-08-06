// src/hooks/useFilters.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { filterTasks, sortTasks } from '../utils/filterUtils';

// 默认筛选状态
const defaultFilters = {
  category: 'active',
  classId: 'all',
  deadline: 'all',
  submitted: 'all',
  taskType: 'all',
  search: '',
  sortBy: 'deadline',
  sortOrder: 'asc'
};

// URL同步的参数列表
const urlSyncParams = ['category', 'classId', 'deadline', 'submitted', 'taskType', 'search'];

export function useFilters(initialFilters = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 从URL初始化筛选状态
  const initializeFromURL = useCallback(() => {
    const urlFilters = { ...defaultFilters, ...initialFilters };
    
    urlSyncParams.forEach(param => {
      const urlValue = searchParams.get(param);
      if (urlValue) {
        urlFilters[param] = urlValue;
      }
    });
    
    return urlFilters;
  }, [searchParams, initialFilters]);

  const [filters, setFilters] = useState(initializeFromURL);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // 更新筛选器并同步URL
  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    
    // 同步到URL
    const params = new URLSearchParams();
    
    urlSyncParams.forEach(param => {
      const value = newFilters[param];
      if (value && value !== 'all' && value !== '') {
        params.set(param, value);
      }
    });
    
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // 重置筛选器
  const resetFilters = useCallback(() => {
    const resetFilters = { ...defaultFilters, ...initialFilters };
    updateFilters(resetFilters);
  }, [updateFilters, initialFilters]);

  // 应用快速筛选
  const applyQuickFilter = useCallback((filterConfig) => {
    updateFilters({
      ...filters,
      ...filterConfig
    });
  }, [filters, updateFilters]);

  // 切换高级筛选器显示
  const toggleAdvancedFilters = useCallback(() => {
    setShowAdvancedFilters(prev => !prev);
  }, []);

  // URL变化时同步状态
  useEffect(() => {
    const urlFilters = initializeFromURL();
    setFilters(urlFilters);
  }, [initializeFromURL]);

  return {
    filters,
    updateFilters,
    resetFilters,
    applyQuickFilter,
    showAdvancedFilters,
    toggleAdvancedFilters
  };
}

// 使用筛选和排序的Hook
export function useTaskFiltering(tasks = [], classes = [], submissions = []) {
  const {
    filters,
    updateFilters,
    resetFilters,
    showAdvancedFilters,
    toggleAdvancedFilters
  } = useFilters();

  // 应用筛选和排序
  const { filteredTasks, stats } = useMemo(() => {
    // 应用筛选
    let filtered = filterTasks(tasks, filters, classes, submissions);
    
    // 应用搜索（在filterTasks基础上）
    if (filters.search && filters.search.trim()) {
      const searchTerms = filters.search.toLowerCase().split(/\s+/);
      filtered = filtered.filter(task => {
        const searchableText = [
          task.title || '',
          task.description || '',
          task.category || '',
          ...(task.classIds || []).map(cls => cls.name || ''),
        ].join(' ').toLowerCase();
        
        return searchTerms.every(term => searchableText.includes(term));
      });
    }
    
    // 应用排序
    const sorted = sortTasks(filtered, filters.sortBy, filters.sortOrder);
    
    // 统计信息
    const stats = {
      total: tasks.length,
      filtered: sorted.length,
      hasActiveFilters: Object.entries(filters).some(([key, value]) => {
        if (key === 'category' || key === 'sortBy' || key === 'sortOrder') return false;
        return value && value !== 'all' && value !== '';
      })
    };
    
    return { filteredTasks: sorted, stats };
  }, [tasks, filters, classes, submissions]);

  return {
    filters,
    updateFilters,
    resetFilters,
    showAdvancedFilters,
    toggleAdvancedFilters,
    filteredTasks,
    stats
  };
}

// 更新的筛选器配置 - 增加更多选项
export const teacherQuickFilters = [
  {
    id: 'today_deadline',
    label: '今天截止',
    icon: '⏰',
    filter: { deadline: 'today' }
  },
  {
    id: 'need_attention',
    label: '需要关注',
    icon: '🚨',
    filter: { status: 'needAttention' }
  },
  {
    id: 'low_submission',
    label: '提交率偏低',
    icon: '📉',
    filter: { submissionRate: 'low' }
  },
  {
    id: 'this_week',
    label: '本周截止',
    icon: '📅',
    filter: { deadline: 'thisWeek' }
  },
  {
    id: 'overdue',
    label: '已过期',
    icon: '🔴',
    filter: { deadline: 'overdue' }
  }
];

export const studentQuickFilters = [
  {
    id: 'not_submitted',
    label: '未提交',
    icon: '📝',
    filter: { submitted: 'false' }
  },
  {
    id: 'due_soon',
    label: '即将截止',
    icon: '🔥',
    filter: { deadline: 'next24hours' }
  },
  {
    id: 'today_deadline',
    label: '今天截止',
    icon: '⏰',
    filter: { deadline: 'today' }
  },
  {
    id: 'submitted',
    label: '已完成',
    icon: '✅',
    filter: { submitted: 'true' }
  },
  {
    id: 'overdue_allowed',
    label: '逾期可提交',
    icon: '⚠️',
    filter: { deadline: 'overdue', status: 'lateAllowed' }
  }
];