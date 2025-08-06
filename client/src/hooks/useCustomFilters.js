// src/hooks/useCustomFilters.js
import { useState, useEffect, useCallback } from 'react';
import { getFilterDisplayText } from '../utils/filterUtils';

// 本地存储键名
const CUSTOM_FILTERS_KEY = 'customFilters';
const MAX_CUSTOM_FILTERS = 10; // 最多保存10个自定义筛选器

// 默认自定义筛选器示例
const defaultCustomFilters = {
  teacher: [
    {
      id: 'urgent_unsubmitted',
      name: '紧急未提交',
      description: '今天截止且提交率低于50%的任务',
      icon: '🚨',
      color: 'red',
      filters: {
        deadline: 'today',
        submissionRate: 'low'
      },
      isDefault: true,
      createdAt: new Date('2024-01-01').toISOString(),
      usageCount: 0
    },
    {
      id: 'aigc_homework',
      name: 'AIGC作业',
      description: '允许使用AIGC且需要文件的任务',
      icon: '🤖',
      color: 'blue',
      filters: {
        allowAIGC: 'true',
        needsFile: 'true'
      },
      isDefault: true,
      createdAt: new Date('2024-01-01').toISOString(),
      usageCount: 0
    }
  ],
  student: [
    {
      id: 'my_pending',
      name: '我的待办',
      description: '未提交且24小时内截止的任务',
      icon: '📝',
      color: 'orange',
      filters: {
        submitted: 'false',
        deadline: 'next24hours'
      },
      isDefault: true,
      createdAt: new Date('2024-01-01').toISOString(),
      usageCount: 0
    },
    {
      id: 'completed_tasks',
      name: '已完成',
      description: '我已提交的所有任务',
      icon: '✅',
      color: 'green',
      filters: {
        submitted: 'true'
      },
      isDefault: true,
      createdAt: new Date('2024-01-01').toISOString(),
      usageCount: 0
    }
  ]
};

export function useCustomFilters(userRole = 'student') {
  const [customFilters, setCustomFilters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 从localStorage加载自定义筛选器
  const loadCustomFilters = useCallback(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_FILTERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const userFilters = parsed[userRole] || [];
        setCustomFilters(userFilters);
      } else {
        // 首次使用，加载默认筛选器
        const defaults = defaultCustomFilters[userRole] || [];
        setCustomFilters(defaults);
        saveCustomFilters(defaults);
      }
    } catch (error) {
      console.error('加载自定义筛选器失败:', error);
      const defaults = defaultCustomFilters[userRole] || [];
      setCustomFilters(defaults);
    } finally {
      setIsLoading(false);
    }
  }, [userRole]);

  // 保存自定义筛选器到localStorage
  const saveCustomFilters = useCallback((filters) => {
    try {
      const stored = localStorage.getItem(CUSTOM_FILTERS_KEY);
      const allFilters = stored ? JSON.parse(stored) : {};
      allFilters[userRole] = filters;
      localStorage.setItem(CUSTOM_FILTERS_KEY, JSON.stringify(allFilters));
    } catch (error) {
      console.error('保存自定义筛选器失败:', error);
    }
  }, [userRole]);

  // 初始化加载
  useEffect(() => {
    loadCustomFilters();
  }, [loadCustomFilters]);

  // 创建新的自定义筛选器
  const createCustomFilter = useCallback((filterData) => {
    if (customFilters.length >= MAX_CUSTOM_FILTERS) {
      throw new Error(`最多只能保存 ${MAX_CUSTOM_FILTERS} 个自定义筛选器`);
    }

    const newFilter = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: filterData.name.trim(),
      description: filterData.description?.trim() || '',
      icon: filterData.icon || '🔖',
      color: filterData.color || 'blue',
      filters: { ...filterData.filters },
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };

    const updatedFilters = [...customFilters, newFilter];
    setCustomFilters(updatedFilters);
    saveCustomFilters(updatedFilters);
    
    return newFilter;
  }, [customFilters, saveCustomFilters]);

  // 更新自定义筛选器
  const updateCustomFilter = useCallback((filterId, updates) => {
    const updatedFilters = customFilters.map(filter => {
      if (filter.id === filterId) {
        return {
          ...filter,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return filter;
    });

    setCustomFilters(updatedFilters);
    saveCustomFilters(updatedFilters);
  }, [customFilters, saveCustomFilters]);

  // 删除自定义筛选器
  const deleteCustomFilter = useCallback((filterId) => {
    const updatedFilters = customFilters.filter(filter => {
      // 不能删除默认筛选器
      if (filter.isDefault) return true;
      return filter.id !== filterId;
    });

    setCustomFilters(updatedFilters);
    saveCustomFilters(updatedFilters);
  }, [customFilters, saveCustomFilters]);

  // 应用自定义筛选器（增加使用计数）
  const applyCustomFilter = useCallback((filterId) => {
    const filter = customFilters.find(f => f.id === filterId);
    if (!filter) return null;

    // 增加使用计数
    updateCustomFilter(filterId, {
      usageCount: filter.usageCount + 1,
      lastUsedAt: new Date().toISOString()
    });

    return filter.filters;
  }, [customFilters, updateCustomFilter]);

  // 复制自定义筛选器
  const duplicateCustomFilter = useCallback((filterId) => {
    const originalFilter = customFilters.find(f => f.id === filterId);
    if (!originalFilter) return null;

    const duplicatedFilter = {
      ...originalFilter,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${originalFilter.name} 副本`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };

    const updatedFilters = [...customFilters, duplicatedFilter];
    setCustomFilters(updatedFilters);
    saveCustomFilters(updatedFilters);
    
    return duplicatedFilter;
  }, [customFilters, saveCustomFilters]);

  // 重命名自定义筛选器
  const renameCustomFilter = useCallback((filterId, newName) => {
    updateCustomFilter(filterId, { name: newName.trim() });
  }, [updateCustomFilter]);

  // 导出自定义筛选器
  const exportCustomFilters = useCallback(() => {
    const exportData = {
      version: '1.0',
      userRole,
      exportedAt: new Date().toISOString(),
      filters: customFilters.filter(f => !f.isDefault) // 只导出非默认筛选器
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom-filters-${userRole}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [customFilters, userRole]);

  // 导入自定义筛选器
  const importCustomFilters = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          // 验证导入数据格式
          if (!importData.filters || !Array.isArray(importData.filters)) {
            throw new Error('无效的导入文件格式');
          }

          // 过滤重复的筛选器（根据名称）
          const existingNames = new Set(customFilters.map(f => f.name));
          const newFilters = importData.filters.filter(f => !existingNames.has(f.name));

          if (newFilters.length === 0) {
            resolve({ imported: 0, skipped: importData.filters.length });
            return;
          }

          // 检查数量限制
          if (customFilters.length + newFilters.length > MAX_CUSTOM_FILTERS) {
            throw new Error(`导入失败：筛选器总数不能超过 ${MAX_CUSTOM_FILTERS} 个`);
          }

          // 处理导入的筛选器
          const processedFilters = newFilters.map(filter => ({
            ...filter,
            id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            isDefault: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 0
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

  // 重置到默认筛选器
  const resetToDefault = useCallback(() => {
    const defaults = defaultCustomFilters[userRole] || [];
    setCustomFilters(defaults);
    saveCustomFilters(defaults);
  }, [userRole, saveCustomFilters]);

  // 获取筛选器统计信息
  const getFilterStats = useCallback(() => {
    const total = customFilters.length;
    const custom = customFilters.filter(f => !f.isDefault).length;
    const mostUsed = customFilters.reduce((prev, current) => {
      return (prev.usageCount > current.usageCount) ? prev : current;
    }, customFilters[0] || null);

    return {
      total,
      custom,
      default: total - custom,
      mostUsed,
      canCreateMore: custom < MAX_CUSTOM_FILTERS
    };
  }, [customFilters]);

  // 搜索和过滤自定义筛选器
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