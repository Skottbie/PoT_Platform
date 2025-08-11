// src/pages/Login.jsx - 优化设计版本
import { useState, useCallback, useMemo, useEffect } from 'react';
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import ProgressiveLogo from '../components/ProgressiveLogo';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
    error: '',
    loading: false
  });
  
  const navigate = useNavigate();

  // 检测是否为移动端
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 页面加载时检查是否已登录
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get('/user/profile');
          const role = res.data.role;
          navigate(role === 'teacher' ? '/teacher' : '/student');
        } catch (error) {
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
      error: ''
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
      
      const expiresAt = Date.now() + (expiresIn * 1000);
      localStorage.setItem('tokenExpiresAt', expiresAt.toString());

      if (role === 'teacher') {
        axios.get('/user/profile').catch(() => {});
        axios.get('/task/mine?category=active').catch(() => {});
        navigate('/teacher');
      } else {
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
    size: isMobile ? "lg" : "md", // 移动端使用大尺寸，桌面端使用中等尺寸
    fullWidth: true,
    loading: formData.loading,
    disabled: !formData.email || !formData.password
  }), [formData.loading, formData.email, formData.password, isMobile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        className={`w-full ${isMobile ? 'max-w-sm' : 'max-w-md'}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo和标题区域 - 重新设计*/}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              {/* Logo容器 - 去除边框，添加微妙的发光效果 */}
              <div className="relative p-1">
                <ProgressiveLogo
                  size={isMobile ? "large" : "large"}
                  className="w-16 h-16 sm:w-20 sm:h-20 
                            drop-shadow-2xl
                            hover:scale-110 hover:drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]
                            transition-all duration-500 ease-out
                            filter hover:brightness-110"
                  priority={true}
                />
                {/* 背景光晕效果 */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 
                                rounded-full blur-xl scale-150 opacity-0 
                                group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
            
            {/* 标题区域 - 更现代的排版 */}
            <div className="ml-4 text-left">
              <h1 className="text-3xl sm:text-4xl font-extrabold 
                            bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 
                            bg-clip-text text-transparent 
                            tracking-tight leading-tight
                            animate-gradient-slide">
                PoTAcademy
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 
                            font-medium tracking-wide mt-1
                            bg-gradient-to-r from-gray-600 to-gray-500 dark:from-gray-400 dark:to-gray-500
                            bg-clip-text text-transparent">
                AI时代教学新范式
              </p>
            </div>
          </div>
          
          {/* 可选：添加装饰性元素 */}
          <div className="flex justify-center items-center space-x-2 opacity-60">
            <div className="w-8 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-8 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
          </div>
        </motion.div>

        {/* 登录卡片 */}
        <motion.div
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 sm:p-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <input
                type="email"
                name="email"
                placeholder="邮箱"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="username"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600
                          bg-gray-50/50 dark:bg-gray-700/50
                          text-gray-900 dark:text-gray-100
                          placeholder-gray-500 dark:placeholder-gray-400
                          shadow-sm backdrop-blur-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          transition-all duration-200
                          text-base"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <input
                type="password"
                name="password"
                placeholder="密码"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600
                          bg-gray-50/50 dark:bg-gray-700/50
                          text-gray-900 dark:text-gray-100
                          placeholder-gray-500 dark:placeholder-gray-400
                          shadow-sm backdrop-blur-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          transition-all duration-200
                          text-base"
              />
            </motion.div>

            <motion.div
              className="flex items-center justify-between"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 
                            focus:ring-blue-500 focus:ring-2 focus:ring-offset-0"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  记住我 (30天)
                </span>
              </label>
            </motion.div>

            {formData.error && (
              <motion.div
                className="text-red-500 dark:text-red-400 text-sm text-center
                          bg-red-50/50 dark:bg-red-900/20 
                          rounded-xl py-3 px-4 border border-red-200 dark:border-red-800"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {formData.error}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button {...buttonProps}>
                {formData.loading ? '登录中...' : '登录'}
              </Button>
            </motion.div>
          </form>

          <motion.div
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <span className="text-sm text-gray-600 dark:text-gray-400">
              没有账号？
            </span>
            <a
              href="/register"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline ml-1 font-medium"
            >
              立即注册
            </a>
          </motion.div>
        </motion.div>

        {/* 安全提示 */}
        <motion.div
          className="mt-6 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <p className="text-xs text-blue-700 dark:text-blue-300 text-center leading-relaxed">
            💡 勾选"记住我"将在30天内保持登录状态<br />
            请在私人设备上使用此功能
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;