// src/pages/JoinClass.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

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
          navigate('/'); // 成功后跳转主页或学生班级页
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">🔑 加入班级</h1>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {successMsg && <p className="text-green-600 text-sm mb-4">{successMsg}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="inviteCode"
            placeholder="邀请码"
            value={formData.inviteCode}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
          <input
            type="text"
            name="studentId"
            placeholder="学号"
            value={formData.studentId}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
          <input
            type="text"
            name="name"
            placeholder="姓名"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? '正在提交...' : '加入班级'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinClass;
