// src/components/ProtectedLayout.jsx - 简化优化版本
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import ResponsiveNavbar from './ResponsiveNavbar';
import Button from './Button';

const ProtectedLayout = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // 清理认证数据并跳转
  const clearAuthAndRedirect = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('tokenExpiresAt');
    navigate('/', { replace: true });
  }, [navigate]);

  // 获取用户信息
  const fetchUser = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/user/profile');
      setUser(res.data);
    } catch (err) {
      console.error('获取用户信息失败:', err);
      
      if (err.response?.status === 401) {
        // 认证失败，清理数据并跳转
        setError('登录已过期，正在跳转到登录页...');
        setTimeout(clearAuthAndRedirect, 1000);
      } else {
        // 网络错误，允许重试
        setError('网络连接失败，请检查网络后重试');
      }
    } finally {
      setLoading(false);
    }
  }, [clearAuthAndRedirect]);

  // 重试处理
  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchUser();
  }, [fetchUser]);

  // 初始化
  useEffect(() => {
    // 检查是否有token
    const token = localStorage.getItem('token');
    if (!token) {
      clearAuthAndRedirect();
      return;
    }

    fetchUser();

    // 设置15秒超时
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('连接超时，请检查网络连接');
      }
    }, 15000);

    return () => clearTimeout(timeoutId);
  }, [fetchUser, clearAuthAndRedirect, loading]);

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto p-8">
          {/* 加载动画 */}
          <div className="relative mb-8">
            <div className="w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-blue-100 dark:border-blue-900/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-2 border-transparent border-t-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              验证身份中
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              正在安全验证您的登录信息
            </p>
          </div>
          
          <div className="mt-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAuthAndRedirect}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              返回登录页
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          {/* 错误图标 */}
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-full flex items-center justify-center mx-auto mb-6">
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
          
          {/* 操作按钮 */}
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
          
          {/* 网络错误提示 */}
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
      <ResponsiveNavbar user={user} />
      <main className="px-4 py-6 md:px-6">
        {children}
      </main>
    </div>
  );
};

export default ProtectedLayout;