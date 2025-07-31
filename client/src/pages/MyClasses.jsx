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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📚 我的班级</h1>

          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/teacher')}
              className="bg-gray-300 text-gray-800 py-2 px-4 rounded-xl shadow hover:bg-gray-400 transition"
            >
              👈 返回仪表盘
            </button>

            <button
              onClick={() => navigate('/create-class')}
              className="bg-blue-600 text-white py-2 px-4 rounded-xl shadow hover:bg-blue-700 transition"
            >
              ➕ 创建新班级
            </button>
          </div>
        </div>

        {loading ? (
          <p>加载中...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : classes.length === 0 ? (
          <p className="text-gray-600">你还没有创建任何班级。</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {classes.map((cls) => (
              <div
                key={cls._id}
                className="bg-white p-5 rounded-2xl shadow hover:shadow-md transition"
              >
                <h2 className="text-lg font-bold text-blue-700">{cls.name}</h2>
                {cls.description && (
                  <p className="text-gray-600 text-sm mt-1">{cls.description}</p>
                )}
                <p className="text-sm mt-2">
                  👥 学生人数：{cls.studentList.length}
                </p>
                <p className="text-sm mt-1">
                  🔑 邀请码：
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {cls.inviteCode}
                  </span>
                  <button
                    onClick={() => handleCopy(cls.inviteCode)}
                    className="ml-2 text-blue-500 hover:underline text-xs"
                  >
                    复制
                  </button>
                </p>

                <button
                  onClick={() => navigate(`/class/${cls._id}/students`)}
                  className="mt-4 w-full text-sm bg-gray-100 hover:bg-gray-200 rounded-lg py-2 transition"
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
