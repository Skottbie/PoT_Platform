// src/components/Select.jsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Select({
  value,
  onChange,
  options = [],
  placeholder = '请选择',
  disabled = false,
  showIcon = false,
  showBadge = false,
  multiple = false,
  searchable = false,
  className = '',
  error = false,
  size = 'md',
  variant = 'default'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const selectRef = useRef(null);
  const searchInputRef = useRef(null);

  // 处理外部点击关闭
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 自动聚焦搜索框
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // 过滤选项
  const filteredOptions = options.filter(option => 
    !searchQuery || 
    option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (option.searchTags && option.searchTags.some(tag => 
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  // 获取当前选中的选项
  const selectedOption = multiple 
    ? options.filter(opt => Array.isArray(value) && value.includes(opt.value))
    : options.find(opt => opt.value === value);

  // 处理选择
  const handleSelect = (optionValue) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    }
    setSelectedIndex(-1);
  };

  // 键盘导航
  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(filteredOptions[selectedIndex].value);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        setSelectedIndex(-1);
        break;
    }
  };

  // 样式配置
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const variantStyles = {
    default: 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
    filled: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    ghost: 'bg-transparent border-gray-200 dark:border-gray-700'
  };

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      {/* 选择器按钮 */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2 
          ${sizeStyles[size]} ${variantStyles[variant]}
          border rounded-lg transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
          hover:border-gray-400 dark:hover:border-gray-500
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'ring-2 ring-blue-500/50 border-blue-500' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* 显示选中内容 */}
          {multiple ? (
            Array.isArray(value) && value.length > 0 ? (
              <div className="flex items-center gap-1 flex-wrap">
                {value.slice(0, 2).map(val => {
                  const opt = options.find(o => o.value === val);
                  return opt ? (
                    <span
                      key={val}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-md"
                    >
                      {showIcon && opt.icon && <span>{opt.icon}</span>}
                      {opt.label}
                    </span>
                  ) : null;
                })}
                {value.length > 2 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{value.length - 2} 更多
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 truncate">
                {placeholder}
              </span>
            )
          ) : (
            selectedOption ? (
              <div className="flex items-center gap-2 truncate">
                {showIcon && selectedOption.icon && (
                  <span className="flex-shrink-0">{selectedOption.icon}</span>
                )}
                <span className="truncate">{selectedOption.label}</span>
                {showBadge && selectedOption.badge !== undefined && (
                  <span className="flex-shrink-0 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                    {selectedOption.badge}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 truncate">
                {placeholder}
              </span>
            )
          )}
        </div>

        {/* 箭头图标 */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      {/* 下拉选项 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 z-50"
          >
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg backdrop-blur-xl overflow-hidden">
              {/* 搜索框 */}
              {searchable && (
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索选项..."
                    className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* 选项列表 */}
              <div className="max-h-60 overflow-y-auto">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, index) => {
                    const isSelected = multiple 
                      ? Array.isArray(value) && value.includes(option.value)
                      : option.value === value;
                    const isHighlighted = selectedIndex === index;

                    return (
                      <button
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors
                          ${isHighlighted 
                            ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                            : isSelected
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }
                        `}
                      >
                        {/* 多选复选框 */}
                        {multiple && (
                          <div className={`
                            w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0
                            ${isSelected 
                              ? 'bg-blue-500 border-blue-500' 
                              : 'border-gray-300 dark:border-gray-600'
                            }
                          `}>
                            {isSelected && (
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        )}

                        {/* 图标 */}
                        {showIcon && option.icon && (
                          <span className="flex-shrink-0">{option.icon}</span>
                        )}

                        {/* 标签 */}
                        <span className="flex-1 truncate">{option.label}</span>

                        {/* 徽章 */}
                        {showBadge && option.badge !== undefined && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                            {option.badge}
                          </span>
                        )}

                        {/* 描述 */}
                        {option.description && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {option.description}
                          </span>
                        )}

                        {/* 单选选中状态 */}
                        {!multiple && isSelected && (
                          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    {searchQuery ? `未找到包含"${searchQuery}"的选项` : '暂无选项'}
                  </div>
                )}
              </div>

              {/* 多选底部操作 */}
              {multiple && Array.isArray(value) && value.length > 0 && (
                <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      已选择 {value.length} 项
                    </span>
                    <button
                      onClick={() => onChange([])}
                      className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                    >
                      清空选择
                    </button>
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