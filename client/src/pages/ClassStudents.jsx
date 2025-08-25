// src/pages/ClassStudents.jsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  BarChart3, 
  Edit, 
  ArrowLeft, 
  Plus, 
  Lightbulb 
} from 'lucide-react';
import api from '../api/axiosInstance';
import Button from '../components/Button'; 
import PullToRefreshContainer from '../components/PullToRefreshContainer';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { useCallback } from 'react';
import toast from 'react-hot-toast';

const ClassStudents = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [className, setClassName] = useState('');
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClass = async () => {
      try {
        const res = await api.get(`/class/${classId}`);
        if (res.data.success) {
          const cls = res.data.class;
          setClassData(cls);
          setClassName(cls.name);
          // 只显示未被软删除的学生
          const activeStudents = cls.studentList?.filter(s => !s.isRemoved) || [];
          setStudents(activeStudents);
        } else {
          setError(res.data.message || '获取班级失败');
        }
      } catch (err) {
        console.error('获取班级失败:', err);
        setError('网络错误或服务器异常');
      } finally {
        setLoading(false);
      }
    };

    fetchClass();
  }, [classId]);

  // 检查是否是班级创建者
  const isClassOwner = () => {
    const userRole = localStorage.getItem('role');
    return userRole === 'teacher' && classData;
  };

  // 计算统计数据
  const getStatistics = () => {
    const total = students.length;
    const joined = students.filter(s => s.userId).length;
    const pending = total - joined;
    const joinRate = total > 0 ? Math.round((joined / total) * 100) : 0;
    
    return { total, joined, pending, joinRate };
  };

  const stats = getStatistics();

  const handlePullRefresh = useCallback(async () => {
    try {
      const res = await api.get(`/class/${classId}`);
      if (res.data.success) {
        const cls = res.data.class;
        setClassData(cls);
        const activeStudents = cls.studentList?.filter(s => !s.isRemoved) || [];
        setStudents(activeStudents);
        toast.success('刷新成功');
      }
    } catch (err) {
      console.error('刷新失败:', err);
      toast.error('刷新失败，请重试');
    }
  }, [classId]);

  // 🔕 静默自动刷新函数
  const handleSilentRefresh = useCallback(async () => {
    try {
      const res = await api.get(`/class/${classId}`);
      if (res.data.success) {
        const cls = res.data.class;
        setClassData(cls);
        const activeStudents = cls.studentList?.filter(s => !s.isRemoved) || [];
        setStudents(activeStudents);
      }
    } catch (error) {
      console.error('静默刷新失败:', error);
    }
  }, [classId]);

  // ⏰ 自动定时刷新（使用静默函数）
  useAutoRefresh(handleSilentRefresh, {
    interval: 90000, // 90秒
    enabled: true,
    pauseOnHidden: true,
  });

  // 动画变量
  const pageVariants = {
    initial: { 
      opacity: 0, 
      y: 20 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const headerVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.4,
        delay: 0.1
      }
    }
  };

  const statsContainerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.3,
        delay: 0.2,
        staggerChildren: 0.1
      }
    }
  };

  const statsCardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  const tableVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        delay: 0.3
      }
    }
  };

  const helpVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        delay: 0.4
      }
    }
  };

  // 骨架屏组件
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2 animate-pulse"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
      </div>
    </div>
  );

  return (
    <PullToRefreshContainer 
      onRefresh={handlePullRefresh}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6"
      disabled={loading}
    >
      <motion.div 
        className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6"
        variants={pageVariants}
        initial="initial"
        animate="animate"
      >
        <div className="max-w-6xl mx-auto">
          {/* 顶部标题 + 操作按钮 */}
          <motion.div 
            className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6"
            variants={headerVariants}
          >
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                班级学生
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <span><strong>班级：</strong>{className}</span>
                <span><strong>总数：</strong>{stats.total}</span>
                <span><strong>已加入：</strong>{stats.joined}</span>
                <span><strong>加入率：</strong>{stats.joinRate}%</span>
              </div>
            </div>
            
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              {isClassOwner() && (
                <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/my-classes')}
                className="text-xs sm:text-sm px-2 sm:px-4"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">返回班级列表</span>
                <span className="sm:hidden">返回班级列表</span>
              </Button>
              )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/class/${classId}/edit-students`)}
                  className="text-xs sm:text-sm px-2 sm:px-4"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">编辑学生</span>
                  <span className="sm:hidden">编辑学生</span>
                </Button>
            </div>
          </motion.div>

          {/* 统计卡片 */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
            variants={statsContainerVariants}
          >
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow"
              variants={statsCardVariants}
              whileHover={{ y: -2 }}
            >
              {loading ? (
                <SkeletonCard />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">总学生数</p>
                    <motion.p 
                      className="text-2xl font-bold text-gray-800 dark:text-gray-100"
                      initial={{ scale: 1 }}
                      animate={{ scale: 1 }}
                      key={stats.total}
                    >
                      {stats.total}
                    </motion.p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow"
              variants={statsCardVariants}
              whileHover={{ y: -2 }}
            >
              {loading ? (
                <SkeletonCard />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">已加入</p>
                    <motion.p 
                      className="text-2xl font-bold text-green-600 dark:text-green-400"
                      key={stats.joined}
                    >
                      {stats.joined}
                    </motion.p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow"
              variants={statsCardVariants}
              whileHover={{ y: -2 }}
            >
              {loading ? (
                <SkeletonCard />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">待加入</p>
                    <motion.p 
                      className="text-2xl font-bold text-orange-600 dark:text-orange-400"
                      key={stats.pending}
                    >
                      {stats.pending}
                    </motion.p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow"
              variants={statsCardVariants}
              whileHover={{ y: -2 }}
            >
              {loading ? (
                <SkeletonCard />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">加入率</p>
                    <motion.p 
                      className="text-2xl font-bold text-purple-600 dark:text-purple-400"
                      key={stats.joinRate}
                    >
                      {stats.joinRate}%
                    </motion.p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* 学生列表 */}
          <AnimatePresence>
            {loading ? (
              <motion.div 
                className="text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <motion.div 
                    className="w-2 h-2 bg-blue-600 rounded-full"
                    animate={{ y: [-10, 0, -10] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                  />
                  <motion.div 
                    className="w-2 h-2 bg-blue-600 rounded-full"
                    animate={{ y: [-10, 0, -10] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                  />
                  <motion.div 
                    className="w-2 h-2 bg-blue-600 rounded-full"
                    animate={{ y: [-10, 0, -10] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                  />
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-4">加载中...</p>
              </motion.div>
            ) : error ? (
              <motion.div 
                className="text-center py-8"
                variants={tableVariants}
              >
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-500">{error}</p>
              </motion.div>
            ) : (
              <motion.div 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
                variants={tableVariants}
              >
                {/* 表格头部 */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    学生列表
                  </h2>
                </div>

                {students.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <Users className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">班级中暂无学生</p>
                    {isClassOwner() && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/class/${classId}/edit-students`)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        添加学生
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            序号
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            姓名
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            学号
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            加入状态
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            加入时间
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:border-gray-600">
                        {students.map((student, index) => (
                          <motion.tr
                            key={student._id || index}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                              !student.userId ? 
                              "bg-red-50/30 dark:bg-red-900/10" : ""
                            }`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {student.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                                {student.studentId}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {student.userId ? (
                                <motion.span 
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                                  initial={{ scale: 0.9 }}
                                  animate={{ scale: 1 }}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  已加入
                                </motion.span>
                              ) : (
                                <motion.span 
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                                  initial={{ scale: 0.9 }}
                                  animate={{ scale: 1 }}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  未加入
                                </motion.span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {student.joinedAt ? (
                                <div>
                                  <div>{new Date(student.joinedAt).toLocaleDateString()}</div>
                                  <div className="text-xs text-gray-400">
                                    {new Date(student.joinedAt).toLocaleTimeString()}
                                  </div>
                                </div>
                              ) : (
                                '-'
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 帮助信息 */}
          <AnimatePresence>
            {isClassOwner() && students.length > 0 && stats.pending > 0 && (
              <motion.div 
                className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4"
                variants={helpVariants}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <h3 className="text-blue-800 dark:text-blue-200 font-medium mb-2 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  温馨提示
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  还有 {stats.pending} 名学生未加入班级。请将班级邀请码 <strong>{classData?.inviteCode}</strong> 分享给学生，
                  让他们使用自己的姓名和学号加入班级。
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </PullToRefreshContainer>
  );
};

export default ClassStudents;