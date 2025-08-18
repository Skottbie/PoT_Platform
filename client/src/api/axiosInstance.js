// client/src/api/axiosInstance.js - 简化优化版本
import axios from 'axios';

// 创建axios实例
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.potacademy.net/api/',
  withCredentials: true,
  timeout: 5000, // 5秒超时
});

// 简化的token管理
let isRefreshing = false;
let failedQueue = [];

// 处理队列中的请求
const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// 清理认证数据并跳转
const clearAuthAndRedirect = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('tokenExpiresAt');
  
  if (!window.location.pathname.includes('/login') && 
      !window.location.pathname === '/') {
    window.location.href = '/';
  }
};

// 简化的token刷新
const refreshAccessToken = async () => {
  try {
    const response = await axios.post('/auth/refresh', {}, {
      baseURL: instance.defaults.baseURL,
      withCredentials: true,
      timeout: 10000,
    });
    
    const { token, expiresIn = 7200 } = response.data; // 默认2小时
    
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiresAt', (Date.now() + expiresIn * 1000).toString());
    
    return token;
  } catch (error) {
    console.error('Token刷新失败:', error);
    clearAuthAndRedirect();
    throw error;
  }
};

// 检查token是否即将过期（提前5分钟刷新）
const shouldRefreshToken = () => {
  const expiresAt = localStorage.getItem('tokenExpiresAt');
  if (!expiresAt) return false;
  
  const now = Date.now();
  const expireTime = parseInt(expiresAt);
  const fiveMinutes = 5 * 60 * 1000;
  
  return (expireTime - now) < fiveMinutes;
};

// 请求拦截器
instance.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // 主动刷新即将过期的token
      if (shouldRefreshToken() && !isRefreshing) {
        try {
          isRefreshing = true;
          const newToken = await refreshAccessToken();
          config.headers.Authorization = `Bearer ${newToken}`;
        } catch (error) {
          // 刷新失败，继续使用原token
        } finally {
          isRefreshing = false;
        }
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 处理401错误且不是刷新请求
    if (error.response?.status === 401 && 
        !originalRequest.url.includes('/auth/refresh') &&
        !originalRequest.url.includes('/auth/login') &&
        !originalRequest._retry) {
      
      if (isRefreshing) {
        // 正在刷新token，将请求加入队列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return instance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default instance;