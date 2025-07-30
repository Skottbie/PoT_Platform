import { useState } from 'react';
import api from '../api/axiosInstance'; // 👈 你的axios封装
import { useNavigate } from 'react-router-dom';

const StudentJoinClass = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    studentId: '',
    inviteCode: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await api.post('/student/join-class', form);
      setMessage(`✅ 加入成功！欢迎加入 ${res.data.className}`);
      setTimeout(() => navigate('/student/dashboard'), 2000); // 你可以改目标页
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || '❌ 加入失败，请检查填写信息'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">👥 加入班级</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">姓名 *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">学号 *</label>
            <input
              type="text"
              name="studentId"
              value={form.studentId}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">班级邀请码 *</label>
            <input
              type="text"
              name="inviteCode"
              value={form.inviteCode}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded-lg uppercase"
              placeholder="如 ABC123"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-xl shadow hover:bg-blue-700 transition-all"
          >
            ✅ 加入班级
          </button>

          {message && (
            <p
              className={`text-sm mt-2 ${
                message.startsWith('✅') ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default StudentJoinClass;
