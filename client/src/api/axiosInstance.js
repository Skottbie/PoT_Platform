// client/src/api/axiosInstance.js - 修复版本
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

// 刷新token - 🔧 修复：使用instance而不是裸露的axios
const refreshToken = async () => {
  try {
    console.log('🔄 尝试刷新token...');
    
    // 🔧 关键修复：使用instance确保正确的baseURL
    const response = await instance.post('/auth/refresh', {}, {
      withCredentials: true,
      timeout: 10000, // 10秒超时
      // 防止无限递归：这个请求不应该触发拦截器
      _skipAuthRefresh: true
    });
    
    const { token } = response.data;
    localStorage.setItem('token', token);
    
    console.log('✅ Token刷新成功');
    return token;
  } catch (error) {
    console.error('❌ Refresh token失败:', error);
    
    // 清理所有认证相关数据
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('tokenExpiresAt');
    
    // 只有在非登录页面时才跳转
    if (!window.location.pathname.includes('/login') && 
        !window.location.pathname === '/') {
      console.log('🔄 跳转到登录页');
      window.location.href = '/';
    }
    
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
        !config._skipAuthRefresh) {
      
      console.log('🔒 检测到401错误，尝试刷新token');
      
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          const newToken = await refreshToken();
          onRefreshed(newToken);
          
          // 重试原始请求
          config.headers.Authorization = `Bearer ${newToken}`;
          return instance(config);
        } catch (refreshError) {
          // refresh失败，清空等待队列
          refreshSubscribers.forEach(callback => callback(null));
          refreshSubscribers = [];
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
      
      // 如果正在刷新token，将请求添加到队列
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            resolve(instance(config));
          } else {
            reject(error);
          }
        });
      });
    }
    
    return Promise.reject(error);
  }
);

export default instance;