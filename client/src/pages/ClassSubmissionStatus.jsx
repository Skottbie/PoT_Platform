// client/src/pages/ClassSubmissionStatus.jsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Button from '../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import PullToRefreshContainer from '../components/PullToRefreshContainer';
import useAutoRefresh from '../hooks/useAutoRefresh';
import toast from 'react-hot-toast';

const ClassSubmissionStatus = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [expandedClasses, setExpandedClasses] = useState(new Set());

  // 🔧 核心数据获取函数
  const fetchClassStatus = useCallback(async () => {
    try {
      const res = await api.get(`/task/${taskId}/class-status`);
      setData(res.data);
    } catch (err) {
      console.error('获取班级提交情况失败:', err);
      navigate('/teacher');
    } finally {
      setLoading(false);
    }
  }, [taskId, navigate]);

  useEffect(() => {
    fetchClassStatus();
  }, [fetchClassStatus]);

  // 🔧 修复：下拉刷新专用函数（包含toast）
  const handlePullRefresh = useCallback(async () => {
    try {
      const res = await api.get(`/task/${taskId}/class-status`);
      setData(res.data);
      toast.success('刷新成功');
    } catch (err) {
      console.error('刷新失败:', err);
      toast.error('刷新失败，请重试');
    }
  }, [taskId]);

  // 🔧 修复：自动刷新专用函数（静默，无toast）
  const handleAutoRefresh = useCallback(async () => {
    try {
      const res = await api.get(`/task/${taskId}/class-status`);
      setData(res.data);
    } catch (err) {
      console.error('自动刷新失败:', err);
    }
  }, [taskId]);

  // 🔧 使用独立的自动刷新函数
  useAutoRefresh(handleAutoRefresh, {
    interval: 45000,
    enabled: true,
    pauseOnHidden: true,
  });

  const toggleClassExpand = (classId) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classId)) {
      newExpanded.delete(classId);
    } else {
      newExpanded.add(classId);
    }
    setExpandedClasses(newExpanded);
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

  const formatSubmissionTime = (submittedAt) => {
    const date = new Date(submittedAt);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLateTime = (lateMinutes) => {
    if (lateMinutes < 60) {
      return `逾期 ${lateMinutes} 分钟`;
    } else if (lateMinutes < 1440) {
      const hours = Math.floor(lateMinutes / 60);
      const minutes = lateMinutes % 60;
      return `逾期 ${hours} 小时${minutes > 0 ? ` ${minutes} 分钟` : ''}`;
    } else {
      const days = Math.floor(lateMinutes / 1440);
      const hours = Math.floor((lateMinutes % 1440) / 60);
      return `逾期 ${days} 天${hours > 0 ? ` ${hours} 小时` : ''}`;
    }
  };

  const getStatusColor = (student) => {
    if (!student.hasJoined) {
      return 'text-gray-500 dark:text-gray-400';
    }
    if (!student.submitted) {
      return 'text-red-600 dark:text-red-400';
    }
    if (student.isLateSubmission) {
      return 'text-orange-600 dark:text-orange-400';
    }
    return 'text-green-600 dark:text-green-400';
  };

  const getStatusText = (student) => {
    if (!student.hasJoined) {
      return '未加入';
    }
    if (!student.submitted) {
      return '未提交';
    }
    if (student.isLateSubmission) {
      return '逾期提交';
    }
    return '已提交';
  };

  const getSubmissionRate = (classData) => {
    if (classData.joinedStudents === 0) return 0;
    return Math.round((classData.submittedStudents / classData.joinedStudents) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-gray-500 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-red-500">加载失败</p>
        </div>
      </div>
    );
  }

  return (
    <PullToRefreshContainer 
      onRefresh={handlePullRefresh}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4"
      disabled={loading}
    >
      <div className="max-w-6xl mx-auto">
        {/* 页面头部 */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              📊 班级提交情况
            </h1>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p><strong>任务：</strong>{data.task.title}</p>
              <p><strong>截止时间：</strong>{formatDeadline(data.task.deadline)}</p>
              <p><strong>逾期提交：</strong>{data.task.allowLateSubmission ? '允许' : '不允许'}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate('/teacher')}
          >
            👈 返回教师首页
          </Button>
        </div>

        {/* 总览统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {data.classStatus.map((classData) => (
            <div key={classData.classId} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
              <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2 truncate">
                {classData.className}
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">总人数：</span>
                  <span className="font-medium">{classData.totalStudents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">已加入：</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {classData.joinedStudents}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">已提交：</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {classData.submittedStudents}
                  </span>
                </div>
                {classData.lateSubmissions > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">逾期：</span>
                    <span className="font-medium text-orange-600 dark:text-orange-400">
                      {classData.lateSubmissions}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">提交率：</span>
                    <span className={`font-bold ${
                      getSubmissionRate(classData) >= 80 
                        ? 'text-green-600 dark:text-green-400'
                        : getSubmissionRate(classData) >= 60
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {getSubmissionRate(classData)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        getSubmissionRate(classData) >= 80 
                          ? 'bg-green-500'
                          : getSubmissionRate(classData) >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${getSubmissionRate(classData)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 详细班级列表 */}
        <div className="space-y-6">
          {data.classStatus.map((classData) => (
            <motion.div
              key={classData.classId}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* 班级头部 */}
              <div 
                className="p-4 bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => toggleClassExpand(classData.classId)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      📚 {classData.className}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({classData.submittedStudents}/{classData.joinedStudents} 已提交)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${
                      getSubmissionRate(classData) >= 80 
                        ? 'text-green-600 dark:text-green-400'
                        : getSubmissionRate(classData) >= 60
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {getSubmissionRate(classData)}%
                    </span>
                    <motion.div
                      animate={{ rotate: expandedClasses.has(classData.classId) ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      ▼
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* 学生详细列表 */}
              <AnimatePresence>
                {expandedClasses.has(classData.classId) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4">
                      {/* 表格头部 */}
                      <div className="grid grid-cols-6 gap-4 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400">
                        <div>学号</div>
                        <div>姓名</div>
                        <div>加入状态</div>
                        <div>提交状态</div>
                        <div>提交时间</div>
                        <div>备注</div>
                      </div>

                      {/* 学生列表 */}
                      <div className="space-y-2">
                        {classData.students.map((student, index) => (
                          <motion.div
                            key={student.studentId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="grid grid-cols-6 gap-4 py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-sm"
                          >
                            <div className="font-mono">{student.studentId}</div>
                            <div className="font-medium">{student.name}</div>
                            <div className={student.hasJoined ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                              {student.hasJoined ? '✅ 已加入' : '❌ 未加入'}
                            </div>
                            <div className={getStatusColor(student)}>
                              {getStatusText(student)}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              {student.submitted ? formatSubmissionTime(student.submittedAt) : '-'}
                            </div>
                            <div className="text-xs">
                              {student.isLateSubmission && (
                                <span className="text-orange-600 dark:text-orange-400">
                                  {formatLateTime(student.lateMinutes)}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {classData.students.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          该班级暂无学生
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {data.classStatus.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              该任务未关联任何班级
            </p>
          </div>
        )}
      </div>
    </PullToRefreshContainer>
  );
};

export default ClassSubmissionStatus;