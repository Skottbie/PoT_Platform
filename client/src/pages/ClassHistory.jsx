// src/pages/ClassHistory.jsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Button from '../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import PullToRefreshContainer from '../components/PullToRefreshContainer';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { useCallback } from 'react';

const ClassHistory = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  
  const [classData, setClassData] = useState(null);
  const [removedStudents, setRemovedStudents] = useState([]);
  const [editHistory, setEditHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    fetchClassHistory();
  }, [classId]);

  const fetchClassHistory = async () => {
    try {
      const res = await api.get(`/class/${classId}/history`);
      if (res.data.success) {
        setClassData(res.data.class);
        setRemovedStudents(res.data.removedStudents);
        setEditHistory(res.data.editHistory);
      } else {
        setMessage('❌ 获取班级历史失败');
      }
    } catch (err) {
      console.error('获取班级历史失败:', err);
      setMessage('❌ 网络错误或服务器异常');
    } finally {
      setLoading(false);
    }
  };

  // 恢复学生
  const handleRestoreStudent = async (studentId) => {
    try {
      const res = await api.post(`/class/${classId}/students/restore`, {
        studentId
      });
      
      if (res.data.success) {
        setMessage('✅ 学生恢复成功！');
        fetchClassHistory(); // 重新获取数据
      } else {
        setMessage(`❌ 恢复失败：${res.data.message}`);
      }
    } catch (err) {
      console.error('恢复学生失败:', err);
      setMessage(`❌ 恢复失败：${err.response?.data?.message || '网络错误'}`);
    }
  };

  // 永久删除学生
  const handlePermanentDelete = async (studentId) => {
    try {
      const res = await api.delete(`/class/${classId}/students/permanent`, {
        data: { studentId }
      });
      
      if (res.data.success) {
        setMessage('✅ 学生已永久删除！');
        fetchClassHistory(); // 重新获取数据
      } else {
        setMessage(`❌ 删除失败：${res.data.message}`);
      }
    } catch (err) {
      console.error('永久删除学生失败:', err);
      setMessage(`❌ 删除失败：${err.response?.data?.message || '网络错误'}`);
    }
  };

  const showConfirmation = (action) => {
    setPendingAction(action);
    setShowConfirmModal(true);
  };

  const executeAction = async () => {
    setShowConfirmModal(false);
    
    if (pendingAction.type === 'restore') {
      await handleRestoreStudent(pendingAction.studentId);
    } else if (pendingAction.type === 'permanent_delete') {
      await handlePermanentDelete(pendingAction.studentId);
    }
    
    setPendingAction(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getActionText = (action) => {
    const actionMap = {
      'add_student': '添加学生',
      'remove_student': '移除学生',
      'modify_student': '修改学生',
      'restore_student': '恢复学生',
      'modify_students': '批量修改学生',
      'remove_students': '批量移除学生'
    };
    return actionMap[action] || action;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">加载中...</p>
      </div>
    );
  }

  const handlePullRefresh = useCallback(async () => {
    try {
      await fetchClassHistory();
      toast.success('刷新成功');
    } catch (err) {
      console.error('刷新失败:', err);
      toast.error('刷新失败，请重试');
    }
  }, [fetchClassHistory]);

  // 历史记录页面，主要关注删除倒计时
  useAutoRefresh(handlePullRefresh, {
    interval: 300000, // 5分钟
    enabled: true,
    pauseOnHidden: true,
  });

  return (
    <PullToRefreshContainer 
      onRefresh={handlePullRefresh}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-2 sm:py-10 sm:px-4"
      disabled={loading}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-2 sm:py-10 sm:px-4">
      <div className="max-w-6xl mx-auto">
        {/* 页面头部 */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              📊 班级历史记录
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              班级：{classData?.name}
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/class/${classId}/students`)}
              className="text-xs sm:text-sm"
            >
              👥 查看学生
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/my-classes')}
              className="text-xs sm:text-sm"
            >
              👈 返回班级
            </Button>
          </div>
        </div>

        {/* 已移除学生 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md mb-8 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-700">
            <h2 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
              🗑️ 已移除学生 ({removedStudents.length})
            </h2>
            <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
              移除后30天内可恢复，30天后将永久删除
            </p>
          </div>

          {removedStudents.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              暂无已移除的学生
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      姓名
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      学号
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      移除时间
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      剩余天数
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {removedStudents.map((student, index) => {
                    const removedDate = new Date(student.removedAt);
                    const daysLeft = 30 - Math.floor((new Date() - removedDate) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <tr key={student._id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {student.name}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-mono">
                          {student.studentId}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(student.removedAt)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-sm">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            daysLeft > 7 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                              : daysLeft > 3
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                          }`}>
                            {daysLeft > 0 ? `${daysLeft}天` : '即将删除'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-sm">
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => showConfirmation({
                                type: 'restore',
                                studentId: student.studentId,
                                title: '确认恢复学生',
                                message: `确定要恢复学生 ${student.name}(${student.studentId}) 吗？`
                              })}
                              className="text-xs"
                            >
                              🔄 恢复
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => showConfirmation({
                                type: 'permanent_delete',
                                studentId: student.studentId,
                                title: '确认永久删除',
                                message: `确定要永久删除学生 ${student.name}(${student.studentId}) 吗？此操作不可恢复！`
                              })}
                              className="text-xs"
                            >
                              🗑️ 永久删除
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 编辑历史 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700">
            <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
              📝 编辑历史 ({editHistory.length})
            </h2>
          </div>

          {editHistory.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              暂无编辑历史
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
              {editHistory.map((record, index) => (
                <div key={index} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                          {getActionText(record.action)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(record.editedAt)}
                        </span>
                      </div>
                      {record.details && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {record.details.modifiedCount && (
                            <span>修改了 {record.details.modifiedCount} 名学生</span>
                          )}
                          {record.details.addedCount && (
                            <span>添加了 {record.details.addedCount} 名学生</span>
                          )}
                          {record.details.removedCount && (
                            <span>移除了 {record.details.removedCount} 名学生</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 消息提示 */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-lg max-w-sm ${
                message.startsWith('✅') 
                  ? 'bg-green-500 text-white' 
                  : 'bg-red-500 text-white'
              }`}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 确认模态框 */}
        <AnimatePresence>
          {showConfirmModal && pendingAction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={(e) => e.target === e.currentTarget && setShowConfirmModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
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
                    variant={pendingAction.type === 'permanent_delete' ? 'danger' : 'primary'}
                    onClick={executeAction}
                  >
                    确认
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </PullToRefreshContainer>
  );
};

export default ClassHistory;