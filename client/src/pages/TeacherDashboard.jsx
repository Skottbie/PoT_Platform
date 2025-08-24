//client/src/pages/TeacherDashboard.jsx - 移动端优化版本

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { TaskCard } from '../components/EnhancedMobileCard';
import { PrimaryButton, SecondaryButton, DangerButton, WarningButton } from '../components/EnhancedButton';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';
import PullToRefreshContainer from '../components/PullToRefreshContainer';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { getGreeting } from '../utils/greetings';
import NicknamePrompt from '../components/NicknamePrompt';
import React from 'react';
import { 
  // 与StudentDashboard一致的图标
  ClipboardList,    // 📋 替换 (任务描述、提交要求、活跃任务)
  Clock,            // ⏰ 替换 (时间设置、截止时间)
  Archive,          // 📦 替换 (归档)
  Send,             // 📤 替换 (发布任务、恢复)
  Plus,             // ➕ 替换 (创建班级、发布新任务)
  BookOpen,         // 📚 替换 (我的班级、课程任务)
  FileText,         // 📝 替换 (查看提交、课堂练习)
  Clock3,           // 🕐 替换 (开发环境时间显示)
  ChevronDown,      // 🆕 新增：用于折叠功能
  
  // TeacherDashboard新增的图标
  BarChart3,        // 📊 替换 (班级统计、状态信息)
  Trash2,           // 🗑️ 替换 (删除、回收站)
  Lock,             // 🔒 替换 (限制查看)
  Unlock,           // 🔓 替换 (开放查看)
  RefreshCw,        // 🔄 替换 (恢复)
  X,                // 💀 替换 (永久删除)
  FolderOpen,       // 📂 替换 (任务信息)
  Pin,              // 📌 替换 (发布新任务)
  GraduationCap,     // 🏫 替换 (关联班级)
  CalendarOff
} from 'lucide-react';


  const CollapsibleSection = React.memo(({ title, count, type, isCollapsed, onToggle, children }) => {
    // 根据类型选择图标和颜色主题
    const getTheme = () => {
      if (type === 'expired') {
        return {
          icon: <CalendarOff className="w-4 h-4 text-red-600 dark:text-red-400" />,
          bgColor: 'bg-red-50 dark:bg-gray-800/50 border border-red-100 dark:border-gray-700',
          hoverBg: 'hover:bg-red-100 dark:hover:bg-gray-700/50'
        };
      } else {
        return {
          icon: <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
          bgColor: 'bg-blue-50 dark:bg-gray-800/50 border border-blue-100 dark:border-gray-700', 
          hoverBg: 'hover:bg-blue-100 dark:hover:bg-gray-700/50'
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

const TeacherDashboard = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '', 
    category: '课堂练习',
    needsFile: false,
    allowAIGC: false,
    requireAIGCLog: false,
    deadline: '',
    deadlineTime: '',
    allowLateSubmission: false,
    classIds: [],
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: '确认',
    confirmVariant: 'danger'
  });

  // 任务相关状态
  const [tasks, setTasks] = useState({
    active: [],
    archived: [],
    deleted: []
  });
  const [currentCategory, setCurrentCategory] = useState('active');
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchOperation, setBatchOperation] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);
    // 🚀 提前计算当前任务列表
  const currentTasks = useMemo(() => tasks[currentCategory] || [], [tasks, currentCategory]);

  // 📌 新增：折叠状态管理
  const [isNewTaskFormCollapsed, setIsNewTaskFormCollapsed] = useState(true); // 发布新任务表单默认折叠
  const [activeTasksCollapsed, setActiveTasksCollapsed] = useState({
    expired: false,     // 已截止任务默认展开  
    notExpired: true    // 未截止任务默认折叠
  });

  // 📌 新增：切换表单折叠状态
  const toggleNewTaskForm = useCallback(() => {
    setIsNewTaskFormCollapsed(prev => !prev);
  }, []);

  // 📌 新增：切换活跃任务分组折叠状态
  const toggleActiveTasksGroup = useCallback((type) => {
    setActiveTasksCollapsed(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  }, []);
  
  const navigate = useNavigate();
  const [myClasses, setMyClasses] = useState([]);

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

  // 🚀 并发获取所有初始数据
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 并行请求所有关键数据
      const promises = [
        api.get('/user/profile'),
        api.get('/class/my-classes'),
        api.get('/task/mine?category=active'),
        api.get('/task/mine?category=archived'),
        api.get('/task/mine?category=deleted')
      ];

      const results = await Promise.allSettled(promises);
      
      // 处理用户信息
      if (results[0].status === 'fulfilled') {
        const userData = results[0].value.data;
        if (userData.role !== 'teacher') {
          navigate('/');
          return;
        }
        setUser(userData);
      }

      // 处理班级数据
      if (results[1].status === 'fulfilled' && results[1].value.data.success) {
        setMyClasses(results[1].value.data.classes);
      }

      // 处理任务数据
      const taskResults = {
        active: results[2].status === 'fulfilled' ? results[2].value.data : [],
        archived: results[3].status === 'fulfilled' ? results[3].value.data : [],
        deleted: results[4].status === 'fulfilled' ? results[4].value.data : []
      };
      
      setTasks(taskResults);

    } catch (err) {
      console.error('获取初始数据失败:', err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);



  // 🆕 新增：活跃任务分组（只在active分类下生效）
  const groupedActiveTasks = useMemo(() => {
      if (currentCategory !== 'active') {
        return null; // 非活跃任务分类不分组
      }
      
      const now = new Date();
      const expired = currentTasks.filter(task => new Date(task.deadline) <= now);
      const notExpired = currentTasks.filter(task => new Date(task.deadline) > now);
      
      return {
        expired,
        notExpired
      };
    }, [currentTasks, currentCategory]);

  // 📌 获取任务函数 - 优化为只在需要时请求
  const fetchTasks = useCallback(async (category = 'active') => {
    try {
      const res = await api.get(`/task/mine?category=${category}`);
      setTasks(prev => ({ ...prev, [category]: res.data }));
    } catch (err) {
      console.error('获取任务失败:', err);
    }
  }, []);

  // 📌 切换任务分类 - 延迟加载策略
  const handleCategoryChange = useCallback(async (category) => {
    setCurrentCategory(category);
    setSelectedTasks(new Set());
    
    // 如果该分类数据为空，才重新请求
    if (tasks[category].length === 0) {
      await fetchTasks(category);
    }
  }, [tasks, fetchTasks]);

  // 🚀 优化表单处理 - 合并状态更新
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  // 🎯 优化任务提交 - 添加乐观更新
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (form.requireAIGCLog && !form.allowAIGC) {
      return setMessage('❌ 必须先允许使用AIGC，才能要求上传AIGC记录。');
    }

    if (!form.deadline || !form.deadlineTime) {
      return setMessage('❌ 请设置完整的截止时间。');
    }

    const deadlineDateTime = new Date(`${form.deadline}T${form.deadlineTime}`);
    if (deadlineDateTime <= new Date()) {
      return setMessage('❌ 截止时间必须晚于当前时间。');
    }

    setSubmitting(true);

    // 🚀 乐观更新 - 立即显示成功状态
    const tempTask = {
      _id: `temp_${Date.now()}`,
      title: form.title,
      category: form.category,
      deadline: deadlineDateTime.toISOString(),
      createdAt: new Date().toISOString(),
      isArchived: false,
      isDeleted: false,
      ...form
    };

    // 立即更新UI
    setTasks(prev => ({
      ...prev,
      active: [tempTask, ...prev.active]
    }));
    setMessage('✅ 任务发布成功！');

    try {
      const submitData = {
        ...form,
        deadline: deadlineDateTime.toISOString(),
      };
      delete submitData.deadlineTime;

      const response = await api.post('/task', submitData);
      
      // 替换临时任务为真实任务
      setTasks(prev => ({
        ...prev,
        active: prev.active.map(task => 
          task._id === tempTask._id ? response.data.task : task
        )
      }));

      // 重置表单
      setForm({
        title: '',
        description: '',
        category: '课堂练习',
        needsFile: false,
        allowAIGC: false,
        requireAIGCLog: false,
        deadline: '',
        deadlineTime: '',
        allowLateSubmission: false,
        classIds: [],
      });

    } catch (err) {
      // 失败时回滚UI
      setTasks(prev => ({
        ...prev,
        active: prev.active.filter(task => task._id !== tempTask._id)
      }));
      console.error(err);
      setMessage('❌ 发布失败，请检查字段');
    } finally {
      setSubmitting(false);
    }
  }, [form]);

  // 📌 任务操作函数 - 添加乐观更新
  const handleTaskOperation = useCallback(async (taskId, operation, options = {}) => {
    try {
      setBatchLoading(true);
      
      // 🚀 乐观更新 - 立即更新UI状态
      const updateTasksOptimistically = (taskId, operation) => {
        setTasks(prev => {
          const newTasks = { ...prev };
          
          // 从当前分类中找到任务
          let sourceCategory = currentCategory;
          let taskToMove = null;
          
          // 先找到任务
          for (const [category, taskList] of Object.entries(newTasks)) {
            const taskIndex = taskList.findIndex(t => t._id === taskId);
            if (taskIndex !== -1) {
              taskToMove = taskList[taskIndex];
              sourceCategory = category;
              break;
            }
          }
          
          if (!taskToMove) return prev;
          
          // 执行乐观更新
          switch (operation) {
            case 'archive':
              newTasks.active = newTasks.active.filter(t => t._id !== taskId);
              newTasks.archived = [{ ...taskToMove, isArchived: true }, ...newTasks.archived];
              break;
            case 'unarchive':
              newTasks.archived = newTasks.archived.filter(t => t._id !== taskId);
              newTasks.active = [{ ...taskToMove, isArchived: false }, ...newTasks.active];
              break;
            case 'soft_delete':
              newTasks[sourceCategory] = newTasks[sourceCategory].filter(t => t._id !== taskId);
              newTasks.deleted = [{ ...taskToMove, isDeleted: true }, ...newTasks.deleted];
              break;
            case 'restore':
              newTasks.deleted = newTasks.deleted.filter(t => t._id !== taskId);
              newTasks.active = [{ ...taskToMove, isDeleted: false }, ...newTasks.active];
              break;
          }
          
          return newTasks;
        });
      };

      // 立即更新UI
      updateTasksOptimistically(taskId, operation);
      
      let endpoint = '';
      let method = 'POST';
      
      switch (operation) {
        case 'archive':
          endpoint = `/task/${taskId}/archive`;
          break;
        case 'unarchive':
          endpoint = `/task/${taskId}/unarchive`;
          break;
        case 'soft_delete':
          endpoint = `/task/${taskId}/soft`;
          method = 'DELETE';
          break;
        case 'restore':
          endpoint = `/task/${taskId}/restore`;
          break;
        case 'hard_delete':
          endpoint = `/task/${taskId}/hard`;
          method = 'DELETE';
          break;
        default:
          throw new Error('不支持的操作');
      }

      const config = { method, url: endpoint };
      if (options && Object.keys(options).length > 0) {
        config.data = options;
      }

      await api(config);
      toast.success('✅ 操作成功');
      
    } catch (err) {
      console.error('操作失败:', err);
      toast.error(`❌ 操作失败：${err.response?.data?.message || err.message}`);
      // 失败时重新获取数据
      await fetchTasks(currentCategory);
    } finally {
      setBatchLoading(false);
    }
  }, [currentCategory, fetchTasks]);

  // 📌 批量操作
  const handleBatchOperation = useCallback(async () => {
    if (selectedTasks.size === 0) {
      setMessage('❌ 请选择要操作的任务');
      return;
    }

    try {
      setBatchLoading(true);
      const taskIds = Array.from(selectedTasks);
      
      await api.post('/task/batch', {
        taskIds,
        operation: batchOperation,
        options: { allowStudentViewWhenArchived: true }
      });

      setMessage(`✅ 批量操作成功`);
      setSelectedTasks(new Set());
      setShowBatchModal(false);
      await fetchTasks(currentCategory);
    } catch (err) {
      setMessage(`❌ 批量操作失败：${err.response?.data?.message || err.message}`);
    } finally {
      setBatchLoading(false);
    }
  }, [selectedTasks, batchOperation, currentCategory, fetchTasks]);

  // 📌 任务选择相关函数
  const toggleTaskSelection = useCallback((taskId) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  }, [selectedTasks]);

  const toggleSelectAll = useCallback(() => {
    const currentTasks = tasks[currentCategory] || [];
    if (selectedTasks.size === currentTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(currentTasks.map(task => task._id)));
    }
  }, [tasks, currentCategory, selectedTasks.size]);

  // 🎯 优化时间格式化 - 使用 useMemo
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

  const getTaskStatus = useCallback((deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    
    if (now > deadlineDate) {
      return { status: 'expired', text: '已截止', color: 'text-red-600 dark:text-red-400' };
    } else {
      const timeDiff = deadlineDate - now;
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      
      if (days > 1) {
        return { status: 'normal', text: `还有${days}天`, color: 'text-green-600 dark:text-green-400' };
      } else if (hours > 1) {
        return { status: 'warning', text: `还有${hours}小时`, color: 'text-yellow-600 dark:text-yellow-400' };
      } else {
        const minutes = Math.floor(timeDiff / (1000 * 60));
        return { status: 'urgent', text: `还有${minutes}分钟`, color: 'text-red-600 dark:text-red-400' };
      }
    }
  }, []);



// 📌 移动端任务卡片渲染函数
  const renderMobileTaskCard = useCallback((task) => {
    const taskStatus = getTaskStatus(task.deadline);
    
    // 根据任务状态确定卡片样式
    const getCardStatus = () => {
      if (taskStatus.status === 'expired') return 'overdue';
      if (taskStatus.status === 'urgent') return 'urgent';
      if (taskStatus.status === 'warning') return 'warning';
      if (task.isArchived) return 'archived';
      return 'default';
    };

    const getActionButtons = () => {
      const buttons = [];
      
      // 查看提交记录按钮
      buttons.push(
        <SecondaryButton
          key="submissions"
          size="sm"
          icon={<FileText className="w-4 h-4" />}
          onClick={() => navigate(`/task/${task._id}/submissions`)}
          className="flex-1"
        >
          查看提交
        </SecondaryButton>
      );
      
      // 班级提交情况按钮
      buttons.push(
        <PrimaryButton
          key="stats"
          size="sm"
          icon={<BarChart3 className="w-4 h-4" />}
          onClick={() => navigate(`/task/${task._id}/class-status`)}
          className="flex-1"
        >
          班级统计
        </PrimaryButton>
      );

      // 根据任务状态显示不同操作按钮
      if (currentCategory === 'active') {
        buttons.push(
          <SecondaryButton
            key="archive"
            size="sm"
            icon={<Archive className="w-4 h-4" />}
            onClick={() => setConfirmDialog({
              isOpen: true,
              title: '确认归档任务',
              message: `确定要归档任务"${task.title}"吗？归档后学生将无法提交作业。`,
              onConfirm: () => {
                handleTaskOperation(task._id, 'archive');
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
              },
              confirmText: '归档',
              confirmVariant: 'primary'
            })}
            disabled={batchLoading}
            className="flex-1"
          >
            归档
          </SecondaryButton>
        );

        buttons.push(
          <DangerButton
            key="delete"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => setConfirmDialog({
              isOpen: true,
              title: '确认删除任务',
              message: `确定要删除任务"${task.title}"吗？删除后30天内可恢复。`,
              onConfirm: () => {
                handleTaskOperation(task._id, 'soft_delete');
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
              },
              confirmText: '删除',
              confirmVariant: 'danger'
            })}
            disabled={batchLoading}
            className="flex-1"
          >
            删除
          </DangerButton>
        );
      } else if (currentCategory === 'archived') {
        buttons.push(
          <SecondaryButton
            key="unarchive"
            size="sm"
            icon={<Send className="w-4 h-4" />}
            onClick={() => handleTaskOperation(task._id, 'unarchive')}
            disabled={batchLoading}
            className="flex-1"
          >
            恢复
          </SecondaryButton>
        );
        
        buttons.push(
          <SecondaryButton
            key="permission"
            size="sm"
            icon={task.allowStudentViewWhenArchived ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            onClick={async () => {
              try {
                await api.put(`/task/${task._id}/student-permission`, {
                  allowStudentViewWhenArchived: !task.allowStudentViewWhenArchived
                });
                toast.success('✅ 权限设置成功');
                await fetchTasks(currentCategory);
              } catch (err) {
                toast.error(`❌ 权限设置失败：${err.response?.data?.message || err.message}`);
              }
            }}
            disabled={batchLoading}
            className="flex-1"
          >
            {task.allowStudentViewWhenArchived ? '限制查看' : '开放查看'}
          </SecondaryButton>
        );
        
        buttons.push(
          <DangerButton
            key="delete"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => handleTaskOperation(task._id, 'soft_delete')}
            disabled={batchLoading}
            className="flex-1"
          >
            删除
          </DangerButton>
        );
      } else if (currentCategory === 'deleted') {
        buttons.push(
          <SecondaryButton
            key="restore"
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => handleTaskOperation(task._id, 'restore')}
            disabled={batchLoading}
            className="flex-1"
          >
            恢复
          </SecondaryButton>
        );
        
        buttons.push(
          <DangerButton
            key="permanent"
            size="sm"
            icon={<X className="w-4 h-4" />}
            onClick={() => setConfirmDialog({
              isOpen: true,
              title: '确认永久删除',
              message: `确定要永久删除任务"${task.title}"吗？此操作不可恢复！`,
              onConfirm: () => {
                handleTaskOperation(task._id, 'hard_delete');
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
              },
              confirmText: '永久删除',
              confirmVariant: 'danger'
            })}
            disabled={batchLoading}
            className="flex-1"
          >
            永久删除
          </DangerButton>
        );
      }

      return buttons;
    };

    return (
      <TaskCard
        key={task._id}
        status={getCardStatus()}
        urgent={taskStatus.status === 'urgent'}
        className="mb-4 relative overflow-hidden"
        // 📌 重要：移除TaskCard的onClick事件，避免与复选框冲突
        onClick={undefined}
      >
        {/* 任务头部 */}
        <div className="flex items-start gap-3 mb-4">
          {/* 选择框 */}
          <div className="flex-shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selectedTasks.has(task._id)}
              onChange={() => toggleTaskSelection(task._id)}
              onClick={(e) => e.stopPropagation()}
              className="form-checkbox checkbox-lg"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 line-clamp-2 mb-2">
              {task.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`
                inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                ${taskStatus.status === 'urgent' 
                  ? 'bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/50' 
                  : taskStatus.status === 'warning'
                  ? 'bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700/50'
                  : taskStatus.status === 'expired'
                  ? 'bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-900/50 dark:to-slate-900/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50'
                  : 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700/50'
                }
              `}>
                {taskStatus.text}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {task.category}
              </span>
              {currentCategory === 'deleted' && task.daysLeft !== undefined && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  task.daysLeft > 7 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                    : task.daysLeft > 3
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                }`}>
                  {task.daysLeft}天后永久删除
                </span>
              )}
            </div>
          </div>
          
          {/* 紧急标识 */}
          {taskStatus.status === 'urgent' && (
            <div className="flex-shrink-0">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
            </div>
          )}
        </div>

        {/* 任务描述 */}
        {task.description && (
          <div className="mb-4">
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-mobile-lg p-4 border border-blue-200/50 dark:border-blue-700/30">
              <div className="flex items-start gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-200 line-clamp-3 leading-relaxed">
                  {task.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 任务信息网格 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-mobile-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="font-medium">任务信息</span>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">类型:</span> {task.category}</p>
              <p><span className="font-medium">文件:</span> {task.needsFile ? '必交' : '无'}</p>
              <p><span className="font-medium">AIGC:</span> {task.allowAIGC ? '允许' : '禁止'}</p>
              <p><span className="font-medium">班级:</span> {
                                                task.classIds && task.classIds.length > 0
                                                  ? task.classIds.map(cls => cls.name).join('，')
                                                  : '未绑定班级'
                                              }</p>
            </div>
          </div>

          <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-mobile-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium">时间设置</span>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">截止:</span> {formatDeadline(task.deadline)}</p>
              <p><span className="font-medium">逾期:</span> {task.allowLateSubmission ? '允许' : '不允许'}</p>
              <p><span className="font-medium">创建:</span> {new Date(task.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        {/* 操作按钮组 */}
        <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
          {getActionButtons()}
        </div>

        {/* 卡片右上角装饰 */}
        <div className="absolute top-4 right-4 opacity-20 dark:opacity-10 pointer-events-none">
          <div className={`w-16 h-16 rounded-full ${
            taskStatus.status === 'expired'
              ? 'bg-gradient-to-br from-red-400 to-rose-500'
              : taskStatus.status === 'urgent'
              ? 'bg-gradient-to-br from-red-400 to-rose-500'
              : taskStatus.status === 'warning'
              ? 'bg-gradient-to-br from-orange-400 to-amber-500'
              : 'bg-gradient-to-br from-blue-400 to-cyan-500'
          }`} />
        </div>
      </TaskCard>
    );
  }, [currentCategory, getTaskStatus, formatDeadline, navigate, selectedTasks, toggleTaskSelection, handleTaskOperation, batchLoading, fetchTasks, setConfirmDialog]);

  // 🔄 下拉刷新处理函数
  const handlePullRefresh = useCallback(async () => {
    try {
      await fetchInitialData();
      // 刷新当前分类的任务
      if (currentCategory !== 'active') {
        await fetchTasks(currentCategory);
      }
      toast.success('刷新成功');
    } catch (error) {
      console.error('下拉刷新失败:', error);
      toast.error('刷新失败，请重试');
    }
  }, [fetchInitialData, fetchTasks, currentCategory]);

  // 🔕 静默自动刷新函数（完全无感）
  const handleSilentRefresh = useCallback(async () => {
    try {
      // 静默获取任务数据
      const taskRes = await api.get(`/task/mine?category=${currentCategory}`);
      if (taskRes.data) {
        setTasks(prev => ({ ...prev, [currentCategory]: taskRes.data }));
      }
      
      // 静默获取班级数据
      const classRes = await api.get('/class/my-classes');
      if (classRes.data.success) {
        setMyClasses(classRes.data.classes);
      }
    } catch (error) {
      // 只记录到控制台，不显示给用户
      console.error('静默刷新失败:', error);
    }
  }, [currentCategory]);

  // ⏰ 自动定时刷新（使用静默函数）
  useAutoRefresh(handleSilentRefresh, {
    interval: 45000,
    enabled: true,
    pauseOnHidden: true,
    pauseOnOffline: true,
  });

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
        <p className="text-center text-gray-500">获取用户信息中...</p>
      </div>
    );
  }

  return (
    <PullToRefreshContainer 
      onRefresh={handlePullRefresh}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-10 px-2 sm:px-4 transition-colors duration-300"
      disabled={loading || submitting}
    >
      <div className="max-w-4xl mx-auto space-y-6">
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
                    {user ? getGreeting('teacher', user.nickname, user.email) : '欢迎回来'}
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
                      {tasks.active.length} 个活跃任务
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {myClasses.length} 个班级
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <PrimaryButton
                  size={isMobile ? "md" : "md"}
                  icon={<Plus className="w-4 h-4" />}
                  haptic
                  onClick={() => navigate('/create-class')}
                  gradient
                  className="flex-1 sm:flex-none"
                >
                  创建班级
                </PrimaryButton>
                <SecondaryButton
                  size={isMobile ? "md" : "md"}
                  icon={<BookOpen className="w-4 h-4" />}
                  haptic
                  onClick={() => navigate('/my-classes')}
                  className="flex-1 sm:flex-none"
                >
                  我的班级
                </SecondaryButton>
              </div>
            </div>
          </div>
        </motion.div>

          {/* 发布新任务表单 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-white via-blue-50/30 to-purple-50/30 dark:from-gray-800 dark:via-blue-900/10 dark:to-purple-900/10 rounded-mobile-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-xl shadow-mobile p-6"
            style={{ paddingBottom: '0.5rem' }}
          >
          <button
            onClick={toggleNewTaskForm}
            className="w-full flex items-center justify-between mb-4 p-2 -m-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors aigc-native-button"
          >
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Pin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              发布新任务
            </h2>
            <motion.div
              animate={{ rotate: isNewTaskFormCollapsed ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {!isNewTaskFormCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 基础信息 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      任务标题 *
                    </label>
                    <input
                      type="text"
                      name="title"
                      placeholder="输入任务标题..."
                      value={form.title}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-mobile-lg 
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                                placeholder-gray-500 dark:placeholder-gray-400 
                                transition-all duration-200 min-h-[44px] px-4 py-3 text-base
                                focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      任务类型
                    </label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-mobile-lg 
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                                transition-all duration-200 min-h-[44px] px-4 py-3 text-base
                                focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    >
                      <option value="课堂练习">课堂练习</option>
                      <option value="课程任务">课程任务</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    任务描述
                  </label>
                  <textarea
                    name="description"
                    placeholder="详细描述任务要求..."
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-mobile-lg 
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                              placeholder-gray-500 dark:placeholder-gray-400 
                              transition-all duration-200 px-4 py-3 text-base resize-none
                              focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 提交要求 */}
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-mobile-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  提交要求
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3 rounded-mobile-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      name="needsFile"
                      checked={form.needsFile}
                      onChange={handleChange}
                      className="form-checkbox"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      要求文件
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-mobile-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      name="allowAIGC"
                      checked={form.allowAIGC}
                      onChange={handleChange}
                      className="form-checkbox"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      允许 AIGC
                    </span>
                  </label>

                  <label className={`flex items-center gap-3 p-3 rounded-mobile-lg border transition-colors cursor-pointer min-h-[44px] ${
                    !form.allowAIGC 
                      ? 'border-gray-200 dark:border-gray-600 opacity-50 cursor-not-allowed' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                  }`}>
                    <input
                      type="checkbox"
                      name="requireAIGCLog"
                      checked={form.requireAIGCLog}
                      onChange={handleChange}
                      disabled={!form.allowAIGC}
                      className="form-checkbox disabled:opacity-50"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      要求 AIGC 记录
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-mobile-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      name="allowLateSubmission"
                      checked={form.allowLateSubmission}
                      onChange={handleChange}
                      className="form-checkbox"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      允许逾期
                    </span>
                  </label>
                </div>
              </div>

            {/* 关联班级 */}
              {myClasses.length > 0 && (
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-mobile-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    关联班级
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {myClasses.map((cls) => (
                      <label 
                        key={cls._id} 
                        className="flex items-center gap-3 p-3 rounded-mobile-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer min-h-[44px]"
                      >
                        <input
                          type="checkbox"
                          value={cls._id}
                          checked={form.classIds.includes(cls._id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const id = e.target.value;
                            setForm((prev) => ({
                              ...prev,
                              classIds: checked
                                ? [...prev.classIds, id]
                                : prev.classIds.filter((cid) => cid !== id),
                            }));
                          }}
                          className="form-checkbox"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-1">
                          {cls.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 截止时间 */}
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-mobile-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  截止时间
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      截止日期 *
                    </label>
                    <input
                      type="date"
                      name="deadline"
                      value={form.deadline}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-mobile-lg 
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                                transition-all duration-200 min-h-[44px] px-4 py-3 text-base
                                focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      截止时间 *
                    </label>
                    <input
                      type="time"
                      name="deadlineTime"
                      value={form.deadlineTime}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-mobile-lg 
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                                transition-all duration-200 min-h-[44px] px-4 py-3 text-base
                                focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <PrimaryButton
                type="submit"
                size="lg"
                fullWidth
                icon={<Send className="w-4 h-4" />}
                haptic
                gradient
                className="font-semibold"
                loading={submitting}
                disabled={submitting}
              >
                {submitting ? '发布中...' : '发布任务'}
              </PrimaryButton>

              {message && (
                <div className={`p-4 rounded-mobile-xl border text-center font-medium ${
                  message.startsWith('✅') 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200' 
                    : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
                }`}>
                  {message}
                </div>
              )}
            </form>
            </motion.div>
              )}
            </AnimatePresence>



          </motion.div>

          {/* 任务管理区域 */}
          <div>
            {/* 任务分类标签 */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
              <div className={`flex flex-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 p-1.5 rounded-mobile-2xl shadow-mobile ${
                isMobile ? 'gap-1' : 'gap-1'
              }`}>
                {[
                  { key: 'active', label: '活跃任务', count: tasks.active.length, icon: ClipboardList, color: 'blue' },
                  { key: 'archived', label: '已归档', count: tasks.archived.length, icon: Archive, color: 'gray' },
                  { key: 'deleted', label: '回收站', count: tasks.deleted.length, icon: Trash2, color: 'red' }
                ].map(({ key, label, count, icon: IconComponent, color }) => (
                  <button
                    key={key}
                    onClick={() => handleCategoryChange(key)}
                    className={`flex-1 px-4 py-3 rounded-mobile-xl text-sm font-medium transition-all duration-300 ease-out touch-manipulation ${
                      currentCategory === key
                        ? `bg-gradient-to-r ${
                            color === 'blue' 
                              ? 'from-blue-500 to-cyan-500 text-white shadow-mobile'
                              : color === 'gray'
                              ? 'from-gray-500 to-slate-500 text-white shadow-mobile'
                              : 'from-red-500 to-rose-500 text-white shadow-mobile'
                          }`
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {isMobile ? (
                        <div className="flex flex-col items-center gap-1">
                          <IconComponent className="w-5 h-5" />
                          <span className="text-xs font-semibold">({count})</span>
                        </div>
                      ) : (
                        <>
                          <span className="truncate">{label}</span>
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

              {/* 批量操作按钮 */}
              {selectedTasks.size > 0 && (
                <div className="flex gap-2">
                <SecondaryButton
                    size="sm"
                    onClick={() => {
                      setBatchOperation(currentCategory === 'active' ? 'archive' : 
                                      currentCategory === 'archived' ? 'unarchive' : 'restore');
                      setShowBatchModal(true);
                    }}
                    icon={currentCategory === 'active' ? 
                          <Archive className="w-4 h-4" /> : 
                          <RefreshCw className="w-4 h-4" />
                    }
                  >
                    批量{currentCategory === 'active' ? '归档' : 
                          currentCategory === 'archived' ? '恢复' : '恢复'} ({selectedTasks.size})
                  </SecondaryButton>
                  {currentCategory !== 'deleted' && (
                    <DangerButton
                      size="sm"
                      onClick={() => {
                        setBatchOperation('soft_delete');
                        setShowBatchModal(true);
                      }}
                      icon={<Trash2 className="w-4 h-4" />}
                    >
                      批量删除 ({selectedTasks.size})
                    </DangerButton>
                  )}
                </div>
              )}
            </div>

            {/* 全选复选框 */}
            {currentTasks.length > 0 && (
              <div className="mb-4">
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-mobile-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                  <label className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTasks.size === currentTasks.length && currentTasks.length > 0}
                      onChange={toggleSelectAll}
                      className="form-checkbox checkbox-lg"
                    />
                    <span className="font-medium">
                      全选 ({selectedTasks.size}/{currentTasks.length})
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* 任务列表 */}
            <AnimatePresence mode="wait">
              {currentTasks.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center shadow-mobile">
                    {currentCategory === 'active' ? (
                      <ClipboardList className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    ) : currentCategory === 'archived' ? (
                      <Archive className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <Trash2 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                    {currentCategory === 'active' ? '暂无活跃任务' :
                    currentCategory === 'archived' ? '暂无归档任务' : '回收站为空'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {currentCategory === 'active' ? '发布第一个任务开始教学吧！' :
                    currentCategory === 'archived' ? '归档的任务会显示在这里' : '删除的任务会在30天后自动清理'}
                  </p>
                  {currentCategory === 'active' && (
                    <PrimaryButton
                      size="md"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                      发布新任务
                    </PrimaryButton>
                  )}
                </motion.div>
                  ) : (
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* 🆕 活跃任务分组显示 */}
                  {currentCategory === 'active' && groupedActiveTasks ? (
                    <div className="space-y-6">
                      {/* 已截止任务区域 */}
                      {groupedActiveTasks.expired.length > 0 && (
                        <CollapsibleSection
                          key="expired-section"
                          title="已截止作业"
                          count={groupedActiveTasks.expired.length}
                          type="expired"
                          isCollapsed={activeTasksCollapsed.expired}
                          onToggle={toggleActiveTasksGroup}
                        >
                          {groupedActiveTasks.expired.map((task, index) => (
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
                                transition={{ delay: index * 0.05 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700"
                              >
                                {/* 桌面端任务卡片内容保持不变 */}
                                <div className="flex items-start gap-4">
                                  {/* 选择框 */}
                                  <div className="flex-shrink-0 pt-1">
                                    <input
                                      type="checkbox"
                                      checked={selectedTasks.has(task._id)}
                                      onChange={() => toggleTaskSelection(task._id)}
                                      className="form-checkbox checkbox-lg"
                                    />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
                                          {task.title}
                                        </h3>
                                        
                                        {/* 状态标签 */}
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTaskStatus(task.deadline).color} ${
                                            getTaskStatus(task.deadline).status === 'expired' 
                                              ? 'bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50'
                                              : getTaskStatus(task.deadline).status === 'urgent'
                                              ? 'bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700/50'
                                              : getTaskStatus(task.deadline).status === 'warning'
                                              ? 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50'
                                              : 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50'
                                          }`}>
                                            {getTaskStatus(task.deadline).text}
                                          </span>
                                          
                                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                            {task.category}
                                          </span>
                                          
                                          {currentCategory === 'deleted' && task.daysLeft !== undefined && (
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                              task.daysLeft > 7 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                                : task.daysLeft > 3
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                            }`}>
                                              {task.daysLeft}天后永久删除
                                            </span>
                                          )}
                                        </div>

                                        {/* 任务描述 */}
                                        {task.description && (
                                          <div className="mb-2">
                                            <div className="bg-blue-50/60 dark:bg-blue-900/20 rounded-mobile-lg p-3 border border-blue-200/50 dark:border-blue-700/30">
                                              <div className="flex items-start gap-2">
                                                <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-blue-800 dark:text-blue-200 line-clamp-3">
                                                  {task.description}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* 任务详情网格 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                      <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-mobile-lg p-3">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                          <FolderOpen className="w-3.5 h-3.5" />
                                          任务信息
                                        </div>
                                        <div className="space-y-1 text-sm">
                                          <p><span className="font-medium">类型:</span> {task.category}</p>
                                          <p><span className="font-medium">文件:</span> {task.needsFile ? '必交' : '无'}</p>
                                          <p><span className="font-medium">AIGC:</span> {task.allowAIGC ? '允许' : '禁止'}</p>
                                          <p><span className="font-medium">班级:</span>  {task.classIds && task.classIds.length > 0
                                            ? task.classIds.map(cls => cls.name).join('，')
                                            : '未绑定'}
                                        </p>
                                        </div>
                                      </div>

                                      <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-mobile-lg p-3">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                          <Clock className="w-3.5 h-3.5" />
                                          时间设置
                                        </div>
                                        <div className="space-y-1 text-sm">
                                          <p><span className="font-medium">截止:</span> {formatDeadline(task.deadline)}</p>
                                          <p><span className="font-medium">逾期:</span> {task.allowLateSubmission ? '允许' : '不允许'}</p>
                                        </div>
                                      </div>

                                      <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-mobile-lg p-3">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                          <BarChart3 className="w-3.5 h-3.5" />
                                          状态信息
                                        </div>
                                        <div className="space-y-1 text-sm">
                                          {currentCategory === 'archived' && (
                                            <p><span className="font-medium">学生查看:</span> {task.allowStudentViewWhenArchived ? '开放' : '限制'}</p>
                                          )}
                                          <p><span className="font-medium">创建:</span> {new Date(task.createdAt).toLocaleDateString()}</p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                  {/* 操作按钮组 */}
                                    <div className="flex flex-wrap gap-2">
                                      {/* 查看提交记录按钮 */}
                                      <SecondaryButton
                                        size="sm"
                                        icon={<FileText className="w-4 h-4" />}
                                        onClick={() => navigate(`/task/${task._id}/submissions`)}
                                      >
                                        查看提交
                                      </SecondaryButton>
                                      
                                      {/* 班级提交情况按钮 */}
                                      <PrimaryButton
                                        size="sm"
                                        icon={<BarChart3 className="w-4 h-4" />}
                                        onClick={() => navigate(`/task/${task._id}/class-status`)}
                                      >
                                        班级统计
                                      </PrimaryButton>

                                        {/* 根据任务状态显示不同操作按钮 */}
                                      {currentCategory === 'active' && (
                                        <>
                                          <SecondaryButton
                                            size="sm"
                                            icon={<Archive className="w-4 h-4" />}
                                            onClick={() => setConfirmDialog({
                                              isOpen: true,
                                              title: '确认归档任务',
                                              message: `确定要归档任务"${task.title}"吗？归档后学生将无法提交作业。`,
                                              onConfirm: () => {
                                                handleTaskOperation(task._id, 'archive');
                                                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                              },
                                              confirmText: '归档',
                                              confirmVariant: 'primary'
                                            })}
                                            disabled={batchLoading}
                                          >
                                            归档
                                          </SecondaryButton>
                                          
                                          <DangerButton
                                            size="sm"
                                            icon={<Trash2 className="w-4 h-4" />}
                                            onClick={() => setConfirmDialog({
                                              isOpen: true,
                                              title: '确认删除任务',
                                              message: `确定要删除任务"${task.title}"吗？删除后30天内可恢复。`,
                                              onConfirm: () => {
                                                handleTaskOperation(task._id, 'soft_delete');
                                                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                              },
                                              confirmText: '删除',
                                              confirmVariant: 'danger'
                                            })}
                                            disabled={batchLoading}
                                          >
                                            删除
                                          </DangerButton>
                                        </>
                                      )}

                                      {currentCategory === 'archived' && (
                                        <>
                                          <SecondaryButton
                                            size="sm"
                                            icon={<Send className="w-4 h-4" />}
                                            onClick={() => handleTaskOperation(task._id, 'unarchive')}
                                            disabled={batchLoading}
                                          >
                                            恢复
                                          </SecondaryButton>
                                          
                                          <SecondaryButton
                                            size="sm"
                                            icon={task.allowStudentViewWhenArchived ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                            onClick={async () => {
                                              try {
                                                await api.put(`/task/${task._id}/student-permission`, {
                                                  allowStudentViewWhenArchived: !task.allowStudentViewWhenArchived
                                                });
                                                toast.success(' 权限设置成功');
                                                await fetchTasks(currentCategory);
                                              } catch (err) {
                                                toast.error(` 权限设置失败：${err.response?.data?.message || err.message}`);
                                              }
                                            }}
                                            disabled={batchLoading}
                                          >
                                            {task.allowStudentViewWhenArchived ? '限制查看' : '开放查看'}
                                          </SecondaryButton>
                                          
                                          <DangerButton
                                            size="sm"
                                            icon={<Trash2 className="w-4 h-4" />}
                                            onClick={() => setConfirmDialog({
                                              isOpen: true,
                                              title: '确认删除任务',
                                              message: `确定要删除任务"${task.title}"吗？删除后30天内可恢复。`,
                                              onConfirm: () => {
                                                handleTaskOperation(task._id, 'soft_delete');
                                                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                              },
                                              confirmText: '删除',
                                              confirmVariant: 'danger'
                                            })}
                                            disabled={batchLoading}
                                          >
                                            删除
                                          </DangerButton>
                                        </>
                                      )}

                                      {currentCategory === 'deleted' && (
                                        <>
                                          <PrimaryButton
                                            size="sm"
                                            icon={<RefreshCw className="w-4 h-4" />}
                                            onClick={() => handleTaskOperation(task._id, 'restore')}
                                            disabled={batchLoading}
                                          >
                                            恢复
                                          </PrimaryButton>
                                          
                                          <DangerButton
                                            size="sm"
                                            icon={<X className="w-4 h-4" />}
                                            onClick={() => setConfirmDialog({
                                              isOpen: true,
                                              title: '⚠️ 永久删除任务',
                                              message: `确定要永久删除任务"${task.title}"吗？此操作无法撤销！`,
                                              onConfirm: () => {
                                                handleTaskOperation(task._id, 'hard_delete');
                                                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                              },
                                              confirmText: '永久删除',
                                              confirmVariant: 'danger'
                                            })}
                                            disabled={batchLoading}
                                          >
                                            永久删除
                                          </DangerButton>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )
                          ))}
                        </CollapsibleSection>
                      )}

                      {/* 未截止任务区域 */}
                      {groupedActiveTasks.notExpired.length > 0 && (
                        <CollapsibleSection
                          key="notexpired-section"
                          title="未截止作业"
                          count={groupedActiveTasks.notExpired.length}
                          type="notExpired"
                          isCollapsed={activeTasksCollapsed.notExpired}
                          onToggle={toggleActiveTasksGroup}
                        >
                          {groupedActiveTasks.notExpired.map((task, index) => (
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
                                transition={{ delay: index * 0.05 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700"
                              >
                                {/* 桌面端任务卡片内容保持不变 */}
                                <div className="flex items-start gap-4">
                                  {/* 选择框 */}
                                  <div className="flex-shrink-0 pt-1">
                                    <input
                                      type="checkbox"
                                      checked={selectedTasks.has(task._id)}
                                      onChange={() => toggleTaskSelection(task._id)}
                                      className="form-checkbox checkbox-lg"
                                    />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
                                          {task.title}
                                        </h3>
                                        
                                        {/* 状态标签 */}
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTaskStatus(task.deadline).color} ${
                                            getTaskStatus(task.deadline).status === 'expired' 
                                              ? 'bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50'
                                              : getTaskStatus(task.deadline).status === 'urgent'
                                              ? 'bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700/50'
                                              : getTaskStatus(task.deadline).status === 'warning'
                                              ? 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50'
                                              : 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50'
                                          }`}>
                                            {getTaskStatus(task.deadline).text}
                                          </span>
                                          
                                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                            {task.category}
                                          </span>
                                          
                                          {currentCategory === 'deleted' && task.daysLeft !== undefined && (
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                              task.daysLeft > 7 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                                : task.daysLeft > 3
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                            }`}>
                                              {task.daysLeft}天后永久删除
                                            </span>
                                          )}
                                        </div>

                                        {/* 任务描述 */}
                                        {task.description && (
                                          <div className="mb-2">
                                            <div className="bg-blue-50/60 dark:bg-blue-900/20 rounded-mobile-lg p-3 border border-blue-200/50 dark:border-blue-700/30">
                                              <div className="flex items-start gap-2">
                                                <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-blue-800 dark:text-blue-200 line-clamp-3">
                                                  {task.description}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* 任务详情网格 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                      <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-mobile-lg p-3">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                          <FolderOpen className="w-3.5 h-3.5" />
                                          任务信息
                                        </div>
                                        <div className="space-y-1 text-sm">
                                          <p><span className="font-medium">类型:</span> {task.category}</p>
                                          <p><span className="font-medium">文件:</span> {task.needsFile ? '必交' : '无'}</p>
                                          <p><span className="font-medium">AIGC:</span> {task.allowAIGC ? '允许' : '禁止'}</p>
                                          <p><span className="font-medium">班级:</span>  {task.classIds && task.classIds.length > 0
                                            ? task.classIds.map(cls => cls.name).join('，')
                                            : '未绑定'}
                                        </p>
                                        </div>
                                      </div>

                                      <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-mobile-lg p-3">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                          <Clock className="w-3.5 h-3.5" />
                                          时间设置
                                        </div>
                                        <div className="space-y-1 text-sm">
                                          <p><span className="font-medium">截止:</span> {formatDeadline(task.deadline)}</p>
                                          <p><span className="font-medium">逾期:</span> {task.allowLateSubmission ? '允许' : '不允许'}</p>
                                        </div>
                                      </div>

                                      <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-mobile-lg p-3">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                          <BarChart3 className="w-3.5 h-3.5" />
                                          状态信息
                                        </div>
                                        <div className="space-y-1 text-sm">
                                          {currentCategory === 'archived' && (
                                            <p><span className="font-medium">学生查看:</span> {task.allowStudentViewWhenArchived ? '开放' : '限制'}</p>
                                          )}
                                          <p><span className="font-medium">创建:</span> {new Date(task.createdAt).toLocaleDateString()}</p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                  {/* 操作按钮组 */}
                                    <div className="flex flex-wrap gap-2">
                                      {/* 查看提交记录按钮 */}
                                      <SecondaryButton
                                        size="sm"
                                        icon={<FileText className="w-4 h-4" />}
                                        onClick={() => navigate(`/task/${task._id}/submissions`)}
                                      >
                                        查看提交
                                      </SecondaryButton>
                                      
                                      {/* 班级提交情况按钮 */}
                                      <PrimaryButton
                                        size="sm"
                                        icon={<BarChart3 className="w-4 h-4" />}
                                        onClick={() => navigate(`/task/${task._id}/class-status`)}
                                      >
                                        班级统计
                                      </PrimaryButton>

                                        {/* 根据任务状态显示不同操作按钮 */}
                                      {currentCategory === 'active' && (
                                        <>
                                          <SecondaryButton
                                            size="sm"
                                            icon={<Archive className="w-4 h-4" />}
                                            onClick={() => setConfirmDialog({
                                              isOpen: true,
                                              title: '确认归档任务',
                                              message: `确定要归档任务"${task.title}"吗？归档后学生将无法提交作业。`,
                                              onConfirm: () => {
                                                handleTaskOperation(task._id, 'archive');
                                                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                              },
                                              confirmText: '归档',
                                              confirmVariant: 'primary'
                                            })}
                                            disabled={batchLoading}
                                          >
                                            归档
                                          </SecondaryButton>
                                          
                                          <DangerButton
                                            size="sm"
                                            icon={<Trash2 className="w-4 h-4" />}
                                            onClick={() => setConfirmDialog({
                                              isOpen: true,
                                              title: '确认删除任务',
                                              message: `确定要删除任务"${task.title}"吗？删除后30天内可恢复。`,
                                              onConfirm: () => {
                                                handleTaskOperation(task._id, 'soft_delete');
                                                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                              },
                                              confirmText: '删除',
                                              confirmVariant: 'danger'
                                            })}
                                            disabled={batchLoading}
                                          >
                                            删除
                                          </DangerButton>
                                        </>
                                      )}

                                      {currentCategory === 'archived' && (
                                        <>
                                          <SecondaryButton
                                            size="sm"
                                            icon={<Send className="w-4 h-4" />}
                                            onClick={() => handleTaskOperation(task._id, 'unarchive')}
                                            disabled={batchLoading}
                                          >
                                            恢复
                                          </SecondaryButton>
                                          
                                          <SecondaryButton
                                            size="sm"
                                            icon={task.allowStudentViewWhenArchived ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                            onClick={async () => {
                                              try {
                                                await api.put(`/task/${task._id}/student-permission`, {
                                                  allowStudentViewWhenArchived: !task.allowStudentViewWhenArchived
                                                });
                                                toast.success(' 权限设置成功');
                                                await fetchTasks(currentCategory);
                                              } catch (err) {
                                                toast.error(` 权限设置失败：${err.response?.data?.message || err.message}`);
                                              }
                                            }}
                                            disabled={batchLoading}
                                          >
                                            {task.allowStudentViewWhenArchived ? '限制查看' : '开放查看'}
                                          </SecondaryButton>
                                          
                                          <DangerButton
                                            size="sm"
                                            icon={<Trash2 className="w-4 h-4" />}
                                            onClick={() => setConfirmDialog({
                                              isOpen: true,
                                              title: '确认删除任务',
                                              message: `确定要删除任务"${task.title}"吗？删除后30天内可恢复。`,
                                              onConfirm: () => {
                                                handleTaskOperation(task._id, 'soft_delete');
                                                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                              },
                                              confirmText: '删除',
                                              confirmVariant: 'danger'
                                            })}
                                            disabled={batchLoading}
                                          >
                                            删除
                                          </DangerButton>
                                        </>
                                      )}

                                      {currentCategory === 'deleted' && (
                                        <>
                                          <PrimaryButton
                                            size="sm"
                                            icon={<RefreshCw className="w-4 h-4" />}
                                            onClick={() => handleTaskOperation(task._id, 'restore')}
                                            disabled={batchLoading}
                                          >
                                            恢复
                                          </PrimaryButton>
                                          
                                          <DangerButton
                                            size="sm"
                                            icon={<X className="w-4 h-4" />}
                                            onClick={() => setConfirmDialog({
                                              isOpen: true,
                                              title: '⚠️ 永久删除任务',
                                              message: `确定要永久删除任务"${task.title}"吗？此操作无法撤销！`,
                                              onConfirm: () => {
                                                handleTaskOperation(task._id, 'hard_delete');
                                                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                              },
                                              confirmText: '永久删除',
                                              confirmVariant: 'danger'
                                            })}
                                            disabled={batchLoading}
                                          >
                                            永久删除
                                          </DangerButton>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )
                          ))}
                        </CollapsibleSection>
                      )}
                    </div>
                  ) : (
                    // 🔄 归档任务和删除任务保持原有的平铺展示
                    currentTasks.map((task, index) => (
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
                          transition={{ delay: index * 0.05 }}
                          className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700"
                        >
                          {/* 桌面端任务卡片内容保持不变 */}
                          <div className="flex items-start gap-4">
                            {/* 选择框 */}
                            <div className="flex-shrink-0 pt-1">
                              <input
                                type="checkbox"
                                checked={selectedTasks.has(task._id)}
                                onChange={() => toggleTaskSelection(task._id)}
                                className="form-checkbox checkbox-lg"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
                                    {task.title}
                                  </h3>
                                  
                                  {/* 状态标签 */}
                                  <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTaskStatus(task.deadline).color} ${
                                      getTaskStatus(task.deadline).status === 'expired' 
                                        ? 'bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50'
                                        : getTaskStatus(task.deadline).status === 'urgent'
                                        ? 'bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700/50'
                                        : getTaskStatus(task.deadline).status === 'warning'
                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50'
                                        : 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50'
                                    }`}>
                                      {getTaskStatus(task.deadline).text}
                                    </span>
                                    
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                      {task.category}
                                    </span>
                                    
                                    {currentCategory === 'deleted' && task.daysLeft !== undefined && (
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        task.daysLeft > 7 
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                          : task.daysLeft > 3
                                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                                          : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                      }`}>
                                        {task.daysLeft}天后永久删除
                                      </span>
                                    )}
                                  </div>

                                  {/* 任务描述 */}
                                  {task.description && (
                                    <div className="mb-2">
                                      <div className="bg-blue-50/60 dark:bg-blue-900/20 rounded-mobile-lg p-3 border border-blue-200/50 dark:border-blue-700/30">
                                        <div className="flex items-start gap-2">
                                          <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                          <p className="text-sm text-blue-800 dark:text-blue-200 line-clamp-3">
                                            {task.description}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* 任务详情网格 */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-mobile-lg p-3">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                    <FolderOpen className="w-3.5 h-3.5" />
                                    任务信息
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    <p><span className="font-medium">类型:</span> {task.category}</p>
                                    <p><span className="font-medium">文件:</span> {task.needsFile ? '必交' : '无'}</p>
                                    <p><span className="font-medium">AIGC:</span> {task.allowAIGC ? '允许' : '禁止'}</p>
                                    <p><span className="font-medium">班级:</span>  {task.classIds && task.classIds.length > 0
                                      ? task.classIds.map(cls => cls.name).join('，')
                                      : '未绑定'}
                                  </p>
                                  </div>
                                </div>

                                <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-mobile-lg p-3">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    时间设置
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    <p><span className="font-medium">截止:</span> {formatDeadline(task.deadline)}</p>
                                    <p><span className="font-medium">逾期:</span> {task.allowLateSubmission ? '允许' : '不允许'}</p>
                                  </div>
                                </div>

                                <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-mobile-lg p-3">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                    <BarChart3 className="w-3.5 h-3.5" />
                                    状态信息
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    {currentCategory === 'archived' && (
                                      <p><span className="font-medium">学生查看:</span> {task.allowStudentViewWhenArchived ? '开放' : '限制'}</p>
                                    )}
                                    <p><span className="font-medium">创建:</span> {new Date(task.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              </div>
                              
                            {/* 操作按钮组 */}
                              <div className="flex flex-wrap gap-2">
                                {/* 查看提交记录按钮 */}
                                <SecondaryButton
                                  size="sm"
                                  icon={<FileText className="w-4 h-4" />}
                                  onClick={() => navigate(`/task/${task._id}/submissions`)}
                                >
                                  查看提交
                                </SecondaryButton>
                                
                                {/* 班级提交情况按钮 */}
                                <PrimaryButton
                                  size="sm"
                                  icon={<BarChart3 className="w-4 h-4" />}
                                  onClick={() => navigate(`/task/${task._id}/class-status`)}
                                >
                                  班级统计
                                </PrimaryButton>

                                  {/* 根据任务状态显示不同操作按钮 */}
                                {currentCategory === 'active' && (
                                  <>
                                    <SecondaryButton
                                      size="sm"
                                      icon={<Archive className="w-4 h-4" />}
                                      onClick={() => setConfirmDialog({
                                        isOpen: true,
                                        title: '确认归档任务',
                                        message: `确定要归档任务"${task.title}"吗？归档后学生将无法提交作业。`,
                                        onConfirm: () => {
                                          handleTaskOperation(task._id, 'archive');
                                          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                        },
                                        confirmText: '归档',
                                        confirmVariant: 'primary'
                                      })}
                                      disabled={batchLoading}
                                    >
                                      归档
                                    </SecondaryButton>
                                    
                                    <DangerButton
                                      size="sm"
                                      icon={<Trash2 className="w-4 h-4" />}
                                      onClick={() => setConfirmDialog({
                                        isOpen: true,
                                        title: '确认删除任务',
                                        message: `确定要删除任务"${task.title}"吗？删除后30天内可恢复。`,
                                        onConfirm: () => {
                                          handleTaskOperation(task._id, 'soft_delete');
                                          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                        },
                                        confirmText: '删除',
                                        confirmVariant: 'danger'
                                      })}
                                      disabled={batchLoading}
                                    >
                                      删除
                                    </DangerButton>
                                  </>
                                )}

                                {currentCategory === 'archived' && (
                                  <>
                                    <SecondaryButton
                                      size="sm"
                                      icon={<Send className="w-4 h-4" />}
                                      onClick={() => handleTaskOperation(task._id, 'unarchive')}
                                      disabled={batchLoading}
                                    >
                                      恢复
                                    </SecondaryButton>
                                    
                                    <SecondaryButton
                                      size="sm"
                                      icon={task.allowStudentViewWhenArchived ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                      onClick={async () => {
                                        try {
                                          await api.put(`/task/${task._id}/student-permission`, {
                                            allowStudentViewWhenArchived: !task.allowStudentViewWhenArchived
                                          });
                                          toast.success(' 权限设置成功');
                                          await fetchTasks(currentCategory);
                                        } catch (err) {
                                          toast.error(` 权限设置失败：${err.response?.data?.message || err.message}`);
                                        }
                                      }}
                                      disabled={batchLoading}
                                    >
                                      {task.allowStudentViewWhenArchived ? '限制查看' : '开放查看'}
                                    </SecondaryButton>
                                    
                                    <DangerButton
                                      size="sm"
                                      icon={<Trash2 className="w-4 h-4" />}
                                      onClick={() => setConfirmDialog({
                                        isOpen: true,
                                        title: '确认删除任务',
                                        message: `确定要删除任务"${task.title}"吗？删除后30天内可恢复。`,
                                        onConfirm: () => {
                                          handleTaskOperation(task._id, 'soft_delete');
                                          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                        },
                                        confirmText: '删除',
                                        confirmVariant: 'danger'
                                      })}
                                      disabled={batchLoading}
                                    >
                                      删除
                                    </DangerButton>
                                  </>
                                )}

                                {currentCategory === 'deleted' && (
                                  <>
                                    <PrimaryButton
                                      size="sm"
                                      icon={<RefreshCw className="w-4 h-4" />}
                                      onClick={() => handleTaskOperation(task._id, 'restore')}
                                      disabled={batchLoading}
                                    >
                                      恢复
                                    </PrimaryButton>
                                    
                                    <DangerButton
                                      size="sm"
                                      icon={<X className="w-4 h-4" />}
                                      onClick={() => setConfirmDialog({
                                        isOpen: true,
                                        title: '⚠️ 永久删除任务',
                                        message: `确定要永久删除任务"${task.title}"吗？此操作无法撤销！`,
                                        onConfirm: () => {
                                          handleTaskOperation(task._id, 'hard_delete');
                                          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                        },
                                        confirmText: '永久删除',
                                        confirmVariant: 'danger'
                                      })}
                                      disabled={batchLoading}
                                    >
                                      永久删除
                                    </DangerButton>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 批量操作确认模态框 */}
          <AnimatePresence>
            {showBatchModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={(e) => e.target === e.currentTarget && setShowBatchModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
                >
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    确认批量操作
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    确定要对选中的 {selectedTasks.size} 个任务执行
                    {batchOperation === 'archive' ? '归档' :
                    batchOperation === 'unarchive' ? '恢复归档' :
                    batchOperation === 'soft_delete' ? '删除' : '恢复'}
                    操作吗？
                  </p>
                  <div className="flex gap-3 justify-end">
                    <SecondaryButton
                      onClick={() => setShowBatchModal(false)}
                      disabled={batchLoading}
                    >
                      取消
                    </SecondaryButton>
                    <PrimaryButton
                      variant={batchOperation === 'soft_delete' ? 'danger' : 'primary'}
                      onClick={handleBatchOperation}
                      loading={batchLoading}
                    >
                      确认{batchOperation === 'archive' ? '归档' :
                            batchOperation === 'unarchive' ? '恢复' :
                            batchOperation === 'soft_delete' ? '删除' : '恢复'}
                    </PrimaryButton>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          confirmVariant={confirmDialog.confirmVariant}
          loading={batchLoading}
        />
      <NicknamePrompt
        user={user}
        onUserUpdate={handleUserUpdate}
      />
    </PullToRefreshContainer>
  );
};

export default TeacherDashboard;