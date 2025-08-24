// client/src/pages/StudentDashboard.jsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
//import MobileCard, { TaskCard } from '../components/MobileCard';
import { TaskCard } from '../components/EnhancedMobileCard';
import { PrimaryButton, SecondaryButton, WarningButton, DangerButton, GhostButton  } from '../components/EnhancedButton';
import PullToRefreshContainer from '../components/PullToRefreshContainer';
import useAutoRefresh from '../hooks/useAutoRefresh';
import toast from 'react-hot-toast';
import { getGreeting } from '../utils/greetings';
import NicknamePrompt from '../components/NicknamePrompt';

import { 
  ClipboardList,    // 📋 替换
  Tag,              // 📂 替换  
  CloudUpload,      // 📝 替换 (云上传)
  Bot,              // 🤖 替换
  Clock,            // ⏰ 替换
  Archive,          // 📦 替换
  CheckCircle,      // ✅替换
  AlertTriangle,    // ⚠️ 替换
  X,                // ❌ 替换
  Calendar,         // 📅 替换
  Timer,            // 🔥 替换 (计时器表示紧急)
  Eye,              // 👀 替换
  Send,             // 📤 替换
  BookOpen,         // 📚 替换
  MessageCircle,    // 💬 替换
  Star,             // ⭐ 替换
  Plus,             // ➕ 替换
  FileText,         // 📋 在某些上下文中替换
  Clock3,            // 用于开发环境的时间显示
  ChevronDown,      
  ChevronUp         
} from 'lucide-react';



const CollapsibleSection = React.memo(({ title, count, type, isCollapsed, onToggle, children }) => {
  // 根据类型选择图标和颜色主题
  const getTheme = () => {
    if (type === 'incomplete') {
      return {
        icon: <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
        bgColor: 'bg-blue-50 dark:bg-gray-800/50 border border-blue-100 dark:border-gray-700',
        hoverBg: 'hover:bg-blue-100 dark:hover:bg-gray-700/50'
      };
    } else {
      return {
        icon: <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />,
        bgColor: 'bg-green-50 dark:bg-gray-800/50 border border-green-100 dark:border-gray-700', 
        hoverBg: 'hover:bg-green-100 dark:hover:bg-gray-700/50'
      };
    }
  };

  const theme = getTheme();

  return (
    <div className="space-y-3">
      <button
        onClick={() => onToggle(type)}
        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${theme.bgColor} ${theme.hoverBg}`}
      >
        <div className="flex items-center gap-3">
          {theme.icon}
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {title} ({count})
          </span>
        </div>
        <motion.div
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="space-y-4 pl-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});



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

  // 📌 新增：折叠状态管理（只针对当前任务）
  const [collapsedStates, setCollapsedStates] = useState({
    incomplete: false, // 未完成任务默认展开
    completed: true    // 已完成任务默认折叠
  });

  const handleUserUpdate = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);


  // 📌 新增：切换折叠状态
  const toggleCollapse = useCallback((type) => {
    setCollapsedStates(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  }, []);

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


  // 🔄 下拉刷新处理函数（包含toast）
  const handlePullRefresh = useCallback(async () => {
    try {
      await fetchUserAndTasks();
      toast.success('刷新成功');
    } catch (error) {
      console.error('下拉刷新失败:', error);
      toast.error('刷新失败，请重试');
    }
  }, [fetchUserAndTasks]);

  // 🔕 静默自动刷新函数（完全无感）
  const handleSilentRefresh = useCallback(async () => {
    try {
      // 静默获取数据，不显示任何loading或toast
      const [userRes, activeTasksRes, archivedTasksRes] = await Promise.allSettled([
        api.get('/user/profile'),
        api.get('/task/all?category=active'),
        api.get('/task/all?category=archived')
      ]);

      // 静默处理用户信息
      if (userRes.status === 'fulfilled') {
        setUser(userRes.value.data);
      }

      // 静默处理任务数据
      const activeTaskList = activeTasksRes.status === 'fulfilled' ? activeTasksRes.value.data : [];
      const archivedTaskList = archivedTasksRes.status === 'fulfilled' ? archivedTasksRes.value.data : [];

      // 静默检查提交状态
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

      // 静默更新状态
      setTasks({
        active: activeResults,
        archived: archivedResults
      });

    } catch (error) {
      // 只记录到控制台，不显示给用户
      console.error('静默刷新失败:', error);
    }
  }, []);

  // ⏰ 自动定时刷新（使用静默函数）
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

  // 🎯 优化任务状态计算，使用 useMemo 避免重复计算
  const getTaskStatus = useCallback((task) => {
    const now = new Date();
    const deadline = new Date(task.deadline);

    if (task.isArchived) {
      if (task.submitted) {
        return {
          status: 'archived_submitted',
          text: '已归档（已提交）',
          color: 'text-gray-600 dark:text-gray-400',
          canSubmit: false,
          icon: <Archive className="w-4 h-4" />
        };
      } else {
        return {
          status: 'archived_not_submitted',
          text: '已归档（未提交）',
          color: 'text-gray-600 dark:text-gray-400',
          canSubmit: false,
          icon: <Archive className="w-4 h-4" />
        };
      }
    }

    if (task.submitted) {
      return {
        status: 'submitted',
        text: '已提交',
        color: 'text-green-600 dark:text-green-400',
        canSubmit: false,
        icon: <CheckCircle className="w-4 h-4" />
      };
    }

    if (now > deadline) {
      if (task.allowLateSubmission) {
        return {
          status: 'late',
          text: '已逾期（可提交）',
          color: 'text-orange-600 dark:text-orange-400',
          canSubmit: true,
          icon: <AlertTriangle className="w-4 h-4" />
        };
      } else {
        return {
          status: 'expired',
          text: '已截止',
          color: 'text-red-600 dark:text-red-400',
          canSubmit: false,
          icon: <X className="w-4 h-4" />
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
        text: `还有${days}天`,
        color: 'text-green-600 dark:text-green-400',
        canSubmit: true,
        icon: <Calendar className="w-4 h-4" />
      };
    } else if (hours > 1) {
      return {
        status: 'warning',
        text: `还有${hours}小时`,
        color: 'text-yellow-600 dark:text-yellow-400',
        canSubmit: true,
        icon: <Clock className="w-4 h-4" />
      };
    } else {
      return {
        status: 'urgent',
        text: `还有${minutes}分钟`,
        color: 'text-red-600 dark:text-red-400',
        canSubmit: true,
        icon: <Timer className="w-4 h-4" />
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

  const formatMobileDeadline = useMemo(() => (deadline) => {
    const date = new Date(deadline);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();
    
    if (isToday) {
      return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `明天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      // 移动端显示 MM/DD HH:mm 格式
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit', 
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }, []);

  // 🚀 提前计算当前任务列表，避免在渲染中计算
  const currentTasks = useMemo(() => tasks[currentCategory] || [], [tasks, currentCategory]);


  // 🆕 新增：当前任务分组（只在active分类下生效）
  const groupedActiveTasks = useMemo(() => {
    if (currentCategory !== 'active') {
      return null; // 非当前任务分类不分组
    }
    
    const incomplete = currentTasks.filter(task => !task.submitted);
    const completed = currentTasks.filter(task => task.submitted);
    
    return {
      incomplete,
      completed
    };
  }, [currentTasks, currentCategory]);





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
          icon={taskStatus.status === 'late' ? <AlertTriangle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
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
          fullWidth
          icon={<Eye className="w-4 h-4" />}
          haptic
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
        <div className="flex items-center justify-center px-4 py-3 rounded-mobile-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-center">
          <X className="w-4 h-4 mr-2" />
          已截止，无法提交
        </div>
      );
    }

    if (currentCategory === 'archived') {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-center px-4 py-2 rounded-mobile-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-center text-sm">
            <Archive className="w-4 h-4 mr-2" />
            归档任务，仅供查看
          </div>
          {task.submitted && (
            <SecondaryButton
              size="sm"
              fullWidth
              icon={<Eye className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/view-submission/${task._id}`);
              }}
            >
              查看提交
            </SecondaryButton>
          )}
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

        {/* 任务描述 - 优化展示 */}
        {task.description && (
          <div className="mb-4">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700/50 rounded-mobile-lg p-4">
              <div className="flex items-start gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap leading-relaxed">
                  {task.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 信息网格 - 折叠设计 */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <Tag className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">类型: {task.category}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <CloudUpload className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">文件: {task.needsFile ? '必交' : '无'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <Bot className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">AIGC: {task.allowAIGC ? '允许' : '禁止'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">截止: {formatMobileDeadline(task.deadline)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 col-span-2">
            <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              班级: {task.classIds && task.classIds.length > 0
                ? task.classIds.map(cls => cls.name).join('，')
                : '未绑定'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 col-span-2">
            <ClipboardList className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">逾期: {task.allowLateSubmission ? '允许' : '不允许'}</span>
          </div>
        </div>

        {/* 特殊状态提示 */}
        {taskStatus.status === 'late' && (
          <div className="mb-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-mobile-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/50">
              <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
              <span className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                此任务已逾期，提交后将被标注为逾期作业
              </span>
            </div>
          </div>
        )}

        {task.isArchived && (
          <div className="mb-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-mobile-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/50">
              <Archive className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                此任务已归档，仅供查看
              </span>
            </div>
          </div>
        )}

        {/* 反馈预览 - 重新设计 */}
        {task.submitted && task.submissionInfo?.hasFeedback && (
          <div className="mb-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700/50 rounded-mobile-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-400 font-medium text-sm">
                  教师已反馈
                </span>
                {task.submissionInfo.feedbackRating && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: task.submissionInfo.feedbackRating }, (_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-yellow-500 fill-current" />
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
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
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
    <PullToRefreshContainer 
      onRefresh={handlePullRefresh}
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      disabled={loading}
    >
      <div className="overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 欢迎区域 - 使用智能欢迎词 */}
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
                    {/* 🆕 使用智能欢迎词系统 */}
                    {user ? getGreeting('student', user.nickname, user.email) : '欢迎回来'}
                  </span>
                </h1>
                
                {/* 🆕 添加时间段显示（可选，用于调试） */}
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-xs text-gray-400 mb-2">
                    <Clock3 className="w-3 h-3 inline mr-1" /> 
                    {new Date().toLocaleTimeString()} - 当前时段
                  </p>
                )}
                
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
                  icon={<Plus className="w-4 h-4" />}
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
                { 
                  key: 'active', 
                  label: '当前任务', 
                  count: tasks.active.length, 
                  icon: <ClipboardList className="w-4 h-4" />, 
                  color: 'blue' 
                },
                { 
                  key: 'archived', 
                  label: '已归档', 
                  count: tasks.archived.length, 
                  icon: <Archive className="w-4 h-4" />, 
                  color: 'gray' 
                }
              ].map(({ key, label, count, icon, color }) => (
                <button
                  key={key}
                  onClick={() => handleCategoryChange(key)}
                  className={`flex-1 px-4 py-3 rounded-mobile-xl text-sm font-medium transition-all duration-300 ease-out touch-manipulation ${
                    currentCategory === key
                      ? `bg-gradient-to-r ${
                          color === 'blue' 
                            ? 'from-blue-500 to-cyan-500 text-white shadow-lg'
                            : 'from-gray-500 to-gray-600 text-white shadow-lg'
                        }`
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {icon}
                    <span className="font-medium">{label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      currentCategory === key
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {count}
                    </span>
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12"
            >
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <ClipboardList className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
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
              {/* 🆕 当前任务分组显示 */}
              {currentCategory === 'active' && groupedActiveTasks ? (
                <div className="space-y-6">
                  {/* 未完成任务区域 */}
                  {groupedActiveTasks.incomplete.length > 0 && (
                    <CollapsibleSection
                      key="incomplete-section"
                      title="未完成任务"
                      count={groupedActiveTasks.incomplete.length}
                      type="incomplete"
                      isCollapsed={collapsedStates.incomplete}
                      onToggle={toggleCollapse}
                    >
                      {groupedActiveTasks.incomplete.map((task, index) =>
                        isMobile ? (
                          <motion.div
                            key={`incomplete-${task._id}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            layout
                          >
                            {renderMobileTaskCard(task)}
                          </motion.div>
                        ) : (
                          <motion.div
                            key={`incomplete-${task._id}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={getTaskCardStyle(getTaskStatus(task))}
                            layout
                          >
                            {/* 这里保持原有的桌面端任务卡片渲染逻辑 */}
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                                  {task.title}
                                </h3>
                                {task.description && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3 border border-blue-200 dark:border-blue-700">
                                    <div className="flex items-start gap-2">
                                      <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                      <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                                        {task.description}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <span className={`text-sm font-medium ${getTaskStatus(task).color} ml-4 flex-shrink-0`}>
                                {getTaskStatus(task).text}
                              </span>
                            </div>
                            {/* 这里需要继续保持原有的桌面端渲染逻辑，由于篇幅限制，建议复制原有的完整桌面端渲染代码 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                  <Tag className="w-4 h-4" />
                                  分类：{task.category}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                  <CloudUpload className="w-4 h-4" />
                                  作业文件：{task.needsFile ? '必交' : '无'}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                  <Bot className="w-4 h-4" />
                                  AIGC 使用：{task.allowAIGC ? '允许' : '禁止'}
                                </p>
                                {task.allowAIGC && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4" />
                                    AIGC 日志：{task.requireAIGCLog ? '必交' : '可选'}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  截止时间：{formatDeadline(task.deadline)}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                  <BookOpen className="w-4 h-4" />
                                  所属班级：
                                  {task.classIds && task.classIds.length > 0
                                    ? task.classIds.map(cls => cls.name).join('，')
                                    : '未绑定'}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                  <ClipboardList className="w-4 h-4" />
                                  逾期提交：{task.allowLateSubmission ? '允许' : '不允许'}
                                </p>
                                {getTaskStatus(task).status === 'late' && (
                                  <p className="text-sm text-orange-600 dark:text-orange-400 font-medium flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    此任务已逾期，提交后将被标注为逾期作业
                                  </p>
                                )}
                                {task.isArchived && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-2">
                                    <Archive className="w-4 h-4" />
                                    此任务已归档，仅供查看
                                  </p>
                                )}
                                {task.submissionInfo && (
                                  <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    已于 {new Date(task.submissionInfo.submittedAt).toLocaleString()} 提交
                                    {task.submissionInfo.isLateSubmission && ' (逾期提交)'}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                              {getTaskStatus(task).canSubmit && currentCategory === 'active' && (
                                getTaskStatus(task).status === 'late' ? (
                                  <WarningButton
                                    onClick={() => navigate(`/submit/${task._id}`)}
                                    icon={<AlertTriangle className="w-4 h-4" />}
                                  >
                                    逾期提交
                                  </WarningButton>
                                ) : getTaskStatus(task).status === 'urgent' ? (
                                  <DangerButton
                                    onClick={() => navigate(`/submit/${task._id}`)}
                                    icon={<Send className="w-4 h-4" />}
                                  >
                                    提交作业
                                  </DangerButton>
                                ) : (
                                  <PrimaryButton
                                    onClick={() => navigate(`/submit/${task._id}`)}
                                    icon={<Send className="w-4 h-4" />}
                                  >
                                    提交作业
                                  </PrimaryButton>
                                )
                              )}

                              {task.submitted && (
                                <SecondaryButton
                                  onClick={() => navigate(`/view-submission/${task._id}`)}
                                  icon={<Eye className="w-4 h-4" />}
                                >
                                  查看我的提交
                                </SecondaryButton>
                              )}

                              {!getTaskStatus(task).canSubmit && getTaskStatus(task).status === 'expired' && currentCategory === 'active' && (
                                <div className="px-5 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                  <div className="flex items-center justify-center gap-2">
                                    <X className="w-4 h-4" />
                                    <span>已截止，无法提交</span>
                                  </div>
                                </div>
                              )}

{/*                               {currentCategory === 'archived' && (
                                <div className="px-5 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm">
                                  <div className="flex items-center justify-center gap-2">
                                    <Archive className="w-4 h-4" />
                                    <span>归档任务，仅供查看</span>
                                  </div>
                                  {task.submitted && (
                                    <SecondaryButton
                                      size="sm"
                                      onClick={() => navigate(`/view-submission/${task._id}`)}
                                      icon={<Eye className="w-3 h-3" />}
                                      className="mt-2"
                                    >
                                      查看提交
                                    </SecondaryButton>
                                  )}
                                </div>
                              )} */}
                            </div>


                            {task.submitted && task.submissionInfo?.hasFeedback && (
                              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  <span className="text-green-600 dark:text-green-400 font-medium text-sm">
                                    教师已反馈
                                  </span>
                                  {task.submissionInfo.feedbackRating && (
                                    <span className="flex items-center gap-1">
                                      {Array.from({ length: task.submissionInfo.feedbackRating }, (_, i) => (
                                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                                      ))}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-green-700 dark:text-green-300 line-clamp-2">
                                  {task.submissionInfo.feedbackPreview}
                                </p>
                                <GhostButton
                                  size="sm"
                                  onClick={() => navigate(`/view-submission/${task._id}`)}
                                  className="mt-2 text-xs"
                                >
                                  查看完整反馈 →
                                </GhostButton>
                              </div>
                            )}
                          </motion.div>
                        )
                      )}
                    </CollapsibleSection>
                  )}

                  {/* 已完成任务区域 */}
                  {groupedActiveTasks.completed.length > 0 && (
                    <CollapsibleSection
                      key="completed-section"
                      title="已完成任务"
                      count={groupedActiveTasks.completed.length}
                      type="completed"
                      isCollapsed={collapsedStates.completed}
                      onToggle={toggleCollapse}
                    >
                      {groupedActiveTasks.completed.map((task, index) =>
                        isMobile ? (
                          <motion.div
                            key={`completed-${task._id}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            layout
                          >
                            {renderMobileTaskCard(task)}
                          </motion.div>
                        ) : (
                          <motion.div
                            key={`completed-${task._id}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={getTaskCardStyle(getTaskStatus(task))}
                            layout
                          >
                            {/* 同样保持原有的桌面端任务卡片渲染逻辑 */}
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                                  {task.title}
                                </h3>
                                {task.description && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3 border border-blue-200 dark:border-blue-700">
                                    <div className="flex items-start gap-2">
                                      <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                      <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                                        {task.description}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <span className={`text-sm font-medium ${getTaskStatus(task).color} ml-4 flex-shrink-0`}>
                                {getTaskStatus(task).text}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                  <Tag className="w-4 h-4" />
                                  分类：{task.category}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                  <CloudUpload className="w-4 h-4" />
                                  作业文件：{task.needsFile ? '必交' : '无'}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                  <Bot className="w-4 h-4" />
                                  AIGC 使用：{task.allowAIGC ? '允许' : '禁止'}
                                </p>
                                {task.allowAIGC && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4" />
                                    AIGC 日志：{task.requireAIGCLog ? '必交' : '可选'}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  截止时间：{formatDeadline(task.deadline)}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                  <BookOpen className="w-4 h-4" />
                                  所属班级：
                                  {task.classIds && task.classIds.length > 0
                                    ? task.classIds.map(cls => cls.name).join('，')
                                    : '未绑定'}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                  <ClipboardList className="w-4 h-4" />
                                  逾期提交：{task.allowLateSubmission ? '允许' : '不允许'}
                                </p>
                                {getTaskStatus(task).status === 'late' && (
                                  <p className="text-sm text-orange-600 dark:text-orange-400 font-medium flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    此任务已逾期，提交后将被标注为逾期作业
                                  </p>
                                )}
                                {task.isArchived && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-2">
                                    <Archive className="w-4 h-4" />
                                    此任务已归档，仅供查看
                                  </p>
                                )}
                                {task.submissionInfo && (
                                  <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    已于 {new Date(task.submissionInfo.submittedAt).toLocaleString()} 提交
                                    {task.submissionInfo.isLateSubmission && ' (逾期提交)'}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                              {getTaskStatus(task).canSubmit && currentCategory === 'active' && (
                                getTaskStatus(task).status === 'late' ? (
                                  <WarningButton
                                    onClick={() => navigate(`/submit/${task._id}`)}
                                    icon={<AlertTriangle className="w-4 h-4" />}
                                  >
                                    逾期提交
                                  </WarningButton>
                                ) : getTaskStatus(task).status === 'urgent' ? (
                                  <DangerButton
                                    onClick={() => navigate(`/submit/${task._id}`)}
                                    icon={<Send className="w-4 h-4" />}
                                  >
                                    提交作业
                                  </DangerButton>
                                ) : (
                                  <PrimaryButton
                                    onClick={() => navigate(`/submit/${task._id}`)}
                                    icon={<Send className="w-4 h-4" />}
                                  >
                                    提交作业
                                  </PrimaryButton>
                                )
                              )}

                              {task.submitted && (
                                <SecondaryButton
                                  onClick={() => navigate(`/view-submission/${task._id}`)}
                                  icon={<Eye className="w-4 h-4" />}
                                >
                                  查看我的提交
                                </SecondaryButton>
                              )}

                              {!getTaskStatus(task).canSubmit && getTaskStatus(task).status === 'expired' && currentCategory === 'active' && (
                                <div className="px-5 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                  <div className="flex items-center justify-center gap-2">
                                    <X className="w-4 h-4" />
                                    <span>已截止，无法提交</span>
                                  </div>
                                </div>
                              )}
                              {/*
                              {currentCategory === 'archived' && (
                                <div className="px-5 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm">
                                  <div className="flex items-center justify-center gap-2">
                                    <Archive className="w-4 h-4" />
                                    <span>归档任务，仅供查看</span>
                                  </div>
                                  {task.submitted && (
                                    <SecondaryButton
                                      size="sm"
                                      onClick={() => navigate(`/view-submission/${task._id}`)}
                                      icon={<Eye className="w-3 h-3" />}
                                      className="mt-2"
                                    >
                                      查看提交
                                    </SecondaryButton>
                                  )}
                                </div>
                              )}
                                */}
                            </div>


                            {task.submitted && task.submissionInfo?.hasFeedback && (
                              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  <span className="text-green-600 dark:text-green-400 font-medium text-sm">
                                    教师已反馈
                                  </span>
                                  {task.submissionInfo.feedbackRating && (
                                    <span className="flex items-center gap-1">
                                      {Array.from({ length: task.submissionInfo.feedbackRating }, (_, i) => (
                                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                                      ))}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-green-700 dark:text-green-300 line-clamp-2">
                                  {task.submissionInfo.feedbackPreview}
                                </p>
                                <GhostButton
                                  size="sm"
                                  onClick={() => navigate(`/view-submission/${task._id}`)}
                                  className="mt-2 text-xs"
                                >
                                  查看完整反馈 →
                                </GhostButton>
                              </div>
                            )}
                          </motion.div>
                        )
                      )}
                    </CollapsibleSection>
                  )}
                </div>
              ) : (
                // 🔄 归档任务保持原有的平铺展示
                currentTasks.map((task, index) =>
                  isMobile ? (
                    <motion.div
                      key={`archived-${task._id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {renderMobileTaskCard(task)}
                    </motion.div>
                  ) : (
                    // 保持原有的桌面端渲染逻辑
                    <motion.div
                      key={`archived-${task._id}`}
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
                              <div className="flex items-start gap-2">
                                <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                                  {task.description}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <span className={`text-sm font-medium ${getTaskStatus(task).color} ml-4 flex-shrink-0`}>
                          {getTaskStatus(task).text}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            分类：{task.category}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <CloudUpload className="w-4 h-4" />
                            作业文件：{task.needsFile ? '必交' : '无'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Bot className="w-4 h-4" />
                            AIGC 使用：{task.allowAIGC ? '允许' : '禁止'}
                          </p>
                          {task.allowAIGC && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                              <ClipboardList className="w-4 h-4" />
                              AIGC 日志：{task.requireAIGCLog ? '必交' : '可选'}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            截止时间：{formatDeadline(task.deadline)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            所属班级：
                            {task.classIds && task.classIds.length > 0
                              ? task.classIds.map(cls => cls.name).join('，')
                              : '未绑定'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <ClipboardList className="w-4 h-4" />
                            逾期提交：{task.allowLateSubmission ? '允许' : '不允许'}
                          </p>
                          {getTaskStatus(task).status === 'late' && (
                            <p className="text-sm text-orange-600 dark:text-orange-400 font-medium flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              此任务已逾期，提交后将被标注为逾期作业
                            </p>
                          )}
                          {task.isArchived && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-2">
                              <Archive className="w-4 h-4" />
                              此任务已归档，仅供查看
                            </p>
                          )}
                          {task.submissionInfo && (
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              已于 {new Date(task.submissionInfo.submittedAt).toLocaleString()} 提交
                              {task.submissionInfo.isLateSubmission && ' (逾期提交)'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {getTaskStatus(task).canSubmit && currentCategory === 'active' && (
                          getTaskStatus(task).status === 'late' ? (
                            <WarningButton
                              onClick={() => navigate(`/submit/${task._id}`)}
                              icon={<AlertTriangle className="w-4 h-4" />}
                            >
                              逾期提交
                            </WarningButton>
                          ) : getTaskStatus(task).status === 'urgent' ? (
                            <DangerButton
                              onClick={() => navigate(`/submit/${task._id}`)}
                              icon={<Send className="w-4 h-4" />}
                            >
                              提交作业
                            </DangerButton>
                          ) : (
                            <PrimaryButton
                              onClick={() => navigate(`/submit/${task._id}`)}
                              icon={<Send className="w-4 h-4" />}
                            >
                              提交作业
                            </PrimaryButton>
                          )
                        )}

                        {task.submitted && (
                          <SecondaryButton
                            onClick={() => navigate(`/view-submission/${task._id}`)}
                            icon={<Eye className="w-4 h-4" />}
                          >
                            查看我的提交
                          </SecondaryButton>
                        )}

                        {!getTaskStatus(task).canSubmit && getTaskStatus(task).status === 'expired' && currentCategory === 'active' && (
                          <div className="px-5 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                            <div className="flex items-center justify-center gap-2">
                              <X className="w-4 h-4" />
                              <span>已截止，无法提交</span>
                            </div>
                          </div>
                        )}
                        {/*
                        {currentCategory === 'archived' && (
                          <div className="px-5 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm">
                            <div className="flex items-center justify-center gap-2">
                              <Archive className="w-4 h-4" />
                              <span>归档任务，仅供查看</span>
                            </div>
                            {task.submitted && (
                              <SecondaryButton
                                size="sm"
                                onClick={() => navigate(`/view-submission/${task._id}`)}
                                icon={<Eye className="w-3 h-3" />}
                                className="mt-2"
                              >
                                查看提交
                              </SecondaryButton>
                            )}
                          </div>
                        )}
                          */}
                      </div>


                      {task.submitted && task.submissionInfo?.hasFeedback && (
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-green-600 dark:text-green-400 font-medium text-sm">
                              教师已反馈
                            </span>
                            {task.submissionInfo.feedbackRating && (
                              <span className="flex items-center gap-1">
                                {Array.from({ length: task.submissionInfo.feedbackRating }, (_, i) => (
                                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                                ))}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-green-700 dark:text-green-300 line-clamp-2">
                            {task.submissionInfo.feedbackPreview}
                          </p>
                          <GhostButton
                            size="sm"
                            onClick={() => navigate(`/view-submission/${task._id}`)}
                            className="mt-2 text-xs"
                          >
                            查看完整反馈 →
                          </GhostButton>
                        </div>
                      )}
                    </motion.div>
                  )
                )
              )}
            </motion.div>
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