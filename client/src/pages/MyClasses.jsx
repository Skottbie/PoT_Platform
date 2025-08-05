// src/pages/MyClasses.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';
import Button from '../components/Button';

const MyClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/class/my-classes');
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* 顶部导航 */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
            📚 我的班级
          </h1>

          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/teacher')}
              className="text-xs sm:text-sm px-2 sm:px-4"
            >
              <span className="hidden sm:inline">👈 返回仪表盘</span>
              <span className="sm:hidden">👈 仪表盘</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/create-class')}
              className="text-xs sm:text-sm px-2 sm:px-4"
            >
              <span className="hidden sm:inline">➕ 创建新班级</span>
              <span className="sm:hidden">➕ 创建</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600 dark:text-gray-300">加载中...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : classes.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">你还没有创建任何班级。</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {classes.map((cls) => {
              // 计算班级统计
              const activeStudents = cls.studentList?.filter(s => !s.isRemoved) || [];
              const joinedStudents = activeStudents.filter(s => s.userId);
              
              return (
                <div
                  key={cls._id}
                  className="p-6 rounded-2xl 
                            bg-white/70 dark:bg-gray-800/60
                            border border-gray-200/50 dark:border-gray-700/50
                            shadow-md backdrop-blur-md
                            hover:shadow-xl hover:scale-[1.01] transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-lg font-bold text-blue-700 dark:text-blue-400">
                      {cls.name}
                    </h2>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(cls.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {cls.description && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                      {cls.description}
                    </p>
                  )}

                  {/* 班级统计 */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {activeStudents.length}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        总学生数
                      </div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {joinedStudents.length}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        已加入
                      </div>
                    </div>
                  </div>

                  {/* 邀请码 */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">班级邀请码</p>
                      <span className="font-mono text-sm font-medium text-gray-800 dark:text-gray-100">
                        {cls.inviteCode}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(cls.inviteCode)}
                    >
                      📋 复制
                    </Button>
                  </div>

                  {/* 操作按钮 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/class/${cls._id}/students`)}
                      className="text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">👥 查看学生</span>
                      <span className="sm:hidden">👥 学生</span>
                    </Button>
                    
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/class/${cls._id}/edit-students`)}
                      className="text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">✏️ 编辑学生</span>
                      <span className="sm:hidden">✏️ 编辑</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/class/${cls._id}/history`)}
                      className="text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">✂️ 编辑历史</span>
                      <span className="sm:hidden">✂️ 历史</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyClasses;