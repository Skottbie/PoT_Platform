// src/pages/EditClassStudents.jsx - 修复版本

import { useEffect, useState, useCallback, memo } from 'react'; // 修复：导入 memo
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Button from '../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import PullToRefreshContainer from '../components/PullToRefreshContainer';
import useAutoRefresh from '../hooks/useAutoRefresh';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { 
  Edit, 
  Users, 
  ArrowLeft, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Info, 
  Plus,
  Trash2,
  User,
  Hash,
  Calendar
} from 'lucide-react';


// 修复：将 StudentCard 组件移到外部，并用 React.memo 包裹以优化性能
const StudentCard = memo(({ student, index, selectedStudents, toggleStudentSelection, updateStudent }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className={`bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-600 ${
      student.isModified ? 'ring-2 ring-blue-500/50 bg-blue-50 dark:bg-blue-900/20' : ''
    }`}
  >
    {/* 卡片头部 */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={selectedStudents.has(index)}
          onChange={() => toggleStudentSelection(index)}
          className="rounded"
        />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            学生 #{index + 1}
          </span>
          {student.isModified && (
            <span className="text-xs text-blue-600 dark:text-blue-400">
              已修改
            </span>
          )}
        </div>
      </div>
      
      {/* 状态标签 */}
      <div className="flex items-center">
        {student.userId ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
            <CheckCircle className="w-3 h-3" />
            已加入
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            <Clock className="w-3 h-3" />
            未加入
          </span>
        )}
      </div>
    </div>

    {/* 表单字段 */}
    <div className="space-y-3">
      <div>
        <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          <User className="w-3 h-3" />
          学生姓名
        </label>
        <input
          type="text"
          value={student.name}
          onChange={(e) => updateStudent(index, 'name', e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="请输入学生姓名"
        />
      </div>
      
      <div>
        <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          <Hash className="w-3 h-3" />
          学号
        </label>
        <input
          type="text"
          value={student.studentId}
          onChange={(e) => updateStudent(index, 'studentId', e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="请输入学号"
        />
      </div>

      {/* 底部信息 */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
        {student.joinedAt ? (
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            加入时间：{new Date(student.joinedAt).toLocaleDateString()}
          </div>
        ) : (
          <div className="text-xs text-gray-400 dark:text-gray-500">
            学生尚未加入班级
          </div>
        )}
      </div>
    </div>
  </motion.div>
));

// 修复：将 NewStudentCard 组件移到外部，并用 React.memo 包裹以优化性能
const NewStudentCard = memo(({ student, index, showRemoveButton, updateNewStudent, removeNewStudentRow }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-600"
  >
    {/* 卡片头部 */}
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
          {index + 1}
        </div>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">新学生</span>
      </div>
      {showRemoveButton && (
        <button
          type="button"
          onClick={() => removeNewStudentRow(index)}
          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors aigc-native-button"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>

    {/* 表单字段 */}
    <div className="space-y-3">
      <div>
        <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          <User className="w-3 h-3" />
          学生姓名 *
        </label>
        <input
          type="text"
          value={student.name}
          onChange={(e) => updateNewStudent(index, 'name', e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="请输入学生姓名"
        />
      </div>
      
      <div>
        <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          <Hash className="w-3 h-3" />
          学号 *
        </label>
        <input
          type="text"
          value={student.studentId}
          onChange={(e) => updateNewStudent(index, 'studentId', e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="请输入学号"
        />
      </div>
    </div>
  </motion.div>
));


const EditClassStudents = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [newStudents, setNewStudents] = useState([
    { name: '', studentId: '', isNew: true }
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // 防止背景滚动
  const preventBodyScroll = useCallback(() => {
    document.body.style.overflow = 'hidden';
  }, []);

  const restoreBodyScroll = useCallback(() => {
    document.body.style.overflow = '';
  }, []);

  useEffect(() => {
    if (showConfirmModal) {
      preventBodyScroll();
    } else {
      restoreBodyScroll();
    }

    return () => restoreBodyScroll();
  }, [showConfirmModal, preventBodyScroll, restoreBodyScroll]);

  // 核心数据获取函数
  const fetchClassData = useCallback(async () => {
    try {
      const res = await api.get(`/class/${classId}`);
      if (res.data.success) {
        const cls = res.data.class;
        setClassData(cls);
        const activeStudents = cls.studentList.filter(s => !s.isRemoved);
        setStudents(activeStudents.map(s => ({ ...s, isModified: false, originalStudentId: s.studentId})));
      } else {
        setMessage('获取班级信息失败');
      }
    } catch (err) {
      console.error('获取班级失败:', err);
      setMessage('网络错误或服务器异常');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  // 自动刷新专用函数（静默，无toast）
  const handleAutoRefresh = useCallback(async () => {
    try {
      const res = await api.get(`/class/${classId}`);
      if (res.data.success) {
        const cls = res.data.class;
        setClassData(cls);
        const activeStudents = cls.studentList.filter(s => !s.isRemoved);
        setStudents(activeStudents.map(s => ({ ...s, isModified: false })));
      }
    } catch (err) {
      console.error('自动刷新失败:', err);
    }
  }, [classId]);

  // 检查是否有权限编辑
  const canEdit = useCallback(() => {
    const userRole = localStorage.getItem('role');
    return userRole === 'teacher' && classData;
  }, [classData]);

  // 处理现有学生信息修改
  const updateStudent = useCallback((index, field, value) => {
    const newStudentList = [...students];
    const oldValue = newStudentList[index][field];
    
    if (oldValue !== value) {
      newStudentList[index][field] = value;
      newStudentList[index].isModified = true;
      setStudents(newStudentList);
      setHasChanges(true);
    }
  }, [students]);

  // 处理新学生信息输入
  const updateNewStudent = useCallback((index, field, value) => {
    const newStudentList = [...newStudents];
    newStudentList[index][field] = value;
    setNewStudents(newStudentList);
    setHasChanges(true);
  }, [newStudents]);

  // 添加新学生行
  const addNewStudentRow = useCallback(() => {
    setNewStudents([...newStudents, { name: '', studentId: '', isNew: true }]);
  }, [newStudents]);

  // 删除新学生行
  const removeNewStudentRow = useCallback((index) => {
    if (newStudents.length > 1) {
      const newStudentList = newStudents.filter((_, i) => i !== index);
      setNewStudents(newStudentList);
      setHasChanges(true);
    }
  }, [newStudents]);

  // 批量选择学生
  const toggleStudentSelection = useCallback((studentId) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  }, [selectedStudents]);

  // 全选/取消全选
  const toggleSelectAll = useCallback(() => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map((_, index) => index)));
    }
  }, [selectedStudents.size, students]);

  // 批量粘贴新学生
  const handleBatchPaste = useCallback((e) => {
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.trim().split('\n');
    const pastedStudents = [];
    
    lines.forEach(line => {
      const parts = line.trim().split('\t');
      if (parts.length >= 2) {
        pastedStudents.push({
          name: parts[0].trim(),
          studentId: parts[1].trim(),
          isNew: true
        });
      }
    });

    if (pastedStudents.length > 0) {
      setNewStudents([...newStudents.filter(s => s.name || s.studentId), ...pastedStudents]);
      setMessage(`已粘贴 ${pastedStudents.length} 条学生信息`);
      setHasChanges(true);
      setTimeout(() => setMessage(''), 3000);
    }
  }, [newStudents]);

  // 验证数据
  const validateData = useCallback(() => {
    // 检查现有学生学号重复
    const existingIds = students.map(s => s.studentId.trim());
    const newIds = newStudents.filter(s => s.name.trim() && s.studentId.trim()).map(s => s.studentId.trim());
    const allIds = [...existingIds, ...newIds];
    
    const duplicates = allIds.filter((id, index) => allIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      return { valid: false, message: `学号重复：${[...new Set(duplicates)].join(', ')}` };
    }

    // 检查必填字段
    const invalidStudents = students.filter(s => !s.name.trim() || !s.studentId.trim());
    if (invalidStudents.length > 0) {
      return { valid: false, message: '所有学生的姓名和学号都不能为空' };
    }

    return { valid: true };
  }, [students, newStudents]);

  // 确认操作模态框
  const showConfirmation = useCallback((action) => {
    setPendingAction(action);
    setShowConfirmModal(true);
  }, []);

  // 执行确认的操作
  const executeAction = useCallback(async () => {
    setShowConfirmModal(false);
    
    if (pendingAction.type === 'save') {
      await handleSave();
    } else if (pendingAction.type === 'remove_selected') {
      await handleRemoveSelected();
    }
    
    setPendingAction(null);
  }, [pendingAction]);

  // 保存修改
  const handleSave = useCallback(async () => {
    const validation = validateData();
    if (!validation.valid) {
      setMessage(validation.message);
      return;
    }

    setSaving(true);
    
    try {
      // 准备修改的学生数据
      const modifiedStudents = students.filter(s => s.isModified);
      const validNewStudents = newStudents.filter(s => s.name.trim() && s.studentId.trim());

      const updateData = {
        modifiedStudents: modifiedStudents.map(s => ({
          originalId: s._id || s.originalStudentId,
          name: s.name.trim(),
          studentId: s.studentId.trim()
        })),
        newStudents: validNewStudents.map(s => ({
          name: s.name.trim(),
          studentId: s.studentId.trim()
        }))
      };

      const res = await api.put(`/class/${classId}/students`, updateData);
      
      if (res.data.success) {
        setMessage('学生信息更新成功！');
        setHasChanges(false);
        setTimeout(() => {
          navigate('/my-classes');
        }, 1500);
      } else {
        setMessage(`更新失败：${res.data.message}`);
      }
    } catch (err) {
      console.error('更新学生信息失败:', err);
      setMessage(`更新失败：${err.response?.data?.message || '网络错误'}`);
    } finally {
      setSaving(false);
    }
  }, [validateData, students, newStudents, classId, navigate]);

  // 移除选中学生
  const handleRemoveSelected = useCallback(async () => {
    if (selectedStudents.size === 0) return;

    setSaving(true);
    
    try {
      const studentsToRemove = Array.from(selectedStudents).map(index => ({
        studentId: students[index].studentId,
        hasJoined: !students[index].userId
      }));

      const res = await api.delete(`/class/${classId}/students`, {
        data: { studentsToRemove }
      });
      
      if (res.data.success) {
        setMessage(`已移除 ${selectedStudents.size} 名学生`);
        setSelectedStudents(new Set());
        setHasChanges(false);
        // 重新获取数据
        await fetchClassData();
      } else {
        setMessage(`移除失败：${res.data.message}`);
      }
    } catch (err) {
      console.error('移除学生失败:', err);
      setMessage(`移除失败：${err.response?.data?.message || '网络错误'}`);
    } finally {
      setSaving(false);
    }
  }, [selectedStudents, students, classId, fetchClassData]);

  // 使用独立的自动刷新函数
  useAutoRefresh(handleAutoRefresh, {
    interval: 360000, // 6分钟
    enabled: true,
    pauseOnHidden: true,
  });

  // 初始化数据获取
  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  // 骨架屏加载组件
  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 头部骨架 */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
          <div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-48 mb-2"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-64"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-24"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-24"></div>
          </div>
        </div>
        
        {/* 卡片骨架 */}
        <div className="space-y-6">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
  
  // 加载状态
  if (loading) {
    return <LoadingSkeleton />;
  }

  // 权限检查
  if (!canEdit()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">您没有权限编辑此班级</p>
          <Button variant="secondary" onClick={() => navigate('/teacher')}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  // 页面容器动画配置
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <PullToRefreshContainer
      onRefresh={fetchClassData}
      refreshing={false}
    >
      <motion.div 
        className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-6xl mx-auto">
          {/* 页面头部 - 优化图标 */}
          <motion.div 
            className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6"
            variants={itemVariants}
          >
            <div>
              <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                <Edit className="w-6 h-6 text-blue-600" />
                编辑班级学生
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                班级：{classData?.name} | 当前学生：{students.length} 人
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              <Button
                variant="secondary"
                onClick={() => navigate(`/class/${classId}/students`)}
                disabled={saving}
                className="text-xs sm:text-sm px-2 sm:px-4"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">取消编辑</span>
                <span className="sm:hidden">取消编辑</span>
              </Button>
              <Button
                variant="primary"
                onClick={() => showConfirmation({
                  type: 'save',
                  title: '确认保存修改',
                  message: '确定要保存对学生信息的所有修改吗？此操作将同步更新相关的作业提交记录。'
                })}
                disabled={!hasChanges || saving}
                loading={saving}
                className="text-xs sm:text-sm px-2 sm:px-4"
              >
                <Save className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">保存修改</span>
                <span className="sm:hidden">保存修改</span>
              </Button>
            </div>
          </motion.div>

          {/* 警告提示 - 优化图标 */}
          <motion.div 
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 mb-6"
            variants={itemVariants}
          >
            <h3 className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 font-medium mb-2">
              <AlertTriangle className="w-5 h-5" />
              重要提示
            </h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• 修改学生姓名或学号将同步更新该学生的所有历史作业提交记录</li>
              <li>• 移除学生将进行30天软删除，期间可恢复，30天后永久删除</li>
              <li>• 已加入班级的学生被移除后，其作业记录将被保留但标记为"学生已移除"</li>
            </ul>
          </motion.div>

          {/* 现有学生编辑 - 响应式布局 */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md mb-8 overflow-hidden"
            variants={itemVariants}
          >
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
                  <Users className="w-5 h-5" />
                  现有学生 ({students.length})
                </h2>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={selectedStudents.size === students.length && students.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                    全选
                  </label>
                  {selectedStudents.size > 0 && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => showConfirmation({
                        type: 'remove_selected',
                        title: '确认移除学生',
                        message: `确定要移除选中的 ${selectedStudents.size} 名学生吗？移除后30天内可恢复，30天后将永久删除。`,
                        count: selectedStudents.size
                      })}
                    >
                      移除选中 ({selectedStudents.size})
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                暂无学生，请在下方添加新学生
              </div>
            ) : (
              <>
                {/* 移动端：卡片布局 */}
                <div className="md:hidden p-4 space-y-3">
                  <AnimatePresence>
                    {students.map((student, index) => (
                      // 修复：调用外部组件，并通过 props 传递所需的数据和函数
                      <StudentCard 
                        key={student._id || index} 
                        student={student} 
                        index={index}
                        selectedStudents={selectedStudents}
                        toggleStudentSelection={toggleStudentSelection}
                        updateStudent={updateStudent}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* 桌面端：表格布局 */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 w-12">选择</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">姓名</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">学号</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">状态</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">加入时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {students.map((student, index) => (
                        <motion.tr
                          key={student._id || index}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                            student.isModified ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedStudents.has(index)}
                              onChange={() => toggleStudentSelection(index)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={student.name}
                              onChange={(e) => updateStudent(index, 'name', e.target.value)}
                              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm
                                        bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={student.studentId}
                              onChange={(e) => updateStudent(index, 'studentId', e.target.value)}
                              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm
                                        bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {student.userId ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                  <CheckCircle className="w-3 h-3" />
                                  已加入
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                  <Clock className="w-3 h-3" />
                                  未加入
                                </span>
                              )}
                              {student.isModified && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                  已修改
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {student.joinedAt ? new Date(student.joinedAt).toLocaleDateString() : '-'}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </motion.div>

          {/* 添加新学生 - 响应式布局 */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
            variants={itemVariants}
          >
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
                <Plus className="w-5 h-5" />
                添加新学生
              </h2>
              <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                <Info className="w-4 h-4" />
                支持从Excel复制粘贴，格式：姓名[Tab]学号，每行一个学生
              </p>
            </div>

            <div className="p-6">
              <div onPaste={handleBatchPaste}>
                {/* 移动端：卡片布局 */}
                <div className="md:hidden space-y-3">
                  <AnimatePresence>
                    {newStudents.map((student, index) => (
                       // 修复：调用外部组件，并通过 props 传递所需的数据和函数
                      <NewStudentCard 
                        key={index} 
                        student={student} 
                        index={index}
                        showRemoveButton={newStudents.length > 1}
                        updateNewStudent={updateNewStudent}
                        removeNewStudentRow={removeNewStudentRow}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* 桌面端：表格布局 */}
                <div className="hidden md:block">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 w-16">序号</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">姓名</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">学号</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 w-20">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {newStudents.map((student, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={student.name}
                              onChange={(e) => updateNewStudent(index, 'name', e.target.value)}
                              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm
                                        bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="学生姓名"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={student.studentId}
                              onChange={(e) => updateNewStudent(index, 'studentId', e.target.value)}
                              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm
                                        bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="学号"
                            />
                          </td>
                          <td className="px-4 py-3">
                            {newStudents.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeNewStudentRow(index)}
                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm aigc-native-button"
                              >
                                删除
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addNewStudentRow}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  添加学生
                </Button>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  待添加学生：{newStudents.filter(s => s.name.trim() && s.studentId.trim()).length}
                </p>
              </div>
            </div>
          </motion.div>

          {/* 消息提示 */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-lg ${
                  message.includes('成功') || message.includes('已粘贴') || message.includes('已移除')
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>

        {/* 确认模态框 - 使用Portal渲染到body */}
        {showConfirmModal && pendingAction && createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
              onClick={(e) => e.target === e.currentTarget && setShowConfirmModal(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 25 
                }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
                style={{
                  position: 'relative',
                  maxHeight: '90vh',
                  overflow: 'auto'
                }}
              >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  {pendingAction.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {pendingAction.message}
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => setShowConfirmModal(false)}
                  >
                    取消
                  </Button>
                  <Button
                    variant={pendingAction.type === 'remove_selected' ? 'danger' : 'primary'}
                    onClick={executeAction}
                  >
                    确认
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
        </div>
      </motion.div>
    </PullToRefreshContainer>
  );
};

export default EditClassStudents;