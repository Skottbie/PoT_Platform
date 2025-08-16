// src/components/ProtectedLayout.jsx - 修复版本
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import ResponsiveNavbar from './ResponsiveNavbar';

const ProtectedLayout = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  // 🔧 新增：检查token是否即将过期
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

  // 🔧 新增：预防性刷新token
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

  const fetchUser = useCallback(async () => {
    try {
      setAuthError(null);
      
      // 🔧 检查token是否即将过期
      if (checkTokenExpiry()) {
        await preemptiveRefresh();
      }
      
      console.log('👤 获取用户信息...');
      const res = await api.get('/user/profile');
      setUser(res.data);
      console.log('✅ 用户信息获取成功:', res.data.email);
      
    } catch (err) {
      console.error('❌ 获取用户信息失败:', err);
      
      // 🔧 更详细的错误处理
      if (err.response?.status === 401) {
        console.log('🔒 认证失败，清理本地数据');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('tokenExpiresAt');
        setAuthError('认证已过期，请重新登录');
        
        // 延迟跳转，给用户看到错误信息
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1000);
      } else {
        setAuthError('网络连接失败，请检查网络连接');
        // 网络错误不跳转，允许重试
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, checkTokenExpiry, preemptiveRefresh]);

  useEffect(() => {
    fetchUser();
    
    // 🔧 设置定期检查token过期时间
    const checkInterval = setInterval(() => {
      if (checkTokenExpiry() && user) {
        preemptiveRefresh();
      }
    }, 5 * 60 * 1000); // 每5分钟检查一次
    
    return () => clearInterval(checkInterval);
  }, [fetchUser, checkTokenExpiry, preemptiveRefresh, user]);

  // 🔧 添加重试按钮
  const handleRetry = useCallback(() => {
    setLoading(true);
    setAuthError(null);
    fetchUser();
  }, [fetchUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">验证身份中...</p>
          {/* 🔧 添加取消按钮防止无限加载 */}
          <button 
            onClick={() => navigate('/')}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            返回登录页
          </button>
        </div>
      </div>
    );
  }

  // 🔧 显示错误信息并提供重试选项
  if (authError && !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            身份验证失败
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {authError}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重试
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              返回登录
            </button>
          </div>
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