// client/src/pages/Login.jsx - 增强版本

import { useState, useCallback, useMemo, useEffect } from 'react';
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
    error: '',
    loading: false
  });
  
  const navigate = useNavigate();

  // 📌 页面加载时检查是否已登录
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // 尝试获取用户信息验证token有效性
          const res = await axios.get('/user/profile');
          const role = res.data.role;
          navigate(role === 'teacher' ? '/teacher' : '/student');
        } catch (error) {
          // token无效，清除本地存储
          localStorage.removeItem('token');
          localStorage.removeItem('role');
        }
      }
    };

    checkAuthStatus();
  }, [navigate]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value,
      error: '' // 清除错误信息
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (formData.loading) return;
    
    setFormData(prev => ({ ...prev, error: '', loading: true }));
    
    try {
      const res = await axios.post('/auth/login', {
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      });
      
      const { token, role, expiresIn } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      
      // 📌 存储token过期时间，用于前端判断
      const expiresAt = Date.now() + (expiresIn * 1000);
      localStorage.setItem('tokenExpiresAt', expiresAt.toString());

      // 📌 根据角色和记住我设置预加载策略
      if (role === 'teacher') {
        // 预加载教师仪表盘关键API
        axios.get('/user/profile').catch(() => {});
        axios.get('/task/mine?category=active').catch(() => {});
        navigate('/teacher');
      } else {
        // 预加载学生仪表盘关键API
        axios.get('/user/profile').catch(() => {});
        axios.get('/task/all?category=active').catch(() => {});
        navigate('/student');
      }
    } catch (err) {
      let errorMessage = '登录失败';
      
      if (err.response?.status === 423) {
        errorMessage = '账户已被锁定，请2小时后再试';
      } else if (err.response?.status === 401) {
        errorMessage = '邮箱或密码错误';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setFormData(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
    }
  }, [formData.email, formData.password, formData.rememberMe, formData.loading, navigate]);

  const buttonProps = useMemo(() => ({
    type: "submit",
    variant: "primary",
    size: "md",
    fullWidth: true,
    loading: formData.loading,
    disabled: !formData.email || !formData.password
  }), [formData.loading, formData.email, formData.password]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="w-full max-w-md 
                bg-white/70 dark:bg-gray-800/70
                backdrop-blur-xl rounded-3xl shadow-xl p-8
                border border-gray-200/50 dark:border-gray-700/50
                transition-all duration-300">
        <h2 className="text-3xl font-semibold text-center mb-6 text-gray-900 dark:text-gray-100">
          欢迎回来
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="邮箱"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="username"
            className="w-full px-4 py-2 rounded-xl border
                      bg-white/70 dark:bg-gray-700/70
                      text-gray-900 dark:text-gray-100
                      border-gray-300 dark:border-gray-600
                      shadow-sm backdrop-blur-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-400
                      transition"
          />

          <input
            type="password"
            name="password"
            placeholder="密码"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
            className="w-full px-4 py-2 rounded-xl border
                      bg-white/70 dark:bg-gray-700/70
                      text-gray-900 dark:text-gray-100
                      border-gray-300 dark:border-gray-600
                      shadow-sm backdrop-blur-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-400
                      transition"
          />

          {/* 📌 记住我选项 */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 shadow-sm 
                          focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                记住我 (30天)
              </span>
            </label>
          </div>

          {formData.error && (
            <div className="text-red-500 dark:text-red-400 text-sm text-center
                          bg-red-50/50 dark:bg-red-900/30 
                          rounded-lg py-2 mt-2 border border-red-200 dark:border-red-700">
              {formData.error}
            </div>
          )}

          <Button {...buttonProps}>
            {formData.loading ? '登录中...' : '登录'}
          </Button>
        </form>

        <div className="text-sm text-center mt-4 text-gray-600 dark:text-gray-400">
          没有账号？
          <a
            href="/register"
            className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
          >
            去注册
          </a>
        </div>

        {/* 📌 安全提示 */}
        <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
            💡 勾选"记住我"将在30天内保持登录状态，请在私人设备上使用
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;