import { useState } from 'react';
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/auth/login', { email, password });
      const { token, role } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      if (role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(err.response?.data?.message || '登录失败');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 transition-colors duration-300">
        <h2 className="text-3xl font-semibold text-center mb-6 text-gray-900 dark:text-gray-100">
          欢迎回来
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input input-bordered w-full rounded-xl 
                       bg-white text-gray-900
                       dark:bg-gray-700 dark:text-gray-100
                       dark:border-gray-600 transition-colors duration-300"
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input input-bordered w-full rounded-xl 
                       bg-white text-gray-900
                       dark:bg-gray-700 dark:text-gray-100
                       dark:border-gray-600 transition-colors duration-300"
          />
          {error && (
            <p className="text-red-500 dark:text-red-400 text-sm text-center">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn btn-neutral w-full rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            登录
          </button>
        </form>

        <div className="text-sm text-center mt-4 text-gray-600 dark:text-gray-400">
          没有账号？
          <a
            href="/register"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            去注册
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
