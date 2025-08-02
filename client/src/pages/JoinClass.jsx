// src/pages/JoinClass.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Button from '../components/Button';

const JoinClass = () => {
  const [formData, setFormData] = useState({
    inviteCode: '',
    studentId: '',
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.post('/class/join', formData);
      if (res.data.success) {
        setSuccessMsg('🎉 加入成功！');
        setTimeout(() => {
          navigate('/student'); // 推荐跳转学生仪表盘
        }, 1500);
      } else {
        setError(res.data.message || '加入失败');
      }
    } catch (err) {
      console.error('加入班级失败:', err);
      setError(err.response?.data?.message || '网络错误或服务器异常');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-10">
      {/* 返回仪表盘按钮 */}
      <Button
        variant="secondary"
        size="sm"
        className="absolute top-6 left-6"
        onClick={() => navigate('/student')}
      >
        👈 返回仪表盘
      </Button>

      <div className="bg-white/70 dark:bg-gray-800/70
                backdrop-blur-xl p-8 rounded-2xl
                shadow-xl w-full max-w-md relative
                border border-gray-200/50 dark:border-gray-700/50
                transition-all duration-300">
        <h1 className="text-2xl font-bold text-center text-blue-700 dark:text-blue-400 mb-6">
          🔑 加入班级
        </h1>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {successMsg && <p className="text-green-600 dark:text-green-400 text-sm mb-4">{successMsg}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="inviteCode"
            placeholder="邀请码"
            value={formData.inviteCode}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-xl
                      bg-white/70 dark:bg-gray-700/70
                      border-gray-300 dark:border-gray-600
                      text-gray-900 dark:text-gray-100
                      shadow-sm backdrop-blur-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-400
                      transition"
          />
          <input
            type="text"
            name="studentId"
            placeholder="学号"
            value={formData.studentId}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-xl
                      bg-white/70 dark:bg-gray-700/70
                      border-gray-300 dark:border-gray-600
                      text-gray-900 dark:text-gray-100
                      shadow-sm backdrop-blur-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-400
                      transition"
          />
          <input
            type="text"
            name="name"
            placeholder="姓名"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-xl
                      bg-white/70 dark:bg-gray-700/70
                      border-gray-300 dark:border-gray-600
                      text-gray-900 dark:text-gray-100
                      shadow-sm backdrop-blur-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-400
                      transition"
          />

          {/* 提交按钮 */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            disabled={loading}
          >
            {loading ? '正在提交...' : '加入班级'}
          </Button>

        </form>
      </div>
    </div>
  );
};

export default JoinClass;

