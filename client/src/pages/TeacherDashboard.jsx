import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Button from '../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';
import FilterBar from '../components/FilterBar';
import AdvancedFilters from '../components/AdvancedFilters';
import { useTaskFiltering, teacherQuickFilters } from '../hooks/useFilters';
import { useSearch } from '../hooks/useSearch';

const TeacherDashboard = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    title: '',
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

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: '确认',
    confirmVariant: 'danger'
  });
  
  const [tasks, setTasks] = useState({
    active: [],
    archived: [],
    deleted: []
  });
  const [currentCategory, setCurrentCategory] = useState('active');
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchOperation, setBatchOperation] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const [myClasses, setMyClasses] = useState([]);

  const {
    filters,
    updateFilters,
    resetFilters,
    showAdvancedFilters,
    toggleAdvancedFilters,
    filteredTasks,
    stats
  } = useTaskFiltering(tasks[currentCategory] || [], myClasses, []);

  const {
    searchQuery,
    setSearchQuery,
    searchHistory,
    suggestions,
    updateSuggestions,
    performSearch,
    clearSearchHistory
  } = useSearch(tasks[currentCategory] || []);

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const res = await api.get('/user/profile');
        if (res.data.role !== 'teacher') return navigate('/');
        setUser(res.data);

        const classRes = await api.get('/class/my-classes');
        if (classRes.data.success) {
          setMyClasses(classRes.data.classes);
        }

        await fetchTasks();
      } catch {
        navigate('/');
      }
    };
    fetchUserAndData();
  }, [navigate]);

  useEffect(() => {
    if (currentCategory === 'active') {
      updateSuggestions(searchQuery, tasks[currentCategory], myClasses);
    }
  }, [searchQuery, tasks, currentCategory, myClasses, updateSuggestions]);

  const fetchTasks = async (category = 'active') => {
    try {
      const res = await api.get(`/task/mine?category=${category}`);
      setTasks(prev => ({ ...prev, [category]: res.data }));
    } catch (err) {
      console.error('获取任务失败:', err);
    }
  };

  const handleCategoryChange = async (category) => {
    setCurrentCategory(category);
    setSelectedTasks(new Set());
    resetFilters();
    await fetchTasks(category);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (form.requireAIGCLog && !form.allowAIGC) {
      return setMessage('❌ 必须先允许使用AIGC，才能要求上传AIGC记录。');
    }

    if (!form.deadline) {
      return setMessage('❌ 请设置截止日期。');
    }
    if (!form.deadlineTime) {
      return setMessage('❌ 请设置截止时间。');
    }

    const deadlineDateTime = new Date(`${form.deadline}T${form.deadlineTime}`);
    const now = new Date();
    
    if (deadlineDateTime <= now) {
      return setMessage('❌ 截止时间必须晚于当前时间。');
    }

    try {
      const submitData = {
        ...form,
        deadline: deadlineDateTime.toISOString(),
      };
      delete submitData.deadlineTime;

      await api.post('/task', submitData);
      setMessage('✅ 任务发布成功！');
      setForm({
        title: '',
        category: '课堂练习',
        needsFile: false,
        allowAIGC: false,
        requireAIGCLog: false,
        deadline: '',
        deadlineTime: '',
        allowLateSubmission: false,
        classIds: [],
      });

      await fetchTasks('active');
    } catch (err) {
      console.error(err);
      setMessage('❌ 发布失败，请检查字段');
    }
  };

  const handleTaskOperation = async (taskId, operation, options = {}) => {
    try {
      setLoading(true);
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
      
      await fetchTasks(currentCategory);
      toast.success('操作成功');
    } catch (err) {
      console.error('操作失败:', err);
      toast.error(`❌ 操作失败：${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchOperation = async () => {
    if (selectedTasks.size === 0) {
      setMessage('❌ 请选择要操作的任务');
      return;
    }

    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const toggleTaskSelection = (taskId) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const toggleSelectAll = () => {
    const currentTasks = tasks[currentCategory] || [];
    if (selectedTasks.size === currentTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(currentTasks.map(task => task._id)));
    }
  };

  const handleSearch = (query) => {
    performSearch(query);
    updateFilters({ ...filters, search: query });
  };

  const handleFiltersChange = (newFilters) => {
    updateFilters(newFilters);
    if (newFilters.search !== searchQuery) {
      setSearchQuery(newFilters.search || '');
    }
  };

  const formatDeadline = (deadline) => {
    const date = new Date(deadline);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTaskStatus = (deadline) => {
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
  };

  if (!user)
    return <p className="text-center mt-10 text-gray-500">加载中...</p>;

  const currentTasks = currentCategory === 'active' ? filteredTasks : (tasks[currentCategory] || []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 transition-colors duration-300">
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transition-colors duration-300">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            欢迎回来，{user.email}
          </h1>

          <div className="flex gap-3 mb-6">
            <Button variant="primary" size="sm" onClick={() => navigate('/create-class')}>
              ➕ 创建新班级
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/my-classes')}>
              📚 管理我的班级
            </Button>
          </div>

          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">发布新任务</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="title"
              placeholder="任务标题"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 dark:border-gray-600 
                             rounded-lg bg-white dark:bg-gray-700 
                             text-gray-900 dark:text-gray-100 
                             transition-colors duration-300 p-2"
            />
            
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              任务提交要求
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="needsFile"
                  checked={form.needsFile}
                  onChange={handleChange}
                />
                要求提交作业文件
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="allowAIGC"
                  checked={form.allowAIGC}
                  onChange={handleChange}
                />
                允许使用 AIGC
              </label>

              <label className={`flex items-center gap-2 text-sm ${!form.allowAIGC ? 'text-gray-400' : ''}`}>
                <input
                  type="checkbox"
                  name="requireAIGCLog"
                  checked={form.requireAIGCLog}
                  onChange={handleChange}
                  disabled={!form.allowAIGC}
                />
                要求上传 AIGC 原始记录
              </label>
            </div>
            
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 
                             rounded-lg bg-white dark:bg-gray-700 
                             text-gray-900 dark:text-gray-100 
                             transition-colors duration-300 p-2"
            >
              <option value="课堂练习">课堂练习</option>
              <option value="课程任务">课程任务</option>
            </select>

            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">📌 选择关联班级</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {myClasses.map((cls) => (
                  <label key={cls._id} className="flex items-center gap-2 text-sm">
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
                    />
                    {cls.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">⏰ 设置截止时间</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">截止日期</label>
                  <input
                    type="date"
                    name="deadline"
                    value={form.deadline}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 
                                   rounded-lg bg-white dark:bg-gray-700 
                                   text-gray-900 dark:text-gray-100 
                                   transition-colors duration-300 p-2"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">截止时间</label>
                  <input
                    type="time"
                    name="deadlineTime"
                    value={form.deadlineTime}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 
                                   rounded-lg bg-white dark:bg-gray-700 
                                   text-gray-900 dark:text-gray-100 
                                   transition-colors duration-300 p-2"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="allowLateSubmission"
                  checked={form.allowLateSubmission}
                  onChange={handleChange}
                />
                允许逾期提交（逾期提交将被特殊标注）
              </label>
            </div>

            <Button variant="primary" size="md" fullWidth>
              📤 发布任务
            </Button>

            {message && (
              <p
                className={`text-center text-sm mt-2 ${
                  message.startsWith('✅') ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {message}
              </p>
            )}
          </form>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between mb-6">
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              {[
                { key: 'active', label: '📋 活跃任务', count: tasks.active.length },
                { key: 'archived', label: '📦 已归档', count: tasks.archived.length },
                { key: 'deleted', label: '🗑️ 回收站', count: tasks.deleted.length }
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

            {selectedTasks.size > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setBatchOperation(currentCategory === 'active' ? 'archive' : 
                                    currentCategory === 'archived' ? 'unarchive' : 'restore');
                    setShowBatchModal(true);
                  }}
                >
                  批量{currentCategory === 'active' ? '归档' : 
                        currentCategory === 'archived' ? '恢复' : '恢复'} ({selectedTasks.size})
                </Button>
                {currentCategory !== 'deleted' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setBatchOperation('soft_delete');
                      setShowBatchModal(true);
                    }}
                  >
                    批量删除 ({selectedTasks.size})
                  </Button>
                )}
              </div>
            )}
          </div>

          {currentCategory === 'active' && (
            <div className="space-y-4 mb-6">
              <FilterBar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                quickFilters={teacherQuickFilters}
                showAdvanced={showAdvancedFilters}
                onToggleAdvanced={toggleAdvancedFilters}
                searchSuggestions={suggestions}
                searchHistory={searchHistory}
                onClearSearchHistory={clearSearchHistory}
                onSearch={handleSearch}
                totalCount={tasks[currentCategory].length}
                filteredCount={filteredTasks.length}
              />

              <AdvancedFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                isVisible={showAdvancedFilters}
                onClose={() => toggleAdvancedFilters(false)}
                classes={myClasses}
                userRole="teacher"
              />
            </div>
          )}

          {currentTasks.length > 0 && (
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={selectedTasks.size === currentTasks.length && currentTasks.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
                全选 ({selectedTasks.size}/{currentTasks.length})
              </label>
            </div>
          )}

          {currentTasks.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-gray-400 dark:text-gray-500 text-2xl">
                  {currentCategory === 'active' ? '📋' : 
                   currentCategory === 'archived' ? '📦' : '🗑️'}
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {currentCategory === 'active' 
                  ? stats.hasActiveFilters 
                    ? '没有符合筛选条件的任务' 
                    : '暂无活跃任务'
                  : currentCategory === 'archived' 
                  ? '暂无归档任务' 
                  : '回收站为空'
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
            <div className="space-y-4">
              {currentTasks.map((task) => {
                const taskStatus = getTaskStatus(task.deadline);
                return (
                  <motion.div
                    key={task._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 dark:border-gray-700 
                                 rounded-2xl p-4 bg-white dark:bg-gray-800 
                                 shadow transition-colors duration-300"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task._id)}
                        onChange={() => toggleTaskSelection(task._id)}
                        className="mt-1 rounded"
                      />

                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2">
                            {currentCategory === 'deleted' && task.daysLeft !== undefined && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                task.daysLeft > 7 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                  : task.daysLeft > 3
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                              }`}>
                                {task.daysLeft}天后永久删除
                              </span>
                            )}
                            {currentCategory !== 'deleted' && (
                              <span className={`text-sm font-medium ${taskStatus.color}`}>
                                {taskStatus.text}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <p>分类：{task.category}</p>
                          <p>作业文件：{task.needsFile ? '必交' : '可选'}</p>
                          <p>截止时间：{formatDeadline(task.deadline)}</p>
                          <p>逾期提交：{task.allowLateSubmission ? '允许' : '不允许'}</p>
                          {currentCategory === 'archived' && (
                            <p>学生查看权限：{task.allowStudentViewWhenArchived ? '开放' : '限制'}</p>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/task/${task._id}/submissions`)}
                          >
                            查看提交记录
                          </Button>
                          
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/task/${task._id}/class-status`)}
                          >
                            班级提交情况
                          </Button>

                          {currentCategory === 'active' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
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
                                disabled={loading}
                              >
                                📦 归档
                              </Button>

                              <Button
                                variant="danger"
                                size="sm"
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
                                disabled={loading}
                              >
                                🗑️ 删除
                              </Button>
                            </>
                          )}

                          {currentCategory === 'archived' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTaskOperation(task._id, 'unarchive')}
                                disabled={loading}
                              >
                                📤 恢复
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    await api.put(`/task/${task._id}/student-permission`, {
                                      allowStudentViewWhenArchived: !task.allowStudentViewWhenArchived
                                    });
                                    toast.success('权限设置成功');
                                    await fetchTasks(currentCategory);
                                  } catch (err) {
                                    toast.error(`❌ 权限设置失败：${err.response?.data?.message || err.message}`);
                                  }
                                }}
                                disabled={loading}
                              >
                                {task.allowStudentViewWhenArchived ? '🔒 限制学生查看' : '🔓 开放学生查看'}
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleTaskOperation(task._id, 'soft_delete')}
                                disabled={loading}
                              >
                                🗑️ 删除
                              </Button>
                            </>
                          )}

                          {currentCategory === 'deleted' && (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleTaskOperation(task._id, 'restore')}
                                disabled={loading}
                              >
                                🔄 恢复
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
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
                                disabled={loading}
                              >
                                💀 永久删除
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

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
                    disabled={loading}
                  >
                    取消
                  </Button>
                  <Button
                    variant={batchOperation === 'soft_delete' ? 'danger' : 'primary'}
                    onClick={handleBatchOperation}
                    loading={loading}
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
        loading={loading}
      />
    </div>
  );
};

export default TeacherDashboard;