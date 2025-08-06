// src/hooks/useCustomFilters.js (依赖循环修复版本)
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getFilterDisplayText } from '../utils/filterUtils';

// 本地存储键名
const CUSTOM_FILTERS_KEY = 'customFilters';
const MAX_CUSTOM_FILTERS = 10;

// 🔧 修复：使用稳定的默认筛选器引用，避免每次重新创建
const createDefaultCustomFilters = () => ({
  teacher: Object.freeze([
    Object.freeze({
      id: 'urgent_unsubmitted',
      name: '紧急未提交',
      description: '今天截止且提交率低于50%的任务',
      icon: '🚨',
      color: 'red',
      filters: Object.freeze({
        deadline: 'today',
        submissionRate: 'low'
      }),
      isDefault: true,
      createdAt: new Date('2024-01-01').toISOString(),
      usageCount: 0
    }),
    Object.freeze({
      id: 'aigc_homework',
      name: 'AIGC作业',
      description: '允许使用AIGC且需要文件的任务',
      icon: '🤖',
      color: 'blue',
      filters: Object.freeze({
        allowAIGC: 'true',
        needsFile: 'true'
      }),
      isDefault: true,
      createdAt: new Date('2024-01-01').toISOString(),
      usageCount: 0
    })
  ]),
  student: Object.freeze([
    Object.freeze({
      id: 'my_pending',
      name: '我的待办',
      description: '未提交且24小时内截止的任务',
      icon: '📝',
      color: 'orange',
      filters: Object.freeze({
        submitted: 'false',
        deadline: 'next24hours'
      }),
      isDefault: true,
      createdAt: new Date('2024-01-01').toISOString(),
      usageCount: 0
    }),
    Object.freeze({
      id: 'completed_tasks',
      name: '已完成',
      description: '我已提交的所有任务',
      icon: '✅',
      color: 'green',
      filters: Object.freeze({
        submitted: 'true'
      }),
      isDefault: true,
      createdAt: new Date('2024-01-01').toISOString(),
      usageCount: 0
    })
  ])
});

// 🔧 修复：缓存默认筛选器，避免重复创建
let defaultFiltersCache = null;
const getDefaultCustomFilters = () => {
  if (!defaultFiltersCache) {
    defaultFiltersCache = createDefaultCustomFilters();
  }
  return defaultFiltersCache;
};

export function useCustomFilters(userRole = 'student') {
  const [customFilters, setCustomFilters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 🔧 修复：使用 ref 避免不必要的重新渲染
  const userRoleRef = useRef(userRole);
  const isInitializedRef = useRef(false);
  
  // 🔧 修复：稳定的 localStorage 操作函数
  const saveCustomFilters = useCallback((filters) => {
    try {
      const stored = localStorage.getItem(CUSTOM_FILTERS_KEY);
      const allFilters = stored ? JSON.parse(stored) : {};
      allFilters[userRoleRef.current] = filters;
      localStorage.setItem(CUSTOM_FILTERS_KEY, JSON.stringify(allFilters));
    } catch (error) {
      console.error('保存自定义筛选器失败:', error);
    }
  }, []);

  // 🔧 修复：优化的加载函数，避免重复执行
  const loadCustomFilters = useCallback(() => {
    if (isInitializedRef.current) return;
    
    try {
      const stored = localStorage.getItem(CUSTOM_FILTERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const userFilters = parsed[userRole] || [];
        setCustomFilters(userFilters);
      } else {
        const defaults = getDefaultCustomFilters()[userRole] || [];
        setCustomFilters(defaults);
        saveCustomFilters(defaults);
      }
    } catch (error) {
      console.error('加载自定义筛选器失败:', error);
      const defaults = getDefaultCustomFilters()[userRole] || [];
      setCustomFilters(defaults);
    } finally {
      setIsLoading(false);
      isInitializedRef.current = true;
    }
  }, [userRole, saveCustomFilters]);

  // 🔧 修复：只在首次加载时执行
  useEffect(() => {
    if (userRoleRef.current !== userRole) {
      userRoleRef.current = userRole;
      isInitializedRef.current = false;
    }
    loadCustomFilters();
  }, [userRole, loadCustomFilters]);

  // 🔧 修复：使用 useCallback 优化函数，避免重新创建
  const createCustomFilter = useCallback((filterData) => {
    if (customFilters.length >= MAX_CUSTOM_FILTERS) {
      throw new Error(`最多只能保存 ${MAX_CUSTOM_FILTERS} 个自定义筛选器`);
    }

    const newFilter = Object.freeze({
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: filterData.name.trim(),
      description: filterData.description?.trim() || '',
      icon: filterData.icon || '🔖',
      color: filterData.color || 'blue',
      filters: Object.freeze({ ...filterData.filters }),
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    });

    const updatedFilters = [...customFilters, newFilter];
    setCustomFilters(updatedFilters);
    saveCustomFilters(updatedFilters);
    
    return newFilter;
  }, [customFilters, saveCustomFilters]);

  const updateCustomFilter = useCallback((filterId, updates) => {
    const updatedFilters = customFilters.map(filter => {
      if (filter.id === filterId) {
        return Object.freeze({
          ...filter,
          ...updates,
          updatedAt: new Date().toISOString()
        });
      }
      return filter;
    });

    setCustomFilters(updatedFilters);
    saveCustomFilters(updatedFilters);
  }, [customFilters, saveCustomFilters]);

  const deleteCustomFilter = useCallback((filterId) => {
    const updatedFilters = customFilters.filter(filter => {
      if (filter.isDefault) return true;
      return filter.id !== filterId;
    });

    setCustomFilters(updatedFilters);
    saveCustomFilters(updatedFilters);
  }, [customFilters, saveCustomFilters]);

  const applyCustomFilter = useCallback((filterId) => {
    const filter = customFilters.find(f => f.id === filterId);
    if (!filter) return null;

    // 🔧 修复：使用 requestIdleCallback 优化性能
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => {
        updateCustomFilter(filterId, {
          usageCount: filter.usageCount + 1,
          lastUsedAt: new Date().toISOString()
        });
      });
    } else {
      // 回退到 setTimeout
      setTimeout(() => {
        updateCustomFilter(filterId, {
          usageCount: filter.usageCount + 1,
          lastUsedAt: new Date().toISOString()
        });
      }, 0);
    }

    return filter.filters;
  }, [customFilters, updateCustomFilter]);

  const duplicateCustomFilter = useCallback((filterId) => {
    const originalFilter = customFilters.find(f => f.id === filterId);
    if (!originalFilter) return null;

    const duplicatedFilter = Object.freeze({
      ...originalFilter,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${originalFilter.name} 副本`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    });

    const updatedFilters = [...customFilters, duplicatedFilter];
    setCustomFilters(updatedFilters);
    saveCustomFilters(updatedFilters);
    
    return duplicatedFilter;
  }, [customFilters, saveCustomFilters]);

  const renameCustomFilter = useCallback((filterId, newName) => {
    updateCustomFilter(filterId, { name: newName.trim() });
  }, [updateCustomFilter]);

  const exportCustomFilters = useCallback(() => {
    const exportData = {
      version: '1.0',
      userRole: userRoleRef.current,
      exportedAt: new Date().toISOString(),
      filters: customFilters.filter(f => !f.isDefault)
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom-filters-${userRoleRef.current}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [customFilters]);

  const importCustomFilters = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          if (!importData.filters || !Array.isArray(importData.filters)) {
            throw new Error('无效的导入文件格式');
          }

          const existingNames = new Set(customFilters.map(f => f.name));
          const newFilters = importData.filters.filter(f => !existingNames.has(f.name));

          if (newFilters.length === 0) {
            resolve({ imported: 0, skipped: importData.filters.length });
            return;
          }

          if (customFilters.length + newFilters.length > MAX_CUSTOM_FILTERS) {
            throw new Error(`导入失败：筛选器总数不能超过 ${MAX_CUSTOM_FILTERS} 个`);
          }

          const processedFilters = newFilters.map(filter => Object.freeze({
            ...filter,
            id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            isDefault: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 0,
            filters: Object.freeze(filter.filters || {})
          }));

          const updatedFilters = [...customFilters, ...processedFilters];
          setCustomFilters(updatedFilters);
          saveCustomFilters(updatedFilters);

          resolve({
            imported: newFilters.length,
            skipped: importData.filters.length - newFilters.length
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }, [customFilters, saveCustomFilters]);

  const resetToDefault = useCallback(() => {
    const defaults = getDefaultCustomFilters()[userRoleRef.current] || [];
    setCustomFilters(defaults);
    saveCustomFilters(defaults);
  }, [saveCustomFilters]);

  // 🔧 修复：使用 useMemo 缓存统计信息，避免重复计算
  const getFilterStats = useMemo(() => {
    const total = customFilters.length;
    const custom = customFilters.filter(f => !f.isDefault).length;
    const mostUsed = customFilters.reduce((prev, current) => {
      return (prev.usageCount > current.usageCount) ? prev : current;
    }, customFilters[0] || null);

    return Object.freeze({
      total,
      custom,
      default: total - custom,
      mostUsed,
      canCreateMore: custom < MAX_CUSTOM_FILTERS
    });
  }, [customFilters]);

  // 🔧 修复：优化搜索函数，使用缓存
  const searchCustomFilters = useCallback((query) => {
    if (!query.trim()) return customFilters;

    const searchTerm = query.toLowerCase();
    return customFilters.filter(filter => 
      filter.name.toLowerCase().includes(searchTerm) ||
      filter.description.toLowerCase().includes(searchTerm) ||
      getFilterDisplayText(filter.filters).join(' ').toLowerCase().includes(searchTerm)
    );
  }, [customFilters]);

  return {
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
  };
}