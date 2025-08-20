// client/src/pages/StudentDashboard.jsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import { TaskCard } from '../components/EnhancedMobileCard';
import { PrimaryButton, SecondaryButton, WarningButton, DangerButton } from '../components/EnhancedButton';
import PullToRefreshContainer from '../components/PullToRefreshContainer';
import useAutoRefresh from '../hooks/useAutoRefresh';
import toast from 'react-hot-toast';
import { getGreeting } from '../utils/greetings';
import NicknamePrompt from '../components/NicknamePrompt';

const StudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState({
    active: [],
    archived: []
  });
  const [currentCategory, setCurrentCategory] = useState('active');
  const [loading, setLoading] = useState(true);
  
  // 🆕 新增：智能分类折叠状态管理
  const [collapsedSections, setCollapsedSections] = useState(() => {
    try {
      const saved = localStorage.getItem('studentDashboard_collapsedSections');
      return saved ? JSON.parse(saved) : {
        overdue: true,        // 已逾期 - 默认折叠
        urgent: false,        // 紧急任务 - 默认展开
        inProgress: false,    // 进行中 - 默认展开
        submitted: true       // 已提交 - 默认折叠
      };
    } catch {
      return {
        overdue: true,
        urgent: false,
        inProgress: false,
        submitted: true
      };
    }
  });

  const navigate = useNavigate();

  // 📌 检测移动端状态
  const [isMobile, setIsMobile] = useState(false);

  const handleUserUpdate = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 🆕 保存折叠状态到本地存储
  const updateCollapsedSection = useCallback((section, isCollapsed) => {
    const newState = { ...collapsedSections, [section]: isCollapsed };
    setCollapsedSections(newState);
    try {
      localStorage.setItem('studentDashboard_collapsedSections', JSON.stringify(newState));
    } catch (error) {
      console.error('保存折叠状态失败:', error);
    }
  }, [collapsedSections]);

  // 🚀 并发获取数据
  const fetchUserAndTasks = useCallback(async () => {
    try {
      setLoading(true);

      const promises = [
        api.get('/user/profile'),
        api.get('/task/all?category=active'),
        api.get('/task/all?category=archived')
      ];

      const [userRes, activeTasksRes, archivedTasksRes] = await Promise.allSettled(promises);

      if (userRes.status === 'fulfilled') {
        if (userRes.value.data.role !== 'student') {
          navigate('/');
          return;
        }
        setUser(userRes.value.data);
      }

      const activeTaskList = activeTasksRes.status === 'fulfilled' ? activeTasksRes.value.data : [];
      const archivedTaskList = archivedTasksRes.status === 'fulfilled' ? archivedTasksRes.value.data : [];

      const checkSubmissions = async (taskList) => {
        const submissionPromises = taskList.map(async (task) => {
          try {
            const r = await api.get(`/submission/check/${task._id}`);
            return { ...task, submitted: r.data.submitted, submissionInfo: r.data.submission };
          } catch {
            return { ...task, submitted: false, submissionInfo: null };
          }
        });
        return Promise.all(submissionPromises);
      };

      const [activeResults, archivedResults] = await Promise.all([
        checkSubmissions(activeTaskList),
        checkSubmissions(archivedTaskList)
      ]);

      setTasks({
        active: activeResults,
        archived: archivedResults
      });

    } catch (error) {
      console.error('获取数据失败:', error);
      toast.error('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserAndTasks();
  }, [fetchUserAndTasks]);

  // 📌 下拉刷新处理
  const handlePullRefresh = useCallback(async () => {
    await fetchUserAndTasks();
    toast.success('刷新成功', { duration: 1500 });
  }, [fetchUserAndTasks]);

  // 📌 静默刷新
  const handleSilentRefresh = useCallback(async () => {
    try {
      const promises = [
        api.get('/task/all?category=active'),
        api.get('/task/all?category=archived')
      ];

      const [activeTasksRes, archivedTasksRes] = await Promise.allSettled(promises);

      const activeTaskList = activeTasksRes.status === 'fulfilled' ? activeTasksRes.value.data : [];
      const archivedTaskList = archivedTasksRes.status === 'fulfilled' ? archivedTasksRes.value.data : [];

      const checkSubmissions = async (taskList) => {
        const submissionPromises = taskList.map(async (task) => {
          try {
            const r = await api.get(`/submission/check/${task._id}`);
            return { ...task, submitted: r.data.submitted, submissionInfo: r.data.submission };
          } catch {
            return { ...task, submitted: false, submissionInfo: null };
          }
        });
        return Promise.all(submissionPromises);
      };

      const [activeResults, archivedResults] = await Promise.all([
        checkSubmissions(activeTaskList),
        checkSubmissions(archivedTaskList)
      ]);

      setTasks({
        active: activeResults,
        archived: archivedResults
      });

    } catch (error) {
      console.error('静默刷新失败:', error);
    }
  }, []);

  // ⏰ 自动定时刷新
  useAutoRefresh(handleSilentRefresh, {
    interval: 60000,
    enabled: true,
    pauseOnHidden: true,
    pauseOnOffline: true,
  });

  // 📌 切换任务分类
  const handleCategoryChange = useCallback((category) => {
    setCurrentCategory(category);
  }, []);

  // 🎯 任务状态计算
  const getTaskStatus = useCallback((task) => {
    const now = new Date();
    const deadline = new Date(task.deadline);

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
      return {
        status: task.allowLateSubmission ? 'late' : 'expired',
        text: task.allowLateSubmission ? '⚠️ 逾期可补交' : '🚨 已逾期',
        color: task.allowLateSubmission ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400',
        canSubmit: task.allowLateSubmission
      };
    }

    const hoursLeft = (deadline - now) / (1000 * 60 * 60);
    if (hoursLeft <= 24) {
      return {
        status: 'urgent',
        text: '🔥 24小时内截止',
        color: 'text-red-600 dark:text-red-400',
        canSubmit: true
      };
    }

    if (hoursLeft <= 72) {
      return {
        status: 'urgent',
        text: '🔥 3天内截止',
        color: 'text-orange-600 dark:text-orange-400',
        canSubmit: true
      };
    }

    if (hoursLeft <= 168) {
      return {
        status: 'warning',
        text: '⚠️ 即将截止',
        color: 'text-yellow-600 dark:text-yellow-500',
        canSubmit: true
      };
    }

    return {
      status: 'normal',
      text: '📝 进行中',
      color: 'text-blue-600 dark:text-blue-400',
      canSubmit: true
    };
  }, []);

  // 🆕 智能分类任务
  const categorizedTasks = useMemo(() => {
    if (currentCategory !== 'active') {
      return { [currentCategory]: tasks[currentCategory] || [] };
    }

    const activeTasks = tasks.active || [];
    const categorized = {
      overdue: [],     // 已逾期（不允许补交）
      urgent: [],      // 紧急任务（逾期可补交 + 3天内截止）
      inProgress: [],  // 进行中
      submitted: []    // 已提交
    };

    activeTasks.forEach(task => {
      const status = getTaskStatus(task);
      
      if (status.status === 'submitted') {
        categorized.submitted.push(task);
      } else if (status.status === 'expired') {
        categorized.overdue.push(task);
      } else if (status.status === 'late' || status.status === 'urgent') {
        categorized.urgent.push(task);
      } else {
        categorized.inProgress.push(task);
      }
    });

    return categorized;
  }, [tasks, currentCategory, getTaskStatus]);

  // 🎨 任务卡片样式
  const getTaskCardStyle = useCallback((status) => {
    const baseStyle = 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border rounded-mobile-2xl p-6 shadow-mobile transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]';
    
    switch (status.status) {
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

  const formatDeadline = useMemo(() => (deadline) => {
    const date = new Date(deadline);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // 🆕 移动端任务详情展开状态管理
  const [taskDetailsExpanded, setTaskDetailsExpanded] = useState({});

  const toggleTaskDetails = useCallback((taskId) => {
    setTaskDetailsExpanded(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  }, []);

  // 🆕 移动端任务卡片渲染（增强版，包含折叠详情）
  const renderMobileTaskCard = useCallback((task) => {
    const taskStatus = getTaskStatus(task);
    const detailsExpanded = taskDetailsExpanded[task._id] || false;
    
    const getCardStatus = () => {
      if (task.submitted) return 'completed';
      if (taskStatus.status === 'expired' && !taskStatus.canSubmit) return 'overdue';
      if (taskStatus.status === 'urgent') return 'urgent';
      if (taskStatus.status === 'warning') return 'warning';
      if (taskStatus.status === 'late') return 'warning';
      return 'default';
    };

    const getActionButton = () => {
      if (taskStatus.canSubmit && currentCategory === 'active') {
        const ButtonComponent = taskStatus.status === 'late' ? WarningButton : 
                              taskStatus.status === 'urgent' ? DangerButton : PrimaryButton;
        
        return (
          <ButtonComponent
            size="md"
            fullWidth
            icon={taskStatus.status === 'late' ? '⚠️' : '📤'}
            haptic
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/submit/${task._id}`);
            }}
          >
            {taskStatus.status === 'late' ? '补交作业' : '提交作业'}
          </ButtonComponent>
        );
      } else if (task.submitted && task.submissionInfo?.hasFeedback) {
        return (
          <SecondaryButton
            size="md"
            fullWidth
            icon="👁️"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/view-submission/${task._id}`);
            }}
          >
            查看反馈
          </SecondaryButton>
        );
      }
      return null;
    };

    return (
      <TaskCard
        key={task._id}
        status={getCardStatus()}
        className="mb-4"
      >
        <div className="space-y-4">
          {/* 任务头部 */}
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-3">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1 line-clamp-2">
                {task.title}
              </h3>
              <span className={`text-sm font-medium ${taskStatus.color}`}>
                {taskStatus.text}
              </span>
            </div>
            {taskStatus.status === 'urgent' && (
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
              </div>
            )}
          </div>

          {/* 截止时间 - 始终显示 */}
          <div className="bg-blue-50/80 dark:bg-blue-900/30 rounded-mobile-lg p-3 border border-blue-200/50 dark:border-blue-700/30">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-blue-600 dark:text-blue-400">⏰</span>
              <span className="font-medium text-blue-800 dark:text-blue-200">
                截止时间：{formatDeadline(task.deadline)}
              </span>
            </div>
          </div>

          {/* 任务描述 - 始终显示 */}
          {task.description && (
            <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-mobile-lg p-3">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 text-gray-600 dark:text-gray-400">📋</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">
                  {task.description}
                </p>
              </div>
            </div>
          )}

          {/* 可折叠的详细信息 */}
          <div>
          <button
            onClick={() => toggleTaskDetails(task._id)}
            className="group relative flex items-center justify-between w-full px-4 py-3 
                      bg-gray-50/80 dark:bg-gray-800/50 
                      hover:bg-gray-100/90 dark:hover:bg-gray-700/60
                      active:bg-gray-200/80 dark:active:bg-gray-600/50
                      border border-gray-200/60 dark:border-gray-700/40
                      hover:border-gray-300/80 dark:hover:border-gray-600/60
                      rounded-mobile-lg 
                      transition-all duration-300 ease-out
                      hover:shadow-sm hover:-translate-y-0.5
                      active:scale-[0.98] active:translate-y-0
                      touch-manipulation"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 
                              group-hover:text-gray-900 dark:group-hover:text-gray-100 
                              transition-colors duration-200">
                详细信息
              </span>
            </div>
            
            {/* 动态箭头 */}
            <motion.div
              animate={{ 
                rotate: detailsExpanded ? 180 : 0,
                scale: detailsExpanded ? 1.1 : 1 
              }}
              transition={{ 
                duration: 0.3, 
                ease: [0.25, 0.46, 0.45, 0.94] // 优雅的缓动曲线
              }}
              className="flex items-center justify-center w-6 h-6 
                        text-gray-500 dark:text-gray-400
                        group-hover:text-gray-700 dark:group-hover:text-gray-200
                        transition-colors duration-200"
            >
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 12 12" 
                fill="none"
                className="transition-all duration-200"
              >
                <path 
                  d="M3 4.5L6 7.5L9 4.5" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
            
            {/* 微妙的渐变光晕效果（可选） */}
            <div className="absolute inset-0 rounded-mobile-lg 
                            bg-gradient-to-r from-transparent via-white/10 to-transparent
                            opacity-0 group-hover:opacity-100 
                            transition-opacity duration-300 pointer-events-none" />
          </button>
            
            <AnimatePresence>
              {detailsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 pt-2">
                    <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-mobile-lg p-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">📂 任务信息</div>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">类型:</span> {task.category}</p>
                        <p><span className="font-medium">文件:</span> {task.needsFile ? '必交' : '可选'}</p>
                        <p><span className="font-medium">AIGC:</span> {task.allowAIGC ? '允许' : '禁止'}</p>
                        {task.allowAIGC && (
                          <p><span className="font-medium">AIGC日志:</span> {task.requireAIGCLog ? '必需' : '可选'}</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-mobile-lg p-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">⏰ 时间设置</div>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">逾期:</span> {task.allowLateSubmission ? '允许' : '不允许'}</p>
                        <p><span className="font-medium">创建:</span> {new Date(task.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 操作按钮 - 始终显示 */}
          {getActionButton()}

          {/* 已提交任务的反馈预览 */}
          {task.submitted && task.submissionInfo?.hasFeedback && (
            <div className="bg-green-50/80 dark:bg-green-900/30 rounded-mobile-lg p-3 border border-green-200/50 dark:border-green-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800 dark:text-green-200">📝 教师反馈</span>
                {task.submissionInfo.feedbackRating && (
                  <span className="text-sm text-green-600 dark:text-green-400">
                    {'⭐'.repeat(task.submissionInfo.feedbackRating)}
                  </span>
                )}
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 line-clamp-2">
                {task.submissionInfo.feedbackPreview}
              </p>
            </div>
          )}
        </div>
      </TaskCard>
    );
  }, [getTaskStatus, currentCategory, navigate, formatDeadline, taskDetailsExpanded, toggleTaskDetails]);

  // 🆕 渲染智能分类区域
  const renderSmartCategories = useCallback(() => {
    if (currentCategory !== 'active') return null;

    const categories = [
      {
        key: 'overdue',
        title: '🚨 已逾期',
        tasks: categorizedTasks.overdue,
        defaultCollapsed: true
      },
      {
        key: 'urgent',
        title: '🔥 紧急任务',
        tasks: categorizedTasks.urgent,
        defaultCollapsed: false
      },
      {
        key: 'inProgress',
        title: '📝 进行中',
        tasks: categorizedTasks.inProgress,
        defaultCollapsed: false
      },
      {
        key: 'submitted',
        title: '✅ 已提交',
        tasks: categorizedTasks.submitted,
        defaultCollapsed: true
      }
    ];

    return categories.map(({ key, title, tasks: categoryTasks, defaultCollapsed }) => {
      if (categoryTasks.length === 0) return null;

      const isCollapsed = collapsedSections[key];

      return (
        <div key={key} className="mb-6">
          {/* 分类标题 */}
          <button
            onClick={() => updateCollapsedSection(key, !isCollapsed)}
            className="flex items-center justify-between w-full mb-4 px-2 py-2 rounded-mobile-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors touch-manipulation"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {title}
              </span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400">
                {categoryTasks.length}个任务
              </span>
            </div>
            <motion.span
              animate={{ rotate: isCollapsed ? -90 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-gray-400 dark:text-gray-500 text-lg"
            >
              ▼
            </motion.span>
          </button>

          {/* 任务列表 */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="space-y-4">
                  {categoryTasks.map((task, index) =>
                    isMobile ? (
                      <motion.div
                        key={task._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {renderMobileTaskCard(task)}
                      </motion.div>
                    ) : (
                      <motion.div
                        key={task._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={getTaskCardStyle(getTaskStatus(task))}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                              {task.title}
                            </h3>
                            {task.description && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3 border border-blue-200 dark:border-blue-700">
                                <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                                  📋 {task.description}
                                </p>
                              </div>
                            )}
                          </div>
                          <span className={`text-sm font-medium ${getTaskStatus(task).color} ml-4 flex-shrink-0`}>
                            {getTaskStatus(task).text}
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
                                📋 AIGC 日志：{task.requireAIGCLog ? '必需' : '可选'}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              ⏰ 截止时间：{formatDeadline(task.deadline)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              🔄 逾期提交：{task.allowLateSubmission ? '允许' : '不允许'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              📅 创建时间：{new Date(task.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {getTaskStatus(task).canSubmit && currentCategory === 'active' && (
                            <PrimaryButton
                              size="md"
                              icon="📤"
                              onClick={() => navigate(`/submit/${task._id}`)}
                            >
                              提交作业
                            </PrimaryButton>
                          )}
                          {task.submitted && task.submissionInfo?.hasFeedback && (
                            <SecondaryButton
                              size="md"
                              icon="👁️"
                              onClick={() => navigate(`/view-submission/${task._id}`)}
                            >
                              查看反馈
                            </SecondaryButton>
                          )}
                        </div>

                        {task.submitted && task.submissionInfo?.hasFeedback && (
                          <div className="mt-4 bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-green-800 dark:text-green-200">📝 教师反馈</span>
                              {task.submissionInfo.feedbackRating && (
                                <span className="text-sm text-green-600 dark:text-green-400">
                                  {'⭐'.repeat(task.submissionInfo.feedbackRating)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-300 line-clamp-2">
                              {task.submissionInfo.feedbackPreview}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/view-submission/${task._id}`)}
                              className="mt-2 text-xs"
                            >
                              查看完整反馈 →
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  }, [currentCategory, categorizedTasks, collapsedSections, updateCollapsedSection, isMobile, renderMobileTaskCard, getTaskCardStyle, getTaskStatus, formatDeadline, navigate]);

  // 当前任务列表（用于非active分类）
  const currentTasks = useMemo(() => tasks[currentCategory] || [], [tasks, currentCategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <PullToRefreshContainer 
      onRefresh={handlePullRefresh}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20"
      disabled={loading}
    >
      <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 欢迎区域 - 使用智能欢迎词 */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-gradient-to-r from-white via-blue-50/30 to-purple-50/30 dark:from-gray-800 dark:via-blue-900/10 dark:to-purple-900/10 rounded-mobile-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-xl shadow-mobile p-6">
          
          {/* 🆕 修复：移动端三行布局 */}
          <div className={`${isMobile ? 'space-y-4' : 'flex justify-between items-start gap-4'}`}>
            
            {/* 第一行：问候词（移动端独占一行，桌面端仍在flex中） */}
            <div className="flex-1 min-w-0">
              <h1 className={`font-bold mb-2 text-gray-800 dark:text-gray-100 ${
                isMobile ? 'text-xl' : 'text-2xl'
              }`}>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {user ? getGreeting('student', user.nickname, user.email) : '欢迎回来'}
                </span>
              </h1>
              
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-gray-400 mb-2">
                  🕐 {new Date().toLocaleTimeString()} - 当前时段
                </p>
              )}
              
              {/* 第二行：任务情况（移动端独占一行，桌面端仍在flex中） */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {tasks.active.length} 个当前任务
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {tasks.active.filter(t => t.submitted).length} 个已完成
                  </span>
                </div>
              </div>
            </div>

            {/* 第三行：按钮（移动端独占一行，桌面端仍在flex中） */}
            <div className={`${isMobile ? 'w-full' : 'flex-shrink-0'}`}>
              <PrimaryButton
                size={isMobile ? "md" : "md"}
                icon="➕"
                haptic
                onClick={() => navigate('/join-class')}
                gradient
                className={`${isMobile ? 'w-full' : 'min-w-[120px]'}`}
              >
                加入班级
              </PrimaryButton>
            </div>
          </div>
        </div>
      </motion.div>
        {/* 任务分类标签 */}
        <div className="mb-6">
          <div className={`flex bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 p-1.5 rounded-mobile-2xl shadow-mobile ${
            isMobile ? 'gap-1' : 'gap-1'
          }`}>
            {[
              { key: 'active', label: '📋 当前任务', count: tasks.active.length, icon: '📋', color: 'blue' },
              { key: 'archived', label: '📦 已归档', count: tasks.archived.length, icon: '📦', color: 'gray' }
            ].map(({ key, label, count, icon, color }) => (
              <button
                key={key}
                onClick={() => handleCategoryChange(key)}
                className={`flex-1 px-4 py-3 rounded-mobile-xl text-sm font-medium transition-all duration-300 ease-out touch-manipulation ${
                  currentCategory === key
                    ? `bg-gradient-to-r ${
                        color === 'blue' 
                          ? 'from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                          : 'from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/25'
                      }`
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>{icon}</span>
                  <span className={isMobile ? 'hidden sm:inline' : ''}>{label.replace(icon + ' ', '')}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                    currentCategory === key 
                      ? 'bg-white/20 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {count}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 任务内容区域 */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {currentCategory === 'active' ? (
              // 🆕 智能分类显示
              <motion.div
                key="smart-categories"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {renderSmartCategories()}
              </motion.div>
            ) : (
              // 原有的归档任务显示
              currentTasks.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <p className="text-gray-500 dark:text-gray-400">
                    {currentCategory === 'active' ? '暂无当前任务' : '暂无归档任务'}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {currentTasks.map((task, index) =>
                    isMobile ? (
                      <motion.div
                        key={task._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {renderMobileTaskCard(task)}
                      </motion.div>
                    ) : (
                      <motion.div
                        key={task._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={getTaskCardStyle(getTaskStatus(task))}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                              {task.title}
                            </h3>
                            {task.description && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3 border border-blue-200 dark:border-blue-700">
                                <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                                  📋 {task.description}
                                </p>
                              </div>
                            )}
                          </div>
                          <span className={`text-sm font-medium ${getTaskStatus(task).color} ml-4 flex-shrink-0`}>
                            {getTaskStatus(task).text}
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
                                📋 AIGC 日志：{task.requireAIGCLog ? '必需' : '可选'}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              ⏰ 截止时间：{formatDeadline(task.deadline)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              🔄 逾期提交：{task.allowLateSubmission ? '允许' : '不允许'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              📅 创建时间：{new Date(task.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {getTaskStatus(task).canSubmit && currentCategory === 'active' && (
                            <PrimaryButton
                              size="md"
                              icon="📤"
                              onClick={() => navigate(`/submit/${task._id}`)}
                            >
                              提交作业
                            </PrimaryButton>
                          )}
                          {task.submitted && task.submissionInfo?.hasFeedback && (
                            <SecondaryButton
                              size="md"
                              icon="👁️"
                              onClick={() => navigate(`/view-submission/${task._id}`)}
                            >
                              查看反馈
                            </SecondaryButton>
                          )}
                        </div>

                        {task.submitted && task.submissionInfo?.hasFeedback && (
                          <div className="mt-4 bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-green-800 dark:text-green-200">📝 教师反馈</span>
                              {task.submissionInfo.feedbackRating && (
                                <span className="text-sm text-green-600 dark:text-green-400">
                                  {'⭐'.repeat(task.submissionInfo.feedbackRating)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-300 line-clamp-2">
                              {task.submissionInfo.feedbackPreview}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/view-submission/${task._id}`)}
                              className="mt-2 text-xs"
                            >
                              查看完整反馈 →
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )
                  )}
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>
      <NicknamePrompt
        user={user}
        onUserUpdate={handleUserUpdate}
      />
    </PullToRefreshContainer>
  );
};

export default StudentDashboard;