// src/hooks/useSearch.js (修复版本 - 解决防抖循环和性能优化)
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { debounce } from 'lodash';

// 搜索历史记录管理
const SEARCH_HISTORY_KEY = 'taskSearchHistory';
const MAX_HISTORY_ITEMS = 5;

export function useSearch(tasks = [], searchFields = ['title', 'description']) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // 🔧 修复：使用ref缓存之前的输入，避免无限循环
  const prevTasksRef = useRef([]);
  const prevSearchFieldsRef = useRef(searchFields);

  // 从localStorage加载搜索历史
  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
      setSearchHistory(history);
    } catch (error) {
      console.error('加载搜索历史失败:', error);
      setSearchHistory([]);
    }
  }, []);

  // 🔧 修复：稳定的保存搜索历史函数
  const saveSearchHistory = useCallback((query) => {
    if (!query.trim() || query.length < 2) return;

    setSearchHistory(prev => {
      const filtered = prev.filter(item => item !== query);
      const newHistory = [query, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error('保存搜索历史失败:', error);
      }
      
      return newHistory;
    });
  }, []);

  // 🔧 修复：优化的搜索建议生成函数，使用缓存
  const generateSuggestions = useCallback((query, taskList, classes = []) => {
    if (!query.trim() || query.length < 1) {
      return searchHistory;
    }

    const queryLower = query.toLowerCase();
    const suggestionSet = new Set();

    // 限制处理的任务数量，避免性能问题
    const maxTasks = Math.min(taskList.length, 100);
    
    // 从任务中提取建议
    for (let i = 0; i < maxTasks; i++) {
      const task = taskList[i];
      
      // 任务标题匹配
      if (task.title && task.title.toLowerCase().includes(queryLower)) {
        suggestionSet.add(task.title);
        if (suggestionSet.size >= 6) break; // 限制建议数量
      }

      // 任务类型匹配
      if (task.category && task.category.toLowerCase().includes(queryLower)) {
        suggestionSet.add(task.category);
        if (suggestionSet.size >= 6) break;
      }

      // 班级名称匹配
      if (task.classIds && Array.isArray(task.classIds)) {
        for (const cls of task.classIds) {
          if (cls.name && cls.name.toLowerCase().includes(queryLower)) {
            suggestionSet.add(cls.name);
            if (suggestionSet.size >= 6) break;
          }
        }
        if (suggestionSet.size >= 6) break;
      }
    }

    // 从班级列表中提取建议
    for (const cls of classes.slice(0, 20)) { // 限制班级数量
      if (cls.name && cls.name.toLowerCase().includes(queryLower)) {
        suggestionSet.add(cls.name);
        if (suggestionSet.size >= 8) break;
      }
    }

    // 结合搜索历史
    const historySuggestions = searchHistory.filter(item => 
      item.toLowerCase().includes(queryLower)
    );

    const allSuggestions = [...historySuggestions, ...Array.from(suggestionSet)];
    return [...new Set(allSuggestions)].slice(0, 8);
  }, [searchHistory]);

  // 🔧 修复：防抖的建议生成，避免重复创建
  const debouncedGenerateSuggestions = useMemo(
    () => debounce((query, taskList, classes) => {
      // 只有在数据真正变化时才更新建议
      const tasksChanged = taskList !== prevTasksRef.current;
      const searchFieldsChanged = searchFields !== prevSearchFieldsRef.current;
      
      if (!query.trim()) {
        setSuggestions(searchHistory);
        return;
      }
      
      if (tasksChanged || searchFieldsChanged || query) {
        const newSuggestions = generateSuggestions(query, taskList, classes);
        setSuggestions(newSuggestions);
        
        // 更新引用
        prevTasksRef.current = taskList;
        prevSearchFieldsRef.current = searchFields;
      }
    }, 200), // 增加防抖时间，减少调用频率
    [generateSuggestions, searchHistory, searchFields]
  );

  // 🔧 修复：稳定的更新建议函数
  const updateSuggestions = useCallback((query, taskList, classes = []) => {
    // 防止不必要的调用
    if (!Array.isArray(taskList) || taskList.length === 0) {
      if (query.trim()) {
        setSuggestions(searchHistory);
      }
      return;
    }
    
    debouncedGenerateSuggestions(query, taskList, classes);
  }, [debouncedGenerateSuggestions, searchHistory]);

  // 🔧 修复：稳定的执行搜索函数
  const performSearch = useCallback((query) => {
    const trimmedQuery = query.trim();
    setSearchQuery(trimmedQuery);
    
    if (trimmedQuery && trimmedQuery.length >= 2) {
      saveSearchHistory(trimmedQuery);
    }
  }, [saveSearchHistory]);

  // 🔧 修复：稳定的清空搜索历史函数
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    setSuggestions([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('清空搜索历史失败:', error);
    }
  }, []);

  // 🔧 修复：优化的搜索过滤函数
  const filterTasks = useCallback((taskList, query) => {
    if (!query.trim() || !Array.isArray(taskList)) return taskList;

    const queryLower = query.toLowerCase();
    const searchTerms = queryLower.split(/\s+/).filter(term => term.length > 0);

    // 使用更高效的过滤逻辑
    return taskList.filter(task => {
      // 预先构建搜索文本，避免重复计算
      const searchableText = [
        task.title || '',
        task.description || '',
        task.category || '',
        ...(task.classIds || []).map(cls => cls.name || ''),
      ].join(' ').toLowerCase();

      // 检查是否所有搜索词都匹配
      return searchTerms.every(term => searchableText.includes(term));
    });
  }, []);

  // 清理防抖函数
  useEffect(() => {
    return () => {
      debouncedGenerateSuggestions.cancel();
    };
  }, [debouncedGenerateSuggestions]);

  return {
    searchQuery,
    setSearchQuery,
    searchHistory,
    suggestions,
    updateSuggestions,
    performSearch,
    clearSearchHistory,
    filterTasks
  };
}

// 高亮搜索结果的工具函数
export function highlightSearchText(text, query) {
  if (!query.trim() || !text) return text;
  
  try {
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">$1</mark>');
  } catch (error) {
    console.warn('高亮搜索文本失败:', error);
    return text;
  }
}

// 搜索结果统计
export function getSearchStats(originalCount, filteredCount, query) {
  if (!query.trim()) {
    return {
      total: originalCount,
      filtered: originalCount,
      hasFilter: false,
      message: `共 ${originalCount} 个任务`
    };
  }

  return {
    total: originalCount,
    filtered: filteredCount,
    hasFilter: true,
    message: filteredCount > 0 
      ? `找到 ${filteredCount} 个相关任务`
      : `未找到包含"${query}"的任务`
  };
}