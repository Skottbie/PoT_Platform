// src/components/AdvancedFilters.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Select from './Select';
import DateRangePicker from './DateRangePicker';
import Button from './Button';

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  isVisible = false,
  onClose,
  classes = [],
  userRole = 'student',
  className = ''
}) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [hasChanges, setHasChanges] = useState(false);

  // 同步外部filters变化
  useEffect(() => {
    setLocalFilters(filters);
    setHasChanges(false);
  }, [filters]);

  // 检测变化
  useEffect(() => {
    const changed = JSON.stringify(localFilters) !== JSON.stringify(filters);
    setHasChanges(changed);
  }, [localFilters, filters]);

  const handleLocalChange = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    setHasChanges(false);
  };

  const handleReset = () => {
    const resetFilters = {
      category: filters.category,
      classId: 'all',
      deadline: 'all',
      submitted: 'all',
      taskType: 'all',
      search: '',
      sortBy: 'deadline',
      sortOrder: 'asc',
      // 高级筛选特有字段
      createdDateRange: null,
      deadlineRange: null,
      allowAIGC: 'all',
      needsFile: 'all',
      allowLateSubmission: 'all'
    };
    setLocalFilters(resetFilters);
  };

  // 班级选项
  const classOptions = [
    { value: 'all', label: '全部班级' },
    ...classes.map(cls => ({
      value: cls._id,
      label: cls.name,
      badge: cls.studentList?.filter(s => !s.isRemoved).length || 0
    }))
  ];

  // 任务类型选项
  const taskTypeOptions = [
    { value: 'all', label: '全部类型' },
    { value: '课堂练习', label: '课堂练习', icon: '📝' },
    { value: '课程任务', label: '课程任务', icon: '📚' }
  ];

  // 提交状态选项（学生端）
  const submissionOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'true', label: '已提交', icon: '✅' },
    { value: 'false', label: '未提交', icon: '❌' }
  ];

  // 排序选项
  const sortOptions = [
    { value: 'deadline', label: '按截止时间', icon: '⏰' },
    { value: 'createdAt', label: '按创建时间', icon: '📅' },
    { value: 'title', label: '按标题', icon: '🔤' },
    { value: 'category', label: '按类型', icon: '📂' }
  ];

  // 排序方向选项
  const sortOrderOptions = [
    { value: 'asc', label: '升序', icon: '⬆️' },
    { value: 'desc', label: '降序', icon: '⬇️' }
  ];

  // 布尔筛选选项
  const booleanOptions = [
    { value: 'all', label: '全部' },
    { value: 'true', label: '是', icon: '✅' },
    { value: 'false', label: '否', icon: '❌' }
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`overflow-hidden ${className}`}
        >
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl p-6 shadow-lg">
            {/* 头部 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🔧</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    高级筛选
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    更精确的筛选条件设置
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-orange-500 rounded-full"
                    title="有未应用的更改"
                  />
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
                >
                  <span className="text-gray-500 dark:text-gray-400">✕</span>
                </button>
              </div>
            </div>

            {/* 筛选器网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* 班级筛选 */}
              {userRole === 'teacher' && classes.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    所属班级
                  </label>
                  <Select
                    value={localFilters.classId || 'all'}
                    onChange={(value) => handleLocalChange('classId', value)}
                    options={classOptions}
                    placeholder="选择班级"
                    showBadge
                  />
                </div>
              )}

              {/* 任务类型筛选 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  任务类型
                </label>
                <Select
                  value={localFilters.taskType || 'all'}
                  onChange={(value) => handleLocalChange('taskType', value)}
                  options={taskTypeOptions}
                  placeholder="选择类型"
                  showIcon
                />
              </div>

              {/* 提交状态筛选（学生端） */}
              {userRole === 'student' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    提交状态
                  </label>
                  <Select
                    value={localFilters.submitted || 'all'}
                    onChange={(value) => handleLocalChange('submitted', value)}
                    options={submissionOptions}
                    placeholder="选择状态"
                    showIcon
                  />
                </div>
              )}

              {/* 排序方式 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  排序方式
                </label>
                <Select
                  value={localFilters.sortBy || 'deadline'}
                  onChange={(value) => handleLocalChange('sortBy', value)}
                  options={sortOptions}
                  showIcon
                />
              </div>

              {/* 排序方向 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  排序方向
                </label>
                <Select
                  value={localFilters.sortOrder || 'asc'}
                  onChange={(value) => handleLocalChange('sortOrder', value)}
                  options={sortOrderOptions}
                  showIcon
                />
              </div>

              {/* AIGC筛选（教师端） */}
              {userRole === 'teacher' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    允许AIGC
                  </label>
                  <Select
                    value={localFilters.allowAIGC || 'all'}
                    onChange={(value) => handleLocalChange('allowAIGC', value)}
                    options={booleanOptions}
                    showIcon
                  />
                </div>
              )}

              {/* 文件要求筛选（教师端） */}
              {userRole === 'teacher' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    要求文件
                  </label>
                  <Select
                    value={localFilters.needsFile || 'all'}
                    onChange={(value) => handleLocalChange('needsFile', value)}
                    options={booleanOptions}
                    showIcon
                  />
                </div>
              )}

              {/* 逾期提交筛选（教师端） */}
              {userRole === 'teacher' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    允许逾期
                  </label>
                  <Select
                    value={localFilters.allowLateSubmission || 'all'}
                    onChange={(value) => handleLocalChange('allowLateSubmission', value)}
                    options={booleanOptions}
                    showIcon
                  />
                </div>
              )}
            </div>

            {/* 日期范围筛选 */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 截止时间范围 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    截止时间范围
                  </label>
                  <DateRangePicker
                    value={localFilters.deadlineRange}
                    onChange={(range) => handleLocalChange('deadlineRange', range)}
                    placeholder="选择截止时间范围"
                  />
                </div>

                {/* 创建时间范围（教师端） */}
                {userRole === 'teacher' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      创建时间范围
                    </label>
                    <DateRangePicker
                      value={localFilters.createdDateRange}
                      onChange={(range) => handleLocalChange('createdDateRange', range)}
                      placeholder="选择创建时间范围"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 底部操作按钮 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>设置完成后点击"应用筛选"生效</span>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-gray-600 dark:text-gray-400"
                >
                  重置
                </Button>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                >
                  取消
                </Button>
                
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApply}
                  disabled={!hasChanges}
                  className={`${hasChanges ? 'animate-pulse' : ''}`}
                >
                  {hasChanges ? '应用筛选' : '已是最新'}
                </Button>
              </div>
            </div>

            {/* 实时预览提示 */}
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <div className="font-medium mb-1">筛选预览</div>
                    <div className="text-xs space-y-1">
                      {Object.entries(localFilters).map(([key, value]) => {
                        if (value && value !== 'all' && value !== filters[key]) {
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                              <span>{key}: {value}</span>
                            </div>
                          );
                        }
                        return null;
                      }).filter(Boolean)}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}