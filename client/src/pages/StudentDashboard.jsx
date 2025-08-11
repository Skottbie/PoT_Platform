// client/src/pages/StudentDashboard.jsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
//import MobileCard, { TaskCard } from '../components/MobileCard';
import { TaskCard } from '../components/EnhancedMobileCard';
import { PrimaryButton, SecondaryButton, WarningButton, DangerButton } from '../components/EnhancedButton';


const StudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState({
    active: [],
    archived: []
  });
  const [currentCategory, setCurrentCategory] = useState('active');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 📌 新增：检测移动端状态
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkIsMobile = () => {
      // 在此处使用 tailwindcss 的断点
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 🚀 并发获取数据，显著提升加载速度
  const fetchUserAndTasks = useCallback(async () => {
    try {
      setLoading(true);

      // 并行请求关键数据
      const promises = [
        api.get('/user/profile'),
        api.get('/task/all?category=active'),
        api.get('/task/all?category=archived')
      ];

      const [userRes, activeTasksRes, archivedTasksRes] = await Promise.allSettled(promises);

      // 处理用户信息
      if (userRes.status === 'fulfilled') {
        if (userRes.value.data.role !== 'student') {
          navigate('/');
          return;
        }
        setUser(userRes.value.data);
      }

      // 处理任务数据
      const activeTaskList = activeTasksRes.status === 'fulfilled' ? activeTasksRes.value.data : [];
      const archivedTaskList = archivedTasksRes.status === 'fulfilled' ? archivedTasksRes.value.data : [];

      // 🎯 并行检查提交状态，避免串行请求
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

    } catch (err) {
      console.error('获取数据失败:', err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserAndTasks();
  }, [fetchUserAndTasks]);

  // 🎯 预加载可能访问的任务详情
  useEffect(() => {
    if (tasks.active.length > 0) {
      // 延迟预加载前3个任务的详情
      setTimeout(() => {
        tasks.active.slice(0, 3).forEach(task => {
          api.get(`/task/${task._id}`).catch(() => { });
        });
      }, 2000);
    }
  }, [tasks.active]);

  // 📌 切换任务分类
  const handleCategoryChange = useCallback((category) => {
    setCurrentCategory(category);
  }, []);

  // 🎯 优化任务状态计算，使用 useMemo 避免重复计算
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

  // 🚀 提前计算当前任务列表，避免在渲染中计算
  const currentTasks = useMemo(() => tasks[currentCategory] || [], [tasks, currentCategory]);

  // 📌 新增：移动端任务卡片渲染函数
  const renderMobileTaskCard = useCallback((task) => {
    const taskStatus = getTaskStatus(task);
    
    // 根据任务状态确定卡片样式
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
            {taskStatus.status === 'late' ? '逾期提交' : '提交作业'}
          </ButtonComponent>
        );
      }

      if (task.submitted) {
        return (
          <SecondaryButton
            size="md"
            fullWidth={!taskStatus.canSubmit}
            icon="👀"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/view-submission/${task._id}`);
            }}
          >
            查看提交
          </SecondaryButton>
        );
      }

      if (!taskStatus.canSubmit && taskStatus.status === 'expired' && currentCategory === 'active') {
        return (
          <div className="w-full text-center py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-mobile-lg border border-gray-300 dark:border-gray-600">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              ❌ 已截止，无法提交
            </span>
          </div>
        );
      }

      return null;
    };

    return (
      <TaskCard
        key={task._id}
        status={getCardStatus()}
        urgent={taskStatus.status === 'urgent'}
        onClick={() => {
          if (taskStatus.canSubmit && currentCategory === 'active') {
            navigate(`/submit/${task._id}`);
          } else if (task.submitted) {
            navigate(`/view-submission/${task._id}`);
          }
        }}
        className="mb-4 relative overflow-hidden"
      >
        {/* 任务头部 - 重新设计 */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 line-clamp-2 mb-2">
              {task.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`
                inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                ${taskStatus.status === 'urgent' 
                  ? 'bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/50' 
                  : taskStatus.status === 'late'
                  ? 'bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700/50'
                  : taskStatus.status === 'warning'
                  ? 'bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700/50'
                  : task.submitted
                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700/50'
                  : 'bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50'
                }
              `}>
                {taskStatus.text}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {task.category}
              </span>
            </div>
          </div>
          
          {/* 紧急标识 */}
          {taskStatus.status === 'urgent' && (
            <div className="flex-shrink-0">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
            </div>
          )}
        </div>

        {/* 任务描述 - 优化显示 */}
        {task.description && (
          <div className="mb-4">
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-mobile-lg p-4 border border-blue-200/50 dark:border-blue-700/30">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 text-blue-600 dark:text-blue-400 text-lg">📋</span>
                <p className="text-sm text-blue-800 dark:text-blue-200 line-clamp-3 leading-relaxed">
                  {task.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 任务信息网格 - 重新设计 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-mobile-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span>📂</span>
              <span className="font-medium">类型</span>
            </div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{task.category}</p>
            
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-2">
              <span>📝</span>
              <span className="font-medium">文件</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {task.needsFile ? '必交' : '可选'}
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-2">
              <span>🤖</span>
              <span className="font-medium">AIGC</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {task.allowAIGC ? '允许' : '禁止'}
            </p>
          </div>

          <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-mobile-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span>⏰</span>
              <span className="font-medium">截止</span>
            </div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">
              {formatDeadline(task.deadline)}
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-2">
              <span>📚</span>
              <span className="font-medium">班级</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
              {task.classIds && task.classIds.length > 0
                ? task.classIds.map(cls => cls.name).join('，')
                : '未绑定'}
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-2">
              <span>📋</span>
              <span className="font-medium">逾期</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {task.allowLateSubmission ? '允许' : '不允许'}
            </p>
          </div>
        </div>

        {/* 特殊状态提示 - 重新设计 */}
        {taskStatus.status === 'late' && (
          <div className="mb-4">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-700/50 rounded-mobile-lg p-3">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 text-orange-600 dark:text-orange-400 text-lg">⚠️</span>
                <p className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed">
                  此任务已逾期，提交后将被标注为逾期作业
                </p>
              </div>
            </div>
          </div>
        )}

        {task.isArchived && (
          <div className="mb-4">
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border border-gray-200 dark:border-gray-700/50 rounded-mobile-lg p-3">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 text-gray-600 dark:text-gray-400 text-lg">📦</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  此任务已归档，仅供查看
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 反馈预览 - 重新设计 */}
        {task.submitted && task.submissionInfo?.hasFeedback && (
          <div className="mb-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700/50 rounded-mobile-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-600 dark:text-green-400 font-medium text-sm">
                  💬 教师已反馈
                </span>
                {task.submissionInfo.feedbackRating && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: task.submissionInfo.feedbackRating }, (_, i) => (
                      <span key={i} className="text-yellow-500 text-sm">⭐</span>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 line-clamp-2 leading-relaxed">
                {task.submissionInfo.feedbackPreview}
              </p>
            </div>
          </div>
        )}

        {/* 提交状态 - 重新设计 */}
        {task.submissionInfo && (
          <div className="mb-4">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700/50 rounded-mobile-lg p-3">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 text-blue-600 dark:text-blue-400 text-lg">✅</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">
                    已于 {new Date(task.submissionInfo.submittedAt).toLocaleString()} 提交
                  </p>
                  {task.submissionInfo.isLateSubmission && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300">
                      逾期提交
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 - 使用新的按钮组件 */}
        <div className="flex gap-3">
          {getActionButton()}
        </div>

        {/* 卡片右上角装饰 - 根据状态显示 */}
        <div className="absolute top-4 right-4 opacity-20 dark:opacity-10 pointer-events-none">
          <div className={`w-16 h-16 rounded-full ${
            task.submitted 
              ? 'bg-gradient-to-br from-green-400 to-emerald-500'
              : taskStatus.status === 'urgent'
              ? 'bg-gradient-to-br from-red-400 to-rose-500'
              : taskStatus.status === 'warning' || taskStatus.status === 'late'
              ? 'bg-gradient-to-br from-orange-400 to-amber-500'
              : 'bg-gradient-to-br from-blue-400 to-cyan-500'
          }`} />
        </div>
      </TaskCard>
    );
  }, [currentCategory, getTaskStatus, formatDeadline, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">获取用户信息中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 欢迎区域 */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-gradient-to-r from-white via-blue-50/30 to-purple-50/30 dark:from-gray-800 dark:via-blue-900/10 dark:to-purple-900/10 rounded-mobile-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-xl shadow-mobile p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <h1 className={`font-bold mb-2 text-gray-800 dark:text-gray-100 ${
                  isMobile ? 'text-xl' : 'text-2xl'
                }`}>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    欢迎回来
                  </span>
                  <span className="block sm:inline text-gray-700 dark:text-gray-300 mt-1 sm:mt-0">
                    {user.email}
                  </span>
                </h1>
                
                {/* 快速统计 */}
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

              <div className="flex-shrink-0">
                <PrimaryButton
                  size={isMobile ? "md" : "md"}
                  icon="➕"
                  haptic
                  onClick={() => navigate('/join-class')}
                  gradient
                  className="min-w-[120px]"
                >
                  加入班级
                </PrimaryButton>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 任务分类标签 - 移动端优化 */}
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
                          ? 'from-blue-500 to-cyan-500 text-white shadow-mobile-lg transform scale-[1.02]' 
                          : 'from-gray-500 to-slate-500 text-white shadow-mobile-lg transform scale-[1.02]'
                      }`
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {isMobile ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg">{icon}</span>
                      <span className="text-xs font-semibold">({count})</span>
                    </div>
                  ) : (
                    <>
                      <span>{label}</span>
                      <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${
                        currentCategory === key
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {count}
                      </span>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 任务列表 */}
        <AnimatePresence mode="wait">
          {currentTasks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-10"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-gray-400 dark:text-gray-500 text-2xl">📋</span>
              </div>
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
                  // 保持原有的桌面端渲染逻辑
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
                            ? task.classIds.map(cls => cls.name).join('，')
                            : '未绑定'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          📋 逾期提交：{task.allowLateSubmission ? '允许' : '不允许'}
                        </p>
                        {getTaskStatus(task).status === 'late' && (
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

                    <div className="flex gap-2 flex-wrap">
                      {getTaskStatus(task).canSubmit && currentCategory === 'active' && (
                        <Button
                          variant={getTaskStatus(task).status === 'late' ? "warning" :
                            getTaskStatus(task).status === 'urgent' ? "danger" : "primary"}
                          onClick={() => navigate(`/submit/${task._id}`)}
                        >
                          {getTaskStatus(task).status === 'late' ? '⚠️ 逾期提交' : '📤 提交作业'}
                        </Button>
                      )}

                      {task.submitted && (
                        <Button
                          variant="secondary"
                          onClick={() => navigate(`/view-submission/${task._id}`)}
                        >
                          👀 查看我的提交
                        </Button>
                      )}

                      {!getTaskStatus(task).canSubmit && getTaskStatus(task).status === 'expired' && currentCategory === 'active' && (
                        <div className="px-5 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-center">
                          ❌ 已截止，无法提交
                        </div>
                      )}

                      {currentCategory === 'archived' && (
                        <div className="px-5 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-center text-sm">
                          📦 归档任务，仅供查看
                          {task.submitted && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/view-submission/${task._id}`)}
                              className="ml-2"
                            >
                              👀 查看提交
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {task.submitted && task.submissionInfo?.hasFeedback && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-green-600 dark:text-green-400 font-medium text-sm">
                            💬 教师已反馈
                          </span>
                          {task.submissionInfo.feedbackRating && (
                            <span className="text-yellow-500">
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
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StudentDashboard;