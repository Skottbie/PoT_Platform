// src/hooks/useFilters.js (修复版本 - 解决无限循环和性能优化)
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { filterTasks, sortTasks } from '../utils/filterUtils';

// 默认筛选状态 - 使用常量避免重复创建
const DEFAULT_FILTERS = Object.freeze({
  category: 'active',
  classId: 'all',
  deadline: 'all',
  submitted: 'all',
  taskType: 'all',
  search: '',
  sortBy: 'deadline',
  sortOrder: 'asc',
  // 高级筛选字段
  createdDateRange: null,
  deadlineRange: null,
  allowAIGC: 'all',
  needsFile: 'all',
  allowLateSubmission: 'all'
});

// URL同步的参数列表
const URL_SYNC_PARAMS = ['category', 'classId', 'deadline', 'submitted', 'taskType', 'search', 'sortBy', 'sortOrder'];

// 🔧 修复：优化的序列化函数
const serializeComplexParam = (value) => {
  if (!value || typeof value !== 'object') return null;
  try {
    return btoa(encodeURIComponent(JSON.stringify(value)));
  } catch (error) {
    console.warn('序列化参数失败:', error);
    return null;
  }
};

const deserializeComplexParam = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(atob(value)));
  } catch (error) {
    console.warn('反序列化参数失败:', error);
    return null;
  }
};

// 🔧 修复：深度比较函数，避免不必要的重新计算
const deepEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (let key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
};

export function useFilters(initialFilters = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 🔧 修复：使用 useRef 存储上次的筛选状态，避免无限循环
  const prevFiltersRef = useRef(null);
  const prevInitialFiltersRef = useRef(initialFilters);
  
  // 🔧 修复：稳定化初始化函数
  const initializeFromURL = useCallback(() => {
    // 只有在 initialFilters 真正改变时才重新初始化
    if (deepEqual(initialFilters, prevInitialFiltersRef.current)) {
      return prevFiltersRef.current || { ...DEFAULT_FILTERS, ...initialFilters };
    }
    
    prevInitialFiltersRef.current = initialFilters;
    const urlFilters = { ...DEFAULT_FILTERS, ...initialFilters };
    
    // 处理简单参数
    URL_SYNC_PARAMS.forEach(param => {
      const urlValue = searchParams.get(param);
      if (urlValue && urlValue !== urlFilters[param]) {
        urlFilters[param] = urlValue;
      }
    });
    
    // 处理复杂参数（日期范围等）
    const deadlineRange = searchParams.get('deadlineRange');
    if (deadlineRange) {
      const parsed = deserializeComplexParam(deadlineRange);
      if (parsed && parsed.startDate && parsed.endDate) {
        try {
          urlFilters.deadlineRange = {
            startDate: new Date(parsed.startDate),
            endDate: new Date(parsed.endDate)
          };
        } catch (error) {
          console.warn('日期范围解析失败:', error);
        }
      }
    }
    
    const createdDateRange = searchParams.get('createdDateRange');
    if (createdDateRange) {
      const parsed = deserializeComplexParam(createdDateRange);
      if (parsed && parsed.startDate && parsed.endDate) {
        try {
          urlFilters.createdDateRange = {
            startDate: new Date(parsed.startDate),
            endDate: new Date(parsed.endDate)
          };
        } catch (error) {
          console.warn('创建日期范围解析失败:', error);
        }
      }
    }
    
    prevFiltersRef.current = urlFilters;
    return urlFilters;
  }, [searchParams, initialFilters]);

  const [filters, setFilters] = useState(initializeFromURL);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // 🔧 修复：防抖的URL更新函数
  const updateURLTimeoutRef = useRef(null);
  
  const updateURL = useCallback((newFilters) => {
    // 清除之前的定时器
    if (updateURLTimeoutRef.current) {
      clearTimeout(updateURLTimeoutRef.current);
    }
    
    // 防抖更新URL
    updateURLTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      
      // 处理简单参数
      URL_SYNC_PARAMS.forEach(param => {
        const value = newFilters[param];
        if (value && value !== 'all' && value !== '' && value !== DEFAULT_FILTERS[param]) {
          params.set(param, value);
        }
      });
      
      // 处理复杂参数
      if (newFilters.deadlineRange) {
        const serialized = serializeComplexParam(newFilters.deadlineRange);
        if (serialized) {
          params.set('deadlineRange', serialized);
        }
      }
      
      if (newFilters.createdDateRange) {
        const serialized = serializeComplexParam(newFilters.createdDateRange);
        if (serialized) {
          params.set('createdDateRange', serialized);
        }
      }
      
      setSearchParams(params, { replace: true });
    }, 300); // 300ms 防抖
  }, [setSearchParams]);

  // 🔧 修复：优化的筛选器更新函数
  const updateFilters = useCallback((newFilters) => {
    // 深度比较避免不必要的更新
    if (deepEqual(newFilters, prevFiltersRef.current)) {
      return;
    }
    
    setFilters(newFilters);
    prevFiltersRef.current = newFilters;
    updateURL(newFilters);
  }, [updateURL]);

  // 🔧 修复：稳定化重置函数
  const resetFilters = useCallback(() => {
    const resetFilters = { ...DEFAULT_FILTERS, ...initialFilters };
    updateFilters(resetFilters);
  }, [updateFilters, initialFilters]);

  // 🔧 修复：稳定化快速筛选函数
  const applyQuickFilter = useCallback((filterConfig) => {
    const newFilters = {
      ...filters,
      ...filterConfig
    };
    updateFilters(newFilters);
  }, [filters, updateFilters]);

  // 切换高级筛选器显示
  const toggleAdvancedFilters = useCallback(() => {
    setShowAdvancedFilters(prev => !prev);
  }, []);

  // 🔧 修复：优化高级筛选器激活状态计算
  const hasAdvancedFilters = useMemo(() => {
    return (
      (filters.allowAIGC && filters.allowAIGC !== 'all') ||
      (filters.needsFile && filters.needsFile !== 'all') ||
      (filters.allowLateSubmission && filters.allowLateSubmission !== 'all') ||
      !!filters.deadlineRange ||
      !!filters.createdDateRange
    );
  }, [filters.allowAIGC, filters.needsFile, filters.allowLateSubmission, filters.deadlineRange, filters.createdDateRange]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (updateURLTimeoutRef.current) {
        clearTimeout(updateURLTimeoutRef.current);
      }
    };
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters,
    applyQuickFilter,
    showAdvancedFilters,
    toggleAdvancedFilters,
    hasAdvancedFilters
  };
}

// 🔧 修复：高性能的任务筛选和排序Hook
export function useTaskFiltering(tasks = [], classes = [], submissions = []) {
  const {
    filters,
    updateFilters,
    resetFilters,
    showAdvancedFilters,
    toggleAdvancedFilters,
    hasAdvancedFilters
  } = useFilters();

  // 🔧 修复：使用稳定的引用和深度比较
  const prevTasksRef = useRef([]);
  const prevFiltersRef = useRef({});
  const prevClassesRef = useRef([]);
  const prevSubmissionsRef = useRef([]);
  const cachedResultRef = useRef(null);

  // 🔧 修复：高性能的筛选和排序计算
  const { filteredTasks, stats } = useMemo(() => {
    // 检查输入是否改变
    const tasksChanged = !deepEqual(tasks, prevTasksRef.current);
    const filtersChanged = !deepEqual(filters, prevFiltersRef.current);
    const classesChanged = !deepEqual(classes, prevClassesRef.current);
    const submissionsChanged = !deepEqual(submissions, prevSubmissionsRef.current);

    // 如果没有变化，返回缓存的结果
    if (!tasksChanged && !filtersChanged && !classesChanged && !submissionsChanged && cachedResultRef.current) {
      return cachedResultRef.current;
    }

    // 更新引用
    prevTasksRef.current = tasks;
    prevFiltersRef.current = filters;
    prevClassesRef.current = classes;
    prevSubmissionsRef.current = submissions;

    console.log('🔍 筛选任务 - 输入:', { 
      tasksCount: tasks.length, 
      filters: { ...filters, deadlineRange: filters.deadlineRange ? 'set' : 'null' },
      classesCount: classes.length,
      submissionsCount: submissions.length 
    });

    // 验证数据有效性
    if (!Array.isArray(tasks)) {
      console.warn('⚠️ tasks 不是数组:', tasks);
      const result = { 
        filteredTasks: [], 
        stats: { 
          total: 0, 
          filtered: 0, 
          hasActiveFilters: false, 
          hasAdvancedFilters: false 
        } 
      };
      cachedResultRef.current = result;
      return result;
    }

    let filtered = [...tasks]; // 创建副本避免修改原数组
    
    try {
      // 应用基础筛选
      filtered = filterTasks(filtered, filters, classes, submissions);
      console.log('🔍 基础筛选后:', filtered.length);
      
      // 应用高级筛选
      if (filters.allowAIGC && filters.allowAIGC !== 'all') {
        const allowAIGC = filters.allowAIGC === 'true';
        filtered = filtered.filter(task => task.allowAIGC === allowAIGC);
      }
      
      if (filters.needsFile && filters.needsFile !== 'all') {
        const needsFile = filters.needsFile === 'true';
        filtered = filtered.filter(task => task.needsFile === needsFile);
      }
      
      if (filters.allowLateSubmission && filters.allowLateSubmission !== 'all') {
        const allowLateSubmission = filters.allowLateSubmission === 'true';
        filtered = filtered.filter(task => task.allowLateSubmission === allowLateSubmission);
      }
      
      // 日期范围筛选
      if (filters.deadlineRange && filters.deadlineRange.startDate && filters.deadlineRange.endDate) {
        const startTime = filters.deadlineRange.startDate.getTime();
        const endTime = filters.deadlineRange.endDate.getTime();
        filtered = filtered.filter(task => {
          const taskDeadline = new Date(task.deadline).getTime();
          return taskDeadline >= startTime && taskDeadline <= endTime;
        });
      }
      
      if (filters.createdDateRange && filters.createdDateRange.startDate && filters.createdDateRange.endDate) {
        const startTime = filters.createdDateRange.startDate.getTime();
        const endTime = filters.createdDateRange.endDate.getTime();
        filtered = filtered.filter(task => {
          const taskCreated = new Date(task.createdAt).getTime();
          return taskCreated >= startTime && taskCreated <= endTime;
        });
      }
      
      // 应用搜索（在所有筛选基础上）
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
      console.log('🔍 排序后:', sorted.length);
      
      // 统计信息
      const stats = Object.freeze({
        total: tasks.length,
        filtered: sorted.length,
        hasActiveFilters: Object.entries(filters).some(([key, value]) => {
          if (['category', 'sortBy', 'sortOrder'].includes(key)) return false;
          if (key === 'createdDateRange' || key === 'deadlineRange') return !!value;
          return value && value !== 'all' && value !== '';
        }),
        hasAdvancedFilters
      });
      
      const result = Object.freeze({
        filteredTasks: Object.freeze(sorted),
        stats
      });
      
      console.log('🔍 筛选统计:', stats);
      cachedResultRef.current = result;
      return result;
    } catch (error) {
      console.error('❌ 筛选过程出错:', error);
      const result = { 
        filteredTasks: tasks, 
        stats: { 
          total: tasks.length, 
          filtered: tasks.length, 
          hasActiveFilters: false, 
          hasAdvancedFilters: false 
        } 
      };
      cachedResultRef.current = result;
      return result;
    }
  }, [tasks, filters, classes, submissions, hasAdvancedFilters]);

  return {
    filters,
    updateFilters,
    resetFilters,
    showAdvancedFilters,
    toggleAdvancedFilters,
    hasAdvancedFilters,
    filteredTasks,
    stats
  };
}

// 教师端快速筛选器配置
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
    filter: { deadline: 'next48hours' }
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
  },
  {
    id: 'allow_aigc',
    label: '允许AIGC',
    icon: '🤖',
    filter: { allowAIGC: 'true' }
  },
  {
    id: 'require_file',
    label: '要求文件',
    icon: '📎',
    filter: { needsFile: 'true' }
  }
];

// 学生端快速筛选器配置
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
    filter: { deadline: 'overdue', allowLateSubmission: 'true' }
  },
  {
    id: 'aigc_tasks',
    label: '可用AIGC',
    icon: '🤖',
    filter: { allowAIGC: 'true' }
  }
];