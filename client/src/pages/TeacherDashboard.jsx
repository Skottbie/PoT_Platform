//client/src/pages/TeacherDashboard.jsx

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { FormCard, TaskCard, StatsCard } from '../components/EnhancedMobileCard';
import { PrimaryButton, SecondaryButton, DangerButton, WarningButton } from '../components/EnhancedButton';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

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
  
  const navigate = useNavigate();
  const [myClasses, setMyClasses] = useState([]);

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

  // 🚀 提前计算当前任务列表
  const currentTasks = useMemo(() => tasks[currentCategory] || [], [tasks, currentCategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-center text-gray-500">加载中...</p>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 transition-colors duration-300">
      <div className="max-w-2xl mx-auto space-y-10">
        <FormCard className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                欢迎回来
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-mobile">
              <span className="text-white text-xl font-bold">👨‍🏫</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <PrimaryButton 
              size="md" 
              icon="➕" 
              haptic
              onClick={() => navigate('/create-class')}
              className="flex-1 sm:flex-none"
            >
              创建新班级
            </PrimaryButton>
            <SecondaryButton 
              size="md" 
              icon="📚" 
              onClick={() => navigate('/my-classes')}
              className="flex-1 sm:flex-none"
            >
              管理班级
            </SecondaryButton>
          </div>

          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-mobile-2xl p-6 border border-blue-200/50 dark:border-blue-700/30 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <span className="text-xl">🚀</span>
              发布新任务
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 基础信息 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="mobile-form-label">
                      任务标题 *
                    </label>
                    <input
                      type="text"
                      name="title"
                      placeholder="输入任务标题..."
                      value={form.title}
                      onChange={handleChange}
                      required
                      className="mobile-form-input focus:ring-blue-500/50 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mobile-form-label">
                      任务类型
                    </label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="mobile-form-input focus:ring-blue-500/50 focus:border-blue-500"
                    >
                      <option value="课堂练习">📝 课堂练习</option>
                      <option value="课程任务">📚 课程任务</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mobile-form-label">
                    任务描述
                  </label>
                  <textarea
                    name="description"
                    placeholder="详细描述任务要求..."
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    className="mobile-form-input resize-none focus:ring-blue-500/50 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 提交要求 */}
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-mobile-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <span>📋</span>
                  提交要求
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <label className="flex items-center gap-3 p-3 rounded-mobile-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      name="needsFile"
                      checked={form.needsFile}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      要求文件
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-mobile-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      name="allowAIGC"
                      checked={form.allowAIGC}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      允许 AIGC
                    </span>
                  </label>

                  <label className={`flex items-center gap-3 p-3 rounded-mobile-lg border transition-colors cursor-pointer ${
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
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      要求 AIGC 记录
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-mobile-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      name="allowLateSubmission"
                      checked={form.allowLateSubmission}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
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
                    <span>🏫</span>
                    关联班级
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {myClasses.map((cls) => (
                      <label 
                        key={cls._id} 
                        className="flex items-center gap-3 p-3 rounded-mobile-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer"
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
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
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
                  <span>⏰</span>
                  截止时间
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mobile-form-label">
                      截止日期 *
                    </label>
                    <input
                      type="date"
                      name="deadline"
                      value={form.deadline}
                      onChange={handleChange}
                      required
                      className="mobile-form-input focus:ring-blue-500/50 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="mobile-form-label">
                      截止时间 *
                    </label>
                    <input
                      type="time"
                      name="deadlineTime"
                      value={form.deadlineTime}
                      onChange={handleChange}
                      required
                      className="mobile-form-input focus:ring-blue-500/50 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <PrimaryButton
                type="submit"
                size="lg"
                fullWidth
                icon="📤"
                haptic
                gradient
                className="font-semibold"
              >
                发布任务
              </PrimaryButton>

              {message && (
                <div className={`p-4 rounded-mobile-xl border text-center font-medium ${
                  message.startsWith('✅') 
                    ? 'mobile-status-success' 
                    : 'mobile-status-error'
                }`}>
                  {message}
                </div>
              )}
            </form>
          </div>
        </FormCard>

        {/* 任务管理区域 */}
        <div>
          {/* 任务分类标签 */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 p-1.5 rounded-mobile-2xl shadow-mobile">
              {[
                { key: 'active', label: '📋 活跃任务', count: tasks.active.length, color: 'blue' },
                { key: 'archived', label: '📦 已归档', count: tasks.archived.length, color: 'gray' },
                { key: 'deleted', label: '🗑️ 回收站', count: tasks.deleted.length, color: 'red' }
              ].map(({ key, label, count, color }) => (
                <button
                  key={key}
                  onClick={() => handleCategoryChange(key)}
                  className={`px-4 py-3 rounded-mobile-xl text-sm font-medium transition-all duration-300 ease-out touch-manipulation ${
                    currentCategory === key
                      ? `bg-gradient-to-r ${
                          color === 'blue' 
                            ? 'from-blue-500 to-cyan-500 text-white shadow-mobile-lg transform scale-[1.02]' 
                            : color === 'red'
                            ? 'from-red-500 to-rose-500 text-white shadow-mobile-lg transform scale-[1.02]'
                            : 'from-gray-500 to-slate-500 text-white shadow-mobile-lg transform scale-[1.02]'
                        }`
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>{label}</span>
                    <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${
                      currentCategory === key
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {count}
                    </span>
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
                  icon={currentCategory === 'active' ? '📦' : '🔄'}
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
                    icon="🗑️"
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
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium">
                    全选 ({selectedTasks.size}/{currentTasks.length})
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* 任务列表 */}
          {currentTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center shadow-mobile">
                <span className="text-gray-400 dark:text-gray-500 text-3xl">
                  {currentCategory === 'active' ? '📋' : currentCategory === 'archived' ? '📦' : '🗑️'}
                </span>
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
                  icon="➕"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  发布新任务
                </PrimaryButton>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {currentTasks.map((task, index) => {
                const taskStatus = getTaskStatus(task.deadline);
                
                return (
                  <motion.div
                    key={task._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TaskCard
                      status={taskStatus.status === 'expired' ? 'overdue' : 
                             task.isArchived ? 'archived' : 'default'}
                      className="p-6"
                    >
                      <div className="flex items-start gap-4">
                        {/* 选择框 */}
                        <div className="flex-shrink-0 pt-1">
                          <input
                            type="checkbox"
                            checked={selectedTasks.has(task._id)}
                            onChange={() => toggleTaskSelection(task._id)}
                            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
                                {task.title}
                              </h3>
                              
                              {/* 状态标签 */}
                              <div className="flex items-center gap-2 flex-wrap mb-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${taskStatus.color} ${
                                  taskStatus.status === 'expired' 
                                    ? 'bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50'
                                    : taskStatus.status === 'urgent'
                                    ? 'bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700/50'
                                    : taskStatus.status === 'warning'
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50'
                                    : 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50'
                                }`}>
                                  {taskStatus.text}
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
                                <div className="mb-4">
                                  <div className="bg-blue-50/60 dark:bg-blue-900/20 rounded-mobile-lg p-3 border border-blue-200/50 dark:border-blue-700/30">
                                    <p className="text-sm text-blue-800 dark:text-blue-200 line-clamp-3">
                                      📋 {task.description}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* 任务详情网格 */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-mobile-lg p-3">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">📂 任务信息</div>
                              <div className="space-y-1 text-sm">
                                <p><span className="font-medium">类型:</span> {task.category}</p>
                                <p><span className="font-medium">文件:</span> {task.needsFile ? '必交' : '可选'}</p>
                                <p><span className="font-medium">AIGC:</span> {task.allowAIGC ? '允许' : '禁止'}</p>
                              </div>
                            </div>

                            <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-mobile-lg p-3">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">⏰ 时间设置</div>
                              <div className="space-y-1 text-sm">
                                <p><span className="font-medium">截止:</span> {formatDeadline(task.deadline)}</p>
                                <p><span className="font-medium">逾期:</span> {task.allowLateSubmission ? '允许' : '不允许'}</p>
                              </div>
                            </div>

                            <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-mobile-lg p-3">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">📊 状态信息</div>
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
                              icon="📝"
                              onClick={() => navigate(`/task/${task._id}/submissions`)}
                            >
                              查看提交
                            </SecondaryButton>
                            
                            {/* 班级提交情况按钮 */}
                            <PrimaryButton
                              size="sm"
                              icon="📊"
                              onClick={() => navigate(`/task/${task._id}/class-status`)}
                            >
                              班级统计
                            </PrimaryButton>

                            {/* 根据任务状态显示不同操作按钮 */}
                            {currentCategory === 'active' && (
                              <>
                                <SecondaryButton
                                  size="sm"
                                  icon="📦"
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
                                  icon="🗑️"
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
                                  icon="📤"
                                  onClick={() => handleTaskOperation(task._id, 'unarchive')}
                                  disabled={batchLoading}
                                >
                                  恢复
                                </SecondaryButton>
                                
                                <SecondaryButton
                                  size="sm"
                                  icon={task.allowStudentViewWhenArchived ? '🔒' : '🔓'}
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
                                >
                                  {task.allowStudentViewWhenArchived ? '限制查看' : '开放查看'}
                                </SecondaryButton>
                                
                                <DangerButton
                                  size="sm"
                                  icon="🗑️"
                                  onClick={() => handleTaskOperation(task._id, 'soft_delete')}
                                  disabled={batchLoading}
                                >
                                  删除
                                </DangerButton>
                              </>
                            )}

                            {currentCategory === 'deleted' && (
                              <>
                                <SecondaryButton
                                  size="sm"
                                  icon="🔄"
                                  onClick={() => handleTaskOperation(task._id, 'restore')}
                                  disabled={batchLoading}
                                >
                                  恢复
                                </SecondaryButton>
                                
                                <DangerButton
                                  size="sm"
                                  icon="💀"
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
                                >
                                  永久删除
                                </DangerButton>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </TaskCard>
                  </motion.div>
                );
              })}
            </div>
          )}
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
                  <Button
                    variant="secondary"
                    onClick={() => setShowBatchModal(false)}
                    disabled={batchLoading}
                  >
                    取消
                  </Button>
                  <Button
                    variant={batchOperation === 'soft_delete' ? 'danger' : 'primary'}
                    onClick={handleBatchOperation}
                    loading={batchLoading}
                  >
                    确认{batchOperation === 'archive' ? '归档' :
                           batchOperation === 'unarchive' ? '恢复' :
                           batchOperation === 'soft_delete' ? '删除' : '恢复'}
                  </Button>
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
    </div>
  );
};

export default TeacherDashboard;