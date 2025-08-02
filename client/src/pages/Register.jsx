// client/src/pages/Register.jsx

import { useState } from 'react';
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // 默认学生
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('/auth/register', {
        email,
        password,
        role,
      });
      alert('注册成功，请登录');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '注册失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8 sm:p-10 transition-colors duration-300">
        <h1 className="text-3xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-6">创建账号</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600
                        bg-white/70 dark:bg-gray-700/60 backdrop-blur-md
                        text-gray-900 dark:text-gray-100 shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                        hover:shadow-md hover:scale-[1.01] transition-all duration-200"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              id="password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600
                        bg-white/70 dark:bg-gray-700/60 backdrop-blur-md
                        text-gray-900 dark:text-gray-100 shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                        hover:shadow-md hover:scale-[1.01] transition-all duration-200"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              身份
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600
                        bg-white/70 dark:bg-gray-700/60 backdrop-blur-md
                        text-gray-900 dark:text-gray-100 shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                        hover:shadow-md hover:scale-[1.01] transition-all duration-200"
            >
              <option value="student">学生</option>
              <option value="teacher">教师</option>
            </select>
          </div>

          {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl font-medium
                      bg-gradient-to-r from-blue-500/80 to-purple-500/80
                      text-white shadow-md backdrop-blur-md
                      hover:from-blue-500 hover:to-purple-500 hover:shadow-lg hover:scale-[1.02]
                      active:scale-95 transition-all duration-200"
          >
            注册
          </button>


        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          已有账号？
          <a href="/" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
            去登录
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
