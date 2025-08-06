//client/src/pages/StudentDashboard.jsx (修复版本 - 解决无限循环和性能优化)
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import FilterBar from '../components/FilterBar';
import AdvancedFilters from '../components/AdvancedFilters';
import { useTaskFiltering, studentQuickFilters } from '../hooks/useFilters';
import { useSearch } from '../hooks/useSearch';

const StudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [allTasks, setAllTasks] = useState({
    active: [],
    archived: []
  });
  const [currentCategory, setCurrentCategory] = useState('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 🔧 修复：使用ref避免依赖循环
  const fetchingRef = useRef(false);
  const dataLoadedRef = useRef(false);

  // 🔧 修复：优化的筛选Hook使用
  const currentTasks = useMemo(() => allTasks[currentCategory] || [], [allTasks, currentCategory]);
  
  const {
    filters,
    updateFilters,
    resetFilters,
    showAdvancedFilters,
    toggleAdvancedFilters,
    filteredTasks,
    stats
  } = useTaskFiltering(
    currentTasks, // 使用稳定的引用
    [], // 学生端通常不需要班级数据进行筛选
    [] // 学生端不需要提交数据进行筛选
  );

  const {
    searchQuery,
    setSearchQuery,
    searchHistory,
    suggestions,
    updateSuggestions,
    performSearch,
    clearSearchHistory
  } = useSearch(currentTasks);

  // 🔧 修复：稳定的获取用户和任务数据函数
  const fetchUserAndTasks = useCallback(async () => {
    if (fetchingRef.current) return; // 防止重复调用
    
    try {
      fetchingRef.current = true;
      setLoading(true);
      setError('');

      // 获取用户信息
      const res = await api.get('/user/profile');
      if (res.data.role !== 'student') {
        navigate('/');
        return;
      }
      setUser(res.data);

      // 并行获取活跃任务和归档任务
      await Promise.all([
        fetchTasks('active'),
        fetchTasks('archived')
      ]);

      dataLoadedRef.current = true;
    } catch (err) {
      console.error('获取数据失败:', err);
      setError('加载数据失败，请刷新重试');
      if (err.response?.status === 401) {
        navigate('/');
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [navigate]);

  // 🔧 修复：优化的获取任务函数，减少API调用
  const fetchTasks = useCallback(async (category = 'active') => {
    try {
      console.log(`🔄 获取${category}任务...`);
      const taskRes = await api.get(`/task/all?category=${category}`);
      const taskList = Array.isArray(taskRes.data) ? taskRes.data : [];

      // 🔧 修复：优化提交状态检查，使用批量请求或缓存
      const taskWithSubmissions = await Promise.all(
        taskList.map(async (task) => {
          try {
            const submissionRes = await api.get(`/submission/check/${task._id}`);
            return { 
              ...task, 
              submitted: submissionRes.data.submitted,
              submissionInfo: submissionRes.data.submission
            };
          } catch (err) {
            console.warn(`检查任务${task._id}提交状态失败:`, err);
            return { 
              ...task, 
              submitted: false, 
              submissionInfo: null 
            };
          }
        })
      );

      console.log(`✅ 获取到${taskWithSubmissions.length}个${category}任务`);
      
      // 🔧 修复：使用函数式更新，避免状态竞争
      setAllTasks(prev => ({ ...prev, [category]: taskWithSubmissions }));
    } catch (err) {
      console.error(`获取${category}任务失败:`, err);
      setError(`获取${category}任务失败`);
    }
  }, []);

  // 🔧 修复：优化的切换任务分类函数
  const handleCategoryChange = useCallback(async (category) => {
    if (currentCategory === category) return; // 避免重复切换
    
    console.log(`🔄 切换到${category}分类`);
    setCurrentCategory(category);
    resetFilters();
    
    // 如果数据为空或未加载，重新获取
    if (!allTasks[category] || allTasks[category].length === 0) {
      await fetchTasks(category);
    }
  }, [currentCategory, resetFilters, allTasks, fetchTasks]);

  // 🔧 修复：优化的搜索建议更新，避免频繁调用
  const updateSuggestionsThrottled = useCallback((query, tasks) => {
    // 只在活跃分类且数据已加载时更新建议
    if (currentCategory === 'active' && dataLoadedRef.current && tasks.length > 0) {
      updateSuggestions(query, tasks);
    }
  }, [currentCategory, updateSuggestions]);

  // 🔧 修复：稳定的搜索处理函数
  const handleSearch = useCallback((query) => {
    performSearch(query);
    updateFilters({ ...filters, search: query });
  }, [performSearch, updateFilters, filters]);

  // 🔧 修复：稳定的筛选器变化处理函数
  const handleFiltersChange = useCallback((newFilters) => {
    console.log('🔧 筛选器变化:', newFilters);
    updateFilters(newFilters);
    if (newFilters.search !== searchQuery) {
      setSearchQuery(newFilters.search || '');
    }
  }, [updateFilters, searchQuery, setSearchQuery]);

  // 初始化数据加载
  useEffect(() => {
    if (!dataLoadedRef.current && !fetchingRef.current) {
      fetchUserAndTasks();
    }
  }, [fetchUserAndTasks]);

  // 🔧 修复：优化搜索建议更新逻辑，减少不必要的调用
  useEffect(() => {
    // 防抖更新搜索建议
    const timeoutId = setTimeout(() => {
      updateSuggestionsThrottled(searchQuery, currentTasks);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentTasks, updateSuggestionsThrottled]);

  // 格式化函数 - 移到组件外部避免重复创建
  const formatDeadline = useCallback((deadline) => {
    const date = new Date(deadline);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getTaskStatus = useCallback((task) => {
    const now = new Date();
    const deadline = new Date(task.deadline);
    
    // 归档任务的特殊处理
    if (task.isArchived) {
      if (task.submitted) {
        return {
          status: 'archived_submitted',
          text: '📦 已归档（已提交）',
          color: 'text-gray-600 dark:text-gray-400',
          canSubmit: false
        };
      } else {
        return {
          status: 'archived_not_submitted',
          text: '📦 已归档（未提交）',
          color: 'text-gray-600 dark:text-gray-400',
          canSubmit: false
        };
      }
    }
    
    if (task.submitted) {
      return {
        status: 'submitted',
        text: '✅ 已提交',
        color: 'text-green-600 dark:text-green-400',
        canSubmit: false
      };
    }
    
    if (now > deadline) {
      if (task.allowLateSubmission) {
        return {
          status: 'late',
          text: '⚠️ 已逾期（可提交）',
          color: 'text-orange-600 dark:text-orange-400',
          canSubmit: true
        };
      } else {
        return {
          status: 'expired',
          text: '❌ 已截止',
          color: 'text-red-600 dark:text-red-400',
          canSubmit: false
        };
      }
    }
    
    // 计算剩余时间
    const timeDiff = deadline - now;
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor(timeDiff / (1000 * 60));
    
    if (days > 1) {
      return {
        status: 'normal',
        text: `📅 还有${days}天`,
        color: 'text-blue-600 dark:text-blue-400',
        canSubmit: true
      };
    } else if (hours > 2) {
      return {
        status: 'warning',
        text: `⏰ 还有${hours}小时`,
        color: 'text-yellow-600 dark:text-yellow-400',
        canSubmit: true
      };
    } else {
      return {
        status: 'urgent',
        text: `🔥 还有${minutes}分钟`,
        color: 'text-red-600 dark:text-red-400',
        canSubmit: true
      };
    }
  }, []);

  const getTaskCardStyle = useCallback((taskStatus) => {
    const baseStyle = "p-6 rounded-2xl border shadow-md backdrop-blur-md hover:shadow-xl hover:scale-[1.01] transition-all duration-200";
    
    switch (taskStatus.status) {
      case 'submitted':
        return `${baseStyle} bg-green-50/70 dark:bg-green-900/20 border-green-200/50 dark:border-green-700/50`;
      case 'expired':
        return `${baseStyle} bg-red-50/70 dark:bg-red-900/20 border-red-200/50 dark:border-red-700/50`;
      case 'late':
        return `${baseStyle} bg-orange-50/70 dark:bg-orange-900/20 border-orange-200/50 dark:border-orange-700/50`;
      case 'urgent':
        return `${baseStyle} bg-red-50/70 dark:bg-red-900/20 border-red-200/50 dark:border-red-700/50`;
      case 'warning':
        return `${baseStyle} bg-yellow-50/70 dark:bg-yellow-900/20 border-yellow-200/50 dark:border-yellow-700/50`;
      case 'archived_submitted':
      case 'archived_not_submitted':
        return `${baseStyle} bg-gray-50/70 dark:bg-gray-800/60 border-gray-200/50 dark:border-gray-700/50 opacity-75`;
      default:
        return `${baseStyle} bg-white/70 dark:bg-gray-800/60 border-gray-200/50 dark:border-gray-700/50`;
    }
  }, []);

  // 🔧 修复：加载和错误状态处理
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">加载任务数据中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button 
            variant="primary" 
            onClick={() => window.location.reload()}
          >
            刷新重试
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">用户信息加载中...</p>
      </div>
    );
  }

  const displayTasks = currentCategory === 'active' ? filteredTasks : currentTasks;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 页面头部 */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
              欢迎回来，
              <span className="text-blue-600 dark:text-blue-400">{user.email}</span>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              管理您的学习任务，跟踪提交进度
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => navigate('/join-class')}
            className="flex-shrink-0"
          >
            ➕ 加入班级
          </Button>
        </div>

        {/* 任务分类标签 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            {[
              { key: 'active', label: '📋 当前任务', count: allTasks.active.length },
              { key: 'archived', label: '📦 已归档任务', count: allTasks.archived.length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => handleCategoryChange(key)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentCategory === key
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* 筛选系统 - 仅在活跃任务分类下显示 */}
        {currentCategory === 'active' && (
          <div className="space-y-4 mb-8">
            <FilterBar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              quickFilters={studentQuickFilters}
              showAdvanced={showAdvancedFilters}
              onToggleAdvanced={toggleAdvancedFilters}
              searchSuggestions={suggestions}
              searchHistory={searchHistory}
              onClearSearchHistory={clearSearchHistory}
              onSearch={handleSearch}
              totalCount={allTasks[currentCategory].length}
              filteredCount={filteredTasks.length}
            />

            <AdvancedFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              isVisible={showAdvancedFilters}
              onClose={() => toggleAdvancedFilters(false)}
              userRole="student"
            />
          </div>
        )}

        {/* 任务列表 */}
        <div className="grid gap-6">
          {displayTasks.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-gray-400 dark:text-gray-500 text-2xl">
                  {currentCategory === 'active' ? '📋' : '📦'}
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {currentCategory === 'active' 
                  ? stats.hasActiveFilters 
                    ? '没有符合筛选条件的任务' 
                    : '暂无当前任务'
                  : '暂无归档任务'
                }
              </p>
              {currentCategory === 'active' && stats.hasActiveFilters && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={resetFilters}
                >
                  清空筛选条件
                </Button>
              )}
            </div>
          ) : (
            displayTasks.map((task, index) => {
              const taskStatus = getTaskStatus(task);
              return (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={getTaskCardStyle(taskStatus)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                      {task.title}
                    </h3>
                    <span className={`text-sm font-medium ${taskStatus.color}`}>
                      {taskStatus.text}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        📂 分类：{task.category}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        📝 作业文件：{task.needsFile ? '必交' : '可选'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        🤖 AIGC 使用：{task.allowAIGC ? '允许' : '禁止'}
                      </p>
                      {task.allowAIGC && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          📋 AIGC 日志：{task.requireAIGCLog ? '必交' : '可选'}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ⏰ 截止时间：{formatDeadline(task.deadline)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        📚 所属班级：
                        {task.classIds && task.classIds.length > 0
                          ? task.classIds.map(cls => cls.name || cls).join('，')
                          : '未绑定'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        📋 逾期提交：{task.allowLateSubmission ? '允许' : '不允许'}
                      </p>
                      {taskStatus.status === 'late' && (
                        <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                          ⚠️ 此任务已逾期，提交后将被标注为逾期作业
                        </p>
                      )}
                      {task.isArchived && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                          📦 此任务已归档，仅供查看
                        </p>
                      )}
                      {task.submissionInfo && (
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                          ✅ 已于 {new Date(task.submissionInfo.submittedAt).toLocaleString()} 提交
                          {task.submissionInfo.isLateSubmission && ' (逾期提交)'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    {taskStatus.canSubmit && currentCategory === 'active' && (
                      <Button
                        variant={taskStatus.status === 'late' ? "warning" : 
                                taskStatus.status === 'urgent' ? "danger" : "primary"}
                        onClick={() => navigate(`/submit/${task._id}`)}
                      >
                        {taskStatus.status === 'late' ? '⚠️ 逾期提交' : '📤 提交作业'}
                      </Button>
                    )}

                    {!taskStatus.canSubmit && taskStatus.status === 'expired' && currentCategory === 'active' && (
                      <div className="px-5 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-center">
                        ❌ 已截止，无法提交
                      </div>
                    )}

                    {currentCategory === 'archived' && (
                      <div className="px-5 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-center text-sm">
                        📦 归档任务，仅供查看
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;