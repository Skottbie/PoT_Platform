// src/components/ProtectedLayout.jsx - 优化版本
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import ResponsiveNavbar from './ResponsiveNavbar';
import Button from './Button';

const ProtectedLayout = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const navigate = useNavigate();

  // 检查token是否即将过期
  const checkTokenExpiry = useCallback(() => {
    const token = localStorage.getItem('token');
    const expiresAt = localStorage.getItem('tokenExpiresAt');
    
    if (!token) {
      return false;
    }
    
    if (expiresAt) {
      const now = Date.now();
      const expiry = parseInt(expiresAt);
      
      // 如果token在5分钟内过期，返回true
      return (expiry - now) < (5 * 60 * 1000);
    }
    
    return false;
  }, []);

  // 预防性刷新token
  const preemptiveRefresh = useCallback(async () => {
    try {
      console.log('🔄 预防性刷新token');
      const response = await api.post('/auth/refresh', {}, {
        _skipAuthRefresh: true
      });
      
      const { token } = response.data;
      localStorage.setItem('token', token);
      
      // 更新过期时间
      const expiresAt = Date.now() + (15 * 60 * 1000); // 15分钟
      localStorage.setItem('tokenExpiresAt', expiresAt.toString());
      
      console.log('✅ 预防性刷新成功');
    } catch (error) {
      console.error('❌ 预防性刷新失败:', error);
      // 不抛出错误，让正常的API调用处理
    }
  }, []);

  // 清理认证数据并跳转
  const clearAuthAndRedirect = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('tokenExpiresAt');
    navigate('/', { replace: true });
  }, [navigate]);

  const fetchUser = useCallback(async () => {
    try {
      setAuthError(null);
      setLoadingTimeout(false);
      
      // 检查token是否即将过期
      if (checkTokenExpiry()) {
        await preemptiveRefresh();
      }
      
      console.log('👤 获取用户信息...');
      const res = await api.get('/user/profile');
      setUser(res.data);
      console.log('✅ 用户信息获取成功:', res.data.email);
      
    } catch (err) {
      console.error('❌ 获取用户信息失败:', err);
      
      // 更详细的错误处理
      if (err.response?.status === 401) {
        console.log('🔒 认证失败，清理本地数据');
        setAuthError('登录已过期，需要重新登录');
        
        // 减少跳转延迟：500ms -> 立即跳转
        setTimeout(() => {
          clearAuthAndRedirect();
        }, 500);
      } else {
        setAuthError('网络连接失败，请检查网络后重试');
        // 网络错误不跳转，允许重试
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, checkTokenExpiry, preemptiveRefresh, clearAuthAndRedirect]);

  // 初始化和定期检查
  useEffect(() => {
    fetchUser();
    
    // 10秒超时机制
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('⏰ 加载超时');
        setLoadingTimeout(true);
        setLoading(false);
        setAuthError('连接超时，请检查网络连接');
      }
    }, 10000);
    
    // 设置定期检查token过期时间
    const checkInterval = setInterval(() => {
      if (checkTokenExpiry() && user) {
        preemptiveRefresh();
      }
    }, 5 * 60 * 1000); // 每5分钟检查一次
    
    return () => {
      clearTimeout(timeoutId);
      clearInterval(checkInterval);
    };
  }, [fetchUser, loading, checkTokenExpiry, preemptiveRefresh, user]);

  // 重试处理
  const handleRetry = useCallback(() => {
    setLoading(true);
    setAuthError(null);
    setLoadingTimeout(false);
    fetchUser();
  }, [fetchUser]);

  // 现代化加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto p-8">
          {/* 现代化 loading spinner */}
          <div className="relative mb-8">
            <div className="w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-blue-100 dark:border-blue-900/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-2 border-transparent border-t-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
          </div>
          
          {/* 渐进式提示文案 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              验证身份中
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {loadingTimeout ? '连接时间较长，请稍候...' : '正在安全验证您的登录信息'}
            </p>
          </div>
          
          {/* 取消按钮 - 使用统一的 Button 组件 */}
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

  // 现代化错误状态
  if (authError && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          {/* 错误图标 */}
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          {/* 错误信息 */}
          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              身份验证失败
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {authError}
            </p>
          </div>
          
          {/* 操作按钮 - 使用统一的 Button 组件 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              size="md"
              onClick={handleRetry}
              className="order-1 sm:order-1"
            >
              🔄 重新验证
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={clearAuthAndRedirect}
              className="order-2 sm:order-2"
            >
              返回登录
            </Button>
          </div>
          
          {/* 额外提示 */}
          {authError.includes('网络') && (
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