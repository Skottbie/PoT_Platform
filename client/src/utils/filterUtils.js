// src/utils/filterUtils.js

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

// 综合任务筛选函数
export function filterTasks(tasks, filters, classes = [], submissions = []) {
  return tasks.filter(task => {
    // 基础分类筛选（活跃/归档/删除）
    if (filters.category === 'active' && (task.isArchived || task.isDeleted)) return false;
    if (filters.category === 'archived' && !task.isArchived) return false;
    if (filters.category === 'deleted' && !task.isDeleted) return false;
    
    // 班级筛选
    if (filters.classId && filters.classId !== 'all') {
      const hasClass = task.classIds?.some(cls => 
        cls._id === filters.classId || cls === filters.classId
      );
      if (!hasClass) return false;
    }
    
    // 任务类型筛选
    if (filters.taskType && filters.taskType !== 'all') {
      if (task.category !== filters.taskType) return false;
    }
    
    // 提交状态筛选（学生端）
    if (filters.submitted && filters.submitted !== 'all') {
      if (filters.submitted === 'true' && !task.submitted) return false;
      if (filters.submitted === 'false' && task.submitted) return false;
    }
    
    // 截止时间筛选
    if (filters.deadline && filters.deadline !== 'all') {
      const timeFilter = timeFilters[filters.deadline];
      if (timeFilter && !timeFilter(task.deadline)) return false;
    }
    
    // 特殊状态筛选
    if (filters.status && filters.status !== 'all') {
      const statusFilter = statusFilters[filters.status];
      if (statusFilter && !statusFilter(task)) return false;
    }
    
    // 提交率筛选（教师端）
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
  });
}

// 任务排序函数
export function sortTasks(tasks, sortBy = 'deadline', sortOrder = 'asc') {
  const sorted = [...tasks].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'deadline':
        comparison = new Date(a.deadline) - new Date(b.deadline);
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
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
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
  
  return sorted;
}

// 获取筛选器显示文本
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
  
  if (filters.search) {
    texts.push(`搜索: "${filters.search}"`);
  }
  
  return texts;
}