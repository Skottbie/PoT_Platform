// src/utils/filterUtils.js (修复版本)

// 时间筛选工具函数
export const timeFilters = {
  // 今天截止
  today: (deadline) => {
    const today = new Date();
    const taskDeadline = new Date(deadline);
    
    return (
      today.getFullYear() === taskDeadline.getFullYear() &&
      today.getMonth() === taskDeadline.getMonth() &&
      today.getDate() === taskDeadline.getDate()
    );
  },

  // 明天截止
  tomorrow: (deadline) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const taskDeadline = new Date(deadline);
    
    return (
      tomorrow.getFullYear() === taskDeadline.getFullYear() &&
      tomorrow.getMonth() === taskDeadline.getMonth() &&
      tomorrow.getDate() === taskDeadline.getDate()
    );
  },

  // 本周截止
  thisWeek: (deadline) => {
    const now = new Date();
    const taskDeadline = new Date(deadline);
    
    // 获取本周的开始和结束
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return taskDeadline >= startOfWeek && taskDeadline <= endOfWeek;
  },

  // 下周截止
  nextWeek: (deadline) => {
    const now = new Date();
    const taskDeadline = new Date(deadline);
    
    // 获取下周的开始和结束
    const startOfNextWeek = new Date(now);
    startOfNextWeek.setDate(now.getDate() - now.getDay() + 7);
    startOfNextWeek.setHours(0, 0, 0, 0);
    
    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
    endOfNextWeek.setHours(23, 59, 59, 999);
    
    return taskDeadline >= startOfNextWeek && taskDeadline <= endOfNextWeek;
  },

  // 本月截止
  thisMonth: (deadline) => {
    const now = new Date();
    const taskDeadline = new Date(deadline);
    
    return (
      now.getFullYear() === taskDeadline.getFullYear() &&
      now.getMonth() === taskDeadline.getMonth()
    );
  },

  // 已过期
  overdue: (deadline) => {
    const now = new Date();
    const taskDeadline = new Date(deadline);
    return taskDeadline < now;
  },

  // 即将到期（24小时内）
  next24hours: (deadline) => {
    const now = new Date();
    const taskDeadline = new Date(deadline);
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return taskDeadline >= now && taskDeadline <= next24Hours;
  },

  // 即将到期（48小时内）
  next48hours: (deadline) => {
    const now = new Date();
    const taskDeadline = new Date(deadline);
    const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    
    return taskDeadline >= now && taskDeadline <= next48Hours;
  }
};

// 提交状态筛选
export const submissionFilters = {
  submitted: (task) => task.submitted === true,
  notSubmitted: (task) => task.submitted === false,
  lateSubmitted: (task) => task.submitted === true && task.submissionInfo?.isLateSubmission === true,
  onTimeSubmitted: (task) => task.submitted === true && task.submissionInfo?.isLateSubmission !== true
};

// 任务状态筛选
export const statusFilters = {
  active: (task) => !task.isArchived && !task.isDeleted,
  archived: (task) => task.isArchived && !task.isDeleted,
  deleted: (task) => task.isDeleted,
  urgent: (task) => {
    if (task.submitted || task.isArchived || task.isDeleted) return false;
    
    const now = new Date();
    const deadline = new Date(task.deadline);
    const hoursLeft = (deadline - now) / (1000 * 60 * 60);
    
    return hoursLeft > 0 && hoursLeft <= 24;
  },
  needAttention: (task) => {
    // 需要关注：即将截止且未提交，或提交率低的任务
    if (task.submitted || task.isArchived || task.isDeleted) return false;
    
    const now = new Date();
    const deadline = new Date(task.deadline);
    const hoursLeft = (deadline - now) / (1000 * 60 * 60);
    
    return hoursLeft > 0 && hoursLeft <= 48;
  }
};

// 高级筛选工具函数
export const advancedFilters = {
  // 日期范围筛选
  dateRange: (date, range) => {
    if (!range || !range.startDate || !range.endDate) return true;
    
    const dateTime = new Date(date).getTime();
    const startTime = range.startDate.getTime();
    const endTime = range.endDate.getTime();
    
    return dateTime >= startTime && dateTime <= endTime;
  },

  // 布尔值筛选
  booleanFilter: (value, filterValue) => {
    if (filterValue === 'all') return true;
    return value === (filterValue === 'true');
  },

  // 多重条件组合筛选
  combineFilters: (task, conditions) => {
    return Object.entries(conditions).every(([key, value]) => {
      if (!value || value === 'all') return true;
      
      switch (key) {
        case 'allowAIGC':
        case 'needsFile':
        case 'allowLateSubmission':
          return advancedFilters.booleanFilter(task[key], value);
        case 'deadlineRange':
          return advancedFilters.dateRange(task.deadline, value);
        case 'createdDateRange':
          return advancedFilters.dateRange(task.createdAt, value);
        default:
          return true;
      }
    });
  }
};

// 提交率筛选（教师端使用）
export const getSubmissionRate = (task, submissions = []) => {
  if (!task.classIds || task.classIds.length === 0) return 0;
  
  // 计算班级总学生数和提交数
  let totalStudents = 0;
  let submittedCount = 0;
  
  task.classIds.forEach(classData => {
    if (classData.studentList) {
      const activeStudents = classData.studentList.filter(s => !s.isRemoved && s.userId);
      totalStudents += activeStudents.length;
      
      // 计算该班级的提交数
      const classSubmissions = submissions.filter(sub => 
        activeStudents.some(student => student.userId === sub.student)
      );
      submittedCount += classSubmissions.length;
    }
  });
  
  return totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0;
};

// 🔧 修复：综合任务筛选函数（支持高级筛选）
export function filterTasks(tasks, filters, classes = [], submissions = []) {
  console.log('🔍 开始筛选任务:', { 
    tasksCount: tasks.length, 
    filters: { ...filters, deadlineRange: filters.deadlineRange ? 'set' : 'null' },
    classesCount: classes.length 
  });

  if (!Array.isArray(tasks)) {
    console.warn('⚠️ filterTasks: tasks 不是数组');
    return [];
  }

  return tasks.filter(task => {
    try {
      // 🔧 修复：基础分类筛选（活跃/归档/删除）
      if (filters.category === 'active' && (task.isArchived || task.isDeleted)) {
        return false;
      }
      if (filters.category === 'archived' && !task.isArchived) {
        return false;
      }
      if (filters.category === 'deleted' && !task.isDeleted) {
        return false;
      }
      
      // 🔧 修复：班级筛选 - 支持多种数据结构
      if (filters.classId && filters.classId !== 'all') {
        let hasClass = false;
        if (task.classIds && Array.isArray(task.classIds)) {
          hasClass = task.classIds.some(cls => {
            // 支持对象和字符串ID
            const classId = typeof cls === 'object' ? cls._id : cls;
            return classId === filters.classId;
          });
        }
        if (!hasClass) return false;
      }
      
      // 任务类型筛选
      if (filters.taskType && filters.taskType !== 'all') {
        if (task.category !== filters.taskType) return false;
      }
      
      // 🔧 修复：提交状态筛选（学生端）
      if (filters.submitted && filters.submitted !== 'all') {
        if (filters.submitted === 'true' && !task.submitted) return false;
        if (filters.submitted === 'false' && task.submitted) return false;
      }
      
      // 🔧 修复：截止时间筛选
      if (filters.deadline && filters.deadline !== 'all') {
        const timeFilter = timeFilters[filters.deadline];
        if (timeFilter && !timeFilter(task.deadline)) return false;
      }
      
      // 特殊状态筛选
      if (filters.status && filters.status !== 'all') {
        const statusFilter = statusFilters[filters.status];
        if (statusFilter && !statusFilter(task)) return false;
      }
      
      // 🔧 修复：提交率筛选（教师端）
      if (filters.submissionRate && filters.submissionRate !== 'all') {
        const rate = getSubmissionRate(task, submissions);
        
        switch (filters.submissionRate) {
          case 'high':
            if (rate < 80) return false;
            break;
          case 'medium':
            if (rate < 50 || rate >= 80) return false;
            break;
          case 'low':
            if (rate >= 50) return false;
            break;
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ 筛选任务时出错:', error, task);
      return true; // 出错时保留任务
    }
  });
}

// 任务排序函数
export function sortTasks(tasks, sortBy = 'deadline', sortOrder = 'asc') {
  if (!Array.isArray(tasks)) {
    console.warn('⚠️ sortTasks: tasks 不是数组');
    return [];
  }

  const sorted = [...tasks].sort((a, b) => {
    let comparison = 0;
    
    try {
      switch (sortBy) {
        case 'deadline':
          comparison = new Date(a.deadline) - new Date(b.deadline);
          break;
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'submissionRate':
          // 教师端按提交率排序
          const rateA = a.submissionRate || 0;
          const rateB = b.submissionRate || 0;
          comparison = rateA - rateB;
          break;
        default:
          comparison = 0;
      }
    } catch (error) {
      console.error('❌ 排序时出错:', error, { a, b, sortBy });
      comparison = 0;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
  
  return sorted;
}

// 获取筛选器显示文本（支持高级筛选）
export function getFilterDisplayText(filters) {
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
  
  // 高级筛选器文本
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
  
  return texts;
}

// 筛选器统计信息
export function getFilterStats(filters) {
  const totalFilters = Object.keys(filters).length;
  const activeFilters = Object.entries(filters).filter(([key, value]) => {
    if (['category', 'sortBy', 'sortOrder'].includes(key)) return false;
    if (key === 'search') return value && value.trim();
    if (key.includes('Range')) return !!value;
    return value && value !== 'all' && value !== '';
  }).length;
  
  return {
    total: totalFilters,
    active: activeFilters,
    hasAdvanced: ['allowAIGC', 'needsFile', 'allowLateSubmission', 'deadlineRange', 'createdDateRange']
      .some(key => {
        const value = filters[key];
        if (key.includes('Range')) return !!value;
        return value && value !== 'all';
      })
  };
}