// client/src/pages/StudentDashboard.jsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import MobileCard, { TaskCard } from '../components/MobileCard';

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

    return (
      <TaskCard
        key={task._id}
        onClick={() => {
          if (taskStatus.canSubmit && currentCategory === 'active') {
            navigate(`/submit/${task._id}`);
          } else if (task.submitted) {
            navigate(`/view-submission/${task._id}`);
          }
        }}
        className={`mb-4 ${taskStatus.canSubmit || task.submitted ? 'cursor-pointer' : ''}`}
      >
        {/* 任务头部 */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 line-clamp-2 mb-1">
              {task.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${taskStatus.color} bg-opacity-10`}>
                {taskStatus.text}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {task.category}
              </span>
            </div>
          </div>
        </div>

        {/* 任务描述 */}
        {task.description && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-3">
            <p className="text-sm text-blue-800 dark:text-blue-200 line-clamp-2">
              📋 {task.description}
            </p>
          </div>
        )}

        {/* 任务信息网格 */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <div className="space-y-1">
            <p className="text-gray-500 dark:text-gray-400">
              📂 {task.category}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              📝 {task.needsFile ? '必交文件' : '可选文件'}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              🤖 {task.allowAIGC ? '允许AIGC' : '禁止AIGC'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-500 dark:text-gray-400">
              ⏰ {formatDeadline(task.deadline)}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              📚 {task.classIds && task.classIds.length > 0
                ? task.classIds.map(cls => cls.name).join('，')
                : '未绑定'}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              📋 {task.allowLateSubmission ? '允许逾期' : '不允许逾期'}
            </p>
          </div>
        </div>

        {/* 特殊状态提示 */}
        {taskStatus.status === 'late' && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3 mb-3">
            <p className="text-sm text-orange-700 dark:text-orange-300">
              ⚠️ 此任务已逾期，提交后将被标注为逾期作业
            </p>
          </div>
        )}

        {task.isArchived && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              📦 此任务已归档，仅供查看
            </p>
          </div>
        )}

        {/* 反馈预览 */}
        {task.submitted && task.submissionInfo?.hasFeedback && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 mb-3">
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
          </div>
        )}

        {/* 提交状态 */}
        {task.submissionInfo && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              ✅ 已于 {new Date(task.submissionInfo.submittedAt).toLocaleString()} 提交
              {task.submissionInfo.isLateSubmission && ' (逾期提交)'}
            </p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {taskStatus.canSubmit && currentCategory === 'active' && (
            <Button
              variant={taskStatus.status === 'late' ? "warning" :
                taskStatus.status === 'urgent' ? "danger" : "primary"}
              size="sm"
              fullWidth
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/submit/${task._id}`);
              }}
            >
              {taskStatus.status === 'late' ? '⚠️ 逾期提交' : '📤 提交作业'}
            </Button>
          )}

          {task.submitted && (
            <Button
              variant="secondary"
              size="sm"
              fullWidth={!taskStatus.canSubmit}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/view-submission/${task._id}`);
              }}
            >
              👀 查看提交
            </Button>
          )}

          {!taskStatus.canSubmit && taskStatus.status === 'expired' && currentCategory === 'active' && (
            <div className="w-full text-center py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ❌ 已截止，无法提交
              </span>
            </div>
          )}
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
          <h1 className={`font-semibold mb-4 text-gray-800 dark:text-gray-100 ${
            isMobile ? 'text-xl' : 'text-2xl'
          }`}>
            欢迎回来，
            <span className="text-blue-600 dark:text-blue-400 block sm:inline">
              {user.email}
            </span>
          </h1>

          <div className="flex justify-end">
            <Button
              variant="primary"
              size={isMobile ? "md" : "md"}
              onClick={() => navigate('/join-class')}
            >
              ➕ 加入班级
            </Button>
          </div>
        </motion.div>

        {/* 任务分类标签 - 移动端优化 */}
        <div className="mb-6">
          <div className={`flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl ${
            isMobile ? 'gap-1' : 'gap-1'
          }`}>
            {[
              { key: 'active', label: '📋 当前任务', count: tasks.active.length },
              { key: 'archived', label: '📦 已归档', count: tasks.archived.length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => handleCategoryChange(key)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentCategory === key
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <span className={isMobile ? 'block' : 'inline'}>
                  {isMobile ? label.split(' ')[0] : label}
                </span>
                <span className={`${isMobile ? 'block text-xs' : 'ml-1'}`}>
                  ({count})
                </span>
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