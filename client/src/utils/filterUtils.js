// src/utils/filterUtils.js (性能优化修复版本)

// 🔧 修复：缓存时间筛选器，避免重复创建
const createTimeFilters = () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  
  return {
    today: (deadline) => {
      const taskDeadline = new Date(deadline);
      return taskDeadline >= todayStart && taskDeadline < todayEnd;
    },

    tomorrow: (deadline) => {
      const tomorrow = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
      const taskDeadline = new Date(deadline);
      return taskDeadline >= tomorrow && taskDeadline < dayAfter;
    },

    thisWeek: (deadline) => {
      const startOfWeek = new Date(todayStart);
      startOfWeek.setDate(todayStart.getDate() - todayStart.getDay());
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
      const taskDeadline = new Date(deadline);
      return taskDeadline >= startOfWeek && taskDeadline < endOfWeek;
    },

    nextWeek: (deadline) => {
      const startOfNextWeek = new Date(todayStart);
      startOfNextWeek.setDate(todayStart.getDate() - todayStart.getDay() + 7);
      const endOfNextWeek = new Date(startOfNextWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
      const taskDeadline = new Date(deadline);
      return taskDeadline >= startOfNextWeek && taskDeadline < endOfNextWeek;
    },

    thisMonth: (deadline) => {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const taskDeadline = new Date(deadline);
      return taskDeadline >= startOfMonth && taskDeadline < endOfMonth;
    },

    overdue: (deadline) => {
      return new Date(deadline) < now;
    },

    next24hours: (deadline) => {
      const next24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const taskDeadline = new Date(deadline);
      return taskDeadline >= now && taskDeadline <= next24;
    },

    next48hours: (deadline) => {
      const next48 = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const taskDeadline = new Date(deadline);
      return taskDeadline >= now && taskDeadline <= next48;
    }
  };
};

// 🔧 修复：使用缓存的时间筛选器，每小时刷新一次
let timeFiltersCache = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1小时

const getTimeFilters = () => {
  const now = Date.now();
  if (!timeFiltersCache || (now - cacheTime) > CACHE_DURATION) {
    timeFiltersCache = createTimeFilters();
    cacheTime = now;
  }
  return timeFiltersCache;
};

// 🔧 修复：稳定的提交状态筛选器
const submissionFilters = Object.freeze({
  submitted: (task) => Boolean(task.submitted),
  notSubmitted: (task) => !task.submitted,
  lateSubmitted: (task) => Boolean(task.submitted && task.submissionInfo?.isLateSubmission),
  onTimeSubmitted: (task) => Boolean(task.submitted && !task.submissionInfo?.isLateSubmission)
});

// 🔧 修复：稳定的状态筛选器
const statusFilters = Object.freeze({
  active: (task) => !task.isArchived && !task.isDeleted,
  archived: (task) => Boolean(task.isArchived && !task.isDeleted),
  deleted: (task) => Boolean(task.isDeleted),
  urgent: (task) => {
    if (task.submitted || task.isArchived || task.isDeleted) return false;
    const now = Date.now();
    const deadline = new Date(task.deadline).getTime();
    const hoursLeft = (deadline - now) / (1000 * 60 * 60);
    return hoursLeft > 0 && hoursLeft <= 24;
  },
  needAttention: (task) => {
    if (task.submitted || task.isArchived || task.isDeleted) return false;
    const now = Date.now();
    const deadline = new Date(task.deadline).getTime();
    const hoursLeft = (deadline - now) / (1000 * 60 * 60);
    return hoursLeft > 0 && hoursLeft <= 48;
  }
});

// 🔧 修复：稳定的高级筛选器
const advancedFilters = Object.freeze({
  dateRange: (date, range) => {
    if (!range?.startDate || !range?.endDate) return true;
    const dateTime = new Date(date).getTime();
    const startTime = range.startDate.getTime();
    const endTime = range.endDate.getTime();
    return dateTime >= startTime && dateTime <= endTime;
  },

  booleanFilter: (value, filterValue) => {
    if (filterValue === 'all') return true;
    return Boolean(value) === (filterValue === 'true');
  }
});

// 🔧 修复：优化的班级 ID 提取函数，支持多种数据结构
const extractClassIds = (task) => {
  if (!task.classIds) return [];
  
  // 缓存提取结果
  if (task._classIdCache) return task._classIdCache;
  
  let ids = [];
  if (Array.isArray(task.classIds)) {
    ids = task.classIds.map(cls => {
      if (typeof cls === 'string') return cls;
      if (cls && typeof cls === 'object') return cls._id || cls.id;
      return null;
    }).filter(Boolean);
  }
  
  // 缓存结果（使用非枚举属性避免序列化时包含）
  Object.defineProperty(task, '_classIdCache', {
    value: ids,
    writable: false,
    enumerable: false
  });
  
  return ids;
};

// 🔧 修复：高性能任务筛选函数
export function filterTasks(tasks, filters, classes = [], submissions = []) {
  // 早期返回优化
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return [];
  }

  // 预处理班级映射（只在需要时计算）
  let classMap = null;
  if (filters.classId && filters.classId !== 'all') {
    classMap = new Set(Array.isArray(classes) ? classes.map(cls => cls._id || cls.id) : []);
  }

  // 获取缓存的时间筛选器
  const timeFilters = getTimeFilters();

  return tasks.filter(task => {
    try {
      // 基础分类筛选（最高频，最早返回）
      if (filters.category === 'active' && (task.isArchived || task.isDeleted)) {
        return false;
      }
      if (filters.category === 'archived' && !task.isArchived) {
        return false;
      }
      if (filters.category === 'deleted' && !task.isDeleted) {
        return false;
      }
      
      // 班级筛选（使用预处理的映射）
      if (filters.classId && filters.classId !== 'all') {
        const taskClassIds = extractClassIds(task);
        if (!taskClassIds.some(id => classMap.has(id))) {
          return false;
        }
      }
      
      // 任务类型筛选
      if (filters.taskType && filters.taskType !== 'all' && task.category !== filters.taskType) {
        return false;
      }
      
      // 提交状态筛选
      if (filters.submitted && filters.submitted !== 'all') {
        const filter = filters.submitted === 'true' ? submissionFilters.submitted : submissionFilters.notSubmitted;
        if (!filter(task)) return false;
      }
      
      // 截止时间筛选
      if (filters.deadline && filters.deadline !== 'all') {
        const timeFilter = timeFilters[filters.deadline];
        if (timeFilter && !timeFilter(task.deadline)) return false;
      }
      
      // 状态筛选
      if (filters.status && filters.status !== 'all') {
        const statusFilter = statusFilters[filters.status];
        if (statusFilter && !statusFilter(task)) return false;
      }
      
      return true;
    } catch (error) {
      console.warn('筛选任务时出错:', error, task);
      return true; // 出错时保留任务，避免丢失数据
    }
  });
}

// 🔧 修复：优化的排序函数，避免重复计算
const sortComparers = Object.freeze({
  deadline: (a, b) => new Date(a.deadline) - new Date(b.deadline),
  title: (a, b) => (a.title || '').localeCompare(b.title || ''),
  category: (a, b) => (a.category || '').localeCompare(b.category || ''),
  createdAt: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  submissionRate: (a, b) => (a.submissionRate || 0) - (b.submissionRate || 0)
});

export function sortTasks(tasks, sortBy = 'deadline', sortOrder = 'asc') {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return [];
  }

  const comparer = sortComparers[sortBy];
  if (!comparer) {
    console.warn('未知的排序字段:', sortBy);
    return [...tasks];
  }

  try {
    const sorted = [...tasks].sort(comparer);
    return sortOrder === 'desc' ? sorted.reverse() : sorted;
  } catch (error) {
    console.error('排序时出错:', error);
    return [...tasks];
  }
}

// 🔧 修复：缓存筛选器显示文本
const displayTextCache = new Map();
const DISPLAY_TEXT_CACHE_SIZE = 100;

export function getFilterDisplayText(filters) {
  // 使用筛选器的 JSON 字符串作为缓存键
  const cacheKey = JSON.stringify(filters);
  
  if (displayTextCache.has(cacheKey)) {
    return displayTextCache.get(cacheKey);
  }

  const texts = [];
  
  if (filters.classId && filters.classId !== 'all') {
    texts.push(`班级: ${filters.classId}`);
  }
  
  if (filters.deadline && filters.deadline !== 'all') {
    const deadlineTexts = {
      today: '今天截止',
      tomorrow: '明天截止',
      thisWeek: '本周截止',
      nextWeek: '下周截止',
      thisMonth: '本月截止',
      overdue: '已过期',
      next24hours: '24小时内截止',
      next48hours: '48小时内截止'
    };
    texts.push(deadlineTexts[filters.deadline] || filters.deadline);
  }
  
  if (filters.submitted && filters.submitted !== 'all') {
    texts.push(filters.submitted === 'true' ? '已提交' : '未提交');
  }
  
  if (filters.taskType && filters.taskType !== 'all') {
    texts.push(`类型: ${filters.taskType}`);
  }
  
  if (filters.allowAIGC && filters.allowAIGC !== 'all') {
    texts.push(`AIGC: ${filters.allowAIGC === 'true' ? '允许' : '禁止'}`);
  }
  
  if (filters.needsFile && filters.needsFile !== 'all') {
    texts.push(`文件: ${filters.needsFile === 'true' ? '必需' : '可选'}`);
  }
  
  if (filters.allowLateSubmission && filters.allowLateSubmission !== 'all') {
    texts.push(`逾期: ${filters.allowLateSubmission === 'true' ? '允许' : '禁止'}`);
  }
  
  if (filters.deadlineRange) {
    try {
      const start = filters.deadlineRange.startDate.toLocaleDateString('zh-CN');
      const end = filters.deadlineRange.endDate.toLocaleDateString('zh-CN');
      texts.push(`截止时间: ${start} ~ ${end}`);
    } catch (error) {
      console.warn('日期范围显示出错:', error);
    }
  }
  
  if (filters.createdDateRange) {
    try {
      const start = filters.createdDateRange.startDate.toLocaleDateString('zh-CN');
      const end = filters.createdDateRange.endDate.toLocaleDateString('zh-CN');
      texts.push(`创建时间: ${start} ~ ${end}`);
    } catch (error) {
      console.warn('创建日期范围显示出错:', error);
    }
  }
  
  if (filters.search) {
    texts.push(`搜索: "${filters.search}"`);
  }

  // 缓存结果（限制缓存大小）
  if (displayTextCache.size >= DISPLAY_TEXT_CACHE_SIZE) {
    const firstKey = displayTextCache.keys().next().value;
    displayTextCache.delete(firstKey);
  }
  displayTextCache.set(cacheKey, texts);
  
  return texts;
}

// 🔧 修复：稳定的统计信息函数，返回相同引用的对象
const statsCache = new WeakMap();

export function getFilterStats(filters) {
  // 尝试从缓存获取
  if (statsCache.has(filters)) {
    return statsCache.get(filters);
  }

  const totalFilters = Object.keys(filters).length;
  const activeFilters = Object.entries(filters).filter(([key, value]) => {
    if (['category', 'sortBy', 'sortOrder'].includes(key)) return false;
    if (key === 'search') return value && value.trim();
    if (key.includes('Range')) return Boolean(value);
    return value && value !== 'all' && value !== '';
  }).length;

  const hasAdvanced = ['allowAIGC', 'needsFile', 'allowLateSubmission', 'deadlineRange', 'createdDateRange']
    .some(key => {
      const value = filters[key];
      if (key.includes('Range')) return Boolean(value);
      return value && value !== 'all';
    });

  const stats = Object.freeze({
    total: totalFilters,
    active: activeFilters,
    hasAdvanced
  });

  // 缓存结果
  statsCache.set(filters, stats);
  
  return stats;
}

// 🔧 修复：导出稳定的筛选器对象，避免重新创建
export const timeFilters = getTimeFilters();
export { submissionFilters, statusFilters, advancedFilters };