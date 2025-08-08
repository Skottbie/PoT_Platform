import { useState, useCallback, useMemo } from 'react';
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const Login = () => {
  // 🚀 合并状态，减少重渲染
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    error: '',
    loading: false
  });
  
  const navigate = useNavigate();

  // 🎯 优化表单处理，使用 useCallback 避免重复创建函数
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value,
      error: '' // 清除错误信息
    }));
  }, []);

  // 🚀 优化提交处理
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (formData.loading) return; // 防止重复提交
    
    setFormData(prev => ({ ...prev, error: '', loading: true }));
    
    try {
      const res = await axios.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });
      
      const { token, role } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      // 🎯 预加载下一页资源
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
      setFormData(prev => ({
        ...prev,
        error: err.response?.data?.message || '登录失败',
        loading: false
      }));
    }
  }, [formData.email, formData.password, formData.loading, navigate]);

  // 🎯 记住按钮配置，避免每次渲染重新创建
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

          {formData.error && (
            <p className="text-red-500 dark:text-red-400 text-sm text-center
                          bg-red-50/50 dark:bg-red-900/30 
                          rounded-lg py-1 mt-2">
              {formData.error}
            </p>
          )}

          <Button {...buttonProps}>
            {formData.loading ? '登录中...' : '登录'}
          </Button>
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