// client/src/components/ProtectedLayout.jsx - 配合修复版本
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import ResponsiveNavbar from './ResponsiveNavbar';
import Button from './Button';
import { useTheme } from '../contexts/ThemeContext';

const ProtectedLayout = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { syncUserTheme } = useTheme();

  const clearAuthAndRedirect = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('tokenExpiresAt');
    navigate('/', { replace: true });
  }, [navigate]);

  const fetchUser = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/user/profile');
      const userData = res.data;
      setUser(userData);
      
      if (userData.preferences?.theme) {
        syncUserTheme(userData.preferences.theme);
      }
    } catch (err) {
      console.error('获取用户信息失败:', err);
      
      if (err.response?.status === 401) {
        // 🎯 立即处理401错误，不再等待
        setError('登录已过期，正在跳转到登录页...');
        // 减少延迟，立即跳转
        setTimeout(clearAuthAndRedirect, 500);
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        // 超时错误
        setError('网络连接超时，请检查网络后重试');
      } else {
        // 其他网络错误
        setError('网络连接失败，请检查网络后重试');
      }
    } finally {
      setLoading(false);
    }
  }, [clearAuthAndRedirect, syncUserTheme]);

  const handleUserUpdate = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      clearAuthAndRedirect();
      return;
    }

    fetchUser();

    // 🔧 修复：增加超时时间，但主要依赖axios层面的立即失败
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('连接超时，请检查网络连接');
      }
    }, 20000); // 增加到20秒，因为我们现在有立即失败机制

    return () => clearTimeout(timeoutId);
  }, [fetchUser, clearAuthAndRedirect, loading]);

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              正在验证身份
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              请稍候，正在加载用户信息...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              身份验证失败
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {error}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!error.includes('登录已过期') && (
              <Button
                variant="primary"
                size="md"
                onClick={handleRetry}
              >
                🔄 重新验证
              </Button>
            )}
            <Button
              variant="secondary"
              size="md"
              onClick={clearAuthAndRedirect}
            >
              返回登录
            </Button>
          </div>
          
          {error.includes('网络') && (
            <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
              💡 提示：请检查网络连接或稍后再试
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ResponsiveNavbar user={user} onUserUpdate={handleUserUpdate} />
      <main className="px-4 py-6 md:px-6">
        {children}
      </main>
    </div>
  );
};

export default ProtectedLayout;