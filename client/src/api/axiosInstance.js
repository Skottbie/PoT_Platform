// client/src/api/axiosInstance.js - 优化版本
import axios from 'axios';

// 创建axios实例
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.potacademy.net/api/',
  withCredentials: true,
});

// Token管理
let isRefreshing = false;
let refreshSubscribers = [];

// 添加到刷新等待队列
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// 通知所有等待的请求
const onRefreshed = (token) => {
  refreshSubscribers.map(callback => callback(token));
  refreshSubscribers = [];
};

// 清理认证数据并跳转 - 统一处理函数
const clearAuthAndRedirect = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('tokenExpiresAt');
  
  // 只有在非登录页面时才跳转，减少延迟
  if (!window.location.pathname.includes('/login') && 
      !window.location.pathname === '/') {
    console.log('🔄 自动跳转到登录页');
    // 移除延迟，立即跳转
    window.location.href = '/';
  }
};

// 刷新token - 优化版本
const refreshToken = async () => {
  try {
    console.log('🔄 尝试刷新token...');
    
    const response = await instance.post('/auth/refresh', {}, {
      withCredentials: true,
      timeout: 10000, // 10秒超时
      _skipAuthRefresh: true
    });
    
    const { token } = response.data;
    localStorage.setItem('token', token);
    
    // 更新过期时间
    const expiresAt = Date.now() + (15 * 60 * 1000); // 15分钟
    localStorage.setItem('tokenExpiresAt', expiresAt.toString());
    
    console.log('✅ Token刷新成功');
    return token;
  } catch (error) {
    console.error('❌ Refresh token失败:', error);
    
    // 统一使用清理函数
    clearAuthAndRedirect();
    throw error;
  }
};

// 请求拦截器 - 自动携带token
instance.interceptors.request.use((config) => {
  // 跳过refresh请求的token检查
  if (config._skipAuthRefresh) {
    delete config._skipAuthRefresh;
    return config;
  }
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 响应拦截器 - 处理token过期
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    
    // 如果是401错误且不是登录/刷新请求
    if (response?.status === 401 && 
        !config.url.includes('/auth/login') && 
        !config.url.includes('/auth/refresh') &&
        !config._retry) {
      
      console.log('🔒 检测到401错误，尝试刷新token');
      
      if (isRefreshing) {
        // 如果正在刷新，加入等待队列
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
              resolve(instance(config));
            } else {
              clearAuthAndRedirect();
              resolve(Promise.reject(error));
            }
          });
        });
      }

      config._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshToken();
        onRefreshed(newToken);
        
        // 重新发送原请求
        config.headers.Authorization = `Bearer ${newToken}`;
        return instance(config);
      } catch (refreshError) {
        console.error('❌ Token刷新失败，清理认证状态');
        onRefreshed(null);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
        refreshSubscribers = [];
      }
    }

    // 其他错误直接返回
    return Promise.reject(error);
  }
);

export default instance;