// src/pages/MyClasses.jsx

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ArrowLeft, 
  Plus, 
  Users, 
  UserCheck, 
  Copy, 
  Edit3, 
  History,
  Calendar
} from 'lucide-react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import PullToRefreshContainer from '../components/PullToRefreshContainer';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { useCallback } from 'react';
import { useSandboxData } from '../hooks/useSandboxData';

const MyClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { sandboxApiGet } = useSandboxData();

  // 检测用户的动画偏好
  const prefersReducedMotion = useMemo(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
  const fetchClasses = async () => {
    try {
      // 🎭 使用沙盒API包装
      const res = await sandboxApiGet('/class/my-classes', () => api.get('/class/my-classes'));
      if (res.data.success) {
        setClasses(res.data.classes);
      } else {
        setError(res.data.message || '获取班级失败');
      }
    } catch (err) {
      console.error('❌ 获取班级失败:', err);
      setError('网络错误或服务器异常');
    } finally {
      setLoading(false);
    }
  };

    fetchClasses();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success(`邀请码已复制：${code}`);
    });
  };

  const handlePullRefresh = useCallback(async () => {
    try {
      // 🎭 使用沙盒API包装
      const res = await sandboxApiGet('/class/my-classes', () => api.get('/class/my-classes'));
      if (res.data.success) {
        setClasses(res.data.classes);
      }
      toast.success('刷新成功');
    } catch (err) {
      console.error('刷新失败:', err);
      toast.error('刷新失败，请重试');
    }
  }, [sandboxApiGet]);

  // 🔕 静默自动刷新函数
  const handleSilentRefresh = useCallback(async () => {
    try {
      // 🎭 使用沙盒API包装
      const res = await sandboxApiGet('/class/my-classes', () => api.get('/class/my-classes'));
      if (res.data.success) {
        setClasses(res.data.classes);
      }
    } catch (error) {
      console.error('静默刷新失败:', error);
    }
  }, [sandboxApiGet]);
  
  // ⏰ 自动定时刷新（使用静默函数）
  useAutoRefresh(handleSilentRefresh, {
    interval: 180000, // 3分钟
    enabled: true,
    pauseOnHidden: true,
  });

  // 骨架屏组件
  const SkeletonCard = () => (
    <div className="p-6 rounded-3xl bg-white/70 dark:bg-gray-800/60 
                    border border-gray-200/50 dark:border-gray-700/50
                    shadow-sm backdrop-blur-sm">
      {/* 标题骨架 */}
      <div className="flex justify-between items-start mb-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
      </div>
      
      {/* 描述骨架 */}
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3 animate-pulse"></div>
      
      {/* 统计骨架 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded mb-1 animate-pulse"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded mb-1 animate-pulse"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12 animate-pulse"></div>
        </div>
      </div>
      
      {/* 邀请码骨架 */}
      <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg mb-4">
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16 mb-1 animate-pulse"></div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 animate-pulse"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
        </div>
      </div>
      
      {/* 按钮骨架 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
      </div>
    </div>
  );

  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.4,
        ease: "easeOut",
        staggerChildren: prefersReducedMotion ? 0 : 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20, scale: prefersReducedMotion ? 1 : 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.4,
        ease: "easeOut"
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 30, scale: prefersReducedMotion ? 1 : 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <PullToRefreshContainer 
      onRefresh={handlePullRefresh}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4"
      disabled={loading}
    >
      <motion.div 
        className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-5xl mx-auto">
          {/* 顶部导航 */}
          <motion.div 
            className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8"
            variants={itemVariants}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                我的班级
              </h1>
            </div>

            <div className="flex gap-3 flex-shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/teacher')}
                className="flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">返回仪表盘</span>
                <span className="sm:hidden">返回仪表盘</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/create-class')}
                className="flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">创建新班级</span>
                <span className="sm:hidden">创建新班级</span>
              </Button>
            </div>
          </motion.div>

          {/* 内容区域 */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                className="grid md:grid-cols-2 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
              >
                {[...Array(4)].map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                className="text-center py-12"
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-red-500 dark:text-red-400" />
                </div>
                <p className="text-red-500 text-lg">{error}</p>
              </motion.div>
            ) : classes.length === 0 ? (
              <motion.div
                key="empty"
                className="text-center py-16"
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
              >
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                  您还没有创建任何班级
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/create-class')}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  创建第一个班级
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                className="grid md:grid-cols-2 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {classes.map((cls, index) => {
                  // 计算班级统计
                  const activeStudents = cls.studentList?.filter(s => !s.isRemoved) || [];
                  const joinedStudents = activeStudents.filter(s => s.userId);
                  
                  return (
                    <motion.div
                      key={cls._id}
                      variants={cardVariants}
                      custom={index}
                      className="group p-6 rounded-3xl 
                                bg-white/80 dark:bg-gray-800/70
                                border border-gray-200/60 dark:border-gray-700/60
                                shadow-lg backdrop-blur-sm
                                hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 
                                hover:scale-[1.02] transition-all duration-300 ease-out
                                hover:border-gray-300/60 dark:hover:border-gray-600/60"
                    >
                      {/* 标题区域 */}
                      <div className="flex justify-between items-start mb-5">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 
                                       group-hover:text-blue-700 dark:group-hover:text-blue-400 
                                       transition-colors duration-200">
                          {cls.name}
                        </h2>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(cls.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* 描述 */}
                      {cls.description && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
                          {cls.description}
                        </p>
                      )}

                      {/* 班级统计 */}
                      <div className="grid grid-cols-2 gap-4 mb-5">
                        <div className="text-center p-4 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl 
                                        border border-gray-100 dark:border-gray-600/50">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                              {activeStudents.length}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            总学生数
                          </div>
                        </div>
                        <div className="text-center p-4 bg-green-50/80 dark:bg-green-900/30 rounded-xl 
                                        border border-green-100 dark:border-green-700/50">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-lg font-semibold text-green-700 dark:text-green-400">
                              {joinedStudents.length}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            已加入
                          </div>
                        </div>
                      </div>

                      {/* 邀请码 */}
                      <div className="flex items-center justify-between mb-5 p-4 
                                      bg-gray-50/80 dark:bg-gray-700/50 rounded-xl 
                                      border border-gray-100 dark:border-gray-600/50">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">
                            班级邀请码
                          </p>
                          <span className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-100 
                                           tracking-wider bg-gray-100 dark:bg-gray-600/50 px-2 py-1 rounded-md">
                            {cls.inviteCode}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(cls.inviteCode)}
                          className="ml-3 p-2 hover:bg-gray-200/70 dark:hover:bg-gray-600/50 
                                     hover:scale-105 transition-all duration-200"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* 操作按钮 */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/class/${cls._id}/students`)}
                          className="flex items-center justify-center gap-2 text-xs sm:text-sm py-2.5 
                                     hover:scale-[1.02] transition-transform duration-200"
                        >
                          <Users className="w-4 h-4" />
                          <span className="hidden sm:inline">查看学生</span>
                          <span className="sm:hidden">查看学生</span>
                        </Button>
                        
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/class/${cls._id}/edit-students`)}
                          className="flex items-center justify-center gap-2 text-xs sm:text-sm py-2.5
                                     hover:scale-[1.02] transition-transform duration-200"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span className="hidden sm:inline">编辑学生</span>
                          <span className="sm:hidden">编辑学生</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/class/${cls._id}/history`)}
                          className="flex items-center justify-center gap-2 text-xs sm:text-sm py-2.5
                                     hover:scale-[1.02] transition-transform duration-200"
                        >
                          <History className="w-4 h-4" />
                          <span className="hidden sm:inline">编辑历史</span>
                          <span className="sm:hidden">编辑历史</span>
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </PullToRefreshContainer>
  );
};

export default MyClasses;