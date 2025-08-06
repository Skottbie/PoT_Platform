// src/hooks/useFilters.js (修复版本)
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
  sortOrder: 'asc',
  // 高级筛选字段
  createdDateRange: null,
  deadlineRange: null,
  allowAIGC: 'all',
  needsFile: 'all',
  allowLateSubmission: 'all'
};

// URL同步的参数列表
const urlSyncParams = ['category', 'classId', 'deadline', 'submitted', 'taskType', 'search', 'sortBy', 'sortOrder'];

// 复杂对象的URL序列化工具
const serializeComplexParam = (value) => {
  if (!value) return null;
  try {
    return btoa(JSON.stringify(value));
  } catch {
    return null;
  }
};

const deserializeComplexParam = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(atob(value));
  } catch {
    return null;
  }
};

export function useFilters(initialFilters = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 从URL初始化筛选状态
  const initializeFromURL = useCallback(() => {
    const urlFilters = { ...defaultFilters, ...initialFilters };
    
    // 处理简单参数
    urlSyncParams.forEach(param => {
      const urlValue = searchParams.get(param);
      if (urlValue) {
        urlFilters[param] = urlValue;
      }
    });
    
    // 处理复杂参数（日期范围等）
    const deadlineRange = searchParams.get('deadlineRange');
    if (deadlineRange) {
      const parsed = deserializeComplexParam(deadlineRange);
      if (parsed && parsed.startDate && parsed.endDate) {
        urlFilters.deadlineRange = {
          startDate: new Date(parsed.startDate),
          endDate: new Date(parsed.endDate)
        };
      }
    }
    
    const createdDateRange = searchParams.get('createdDateRange');
    if (createdDateRange) {
      const parsed = deserializeComplexParam(createdDateRange);
      if (parsed && parsed.startDate && parsed.endDate) {
        urlFilters.createdDateRange = {
          startDate: new Date(parsed.startDate),
          endDate: new Date(parsed.endDate)
        };
      }
    }
    
    return urlFilters;
  }, [searchParams, initialFilters]);

  const [filters, setFilters] = useState(initializeFromURL);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // 更新筛选器并同步URL
  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    
    // 同步到URL
    const params = new URLSearchParams();
    
    // 处理简单参数
    urlSyncParams.forEach(param => {
      const value = newFilters[param];
      if (value && value !== 'all' && value !== '') {
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

  // 计算高级筛选器激活状态
  const hasAdvancedFilters = useMemo(() => {
    return (
      (filters.allowAIGC && filters.allowAIGC !== 'all') ||
      (filters.needsFile && filters.needsFile !== 'all') ||
      (filters.allowLateSubmission && filters.allowLateSubmission !== 'all') ||
      filters.deadlineRange ||
      filters.createdDateRange
    );
  }, [filters]);

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

// 🔧 修复：使用筛选和排序的Hook（支持高级筛选）
export function useTaskFiltering(tasks = [], classes = [], submissions = []) {
  const {
    filters,
    updateFilters,
    resetFilters,
    showAdvancedFilters,
    toggleAdvancedFilters,
    hasAdvancedFilters
  } = useFilters();

  // 🔧 修复：应用筛选和排序
  const { filteredTasks, stats } = useMemo(() => {
    console.log('🔍 筛选任务 - 输入:', { 
      tasksCount: tasks.length, 
      filters, 
      classesCount: classes.length,
      submissionsCount: submissions.length 
    });

    // 验证数据有效性
    if (!Array.isArray(tasks)) {
      console.warn('⚠️ tasks 不是数组:', tasks);
      return { filteredTasks: [], stats: { total: 0, filtered: 0, hasActiveFilters: false, hasAdvancedFilters: false } };
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
        console.log('🔍 AIGC筛选后:', filtered.length);
      }
      
      if (filters.needsFile && filters.needsFile !== 'all') {
        const needsFile = filters.needsFile === 'true';
        filtered = filtered.filter(task => task.needsFile === needsFile);
        console.log('🔍 文件筛选后:', filtered.length);
      }
      
      if (filters.allowLateSubmission && filters.allowLateSubmission !== 'all') {
        const allowLateSubmission = filters.allowLateSubmission === 'true';
        filtered = filtered.filter(task => task.allowLateSubmission === allowLateSubmission);
        console.log('🔍 逾期筛选后:', filtered.length);
      }
      
      // 日期范围筛选
      if (filters.deadlineRange && filters.deadlineRange.startDate && filters.deadlineRange.endDate) {
        const startTime = filters.deadlineRange.startDate.getTime();
        const endTime = filters.deadlineRange.endDate.getTime();
        filtered = filtered.filter(task => {
          const taskDeadline = new Date(task.deadline).getTime();
          return taskDeadline >= startTime && taskDeadline <= endTime;
        });
        console.log('🔍 截止日期范围筛选后:', filtered.length);
      }
      
      if (filters.createdDateRange && filters.createdDateRange.startDate && filters.createdDateRange.endDate) {
        const startTime = filters.createdDateRange.startDate.getTime();
        const endTime = filters.createdDateRange.endDate.getTime();
        filtered = filtered.filter(task => {
          const taskCreated = new Date(task.createdAt).getTime();
          return taskCreated >= startTime && taskCreated <= endTime;
        });
        console.log('🔍 创建日期范围筛选后:', filtered.length);
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
        console.log('🔍 搜索筛选后:', filtered.length);
      }
      
      // 应用排序
      const sorted = sortTasks(filtered, filters.sortBy, filters.sortOrder);
      console.log('🔍 排序后:', sorted.length);
      
      // 统计信息
      const stats = {
        total: tasks.length,
        filtered: sorted.length,
        hasActiveFilters: Object.entries(filters).some(([key, value]) => {
          if (key === 'category' || key === 'sortBy' || key === 'sortOrder') return false;
          if (key === 'createdDateRange' || key === 'deadlineRange') return !!value;
          return value && value !== 'all' && value !== '';
        }),
        hasAdvancedFilters
      };
      
      console.log('🔍 筛选统计:', stats);
      return { filteredTasks: sorted, stats };
    } catch (error) {
      console.error('❌ 筛选过程出错:', error);
      return { 
        filteredTasks: tasks, 
        stats: { 
          total: tasks.length, 
          filtered: tasks.length, 
          hasActiveFilters: false, 
          hasAdvancedFilters: false 
        } 
      };
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