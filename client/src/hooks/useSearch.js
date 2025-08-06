// src/hooks/useSearch.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

// 搜索历史记录管理
const SEARCH_HISTORY_KEY = 'taskSearchHistory';
const MAX_HISTORY_ITEMS = 5;

export function useSearch(tasks = [], searchFields = ['title', 'description']) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

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

  // 保存搜索历史
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

  // 生成搜索建议
  const generateSuggestions = useCallback((query, tasks, classes = []) => {
    if (!query.trim() || query.length < 1) {
      return searchHistory;
    }

    const queryLower = query.toLowerCase();
    const suggestions = new Set();

    // 从任务中提取建议
    tasks.forEach(task => {
      // 任务标题匹配
      if (task.title && task.title.toLowerCase().includes(queryLower)) {
        suggestions.add(task.title);
      }

      // 任务描述匹配（部分匹配）
      if (task.description) {
        const words = task.description.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.includes(queryLower) && word.length > 2) {
            suggestions.add(word);
          }
        });
      }

      // 班级名称匹配
      if (task.classIds && Array.isArray(task.classIds)) {
        task.classIds.forEach(cls => {
          if (cls.name && cls.name.toLowerCase().includes(queryLower)) {
            suggestions.add(cls.name);
          }
        });
      }

      // 任务类型匹配
      if (task.category && task.category.toLowerCase().includes(queryLower)) {
        suggestions.add(task.category);
      }
    });

    // 从班级列表中提取建议
    classes.forEach(cls => {
      if (cls.name && cls.name.toLowerCase().includes(queryLower)) {
        suggestions.add(cls.name);
      }
    });

    // 结合搜索历史
    const historySuggestions = searchHistory.filter(item => 
      item.toLowerCase().includes(queryLower)
    );

    const allSuggestions = [...historySuggestions, ...Array.from(suggestions)];
    return [...new Set(allSuggestions)].slice(0, 8);
  }, [searchHistory]);

  // 防抖的建议生成
  const debouncedGenerateSuggestions = useMemo(
    () => debounce((query, tasks, classes) => {
      const newSuggestions = generateSuggestions(query, tasks, classes);
      setSuggestions(newSuggestions);
    }, 150),
    [generateSuggestions]
  );

  // 更新搜索建议
  const updateSuggestions = useCallback((query, tasks, classes = []) => {
    debouncedGenerateSuggestions(query, tasks, classes);
  }, [debouncedGenerateSuggestions]);

  // 执行搜索
  const performSearch = useCallback((query) => {
    setSearchQuery(query);
    if (query.trim() && query.length >= 2) {
      saveSearchHistory(query);
    }
  }, [saveSearchHistory]);

  // 清空搜索历史
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  }, []);

  // 搜索过滤函数
  const filterTasks = useCallback((tasks, query) => {
    if (!query.trim()) return tasks;

    const queryLower = query.toLowerCase();
    const searchTerms = queryLower.split(/\s+/).filter(term => term.length > 0);

    return tasks.filter(task => {
      // 构建搜索文本
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
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">$1</mark>');
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