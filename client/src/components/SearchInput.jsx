// src/components/SearchInput.jsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchInput({
  value = '',
  onChange,
  onSearch,
  placeholder = '搜索...',
  suggestions = [],
  searchHistory = [],
  onClearHistory,
  className = ''
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);

  // 组合建议列表（历史记录 + 动态建议）
  const allSuggestions = value.trim() ? suggestions : searchHistory;

  // 处理输入变化
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
    
    // 显示建议
    setShowSuggestions(true);
  };

  // 处理建议选择
  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion);
    onSearch?.(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  // 清空搜索
  const clearSearch = () => {
    onChange('');
    onSearch?.('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // 处理搜索提交
  const handleSubmit = (searchValue = value) => {
    if (searchValue.trim()) {
      onSearch?.(searchValue);
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (!showSuggestions || allSuggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(allSuggestions[selectedIndex]);
        } else {
          handleSubmit();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 重置选中索引当建议列表变化时
  useEffect(() => {
    setSelectedIndex(-1);
  }, [allSuggestions.length]);

  return (
    <div className={`relative ${className}`}>
      {/* 搜索输入框 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-4 w-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-10 py-2.5 
            text-sm text-gray-900 dark:text-gray-100
            bg-white/70 dark:bg-gray-700/70 
            border border-gray-300/40 dark:border-gray-600/40
            rounded-xl shadow-sm backdrop-blur-sm
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
            hover:border-gray-400/60 dark:hover:border-gray-500/60
            transition-all duration-200
            ${isFocused ? 'bg-white dark:bg-gray-700 shadow-md' : ''}
          `}
        />

        {/* 清空按钮 */}
        {value && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 搜索建议下拉 */}
      <AnimatePresence>
        {showSuggestions && allSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 z-50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* 搜索建议头部 */}
              {!value.trim() && searchHistory.length > 0 && (
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      搜索记录
                    </span>
                    {onClearHistory && (
                      <button
                        onClick={onClearHistory}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        清空
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 建议列表 */}
              <div className="py-1 max-h-64 overflow-y-auto">
                {allSuggestions.map((suggestion, index) => {
                  const isSelected = selectedIndex === index;
                  const isFromHistory = !value.trim() && searchHistory.includes(suggestion);
                  
                  return (
                    <button
                      key={`${suggestion}-${index}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`
                        w-full px-4 py-2.5 text-left text-sm transition-colors
                        ${isSelected 
                          ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {isFromHistory ? (
                          <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        )}
                        <span className="flex-1 truncate">{suggestion}</span>
                        {isSelected && (
                          <svg className="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 搜索提示 */}
              {value.trim() && (
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>按 Enter 键搜索 "{value}"</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}