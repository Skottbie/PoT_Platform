// src/components/DateRangePicker.jsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DateRangePicker({
  value = null, // { startDate: Date, endDate: Date }
  onChange,
  placeholder = '选择日期范围',
  disabled = false,
  className = '',
  error = false,
  size = 'md',
  minDate = null,
  maxDate = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const [hoverDate, setHoverDate] = useState(null);
  const pickerRef = useRef(null);

  // 处理外部点击关闭
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectingStart(true);
        setHoverDate(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 快速日期范围选项
  const quickRanges = [
    { 
      label: '今天', 
      getValue: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endToday = new Date();
        endToday.setHours(23, 59, 59, 999);
        return { startDate: today, endDate: endToday };
      }
    },
    { 
      label: '昨天', 
      getValue: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const endYesterday = new Date(yesterday);
        endYesterday.setHours(23, 59, 59, 999);
        return { startDate: yesterday, endDate: endYesterday };
      }
    },
    { 
      label: '本周', 
      getValue: () => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return { startDate: startOfWeek, endDate: endOfWeek };
      }
    },
    { 
      label: '本月', 
      getValue: () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        return { startDate: startOfMonth, endDate: endOfMonth };
      }
    },
    { 
      label: '最近7天', 
      getValue: () => {
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const start = new Date();
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        return { startDate: start, endDate: end };
      }
    },
    { 
      label: '最近30天', 
      getValue: () => {
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const start = new Date();
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        return { startDate: start, endDate: end };
      }
    }
  ];

  // 格式化日期显示
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 获取当前月份的日期数组
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // 获取第一天是星期几
    const startDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // 填充上月末尾的日期
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    // 填充当月日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      days.push({ date: dayDate, isCurrentMonth: true });
    }
    
    // 填充下月开头的日期，确保总数为42（6行7列）
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const dayDate = new Date(year, month + 1, day);
      days.push({ date: dayDate, isCurrentMonth: false });
    }
    
    return days;
  };

  // 判断日期是否在范围内
  const isDateInRange = (date) => {
    if (!value || !value.startDate || !value.endDate) return false;
    
    const dateTime = date.getTime();
    const startTime = value.startDate.getTime();
    const endTime = value.endDate.getTime();
    
    return dateTime >= startTime && dateTime <= endTime;
  };

  // 判断日期是否在悬停范围内
  const isDateInHoverRange = (date) => {
    if (!value || !value.startDate || !hoverDate) return false;
    
    const dateTime = date.getTime();
    const startTime = value.startDate.getTime();
    const hoverTime = hoverDate.getTime();
    
    const minTime = Math.min(startTime, hoverTime);
    const maxTime = Math.max(startTime, hoverTime);
    
    return dateTime >= minTime && dateTime <= maxTime;
  };

  // 判断日期是否被选中
  const isDateSelected = (date) => {
    if (!value) return false;
    
    const dateTime = date.getTime();
    const startTime = value.startDate?.getTime();
    const endTime = value.endDate?.getTime();
    
    return dateTime === startTime || dateTime === endTime;
  };

  // 判断日期是否禁用
  const isDateDisabled = (date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  // 处理日期点击
  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;
    
    if (selectingStart || !value?.startDate) {
      // 选择开始日期
      onChange({ startDate: date, endDate: null });
      setSelectingStart(false);
    } else {
      // 选择结束日期
      const startDate = value.startDate;
      const endDate = date;
      
      if (endDate >= startDate) {
        onChange({ startDate, endDate });
      } else {
        onChange({ startDate: endDate, endDate: startDate });
      }
      
      setIsOpen(false);
      setSelectingStart(true);
    }
    
    setHoverDate(null);
  };

  // 处理快速范围选择
  const handleQuickRange = (range) => {
    onChange(range.getValue());
    setIsOpen(false);
    setSelectingStart(true);
  };

  // 月份导航
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const days = getDaysInMonth(currentMonth);
  const monthYear = currentMonth.toLocaleString('zh-CN', { year: 'numeric', month: 'long' });

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      {/* 输入框 */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2 
          ${sizeStyles[size]}
          bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600
          rounded-lg transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
          hover:border-gray-400 dark:hover:border-gray-500
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'ring-2 ring-blue-500/50 border-blue-500' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          
          {value && value.startDate ? (
            <span className="truncate text-gray-900 dark:text-gray-100">
              {formatDate(value.startDate)}
              {value.endDate && value.endDate !== value.startDate && (
                <> ~ {formatDate(value.endDate)}</>
              )}
            </span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400 truncate">
              {placeholder}
            </span>
          )}
        </div>

        {/* 清除按钮 */}
        {value && value.startDate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="flex-shrink-0 w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </button>

      {/* 日期选择器弹窗 */}
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
              <div className="flex">
                {/* 快速选择区域 */}
                <div className="w-32 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      快速选择
                    </div>
                    <div className="space-y-1">
                      {quickRanges.map((range, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickRange(range)}
                          className="w-full px-2 py-1.5 text-xs rounded text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 日历区域 */}
                <div className="flex-1 p-3">
                  {/* 月份导航 */}
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={goToPreviousMonth}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <svg className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {monthYear}
                    </div>
                    
                    <button
                      onClick={goToNextMonth}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <svg className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* 星期标题 */}
                  <div className="grid grid-cols-7 mb-1">
                    {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                      <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* 日期网格 */}
                  <div className="grid grid-cols-7 gap-1">
                    {days.map((day, index) => {
                      const isCurrentMonth = day.isCurrentMonth;
                      const isSelected = isDateSelected(day.date);
                      const isInRange = isDateInRange(day.date);
                      const isInHoverRange = isDateInHoverRange(day.date);
                      const isDisabled = isDateDisabled(day.date);
                      const isToday = day.date.toDateString() === new Date().toDateString();

                      return (
                        <button
                          key={index}
                          onClick={() => handleDateClick(day.date)}
                          onMouseEnter={() => !isDisabled && setHoverDate(day.date)}
                          onMouseLeave={() => setHoverDate(null)}
                          disabled={isDisabled}
                          className={`
                            w-8 h-8 text-xs rounded transition-all duration-150
                            ${!isCurrentMonth 
                              ? 'text-gray-300 dark:text-gray-600' 
                              : isDisabled
                              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                              : isSelected
                              ? 'bg-blue-500 text-white font-medium'
                              : isInRange
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                              : isInHoverRange
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : isToday
                              ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 font-medium'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }
                          `}
                        >
                          {day.date.getDate()}
                        </button>
                      );
                    })}
                  </div>

                  {/* 状态提示 */}
                  {!selectingStart && value?.startDate && (
                    <div className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
                      请选择结束日期
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}