// src/pages/MyClasses.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

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
        <div className="
          flex justify-between items-center mb-6 
          text-base sm:text-lg md:text-xl
          whitespace-nowrap overflow-hidden
        ">
          <h1 className="font-bold text-gray-800 dark:text-gray-100 truncate">
            📚 我的班级
          </h1>

          <div className="flex space-x-2 sm:space-x-3 shrink-0">
            <button
              onClick={() => navigate('/teacher')}
              className="px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm md:text-base rounded-xl
                        bg-white/60 dark:bg-gray-700/60
                        border border-gray-300/40 dark:border-gray-600/40
                        text-gray-800 dark:text-gray-100 shadow-sm backdrop-blur-md
                        hover:bg-white/80 dark:hover:bg-gray-700/80 hover:shadow-md hover:scale-[1.02]
                        active:scale-95 transition-all duration-200"
            >
              👈 返回仪表盘
            </button>

            <button
              onClick={() => navigate('/create-class')}
              className="px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm md:text-base rounded-xl
                        bg-gradient-to-r from-blue-500/80 to-purple-500/80
                        text-white shadow-md backdrop-blur-md
                        hover:from-blue-500 hover:to-purple-500 hover:shadow-lg hover:scale-[1.02]
                        active:scale-95 transition-all duration-200"
            >
              ➕ 创建新班级
            </button>

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
            {classes.map((cls) => (
              <div
                key={cls._id}
                className="p-5 rounded-2xl 
                          bg-white/70 dark:bg-gray-800/60
                          border border-gray-200/50 dark:border-gray-700/50
                          shadow-md backdrop-blur-md
                          hover:shadow-xl hover:scale-[1.01] transition-all duration-200"
              >

                <h2 className="text-lg font-bold text-blue-700 dark:text-blue-400">
                  {cls.name}
                </h2>

                {cls.description && (
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                    {cls.description}
                  </p>
                )}

                <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">
                  👥 学生人数：{cls.studentList.length}
                </p>

                <p className="text-sm mt-1 text-gray-700 dark:text-gray-300 flex items-center">
                  🔑 邀请码：
                  <span className="font-mono bg-gray-100 dark:bg-gray-700 
                                  border border-gray-200 dark:border-gray-600 
                                  px-2 py-0.5 rounded ml-1">
                    {cls.inviteCode}
                  </span>
                  <button
                    onClick={() => handleCopy(cls.inviteCode)}
                    className="ml-2 text-xs text-blue-600 dark:text-blue-400 
                              hover:underline"
                  >
                    复制
                  </button>
                </p>

                <button
                  onClick={() => navigate(`/class/${cls._id}/students`)}
                  className="mt-4 w-full text-sm py-2 rounded-xl
                            bg-gradient-to-r from-blue-500/80 to-purple-500/80
                            text-white shadow-md backdrop-blur-md
                            hover:from-blue-500 hover:to-purple-500 hover:shadow-lg hover:scale-[1.02]
                            active:scale-95 transition-all duration-200"
                >
                  👀 查看学生
                </button>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>

  );
};

export default MyClasses;
